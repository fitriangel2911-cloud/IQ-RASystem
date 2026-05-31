import { NextResponse } from 'next/server';
import { AIService } from '@/services/ai.service';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { purpose, amount, description } = body;

    if (!purpose || !amount) {
      return NextResponse.json({ error: 'Purpose and amount are required' }, { status: 400 });
    }

    const supabase = await createClient();
    const result = await AIService.analyzeProspect({ purpose, amount, description }, supabase);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API AI Analysis Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to analyze' }, { status: 500 });
  }
}
