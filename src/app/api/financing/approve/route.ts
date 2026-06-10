import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { contract_id, decision, amount, type, prospect_id, member_name } = body;

    // Use Service Role Key to BYPASS Row Level Security completely
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Update Contract Status
    const { data: updatedContract, error: contractError } = await supabase
      .from('financing_contracts')
      .update({ status: decision, disbursement_date: decision === 'approved' ? new Date().toISOString() : null })
      .eq('id', contract_id)
      .select()
      .single();

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

    // 3. Send Email Notification to Member
    if (updatedContract?.member_id) {
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('email, full_name')
          .eq('id', updatedContract.member_id)
          .single();

        if (userData?.email) {
          const isApproved = decision === 'approved';
          const subject = isApproved 
            ? `[IQ-RA Koperasi] Pengajuan Pembiayaan Anda Disetujui`
            : `[IQ-RA Koperasi] Update Pengajuan Pembiayaan Anda`;
          
          const statusText = isApproved ? 'DISETUJUI' : 'DITOLAK / PERLU REVISI';
          const bodyMessage = isApproved 
            ? `Pengajuan pembiayaan akad <b>${(updatedContract.type || 'pembiayaan').toUpperCase()}</b> sebesar <b>Rp ${updatedContract.amount?.toLocaleString('id-ID')}</b> telah disetujui oleh Manajer Koperasi.`
            : `Mohon maaf, pengajuan pembiayaan akad <b>${(updatedContract.type || 'pembiayaan').toUpperCase()}</b> sebesar <b>Rp ${updatedContract.amount?.toLocaleString('id-ID')}</b> belum dapat disetujui saat ini.`;

          await sendEmail({
            to: userData.email,
            subject: subject,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #0b5345; text-align: center;">IQ-RA Cooperative</h2>
                <p>Assalamu'alaikum wr. wb. <b>${userData.full_name || 'Anggota'}</b>,</p>
                <p>Kami ingin menginformasikan status terkini perihal pengajuan pembiayaan Anda:</p>
                <div style="background-color: ${isApproved ? '#e8f8f5' : '#fcedec'}; border-left: 5px solid ${isApproved ? '#1abc9c' : '#e74c3c'}; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <strong style="color: ${isApproved ? '#117864' : '#922b21'}; font-size: 16px;">STATUS: ${statusText}</strong>
                  <p style="margin: 5px 0 0 0;">${bodyMessage}</p>
                </div>
                ${isApproved 
                  ? '<p>Langkah selanjutnya adalah mendatangi kantor koperasi untuk menandatangani berkas akad fisik sebelum dilakukan pencairan (disbursement) dana oleh Teller ke rekening Anda.</p>' 
                  : '<p>Silakan hubungi Customer Service koperasi kami untuk informasi lebih detail mengenai alasan keputusan atau langkah revisi berkas Anda.</p>'}
                <br/>
                <p>Jazakumullah Khairan Katsiran,<br/><b>Pengurus IQ-RA Cooperative</b></p>
              </div>
            `
          });
        }
      } catch (emailErr) {
        console.error('Failed to send approval email:', emailErr);
      }
    }

    // Note: Accounting ledger entries are created upon actual disbursement by Teller (Panel7Disbursement)

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Approve API Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

