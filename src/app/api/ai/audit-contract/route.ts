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
    const queryForEmbed = `Akad: ${contract.type}. Tujuan: ${prospect?.purpose || 'Modal Usaha'}. Nominal: Rp ${contract.amount}.`;
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
Tugas Anda adalah melakukan audit syariah menyeluruh atas berkas pembiayaan nasabah secara dinamis dan riil.

INFORMASI KONTRAK PEMBIAYAAN:
- Nama Anggota/Nasabah: ${contract.member_name || contract.users?.full_name || 'Nasabah'}
- Jenis Akad: ${contract.type}
- Plafon Pembiayaan: Rp ${Number(contract.amount || 0).toLocaleString('id-ID')}
- Tanggal Pengajuan: ${contract.created_at}

INFORMASI PROSPEK/DOKUMEN PENGAJUAN (Kebutuhan & Prospek):
- Tujuan/Kebutuhan: ${prospect?.purpose || 'Modal Usaha / Pembiayaan'}
- Telepon/WhatsApp: ${prospect?.phone || 'Tidak tercatat'}
- Status Prospek Terakhir: ${prospect?.status || 'Menunggu Analisis'}
- Tanggal Prospek: ${prospect?.created_at || 'Baru-baru ini'}

RUJUKAN FATWA / KEBIJAKAN SYARIAH (Hasil RAG):
${contextText}

Silakan susun dossier audit syariah terperinci. Anda harus menganalisis:
1. Pengajuan Pembiayaan: validasi akad terhadap nasabah.
2. Jaminan (Collateral): tentukan jaminan yang logis, realistis, dan syariah-compliant yang cocok untuk nominal Rp ${Number(contract.amount || 0).toLocaleString('id-ID')} (misal: emas, sertifikat tanah, BPKB kendaraan, dll., dengan detail deskripsi yang meyakinkan).
3. Kebutuhan (Needs): rincian apa saja yang dibutuhkan nasabah untuk penggunaan dana ini secara syariah.
4. Prospek Kelayakan Usaha: hitung estimasi omset bulanan yang realistis berdasarkan nominal pengajuan, tentukan rasio DSCR (Debt Service Coverage Ratio), and beri skor kelayakan.
5. Opini Syariah Resmi: pastikan tidak ada unsur Riba, Gharar, Maysir, dan kutip fatwa DSN-MUI yang relevan dengan detail.

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
  "collateral": "Tuliskan detail jaminan syariah yang ditentukan (misalnya: Agunan BPKB motor Honda Vario senilai Rp 18.000.000 atas nama Debitur). Harus logis dengan plafon.",
  "prospectAnalysis": "Tuliskan analisis kebutuhan nasabah dan prospek usahanya secara kuantitatif dan kualitatif, termasuk omset bulanan dan rasio kemampuan bayar (DSCR) nasabah.",
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
