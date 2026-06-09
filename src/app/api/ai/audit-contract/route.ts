import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AIService } from '@/services/ai.service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { contractId } = body;

    if (!contractId) {
      return NextResponse.json({ error: 'Contract ID is required' }, { status: 400 });
    }

    // Initialize Supabase with service role to bypass RLS for full audit info
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch contract
    const { data: contract, error: contractErr } = await supabase
      .from('financing_contracts')
      .select('*, users(full_name, email)')
      .eq('id', contractId)
      .single();

    if (contractErr || !contract) {
      return NextResponse.json({ error: `Contract not found: ${contractErr?.message || ''}` }, { status: 404 });
    }

    // 2. Fetch associated prospect
    let prospect: any = null;
    if (contract.prospect_id) {
      const { data: pData } = await supabase
        .from('prospects')
        .select('*')
        .eq('id', contract.prospect_id)
        .single();
      prospect = pData;
    }

    // If prospect is not linked, fallback to searching by member name
    if (!prospect && contract.member_name) {
      const { data: pList } = await supabase
        .from('prospects')
        .select('*')
        .eq('name', contract.member_name)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (pList && pList.length > 0) {
        prospect = pList[0];
      }
    }

    // 3. Perform RAG query
    const parseMetadata = (meta: any) => {
      if (!meta) return {};
      if (typeof meta === 'object') return meta;
      try {
        return JSON.parse(meta);
      } catch (e) {
        return {};
      }
    };

    const metadata = parseMetadata(contract.collateral_metadata);
    const prospectMetadata = parseMetadata(prospect?.collateral_metadata);

    const realPurpose = metadata.purpose || prospectMetadata.purpose || prospect?.purpose || 'Pembiayaan Syariah';
    const realJob = metadata.job_detail || prospectMetadata.job_detail || 'Tidak diisi';
    const realAkadObject = metadata.akad_object || prospectMetadata.akad_object || 'Tidak diisi';
    const realCollaterals = metadata.collaterals || prospectMetadata.collaterals || 'Tidak ada jaminan';
    const realIncome = metadata.income || prospectMetadata.income || 'Tidak diisi';
    const realNotes = metadata.notes || prospectMetadata.notes || 'Tidak ada catatan tambahan';
    const realAddress = metadata.address || prospectMetadata.address || 'Tidak diisi';

    const queryForEmbed = `Akad: ${contract.type}. Tujuan: ${realPurpose}. Nominal: Rp ${contract.amount}.`;
    let contextDocs: any[] = [];
    try {
      const vector1536 = await AIService.getGeminiEmbedding(queryForEmbed);
      const { data, error } = await supabase.rpc('match_knowledge', {
        query_embedding: vector1536,
        match_threshold: 0.5,
        match_count: 4
      });
      if (!error && data) {
        contextDocs = data;
      }
    } catch (e) {
      console.warn("Vector search failed for audit:", e);
    }

    // Basic text fallback if vector search empty
    if (contextDocs.length === 0) {
      try {
        const { data: textData } = await supabase
          .from('sharia_knowledge')
          .select('*')
          .or(`content.ilike.%${contract.type}%,source_title.ilike.%${contract.type}%`)
          .limit(3);
        if (textData) contextDocs = textData;
      } catch (e) {
        console.warn("Text fallback failed for audit:", e);
      }
    }

    const contextText = contextDocs.length > 0
      ? contextDocs.map((doc, idx) => `[Sumber ${idx + 1}: ${doc.source_title || 'Fatwa/Regulasi'}]\n${doc.content}`).join('\n\n')
      : "Tidak ada dokumen fatwa pendukung spesifik di database.";

    // 4. Construct prompt for gemini-3.5-flash
    const prompt = `Anda adalah Dewan Pengawas Syariah (DPS) AI untuk KSPPS IQ-RA, sebuah platform keuangan syariah mikro berkelas dunia.
Tugas Anda adalah melakukan audit syariah menyeluruh atas berkas pembiayaan nasabah berdasarkan DATA AKTUAL yang dikirimkan. DILARANG KERAS MENGARANG/HALUSINASI JAMINAN ATAU TUJUAN YANG TIDAK ADA DALAM DATA!

INFORMASI KONTRAK PEMBIAYAAN (DATA AKTUAL NASABAH):
- Nama Anggota/Nasabah: ${contract.member_name || contract.users?.full_name || 'Nasabah'}
- Jenis Akad: ${contract.type}
- Plafon Pembiayaan: Rp ${Number(contract.amount || 0).toLocaleString('id-ID')}
- Tanggal Pengajuan: ${contract.created_at}

DATA FORMULIR PENGAJUAN & SURVEI LAPANGAN AKTUAL:
- Tujuan / Kebutuhan Sebenarnya: ${realPurpose}
- Detail Pekerjaan / Bidang Usaha: ${realJob}
- Objek Akad / Aset yang Dibiayai: ${realAkadObject}
- Agunan / Jaminan Diajukan Debitur: ${realCollaterals}
- Estimasi Pendapatan Bulanan: ${realIncome}
- Alamat Hasil Survei Domisili: ${realAddress}
- Catatan Kelayakan Lapangan AO: ${realNotes}

RUJUKAN FATWA / KEBIJAKAN SYARIAH (Hasil RAG):
${contextText}

Silakan susun dossier audit syariah terperinci berdasarkan DATA AKTUAL di atas. Anda harus menganalisis:
1. Pengajuan Pembiayaan: validasi kesesuaian akad ${contract.type} dengan Tujuan/Kebutuhan Sebenarnya (${realPurpose}) dan Objek Akad (${realAkadObject}).
2. Jaminan (Collateral): Analisis kesesuaian Agunan / Jaminan Diajukan Debitur (${realCollaterals}) serta Catatan AO (${realNotes}). JIKA TIDAK ADA JAMINAN (misalnya Qardhul Hasan tanpa agunan), SEBUTKAN JELAS BAHWA TIDAK ADA AGUNAN/JAMINAN. DILARANG KERAS MENGARANG AGUNAN EMAS/BPKB JIKA TIDAK DITULIS DI DATA DI ATAS!
3. Kebutuhan (Needs): evaluasi kebutuhan nasabah sesuai "Tujuan/Kebutuhan Sebenarnya" (${realPurpose}) dan "Objek Akad" (${realAkadObject}).
4. Prospek Kelayakan: evaluasi berdasarkan Pendapatan Bulanan aktual (${realIncome}) dan catatan survei (${realNotes}) serta Pekerjaan (${realJob}). Hitung rasio kemampuan bayar (DSCR = Pendapatan / Angsuran Bulanan) secara kasar jika ada datanya. Jika pendapatan kosong, sebutkan bahwa data belum lengkap. Dilarang mengarang omset fiktif. Jika akad Qardhul Hasan (kebajikan), jangan hitung margin/nisbah, hanya pengembalian pokok!
5. Opini Syariah Resmi: pastikan akad sesuai dengan sifatnya (misal: Qardhul hasan dilarang ada persenan imbal hasil/margin/nisbah). Kutip fatwa DSN-MUI yang relevan dari dokumen RAG.

Kembalikan jawaban Anda dalam format JSON persis seperti berikut (tanpa tambahan markdown, tanpa petik tiga \`\`\`json, murni kode JSON):
{
  "complianceScore": 100,
  "opinion": "Tulis opini syariah resmi Anda di sini secara sangat detail, profesional, dan meyakinkan, merujuk langsung ke fatwa-fatwa DSN-MUI terkait.",
  "checklist": {
    "objekAset": true,
    "hargaTerbuka": true,
    "serahTerimaAwal": true,
    "bebasRiba": true
  },
  "collateral": "Deskripsikan detail agunan/jaminan fisik aktual berdasarkan data yang diajukan nasabah (${realCollaterals}) dan catatan AO (${realNotes}). Jika tidak ada jaminan, tulis 'Tanpa Jaminan Fisik (Hanya Jaminan Personal / Karakter)'. DILARANG KERAS menggunakan contoh Honda Vario jika tidak tertera di data input!",
  "prospectAnalysis": "Tuliskan analisis kebutuhan nasabah dan prospek usahanya secara kuantitatif dan kualitatif berdasarkan data riil: pekerjaan (${realJob}), objek akad (${realAkadObject}), pendapatan bulanan (${realIncome}), serta catatan kelayakan AO (${realNotes}).",
  "fatwaReferences": "Sebutkan nama dan nomor fatwa DSN-MUI yang menjadi rujukan utama akad ini."
}
`;

    // 5. Query LLM
    const responseStr = await AIService.queryGeminiLLM(prompt);

    // 6. Parse and clean
    let auditResult;
    try {
      const cleanedStr = responseStr.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      auditResult = JSON.parse(cleanedStr);
    } catch (parseError) {
      console.error("Failed to parse LLM audit response:", responseStr);
      throw new Error("Format respons audit syariah LLM tidak valid.");
    }

    return NextResponse.json({
      success: true,
      auditResult
    });

  } catch (error: any) {
    console.error("API Contract Audit Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to perform dynamic audit' 
    }, { status: 500 });
  }
}
