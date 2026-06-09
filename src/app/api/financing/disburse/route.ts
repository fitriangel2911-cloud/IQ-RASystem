import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { contract_id, prospect_id } = body;

    if (!contract_id) {
      return NextResponse.json({ success: false, error: 'contract_id is required' }, { status: 400 });
    }

    // Use Service Role Key to BYPASS Row Level Security completely
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Update Contract Status
    const { data: updatedContract, error: contractError } = await supabase
      .from('financing_contracts')
      .update({ 
        status: 'active',
        disbursement_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', contract_id)
      .select()
      .single();

    if (contractError) throw contractError;

    // 2. Update Prospect Status (if prospect_id or updatedContract.prospect_id exists)
    const pId = prospect_id || updatedContract?.prospect_id;
    if (pId) {
      await supabase
        .from('prospects')
        .update({ 
          status: 'Cair / Aktif',
          is_converted: true 
        })
        .eq('id', pId);
    }

    return NextResponse.json({ success: true, contract: updatedContract });
  } catch (err: any) {
    console.error('Disburse API Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
