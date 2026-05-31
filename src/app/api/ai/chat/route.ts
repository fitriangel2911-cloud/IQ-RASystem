import { NextResponse } from 'next/server';
import { AIService } from '@/services/ai.service';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, role, history } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const result = await AIService.chatWithShariaRAG(message, role || 'guest', history || [], supabase);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API AI Chat Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to process chat' }, { status: 500 });
  }
}
