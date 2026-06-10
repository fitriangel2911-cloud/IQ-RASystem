import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';

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

    // 3. Send Email Notification to Member
    if (updatedContract?.member_id) {
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('email, full_name')
          .eq('id', updatedContract.member_id)
          .single();

        if (userData?.email) {
          await sendEmail({
            to: userData.email,
            subject: `[IQ-RA Koperasi] Pembiayaan Anda Berhasil Dicairkan`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #0b5345; text-align: center;">IQ-RA Cooperative</h2>
                <p>Assalamu'alaikum wr. wb. <b>${userData.full_name || 'Anggota'}</b>,</p>
                <p>Alhamdulillah, pembiayaan dengan akad <b>${(updatedContract.type || 'pembiayaan').toUpperCase()}</b> sebesar <b>Rp ${updatedContract.amount?.toLocaleString('id-ID')}</b> telah berhasil dicairkan oleh Teller pada tanggal <b>${updatedContract.disbursement_date}</b>.</p>
                <p>Dana tersebut telah dikreditkan langsung ke rekening tabungan wadiah Anda di Koperasi IQ-RA. Silakan periksa saldo tabungan Anda di Portal Anggota.</p>
                <br/>
                <p>Jazakumullah Khairan Katsiran,<br/><b>Pengurus IQ-RA Cooperative</b></p>
              </div>
            `
          });
        }
      } catch (emailErr) {
        console.error('Failed to send disbursement email:', emailErr);
      }
    }

    return NextResponse.json({ success: true, contract: updatedContract });
  } catch (err: any) {
    console.error('Disburse API Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

