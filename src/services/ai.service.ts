import { createClient } from '@/lib/supabase/client';
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

/**
 * iQ-RA RAG Engine Service
 * Handles sharia compliance analysis and contract recommendations.
 */
export class AIService {
  
  /**
   * Analyzes a financing prospect using RAG
   * @param prospectData Data from the AO input
   */
  static async analyzeProspect(prospectData: { purpose: string, amount: number, description?: string }) {
    const supabase = createClient();
    
    const query = `Tujuan pengajuan: ${prospectData.purpose}. Nominal: Rp ${prospectData.amount}. Keterangan: ${prospectData.description || 'Tidak ada spesifik'}`;

    try {
      // 1. Check if OPENAI_API_KEY is available
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is not set in environment variables.");
      }

      const embeddings = new OpenAIEmbeddings();
      
      // 2. Retrieve relevant context from vector store
      const vectorStore = new SupabaseVectorStore(embeddings, {
        client: supabase,
        tableName: "sharia_knowledge",
        queryName: "match_knowledge",
      });

      // Fetch 3 most relevant documents
      let contextDocs = [];
      try {
        contextDocs = await vectorStore.similaritySearch(query, 3);
      } catch (e) {
        console.warn("Vector store search failed, possibly empty table or missing match_knowledge function. Continuing without context.", e);
      }
      
      const contextText = contextDocs.length > 0 
        ? contextDocs.map(doc => `Sumber: ${doc.metadata?.source_title || 'Referensi'}\nKonten: ${doc.pageContent}`).join("\n\n")
        : "Tidak ada referensi spesifik dari database. Gunakan prinsip dasar fikih muamalah.";

      // 3. Setup LLM and Prompt
      const model = new ChatOpenAI({
        modelName: "gpt-4o-mini",
        temperature: 0.1,
      });

      const prompt = PromptTemplate.fromTemplate(`
Anda adalah dewan pengawas syariah ahli fikih muamalah di sebuah koperasi syariah (BMT).
Tugas Anda adalah merekomendasikan akad pembiayaan yang paling tepat untuk pengajuan nasabah berikut.

DATA PENGAJUAN:
{query}

REFERENSI FATWA / KEBIJAKAN (Hasil RAG):
{context}

Berikan analisis Anda dalam format JSON persis seperti berikut (tanpa tambahan teks markdown lainnya, murni JSON):
{{
  "primary_contract": "Nama Akad (Misal: Murabahah, Mudharabah, Ijarah)",
  "match_score": 95, 
  "justification": "Alasan syariah mengapa akad ini dipilih berdasarkan tujuan pengajuan dan referensi fatwa.",
  "notes": "Peringatan mitigasi risiko atau syarat sah akad yang harus dipastikan oleh Account Officer."
}}
`);

      const chain = prompt.pipe(model).pipe(new StringOutputParser());
      
      // 4. Execute LangChain pipeline
      const responseStr = await chain.invoke({
        query: query,
        context: contextText
      });

      // 5. Parse JSON output
      let recommendation;
      try {
        // Remove potential markdown code blocks if the LLM adds them
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
          content: doc.pageContent,
          source_title: doc.metadata?.source_title || 'Unknown'
        }))
      };

    } catch (error: any) {
      console.error("AI Analysis Error:", error);
      
      // Fallback if error occurs (e.g., no API key, or OpenAI down)
      let recommendation = {
        primary_contract: "Murabahah",
        match_score: 85,
        justification: "Berdasarkan pengajuan aset, skema Jual Beli (Murabahah) adalah yang paling umum digunakan (Fallback mode).",
        notes: "Pastikan objek barang tersedia dan spesifikasinya jelas. (Mode fallback karena AI Engine belum diatur)"
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
   * Ingests a new document into the knowledge base
   */
  static async ingestKnowledge(content: string, metadata: any) {
    // Implementation for Super Admin to upload Fatwas/SOPs
    // This will use OpenAIEmbeddings to vectorize the text
    return { status: "READY_FOR_INGESTION", length: content.length };
  }
}
