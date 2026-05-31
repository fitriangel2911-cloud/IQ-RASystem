import { NextResponse } from 'next/server';
import { AIService } from '@/services/ai.service';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, content, category } = body;

    if (!title || !content || !category) {
      return NextResponse.json({ error: 'Title, content, and category are required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const result = await AIService.ingestKnowledge(content, { title, category }, supabase);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API AI Ingestion Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to ingest document' }, { status: 500 });
  }
}
