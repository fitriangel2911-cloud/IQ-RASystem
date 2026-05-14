import { NextResponse } from 'next/server';
import { AccountingService } from '@/services/accounting.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.entries || !Array.isArray(body.entries) || body.entries.length === 0) {
      return NextResponse.json({ error: 'Missing entries for transaction' }, { status: 400 });
    }

    if (!body.description || !body.date) {
      return NextResponse.json({ error: 'Missing metadata (date/description)' }, { status: 400 });
    }

    const data = await AccountingService.recordTransaction(body);
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Accounting API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
