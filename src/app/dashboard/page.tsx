'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import TellerTerminal from '@/components/dashboard/TellerTerminal';

// Dedicated, immersive Dark Background specifically optimized for the Dashboard to maximize contrast
function DashboardSiteBackground() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 0,
      background: 'linear-gradient(135deg, #02130e 0%, #042a1d 100%)',
      overflow: 'hidden'
    }} aria-hidden="true">
      {/* Geometric pattern overlay with extreme low opacity to ensure text remains 100% readable */}
      <div className="site-bg-pattern" style={{ opacity: 0.04 }} />
    </div>
  );
}

// Intense Gold Scaled LogoIcon
function LogoIcon({ size = 42, rounded = 10 }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #f3c653 0%, #cca334 100%)', // Intense Gold
      width: size,
      height: size,
      borderRadius: rounded,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      boxShadow: '0 6px 15px rgba(204, 163, 52, 0.3)'
    }}>
      <img 
        src="/logo-recolored.png" 
        alt="iQ-RA Logo" 
        style={{ 
          width: '86%', 
          height: '86%', 
          objectFit: 'contain',
          flexShrink: 0
        }} 
      />
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Tab state (overview, users, members, settings, teller)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'members' | 'settings' | 'teller'>('overview');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // System parameters state
  const [systemParams, setSystemParams] = useState<any[]>([]);
  const [loadingParams, setLoadingParams] = useState(false);
  
  // Role modal
  const [editingUser, setEditingUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isSavingRole, setIsSavingRole] = useState(false);
  
  // Create User Modal States
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('member');
  const [isSavingNewUser, setIsSavingNewUser] = useState(false);
  const [createErrorMsg, setCreateErrorMsg] = useState<string | null>(null);
  
  // Audit mask
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  
  // Real-time Search Query & Real Membership count states
  const [searchQuery, setSearchQuery] = useState('');
  const [totalApprovedMembers, setTotalApprovedMembers] = useState(0);
  
  // CIF / Physical Membership data states
  const [membersList, setMembersList] = useState<any[]>([]);
  const [selectedCIF, setSelectedCIF] = useState<any>(null);

  const fetchSession = async () => {
    const supabase = createClient();
    const { data: { user: currentUser }, error } = await supabase.auth.getUser();
    
    if (error || !currentUser) {
      router.push('/login');
      return;
    }
    
    setUser(currentUser);

    const { data: dbProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', currentUser.id)
      .single();

        if (dbProfile) {
          setProfile(dbProfile);
          
          // 1. PRIORITAS REDIRECT: Cek role staff khusus dulu
          if (dbProfile.role === 'customer_service') {
            router.push('/customer-service');
            return;
          }
          if (dbProfile.role === 'teller') {
            router.push('/teller');
            return;
          }
          if (dbProfile.role === 'accounting') {
            router.push('/accounting');
            return;
          }
          if (dbProfile.role === 'manager') {
            router.push('/manager');
            return;
          }
          if (dbProfile.role === 'dps') {
            router.push('/dps');
            return;
          }
          if (dbProfile.role === 'member') {
            router.push('/members');
            return;
          }
        
        const isStaffRole = ['super_user', 'manager', 'account_officer', 'accounting', 'dps'].includes(dbProfile.role);
        if (isStaffRole) {
          fetchUsersList();
        }
      }

    
    setLoading(false);
  };

  const fetchUsersList = async () => {
    setLoadingUsers(true);
    const supabase = createClient();
    
    // 1. Fetch core user login accounts
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setUsersList(data);
    }

    // 2. Fetch PHYSICAL application metrics from physical members table
    const { count } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true });
    setTotalApprovedMembers(count || 0);

    // 3. Fetch FULL relational CIF dossier dataset for Supervisor Audit Tab
    const { data: cifs, error: cifErr } = await supabase
      .from('members')
      .select('*, users(full_name, email)')
      .order('created_at', { ascending: false });
    if (!cifErr && cifs) {
      setMembersList(cifs);
    }

    setLoadingUsers(false);
  };

  // ==== NEW: FETCH SYSTEM PARAMETERS ==== 
  const fetchSystemParams = async () => {
    setLoadingParams(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('system_parameters')
      .select('*')
      .order('key', { ascending: true });
    if (!error && data) {
      setSystemParams(data);
    }
    setLoadingParams(false);
  };

  useEffect(() => {
    fetchSession();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleOpenEditRole = (usr: any) => {
    setEditingUser(usr);
    setSelectedRole(usr.role);
  };

  const handleSaveRole = async () => {
    if (!editingUser) return;
    setIsSavingRole(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('users')
      .update({ role: selectedRole })
      .eq('id', editingUser.id);

    if (!error) {
      await fetchUsersList();
      setEditingUser(null);
    } else {
      alert('Gagal memperbarui: ' + error.message);
    }
    setIsSavingRole(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateErrorMsg(null);
    
    if (!newFullName || !newEmail || !newPassword || !newRole) {
      setCreateErrorMsg('Harap isi seluruh bidang form.');
      return;
    }
    
    if (newPassword.length < 6) {
      setCreateErrorMsg('Kata sandi minimal harus 6 karakter.');
      return;
    }

    setIsSavingNewUser(true);
    
    try {
      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: newFullName,
          email: newEmail,
          password: newPassword,
          role: newRole
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mendaftarkan user baru.');
      }
      
      alert('🎉 PENDAFTARAN BERHASIL!\nUser atau Staf baru telah berhasil dimasukkan ke dalam sistem.');
      
      // Reset Form States
      setNewFullName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('member');
      setIsCreatingUser(false);
      
      // Refresh Data
      await fetchUsersList();
    } catch (err: any) {
      setCreateErrorMsg(err.message);
    } finally {
      setIsSavingNewUser(false);
    }
  };

  // Exclusive Super User simulation utility: Dynamically injects physical CIF into physical database
  const handleInjectDemoCIF = async () => {
    // 1. Identify system user accounts that lack physical KYC registration
    const registeredUserIds = new Set(membersList.map(m => m.user_id));
    const targetCandidate = usersList.find(u => !registeredUserIds.has(u.id));
    
    if (!targetCandidate) {
      alert('Pemberitahuan Sistem:\nSemua user yang terdaftar saat ini SUDAH memiliki berkas fisik CIF di database! Silakan buat registrasi akun baru terlebih dahulu.');
      return;
    }
    
    const confirmSim = window.confirm(`SUNTIK DATA UJI COBA?\n\nApakah Anda ingin mensimulasikan pengajuan data fisik CIF Bank lengkap untuk pengguna: "${targetCandidate.full_name}"?\n\nData simulasi NIK, KK, Ibu Kandung, dan Penghasilan akan dimasukkan langsung ke tabel Supabase Anda.`);
    if (!confirmSim) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('members')
      .insert({
        user_id: targetCandidate.id,
        nik: '320' + Math.floor(1000000000000 + Math.random() * 9000000000000), // Valid length NIK
        kk_number: '320' + Math.floor(1000000000000 + Math.random() * 9000000000000),
        mother_name: 'Siti Aminah',
        religion: 'Islam',
        ktp_address: 'Jl. Kramat Pela Raya No. ' + Math.floor(Math.random() * 120) + ', Jakarta Selatan',
        domicile_address: 'Jl. Kramat Pela Raya No. ' + Math.floor(Math.random() * 120) + ', Jakarta Selatan',
        occupation: 'Wirausaha Mikro Kuliner',
        monthly_income: 9200000,
        phone_number: '0812' + Math.floor(10000000 + Math.random() * 90000000),
        status: 'active'
      });
      
    if (!error) {
      alert(`⚡ SIMULASI SUKSES!\nBerkas CIF resmi atas nama "${targetCandidate.full_name}" telah berhasil disuntikkan aktif ke tabel members!`);
      await fetchUsersList();
    } else {
      alert('Error menyuntikkan simulasi: ' + error.message);
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  if (loading) {
    return (
      <>
        <DashboardSiteBackground />
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', gap: '16px', position: 'relative', zIndex: 10 }}>
          <div style={{ border: '3px solid transparent', borderTopColor: '#f3c653', borderRightColor: '#f3c653', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
          <h3 style={{ fontWeight: 800, fontSize: '18px', color: '#f3c653' }}>Memuat Dasbor IQ-RA...</h3>
          <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </>
    );
  }

  // ==============================================================
  // 👑 INTERNAL STAFF VIEW: (SUPER USER, TELLER, MANAGER, ETC)
  // ==============================================================
  const isStaff = ['super_user', 'teller', 'manager', 'account_officer', 'accounting'].includes(profile?.role);
  
  if (isStaff) {

    const totalAccounts = usersList.length;
    const totalStaff = usersList.filter(u => u.role !== 'member').length;
    
    // Compute filtered subset real-time based on user search query
    const filteredUsers = usersList.filter(u => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      return (
        (u.full_name?.toLowerCase().includes(query)) ||
        (u.email?.toLowerCase().includes(query))
      );
    });

    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#02130e', // Solid Darkest Emerald Canvas
        color: '#ffffff',
        display: 'flex',
        position: 'relative'
      }}>
        <DashboardSiteBackground />

        {/* 1. SIDEBAR: Solid, Bold, Premium Dark Emerald */}
        <aside style={{
          width: '300px',
          background: 'linear-gradient(180deg, #032419 0%, #021c13 100%)', // Deep saturated Emerald
          borderRight: '2px solid #cca334', // Rich gold divider
          display: 'flex',
          flexDirection: 'column',
          padding: '36px 24px',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 30,
          boxShadow: '8px 0 25px rgba(0,0,0,0.5)'
        }}>
          {/* Sidebar Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '40px' }}>
            <LogoIcon size={44} />
            <div>
              <div style={{ fontSize: '19px', fontWeight: 900, letterSpacing: '0.5px', color: '#ffffff' }}>IQ-RA SYSTEM</div>
              <div style={{ fontSize: '11px', color: '#f3c653', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px' }}>IT Administrator</div>
            </div>
          </div>

          {/* Admin Identity Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(243, 198, 83, 0.2)', // Subtle gold glow
            borderRadius: '18px',
            padding: '18px',
            marginBottom: '36px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: '12px', 
              background: '#f3c653', // Intense Gold
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '18px', 
              fontWeight: 900, 
              color: '#02130e',
              boxShadow: '0 4px 10px rgba(243, 198, 83, 0.3)'
            }}>
              {profile?.full_name ? profile.full_name.charAt(0) : 'A'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 800, fontSize: '15px', color: '#ffffff' }}>{profile?.full_name}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{profile?.email}</div>
            </div>
          </div>

          {/* Sidebar Nav */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }}>
            <button 
              onClick={() => setActiveTab('overview')}
              style={{
                background: activeTab === 'overview' ? '#f3c653' : 'transparent',
                border: 'none',
                textAlign: 'left',
                padding: '15px 18px',
                borderRadius: '14px',
                color: activeTab === 'overview' ? '#02130e' : 'rgba(255,255,255,0.8)',
                fontWeight: 800,
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s',
                boxShadow: activeTab === 'overview' ? '0 4px 15px rgba(243, 198, 83, 0.3)' : 'none'
              }}
            >
              📊 Ringkasan Sistem
            </button>
            
            <button 
              onClick={() => setActiveTab('users')}
              style={{
                background: activeTab === 'users' ? '#f3c653' : 'transparent',
                border: 'none',
                textAlign: 'left',
                padding: '15px 18px',
                borderRadius: '14px',
                color: activeTab === 'users' ? '#02130e' : 'rgba(255,255,255,0.8)',
                fontWeight: 800,
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s',
                boxShadow: activeTab === 'users' ? '0 4px 15px rgba(243, 198, 83, 0.3)' : 'none'
              }}
            >
              👥 Manajemen User & Peran
            </button>

            <button 
              onClick={() => setActiveTab('members')}
              style={{
                background: activeTab === 'members' ? '#f3c653' : 'transparent',
                border: 'none',
                textAlign: 'left',
                padding: '15px 18px',
                borderRadius: '14px',
                color: activeTab === 'members' ? '#02130e' : 'rgba(255,255,255,0.8)',
                fontWeight: 800,
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s',
                boxShadow: activeTab === 'members' ? '0 4px 15px rgba(243, 198, 83, 0.3)' : 'none'
              }}
            >
              📑 Direktori CIF Anggota
            </button>

            <button 
              onClick={() => setActiveTab('settings')}
              style={{
                background: activeTab === 'settings' ? '#f3c653' : 'transparent',
                border: 'none',
                textAlign: 'left',
                padding: '15px 18px',
                borderRadius: '14px',
                color: activeTab === 'settings' ? '#02130e' : 'rgba(255,255,255,0.8)',
                fontWeight: 800,
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s',
                boxShadow: activeTab === 'settings' ? '0 4px 15px rgba(243, 198, 83, 0.3)' : 'none'
              }}
            >
              🛠️ Parameter Sistem & Cadangan
            </button>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '16px 0' }} />
            
            <div style={{ fontSize: '11px', color: '#f3c653', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', paddingLeft: '16px', marginBottom: '6px' }}>DUKUNGAN KONFIGURASI</div>
            <button style={{ background: 'transparent', border: 'none', textAlign: 'left', padding: '12px 18px', borderRadius: '12px', color: 'rgba(255,255,255,0.4)', fontSize: '14px', cursor: 'not-allowed', fontWeight: 600 }}>⚙️ Parameter Sistem</button>
            <button style={{ background: 'transparent', border: 'none', textAlign: 'left', padding: '12px 18px', borderRadius: '12px', color: 'rgba(255,255,255,0.4)', fontSize: '14px', cursor: 'not-allowed', fontWeight: 600 }}>📦 API Config</button>
          </nav>

          {/* Sidebar Footer Action */}
          <button 
            onClick={handleLogout}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '2px solid #fca5a5',
              color: '#ffffff',
              padding: '14px',
              borderRadius: '14px',
              fontWeight: 800,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.1)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#ffffff'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.color = '#ffffff'; }}
          >
            🔌 Keluar Kontrol Panel
          </button>
        </aside>

        {/* 2. MAIN CONTENT AREA: Crystal Clear High Contrast */}
        <main style={{
          flexGrow: 1,
          padding: '48px',
          overflowY: 'auto',
          height: '100vh',
          position: 'relative',
          zIndex: 10
        }}>
          
          {/* Header */}
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '44px' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px', marginBottom: '6px', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                {activeTab === 'overview' ? 'Ikhtisar Operasi Sistem' : 
                 activeTab === 'users' ? 'Master Direktori User & Peran' : 
                 activeTab === 'teller' ? 'Layanan Kasir Syariah' :
                 'Direktori CIF & Data Fisik Anggota'}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', fontWeight: 500 }}>
                {activeTab === 'overview' 
                  ? 'Statistik operasi infrastruktur backend IQ-RA System.' 
                  : activeTab === 'users'
                  ? 'Manajemen otoritas, audit sandi, dan penugasan hak akses staf.'
                  : activeTab === 'teller'
                  ? 'Pusat pemrosesan setoran, penarikan, dan pembayaran angsuran anggota.'
                  : 'Pusat pengawasan berkas perbankan KYC, NIK, KK, Ibu Kandung, & Profil Finansial.'}
              </p>
            </div>
            
            <div style={{ background: '#022b1c', border: '2px solid #34d399', borderRadius: '30px', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 800, color: '#34d399', boxShadow: '0 4px 15px rgba(52, 211, 153, 0.2)' }}>
              <div style={{ width: '10px', height: '10px', background: '#34d399', borderRadius: '50%', boxShadow: '0 0 10px #34d399' }} />
              DATABASE SEHAT (LIVE)
            </div>
          </header>

          {/* ==================================== */}
          {/* TAB A: OVERVIEW VIEW                 */}
          {/* ==================================== */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '36px', animation: 'fadeIn 0.3s ease-out' }}>
              
              {/* Grid Row Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px' }}>
                
                {/* Metric Card 1 */}
                <div style={{ background: '#032419', border: '2px solid #cca334', borderRadius: '24px', padding: '32px', boxShadow: '0 15px 35px rgba(0,0,0,0.3)' }}>
                  <div style={{ color: '#f3c653', fontSize: '14px', fontWeight: 800, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Total Rekam Akun 👥
                  </div>
                  <div style={{ fontSize: '44px', fontWeight: 900, color: '#ffffff' }}>
                    {totalAccounts} <span style={{ fontSize: '18px', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Akun</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', margin: '20px 0' }}>
                    <div style={{ height: '100%', background: '#f3c653', width: '100%', borderRadius: '3px', boxShadow: '0 0 8px #f3c653' }} />
                  </div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Sinkron dengan modul keamanan Supabase Auth</div>
                </div>

                {/* Metric Card 2 */}
                <div style={{ background: '#032419', border: '2px solid #60a5fa', borderRadius: '24px', padding: '32px', boxShadow: '0 15px 35px rgba(0,0,0,0.3)' }}>
                  <div style={{ color: '#60a5fa', fontSize: '14px', fontWeight: 800, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Pegawai Koperasi Aktif 👔
                  </div>
                  <div style={{ fontSize: '44px', fontWeight: 900, color: '#ffffff' }}>
                    {totalStaff} <span style={{ fontSize: '18px', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Staf</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', margin: '20px 0' }}>
                    <div style={{ height: '100%', background: '#60a5fa', width: `${totalAccounts ? (totalStaff/totalAccounts)*100 : 0}%`, borderRadius: '3px', boxShadow: '0 0 8px #60a5fa' }} />
                  </div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Mencakup Level CS, Kasir, & Manajerial</div>
                </div>

                {/* Metric Card 3: Tied strictly to physical MEMBERS applications table */}
                <div style={{ background: '#032419', border: '2px solid #34d399', borderRadius: '24px', padding: '32px', boxShadow: '0 15px 35px rgba(0,0,0,0.3)' }}>
                  <div style={{ color: '#34d399', fontSize: '14px', fontWeight: 800, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Anggota Resmi Terdaftar 💳
                  </div>
                  <div style={{ fontSize: '44px', fontWeight: 900, color: '#ffffff' }}>
                    {totalApprovedMembers} <span style={{ fontSize: '18px', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Jiwa</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', margin: '20px 0' }}>
                    <div style={{ height: '100%', background: '#34d399', width: `${totalAccounts ? (totalApprovedMembers/totalAccounts)*100 : 0}%`, borderRadius: '3px', boxShadow: '0 0 8px #34d399' }} />
                  </div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Aktualisasi riil pengajuan dari modul registrasi Anggota</div>
                </div>

              </div>

              {/* Large Banner Spec Card */}
              <div style={{ 
                background: 'linear-gradient(90deg, #032419 0%, #043625 100%)', 
                border: '3px solid #cca334', 
                borderRadius: '28px', 
                padding: '40px', 
                position: 'relative', 
                overflow: 'hidden',
                boxShadow: '0 25px 60px rgba(0,0,0,0.4)'
              }}>
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#f3c653', marginBottom: '12px' }}>Spesifikasi Inti Kendali IT</h2>
                  <p style={{ color: '#ffffff', fontSize: '16px', maxWidth: '750px', lineHeight: 1.7, fontWeight: 500 }}>
                    Sistem Anda saat ini beroperasi di atas kerangka kerja Next.js modern yang disinkronkan secara real-time dengan <strong>Supabase Cloud PostgreSQL</strong>. Panel ini memberikan wewenang mutlak kepada Anda untuk memantau aktivitas digital klerikal koperasi.
                  </p>
                  <button 
                    onClick={() => setActiveTab('users')}
                    style={{ 
                      marginTop: '28px', 
                      background: '#f3c653', 
                      border: 'none', 
                      padding: '16px 32px', 
                      borderRadius: '14px', 
                      fontWeight: 900, 
                      color: '#02130e', 
                      fontSize: '15px', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      boxShadow: '0 6px 20px rgba(243, 198, 83, 0.3)',
                      transition: 'transform 0.2s' 
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    🛡️ Buka Konsol Pengaturan User
                  </button>
                </div>
                {/* Giant faint background logo */}
                <div style={{ opacity: 0.08, position: 'absolute', right: '40px', top: '50%', transform: 'translateY(-50%) scale(3.5) rotate(-15deg)', pointerEvents: 'none' }}>
                  <LogoIcon size={100} />
                </div>
              </div>

            </div>
          )}

          {/* ==================================== */}
          {/* TAB: TELLER TERMINAL VIEW           */}
          {/* ==================================== */}
          {activeTab === 'teller' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <TellerTerminal userId={user?.id} />
            </div>
          )}

          {/* ==================================== */}
          {/* TAB B: USER DIRECTORY LIST          */}
          {/* ==================================== */}
          {activeTab === 'users' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              
              {/* Table Toolbar: Title + Search Bar Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '20px' }}>
                <div style={{ fontSize: '16px', color: '#ffffff', fontWeight: 700, flexShrink: 0 }}>
                  {searchQuery ? (
                    <span>Ditemukan <strong style={{ color: '#f3c653', fontSize: '18px' }}>{filteredUsers.length}</strong> dari <strong style={{ color: 'rgba(255,255,255,0.6)' }}>{usersList.length}</strong> akun.</span>
                  ) : (
                    <span>Menampilkan <strong style={{ color: '#f3c653', fontSize: '18px' }}>{usersList.length}</strong> Rekam Akun Terdaftar.</span>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '12px', flexGrow: 1, justifyContent: 'flex-end' }}>
                  {/* Search Bar Input Field */}
                  <div style={{ position: 'relative', maxWidth: '350px', width: '100%' }}>
                    <input 
                      type="text"
                      placeholder="🔍 Cari nama staf atau email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#021c13',
                        border: '2px solid #cca334',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: 700,
                        outline: 'none',
                        boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.2)'
                      }}
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#f3c653', fontWeight: 900, cursor: 'pointer', fontSize: '14px' }}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <button 
                    onClick={() => {
                      setCreateErrorMsg(null);
                      setIsCreatingUser(true);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #f3c653 0%, #cca334 100%)',
                      border: 'none',
                      color: '#02130e',
                      padding: '12px 24px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 20px rgba(243,198,83,0.3)',
                      transition: 'transform 0.1s',
                      flexShrink: 0
                    }}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    ➕ Tambah User Staf
                  </button>

                  <button 
                    onClick={fetchUsersList}
                    disabled={loadingUsers}
                    style={{
                      background: '#032419',
                      border: '2px solid #cca334',
                      color: '#f3c653',
                      padding: '12px 24px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                      flexShrink: 0
                    }}
                  >
                  🔄 {loadingUsers ? 'Menyegarkan...' : 'Segarkan Tabel'}
                </button>
              </div>
            </div>

              {/* MASTER TABLE: SOLID CONTRAST CANVAS */}
              <div style={{
                background: '#032419', // Solid, Dark Background table
                border: '3px solid #cca334', // Thick solid Gold border for premium look
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.4)'
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#021c13', borderBottom: '3px solid #cca334' }}>
                        <th style={{ padding: '24px 20px', fontSize: '14px', fontWeight: 900, color: '#f3c653', textTransform: 'uppercase', letterSpacing: '1px' }}>Nama Pegawai / Anggota</th>
                        <th style={{ padding: '24px 20px', fontSize: '14px', fontWeight: 900, color: '#f3c653', textTransform: 'uppercase', letterSpacing: '1px' }}>Email Terdaftar</th>
                        <th style={{ padding: '24px 20px', fontSize: '14px', fontWeight: 900, color: '#f3c653', textTransform: 'uppercase', letterSpacing: '1px' }}>Password Audit</th>
                        <th style={{ padding: '24px 20px', fontSize: '14px', fontWeight: 900, color: '#f3c653', textTransform: 'uppercase', letterSpacing: '1px' }}>Jabatan Sistem</th>
                        <th style={{ padding: '24px 20px', fontSize: '14px', fontWeight: 900, color: '#f3c653', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>Aksi IT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingUsers ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '80px', textAlign: 'center', color: '#ffffff', fontSize: '18px', fontWeight: 800 }}>
                            Menarik data basis data secara terenkripsi...
                          </td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '80px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '18px', fontWeight: 700 }}>
                            {searchQuery ? `Pencarian untuk "${searchQuery}" tidak ditemukan.` : "Belum ada pengguna terdaftar."}
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u, idx) => {
                          const isMe = u.id === user?.id;
                          const isPassVisible = visiblePasswords[u.id] || false;
                          
                          // Role badge styling with maximum visibility
                          let badgeColors = { bg: 'rgba(255,255,255,0.1)', border: '#ffffff', text: '#ffffff' };
                          if (u.role === 'super_user') badgeColors = { bg: '#f3c653', border: '#f3c653', text: '#02130e' }; // Solid Gold
                          else if (u.role === 'manager') badgeColors = { bg: '#032b1c', border: '#60a5fa', text: '#60a5fa' }; // Blue
                          else if (u.role === 'member') badgeColors = { bg: '#032b1c', border: '#34d399', text: '#34d399' }; // Green
                          else badgeColors = { bg: '#032b1c', border: '#a78bfa', text: '#a78bfa' }; // Staff Purple

                          return (
                            <tr 
                              key={u.id} 
                              style={{ 
                                borderBottom: '1px solid rgba(204,163,52,0.15)',
                                background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                                transition: 'background 0.2s'
                              }}
                            >
                              {/* Cell 1: Avatar & Name */}
                              <td style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                  <div style={{ 
                                    width: '36px', 
                                    height: '36px', 
                                    borderRadius: '10px', 
                                    background: '#cca334', 
                                    color: '#02130e',
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    fontSize: '16px', 
                                    fontWeight: 900
                                  }}>
                                    {u.full_name ? u.full_name.charAt(0).toUpperCase() : '?'}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 900, fontSize: '16px', color: '#ffffff' }}>
                                      {u.full_name || 'Tanpa Nama'} 
                                      {isMe && <span style={{ fontSize: '11px', background: '#f3c653', color: '#02130e', padding: '3px 8px', borderRadius: '5px', marginLeft: '8px', fontWeight: 900, verticalAlign: 'middle' }}>ANDA</span>}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: '3px' }}>Daftar: {new Date(u.created_at).toLocaleDateString('id-ID')}</div>
                                  </div>
                                </div>
                              </td>

                              {/* Cell 2: Email */}
                              <td style={{ padding: '20px', fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
                                {u.email || <span style={{ color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>N/A</span>}
                              </td>

                              {/* Cell 3: Password (Auditable) */}
                              <td style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <code style={{
                                    background: '#010d09',
                                    border: '1.5px solid rgba(255,255,255,0.15)',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    color: '#f3c653',
                                    fontFamily: 'monospace',
                                    minWidth: '100px',
                                    display: 'inline-block',
                                    textAlign: 'center'
                                  }}>
                                    {u.password ? (isPassVisible ? u.password : '••••••••') : '—'}
                                  </code>
                                  {u.password && (
                                    <button 
                                      onClick={() => togglePasswordVisibility(u.id)}
                                      style={{ background: 'transparent', border: 'none', color: '#60a5fa', fontSize: '13px', cursor: 'pointer', fontWeight: 800 }}
                                    >
                                      {isPassVisible ? '👁️ Sembunyikan' : '👁️ Lihat'}
                                    </button>
                                  )}
                                </div>
                              </td>

                              {/* Cell 4: Role Badge */}
                              <td style={{ padding: '20px' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '8px 16px',
                                  borderRadius: '10px',
                                  fontSize: '12px',
                                  fontWeight: 900,
                                  letterSpacing: '0.5px',
                                  textTransform: 'uppercase',
                                  background: badgeColors.bg,
                                  border: `2px solid ${badgeColors.border}`,
                                  color: badgeColors.text,
                                  boxShadow: `0 0 10px ${badgeColors.border}15`
                                }}>
                                  {u.role}
                                </span>
                              </td>

                              {/* Cell 5: Admin Action Buttons */}
                              <td style={{ padding: '20px', textAlign: 'center' }}>
                                {isMe ? (
                                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>Terkunci</span>
                                ) : (
                                  <button 
                                    onClick={() => handleOpenEditRole(u)}
                                    style={{
                                      background: 'rgba(243, 198, 83, 0.1)',
                                      border: '2px solid #f3c653',
                                      color: '#f3c653',
                                      padding: '10px 20px',
                                      borderRadius: '12px',
                                      fontSize: '14px',
                                      fontWeight: 900,
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.background = '#f3c653'; e.currentTarget.style.color = '#02130e'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(243, 198, 83, 0.1)'; e.currentTarget.style.color = '#f3c653'; }}
                                  >
                                    Ubah Peran Staf
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ============================================== */}
          {/* TAB C: DIRECTORY OF PHYSICAL MEMBERS (CIF)     */}
          {/* ============================================== */}
          {activeTab === 'members' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              
              {/* CIF List Toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '20px' }}>
                <div style={{ fontSize: '16px', color: '#ffffff', fontWeight: 700 }}>
                  Menampilkan <strong style={{ color: '#f3c653', fontSize: '18px' }}>{membersList.length}</strong> Data CIF Fisik Terverifikasi.
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  {/* SUPER USER DUMMY INJECTION - Visual demo shortcut */}
                  <button 
                    onClick={handleInjectDemoCIF}
                    style={{
                      background: 'linear-gradient(135deg, #f3c653 0%, #cca334 100%)',
                      border: 'none',
                      color: '#02130e',
                      padding: '12px 24px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 20px rgba(243,198,83,0.3)',
                      transition: 'transform 0.1s'
                    }}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    ⚡ Suntik 1 CIF Uji Coba
                  </button>

                  <button 
                    onClick={fetchUsersList}
                    disabled={loadingUsers}
                    style={{
                      background: '#032419',
                      border: '2px solid #cca334',
                      color: '#f3c653',
                      padding: '12px 24px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                    }}
                  >
                    🔄 Segarkan
                  </button>
                </div>
              </div>

              {/* CIF DATA TABLE */}
              <div style={{
                background: '#032419',
                border: '3px solid #cca334',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.4)'
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#021c13', borderBottom: '3px solid #cca334' }}>
                        <th style={{ padding: '24px 20px', fontSize: '13px', fontWeight: 900, color: '#f3c653', textTransform: 'uppercase', letterSpacing: '1px' }}>Identitas & NIK</th>
                        <th style={{ padding: '24px 20px', fontSize: '13px', fontWeight: 900, color: '#f3c653', textTransform: 'uppercase', letterSpacing: '1px' }}>Verifikasi Ibu Kandung</th>
                        <th style={{ padding: '24px 20px', fontSize: '13px', fontWeight: 900, color: '#f3c653', textTransform: 'uppercase', letterSpacing: '1px' }}>Pekerjaan & Pendapatan</th>
                        <th style={{ padding: '24px 20px', fontSize: '13px', fontWeight: 900, color: '#f3c653', textTransform: 'uppercase', letterSpacing: '1px' }}>Kontak Aktif</th>
                        <th style={{ padding: '24px 20px', fontSize: '13px', fontWeight: 900, color: '#f3c653', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>Audit Berkas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingUsers ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '80px', textAlign: 'center', color: '#ffffff', fontSize: '16px', fontWeight: 700 }}>
                            Membaca data fisik CIF secara terenkripsi...
                          </td>
                        </tr>
                      ) : membersList.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '80px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '16px', fontWeight: 700, lineHeight: 1.6 }}>
                            Belum ada data fisik anggota (CIF) terdaftar di dalam tabel members.<br/>
                            <span style={{ fontSize: '13px', color: '#f3c653', display: 'inline-block', marginTop: '8px', background: 'rgba(243,198,83,0.1)', padding: '6px 16px', borderRadius: '20px', border: '1px solid rgba(243,198,83,0.2)' }}>💡 Tip Admin: Klik tombol <strong>"⚡ Suntik 1 CIF Uji Coba"</strong> untuk melahirkan data simulasi secara instan!</span>
                          </td>
                        </tr>
                      ) : (
                        membersList.map((m, idx) => {
                          const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
                          return (
                            <tr 
                              key={m.id} 
                              style={{ 
                                borderBottom: '1px solid rgba(204,163,52,0.15)',
                                background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                                transition: 'background 0.2s'
                              }}
                            >
                              {/* Identity NIK */}
                              <td style={{ padding: '20px' }}>
                                <div style={{ fontWeight: 900, fontSize: '16px', color: '#ffffff' }}>
                                  {m.users?.full_name || 'Nama Tidak Sinkron'}
                                </div>
                                <div style={{ fontSize: '12px', color: '#f3c653', fontWeight: 800, marginTop: '3px', fontFamily: 'monospace' }}>
                                  NIK: {m.nik}
                                </div>
                              </td>

                              {/* Mother Name */}
                              <td style={{ padding: '20px', fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                                👩‍👧‍👦 {m.mother_name}
                              </td>

                              {/* Occupation and Money */}
                              <td style={{ padding: '20px' }}>
                                <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>{m.occupation}</div>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399', marginTop: '3px' }}>
                                  💵 {formatter.format(m.monthly_income)} / bulan
                                </div>
                              </td>

                              {/* Phone / Contact */}
                              <td style={{ padding: '20px', fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
                                📱 {m.phone_number}
                              </td>

                              {/* KYC Audit Button */}
                              <td style={{ padding: '20px', textAlign: 'center' }}>
                                <button 
                                  onClick={() => setSelectedCIF(m)}
                                  style={{
                                    background: '#032b1c',
                                    border: '2px solid #34d399',
                                    color: '#34d399',
                                    padding: '8px 16px',
                                    borderRadius: '10px',
                                    fontSize: '13px',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 2px 8px rgba(52,211,153,0.1)'
                                  }}
                                  onMouseOver={(e) => { e.currentTarget.style.background = '#34d399'; e.currentTarget.style.color = '#02130e'; }}
                                  onMouseOut={(e) => { e.currentTarget.style.background = '#032b1c'; e.currentTarget.style.color = '#34d399'; }}
                                >
                                  🔍 Buka Dokumen KYC
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </main>

        {/* 3. MODAL POPUP: High Contrast Opaque Box */}
        {editingUser && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(1, 10, 7, 0.9)', // Extreme dark mask
            backdropFilter: 'blur(5px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            
            <div style={{
              background: '#032419',
              border: '4px solid #f3c653', // Heavy Gold Border for clear focus
              borderRadius: '28px',
              width: '100%',
              maxWidth: '500px',
              padding: '40px',
              boxShadow: '0 30px 80px rgba(0,0,0,0.8)',
              animation: 'scaleUp 0.2s ease-out'
            }}>
              
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#f3c653', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>🛡️ Promosi Jabatan Staf</h2>
              <p style={{ color: '#ffffff', fontSize: '15px', marginBottom: '28px', fontWeight: 500, lineHeight: 1.5 }}>
                Silakan pilih hak akses sistem baru untuk akun <strong>{editingUser.full_name}</strong>:
              </p>

              {/* Option Dropdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
                <label style={{ fontSize: '14px', fontWeight: 800, color: '#f3c653' }}>Daftar Peran Otoritas</label>
                <select 
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  style={{
                    background: '#ffffff', // Pure high-contrast white
                    border: '3px solid #cca334', // Premium Golden Border
                    borderRadius: '14px',
                    padding: '16px',
                    color: '#02130e', // Dark Emerald green text for extreme legibility
                    fontSize: '16px',
                    fontWeight: 800,
                    outline: 'none',
                    cursor: 'pointer',
                    width: '100%',
                    boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.05)'
                  }}
                >
                  <option value="member">MEMBER (Nasabah Koperasi)</option>
                  <option value="teller">TELLER (Pelayanan Tunai)</option>
                  <option value="customer_service">CUSTOMER SERVICE (Manajemen CIF)</option>
                  <option value="account_officer">ACCOUNT OFFICER (Pembiayaan)</option>
                  <option value="accounting">ACCOUNTING (Pembukuan SAK EP)</option>
                  <option value="manager">MANAGER (Otorisasi & Approval)</option>
                  <option value="dps">DEWAN PENGAWAS SYARIAH (DPS)</option>
                  <option value="super_user">SUPER USER (Otoritas Penuh IT)</option>
                </select>
              </div>

              {/* Critical Alert box inside modal */}
              <div style={{
                background: 'rgba(234, 179, 8, 0.1)',
                border: '2px solid #facc15',
                borderRadius: '14px',
                padding: '16px',
                marginBottom: '32px',
                fontSize: '14px',
                color: '#ffffff',
                fontWeight: 600,
                lineHeight: 1.5
              }}>
                ⚠️ <span style={{ color: '#facc15', fontWeight: 900 }}>INFORMASI:</span> Jabatan baru akan langsung aktif secara real-time di semua terminal perangkat user.
              </div>

              {/* Modal Action Buttons */}
              <div style={{ display: 'flex', gap: '16px' }}>
                <button 
                  onClick={() => setEditingUser(null)}
                  style={{
                    flexGrow: 1,
                    background: 'transparent',
                    border: '2px solid rgba(255,255,255,0.3)',
                    color: '#ffffff',
                    padding: '16px',
                    borderRadius: '14px',
                    fontWeight: 800,
                    fontSize: '15px',
                    cursor: 'pointer'
                  }}
                >
                  Batalkan
                </button>
                <button 
                  onClick={handleSaveRole}
                  disabled={isSavingRole}
                  style={{
                    flexGrow: 1,
                    background: '#f3c653',
                    border: 'none',
                    color: '#02130e',
                    padding: '16px',
                    borderRadius: '14px',
                    fontWeight: 900,
                    fontSize: '15px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(243, 198, 83, 0.3)'
                  }}
                >
                  {isSavingRole ? 'Menyimpan...' : 'Simpan Otoritas'}
                </button>
              </div>

            </div>

          </div>
        )}

        {/* NEW ADDITION: 3.5 MODAL POPUP CREATE NEW USER */}
        {isCreatingUser && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(1, 10, 7, 0.9)',
            backdropFilter: 'blur(6px)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease-out',
            padding: '20px'
          }}>
            <div style={{
              background: '#032419',
              border: '4px solid #cca334',
              borderRadius: '28px',
              width: '100%',
              maxWidth: '520px',
              padding: '36px',
              boxShadow: '0 30px 80px rgba(0,0,0,0.8)',
              animation: 'scaleUp 0.2s ease-out',
              maxHeight: '95vh',
              overflowY: 'auto'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#f3c653', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                ➕ Tambah Akun Staf Baru
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '24px', fontWeight: 500 }}>
                Daftarkan hak akses baru ke sistem secara langsung dan aman.
              </p>

              {createErrorMsg && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '2px solid #fca5a5',
                  borderRadius: '12px',
                  padding: '12px',
                  color: '#fca5a5',
                  fontSize: '13px',
                  fontWeight: 700,
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  ⚠️ {createErrorMsg}
                </div>
              )}

              <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#f3c653', marginBottom: '8px', textTransform: 'uppercase' }}>Nama Lengkap</label>
                  <input 
                    type="text"
                    required
                    placeholder="Contoh: Muhammad Ridwan"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    style={{
                      width: '100%', background: '#021c13', border: '2px solid rgba(255,255,255,0.2)',
                      borderRadius: '12px', padding: '14px', color: '#fff', fontSize: '15px',
                      fontWeight: 600, outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#f3c653', marginBottom: '8px', textTransform: 'uppercase' }}>Email Institusi</label>
                  <input 
                    type="email"
                    required
                    placeholder="nama.staff@koperasi.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    style={{
                      width: '100%', background: '#021c13', border: '2px solid rgba(255,255,255,0.2)',
                      borderRadius: '12px', padding: '14px', color: '#fff', fontSize: '15px',
                      fontWeight: 600, outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#f3c653', marginBottom: '8px', textTransform: 'uppercase' }}>Kata Sandi Sementara</label>
                  <input 
                    type="password"
                    required
                    minLength={6}
                    placeholder="Minimal 6 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{
                      width: '100%', background: '#021c13', border: '2px solid rgba(255,255,255,0.2)',
                      borderRadius: '12px', padding: '14px', color: '#fff', fontSize: '15px',
                      fontWeight: 600, outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#f3c653', marginBottom: '8px', textTransform: 'uppercase' }}>Pilih Hak Akses (Role)</label>
                  <select 
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    style={{
                      width: '100%', background: '#fff', border: '3px solid #cca334',
                      borderRadius: '12px', padding: '14px', color: '#02130e', fontSize: '15px',
                      fontWeight: 800, outline: 'none', cursor: 'pointer'
                    }}
                  >
                    <option value="member">Nasabah (MEMBER)</option>
                    <option value="teller">Kasir Utama (TELLER)</option>
                    <option value="customer_service">Customer Service (CS)</option>
                    <option value="account_officer">Account Officer (AO)</option>
                    <option value="accounting">Accounting (SAK EP)</option>
                    <option value="manager">General Manager (GM)</option>
                    <option value="dps">Dewan Pengawas Syariah (DPS)</option>
                    <option value="super_user">Super User (IT ADMIN)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '14px', marginTop: '16px' }}>
                  <button 
                    type="button"
                    onClick={() => setIsCreatingUser(false)}
                    style={{
                      flexGrow: 1, background: 'transparent', border: '2px solid rgba(255,255,255,0.3)',
                      color: '#fff', padding: '16px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer'
                    }}
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    disabled={isSavingNewUser}
                    style={{
                      flexGrow: 2, background: 'linear-gradient(135deg, #f3c653 0%, #cca334 100%)',
                      border: 'none', color: '#02130e', padding: '16px', borderRadius: '12px',
                      fontWeight: 900, fontSize: '15px', cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(243,198,83,0.3)'
                    }}
                  >
                    {isSavingNewUser ? '⏳ Memproses...' : '💾 Simpan Akun'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 4. KYC VIEW MODAL POPUP: Luxurious dossier display */}
        {selectedCIF && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(1, 10, 7, 0.95)', // Extra dark mask for KYC security
            backdropFilter: 'blur(8px)',
            zIndex: 150,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease-out',
            padding: '20px'
          }}>
            
            <div style={{
              background: '#032419',
              border: '4px solid #34d399', // Vibrant Green security border
              borderRadius: '28px',
              width: '100%',
              maxWidth: '650px',
              padding: '40px',
              boxShadow: '0 40px 100px rgba(0,0,0,0.9)',
              animation: 'scaleUp 0.2s ease-out',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              
              {/* Header & Logo banner inside modal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#34d399', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                    📂 Dokumen Fisik KYC Nasabah
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: '4px 0 0' }}>
                    ID Sistem Unik: {selectedCIF.id}
                  </p>
                </div>
                <span style={{
                  fontSize: '11px',
                  background: '#022b1c',
                  color: '#34d399',
                  border: '1px solid #34d399',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontWeight: 900,
                  letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}>
                  STATUS: {selectedCIF.status}
                </span>
              </div>

              {/* DATA GRID: Clean grouping fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '36px' }}>
                
                {/* Section A: Data Identitas */}
                <div>
                  <div style={{ color: '#f3c653', fontSize: '12px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px', borderLeft: '3px solid #f3c653', paddingLeft: '8px' }}>
                    1. Kredensial & Identitas Negara
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#021c13', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: '4px' }}>NAMA LENGKAP (CIF)</div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>{selectedCIF.users?.full_name || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: '4px' }}>NOMOR WHATSAPP</div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>{selectedCIF.phone_number}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: '4px' }}>NIK (NOMOR KTP)</div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#f3c653', fontFamily: 'monospace' }}>{selectedCIF.nik}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: '4px' }}>NOMOR KARTU KELUARGA (KK)</div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace' }}>{selectedCIF.kk_number}</div>
                    </div>
                  </div>
                </div>

                {/* Section B: Keamanan & Geografis */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <div style={{ color: '#f3c653', fontSize: '12px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px', borderLeft: '3px solid #f3c653', paddingLeft: '8px' }}>
                      2. Keamanan Bank
                    </div>
                    <div style={{ background: '#021c13', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', height: 'calc(100% - 24px)' }}>
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: '4px' }}>IBU KANDUNG</div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>{selectedCIF.mother_name}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: '4px' }}>KEYAKINAN / AGAMA</div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>{selectedCIF.religion || 'Islam'}</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#f3c653', fontSize: '12px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px', borderLeft: '3px solid #f3c653', paddingLeft: '8px' }}>
                      3. Profil Ekonomi
                    </div>
                    <div style={{ background: '#021c13', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', height: 'calc(100% - 24px)' }}>
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: '4px' }}>PROFESI PEKERJAAN</div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>{selectedCIF.occupation}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: '4px' }}>PENDAPATAN PER BULAN</div>
                        <div style={{ fontSize: '16px', fontWeight: 900, color: '#34d399' }}>
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(selectedCIF.monthly_income)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section C: Alamat Lengkap */}
                <div>
                  <div style={{ color: '#f3c653', fontSize: '12px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px', borderLeft: '3px solid #f3c653', paddingLeft: '8px' }}>
                    4. Informasi Geografis & Domisili
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#021c13', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: '4px' }}>ALAMAT KTP RESMI</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', lineHeight: 1.4 }}>{selectedCIF.ktp_address}</div>
                    </div>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', marginTop: '4px' }}>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: '4px' }}>ALAMAT TINGGAL AKTIF (DOMISILI)</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', lineHeight: 1.4 }}>{selectedCIF.domicile_address}</div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Box: Close Dossier */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setSelectedCIF(null)}
                  style={{
                    background: '#34d399',
                    border: 'none',
                    color: '#02130e',
                    padding: '16px 40px',
                    borderRadius: '14px',
                    fontWeight: 900,
                    fontSize: '15px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(52, 211, 153, 0.3)',
                    transition: 'transform 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  🔒 Tutup Berkas Otoritas
                </button>
              </div>

            </div>

          </div>
        )}
        
        <style jsx global>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes scaleUp { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        `}</style>

      </div>
    );
  }

  // ==============================================================
  // 🧑 NORMAL USER / MEMBER VIEW: CLEAN GLASS ON DARK CANVAS
  // ==============================================================
  return (
    <>
      <div style={{
        minHeight: '100vh',
        background: '#02130e',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative'
      }}>
        <DashboardSiteBackground />
        
        <div 
          className="hero-glass-container"
          style={{
            background: '#032419',
            border: '3px solid #cca334',
            maxWidth: '600px',
            width: '100%',
            padding: '60px 40px',
            textAlign: 'center',
            borderRadius: '28px',
            boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
            animation: 'scaleUp 0.3s ease-out',
            position: 'relative',
            zIndex: 10
          }}
        >
          <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '24px' }}>
            <LogoIcon size={60} rounded={14} />
          </div>

          <h1 style={{ color: '#ffffff', fontSize: '34px', fontWeight: 900, marginBottom: '14px', letterSpacing: '-0.5px' }}>
            Dasbor <span style={{ color: '#f3c653' }}>Nasabah</span>
          </h1>
          
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '18px', lineHeight: 1.6, marginBottom: '36px', fontWeight: 500 }}>
            Selamat datang di gerbang utama transaksi Syariah. Status autentikasi akses Anda aman dan tervalidasi!
          </p>

          {/* Info Display Card */}
          <div style={{
            background: '#010d09',
            border: '2px solid rgba(204,163,52,0.3)',
            borderRadius: '20px',
            padding: '24px',
            textAlign: 'left',
            marginBottom: '36px'
          }}>
            <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px', fontWeight: 600 }}>Nama Lengkap</span>
              <span style={{ fontWeight: 900, color: '#ffffff', fontSize: '16px' }}>{profile?.full_name || user?.user_metadata?.full_name || 'Pengguna'}</span>
            </div>
            <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px', fontWeight: 600 }}>Email Akun</span>
              <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '16px' }}>{user?.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px', fontWeight: 600 }}>Hak Akses</span>
              <span style={{ 
                fontWeight: 900, 
                color: '#02130e',
                background: '#f3c653',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                textTransform: 'uppercase',
                boxShadow: '0 2px 8px rgba(243, 198, 83, 0.3)'
              }}>{profile?.role || 'MEMBER'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button 
              onClick={handleLogout}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '2px solid #fca5a5',
                color: '#ffffff',
                padding: '15px 36px',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#ef4444'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; }}
            >
              🔌 Keluar Akun
            </button>
            
            {profile?.role === 'customer_service' && (
              <button 
                onClick={() => router.push('/customer-service')}
                style={{
                  background: 'linear-gradient(135deg, #f3c653 0%, #cca334 100%)',
                  border: 'none',
                  color: '#02130e',
                  padding: '15px 36px',
                  borderRadius: '14px',
                  fontSize: '16px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  marginLeft: '15px'
                }}
              >
                🚀 Buka Dashboard CS
              </button>
            )}

            {profile?.role === 'teller' && (
              <button 
                onClick={() => router.push('/teller')}
                style={{
                  background: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
                  border: 'none',
                  color: '#02130e',
                  padding: '15px 36px',
                  borderRadius: '14px',
                  fontSize: '16px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  marginLeft: '15px'
                }}
              >
                🏪 Buka Terminal Teller
              </button>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
