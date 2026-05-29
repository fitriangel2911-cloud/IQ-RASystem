import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { member_id, amount, type, prospect_id, name } = body;

    // Use Service Role Key to BYPASS Row Level Security completely
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try inserting WITH new columns first
    let contractResult = await supabase
      .from('financing_contracts')
      .insert({
        member_id,
        prospect_id,
        amount,
        type,
        status: 'active',
        disbursement_date: new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    // If it fails because columns don't exist (e.g. user didn't run migrations)
    if (contractResult.error && contractResult.error.message.includes('Could not find')) {
      contractResult = await supabase
        .from('financing_contracts')
        .insert({
          member_id,
          amount,
          type,
          status: 'active'
        })
        .select()
        .single();
    }

    if (contractResult.error) {
      throw contractResult.error;
    }

    // Try updating prospect status
    await supabase
      .from('prospects')
      .update({ is_converted: true, status: 'Cair / Aktif' })
      .eq('id', prospect_id);

    return NextResponse.json({ success: true, contract: contractResult.data });
  } catch (err: any) {
    console.error('Disburse API Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
