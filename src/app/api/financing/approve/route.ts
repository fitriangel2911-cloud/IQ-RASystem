import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { contract_id, decision, amount, type, prospect_id, member_name } = body;

    // Use Service Role Key to BYPASS Row Level Security completely
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Update Contract Status
    const { error: contractError } = await supabase
      .from('financing_contracts')
      .update({ status: decision, disbursement_date: decision === 'approved' ? new Date().toISOString() : null })
      .eq('id', contract_id);

    if (contractError) throw contractError;

    // 2. Update Prospect Status (if prospect_id exists)
    if (prospect_id) {
      await supabase
        .from('prospects')
        .update({ 
          status: decision === 'approved' ? 'Cair / Aktif' : 'Ditolak Manajer',
          is_converted: decision === 'approved'
        })
        .eq('id', prospect_id);
    }

    // Note: Accounting ledger entries are created upon actual disbursement by Teller (Panel7Disbursement)

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Approve API Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
