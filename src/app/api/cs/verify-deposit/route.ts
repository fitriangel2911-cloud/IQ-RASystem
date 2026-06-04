import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { COA } from '@/lib/constants/coa';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Akses tidak sah.' }, { status: 401 });
    }

    const { verificationId } = await request.json();

    if (!verificationId) {
      return NextResponse.json({ error: 'ID verifikasi tidak valid.' }, { status: 400 });
    }

    // 1. Fetch pending verification
    const { data: verification, error: fetchErr } = await supabaseAdmin
      .from('deposit_verifications')
      .select('*')
      .eq('id', verificationId)
      .eq('status', 'pending')
      .single();

    if (fetchErr || !verification) {
      return NextResponse.json({ error: 'Data setoran tidak ditemukan atau sudah diverifikasi.' }, { status: 404 });
    }

    const memberId = verification.member_id;
    const { payment_type: paymentType, target_account_type: targetAccountType, amount, admin_fee: adminFee, infaq, unique_code: uniqueCode, total_paid: totalPaid, reference_no: refNo } = verification;

    // 2. Find or Create target savings account
    let { data: account, error: accErr } = await supabaseAdmin
      .from('savings_accounts')
      .select('*')
      .eq('member_id', memberId)
      .eq('account_type', targetAccountType)
      .maybeSingle();

    let accountId = account?.id;

    if (!account) {
      const prefix = targetAccountType === 'pokok' ? '11' : targetAccountType === 'wajib' ? '12' : targetAccountType === 'wadiah' ? '21' : '22';
      const randomSuffix = Math.floor(10000000 + Math.random() * 90000000).toString();
      const accountNum = `${prefix}${randomSuffix}`;

      const { data: newAcc, error: createAccErr } = await supabaseAdmin
        .from('savings_accounts')
        .insert({
          member_id: memberId,
          account_number: accountNum,
          account_type: targetAccountType,
          balance: 0
        })
        .select()
        .single();

      if (createAccErr) throw new Error('Gagal membuat rekening baru.');
      accountId = newAcc.id;
      account = newAcc;
    }

    // 3. Record Transaction Log
    const { error: txErr } = await supabaseAdmin
      .from('savings_transactions')
      .insert({
        account_id: accountId,
        transaction_type: 'deposit',
        amount: amount,
        reference_no: refNo
      });

    if (txErr) throw new Error('Gagal mencatat transaksi mutasi.');

    // 4. Update Balance
    const newBalance = Number(account.balance || 0) + Number(amount);
    const { error: balanceErr } = await supabaseAdmin
      .from('savings_accounts')
      .update({ balance: newBalance })
      .eq('id', accountId);

    if (balanceErr) throw new Error('Gagal memperbarui saldo.');

    // 5. Post Journals (SAK EP)
    let creditAccount = COA.SAVINGS_WADIAH; // 201.01
    if (targetAccountType === 'pokok') creditAccount = COA.MEMBER_CAPITAL_PRINCIPAL; // 301.01
    else if (targetAccountType === 'wajib') creditAccount = COA.MEMBER_CAPITAL_MANDATORY; // 301.02
    else if (targetAccountType === 'mudharabah') creditAccount = COA.SAVINGS_MUDHARABAH; // 201.02

    const journalEntries = [
      { account_code: COA.CASH_IN_BANK, debit: totalPaid, credit: 0 },
      { account_code: creditAccount, debit: 0, credit: amount }
    ];

    if (adminFee > 0) journalEntries.push({ account_code: COA.INCOME_SERVICE_FEE, debit: 0, credit: adminFee });
    const infaqTotal = Number(infaq) + Number(uniqueCode);
    if (infaqTotal > 0) journalEntries.push({ account_code: COA.RETAINED_EARNINGS, debit: 0, credit: infaqTotal });

    const typeLabels: Record<string, string> = { principal: 'Simpanan Pokok', mandatory: 'Simpanan Wajib', voluntary: 'Simpanan Sukarela' };
    const journalDesc = `[VERIFIED TRANSFER] Pembayaran ${typeLabels[paymentType] || paymentType} (Tenor/Pokok: Rp ${amount.toLocaleString('id-ID')}, Admin: Rp ${adminFee.toLocaleString('id-ID')}, Infaq+Kode: Rp ${infaqTotal.toLocaleString('id-ID')})`;

    const dbEntries = journalEntries.map(e => ({
      date: new Date().toISOString().split('T')[0],
      description: journalDesc,
      reference_no: refNo,
      account_code: e.account_code,
      debit: e.debit,
      credit: e.credit
    }));

    await supabaseAdmin.from('journal_entries').insert(dbEntries);

    // 6. Update member status
    const updateData: any = {};
    if (paymentType === 'principal') updateData.paid_principal_deposit = true;
    else if (paymentType === 'mandatory') updateData.paid_mandatory_deposit = true;

    if (Object.keys(updateData).length > 0) {
      await supabaseAdmin.from('members').update(updateData).eq('user_id', memberId);
    }

    // 7. Mark as verified
    await supabaseAdmin
      .from('deposit_verifications')
      .update({
        status: 'approved',
        verified_by: user.id,
        verified_at: new Date().toISOString()
      })
      .eq('id', verificationId);

    // 8. Notify Member
    await supabaseAdmin.from('notifications').insert({
      user_id: memberId,
      type: 'success',
      message: `Alhamdulillah, setoran ${typeLabels[paymentType]} Anda sebesar Rp ${totalPaid.toLocaleString('id-ID')} telah sukses dikonfirmasi oleh Admin.`
    });

    return NextResponse.json({ success: true, message: 'Verifikasi berhasil diproses!' });

  } catch (error: any) {
    console.error("CS Verify Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
