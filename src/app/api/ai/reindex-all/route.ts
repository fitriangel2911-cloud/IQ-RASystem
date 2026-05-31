import { NextResponse } from 'next/server';
import { AIService } from '@/services/ai.service';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'GEMINI_API_KEY tidak dikonfigurasi di file .env.local.' 
      }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Ambil SEMUA potongan dokumen dari database
    const { data: docs, error: fetchError } = await supabase
      .from('sharia_knowledge')
      .select('id, source_title, content, category');

    if (fetchError) {
      throw new Error(`Gagal mengambil data dari database: ${fetchError.message}`);
    }

    console.log(`Memulai re-vektorisasi total untuk ${docs.length} potongan dokumen...`);

    let successCount = 0;
    
    // Proses satu per satu secara sekuensial dengan jeda aman 4.2 detik untuk menghormati batas gratis 15 RPM
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      try {
        const embedding = await AIService.getGeminiEmbedding(doc.content);

        const { error: updateError } = await supabase
          .from('sharia_knowledge')
          .update({ embedding: embedding })
          .eq('id', doc.id);

        if (updateError) {
          console.error(`Gagal mengupdate id ${doc.id}:`, updateError);
          continue;
        }

        successCount++;
        console.log(`[${i + 1}/${docs.length}] Berhasil mem-vektorisasi "${doc.source_title}"`);
        
        if (i < docs.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1200));
        }
      } catch (err: any) {
        console.error(`Gagal memproses ID ${doc.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil melakukan re-vektorisasi total untuk ${successCount} dari ${docs.length} potongan dokumen menggunakan gemini-embedding-001!`,
      processed_count: successCount
    });

  } catch (error: any) {
    console.error("Reindex All Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
