import { NextResponse } from 'next/server';
import { AccountingService } from '@/services/accounting.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.account_code || !body.description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const data = await AccountingService.recordTransaction(body);
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
