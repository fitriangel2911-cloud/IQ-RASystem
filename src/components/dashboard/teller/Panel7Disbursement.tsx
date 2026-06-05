'use client';
import React, { useState, useEffect } from 'react';
import { COA } from '@/lib/constants/coa';
import { createClient } from '@/lib/supabase/client';
import Modal from '../Modal';

interface Member {
  id: string;
  user_id: string;
  nik: string;
  phone_number?: string;
  users?: { full_name: string; email: string };
  savings_accounts?: any[];
}

interface Contract {
  id: string;
  type: string;
  amount: number;
  tenor_months: number;
  margin_ratio: number;
  status: string;
  approved_by?: string;
  created_at: string;
}

interface Panel7Props {
  selectedMember: Member | null;
  tellerName: string;
  onSuccess: () => void;
}

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  murabahah: 'Pembiayaan Murabahah (Jual Beli)',
  mudharabah: 'Pembiayaan Mudharabah (Bagi Hasil)',
  musyarakah: 'Pembiayaan Musyarakah (Modal Bersama)',
  ijarah: 'Pembiayaan Ijarah (Sewa)',
  istishna: "Pembiayaan Istishna' (Pesan Bangun)",
  qardhul_hasan: 'Qardhul Hasan (Pinjaman Kebajikan)',
};

export default function Panel7Disbursement({ selectedMember, tellerName, onSuccess }: Panel7Props) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);
  
  // New: Transaction Method
  const [transactionMethod, setTransactionMethod] = useState<'tunai' | 'transfer'>('tunai');

  useEffect(() => {
    if (!selectedMember) return;
    const fetchContracts = async () => {
      setLoadingContracts(true);
      const supabase = createClient();
      // Fetch ONLY APPROVED contracts ready to be disbursed
      const { data } = await supabase
        .from('financing_contracts')
        .select('*')
        .eq('member_id', selectedMember.user_id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
        
      setContracts(data || []);
      setLoadingContracts(false);
    };
    fetchContracts();
  }, [selectedMember]);

  const handleDisburse = async (contract: Contract) => {
    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Pencairan',
      message: `Apakah Anda yakin ingin mencairkan dana sebesar ${fmt(contract.amount)} untuk kontrak ini? Dana akan keluar dari Laci Kas Teller.`,
      onConfirm: () => executeDisburse(contract)
    });
  };

  const executeDisburse = async (contract: Contract) => {
    setConfirmModal(null);
    setLoading(true);
    setMessage(null);

    try {
      const memberName = selectedMember?.users?.full_name || 'Anggota';
      const refNo = `CAIR-${Date.now()}`;
      
      const debitAccount = contract.type === 'qardhul_hasan' ? COA.RECEIVABLE_QARDH : COA.RECEIVABLE_MURABAHAH; // Map to correct COA
      
      let creditAccount = COA.CASH_ON_HAND;
      let targetAccId = '';
      
      const supabase = createClient();

      if (transactionMethod === 'transfer') {
        creditAccount = COA.SAVINGS_WADIAH; // 201.01
        
        // Find or create Wadiah account for the member
        let wadiahAcc = selectedMember?.savings_accounts?.find((a: any) => a.account_type === 'wadiah');
        
        if (!wadiahAcc) {
          const randNum = Math.floor(1000000000 + Math.random() * 9000000000).toString();
          const { data: newAcc, error: createErr } = await supabase
            .from('savings_accounts')
            .insert({
              member_id: selectedMember!.user_id,
              account_number: randNum,
              account_type: 'wadiah',
              balance: 0,
            })
            .select()
            .single();

          if (createErr) throw new Error('Gagal membuat rekening Wadiah otomatis untuk pencairan transfer.');
          targetAccId = newAcc.id;
          wadiahAcc = newAcc;
        } else {
          targetAccId = wadiahAcc.id;
        }

        // Add funds to the savings account
        const currentBalance = Number(wadiahAcc.balance || 0);
        const { error: balanceErr } = await supabase
          .from('savings_accounts')
          .update({ balance: currentBalance + contract.amount })
          .eq('id', targetAccId);
          
        if (balanceErr) throw balanceErr;

        // Log mutation in savings_transactions
        await supabase.from('savings_transactions').insert([{
          account_id: targetAccId,
          transaction_type: 'deposit',
          amount: contract.amount,
          reference_no: refNo
        }]);
      }
      
      const entries = [
        { account_code: debitAccount, debit: contract.amount, credit: 0 }, // Tambah Piutang Pembiayaan Anggota
        { account_code: creditAccount, debit: 0, credit: contract.amount } // Kurangi Kas Teller ATAU Tambah Saldo Wadiah (Kredit)
      ];

      // 1. Post to Journal
      const res = await fetch('/api/accounting/record-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          description: `[TELLER: ${tellerName}] PENCAIRAN PEMBIAYAAN ${CONTRACT_TYPE_LABELS[contract.type] || contract.type} - ${memberName} (${transactionMethod === 'transfer' ? 'Via Transfer Wadiah' : 'Via Tunai'})`,
          entries,
          reference_no: refNo,
          member_id: selectedMember!.user_id,
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mencatat jurnal pencairan');

      // 2. Update Contract Status to 'active'
      const { error: updateError } = await supabase
        .from('financing_contracts')
        .update({ status: 'active' })
        .eq('id', contract.id);
        
      if (updateError) throw updateError;

      // 3. Generate Financing Schedules (Amortization)
      if (contract.tenor_months > 0) {
        const principalPerMonth = Math.floor(contract.amount / contract.tenor_months);
        const marginAmount = Math.floor(contract.amount * contract.margin_ratio);
        const marginPerMonth = Math.floor(marginAmount / contract.tenor_months);
        
        const schedules = [];
        for (let i = 1; i <= contract.tenor_months; i++) {
          const dueDate = new Date();
          dueDate.setMonth(dueDate.getMonth() + i);
          
          schedules.push({
            contract_id: contract.id,
            member_id: selectedMember!.user_id,
            installment_number: i,
            due_date: dueDate.toISOString().split('T')[0],
            principal_amount: principalPerMonth,
            margin_amount: marginPerMonth,
            total_installment: principalPerMonth + marginPerMonth,
            status: 'pending'
          });
        }
        
        const { error: scheduleError } = await supabase
          .from('financing_schedules')
          .insert(schedules);
          
        if (scheduleError) {
          console.error("Gagal membuat jadwal angsuran:", scheduleError);
          // Don't throw, allow disbursement to succeed but log error
        }
      }

      // Print Slip
      const win = window.open('', '_blank', 'width=380,height=600');
      if (win) {
        win.document.write(`
          <html><head><title>Bukti Pencairan</title>
          <style>body{font-family:'Courier New',monospace;font-size:13px;padding:16px;max-width:300px;margin:0 auto;}.center{text-align:center;}.bold{font-weight:bold;}.line{border-top:1px dashed #000;margin:8px 0;}.row{display:flex;justify-content:space-between;margin:4px 0;}.title{font-size:18px;font-weight:bold;text-align:center;margin:8px 0;}</style>
          </head><body>
          <div class="title">KOPERASI SYARIAH IQ-RA</div>
          <div class="center">Bukti Pencairan Pembiayaan</div>
          <div class="line"></div>
          <div class="row"><span>Tanggal</span><span>${new Date().toLocaleDateString('id-ID')}</span></div>
          <div class="row"><span>No. Ref</span><span>${refNo}</span></div>
          <div class="row"><span>Petugas</span><span>${tellerName}</span></div>
          <div class="line"></div>
          <div class="row"><span>Nama</span><span>${memberName}</span></div>
          <div class="row"><span>NIK</span><span>${selectedMember?.nik}</span></div>
          <div class="row"><span>Metode</span><span>${transactionMethod === 'transfer' ? 'Transfer ke Rekening' : 'Uang Tunai'}</span></div>
          <div class="row"><span>Jenis Akad</span><span>${contract.type.toUpperCase()}</span></div>
          <div class="line"></div>
          <div class="row bold"><span>NOMINAL CAIR</span><span>${fmt(contract.amount)}</span></div>
          <div class="row"><span>Tenor</span><span>${contract.tenor_months} bln</span></div>
          <div class="line"></div>
          <div class="center">Dana telah diterima oleh nasabah.</div>
          <div class="center">Terima kasih.</div>
          <script>window.print();window.close();</script>
          </body></html>
        `);
        win.document.close();
      }

      setMessage({ type: 'success', text: `Pencairan dana ${fmt(contract.amount)} berhasil dan status kontrak telah menjadi Aktif!` });
      // Remove the contract from the local list since it's now active
      setContracts(prev => prev.filter(c => c.id !== contract.id));
      onSuccess();
    } catch (err: any) {
      setMessage({ type: 'error', text: `ERROR: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  if (!selectedMember) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '2px dashed rgba(52,211,153,0.3)', borderRadius: '20px', padding: '80px', textAlign: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '15px' }}>Pilih anggota di Panel [2] Cari Anggota terlebih dahulu untuk melihat antrean pencairan dananya.</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <div style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border-primary)', borderRadius: '16px', padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#34d399', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Otorisasi Pencairan Dana (Disbursement)
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
          Daftar di bawah ini adalah pengajuan pembiayaan milik <strong>{selectedMember.users?.full_name}</strong> yang <strong>sudah disetujui (Approved)</strong> oleh Manajer/Komite dan siap untuk dicairkan uangnya oleh Teller.
        </p>
      </div>

      {/* Transaction Method */}
      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 900, color: '#cca334', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Metode Pencairan</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          {([
            { value: 'tunai', label: 'Tunai (Kas Laci Teller)', color: '#4ade80' },
            { value: 'transfer', label: 'Transfer ke Rekening Wadiah Nasabah', color: '#60a5fa' },
          ] as const).map(opt => (
            <button key={opt.value} type="button" onClick={() => setTransactionMethod(opt.value)} style={{
              flex: 1, padding: '16px 12px', borderRadius: '12px', fontWeight: 800, fontSize: '15px', cursor: 'pointer',
              background: transactionMethod === opt.value ? `${opt.color}18` : 'var(--border-primary)',
              border: `2px solid ${transactionMethod === opt.value ? opt.color : 'transparent'}`,
              color: transactionMethod === opt.value ? opt.color : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}>{opt.label}</button>
          ))}
        </div>
      </div>

      {message && (
        <div style={{
          padding: '16px 20px', borderRadius: '12px', fontWeight: 800, fontSize: '15px',
          background: message.type === 'success' ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1.5px solid ${message.type === 'success' ? '#4ade80' : '#ef4444'}`,
          color: message.type === 'success' ? '#4ade80' : '#fca5a5'
        }}>
          {message.text}
        </div>
      )}

      {loadingContracts ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 700 }}>Memeriksa antrean pencairan...</div>
      ) : contracts.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-primary)', borderRadius: '16px' }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>📁</div>
          <div style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: 700 }}>
            Tidak ada kontrak dengan status &apos;Approved&apos; yang menunggu pencairan untuk anggota ini.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {contracts.map(contract => (
            <div key={contract.id} style={{ 
              background: 'linear-gradient(135deg, rgba(52,211,153,0.05) 0%, rgba(10,185,129,0.02) 100%)', 
              border: '2px solid #34d399', 
              borderRadius: '16px', 
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 900, color: 'var(--text-secondary)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Jenis Akad / Kontrak
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)' }}>
                    {CONTRACT_TYPE_LABELS[contract.type] || contract.type}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', fontFamily: 'monospace' }}>
                    ID: {contract.id}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', fontWeight: 900, color: 'var(--text-secondary)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Nominal Disetujui
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#34d399' }}>
                    {fmt(contract.amount)}
                  </div>
                </div>
              </div>

              <div style={{ height: '1px', background: 'rgba(52,211,153,0.2)' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800 }}>Tenor Pinjaman</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 800 }}>{contract.tenor_months} Bulan</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800 }}>Margin / Bagi Hasil</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 800 }}>{(contract.margin_ratio * 100).toFixed(1)}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 800 }}>Disetujui Tanggal</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 800 }}>{new Date(contract.created_at).toLocaleDateString('id-ID')}</div>
                  </div>
                </div>

                <button 
                  onClick={() => handleDisburse(contract)}
                  disabled={loading}
                  style={{
                    background: loading ? 'gray' : (transactionMethod === 'transfer' ? '#3b82f6' : '#10b981'),
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 900,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: transactionMethod === 'transfer' ? '0 8px 20px rgba(59,130,246,0.3)' : '0 8px 20px rgba(16,185,129,0.3)',
                    transition: 'transform 0.2s',
                    textTransform: 'uppercase'
                  }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {loading ? 'MEMPROSES...' : (transactionMethod === 'transfer' ? '🏦 Transfer Dana' : '💸 Cairkan Tunai')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmModal && (
        <Modal
          isOpen={confirmModal.isOpen}
          type="confirm"
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}
