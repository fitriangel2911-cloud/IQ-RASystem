import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { COA } from '@/lib/constants/coa';

// Create a secure admin client to bypass RLS policies
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // 1. Authenticate user using the server client session
    const supabase = await createServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Akses tidak sah. Silakan login kembali.' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      paymentType, 
      amount, 
      adminFee = 0, 
      infaq = 0, 
      uniqueCode = 0, 
      totalPaid, 
      targetAccountType 
    } = body;

    if (!paymentType || amount <= 0 || !targetAccountType) {
      return NextResponse.json({ error: 'Parameter pembayaran tidak valid.' }, { status: 400 });
    }

    // 2. Fetch member profile
    const { data: member, error: memberErr } = await supabaseAdmin
      .from('members')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (memberErr || !member) {
      return NextResponse.json({ error: 'Profil anggota tidak ditemukan.' }, { status: 404 });
    }

    // 3. Record Pending Verification in deposit_verifications
    const refNo = `TX-ONL-${Date.now()}-${targetAccountType.substring(0, 3).toUpperCase()}`;
    const { error: verifyErr } = await supabaseAdmin
      .from('deposit_verifications')
      .insert({
        member_id: user.id,
        payment_type: paymentType,
        target_account_type: targetAccountType,
        amount: amount,
        admin_fee: adminFee,
        infaq: infaq,
        unique_code: uniqueCode,
        total_paid: totalPaid,
        reference_no: refNo,
        payment_month: body.paymentMonth || null,
        payment_note: body.paymentNote || null,
        status: 'pending'
      });

    if (verifyErr) {
      return NextResponse.json({ error: 'Gagal mencatat antrian verifikasi: pastikan Anda sudah menjalankan migrasi database.' }, { status: 500 });
    }

    const typeLabels: Record<string, string> = {
      principal: 'Simpanan Pokok',
      mandatory: 'Simpanan Wajib',
      voluntary: 'Simpanan Sukarela'
    };

    // 4. Create a sharia-themed notification for user
    await supabaseAdmin.from('notifications').insert({
      user_id: user.id,
      type: 'info',
      message: `Setoran ${typeLabels[paymentType]} Anda sebesar Rp ${totalPaid.toLocaleString('id-ID')} berstatus PENDING. Silakan hubungi CS via WA untuk konfirmasi.`
    });

    return NextResponse.json({
      success: true,
      referenceNo: refNo,
      status: 'pending',
      accountNumber: 'MENUNGGU VERIFIKASI CS',
      newBalance: 0,
      journalRecorded: []
    });

  } catch (error: any) {
    console.error("Payment API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
