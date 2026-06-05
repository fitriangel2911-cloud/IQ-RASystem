import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Pastikan user memiliki akses staf
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (!profile || !['customer_service', 'manager', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { member_id, purpose, amount, name, phone, type } = body;

    if (!amount || !name) {
      return NextResponse.json({ error: 'Data pengajuan tidak lengkap.' }, { status: 400 });
    }

    // 1. Validasi Blacklist (Bisa juga ditambahkan di sini)
    if (member_id) {
      const { data: memberData } = await supabase.from('members').select('is_blacklisted').eq('user_id', member_id).single();
      if (memberData?.is_blacklisted) {
        return NextResponse.json({ error: 'Nasabah masuk dalam daftar Blacklist.' }, { status: 400 });
      }
    }

    // Gunakan admin client untuk by-pass RLS jika dibutuhkan, namun role CS sudah punya izin insert ke financing_contracts
    const { data: contractData, error: contractErr } = await supabase
      .from('financing_contracts')
      .insert({
        member_id: member_id || null, // Jika belum ada CIF
        member_name: name,
        amount: Number(amount),
        type: type || 'murabahah', // Gunakan type dari body, fallback murabahah
        status: 'pending',
        collateral_metadata: { purpose, phone }
      })
      .select()
      .single();

    if (contractErr) throw contractErr;

    // 2. Fetch target users for notifications (AO, DPS, Manager)
    const { data: staffUsers } = await supabase
      .from('users')
      .select('id, role')
      .in('role', ['account_officer', 'dps', 'manager']);

    if (staffUsers && staffUsers.length > 0) {
      const notifications = staffUsers.map(staff => ({
        user_id: staff.id,
        type: 'info',
        message: `Pengajuan Pembiayaan Baru: Rp ${Number(amount).toLocaleString('id-ID')} atas nama ${name}.`
      }));

      await supabase.from('notifications').insert(notifications);
    }

    return NextResponse.json({ success: true, message: 'Berhasil dikirim ke AO dan DPS secara paralel.', data: contractData });

  } catch (error: any) {
    console.error('Submit Financing Error:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
