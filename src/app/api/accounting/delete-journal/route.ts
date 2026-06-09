import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

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

    // Verify role
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileErr || !profile || !['accounting', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Akses ditolak. Hanya peran Accounting atau Super Admin yang dapat menghapus jurnal.' }, { status: 403 });
    }

    const { referenceNo } = await request.json();

    if (!referenceNo) {
      return NextResponse.json({ error: 'Nomor referensi jurnal harus disertakan.' }, { status: 400 });
    }

    // 1. Tangani pencairan pembiayaan (disbursement) jika No Referensi berawalan "CAIR-"
    if (referenceNo.startsWith('CAIR-')) {
      const { data: stx } = await supabaseAdmin
        .from('savings_transactions')
        .select('account_id, amount')
        .ilike('reference_no', `${referenceNo}%`)
        .maybeSingle();

      let memberId = null;
      let amount = null;
      if (stx) {
        amount = stx.amount;
        const { data: acc } = await supabaseAdmin
          .from('savings_accounts')
          .select('member_id')
          .eq('id', stx.account_id)
          .single();
        if (acc) memberId = acc.member_id;
      }

      if (!amount) {
        const { data: je } = await supabaseAdmin
          .from('journal_entries')
          .select('debit, credit')
          .eq('reference_no', referenceNo)
          .limit(1)
          .maybeSingle();
        if (je) {
          amount = je.debit || je.credit;
        }
      }

      if (amount) {
        let contractQuery = supabaseAdmin
          .from('financing_contracts')
          .select('id')
          .eq('status', 'active')
          .eq('amount', amount);
        
        if (memberId) {
          contractQuery = contractQuery.eq('member_id', memberId);
        }
        
        const { data: matchingContracts } = await contractQuery;
        
        if (matchingContracts && matchingContracts.length > 0) {
          const contractId = matchingContracts[0].id;
          
          await supabaseAdmin
            .from('financing_contracts')
            .update({ status: 'approved' })
            .eq('id', contractId);
            
          await supabaseAdmin
            .from('financing_schedules')
            .delete()
            .eq('contract_id', contractId);
        }
      }
    }

    // 2. Ambil data verifikasi setoran untuk mencari schedule_id yang mungkin terkait (jika pembayaran angsuran via CS)
    const { data: verification } = await supabaseAdmin
      .from('deposit_verifications')
      .select('*')
      .eq('reference_no', referenceNo)
      .maybeSingle();

    if (verification) {
      if (verification.metadata) {
        const metadata = verification.metadata as any;
        const { schedule_id } = metadata;
        if (schedule_id) {
          await supabaseAdmin
            .from('financing_schedules')
            .update({ status: 'unpaid', paid_at: null })
            .eq('id', schedule_id);
        }
      }
      
      await supabaseAdmin
        .from('deposit_verifications')
        .update({ status: 'pending', verified_by: null, verified_at: null })
        .eq('reference_no', referenceNo);
    }

    // 3. Kembalikan status pengajuan penarikan tunai menjadi 'approved' jika ada
    await supabaseAdmin
      .from('withdrawal_requests')
      .update({ status: 'approved' })
      .eq('reference_no', referenceNo);

    // 4. Koreksi saldo tabungan anggota dan hapus transaksi terkait di savings_transactions
    const { data: txs } = await supabaseAdmin
      .from('savings_transactions')
      .select('*')
      .ilike('reference_no', `${referenceNo}%`);

    if (txs && txs.length > 0) {
      for (const tx of txs) {
        const { data: account } = await supabaseAdmin
          .from('savings_accounts')
          .select('balance')
          .eq('id', tx.account_id)
          .single();
        
        if (account) {
          let newBalance = Number(account.balance || 0);
          if (tx.transaction_type === 'deposit') {
            newBalance -= Number(tx.amount || 0);
          } else if (tx.transaction_type === 'withdrawal') {
            newBalance += Number(tx.amount || 0);
          }
          
          await supabaseAdmin
            .from('savings_accounts')
            .update({ balance: newBalance })
            .eq('id', tx.account_id);
        }
      }
      
      await supabaseAdmin
        .from('savings_transactions')
        .delete()
        .ilike('reference_no', `${referenceNo}%`);
    }

    // 5. Terakhir, hapus entri jurnal di journal_entries
    const { error: deleteErr } = await supabaseAdmin
      .from('journal_entries')
      .delete()
      .eq('reference_no', referenceNo);

    if (deleteErr) {
      console.error('Failed to delete journal entries:', deleteErr);
      return NextResponse.json({ error: 'Gagal menghapus jurnal di database: ' + deleteErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Seluruh entri jurnal dan data transaksi terkait dengan referensi ${referenceNo} berhasil dihapus/direvert.` });
  } catch (error: any) {
    console.error('Error deleting journal:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan internal server: ' + error.message }, { status: 500 });
  }
}
