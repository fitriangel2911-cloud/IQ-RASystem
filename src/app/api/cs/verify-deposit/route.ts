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
    let { payment_type: paymentType, target_account_type: targetAccountType, amount, admin_fee: adminFee, infaq, unique_code: uniqueCode, total_paid: totalPaid, reference_no: refNo } = verification;

    if (!targetAccountType) {
      if (paymentType === 'principal') targetAccountType = 'pokok';
      else if (paymentType === 'mandatory') targetAccountType = 'wajib';
      else targetAccountType = 'wadiah';
    }

    const isRegistrationBundle = paymentType.startsWith('registration_bundle');

    if (isRegistrationBundle) {
      const parts = paymentType.split('|');
      const principalAmount = Number(parts[1] || 0);
      const mandatoryAmount = Number(parts[2] || 0);

      // 1. Update Pokok Account
      let { data: pokokAcc } = await supabase.from('savings_accounts').select('*').eq('member_id', memberId).eq('account_type', 'pokok').single();
      if (pokokAcc && principalAmount > 0) {
        await supabase.from('savings_transactions').insert({ account_id: pokokAcc.id, transaction_type: 'deposit', amount: principalAmount, reference_no: `${refNo}-P` });
        await supabase.from('savings_accounts').update({ balance: Number(pokokAcc.balance || 0) + principalAmount }).eq('id', pokokAcc.id);
      }

      // 2. Update Wajib Account
      let { data: wajibAcc } = await supabase.from('savings_accounts').select('*').eq('member_id', memberId).eq('account_type', 'wajib').single();
      if (wajibAcc && mandatoryAmount > 0) {
        await supabase.from('savings_transactions').insert({ account_id: wajibAcc.id, transaction_type: 'deposit', amount: mandatoryAmount, reference_no: `${refNo}-W` });
        await supabase.from('savings_accounts').update({ balance: Number(wajibAcc.balance || 0) + mandatoryAmount }).eq('id', wajibAcc.id);
      }

      // 3. Update Member Status
      await supabaseAdmin.from('members').update({ status: 'active', paid_principal_deposit: true, paid_mandatory_deposit: true }).eq('user_id', memberId);

      // 4. Post Journals (SAK EP)
      const journalEntries = [
        { account_code: COA.CASH_IN_BANK, debit: totalPaid, credit: 0 }
      ];
      
      if (principalAmount > 0) journalEntries.push({ account_code: COA.MEMBER_CAPITAL_PRINCIPAL, debit: 0, credit: principalAmount });
      if (mandatoryAmount > 0) journalEntries.push({ account_code: COA.MEMBER_CAPITAL_MANDATORY, debit: 0, credit: mandatoryAmount });
      if (adminFee > 0) journalEntries.push({ account_code: COA.INCOME_SERVICE_FEE, debit: 0, credit: adminFee });
      if (Number(infaq) > 0) journalEntries.push({ account_code: COA.ZISWAF, debit: 0, credit: Number(infaq) });
      if (Number(uniqueCode) > 0) journalEntries.push({ account_code: COA.DANA_KEBAJIKAN, debit: 0, credit: Number(uniqueCode) });

      const journalDesc = `[PENDAFTARAN ANGGOTA] Setoran CIF Baru (Pokok: Rp ${principalAmount.toLocaleString('id-ID')}, Wajib: Rp ${mandatoryAmount.toLocaleString('id-ID')}, Admin: Rp ${adminFee.toLocaleString('id-ID')}, Infaq+Kode: Rp ${(Number(infaq) + Number(uniqueCode)).toLocaleString('id-ID')})`;

      const dbEntries = journalEntries.map(e => ({
        date: new Date().toISOString().split('T')[0],
        description: journalDesc,
        reference_no: refNo,
        account_code: e.account_code,
        debit: e.debit,
        credit: e.credit
      }));

      await supabaseAdmin.from('journal_entries').insert(dbEntries);

    } else if (paymentType === 'installment') {
      const metadata = verification.metadata || {};
      const { schedule_id, contract_id } = metadata;
      
      // Update financing_schedule
      if (schedule_id) {
        await supabaseAdmin.from('financing_schedules').update({
          status: 'paid',
          paid_at: new Date().toISOString()
        }).eq('id', schedule_id);
      }
      
      // Journal entry for installment
      const journalEntries = [
        { account_code: COA.CASH_IN_BANK, debit: totalPaid, credit: 0 },
        { account_code: COA.RECEIVABLE_MURABAHAH, debit: 0, credit: amount } // Simple mapping, should ideally split principal and margin
      ];
      
      if (adminFee > 0) journalEntries.push({ account_code: COA.INCOME_SERVICE_FEE, debit: 0, credit: adminFee });
      if (Number(infaq) > 0) journalEntries.push({ account_code: COA.ZISWAF, debit: 0, credit: Number(infaq) });
      if (Number(uniqueCode) > 0) journalEntries.push({ account_code: COA.DANA_KEBAJIKAN, debit: 0, credit: Number(uniqueCode) });

      const journalDesc = `[VERIFIED TRANSFER] Pembayaran Angsuran Pembiayaan (Ref: ${refNo})`;

      const dbEntries = journalEntries.map(e => ({
        date: new Date().toISOString().split('T')[0],
        description: journalDesc,
        reference_no: refNo,
        account_code: e.account_code,
        debit: e.debit,
        credit: e.credit
      }));

      await supabaseAdmin.from('journal_entries').insert(dbEntries);

    } else {
      // 2. Find or Create target savings account (SINGLE DEPOSIT MODE)
      let { data: account, error: accErr } = await supabase
        .from('savings_accounts')
        .select('*')
        .eq('member_id', memberId)
        .eq('account_type', targetAccountType)
        .maybeSingle();

      let accountId = account?.id;

      if (!account) {
        const prefix = targetAccountType === 'pokok' ? '11' 
          : targetAccountType === 'wajib' ? '12' 
          : targetAccountType === 'wadiah' ? '21' 
          : targetAccountType === 'haji' ? '31'
          : targetAccountType === 'umrah' ? '32'
          : '22';
        const randomSuffix = Math.floor(10000000 + Math.random() * 90000000).toString();
        const accountNum = `${prefix}${randomSuffix}`;

        const { data: newAcc, error: createAccErr } = await supabase
          .from('savings_accounts')
          .insert({
            member_id: memberId,
            account_number: accountNum,
            account_type: targetAccountType,
            balance: 0
          })
          .select()
          .single();

        if (createAccErr) throw new Error(`Gagal membuat rekening baru: ${createAccErr.message} ${JSON.stringify(createAccErr)}`);
        accountId = newAcc.id;
        account = newAcc;
      }

      // 3. Record Transaction Log
      const { error: txErr } = await supabase
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
      const { error: balanceErr } = await supabase
        .from('savings_accounts')
        .update({ balance: newBalance })
        .eq('id', accountId);

      if (balanceErr) throw new Error('Gagal memperbarui saldo.');

      // 5. Post Journals (SAK EP)
      let creditAccount = COA.SAVINGS_WADIAH; // 201.01
      if (targetAccountType === 'pokok') creditAccount = COA.MEMBER_CAPITAL_PRINCIPAL; // 301.01
      else if (targetAccountType === 'wajib') creditAccount = COA.MEMBER_CAPITAL_MANDATORY; // 301.02
      else if (targetAccountType === 'mudharabah') creditAccount = COA.SAVINGS_MUDHARABAH; // 201.02
      else if (targetAccountType === 'haji') creditAccount = COA.SAVINGS_HAJI; // 201.03
      else if (targetAccountType === 'umrah') creditAccount = COA.SAVINGS_UMRAH; // 201.04

      const journalEntries = [
        { account_code: COA.CASH_IN_BANK, debit: totalPaid, credit: 0 },
        { account_code: creditAccount, debit: 0, credit: amount }
      ];

      if (adminFee > 0) journalEntries.push({ account_code: COA.INCOME_SERVICE_FEE, debit: 0, credit: adminFee });
      if (Number(infaq) > 0) journalEntries.push({ account_code: COA.ZISWAF, debit: 0, credit: Number(infaq) });
      if (Number(uniqueCode) > 0) journalEntries.push({ account_code: COA.DANA_KEBAJIKAN, debit: 0, credit: Number(uniqueCode) });

      const typeLabels: Record<string, string> = { principal: 'Simpanan Pokok', mandatory: 'Simpanan Wajib', voluntary: 'Simpanan Sukarela' };
      const journalDesc = `[VERIFIED TRANSFER] Pembayaran ${typeLabels[paymentType] || paymentType} (Tenor/Pokok: Rp ${amount.toLocaleString('id-ID')}, Admin: Rp ${adminFee.toLocaleString('id-ID')}, Infaq+Kode: Rp ${(Number(infaq) + Number(uniqueCode)).toLocaleString('id-ID')})`;

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

    const typeLabels: Record<string, string> = {
      principal: 'Simpanan Pokok',
      mandatory: 'Simpanan Wajib',
      wadiah: 'Simpanan Wadiah'
    };

    // 8. Notify Member
    await supabaseAdmin.from('notifications').insert({
      user_id: memberId,
      type: 'success',
      message: `Alhamdulillah, setoran ${typeLabels[paymentType] || 'Simpanan'} Anda sebesar Rp ${totalPaid.toLocaleString('id-ID')} telah sukses dikonfirmasi oleh Admin.`
    });

    return NextResponse.json({ success: true, message: 'Verifikasi berhasil diproses!' });

  } catch (error: any) {
    console.error("CS Verify Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
