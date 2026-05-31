import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: records, error } = await supabase
      .from('sharia_knowledge')
      .select('id, source_title, category, content, embedding');

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const uniqueTitles = new Map<string, { count: number, hasEmbedding: boolean, sample: string }>();
    records?.forEach(r => {
      const title = r.source_title || 'Untitled';
      const existing = uniqueTitles.get(title);
      if (existing) {
        existing.count++;
      } else {
        uniqueTitles.set(title, {
          count: 1,
          hasEmbedding: r.embedding !== null,
          sample: r.content ? r.content.substring(0, 100) + '...' : ''
        });
      }
    });

    return NextResponse.json({
      success: true,
      total_chunks: records?.length || 0,
      unique_documents_count: uniqueTitles.size,
      documents: Array.from(uniqueTitles.entries()).map(([title, info]) => ({
        title,
        chunks_count: info.count,
        has_embedding: info.hasEmbedding,
        sample: info.sample
      }))
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
