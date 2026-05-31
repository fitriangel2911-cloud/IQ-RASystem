import { NextResponse } from 'next/server';
import { AIService } from '@/services/ai.service';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    console.log("=========================================");
    console.log("TESTING LANGCHAIN RAG SYSTEM DIRECTLY...");
    console.log("=========================================");
    
    const result = await AIService.chatWithShariaRAG(
      "Apakah boleh melakukan akad Murabahah untuk membeli laptop bagi usaha?",
      "ao",
      [],
      supabase
    );
    
    console.log("RESPONSE RECEIVED SUCCESSFULLY!");
    console.log("Sources found:", result.sources.length);
    console.log("=========================================");

    return NextResponse.json({
      success: true,
      result
    });
  } catch (error: any) {
    console.error("Test Route Error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process test'
    }, { status: 500 });
  }
}
