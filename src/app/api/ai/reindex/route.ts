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

    // 1. Fetch all rows where embedding is null
    const { data: nullEmbedDocs, error: fetchError } = await supabase
      .from('sharia_knowledge')
      .select('id, source_title, content, category')
      .is('embedding', null);

    if (fetchError) {
      throw new Error(`Gagal mengambil data dari database: ${fetchError.message}`);
    }

    if (!nullEmbedDocs || nullEmbedDocs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Semua dokumen syariah Anda sudah ter-vektorisasi secara lengkap dan siap digunakan 100%!',
        processed_count: 0
      });
    }

    console.log(`Menemukan ${nullEmbedDocs.length} potongan dokumen syariah tanpa vektor. Memulai re-vektorisasi...`);

    let successCount = 0;
    const processedTitles = new Set<string>();

    // 2. Process each chunk sequentially to avoid rate limits (15 RPM free limit)
    for (let i = 0; i < nullEmbedDocs.length; i++) {
      const doc = nullEmbedDocs[i];
      try {
        // Generate embedding
        const embedding = await AIService.getGeminiEmbedding(doc.content);

        // Update database row
        const { error: updateError } = await supabase
          .from('sharia_knowledge')
          .update({ embedding: embedding })
          .eq('id', doc.id);

        if (updateError) {
          console.error(`Gagal mengupdate id ${doc.id}:`, updateError);
          continue;
        }

        successCount++;
        processedTitles.add(doc.source_title || 'Dokumen Tanpa Judul');

        // Throttle slightly to respect free tier rate limit of 15 requests per minute
        if (i < nullEmbedDocs.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      } catch (err: any) {
        console.error(`Gagal memproses potongan ke-${i + 1} (ID: ${doc.id}):`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil memproses ulang dan mem-vektorisasi ${successCount} potongan dokumen syariah!`,
      processed_count: successCount,
      documents: Array.from(processedTitles)
    });

  } catch (error: any) {
    console.error("Reindex API Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Gagal memproses ulang basis pengetahuan' 
    }, { status: 500 });
  }
}
