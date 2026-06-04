import { createClient } from '@/lib/supabase/client';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { HarmCategory, HarmBlockThreshold } from "@google/generative-ai";


/**
 * iQ-RA RAG Engine Service
 * Handles sharia compliance analysis and contract recommendations.
 * Centralized on Google Gemini API for 100% Free Tier usage.
 */
export class AIService {
  
  /**
   * Helper to retrieve Gemini Vector Embeddings (gemini-embedding-001)
   * Automatically pads the 768-dimension vector to 1536 to match Supabase pgvector column schema.
   */
  static async getGeminiEmbedding(text: string): Promise<number[]> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in environment variables. Please check your .env.local file.");
    }

    const candidates = [
      { url: `https://generativelanguage.googleapis.com/v1/models/gemini-embedding-001:embedContent?key=${apiKey}`, model: "models/gemini-embedding-001" },
      { url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`, model: "models/gemini-embedding-001" }
    ];

    let lastError = "";
    for (const candidate of candidates) {
      let retries = 3;
      while (retries > 0) {
        try {
          const response = await fetch(candidate.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: candidate.model,
              content: { parts: [{ text }] }
            })
          });

          if (response.ok) {
            const data = await response.json();
            const vector = data.embedding?.values;
            if (vector && Array.isArray(vector)) {
              // Robust padding or slicing to exactly 1536 dimensions
              if (vector.length >= 1536) {
                return vector.slice(0, 1536);
              }
              return [...vector, ...Array(1536 - vector.length).fill(0)];
            }
          }

          if (response.status === 429) {
            console.warn(`Rate limit (429) hit for ${candidate.model}. Waiting 3 seconds before retry...`);
            lastError = `${candidate.model} (429 Too Many Requests): Exceeded rate limit / token-per-minute quota.`;
            await new Promise(resolve => setTimeout(resolve, 3000));
            retries--;
            continue;
          }
          
          const errText = await response.text();
          lastError = `${candidate.model} (${response.status}): ${errText}`;
          console.warn(`Embedding candidate ${candidate.model} failed:`, errText);
          break; // Go to next candidate if not a 429 rate limit
        } catch (err: any) {
          lastError = `${candidate.model}: ${err.message || err}`;
          console.warn(`Failed fetching embedding from ${candidate.model}:`, err);
          break; // Go to next candidate
        }
      }
    }

    throw new Error(`Google Gemini Embedding API gagal: ${lastError}`);
  }

  /**
   * Free Gemini model cascade — verified from live ListModels API response.
   * Tries each model in order from newest/most capable to fastest fallback.
   */
  static readonly GEMINI_MODELS = [
    'gemini-3.5-flash',        // AI Terbaik & Terkini (2026), 100% Free
    'gemini-3-flash',          // Cepat, cerdas, & efisien
    'gemini-2.5-flash',        // Versi stabil generasi sebelumnya
    'gemini-1.5-flash',        // Fallback klasik yang sangat andal
  ];

  /**
   * Helper to call Gemini with automatic model cascade fallback.
   * Tries each free model in order until one succeeds.
   */
  static async callGeminiWithCascade(
    prompt: string,
    apiKey: string,
    generationConfig: Record<string, any> = { temperature: 0.7 }
  ): Promise<string> {
    let lastError = '';

    for (const model of this.GEMINI_MODELS) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig
            })
          }
        );

        if (response.status === 429) {
          console.warn(`[Cascade] ${model} rate-limited (429). Trying next model...`);
          lastError = `${model}: Rate limit exceeded`;
          continue;
        }

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const msg = errData.error?.message || response.statusText;
          console.warn(`[Cascade] ${model} failed: ${msg}. Trying next model...`);
          lastError = `${model}: ${msg}`;
          continue;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          console.warn(`[Cascade] ${model} returned empty response. Trying next model...`);
          lastError = `${model}: Empty response`;
          continue;
        }

        console.log(`[Cascade] Successfully used model: ${model}`);
        return text;

      } catch (err: any) {
        console.warn(`[Cascade] ${model} threw error: ${err.message}. Trying next model...`);
        lastError = `${model}: ${err.message}`;
        continue;
      }
    }

    throw new Error(`Semua model Gemini gagal. Error terakhir: ${lastError}`);
  }

  /**
   * Helper to query Gemini LLM with structured JSON output using LangChain cascade.
   */
  static async queryGeminiLLM(prompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables. Please check your .env.local file.');
    }

    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ];

    const models = this.GEMINI_MODELS.map(model => 
      new ChatGoogleGenerativeAI({
        apiKey,
        model: model,
        temperature: 0.1,
        json: true,
        safetySettings,
      })
    );

    const runnableModel = models[0].withFallbacks(models.slice(1));
    const response = await runnableModel.invoke(prompt);
    
    let responseText = "";
    if (typeof response.content === 'string') {
      responseText = response.content;
    } else if (Array.isArray(response.content)) {
      responseText = response.content
        .map((part: any) => {
          if (typeof part === 'string') return part;
          if (part && typeof part === 'object' && 'text' in part) return (part as any).text;
          return JSON.stringify(part);
        })
        .join('');
    } else {
      responseText = JSON.stringify(response.content);
    }
    
    return responseText;
  }

  /**
   * Analyzes a financing prospect using RAG
   * @param prospectData Data from the AO input
   */
  static async analyzeProspect(prospectData: { purpose: string, amount: number, description?: string }, customSupabase?: any) {
    const supabase = customSupabase || createClient();
    const query = `Tujuan pengajuan: ${prospectData.purpose}. Nominal: Rp ${prospectData.amount}. Keterangan: ${prospectData.description || 'Tidak ada spesifik'}`;

    try {
      // 1. Get embedding from Gemini
      const vector1536 = await this.getGeminiEmbedding(query);

      // 2. Retrieve relevant context from vector store using RPC function
      let contextDocs: any[] = [];
      try {
        const { data, error } = await supabase.rpc('match_knowledge', {
          query_embedding: vector1536,
          match_threshold: 0.55,
          match_count: 3
        });
        if (!error && data) {
          contextDocs = data;
        } else {
          if (error) console.warn("match_knowledge RPC failed, falling back to basic text search.", error);
          
          // Fallback to basic text search if RPC is missing/fails
          const { data: textData } = await supabase
            .from('sharia_knowledge')
            .select('*')
            .or(`content.ilike.%${prospectData.purpose}%,source_title.ilike.%${prospectData.purpose}%`)
            .limit(3);
          if (textData) {
            contextDocs = textData;
          }
        }
      } catch (dbErr) {
        console.warn("Vector search failed. Proceeding without context docs.", dbErr);
      }

      // 3. Construct LLM prompt
      const contextText = contextDocs.length > 0
        ? contextDocs.map((doc, idx) => `[Sumber ${idx + 1}: ${doc.source_title || doc.title || 'Fatwa/Regulasi'}]\n${doc.content}`).join('\n\n')
        : "Tidak ada dokumen pendukung spesifik di basis data.";

      const prompt = `Anda adalah Asisten Pakar Syariah AI untuk KSPPS IQ-RA.
Tugas Anda adalah menganalisis apakah pengajuan pembiayaan berikut ini memenuhi rukun syariah dan memberikan rekomendasi skema akad yang paling sesuai.

DATA PENGAJUAN:
${query}

REFERENSI FATWA / KEBIJAKAN (Hasil RAG):
${contextText}

Berikan analisis Anda dalam format JSON persis seperti berikut (tanpa tambahan teks markdown lainnya, murni JSON):
{
  "primary_contract": "Nama Akad (Misal: Murabahah, Mudharabah, Ijarah)",
  "match_score": 95, 
  "justification": "Alasan syariah mengapa akad ini dipilih berdasarkan tujuan pengajuan dan referensi fatwa.",
  "notes": "Peringatan mitigasi risiko atau syarat sah akad yang harus dipastikan oleh Account Officer."
}
`;

      // 4. Execute Gemini Generate Content
      const responseStr = await this.queryGeminiLLM(prompt);

      // 5. Parse JSON output safely
      let recommendation;
      try {
        const cleanedStr = responseStr.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
        recommendation = JSON.parse(cleanedStr);
      } catch (parseError) {
        console.error("Failed to parse LLM response:", responseStr);
        throw new Error("Format respons LLM tidak valid (bukan JSON).");
      }

      return {
        success: true,
        recommendation,
        context_used: contextDocs.map(doc => ({
          content: doc.content,
          source_title: doc.source_title || doc.metadata?.source_title || 'Unknown'
        }))
      };

    } catch (error: any) {
      console.error("AI Analysis Error:", error);
      
      // Smart offline fallback if Gemini key is wrong/empty or network is down
      let recommendation = {
        primary_contract: "Murabahah",
        match_score: 85,
        justification: "Berdasarkan pengajuan aset fisik, skema Jual Beli (Murabahah) adalah yang paling umum digunakan (Fallback mode).",
        notes: "Pastikan objek barang tersedia dan spesifikasinya jelas. (Mode fallback karena AI Engine belum diaktifkan)"
      };

      const purposeLC = prospectData.purpose.toLowerCase();

      if (purposeLC.includes('usaha') || purposeLC.includes('investasi') || purposeLC.includes('modal')) {
        recommendation = {
          primary_contract: "Mudharabah / Musyarakah",
          match_score: 92,
          justification: "Untuk tujuan modal kerja/usaha, skema kerja sama bagi hasil (Syirkah) sangat dianjurkan secara syariah.",
          notes: "Diperlukan analisis kelayakan omset dan proyeksi pendapatan usaha anggota secara detail."
        };
      } else if (purposeLC.includes('pendidikan') || purposeLC.includes('jasa')) {
        recommendation = {
          primary_contract: "Ijarah",
          match_score: 95,
          justification: "Karena tujuannya adalah pembiayaan manfaat/jasa (Pendidikan), akad yang sah secara fikih adalah sewa-menyewa jasa (Ijarah) atau Qardh.",
          notes: "Pastikan terdapat invoice/tagihan resmi dari pihak sekolah/universitas yang bersangkutan."
        };
      } else if (purposeLC.includes('renovasi') || purposeLC.includes('bangunan')) {
        recommendation = {
          primary_contract: "Istishna / Ijarah",
          match_score: 88,
          justification: "Untuk kebutuhan perbaikan/renovasi, skema pesan bangun (Istishna) atau sewa jasa pemborong (Ijarah Multijasa) adalah yang paling tepat.",
          notes: "Pastikan RAB (Rencana Anggaran Biaya) dari tukang/kontraktor dilampirkan dengan jelas."
        };
      }

      return {
        success: false,
        error: error.message,
        recommendation,
        context_used: []
      };
    }
  }

  /**
   * Splits a long text into smaller chunks with overlap to maintain context.
   */
  static chunkText(text: string, maxLength: number = 4000, overlap: number = 400): string[] {
    if (text.length <= maxLength) return [text];

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = start + maxLength;
      
      if (end < text.length) {
        const searchRange = Math.floor(maxLength * 0.2);
        for (let i = 0; i < searchRange; i++) {
          const char = text[end - i];
          if (char === '\n' || char === ' ' || char === '\t') {
            end = end - i + 1;
            break;
          }
        }
      } else {
        end = text.length;
      }

      const chunk = text.substring(start, end).trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }

      start = end - overlap;
      if (start >= text.length || end >= text.length) {
        break;
      }
      if (start <= 0 || start >= end) {
        start = end;
      }
    }

    return chunks;
  }

  /**
   * Ingests a new document into the knowledge base, splits it, and vectorizes each chunk.
   */
  static async ingestKnowledge(content: string, metadata: { title: string, category: string }, customSupabase?: any) {
    const supabase = customSupabase || createClient();
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      
      const chunks = this.chunkText(content, 4000, 400);

      if (!apiKey) {
        const insertPromises = chunks.map((chunk, idx) => {
          return supabase.from('sharia_knowledge').insert({
            source_title: metadata.title,
            content: chunk,
            category: metadata.category,
            metadata: { 
              ...metadata, 
              chunk_index: idx, 
              total_chunks: chunks.length, 
              ingested_at: new Date().toISOString() 
            }
          });
        });
        
        const results = await Promise.all(insertPromises);
        const firstErr = results.find(r => r.error);
        if (firstErr) throw firstErr.error;

        return { 
          success: true, 
          vectorized: false, 
          message: `Dokumen berhasil disimpan dalam ${chunks.length} potongan tanpa vektorisasi (GEMINI_API_KEY kosong).` 
        };
      }

      // Loop through chunks sequentially to respect free tier rate limit (15 RPM)
      for (let idx = 0; idx < chunks.length; idx++) {
        const chunk = chunks[idx];
        const embedding = await this.getGeminiEmbedding(chunk);

        const { error } = await supabase.from('sharia_knowledge').insert({
          source_title: metadata.title,
          content: chunk,
          category: metadata.category,
          embedding: embedding,
          metadata: { 
            ...metadata, 
            chunk_index: idx, 
            total_chunks: chunks.length, 
            ingested_at: new Date().toISOString() 
          }
        });

        if (error) throw error;
      }

      return { 
        success: true, 
        vectorized: true, 
        message: `Dokumen berhasil disimpan dan di-vektorisasi ke basis pengetahuan AI RAG dalam ${chunks.length} potongan menggunakan Gemini.` 
      };
    } catch (e: any) {
      console.error("Ingestion failed:", e);
      throw new Error(e.message || "Gagal memproses ingesti dokumen.");
    }
  }

  /**
   * Converses with Sharia RAG using Gemini as the primary AI brain.
   * Leverages LangChain.js ChatGoogleGenerativeAI with custom prompt templates and fallback cascade.
   */
  static async chatWithShariaRAG(
    message: string,
    role: string,
    history: { sender: 'user' | 'bot', text: string }[],
    customSupabase?: any
  ): Promise<{ text: string, sources: any[] }> {
    const supabase = customSupabase || createClient();
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      // Offline fallback if no API key is provided
      let fallbackText = "Asisten AI belum aktif (GEMINI_API_KEY kosong). ";
      
      if (role === 'account_officer' && message.includes('DSCR')) {
        // Fallback specifically for the AO Field Verification
        const incomeMatch = message.match(/Estimasi Omset Bulanan \(Kotor\):\s*Rp\s*([\d,.]+)/);
        const plafonMatch = message.match(/Plafon Pengajuan:\s*Rp\s*([\d,.]+)/);
        
        const income = incomeMatch ? parseInt(incomeMatch[1].replace(/\D/g, '')) : 0;
        const plafon = plafonMatch ? parseInt(plafonMatch[1].replace(/\D/g, '')) : 0;
        const installment = plafon / 12;
        const dscr = income > 0 && installment > 0 ? (income / installment).toFixed(1) : 0;
        
        if (Number(dscr) >= 2) {
          fallbackText = `[MODE OFFLINE/TANPA API KEY]\n\nHasil Analisis: LAYAK\nDSCR: ${dscr}x (Kemampuan bayar sangat baik).\n\nRekomendasi:\nBerkas dapat dilanjutkan ke tahap persetujuan Manajer karena profil risiko gagal bayar rendah.`;
        } else {
          fallbackText = `[MODE OFFLINE/TANPA API KEY]\n\nHasil Analisis: RISIKO TINGGI\nDSCR: ${dscr}x (Arus kas terlalu mepet untuk angsuran bulanan).\n\nRekomendasi:\nTolak pengajuan atau turunkan nominal plafon pinjaman untuk menyesuaikan kemampuan finansial nasabah.`;
        }
      } else {
        fallbackText += "Namun Anda tetap dapat menyimpan prospek ini, hanya saja tidak ada analisis kelayakan otomatis dari mesin AI.";
      }

      return {
        text: fallbackText,
        sources: []
      };
    }

    // Fetch dynamic parameters from database if available
    let maxOutputTokens = 4096;
    let unifiedThreshold = 120000;
    try {
      const { data: dbParams } = await supabase
        .from('system_parameters')
        .select('key, value');
      if (dbParams) {
        const tokenParam = dbParams.find((p: any) => p.key === 'max_output_tokens');
        if (tokenParam) maxOutputTokens = parseInt(tokenParam.value, 10) || 4096;
        
        const threshParam = dbParams.find((p: any) => p.key === 'unified_context_threshold');
        if (threshParam) unifiedThreshold = parseInt(threshParam.value, 10) || 120000;
      }
    } catch (e) {
      console.warn("Failed to load RAG parameters from DB:", e);
    }


    // 1. Select role-specific persona
    let persona = "";
    switch (role) {
      case 'dps':
        persona = "Anda adalah Asisten AI ahli untuk Dewan Pengawas Syariah (DPS) KSPPS IQ-RA, dengan keahlian mendalam dalam fatwa DSN-MUI, PSAK Syariah, fiqih muamalah, audit syariah, dan kepatuhan akad koperasi.";
        break;
      case 'ao':
      case 'account_officer':
        persona = "Anda adalah Konsultan AI untuk Account Officer (AO) KSPPS IQ-RA, dengan keahlian dalam analisis kelayakan pembiayaan, akad (Murabahah, Mudharabah, Musyarakah, Ijarah, Istishna), dan mitigasi risiko syariah.";
        break;
      case 'accounting':
        persona = "Anda adalah Penasihat Keuangan AI untuk Akuntan KSPPS IQ-RA, dengan keahlian dalam akuntansi syariah SAK EP, PSAK 101-107, jurnal double-entry, bagi hasil, dan laporan keuangan koperasi.";
        break;
      case 'teller':
        persona = "Anda adalah Panduan Operasional AI untuk Teller KSPPS IQ-RA, dengan keahlian dalam prosedur simpan pinjam, simpanan Wadiah, transaksi kasir, dan rekonsiliasi kas harian.";
        break;
      case 'member':
        persona = "Anda adalah Asisten Layanan AI yang ramah untuk Anggota KSPPS IQ-RA, dengan keahlian menjelaskan produk simpanan, pembiayaan syariah, bagi hasil, dan hak-hak anggota koperasi dengan bahasa yang mudah dipahami.";
        break;
      case 'super_admin':
      case 'manager':
        persona = "Anda adalah Asisten AI Eksekutif untuk Manajer KSPPS IQ-RA, dengan keahlian dalam manajemen koperasi, regulasi KSPPS, konfigurasi sistem, dan strategi operasional koperasi syariah.";
        break;
      default:
        persona = "Anda adalah Asisten AI Pakar Syariah untuk KSPPS IQ-RA, dengan keahlian luas dalam fiqih muamalah kontemporer, Fatwa DSN-MUI, koperasi simpan pinjam syariah, dan keuangan Islam.";
    }

    // 2. Intelligent Context Strategy: Check database size for full context injection
    let contextDocs: any[] = [];
    let isUnifiedFullContext = false;

    try {
      const { data: allDocs, error: fetchErr } = await supabase
        .from('sharia_knowledge')
        .select('id, source_title, content, category, created_at');

      if (fetchErr) throw fetchErr;

      if (allDocs && allDocs.length > 0) {
        const totalLength = allDocs.reduce((acc: number, doc: any) => acc + (doc.content?.length || 0), 0);
        
        // If entire DB <= unifiedThreshold characters (~30,000 tokens), load EVERYTHING!
        // This delivers 100% "study all documents" zero-loss context for small databases.
        if (totalLength <= unifiedThreshold) {
          contextDocs = allDocs;
          isUnifiedFullContext = true;
          console.log(`Using Unified Full Context: Loaded all ${allDocs.length} chunks (${totalLength} chars) into Gemini's context window.`);
        }
      }
    } catch (sizeErr: any) {
      console.warn("Failed to check database size, falling back to standard RAG:", sizeErr?.message);
    }

    // If database is too large, fall back to high-density RAG (top 30 chunks instead of 5)
    if (!isUnifiedFullContext) {
      try {
        // 2a. High-density Vector similarity search (match_count: 25)
        try {
          const vector1536 = await this.getGeminiEmbedding(message);
          const { data: vectorData } = await supabase.rpc('match_knowledge', {
            query_embedding: vector1536,
            match_threshold: 0.45, // Slightly lower threshold for dense fallback retrieval
            match_count: 25
          });
          if (vectorData && vectorData.length > 0) {
            contextDocs = vectorData;
          }
        } catch (embErr: any) {
          console.warn("Vector search failed, will rely on text search:", embErr?.message);
        }

        // 2b. High-density Keyword text search (supplemental, limit: 15)
        const STOP_WORDS = new Set([
          'yang', 'dan', 'atau', 'tidak', 'dengan', 'dalam', 'untuk', 'pada',
          'dari', 'adalah', 'akan', 'jika', 'maka', 'juga', 'bagi', 'atas',
          'akad', 'oleh', 'dapat', 'harus', 'serta', 'bahwa', 'telah', 'sudah',
          'lebih', 'tersebut', 'sesuai', 'setiap', 'kepada', 'bagaimana', 'apakah',
          'karena', 'namun', 'tentang', 'antara', 'berdasarkan', 'setelah',
          'boleh', 'syariah', 'koperasi', 'hukum', 'sistem', 'adanya', 'secara',
          'suatu', 'melakukan', 'terhadap', 'tentang'
        ]);

        const keywords = message
          .toLowerCase()
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '')
          .split(/\s+/)
          .filter(w => w.length >= 5 && !STOP_WORDS.has(w))
          .slice(0, 5);

        if (keywords.length > 0) {
          const conditions = keywords
            .map(kw => `content.ilike.%${kw}%,source_title.ilike.%${kw}%`)
            .join(',');
          const { data: textData } = await supabase
            .from('sharia_knowledge')
            .select('id, source_title, content, category, created_at')
            .or(conditions)
            .order('created_at', { ascending: false })
            .limit(15);

          if (textData && textData.length > 0) {
            const existingIds = new Set(contextDocs.map((d: any) => d.id));
            const newDocs = textData.filter((d: any) => !existingIds.has(d.id));
            contextDocs = [...contextDocs, ...newDocs].slice(0, 30);
          }
        }
      } catch (searchErr: any) {
        console.warn("RAG retrieval fallback failed:", searchErr?.message);
      }
    }

    // 3. Build context and instruction sections
    const hasContext = contextDocs.length > 0;
    const ragSection = hasContext
      ? `\n\n${isUnifiedFullContext ? 'BASIS PENGETAHUAN SYARIAH UNIFIED (SELURUH DOKUMEN INTERNAL KSPPS IQ-RA):' : 'DOKUMEN INTERNAL KSPPS IQ-RA YANG RELEVAN:'}\n\n${
          contextDocs.map((doc: any, idx: number) =>
            `--- [${doc.source_title || 'Referensi Syariah'}] ---\n${doc.content}`
          ).join('\n\n')
        }`
      : `\n\nINFO: Tidak ada dokumen internal syariah yang cocok di basis pengetahuan koperasi.`;

    const contextInstruction = isUnifiedFullContext
      ? 'PENTING: Anda dibekali dengan seluruh isi Basis Pengetahuan Syariah KSPPS IQ-RA secara utuh. Pelajari seluruh dokumen tersebut untuk menjawab pertanyaan dengan sangat cerdas. Temukan keterkaitan antar dokumen (misalnya keterkaitan antara tabungan, deposito, dan fatwa syariah terkait). Evaluasi dokumen mana yang benar-benar relevan dengan pertanyaan user, dan kutip secara eksplisit jika relevan.'
      : (hasContext
          ? 'Evaluasi apakah Referensi Dokumen Internal di bawah ini benar-benar RELEVAN dengan pertanyaan user. Jika RELEVAN, Anda wajib mengutipnya secara eksplisit (misal: "Berdasarkan [nama dokumen]..."). Namun, jika dokumen yang terdeteksi TIDAK RELEVAN sama sekali dengan konteks pertanyaan, abaikan dokumen tersebut.'
          : 'Jawab secara komprehensif berdasarkan prinsip fikih muamalah kontemporer dan fatwa DSN-MUI yang relevan.');

    // 4. Build conversation history (last 6 messages)
    const historyText = history.length > 0
      ? history.slice(-6).map(h => `${h.sender === 'user' ? 'User' : 'Asisten'}: ${h.text}`).join('\n')
      : "";

    // 5. Use LangChain PromptTemplate to compile the final prompt
    const promptTemplate = PromptTemplate.fromTemplate(
      `{persona}

PANDUAN MENJAWAB (WAJIB DIPATUHI SEPENUHNYA):
1. PAHAMI pertanyaan user dengan sangat teliti. Identifikasi topik spesifik hukum fikih atau operasional koperasi syariah.
2. Berikan jawaban yang SANGAT JELAS, LENGKAP, DETAIL, dan TUNTAS. JAWABAN HARUS TERSTRUKTUR DAN SELESAI SEMPURNA. Jangan biarkan kalimat terputus di akhir atau menggantung tanpa penutup yang logis.
3. {contextInstruction}
4. Gaya bahasa: KOMUNIKATIF, HANGAT, BERWIBAWA, dan PROFESIONAL — layaknya konsultan/dewan pengawas syariah senior. JIKA INI ADALAH PERTANYAAN LANJUTAN (ADA RIWAYAT PERCAKAPAN), DILARANG KERAS mengucapkan salam pembuka (seperti Assalamu'alaikum) lagi. Salam HANYA untuk pesan pertama.
5. Struktur jawaban: Gunakan format Markdown yang rapi (gunakan bold untuk penekanan, bullet points, dan pisahkan penjelasan ke dalam langkah-langkah terstruktur).
6. DILARANG KERAS: Jangan cantumkan teks aksara Arab dalam bentuk apapun (cukup tuliskan transliterasi latin atau langsung artinya saja).
7. Referensi dalil: Tulis "QS. [Nama Surat] ayat [Nomor]" beserta artinya dalam Bahasa Indonesia agar kuat landasannya.
8. Jika pertanyaan berkaitan dengan hal yang jelas-jelas dilarang (misal usaha babi, judi, riba), jelaskan hukum keharamannya secara tegas tetapi sopan, berikan solusi atau alternatif akad syariah lainnya jika ada.
9. TAGGING RUJUKAN RELEVAN (SANGAT PENTING): Di bagian paling akhir jawaban Anda (di baris baru paling bawah), Anda WAJIB mencantumkan tag format berikut untuk menunjukkan judul dokumen referensi yang benar-benar relevan dengan jawaban Anda. Tulis JUDUL DOKUMEN ASLI (bukan nomor urut), pisahkan dengan koma:
   [RELEVANT_SOURCES: Nama Fatwa/Buku 1, Nama Fatwa/Buku 2]
   Jika dari hasil analisis Anda tidak ada satu pun dokumen rujukan di atas yang relevan, Anda WAJIB menuliskan:
   [RELEVANT_SOURCES: NONE]{ragSection}
{historyTextSection}

PERTANYAAN USER: {message}

Berikan jawaban yang utuh, mendalam, dan selesai dengan sempurna (tidak terputus) dalam Bahasa Indonesia.`
    );

    const formattedPrompt = await promptTemplate.format({
      persona,
      contextInstruction,
      ragSection,
      historyTextSection: historyText ? `\nRIWAYAT PERCAKAPAN:\n${historyText}` : "",
      message
    });

    // 6. Call LangChain ChatGoogleGenerativeAI with fallback cascade
    try {
      const safetySettings = [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ];

      const models = this.GEMINI_MODELS.map(modelName => 
        new ChatGoogleGenerativeAI({
          apiKey,
          model: modelName,
          temperature: 0.6,
          maxOutputTokens: maxOutputTokens,
          safetySettings
        })
      );

      const runnableModel = models[0].withFallbacks(models.slice(1));
      const response = await runnableModel.invoke(formattedPrompt);

      let responseText = "";
      if (typeof response.content === 'string') {
        responseText = response.content;
      } else if (Array.isArray(response.content)) {
        responseText = response.content
          .map((part: any) => {
            if (typeof part === 'string') return part;
            if (part && typeof part === 'object' && 'text' in part) return (part as any).text;
            return JSON.stringify(part);
          })
          .join('');
      } else {
        responseText = JSON.stringify(response.content);
      }

      // Extract the relevant sources tag and clean response text
      let finalResponseText = responseText;
      let filteredSources: any[] = [];

      const relevantMatch = finalResponseText.match(/\[RELEVANT_SOURCES:\s*(.*?)\]/i);
      if (relevantMatch) {
        const sourcesStr = relevantMatch[1].trim();
        // Remove the tag from the final visible text
        finalResponseText = finalResponseText.replace(/\[RELEVANT_SOURCES:\s*(.*?)\]/gi, '').trim();

        if (sourcesStr.toUpperCase() !== 'NONE') {
          // Parse titles cited in [RELEVANT_SOURCES: Title A, Title B]
          const citedTitles = sourcesStr.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);

          // Match by source_title (fuzzy: check if any contextDoc title is included in cited string)
          filteredSources = citedTitles
            .map((cited: string) => {
              const match = contextDocs.find((doc: any) => {
                const docTitle = (doc.source_title || '').toLowerCase();
                return docTitle && cited.toLowerCase().includes(docTitle.substring(0, 15));
              });
              return match ? {
                title: match.source_title || 'Referensi Syariah',
                category: match.category || 'UMUM'
              } : { title: cited, category: 'UMUM' };
            })
            .filter((s: any) => s.title && s.title.toUpperCase() !== 'NONE');
        }
      }

      return {
        text: finalResponseText,
        sources: filteredSources
      };

    } catch (e: any) {
      console.error('Semua model Gemini gagal untuk chat via LangChain:', e?.message);
      return {
        text: `Maaf, seluruh layanan AI Gemini sedang tidak dapat diakses saat ini. Silakan coba beberapa saat lagi. (${e?.message || 'unknown error'})`,
        sources: []
      };
    }
  }
}

