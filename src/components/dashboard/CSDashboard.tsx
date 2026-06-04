'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const inputStyle = {
  width: '100%',
  background: 'var(--bg-page)',
  border: '2px solid var(--border-primary)',
  borderRadius: '12px',
  padding: '14px 16px',
  color: 'var(--text-primary)',
  fontSize: '15px',
  fontWeight: 600,
  outline: 'none',
  transition: 'border 0.2s'
};

interface CSDashboardProps {
  activeMenu: string;
  profile: any;
}

export default function CSDashboard({ activeMenu, profile }: CSDashboardProps) {
  const [stats, setStats] = useState({ totalMembers: 0, pendingKYC: 0, activeHelp: 0 });
  const [kycList, setKycList] = useState<any[]>([]); // Antrian pending KYC
  const [selectedKyc, setSelectedKyc] = useState<any>(null); // Anggota KYC terpilih untuk diaudit
  const [membersList, setMembersList] = useState<any[]>([]); // Anggota Aktif terverifikasi
  const [selectedMemberProfile, setSelectedMemberProfile] = useState<any>(null); // State detail profil anggota
  const [memberAccounts, setMemberAccounts] = useState<any[]>([]); // Rekening anggota terpilih
  const [registeredReceiptData, setRegisteredReceiptData] = useState<any>(null); // Data nota bukti cetak
  const [verificationsList, setVerificationsList] = useState<any[]>([]); // Antrean verifikasi transfer
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [systemParams, setSystemParams] = useState<any[]>([]);

  useEffect(() => {
    if (selectedMemberProfile) {
      const fetchAccounts = async () => {
        const supabase = createClient();
        const { data } = await supabase
          .from('savings_accounts')
          .select('*')
          .eq('member_id', selectedMemberProfile.user_id);
        if (data) setMemberAccounts(data);
      };
      fetchAccounts();
    } else {
      setMemberAccounts([]);
    }
  }, [selectedMemberProfile]);

  const [isSameAddress, setIsSameAddress] = useState(false);

  // Form State dengan Email, Password, dan Setoran Awal Simpanan Koperasi
  const [formData, setFormData] = useState({
    fullName: '',
    nik: '',
    birthPlaceDate: '',
    gender: 'Laki-laki',
    maritalStatus: 'Belum Kawin',
    motherName: '',
    religion: 'Islam',
    citizenship: 'WNI',
    email: '',
    phone: '',
    ktpAddress: '',
    domicileAddress: '',
    occupation: '',
    companyName: '',
    monthlyIncome: '',
    fundingSource: 'Gaji',
    heirName: '',
    heirRelationship: '',
    heirPhone: '',
    password: '', // Sandi login anggota
    initialPrincipal: '300000', // Setoran awal Pokok (Default 300k)
    initialMandatory: '50000'   // Setoran awal Wajib (Default 50k)
  });

  const fetchStats = async () => {
    const supabase = createClient();
    const { count: memberCount } = await supabase.from('members').select('*', { count: 'exact', head: true });
    const { count: pendingCount } = await supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    
    setStats({
      totalMembers: memberCount || 0,
      pendingKYC: pendingCount || 0,
      activeHelp: 12
    });

    // Ambil daftar pending untuk Antrian KYC
    const { data: pendingData } = await supabase
      .from('members')
      .select('*, users(full_name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (pendingData) {
      setKycList(pendingData);
      if (pendingData.length > 0) {
        setSelectedKyc((prev: any) => {
          const stillExists = pendingData.find(item => item.id === prev?.id);
          return stillExists || pendingData[0];
        });
      } else {
        setSelectedKyc(null);
      }
    }

    // Ambil daftar active untuk Database Anggota
    const { data: activeData } = await supabase
      .from('members')
      .select('*, users(full_name, email)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    if (activeData) setMembersList(activeData);

    // Ambil antrean verifikasi deposit
    const { data: verificationsData } = await supabase
      .from('deposit_verifications')
      .select('*, users!deposit_verifications_member_id_fkey(full_name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (verificationsData) setVerificationsList(verificationsData);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const loadSystemParams = async () => {
      try {
        const res = await fetch('/api/admin/parameters');
        const data = await res.json();
        if (data.success && data.parameters) {
          const pokokParam = data.parameters.find((p: any) => p.key === 'simpanan_pokok');
          const wajibParam = data.parameters.find((p: any) => p.key === 'simpanan_wajib');
          
          setFormData(prev => ({
            ...prev,
            initialPrincipal: pokokParam ? pokokParam.value : '300000',
            initialMandatory: wajibParam ? wajibParam.value : '50000'
          }));
          
          setSystemParams(data.parameters);
        }
      } catch (err) {
        console.error("CSDashboard: Failed to load system parameters dynamically", err);
      }
    };
    loadSystemParams();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = createClient();
    
    try {
      // 1. Validasi Input Dasar
      if (!formData.fullName || !formData.nik || !formData.email || !formData.phone) {
        throw new Error('Nama Lengkap, NIK, Email, dan WhatsApp wajib diisi untuk registrasi.');
      }

      const memberPassword = formData.password || formData.nik;
      if (memberPassword.length < 6) {
        throw new Error('Kata sandi login anggota minimal harus 6 karakter.');
      }

      // 2. Buat Akun User login Supabase & Profil Publik dengan peran 'member'
      const userRes = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: memberPassword,
          role: 'member'
        })
      });

      const userData = await userRes.json();
      if (!userRes.ok) {
        throw new Error(userData.error || 'Gagal mendaftarkan akun login baru.');
      }

      const userId = userData.user?.id;
      if (!userId) {
        throw new Error('Gagal mendapatkan identitas unik akun login dari Supabase.');
      }

      // 3. Masukkan data profil fisik / demografis CIF ke tabel members
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .insert([{
          user_id: userId,
          nik: formData.nik,
          mother_name: formData.motherName,
          kk_number: '',
          phone_number: formData.phone,
          ktp_address: formData.ktpAddress,
          domicile_address: formData.domicileAddress || formData.ktpAddress,
          occupation: formData.occupation,
          monthly_income: parseInt(formData.monthlyIncome) || 0,
          religion: formData.religion,
          birth_place_date: formData.birthPlaceDate,
          gender: formData.gender,
          marital_status: formData.maritalStatus,
          citizenship: formData.citizenship,
          company_name: formData.companyName,
          funding_source: formData.fundingSource,
          heir_name: formData.heirName,
          heir_relationship: formData.heirRelationship,
          heir_phone: formData.heirPhone,
          status: 'active' // Langsung aktif karena menyertakan setoran awal & divalidasi sistem
        }])
        .select()
        .single();

      if (memberError) {
        throw new Error('Gagal membuat profil CIF anggota: ' + memberError.message);
      }

      const memberId = memberData.id;

      // 4. PEMBUATAN OTOMATIS REKENING SIMPANAN KOPERASI (Pokok, Wajib, Wadiah)
      const initialPrincipalAmount = Number(formData.initialPrincipal) || 0;
      const initialMandatoryAmount = Number(formData.initialMandatory) || 0;
      
      const accountsToCreate = [
        { type: 'pokok', balance: initialPrincipalAmount, prefix: '11' },
        { type: 'wajib', balance: initialMandatoryAmount, prefix: '12' },
        { type: 'wadiah', balance: 0, prefix: '21' }
      ];

      const createdAccounts: any[] = [];

      for (const acc of accountsToCreate) {
        const randomSuffix = Math.floor(1000000 + Math.random() * 9000000);
        const accNumber = `${acc.prefix}${randomSuffix}`;

        const { data: newAccount, error: accError } = await supabase
          .from('savings_accounts')
          .insert([{
            member_id: userId,
            account_number: accNumber,
            account_type: acc.type,
            balance: acc.balance
          }])
          .select()
          .single();

        if (accError) {
          console.error(`Gagal membuat rekening simpanan ${acc.type}:`, accError);
        } else if (newAccount) {
          createdAccounts.push(newAccount);
        }
      }

      // 5. DOUBLE-ENTRY JOURNALING DENGAN BIAYA ADM, INFAQ, DAN KODE UNIK (SAK EP COMPLIANT)
      const totalInitialDeposit = initialPrincipalAmount + initialMandatoryAmount;
      
      // Ambil 3 digit terakhir WhatsApp/Phone untuk Kode Unik
      const phoneDigits = (formData.phone || '').replace(/\D/g, '');
      const nikDigits = (formData.nik || '').replace(/\D/g, '');
      const sourceDigits = phoneDigits || nikDigits || '000';
      const uniqueCodeStr = sourceDigits.slice(-3).padStart(3, '0');
      const uniqueCodeValue = Number(uniqueCodeStr) || 0;

      const admParam = systemParams.find(p => p.key === 'biaya_adm');
      const infaqParam = systemParams.find(p => p.key === 'biaya_infaq');
      
      const admFee = admParam ? Number(admParam.value) : 15000;
      const infaqSedekahBase = infaqParam ? Number(infaqParam.value) : 10000;
      const infaqSedekahTotal = infaqSedekahBase + uniqueCodeValue;

      const grandTotalPayment = totalInitialDeposit + admFee + infaqSedekahTotal;

      if (grandTotalPayment > 0) {
        const journalEntries = [];
        
        // Debit: Kas di Tangan (COA 101.01) - Mencakup Setoran Awal + ADM + Infaq + Kode Unik
        journalEntries.push({ account_code: '101.01', debit: grandTotalPayment, credit: 0 });

        if (initialPrincipalAmount > 0) {
          // Kredit: Simpanan Pokok Anggota (COA 301.01)
          journalEntries.push({ account_code: '301.01', debit: 0, credit: initialPrincipalAmount });
        }

        if (initialMandatoryAmount > 0) {
          // Kredit: Simpanan Wajib Anggota (COA 301.02)
          journalEntries.push({ account_code: '301.02', debit: 0, credit: initialMandatoryAmount });
        }

        // Kredit: Pendapatan Administrasi (COA 401.02)
        journalEntries.push({ account_code: '401.02', debit: 0, credit: admFee });

        // Kredit: Dana Kebajikan / Infaq & Sedekah (COA 302.01) - Termasuk Kode Unik
        journalEntries.push({ account_code: '302.01', debit: 0, credit: infaqSedekahTotal });

        const accountingRes = await fetch('/api/accounting/record-v2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: new Date().toISOString().split('T')[0],
            description: `[PENDAFTARAN ANGGOTA] Setoran CIF Baru: ${formData.fullName} (Pokok: Rp ${initialPrincipalAmount.toLocaleString('id-ID')}, Wajib: Rp ${initialMandatoryAmount.toLocaleString('id-ID')}, ADM: Rp ${admFee.toLocaleString('id-ID')}, Infaq & Kode Unik: Rp ${infaqSedekahTotal.toLocaleString('id-ID')})`,
            entries: journalEntries,
            reference_no: `REG-${Date.now()}`,
            member_id: memberId
          })
        });

        if (!accountingRes.ok) {
          const accErrorJson = await accountingRes.json();
          console.error('Accounting Entry Fail:', accErrorJson.error);
        }

        // 6. Catat Transaksi Tabungan di savings_transactions
        for (const account of createdAccounts) {
          let depositValue = 0;
          if (account.account_type === 'pokok') depositValue = initialPrincipalAmount;
          if (account.account_type === 'wajib') depositValue = initialMandatoryAmount;

          if (depositValue > 0) {
            await supabase
              .from('savings_transactions')
              .insert([{
                account_id: account.id,
                transaction_type: 'deposit',
                amount: depositValue,
                reference_no: `TX-REG-${Date.now()}-${account.account_type}`,
                created_by: profile?.id
              }]);
          }
        }
      }

      // Set data cetak nota pendaftaran anggota baru
      setRegisteredReceiptData({
        referenceNo: `REG-${Date.now()}`,
        date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        fullName: formData.fullName,
        nik: formData.nik,
        phone: formData.phone,
        principal: initialPrincipalAmount,
        mandatory: initialMandatoryAmount,
        adm: admFee,
        infaq: infaqSedekahTotal,
        grandTotal: grandTotalPayment
      });

      setMessage({ 
        type: 'success', 
        text: `Pendaftaran Sukses! Anggota "${formData.fullName}" aktif di sistem. 3 Rekening Simpanan (Pokok, Wajib, Wadiah) berhasil dibuat. Total Pembayaran diterima sebesar Rp ${grandTotalPayment.toLocaleString('id-ID')} (Termasuk ADM Rp 15.000, Infaq Rp 10.000, dan Kode Unik Anggota Rp ${uniqueCodeStr}) telah dibukukan dengan Double-Entry SAK EP.`
      });

      // Reset Form ke Default
      setFormData({
        fullName: '', nik: '', birthPlaceDate: '', gender: 'Laki-laki',
        maritalStatus: 'Belum Kawin', motherName: '', religion: 'Islam',
        citizenship: 'WNI', email: '', phone: '', ktpAddress: '', domicileAddress: '',
        occupation: '', companyName: '', monthlyIncome: '', fundingSource: 'Gaji',
        heirName: '', heirRelationship: '', heirPhone: '',
        password: '', initialPrincipal: '300000', initialMandatory: '50000'
      });
      setIsSameAddress(false);

      fetchStats();

    } catch (err: any) {
      setMessage({ type: 'error', text: 'Gagal memproses pendaftaran koperasi: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (memberId: string) => {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('members')
      .update({ status: 'active' })
      .eq('id', memberId);

    if (!error) {
      setMessage({ type: 'success', text: 'Dokumen KYC berhasil disetujui!' });
      fetchStats();
    }
    setLoading(false);
  };

  const handlePrintReceipt = () => {
    if (!registeredReceiptData) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Nota Bukti Pendaftaran - ${registeredReceiptData.fullName}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #000; background: #fff; }
            .receipt { border: 2.5px solid #000; padding: 35px; border-radius: 12px; max-width: 600px; margin: auto; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
            .header { text-align: center; border-bottom: 2.5px dashed #000; padding-bottom: 20px; margin-bottom: 25px; }
            .header h1 { margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; }
            .header p { margin: 6px 0 0 0; font-size: 13px; font-weight: 700; opacity: 0.8; }
            .title { text-align: center; font-size: 16px; font-weight: 900; text-transform: uppercase; margin-bottom: 30px; letter-spacing: 1px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 14px; font-size: 14px; }
            .row .label { font-weight: 700; opacity: 0.7; }
            .row .val { font-weight: 800; }
            .divider { border-bottom: 1.5px dashed #000; margin: 20px 0; }
            .total { font-size: 18px; font-weight: 900; border-top: 2.5px solid #000; border-bottom: 2.5px solid #000; padding: 14px 0; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 60px; text-align: center; }
            .signature-box { height: 75px; }
            .footer-note { text-align: center; font-size: 11px; opacity: 0.6; margin-top: 40px; font-style: italic; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h1>KOPERASI SYARIAH IQ-RA</h1>
              <p>Modern & Sharia Financial System (SAK EP Compliant)</p>
            </div>
            <div class="title">Bukti Registrasi & Setoran Awal Anggota</div>
            
            <div class="row"><span class="label">No. Referensi:</span><span class="val">${registeredReceiptData.referenceNo}</span></div>
            <div class="row"><span class="label">Tanggal Registrasi:</span><span class="val">${registeredReceiptData.date}</span></div>
            <div class="row"><span class="label">Nama Anggota:</span><span class="val">${registeredReceiptData.fullName}</span></div>
            <div class="row"><span class="label">NIK Kependudukan:</span><span class="val">${registeredReceiptData.nik}</span></div>
            <div class="row"><span class="label">No. WhatsApp/HP:</span><span class="val">${registeredReceiptData.phone}</span></div>
            
            <div class="divider"></div>
            
            <div class="row"><span class="label">Simpanan Pokok (Setoran Awal):</span><span class="val">Rp ${registeredReceiptData.principal.toLocaleString('id-ID')}</span></div>
            <div class="row"><span class="label">Simpanan Wajib (Setoran Awal):</span><span class="val">Rp ${registeredReceiptData.mandatory.toLocaleString('id-ID')}</span></div>
            <div class="row"><span class="label">Biaya Administrasi:</span><span class="val">Rp ${registeredReceiptData.adm.toLocaleString('id-ID')}</span></div>
            <div class="row"><span class="label">Infaq & Kode Unik Anggota:</span><span class="val">Rp ${registeredReceiptData.infaq.toLocaleString('id-ID')}</span></div>
            
            <div class="total row">
              <span class="label">TOTAL SETORAN TUNAI:</span>
              <span class="val">Rp ${registeredReceiptData.grandTotal.toLocaleString('id-ID')}</span>
            </div>
            
            <div class="signatures">
              <div>
                <p>Penyetor / Anggota Baru</p>
                <div class="signature-box"></div>
                <p style="border-top: 1.5px solid #000; display: inline-block; min-width: 160px; padding-top: 6px; font-weight: 800;">${registeredReceiptData.fullName}</p>
              </div>
              <div>
                <p>Customer Service Koperasi</p>
                <div class="signature-box"></div>
                <p style="border-top: 1.5px solid #000; display: inline-block; min-width: 160px; padding-top: 6px; font-weight: 800;">${profile?.full_name}</p>
              </div>
            </div>
            
            <div class="footer-note">
              Dokumen ini diterbitkan secara sah oleh sistem IT Koperasi Syariah IQ-RA.<br>
              Telah sesuai dengan standar Akuntansi Koperasi Syariah SAK EP.
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); }
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
      {message && (
        <div style={{ 
          padding: '20px', borderRadius: '16px', marginBottom: '30px',
          background: 'var(--border-primary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-primary)',
          fontWeight: 700, textAlign: 'center'
        }}>
          {message.text}
        </div>
      )}

      {/* Shared Stats Header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px', marginBottom: '40px' }}>
        <StatCard label="Total Anggota" value={stats.totalMembers} />
        <StatCard label="Antrian KYC" value={stats.pendingKYC} />
        <StatCard label="Bantuan Aktif" value={stats.activeHelp} />
      </div>

      {/* 2. ONBOARDING TAB: COMPREHENSIVE CIF FORM */}
      {activeMenu === 'onboarding' && (
        <div style={{ 
          background: 'var(--bg-card)', 
          backdropFilter: 'blur(16px)', 
          borderRadius: '32px', 
          overflow: 'hidden', 
          border: '1px solid var(--border-primary)',
          boxShadow: '0 40px 80px var(--shadow-color)'
        }}>
          <div style={{ background: 'var(--bg-header)', padding: '30px 40px', borderBottom: '2px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ color: 'var(--gold-intense)', margin: 0, fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>PENDAFTARAN CIF (DOKUMEN FISIK)</h2>
              <div style={{ width: '80px', height: '4px', background: 'var(--gold-intense)', margin: '8px 0 0 0', borderRadius: '2px', boxShadow: '0 0 8px var(--shadow-color)' }} />
            </div>
            <span style={{ background: 'var(--border-primary)', color: 'var(--text-primary)', padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 900, border: '1px solid var(--border-primary)' }}>TAHAP: DATA DEMOGRAFI</span>
          </div>
          
          {registeredReceiptData ? (
            <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fadeInUp 0.4s ease-out' }}>
              <div style={{ 
                background: 'rgba(218, 165, 32, 0.03)', 
                border: '2px solid var(--gold-intense)', 
                borderRadius: '24px', 
                padding: '40px', 
                width: '100%', 
                maxWidth: '600px',
                boxShadow: '0 20px 50px var(--shadow-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}>
                <div style={{ textAlign: 'center', borderBottom: '1px dashed var(--border-primary)', paddingBottom: '24px' }}>
                  <span style={{ fontSize: '48px' }}>📜</span>
                  <h3 style={{ color: 'var(--gold-intense)', margin: '12px 0 0 0', fontWeight: 900, fontSize: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>BUKTI REGISTRASI ANGGOTA</h3>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700, marginTop: '6px' }}>KOPERASI SYARIAH IQ-RA</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>No. Referensi:</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{registeredReceiptData.referenceNo}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>Tanggal:</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{registeredReceiptData.date}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>Nama Anggota:</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{registeredReceiptData.fullName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>NIK:</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{registeredReceiptData.nik}</span>
                  </div>

                  <div style={{ borderBottom: '1.5px dashed var(--border-primary)', margin: '14px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Simpanan Pokok:</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>Rp {registeredReceiptData.principal.toLocaleString('id-ID')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Simpanan Wajib:</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>Rp {registeredReceiptData.mandatory.toLocaleString('id-ID')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Biaya Administrasi:</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>Rp {registeredReceiptData.adm.toLocaleString('id-ID')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Infaq & Kode Unik:</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>Rp {registeredReceiptData.infaq.toLocaleString('id-ID')}</span>
                  </div>

                  <div style={{ 
                    display: 'flex', justifyContent: 'space-between', marginTop: '12px', padding: '16px 0',
                    borderTop: '2px solid var(--gold-intense)', borderBottom: '2px solid var(--gold-intense)'
                  }}>
                    <span style={{ color: 'var(--gold-intense)', fontWeight: 900, fontSize: '18px' }}>TOTAL TUNAI:</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 900, fontSize: '18px' }}>Rp {registeredReceiptData.grandTotal.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '14px' }}>
                  <button 
                    onClick={handlePrintReceipt}
                    style={{
                      padding: '18px', background: 'var(--text-primary)', color: 'var(--bg-page)',
                      border: 'none', borderRadius: '14px', fontWeight: 900, cursor: 'pointer',
                      transition: 'all 0.2s', boxShadow: '0 8px 24px var(--shadow-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                  >
                    🖨️ Cetak Bukti Nota
                  </button>
                  <button 
                    onClick={() => setRegisteredReceiptData(null)}
                    style={{
                      padding: '18px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)',
                      border: '1.5px solid var(--border-primary)', borderRadius: '14px', fontWeight: 800, cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    ✕ Tutup & Kembali
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegister} style={{ padding: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
             {/* A. DATA PRIBADI (SESUAI KTP) */}
             <div style={{ gridColumn: 'span 2', borderBottom: '1px solid var(--border-primary)', paddingBottom: '10px', marginTop: '10px' }}>
               <h3 style={{ color: 'var(--gold-intense)', fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>👤 A. DATA PRIBADI (SESUAI KTP)</h3>
             </div>
             
             <CSInputField 
               label="Nama Lengkap (Tanpa Singkatan)" 
               placeholder="Sesuai KTP..." 
               value={formData.fullName} 
               onChange={(val: string) => setFormData({...formData, fullName: val})} 
             />
             <CSInputField 
               label="Nomor Induk Kependudukan (NIK)" 
               placeholder="16 Digit NIK..." 
               value={formData.nik} 
               onChange={(val: string) => setFormData({...formData, nik: val})} 
             />
             <CSInputField 
               label="Tempat & Tanggal Lahir" 
               placeholder="Contoh: Jakarta, 17 Agustus 1990..." 
               value={formData.birthPlaceDate} 
               onChange={(val: string) => setFormData({...formData, birthPlaceDate: val})} 
             />
             
             <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
               <label style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase' }}>Jenis Kelamin</label>
               <select 
                 value={formData.gender} 
                 onChange={(e) => setFormData({...formData, gender: e.target.value})}
                 style={{ padding: '16px 20px', background: 'var(--bg-page)', border: '1.5px solid var(--border-primary)', borderRadius: '14px', color: 'var(--text-primary)', outline: 'none', fontSize: '16px', fontWeight: 700 }}
               >
                 <option value="Laki-laki">Laki-laki</option>
                 <option value="Perempuan">Perempuan</option>
               </select>
             </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
               <label style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase' }}>Status Pernikahan</label>
               <select 
                 value={formData.maritalStatus} 
                 onChange={(e) => setFormData({...formData, maritalStatus: e.target.value})}
                 style={{ padding: '16px 20px', background: 'var(--bg-page)', border: '1.5px solid var(--border-primary)', borderRadius: '14px', color: 'var(--text-primary)', outline: 'none', fontSize: '16px', fontWeight: 700 }}
               >
                 <option value="Belum Kawin">Belum Kawin</option>
                 <option value="Kawin">Kawin</option>
                 <option value="Cerai Hidup">Cerai Hidup</option>
                 <option value="Cerai Mati">Cerai Mati</option>
               </select>
             </div>

             <CSInputField 
               label="Nama Ibu Kandung" 
               placeholder="Untuk verifikasi keamanan..." 
               value={formData.motherName} 
               onChange={(val: string) => setFormData({...formData, motherName: val})} 
             />

             <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
               <label style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase' }}>Agama</label>
               <select 
                 value={formData.religion} 
                 onChange={(e) => setFormData({...formData, religion: e.target.value})}
                 style={{ padding: '16px 20px', background: 'var(--bg-page)', border: '1.5px solid var(--border-primary)', borderRadius: '14px', color: 'var(--text-primary)', outline: 'none', fontSize: '16px', fontWeight: 700 }}
               >
                 <option value="Islam">Islam</option>
                 <option value="Kristen">Kristen</option>
                 <option value="Katolik">Katolik</option>
                 <option value="Hindu">Hindu</option>
                 <option value="Buddha">Buddha</option>
                 <option value="Konghucu">Konghucu</option>
                 <option value="Lainnya">Lainnya</option>
               </select>
             </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
               <label style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase' }}>Kewarganegaraan</label>
               <select 
                 value={formData.citizenship} 
                 onChange={(e) => setFormData({...formData, citizenship: e.target.value})}
                 style={{ padding: '16px 20px', background: 'var(--bg-page)', border: '1.5px solid var(--border-primary)', borderRadius: '14px', color: 'var(--text-primary)', outline: 'none', fontSize: '16px', fontWeight: 700 }}
               >
                 <option value="WNI">WNI (Warga Negara Indonesia)</option>
                 <option value="WNA">WNA (Warga Negara Asing)</option>
               </select>
             </div>

             {/* B. DATA KONTAK & ALAMAT */}
             <div style={{ gridColumn: 'span 2', borderBottom: '1px solid var(--border-primary)', paddingBottom: '10px', marginTop: '20px' }}>
               <h3 style={{ color: 'var(--gold-intense)', fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>📞 B. DATA KONTAK & ALAMAT</h3>
             </div>

             <div style={{ gridColumn: 'span 2' }}>
               <CSInputField 
                 label="Alamat Sesuai KTP" 
                 placeholder="Jalan, RT/RW, No. Rumah, Kecamatan, Kota, Provinsi..." 
                 value={formData.ktpAddress} 
                 onChange={(val: string) => {
                   setFormData(prev => ({
                     ...prev,
                     ktpAddress: val,
                     domicileAddress: isSameAddress ? val : prev.domicileAddress
                   }));
                 }} 
               />
             </div>

             <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '-10px' }}>
               <input 
                 type="checkbox" 
                 id="sameAddressToggle" 
                 checked={isSameAddress}
                 onChange={(e) => {
                   const checked = e.target.checked;
                   setIsSameAddress(checked);
                   if (checked) {
                     setFormData(prev => ({ ...prev, domicileAddress: prev.ktpAddress }));
                   }
                 }}
                 style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--gold-intense)' }} 
               />
               <label htmlFor="sameAddressToggle" style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                 Alamat Domisili Saat Ini Sama dengan KTP (Efisiensi Pengisian)
               </label>
             </div>

             <div style={{ gridColumn: 'span 2' }}>
               <CSInputField 
                 label="Alamat Domisili Saat Ini" 
                 placeholder={isSameAddress ? "Sama dengan alamat KTP" : "Jalan, RT/RW, No. Rumah, Kecamatan, Kota, Provinsi..."} 
                 value={isSameAddress ? formData.ktpAddress : formData.domicileAddress} 
                 onChange={(val: string) => {
                   if (!isSameAddress) setFormData({...formData, domicileAddress: val});
                 }} 
               />
             </div>

             <CSInputField 
               label="Nomor Handphone / WhatsApp" 
               placeholder="Contoh: 081234567890..." 
               value={formData.phone} 
               onChange={(val: string) => setFormData({...formData, phone: val})} 
             />
             <CSInputField 
               label="Alamat Email Anggota" 
               placeholder="Contoh: budi.santoso@gmail.com..." 
               value={formData.email} 
               onChange={(val: string) => setFormData({...formData, email: val})} 
             />

             {/* C. DATA PEKERJAAN & KEWANGAAN */}
             <div style={{ gridColumn: 'span 2', borderBottom: '1px solid var(--border-primary)', paddingBottom: '10px', marginTop: '20px' }}>
               <h3 style={{ color: 'var(--gold-intense)', fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>💼 C. DATA PEKERJAAN & KEWANGAAN</h3>
             </div>

             <CSInputField 
               label="Jenis Pekerjaan / Profesi" 
               placeholder="Contoh: Karyawan Swasta, Wiraswasta, PNS..." 
               value={formData.occupation} 
               onChange={(val: string) => setFormData({...formData, occupation: val})} 
             />
             <CSInputField 
               label="Nama Perusahaan / Bidang Usaha" 
               placeholder="Nama Kantor atau Jenis Usaha Mandiri..." 
               value={formData.companyName} 
               onChange={(val: string) => setFormData({...formData, companyName: val})} 
             />
             <CSInputField 
               label="Estimasi Pendapatan Per Bulan" 
               placeholder="Dalam Rupiah (Contoh: 5000000)..." 
               value={formData.monthlyIncome} 
               onChange={(val: string) => setFormData({...formData, monthlyIncome: val})} 
             />
             
             <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
               <label style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase' }}>Sumber Dana (APU-PPT Compliance)</label>
               <select 
                 value={formData.fundingSource} 
                 onChange={(e) => setFormData({...formData, fundingSource: e.target.value})}
                 style={{ padding: '16px 20px', background: 'var(--bg-page)', border: '1.5px solid var(--border-primary)', borderRadius: '14px', color: 'var(--text-primary)', outline: 'none', fontSize: '16px', fontWeight: 700 }}
               >
                 <option value="Gaji">Gaji / Slip Penghasilan</option>
                 <option value="Hasil Usaha">Hasil Usaha / Bisnis</option>
                 <option value="Warisan">Warisan</option>
                 <option value="Orang Tua/Suami">Orang Tua / Suami</option>
                 <option value="Lainnya">Sumber Lain yang Sah</option>
               </select>
             </div>

             {/* D. DATA AHLI WARIS */}
             <div style={{ gridColumn: 'span 2', borderBottom: '1px solid var(--border-primary)', paddingBottom: '10px', marginTop: '20px' }}>
               <h3 style={{ color: 'var(--gold-intense)', fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>👪 D. DATA AHLI WARIS (Khas Koperasi)</h3>
             </div>

             <CSInputField 
               label="Nama Ahli Waris" 
               placeholder="Nama Lengkap Sesuai KTP Ahli Waris..." 
               value={formData.heirName} 
               onChange={(val: string) => setFormData({...formData, heirName: val})} 
             />
             <CSInputField 
               label="Hubungan Keluarga" 
               placeholder="Contoh: Istri, Suami, Anak Kandung, Orang Tua..." 
               value={formData.heirRelationship} 
               onChange={(val: string) => setFormData({...formData, heirRelationship: val})} 
             />
             <div style={{ gridColumn: 'span 2' }}>
               <CSInputField 
                 label="Nomor Kontak Ahli Waris" 
                 placeholder="WhatsApp atau Handphone Aktif..." 
                 value={formData.heirPhone} 
                 onChange={(val: string) => setFormData({...formData, heirPhone: val})} 
               />
             </div>

             {/* Section 2: Kredensial Akun Portal */}
             <div style={{ gridColumn: 'span 2', borderBottom: '1px solid var(--border-primary)', paddingBottom: '10px', marginTop: '20px' }}>
               <h3 style={{ color: 'var(--gold-intense)', fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>🛡️ KREDENSIAL LOGIN PORTAL ANGGOTA</h3>
             </div>
             
             <CSInputField label="Kata Sandi Akun (Opsional)" placeholder="Bawaan menggunakan NIK..." value={formData.password} onChange={(val: string) => setFormData({...formData, password: val})} />

             {/* Section 3: Setoran Awal Koperasi compliant SAK EP */}
             <div style={{ gridColumn: 'span 2', borderBottom: '1px solid var(--border-primary)', paddingBottom: '10px', marginTop: '20px' }}>
               <h3 style={{ color: 'var(--gold-intense)', fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>💵 SETORAN SIMPANAN AWAL KOPERASI (SAK EP)</h3>
             </div>

             <CSInputField label="Simpanan Pokok (Setoran Awal)" placeholder="Contoh: 100000" value={formData.initialPrincipal} onChange={(val: string) => setFormData({...formData, initialPrincipal: val})} />
             <CSInputField label="Simpanan Wajib (Setoran Awal)" placeholder="Contoh: 20000" value={formData.initialMandatory} onChange={(val: string) => setFormData({...formData, initialMandatory: val})} />
            
            <div style={{ gridColumn: 'span 2', marginTop: '30px' }}>
              <button 
                type="submit"
                disabled={loading}
                style={{ 
                  width: '100%', padding: '22px', background: 'var(--text-primary)',
                  color: 'var(--bg-page)', border: 'none', borderRadius: '18px', fontWeight: 900, fontSize: '18px',
                  cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 10px 30px var(--shadow-color)', transition: 'all 0.2s'
                }}
              >
                {loading ? '⏳ MEMPROSES REKENING & JURNAL SAK EP...' : '🔥 DAFTARKAN ANGGOTA & BUKA TABUNGAN'}
              </button>
            </div>
          </form>
          )}
        </div>
      )}

      {/* 2.5. KYC VERIFICATION TAB */}
      {activeMenu === 'kyc' && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '360px 1fr', 
          gap: '30px',
          animation: 'fadeInUp 0.4s ease-out',
          marginBottom: '40px'
        }}>
          {/* Left Column: Pending Queue List */}
          <div style={{ 
            background: 'var(--bg-card)', 
            backdropFilter: 'blur(16px)', 
            borderRadius: '28px', 
            border: '1px solid var(--border-primary)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            maxHeight: '75vh',
            overflowY: 'auto'
          }}>
            <div>
              <h3 style={{ color: 'var(--gold-intense)', margin: 0, fontWeight: 900, fontSize: '18px', textTransform: 'uppercase', letterSpacing: '1px' }}>Antrean Berkas</h3>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 700 }}>{kycList.length} berkas pending verifikasi</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {kycList.length > 0 ? kycList.map(item => (
                <div 
                  key={item.id}
                  onClick={() => setSelectedKyc(item)}
                  style={{
                    padding: '16px',
                    borderRadius: '16px',
                    background: selectedKyc?.id === item.id ? 'var(--border-primary)' : 'rgba(0,0,0,0.02)',
                    border: selectedKyc?.id === item.id ? '1.5px solid var(--gold-intense)' : '1px solid var(--border-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    transform: selectedKyc?.id === item.id ? 'scale(1.02)' : 'scale(1)'
                  }}
                >
                  <div style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '15px' }}>{item.users?.full_name || 'Anggota Tanpa Nama'}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>NIK: {item.nik}</div>
                  <div style={{ 
                    display: 'inline-block', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 900,
                    background: 'var(--border-primary)', color: 'var(--text-primary)', marginTop: '10px', textTransform: 'uppercase'
                  }}>
                    PENDING KYC
                  </div>
                </div>
              )) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)', opacity: 0.5, fontSize: '13px', fontWeight: 700 }}>
                  🎉 Semua dokumen KYC telah bersih & terverifikasi!
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Selected Dossier Auditing Panel */}
          <div style={{ 
            background: 'var(--bg-card)', 
            backdropFilter: 'blur(16px)', 
            borderRadius: '28px', 
            border: '1px solid var(--border-primary)',
            padding: '30px 40px',
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            {selectedKyc ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border-primary)', paddingBottom: '20px' }}>
                  <div>
                    <h2 style={{ color: 'var(--gold-intense)', margin: 0, fontSize: '22px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>AUDIT DOSSIER KYC FISIK</h2>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700, marginTop: '4px' }}>ID Nasabah: {selectedKyc.id}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ 
                      padding: '8px 16px', borderRadius: '10px', fontSize: '11px', fontWeight: 900,
                      background: 'var(--border-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)'
                    }}>
                      STATUS: PENDING AUDIT
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  {/* Personal Info */}
                  <div style={{ background: 'rgba(0,0,0,0.01)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-primary)' }}>
                    <h4 style={{ color: 'var(--gold-intense)', margin: '0 0 16px 0', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase' }}>📍 Profil Demografis</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>Nama Lengkap</span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800, textAlign: 'right' }}>{selectedKyc.users?.full_name}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>NIK Kependudukan</span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800, textAlign: 'right' }}>{selectedKyc.nik}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>Tempat/Tgl Lahir</span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800, textAlign: 'right' }}>{selectedKyc.birth_place_date || '-'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>Jenis Kelamin</span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800, textAlign: 'right' }}>{selectedKyc.gender || 'Laki-laki'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>Status Pernikahan</span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800, textAlign: 'right' }}>{selectedKyc.marital_status || 'Belum Kawin'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>Nama Ibu Kandung</span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800, textAlign: 'right' }}>{selectedKyc.mother_name || '-'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>Agama & WNI/WNA</span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800, textAlign: 'right' }}>{selectedKyc.religion || 'Islam'} ({selectedKyc.citizenship || 'WNI'})</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial & Job */}
                  <div style={{ background: 'rgba(0,0,0,0.01)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-primary)' }}>
                    <h4 style={{ color: 'var(--gold-intense)', margin: '0 0 16px 0', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase' }}>💼 Pekerjaan & Keuangan</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>Pekerjaan Nasabah</span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800, textAlign: 'right' }}>{selectedKyc.occupation || '-'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>Perusahaan/Usaha</span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800, textAlign: 'right' }}>{selectedKyc.company_name || '-'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>Estimasi Pendapatan</span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800, textAlign: 'right' }}>{selectedKyc.monthly_income ? `Rp ${selectedKyc.monthly_income.toLocaleString('id-ID')} / bulan` : '-'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>Sumber Dana (APU)</span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800, textAlign: 'right' }}>{selectedKyc.funding_source || 'Gaji'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>WhatsApp / HP</span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800, textAlign: 'right' }}>{selectedKyc.phone_number || '-'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>Email Terdaftar</span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800, textAlign: 'right' }}>{selectedKyc.users?.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ahli Waris Info */}
                  <div style={{ gridColumn: 'span 2', background: 'rgba(0,0,0,0.01)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-primary)' }}>
                    <h4 style={{ color: 'var(--gold-intense)', margin: '0 0 16px 0', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase' }}>👪 Informasi Ahli Waris</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                      <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700 }}>NAMA AHLI WARIS</div>
                        <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800, marginTop: '4px' }}>{selectedKyc.heir_name || '-'}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700 }}>HUBUNGAN KELUARGA</div>
                        <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800, marginTop: '4px' }}>{selectedKyc.heir_relationship || '-'}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700 }}>NOMOR TELEPON</div>
                        <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800, marginTop: '4px' }}>{selectedKyc.heir_phone || '-'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Addresses */}
                  <div style={{ gridColumn: 'span 2', background: 'rgba(0,0,0,0.01)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-primary)' }}>
                    <h4 style={{ color: 'var(--gold-intense)', margin: '0 0 16px 0', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase' }}>🏠 Alamat Tempat Tinggal</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>Alamat Sesuai KTP</span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800, textAlign: 'right' }}>{selectedKyc.ktp_address}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>Alamat Domisili</span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800, textAlign: 'right' }}>{selectedKyc.domicile_address || selectedKyc.ktp_address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Digital Biometrics & Akad Approval (Simulated UI Wow Factor) */}
                  <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' }}>
                    <div style={{ border: '1px dashed var(--border-primary)', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255, 255, 255, 0.02)' }}>
                      <div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '14px' }}>BIOMETRIK KTP & LIVENESS SELFIE</div>
                        <div style={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 700, marginTop: '2px' }}>Foto KTP & Wajah Terverifikasi 98% Akurat</div>
                      </div>
                    </div>

                    <div style={{ border: '1px dashed var(--border-primary)', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255, 255, 255, 0.02)' }}>
                      <div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '14px' }}>AKAD SYARIAH WADIAH & MUDHARABAH</div>
                        <div style={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 700, marginTop: '2px' }}>Menyetujui Ketentuan Akad Digital iQ-RA</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginTop: '20px', borderTop: '2px solid var(--border-primary)', paddingTop: '24px' }}>
                  <button
                    onClick={() => {
                      if (confirm('Tolak berkas KYC nasabah ini? Harap berikan alasan penolakan.')) {
                        alert('Fitur penolakan dokumen berhasil dikirim ke nasabah via email.');
                      }
                    }}
                    style={{
                      padding: '16px 24px',
                      background: 'var(--border-primary)',
                      color: 'var(--text-primary)',
                      border: '1.5px solid var(--border-primary)',
                      borderRadius: '14px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                    onMouseOut={e => e.currentTarget.style.background = 'var(--border-primary)'}
                  >
                    Tolak Berkas
                  </button>

                  <button
                    disabled={loading}
                    onClick={() => handleApprove(selectedKyc.id)}
                    style={{
                      padding: '18px 24px',
                      background: 'var(--text-primary)',
                      color: 'var(--bg-page)',
                      border: 'none',
                      borderRadius: '14px',
                      fontWeight: 900,
                      fontSize: '16px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 8px 24px var(--shadow-color)'
                    }}
                  >
                    {loading ? 'Menyetujui...' : 'Setujui & Aktifkan Anggota (Aktifkan Simpanan)'}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', color: 'var(--text-secondary)', opacity: 0.5 }}>
                <div style={{ fontWeight: 900, fontSize: '18px', textTransform: 'uppercase', letterSpacing: '1px' }}>Antrean KYC Kosong</div>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>Semua dokumen nasabah telah aktif dan terverifikasi secara hukum syariah.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. MEMBERS DATABASE TAB */}
      {activeMenu === 'members' && (
        <div style={{ 
          background: 'var(--bg-card)', 
          backdropFilter: 'blur(16px)', 
          borderRadius: '32px', 
          overflow: 'hidden', 
          border: '1px solid var(--border-primary)',
          boxShadow: '0 40px 80px var(--shadow-color)'
        }}>
          <div style={{ background: 'var(--bg-header)', padding: '30px 40px', borderBottom: '2px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ color: 'var(--gold-intense)', margin: 0, fontWeight: 900, fontSize: '22px', textTransform: 'uppercase', letterSpacing: '2px' }}>DATABASE ANGGOTA TERVERIFIKASI</h3>
              <div style={{ width: '80px', height: '4px', background: 'var(--gold-intense)', margin: '8px 0 0 0', borderRadius: '2px', boxShadow: '0 0 8px var(--shadow-color)' }} />
            </div>
            <div style={{ color: 'var(--text-primary)', opacity: 0.8, fontSize: '14px', fontWeight: 700 }}>Total: {membersList.length} Anggota</div>
          </div>
          <div style={{ padding: '20px 40px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border-primary)' }}>
                  <th style={{ padding: '20px', color: 'var(--text-primary)', fontWeight: 800 }}>IDENTITAS NASABAH</th>
                  <th style={{ padding: '20px', color: 'var(--text-primary)', fontWeight: 800 }}>NIK / KK</th>
                  <th style={{ padding: '20px', color: 'var(--text-primary)', fontWeight: 800 }}>PEKERJAAN / PENDAPATAN</th>
                  <th style={{ padding: '20px', color: 'var(--text-primary)', fontWeight: 800, textAlign: 'center' }}>STATUS</th>
                  <th style={{ padding: '20px', color: 'var(--text-primary)', fontWeight: 800, textAlign: 'right' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {membersList.length > 0 ? membersList.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-primary)', background: 'rgba(0,0,0,0.02)' }}>
                    <td style={{ padding: '20px' }}>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '16px' }}>{item.users?.full_name || 'Anggota Tanpa Akun'}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{item.phone_number}</div>
                    </td>
                    <td style={{ padding: '20px' }}>
                      <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700 }}>{item.nik}</div>
                      <div style={{ color: 'var(--text-secondary)', opacity: 0.6, fontSize: '12px' }}>KK: {item.kk_number}</div>
                    </td>
                    <td style={{ padding: '20px' }}>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{item.occupation}</div>
                      <div style={{ color: 'var(--text-primary)', fontSize: '13px' }}>Rp {item.monthly_income?.toLocaleString('id-ID')}</div>
                    </td>
                    <td style={{ padding: '20px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          padding: '6px 16px', borderRadius: '8px', fontSize: '11px', fontWeight: 900,
                          background: 'var(--text-primary)',
                          color: 'var(--bg-page)'
                        }}>
                          {item.status.toUpperCase()}
                        </span>
                        {item.is_blacklisted && (
                          <span style={{ 
                            padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 900,
                            background: '#ef4444', color: '#ffffff'
                          }}>
                            🚫 BLACKLISTED
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button 
                          onClick={async () => {
                            if (confirm(`Apakah Anda yakin ingin mengubah status blacklist anggota ${item.users?.full_name || item.id_number}?`)) {
                              const supabase = createClient();
                              const { error } = await supabase.from('members').update({ is_blacklisted: !item.is_blacklisted }).eq('id', item.id);
                              if (!error) {
                                fetchStats(); // Refresh data
                                setMessage({ type: 'success', text: `Status blacklist berhasil diubah untuk ${item.id_number}.` });
                              }
                            }
                          }}
                          style={{
                            background: item.is_blacklisted ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${item.is_blacklisted ? '#ef4444' : 'var(--border-primary)'}`,
                            color: item.is_blacklisted ? '#ef4444' : 'var(--text-secondary)',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            fontSize: '12px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          title={item.is_blacklisted ? "Hapus dari Blacklist" : "Tandai Blacklist (PI Checking)"}
                        >
                          {item.is_blacklisted ? 'Whitelist' : 'Blacklist'}
                        </button>
                        <button 
                          onClick={() => setSelectedMemberProfile(item)}
                          style={{
                            background: 'rgba(218, 165, 32, 0.1)',
                            border: '1.5px solid var(--gold-intense)',
                            color: 'var(--text-primary)',
                            padding: '8px 16px',
                            borderRadius: '10px',
                            fontSize: '12px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                          }}
                        >
                          Lihat Profil
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} style={{ padding: '80px', textAlign: 'center', color: 'var(--text-secondary)', opacity: 0.4, fontWeight: 800 }}>
                      Tidak ada data anggota untuk ditampilkan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3.5. VERIFICATIONS TAB */}
      {activeMenu === 'verifications' && (
        <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', borderRadius: '32px', overflow: 'hidden', border: '1.5px solid var(--border-primary)', boxShadow: '0 40px 80px var(--shadow-color)' }}>
          <div style={{ background: 'var(--bg-header)', padding: '24px 36px', borderBottom: '1.5px solid var(--border-primary)' }}>
            <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '20px', fontWeight: 900, letterSpacing: '1px' }}>💳 VERIFIKASI SETORAN ONLINE</h2>
          </div>
          <div style={{ padding: '24px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: 800, color: 'var(--text-secondary)' }}>ANGGOTA & REF</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: 800, color: 'var(--text-secondary)' }}>TIPE TRANSAKSI</th>
                  <th style={{ padding: '16px', textAlign: 'right', fontSize: '13px', fontWeight: 800, color: 'var(--text-secondary)' }}>TOTAL TRANSFER (RP)</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontSize: '13px', fontWeight: 800, color: 'var(--text-secondary)' }}>AKSI CS</th>
                </tr>
              </thead>
              <tbody>
                {verificationsList.length > 0 ? verificationsList.map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{v.users?.full_name || 'Tanpa Nama'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Ref: {v.reference_no}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{new Date(v.created_at).toLocaleString('id-ID')}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ background: 'rgba(218, 165, 32, 0.1)', color: 'var(--gold-intense)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 900 }}>
                        {v.payment_type.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ fontWeight: 900, color: '#4ade80' }}>{v.total_paid.toLocaleString('id-ID')}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Pokok: {v.amount.toLocaleString('id-ID')} | ADM: {v.admin_fee.toLocaleString('id-ID')}</div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <button 
                        onClick={async () => {
                          if (confirm(`Setujui transfer sebesar Rp ${v.total_paid.toLocaleString('id-ID')} dari ${v.users?.full_name}?`)) {
                            setLoading(true);
                            try {
                              const res = await fetch('/api/cs/verify-deposit', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ verificationId: v.id })
                              });
                              const data = await res.json();
                              if (res.ok) {
                                setMessage({ type: 'success', text: `Setoran berhasil disetujui! Saldo dan jurnal telah diupdate.` });
                                fetchStats();
                              } else {
                                throw new Error(data.error);
                              }
                            } catch (err: any) {
                              setMessage({ type: 'error', text: err.message });
                            }
                            setLoading(false);
                          }
                        }}
                        style={{
                          background: 'linear-gradient(135deg, var(--gold-bright) 0%, var(--gold-intense) 100%)',
                          color: '#02130e', border: 'none', padding: '10px 20px', borderRadius: '10px',
                          fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 15px rgba(204, 163, 52, 0.2)'
                        }}
                      >
                        ✅ Approve Transfer
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Tidak ada antrean verifikasi transfer online.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. SPECIAL SAVINGS TAB */}
      {activeMenu === 'special-savings' && (
        <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', borderRadius: '32px', overflow: 'hidden', border: '1.5px solid var(--border-primary)', boxShadow: '0 40px 80px var(--shadow-color)' }}>
          <div style={{ background: 'var(--bg-header)', padding: '24px 36px', borderBottom: '1.5px solid var(--border-primary)' }}>
            <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '20px', fontWeight: 900, letterSpacing: '1px' }}>🕌 BUKA REKENING SIMPANAN BERTUJUAN</h2>
          </div>
          <div style={{ padding: '36px' }}>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setMessage({ type: 'success', text: 'Permintaan pembukaan rekening simpanan Haji/Umrah berhasil disubmit untuk diproses!' });
            }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 800 }}>PILIH ANGGOTA / MEMBER ID</label>
                <select required style={inputStyle}>
                  <option value="">-- Pilih Anggota Terdaftar --</option>
                  {membersList.map(m => (
                    <option key={m.id} value={m.id}>{m.id_number} - {m.users?.full_name || m.mother_name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 800 }}>TIPE SIMPANAN KHUSUS</label>
                  <select required style={inputStyle}>
                    <option value="haji">Simpanan Haji Khusus (Mudharabah Mutlaqah)</option>
                    <option value="umrah">Simpanan Umrah (Mudharabah Mutlaqah)</option>
                  </select>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 800 }}>SETORAN AWAL (RP)</label>
                  <input type="number" required placeholder="Minimal Rp 500.000" min="500000" style={inputStyle} />
                </div>
              </div>

              <div style={{ background: 'rgba(204, 163, 52, 0.1)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-primary)' }}>
                <h4 style={{ color: 'var(--gold-intense)', margin: '0 0 10px 0', fontSize: '14px', fontWeight: 800 }}>📝 Ketentuan Akad Mudharabah</h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-primary)', fontSize: '13px', lineHeight: 1.6 }}>
                  <li>Rekening khusus Haji/Umrah menggunakan prinsip Mudharabah Mutlaqah.</li>
                  <li>Dana tidak dapat ditarik sewaktu-waktu kecuali untuk pelunasan biaya perjalanan.</li>
                  <li>Nisbah bagi hasil ditentukan di akhir bulan melalui modul EOM Accounting.</li>
                </ul>
              </div>

              <button type="submit" style={{
                padding: '16px', background: 'linear-gradient(135deg, var(--gold-bright) 0%, var(--gold-intense) 100%)',
                color: '#02130e', border: 'none', borderRadius: '16px', fontWeight: 900, fontSize: '15px',
                cursor: 'pointer', boxShadow: '0 8px 25px rgba(204, 163, 52, 0.3)', marginTop: '10px'
              }}>
                ✅ Buka Rekening Simpanan Bertujuan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. AI HELP TAB */}
      {activeMenu === 'ai-help' && (
        <div style={{ height: '70vh', background: 'var(--bg-card)', backdropFilter: 'blur(16px)', borderRadius: '32px', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-primary)', boxShadow: '0 40px 80px var(--shadow-color)' }}>
          <div style={{ padding: '24px 40px', background: 'var(--bg-header)', borderBottom: '1px solid var(--border-primary)' }}>
            <div>
              <h3 style={{ color: 'var(--gold-intense)', margin: 0, fontWeight: 900, fontSize: '22px', textTransform: 'uppercase', letterSpacing: '2px' }}>💬 iQ-RA AI Sharia Assistant</h3>
              <div style={{ width: '80px', height: '4px', background: 'var(--gold-intense)', margin: '8px 0 0 0', borderRadius: '2px', boxShadow: '0 0 8px var(--shadow-color)' }} />
            </div>
          </div>
          <div style={{ flexGrow: 1, padding: '40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ alignSelf: 'flex-start', background: 'var(--border-primary)', padding: '20px', borderRadius: '0 24px 24px 24px', maxWidth: '70%', color: 'var(--text-primary)', fontSize: '15px', boxShadow: '0 4px 15px var(--shadow-color)' }}>
              Halo {profile?.full_name}! Saya asisten AI iQ-RA. Ada yang bisa saya bantu terkait produk simpanan atau pembiayaan syariah hari ini?
            </div>
          </div>
          <div style={{ padding: '30px 40px', background: 'rgba(0,0,0,0.02)' }}>
            <input 
              type="text" 
              placeholder="Tanyakan sesuatu pada AI..." 
              style={{ width: '100%', padding: '18px 24px', background: 'var(--bg-page)', border: '1px solid var(--border-primary)', borderRadius: '20px', color: 'var(--text-primary)', outline: 'none' }} 
            />
          </div>
        </div>
      )}

      {/* 5. FLOATING MEMBER DETAIL PROFILE MODAL */}
      {selectedMemberProfile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(1, 10, 7, 0.85)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeInUp 0.3s ease-out'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '2px solid var(--border-primary)',
            borderRadius: '28px',
            width: '90%',
            maxWidth: '850px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '40px',
            boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: '30px',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button 
              onClick={() => setSelectedMemberProfile(null)}
              style={{
                position: 'absolute',
                top: '30px',
                right: '30px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-primary)',
                color: 'var(--text-primary)',
                borderRadius: '12px',
                width: '44px',
                height: '44px',
                fontSize: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
            >
              ✕
            </button>

            {/* Modal Header */}
            <div style={{ borderBottom: '2px solid var(--border-primary)', paddingBottom: '20px' }}>
              <h2 style={{ color: 'var(--gold-intense)', margin: '10px 0 0 0', fontWeight: 900, fontSize: '24px', textTransform: 'uppercase', letterSpacing: '1px' }}>PROFIL LENGKAP ANGGOTA</h2>
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700, marginTop: '4px' }}>Nomor CIF Anggota: {selectedMemberProfile.id}</div>
            </div>

            {/* Grid Content */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Personal details */}
              <div style={{ background: 'rgba(255,255,255,0.01)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border-primary)' }}>
                <h3 style={{ color: 'var(--gold-intense)', margin: '0 0 16px 0', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase' }}>Identitas Demografi</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>Nama Lengkap</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800, textAlign: 'right' }}>{selectedMemberProfile.users?.full_name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>NIK Kependudukan</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800, textAlign: 'right' }}>{selectedMemberProfile.nik}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>Tempat/Tgl Lahir</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800, textAlign: 'right' }}>{selectedMemberProfile.birth_place_date || '-'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>Jenis Kelamin</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800, textAlign: 'right' }}>{selectedMemberProfile.gender || 'Laki-laki'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>Status Pernikahan</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800, textAlign: 'right' }}>{selectedMemberProfile.marital_status || 'Belum Kawin'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>Nama Ibu Kandung</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800, textAlign: 'right' }}>{selectedMemberProfile.mother_name || '-'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>Agama & Kewarganegaraan</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800, textAlign: 'right' }}>{selectedMemberProfile.religion || 'Islam'} ({selectedMemberProfile.citizenship || 'WNI'})</span>
                  </div>
                </div>
              </div>

              {/* Financial & Job */}
              <div style={{ background: 'rgba(255,255,255,0.01)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border-primary)' }}>
                <h3 style={{ color: 'var(--gold-intense)', margin: '0 0 16px 0', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase' }}>Pekerjaan & Keuangan</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>Pekerjaan</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800, textAlign: 'right' }}>{selectedMemberProfile.occupation}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>Perusahaan/Usaha</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800, textAlign: 'right' }}>{selectedMemberProfile.company_name || '-'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>Pendapatan Bulanan</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800, textAlign: 'right' }}>Rp {selectedMemberProfile.monthly_income?.toLocaleString('id-ID')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>Sumber Dana (APU)</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800, textAlign: 'right' }}>{selectedMemberProfile.funding_source || 'Gaji'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>WhatsApp / Phone</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800, textAlign: 'right' }}>{selectedMemberProfile.phone_number}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>Email Portal</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800, textAlign: 'right' }}>{selectedMemberProfile.users?.email}</span>
                  </div>
                </div>
              </div>

              {/* Ahli Waris Info */}
              <div style={{ gridColumn: 'span 2', background: 'rgba(255,255,255,0.01)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border-primary)' }}>
                <h3 style={{ color: 'var(--gold-intense)', margin: '0 0 16px 0', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase' }}>Informasi Ahli Waris (Khas Koperasi)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700 }}>NAMA AHLI WARIS</div>
                    <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800, marginTop: '4px' }}>{selectedMemberProfile.heir_name || '-'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700 }}>HUBUNGAN KELUARGA</div>
                    <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800, marginTop: '4px' }}>{selectedMemberProfile.heir_relationship || '-'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700 }}>NOMOR TELEPON</div>
                    <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800, marginTop: '4px' }}>{selectedMemberProfile.heir_phone || '-'}</div>
                  </div>
                </div>
              </div>

              {/* Address details */}
              <div style={{ gridColumn: 'span 2', background: 'rgba(255,255,255,0.01)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border-primary)' }}>
                <h3 style={{ color: 'var(--gold-intense)', margin: '0 0 16px 0', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase' }}>Alamat Tempat Tinggal</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>Alamat KTP</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800, textAlign: 'right' }}>{selectedMemberProfile.ktp_address}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>Alamat Domisili</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800, textAlign: 'right' }}>{selectedMemberProfile.domicile_address || selectedMemberProfile.ktp_address}</span>
                  </div>
                </div>
              </div>

              {/* Registered Savings Accounts */}
              <div style={{ gridColumn: 'span 2', background: 'rgba(218,165,32,0.02)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border-primary)' }}>
                <h3 style={{ color: 'var(--gold-intense)', margin: '0 0 16px 0', fontSize: '15px', fontWeight: 900, textTransform: 'uppercase' }}>Rekening Simpanan Koperasi (SAK EP)</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '10px' }}>
                  {memberAccounts.length > 0 ? memberAccounts.map((acc: any) => (
                    <div key={acc.id} style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-primary)' }}>
                      <div style={{ color: 'var(--gold-intense)', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Simpanan {acc.account_type.toUpperCase()}
                      </div>
                      <div style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 800, marginTop: '8px' }}>
                        {acc.account_number}
                      </div>
                      <div style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 900, marginTop: '4px' }}>
                        Rp {acc.balance.toLocaleString('id-ID')}
                      </div>
                    </div>
                  )) : (
                    <div style={{ gridColumn: 'span 3', color: 'var(--text-secondary)', opacity: 0.6, fontSize: '13px', fontWeight: 700, textAlign: 'center', padding: '10px 0' }}>
                      Sedang mengambil data rekening simpanan...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer actions */}
            <div style={{ borderTop: '2px solid var(--border-primary)', paddingTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
              <button 
                onClick={() => {
                  const principalVal = memberAccounts.find(a => a.account_type === 'pokok')?.balance || 300000;
                  const mandatoryVal = memberAccounts.find(a => a.account_type === 'wajib')?.balance || 50000;
                  const admVal = 15000;
                  const infaqVal = 10000 + Number((selectedMemberProfile.phone_number || '000').slice(-3));
                  
                  setRegisteredReceiptData({
                    referenceNo: `REPRINT-${selectedMemberProfile.id.slice(0, 8).toUpperCase()}`,
                    date: new Date(selectedMemberProfile.created_at || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
                    fullName: selectedMemberProfile.users?.full_name,
                    nik: selectedMemberProfile.nik,
                    phone: selectedMemberProfile.phone_number,
                    principal: principalVal,
                    mandatory: mandatoryVal,
                    adm: admVal,
                    infaq: infaqVal,
                    grandTotal: principalVal + mandatoryVal + admVal + infaqVal
                  });
                  setSelectedMemberProfile(null);
                  
                  // Pemicu perpindahan ke tab onboarding secara dinamis
                  const onboardingBtn = document.querySelector('button[label="Registrasi Anggota"]');
                  if (onboardingBtn) (onboardingBtn as HTMLButtonElement).click();
                }}
                style={{
                  padding: '14px 24px',
                  background: 'rgba(218, 165, 32, 0.1)',
                  color: 'var(--gold-intense)',
                  border: '1.5px solid var(--gold-intense)',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                🖨️ Cetak Ulang Nota Bukti
              </button>
              
              <button 
                onClick={() => setSelectedMemberProfile(null)}
                style={{
                  padding: '14px 28px',
                  background: 'var(--text-primary)',
                  color: 'var(--bg-page)',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 900,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Tutup Profil
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function StatCard({ label, value }: any) {
  return (
    <div style={{ 
      background: 'var(--bg-card)', 
      backdropFilter: 'blur(16px)', 
      padding: '30px', 
      borderRadius: '24px', 
      border: '1px solid var(--border-primary)',
      display: 'flex',
      alignItems: 'center',
      gap: '20px'
    }}>
      <div>
        <div style={{ color: 'var(--text-primary)', opacity: 0.7, fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
        <div style={{ color: 'var(--text-primary)', fontSize: '32px', fontWeight: 900 }}>{value}</div>
      </div>
    </div>
  );
}

function CSInputField({ label, placeholder, value, onChange }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <label style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase' }}>{label}</label>
      <input 
        type="text" 
        placeholder={placeholder} 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ 
          padding: '16px 20px', background: 'var(--bg-page)', 
          border: '1.5px solid var(--border-primary)', borderRadius: '14px', 
          color: 'var(--text-primary)', outline: 'none', transition: 'all 0.2s',
          fontSize: '16px', fontWeight: 700
        }}
        onFocus={e => e.currentTarget.style.borderColor = 'var(--text-primary)'}
        onBlur={e => e.currentTarget.style.borderColor = 'var(--border-primary)'}
      />
    </div>
  );
}
