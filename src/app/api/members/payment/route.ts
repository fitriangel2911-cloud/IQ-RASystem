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

    // 3. Find or Create target savings account
    let { data: account, error: accErr } = await supabaseAdmin
      .from('savings_accounts')
      .select('*')
      .eq('member_id', user.id)
      .eq('account_type', targetAccountType)
      .maybeSingle();

    if (accErr) {
      return NextResponse.json({ error: 'Gagal menelusuri rekening: ' + accErr.message }, { status: 500 });
    }

    let accountId = account?.id;
    let accountNum = account?.account_number;

    if (!account) {
      // Generate a new sharia-compliant account number
      const prefix = targetAccountType === 'pokok' ? '11' : targetAccountType === 'wajib' ? '12' : targetAccountType === 'wadiah' ? '21' : '22';
      const randomSuffix = Math.floor(10000000 + Math.random() * 90000000).toString();
      accountNum = `${prefix}${randomSuffix}`;

      const { data: newAcc, error: createAccErr } = await supabaseAdmin
        .from('savings_accounts')
        .insert({
          member_id: user.id,
          account_number: accountNum,
          account_type: targetAccountType,
          balance: 0
        })
        .select()
        .single();

      if (createAccErr) {
        return NextResponse.json({ error: 'Gagal membuat rekening baru: ' + createAccErr.message }, { status: 550 });
      }
      accountId = newAcc.id;
      account = newAcc;
    }

    // 4. Record Direct Transaction Log in savings_transactions
    const refNo = `TX-ONL-${Date.now()}-${targetAccountType.substring(0, 3).toUpperCase()}`;
    const { error: txErr } = await supabaseAdmin
      .from('savings_transactions')
      .insert({
        account_id: accountId,
        transaction_type: 'deposit',
        amount: amount,
        reference_no: refNo
      });

    if (txErr) {
      return NextResponse.json({ error: 'Gagal mencatat transaksi mutasi: ' + txErr.message }, { status: 500 });
    }

    // 5. Update savings account balance
    const currentBalance = Number(account.balance || 0);
    const newBalance = currentBalance + Number(amount);

    const { error: balanceErr } = await supabaseAdmin
      .from('savings_accounts')
      .update({ balance: newBalance })
      .eq('id', accountId);

    if (balanceErr) {
      return NextResponse.json({ error: 'Gagal memperbarui saldo rekening: ' + balanceErr.message }, { status: 500 });
    }

    // 6. Record Double-Entry Accounting Journals (SAK EP Compliant)
    let creditAccount = COA.SAVINGS_WADIAH; // 201.01
    if (targetAccountType === 'pokok') creditAccount = COA.MEMBER_CAPITAL_PRINCIPAL; // 301.01
    else if (targetAccountType === 'wajib') creditAccount = COA.MEMBER_CAPITAL_MANDATORY; // 301.02
    else if (targetAccountType === 'mudharabah') creditAccount = COA.SAVINGS_MUDHARABAH; // 201.02

    const journalEntries = [
      { account_code: COA.CASH_IN_BANK, debit: totalPaid, credit: 0 },
      { account_code: creditAccount, debit: 0, credit: amount }
    ];

    if (adminFee > 0) {
      journalEntries.push({ account_code: COA.INCOME_SERVICE_FEE, debit: 0, credit: adminFee });
    }

    const infaqTotal = Number(infaq) + Number(uniqueCode);
    if (infaqTotal > 0) {
      journalEntries.push({ account_code: COA.RETAINED_EARNINGS, debit: 0, credit: infaqTotal });
    }

    const typeLabels: Record<string, string> = {
      principal: 'Simpanan Pokok',
      mandatory: 'Simpanan Wajib',
      voluntary: 'Simpanan Sukarela'
    };

    const journalDesc = `[ONLINE TRANSFER] Pembayaran ${typeLabels[paymentType]} - ${user.user_metadata?.full_name || 'Anggota'} (Tenor/Pokok: Rp ${amount.toLocaleString('id-ID')}, Admin: Rp ${adminFee.toLocaleString('id-ID')}, Infaq+Kode: Rp ${infaqTotal.toLocaleString('id-ID')})`;

    // Map entries to target schema
    const dbEntries = journalEntries.map(e => ({
      date: new Date().toISOString().split('T')[0],
      description: journalDesc,
      reference_no: refNo,
      account_code: e.account_code,
      debit: e.debit,
      credit: e.credit
    }));

    const { error: journalErr } = await supabaseAdmin
      .from('journal_entries')
      .insert(dbEntries);

    if (journalErr) {
      console.error('Failed to post journal entries:', journalErr);
      // We don't rollback the savings transaction to avoid inconsistencies, but log the error
    }

    // 7. Update status fields in members table
    const updateData: any = {};
    if (paymentType === 'principal') {
      updateData.paid_principal_deposit = true;
    } else if (paymentType === 'mandatory') {
      updateData.paid_mandatory_deposit = true;
    }

    if (Object.keys(updateData).length > 0) {
      const { error: memberUpdateErr } = await supabaseAdmin
        .from('members')
        .update(updateData)
        .eq('user_id', user.id);

      if (memberUpdateErr) {
        console.error('Failed to update member deposit status:', memberUpdateErr);
      }
    }

    // 8. Create a sharia-themed notification for user
    await supabaseAdmin.from('notifications').insert({
      user_id: user.id,
      type: 'info',
      message: `Alhamdulillah, setoran ${typeLabels[paymentType]} Anda sebesar Rp ${amount.toLocaleString('id-ID')} telah sukses dikonfirmasi secara online.`
    });

    return NextResponse.json({
      success: true,
      referenceNo: refNo,
      accountNumber: accountNum,
      newBalance,
      journalRecorded: dbEntries
    });

  } catch (error: any) {
    console.error("Payment API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
