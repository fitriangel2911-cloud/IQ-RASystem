'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import TellerTerminal from '@/components/dashboard/TellerTerminal';
import BrandLogo from '@/components/brand/BrandLogo';
import ManagerDashboard from '@/components/dashboard/ManagerDashboard';
import DPSDashboard from '@/components/dashboard/DPSDashboard';
import AODashboard from '@/components/dashboard/AODashboard';
import AccountingDashboard from '@/components/dashboard/AccountingDashboard';
import CSDashboard from '@/components/dashboard/CSDashboard';
import AIKnowledgeManager from '@/components/dashboard/AIKnowledgeManager';
import ThemeToggle from '@/components/dashboard/ThemeToggle';
import { useTheme } from '@/context/ThemeContext';

// Intensely styled menu button for the dashboard sidebar
function DashboardMenuButton({ active, onClick, icon, label, isSpecial = false }: { active: boolean, onClick: () => void, icon: string, label: string, isSpecial?: boolean }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: active 
          ? 'var(--text-primary)' 
          : (isHovered ? 'var(--border-primary)' : 'transparent'),
        border: isSpecial ? '2px solid var(--emerald-deep)' : 'none',
        textAlign: 'left',
        padding: isSpecial ? '18px 20px' : '15px 18px',
        borderRadius: '14px',
        color: active ? 'var(--bg-page)' : 'var(--text-primary)',
        fontWeight: isSpecial ? 900 : 800,
        fontSize: isSpecial ? '18px' : '16px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        transform: !active && isHovered ? 'translateX(6px)' : 'translateX(0)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: active ? '0 8px 20px var(--shadow-color)' : 'none',
        width: '100%'
      }}
    >
      <span style={{ 
        fontSize: isSpecial ? '24px' : '22px', 
        opacity: active ? 1 : 0.8,
        transform: isHovered ? 'scale(1.15)' : 'scale(1)',
        transition: 'transform 0.2s ease'
      }}>{icon}</span>
      <span style={{ opacity: active ? 1 : 0.9 }}>{label}</span>
    </button>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Tab state (overview, users, members, settings, teller, manager, dps, ao, accounting, cs, rules)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'members' | 'settings' | 'teller' | 'manager' | 'dps' | 'ao' | 'accounting' | 'cs' | 'rules' | 'ai_knowledge'>('overview');
  const [userSubTab, setUserSubTab] = useState<'staff' | 'members'>('staff');
  const [activeSubMenu, setActiveSubMenu] = useState<string>('overview');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // System parameters state
  const [systemParams, setSystemParams] = useState<any[]>([]);
  const [loadingParams, setLoadingParams] = useState(false);
  
  // Access rules state
  const [accessRules, setAccessRules] = useState<any[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  
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
  
  // Sidebar open/close state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
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
    
    try {
      setUser(currentUser);

      const { data: dbProfile, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (dbError || !dbProfile) {
        console.error('Profile fetch error:', dbError);
        setLoading(false);
        return;
      }

      setProfile(dbProfile);
      
      // 1. PRIORITAS REDIRECT: Cek role staff khusus dulu
      const role = dbProfile.role;
      
      if (role === 'customer_service') {
        router.push('/customer-service');
        return;
      }
      if (role === 'teller') {
        router.push('/teller');
        return;
      }
      if (role === 'accounting') {
        router.push('/accounting');
        return;
      }
      if (role === 'manager') {
        router.push('/manager');
        return;
      }
      if (role === 'dps') {
        router.push('/dps');
        return;
      }
      if (role === 'member') {
        router.push('/members');
        return;
      }
      if (role === 'account_officer' || role === 'ao') {
        router.push('/ao');
        return;
      }
    
      const isStaffRole = ['super_admin', 'manager', 'account_officer', 'ao', 'accounting', 'dps'].includes(role);
      if (isStaffRole) {
        fetchUsersList();
      }
    } catch (err) {
      console.error('Session fetch crash:', err);
    } finally {
      setLoading(false);
    }
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

  const fetchAccessRules = async () => {
    setLoadingRules(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('access_rules')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error && data) {
      setAccessRules(data);
    }
    setLoadingRules(false);
  };

  useEffect(() => {
    fetchSession();
    fetchAccessRules();
    
    // Deteksi otomatis layar HP
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize(); // Saat pertama render
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  // Exclusive Super Admin simulation utility: Dynamically injects physical CIF into physical database
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
      <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-page)', transition: 'background 0.5s ease', alignItems: 'center', justifyContent: 'center', color: 'white', gap: '16px', position: 'relative', zIndex: 10 }}>
        <div style={{ border: '3px solid transparent', borderTopColor: '#f3c653', borderRightColor: '#f3c653', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
        <h3 style={{ fontWeight: 800, fontSize: '18px', color: '#f3c653' }}>Memuat Dasbor iQ-RA...</h3>
        <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ==============================================================
  // 👑 INTERNAL STAFF VIEW: (SUPER ADMIN, TELLER, MANAGER, ETC)
  // ==============================================================
  const isStaff = ['super_admin', 'teller', 'manager', 'account_officer', 'accounting'].includes(profile?.role);
  
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
      <div className={isSidebarOpen ? 'sidebar-open' : ''} style={{ 
        minHeight: '100vh', 
        background: 'transparent',
        color: 'var(--text-primary)',
        display: 'flex',
      }}>

        <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} />

        {/* 1. SIDEBAR: Solid, Bold, Premium Dark Emerald */}
        <aside style={{
          width: isSidebarOpen ? '320px' : '0px',
          opacity: isSidebarOpen ? 1 : 0,
          background: 'var(--bg-sidebar)',
          backdropFilter: 'blur(25px)',
          borderRight: isSidebarOpen ? '4px solid var(--gold-intense)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          padding: isSidebarOpen ? '40px 24px' : '0px',
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: 100,
          boxShadow: isSidebarOpen ? '10px 0 30px var(--shadow-color)' : 'none',
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden'
        }}>
          {/* Sidebar Close Toggle - Enhanced Spacing & Approved High Contrast Teller Style */}
          {isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(false)}
              style={{
                position: 'absolute',
                right: '16px',
                top: '16px',
                background: theme === 'light' ? '#ffffff' : 'var(--bg-page)',
                border: theme === 'light' ? '2.5px solid #000000' : '2px solid #ffffff',
                borderRadius: '8px',
                color: theme === 'light' ? '#000000' : '#ffffff',
                cursor: 'pointer',
                padding: '5px 10px',
                fontWeight: 900,
                transition: 'all 0.3s',
                zIndex: 110
              }}
            >
              ✕
            </button>
          )}

          {/* Brand Header with ThemeToggle shifted to the left (marginRight: 45px) */}
          <div style={{ marginBottom: '40px', position: 'relative', marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <BrandLogo size={42} fontSize="22px" textColor="var(--text-primary)" />
              <div style={{ marginRight: '45px' }}>
                <ThemeToggle />
              </div>
            </div>
            <span style={{ color: 'var(--text-primary)', fontSize: '11px', display: 'block', opacity: 0.8, marginTop: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px' }}>IT & SUPER ADMIN PORTAL</span>
          </div>

          <div style={{
            background: 'var(--border-primary)',
            border: '1px solid var(--gold-bright)',
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
              background: 'var(--gold-intense)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '18px', 
              fontWeight: 900, 
              color: '#02130e',
              boxShadow: '0 4px 10px var(--shadow-color)',
              flexShrink: 0
            }}>
              {profile?.full_name ? profile.full_name.charAt(0) : 'A'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)' }}>{profile?.full_name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{profile?.email}</div>
            </div>
          </div>

          {/* Sidebar Nav */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1, overflowY: 'auto', paddingRight: '4px' }}>
            
            <div style={{ fontSize: '11px', color: theme === 'light' ? 'var(--emerald-deep)' : '#f3c653', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', paddingLeft: '16px', marginBottom: '4px' }}>CORE BANKING</div>
            
            <DashboardMenuButton active={activeTab === 'overview'} onClick={() => { setActiveTab('overview'); setActiveSubMenu('overview'); }} icon="📊" label="Ringkasan Eksekutif" />

            {/* KEANGGOTAAN (CS) */}
            <DashboardMenuButton active={activeTab === 'cs'} onClick={() => { setActiveTab('cs'); setActiveSubMenu('onboarding'); }} icon="🎧" label="Modul Keanggotaan" />
            {activeTab === 'cs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '24px', borderLeft: theme === 'light' ? '2px solid rgba(4, 49, 33, 0.3)' : '2px solid rgba(243, 198, 83, 0.3)', marginBottom: '8px' }}>
                <button onClick={() => setActiveSubMenu('onboarding')} style={{ background: 'transparent', border: 'none', color: activeSubMenu === 'onboarding' ? (theme === 'light' ? 'var(--emerald-deep)' : '#f3c653') : 'var(--text-secondary)', fontSize: '13px', fontWeight: 700, textAlign: 'left', padding: '6px 0', cursor: 'pointer' }}>• Pendaftaran Anggota (CIF)</button>
                <button onClick={() => setActiveSubMenu('members')} style={{ background: 'transparent', border: 'none', color: activeSubMenu === 'members' ? (theme === 'light' ? 'var(--emerald-deep)' : '#f3c653') : 'var(--text-secondary)', fontSize: '13px', fontWeight: 700, textAlign: 'left', padding: '6px 0', cursor: 'pointer' }}>• Database Anggota Aktif</button>
              </div>
            )}

            {/* KASIR (TELLER) */}
            <DashboardMenuButton 
              active={activeTab === 'teller'} 
              onClick={() => { setActiveTab('teller'); setActiveSubMenu('overview'); }} 
              icon="🏪" 
              label="Layanan Kasir / Teller" 
              isSpecial={true}
            />

            {/* PEMBIAYAAN (AO) */}
            <DashboardMenuButton active={activeTab === 'ao'} onClick={() => { setActiveTab('ao'); setActiveSubMenu('overview'); }} icon="🤝" label="Manajemen Pembiayaan" />
            {activeTab === 'ao' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '24px', borderLeft: theme === 'light' ? '2px solid rgba(4, 49, 33, 0.3)' : '2px solid rgba(243, 198, 83, 0.3)', marginBottom: '8px' }}>
                <button onClick={() => setActiveSubMenu('overview')} style={{ background: 'transparent', border: 'none', color: activeSubMenu === 'overview' ? (theme === 'light' ? 'var(--emerald-deep)' : '#f3c653') : 'var(--text-secondary)', fontSize: '13px', fontWeight: 700, textAlign: 'left', padding: '6px 0', cursor: 'pointer' }}>• Pipeline Nasabah</button>
                <button onClick={() => setActiveSubMenu('prospects')} style={{ background: 'transparent', border: 'none', color: activeSubMenu === 'prospects' ? (theme === 'light' ? 'var(--emerald-deep)' : '#f3c653') : 'var(--text-secondary)', fontSize: '13px', fontWeight: 700, textAlign: 'left', padding: '6px 0', cursor: 'pointer' }}>• Analisis Akad & AI</button>
                <button onClick={() => setActiveSubMenu('survey')} style={{ background: 'transparent', border: 'none', color: activeSubMenu === 'survey' ? (theme === 'light' ? 'var(--emerald-deep)' : '#f3c653') : 'var(--text-secondary)', fontSize: '13px', fontWeight: 700, textAlign: 'left', padding: '6px 0', cursor: 'pointer' }}>• Verifikasi Lapangan</button>
              </div>
            )}

            {/* AKUNTANSI (ACCOUNTING) */}
            <DashboardMenuButton active={activeTab === 'accounting'} onClick={() => { setActiveTab('accounting'); setActiveSubMenu('overview'); }} icon="💼" label="Keuangan & Akuntansi" />
            {activeTab === 'accounting' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '24px', borderLeft: theme === 'light' ? '2px solid rgba(4, 49, 33, 0.3)' : '2px solid rgba(243, 198, 83, 0.3)', marginBottom: '8px' }}>
                <button onClick={() => setActiveSubMenu('journal')} style={{ background: 'transparent', border: 'none', color: activeSubMenu === 'journal' ? (theme === 'light' ? 'var(--emerald-deep)' : '#f3c653') : 'var(--text-secondary)', fontSize: '13px', fontWeight: 700, textAlign: 'left', padding: '6px 0', cursor: 'pointer' }}>• Jurnal Umum Otomatis</button>
                <button onClick={() => setActiveSubMenu('ledger')} style={{ background: 'transparent', border: 'none', color: activeSubMenu === 'ledger' ? (theme === 'light' ? 'var(--emerald-deep)' : '#f3c653') : 'var(--text-secondary)', fontSize: '13px', fontWeight: 700, textAlign: 'left', padding: '6px 0', cursor: 'pointer' }}>• Buku Besar & Neraca</button>
                <button onClick={() => setActiveSubMenu('reports')} style={{ background: 'transparent', border: 'none', color: activeSubMenu === 'reports' ? (theme === 'light' ? 'var(--emerald-deep)' : '#f3c653') : 'var(--text-secondary)', fontSize: '13px', fontWeight: 700, textAlign: 'left', padding: '6px 0', cursor: 'pointer' }}>• Laporan SAK EP</button>
              </div>
            )}

            <div style={{ height: '1px', background: 'var(--border-primary)', margin: '12px 0' }} />
            
            <div style={{ fontSize: '11px', color: theme === 'light' ? 'var(--emerald-deep)' : '#cca334', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', paddingLeft: '16px', marginBottom: '4px' }}>PENGAWASAN & OTO</div>

            <DashboardMenuButton active={activeTab === 'manager'} onClick={() => { setActiveTab('manager'); setActiveSubMenu('overview'); }} icon="🏢" label="Otorisasi Manager" />
            <DashboardMenuButton active={activeTab === 'dps'} onClick={() => { setActiveTab('dps'); setActiveSubMenu('overview'); }} icon="🕌" label="Audit Syariah (DPS)" />

            <div style={{ height: '1px', background: 'var(--border-primary)', margin: '12px 0' }} />
            
            <div style={{ fontSize: '11px', color: theme === 'light' ? 'var(--emerald-deep)' : '#cca334', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', paddingLeft: '16px', marginBottom: '4px' }}>KECERDASAN BUATAN</div>
            <DashboardMenuButton active={activeTab === 'ai_knowledge'} onClick={() => { setActiveTab('ai_knowledge'); setActiveSubMenu('overview'); }} icon="🤖" label="Knowledge Base (RAG)" />

            <div style={{ height: '1px', background: 'var(--border-primary)', margin: '12px 0' }} />

            <div style={{ fontSize: '11px', color: theme === 'light' ? 'var(--emerald-deep)' : 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', paddingLeft: '16px', marginBottom: '4px' }}>ADMINISTRASI IT</div>
            
            <DashboardMenuButton active={activeTab === 'users'} onClick={() => { setActiveTab('users'); setActiveSubMenu('overview'); }} icon="👥" label="Manajemen User" />
            <DashboardMenuButton active={activeTab === 'rules'} onClick={() => { setActiveTab('rules'); setActiveSubMenu('overview'); }} icon="🛡️" label="Aturan Akses (RBAC)" />
            <DashboardMenuButton active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setActiveSubMenu('overview'); }} icon="🛠️" label="Konfigurasi Sistem" />
          </nav>

          {/* Sidebar Footer Action */}
          <button 
            onClick={handleLogout}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '2px solid #ef4444',
              color: '#ef4444',
              padding: '14px',
              borderRadius: '14px',
              fontWeight: 800,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.1)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#ffffff'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.color = '#ef4444'; }}
          >
            🔌 Keluar Kontrol Panel
          </button>
        </aside>

        {/* 2. MAIN CONTENT AREA: Crystal Clear High Contrast */}
        <main className="main-content-layout" style={{
          flexGrow: 1,
          padding: '48px',
          overflowY: 'auto',
          height: '100vh',
          position: 'relative',
          zIndex: 10
        }}>
          
          {/* Header */}
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '44px' }}>
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                style={{
                  background: theme === 'light' ? '#ffffff' : 'var(--bg-sidebar)',
                  border: theme === 'light' ? '2.5px solid #000000' : '2px solid #ffffff',
                  borderRadius: '12px',
                  color: theme === 'light' ? '#000000' : '#ffffff',
                  padding: '12px 20px',
                  marginRight: '24px',
                  cursor: 'pointer',
                  fontWeight: 900,
                  boxShadow: '0 4px 15px var(--shadow-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.3s ease',
                  zIndex: 50
                }}
              >
                ☰ <span style={{ fontSize: '13px', letterSpacing: '1px' }}>KONTROL PANEL</span>
              </button>
            )}
            <div style={{
              background: 'var(--bg-header)',
              backdropFilter: 'blur(16px)',
              border: '1px solid var(--border-primary)',
              borderLeft: '6px solid var(--gold-intense)',
              borderRadius: '24px',
              padding: '24px 36px',
              boxShadow: '0 20px 40px var(--shadow-color)',
              flexGrow: 1,
              marginRight: '30px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ background: 'var(--border-primary)', color: 'var(--gold-intense)', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 900, letterSpacing: '1px' }}>Pusat Kendali Administrasi</span>
              </div>
              <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: '6px' }}>
                {activeTab === 'overview' ? 'Ikhtisar Operasi Sistem' : 
                 activeTab === 'users' ? 'Master Direktori User & Peran' : 
                 activeTab === 'teller' ? 'Layanan Kasir Syariah' :
                 activeTab === 'manager' ? 'Pusat Kontrol Eksekutif' :
                 activeTab === 'dps' ? 'Pengawasan Kepatuhan Syariah' :
                 activeTab === 'ao' ? 'Dashboard Operasional AO' :
                 activeTab === 'accounting' ? 'Sistem Pembukuan SAK EP' :
                 activeTab === 'cs' ? 'Layanan Customer Service' :
                 activeTab === 'rules' ? 'Aturan & Konfigurasi Izin Akses' :
                 activeTab === 'settings' ? 'Konfigurasi Sistem' :
                 'Direktori CIF & Data Fisik Anggota'}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '16px', fontWeight: 500, margin: 0 }}>
                {activeTab === 'overview' 
                  ? 'Statistik operasi infrastruktur backend iQ-RA System.' 
                  : activeTab === 'users'
                  ? 'Manajemen otoritas, audit sandi, dan penugasan hak akses staf.'
                  : activeTab === 'manager'
                  ? 'Otorisasi akhir dan pemantauan kinerja organisasi.'
                  : activeTab === 'dps'
                  ? 'Audit kesesuaian prinsip syariah pada setiap akad.'
                  : activeTab === 'ao'
                  ? 'Manajemen prospek dan monitoring portofolio pembiayaan.'
                  : activeTab === 'accounting'
                  ? 'Pencatatan jurnal otomatis dan pembuatan laporan keuangan.'
                  : activeTab === 'cs'
                  ? 'Registrasi anggota baru dan verifikasi KYC.'
                  : activeTab === 'rules'
                  ? 'Definisi Role-Based Access Control (RBAC) dan batasan otoritas per kriteria jabatan.'
                  : activeTab === 'teller'
                  ? 'Pusat pemrosesan setoran, penarikan, dan pembayaran angsuran anggota.'
                  : 'Pusat pengawasan berkas perbankan KYC, NIK, KK, Ibu Kandung, & Profil Finansial.'}
              </p>
            </div>
            
            <div style={{ background: 'var(--bg-card)', border: '2px solid #10b981', borderRadius: '30px', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 800, color: '#10b981', boxShadow: '0 4px 15px var(--shadow-color)' }}>
              <div style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981' }} />
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
                <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(16px)', border: '2px solid var(--gold-bright)', borderRadius: '24px', padding: '32px', boxShadow: '0 15px 35px var(--shadow-color)' }}>
                  <div style={{ color: 'var(--gold-intense)', fontSize: '14px', fontWeight: 800, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Total Rekam Akun 👥
                  </div>
                  <div style={{ fontSize: '44px', fontWeight: 900, color: 'var(--text-primary)' }}>
                    {totalAccounts} <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)', opacity: 0.6 }}>Akun</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--border-primary)', borderRadius: '3px', margin: '20px 0' }}>
                    <div style={{ height: '100%', background: 'var(--gold-intense)', width: '100%', borderRadius: '3px', boxShadow: '0 0 8px var(--gold-bright)' }} />
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Sinkron dengan modul keamanan Supabase Auth</div>
                </div>

                {/* Metric Card 2 */}
                <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(16px)', border: '2px solid #3b82f6', borderRadius: '24px', padding: '32px', boxShadow: '0 15px 35px var(--shadow-color)' }}>
                  <div style={{ color: '#3b82f6', fontSize: '14px', fontWeight: 800, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Pegawai Koperasi Aktif 👔
                  </div>
                  <div style={{ fontSize: '44px', fontWeight: 900, color: 'var(--text-primary)' }}>
                    {totalStaff} <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)', opacity: 0.6 }}>Staf</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--border-primary)', borderRadius: '3px', margin: '20px 0' }}>
                    <div style={{ height: '100%', background: '#3b82f6', width: `${totalAccounts ? (totalStaff/totalAccounts)*100 : 0}%`, borderRadius: '3px', boxShadow: '0 0 8px #3b82f6' }} />
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Mencakup Level CS, Kasir, & Manajerial</div>
                </div>

                {/* Metric Card 3 */}
                <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(16px)', border: '2px solid #10b981', borderRadius: '24px', padding: '32px', boxShadow: '0 15px 35px var(--shadow-color)' }}>
                  <div style={{ color: '#10b981', fontSize: '14px', fontWeight: 800, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Anggota Resmi Terdaftar 💳
                  </div>
                  <div style={{ fontSize: '44px', fontWeight: 900, color: 'var(--text-primary)' }}>
                    {totalApprovedMembers} <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)', opacity: 0.6 }}>Jiwa</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--border-primary)', borderRadius: '3px', margin: '20px 0' }}>
                    <div style={{ height: '100%', background: '#10b981', width: `${totalAccounts ? (totalApprovedMembers/totalAccounts)*100 : 0}%`, borderRadius: '3px', boxShadow: '0 0 8px #10b981' }} />
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Aktualisasi riil pengajuan dari modul registrasi Anggota</div>
                </div>

              </div>

              {/* Large Banner Spec Card */}
              <div style={{ 
                background: 'var(--bg-card)',
                backdropFilter: 'blur(16px)',
                border: '3px solid var(--gold-bright)', 
                borderRadius: '28px', 
                padding: '40px', 
                position: 'relative', 
                overflow: 'hidden',
                boxShadow: '0 25px 60px var(--shadow-color)'
              }}>
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--gold-intense)', marginBottom: '12px' }}>Spesifikasi Inti Kendali IT</h2>
                  <p style={{ color: 'var(--text-primary)', fontSize: '16px', maxWidth: '750px', lineHeight: 1.7, fontWeight: 500 }}>
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
                  <BrandLogo size={100} showText={false} />
                </div>
              </div>

            </div>
          )}

          {/* ==================================== */}
          {/* TAB: MANAGER VIEW                    */}
          {/* ==================================== */}
          {activeTab === 'manager' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <ManagerDashboard activeMenu={activeSubMenu} profile={profile} />
            </div>
          )}

          {/* ==================================== */}
          {/* TAB: DPS VIEW                        */}
          {/* ==================================== */}
          {activeTab === 'dps' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <DPSDashboard activeMenu={activeSubMenu} profile={profile} />
            </div>
          )}

          {/* ==================================== */}
          {/* TAB: ACCOUNTING VIEW                 */}
          {/* ==================================== */}
          {activeTab === 'accounting' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <AccountingDashboard activeMenu={activeSubMenu} profile={profile} />
            </div>
          )}

          {/* ==================================== */}
          {/* TAB: AO VIEW                         */}
          {/* ==================================== */}
          {activeTab === 'ao' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <AODashboard activeMenu={activeSubMenu} profile={profile} />
            </div>
          )}

          {/* ==================================== */}
          {/* TAB: CS VIEW                         */}
          {/* ==================================== */}
          {activeTab === 'cs' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <CSDashboard activeMenu={activeSubMenu} profile={profile} />
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
          {/* TAB: AI KNOWLEDGE BASE VIEW         */}
          {/* ==================================== */}
          {activeTab === 'ai_knowledge' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <AIKnowledgeManager />
            </div>
          )}

          {/* ==================================== */}
          {/* TAB: RULES & PERMISSIONS VIEW       */}
          {/* ==================================== */}
          {activeTab === 'rules' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ background: 'rgba(4, 49, 33, 0.7)', backdropFilter: 'blur(16px)', border: '3px solid #cca334', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}>
                <div style={{ padding: '32px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0%, rgba(4, 49, 33, 0.7) 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ color: '#f3c653', fontSize: '20px', fontWeight: 900, marginBottom: '8px' }}>Matriks Otoritas Keamanan (RBAC)</h3>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Definisi kriteria akses sistem berdasarkan standar prosedur operasional iQ-RA.</p>
                  </div>
                  <button 
                    onClick={() => setIsCreatingRule(true)}
                    style={{
                      background: 'linear-gradient(135deg, #f3c653 0%, #cca334 100%)',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '12px',
                      color: '#02130e',
                      fontWeight: 900,
                      fontSize: '14px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(243,198,83,0.3)'
                    }}
                  >
                    ➕ Tambah Aturan Manual
                  </button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '2px solid rgba(204,163,52,0.3)' }}>
                        <th style={{ padding: '20px', fontSize: '13px', fontWeight: 900, color: '#cca334', textTransform: 'uppercase' }}>Kriteria Jabatan</th>
                        <th style={{ padding: '20px', fontSize: '13px', fontWeight: 900, color: '#cca334', textTransform: 'uppercase' }}>Tanggung Jawab Utama</th>
                        <th style={{ padding: '20px', fontSize: '13px', fontWeight: 900, color: '#cca334', textTransform: 'uppercase' }}>Cakupan Otoritas</th>
                        <th style={{ padding: '20px', fontSize: '13px', fontWeight: 900, color: '#cca334', textTransform: 'uppercase' }}>Batasan Akses</th>
                        <th style={{ padding: '20px', fontSize: '13px', fontWeight: 900, color: '#cca334', textTransform: 'uppercase', textAlign: 'center' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingRules ? (
                        <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Memuat aturan akses...</td></tr>
                      ) : (
                        accessRules.map((r, i) => (
                          <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                            <td style={{ padding: '20px' }}>
                              <span style={{ color: 'var(--text-primary)', fontWeight: 900, fontSize: '14px', background: 'rgba(243, 198, 83, 0.1)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(243, 198, 83, 0.2)' }}>{r.role_name}</span>
                            </td>
                            <td style={{ padding: '20px', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600 }}>{r.responsibility}</td>
                            <td style={{ padding: '20px', color: 'var(--text-primary)', fontSize: '13px', lineHeight: '1.5' }}>{r.authority_scope}</td>
                            <td style={{ padding: '20px' }}>
                              <span style={{ color: '#ef4444', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🚫 {r.limitations}</span>
                            </td>
                            <td style={{ padding: '20px', textAlign: 'center' }}>
                              <button 
                                onClick={() => setEditingRule(r)}
                                style={{ background: 'transparent', border: '1px solid #f3c653', color: '#f3c653', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                              >
                                ✏️ Edit
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: '24px', background: 'rgba(243, 198, 83, 0.05)', display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ fontSize: '24px' }}>💡</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <strong>Manajemen Otoritas:</strong> Anda dapat menambahkan kriteria jabatan baru secara manual melalui tombol di atas. Matriks ini digunakan sebagai panduan operasional dan pengawasan audit sistem.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================== */}
          {/* TAB B: USER DIRECTORY LIST          */}
          {/* ==================================== */}
          {activeTab === 'users' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              
              {/* Table Toolbar: Title + Search Bar Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => setUserSubTab('staff')}
                    style={{
                      background: userSubTab === 'staff' ? '#f3c653' : 'rgba(255,255,255,0.05)',
                      border: userSubTab === 'staff' ? '2px solid #f3c653' : '2px solid rgba(255,255,255,0.1)',
                      color: userSubTab === 'staff' ? '#02130e' : '#ffffff',
                      padding: '10px 24px',
                      borderRadius: '12px',
                      fontWeight: 800,
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    👔 Staf & Karyawan
                  </button>
                  <button 
                    onClick={() => setUserSubTab('members')}
                    style={{
                      background: userSubTab === 'members' ? '#f3c653' : 'rgba(255,255,255,0.05)',
                      border: userSubTab === 'members' ? '2px solid #f3c653' : '2px solid rgba(255,255,255,0.1)',
                      color: userSubTab === 'members' ? '#02130e' : '#ffffff',
                      padding: '10px 24px',
                      borderRadius: '12px',
                      fontWeight: 800,
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    👥 Anggota (Member)
                  </button>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', flexGrow: 1, justifyContent: 'flex-end' }}>
                  {/* Search Bar Input Field */}
                  <div style={{ position: 'relative', maxWidth: '350px', width: '100%' }}>
                    <input 
                      type="text"
                      placeholder={userSubTab === 'staff' ? "🔍 Cari staf..." : "🔍 Cari anggota..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--bg-page)',
                        border: '2px solid #cca334',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        color: 'var(--text-primary)',
                        fontSize: '16px',
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
                      setNewRole(userSubTab === 'staff' ? 'teller' : 'member');
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
                  >
                    ➕ {userSubTab === 'staff' ? 'Tambah Staf' : 'Tambah Anggota'}
                  </button>

                  <button 
                    onClick={fetchUsersList}
                    disabled={loadingUsers}
                    style={{
                      background: 'rgba(4, 49, 33, 0.7)',
                      backdropFilter: 'blur(16px)',
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
                  🔄 {loadingUsers ? '...' : 'Refresh'}
                </button>
              </div>
            </div>

              {/* MASTER TABLE: SOLID CONTRAST CANVAS */}
              <div style={{
                background: 'rgba(4, 49, 33, 0.7)',
                backdropFilter: 'blur(16px)',
                border: '3px solid #cca334',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.4)'
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255, 255, 255, 0.05)', borderBottom: '3px solid #cca334' }}>
                        <th style={{ padding: '24px 20px', fontSize: '14px', fontWeight: 900, color: '#f3c653', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          {userSubTab === 'staff' ? 'Nama Karyawan / Staf' : 'Nama Anggota (Nasabah)'}
                        </th>
                        <th style={{ padding: '24px 20px', fontSize: '14px', fontWeight: 900, color: '#f3c653', textTransform: 'uppercase', letterSpacing: '1px' }}>Email Akun</th>
                        <th style={{ padding: '24px 20px', fontSize: '14px', fontWeight: 900, color: '#f3c653', textTransform: 'uppercase', letterSpacing: '1px' }}>Audit Password</th>
                        <th style={{ padding: '24px 20px', fontSize: '14px', fontWeight: 900, color: '#f3c653', textTransform: 'uppercase', letterSpacing: '1px' }}>Status Role</th>
                        <th style={{ padding: '24px 20px', fontSize: '14px', fontWeight: 900, color: '#f3c653', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>Otoritas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingUsers ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '80px', textAlign: 'center', color: 'var(--text-primary)', fontSize: '18px', fontWeight: 800 }}>
                            Sinkronisasi data enkripsi...
                          </td>
                        </tr>
                      ) : (
                        (() => {
                          const list = filteredUsers.filter(u => userSubTab === 'staff' ? u.role !== 'member' : u.role === 'member');
                          
                          if (list.length === 0) {
                            return (
                              <tr>
                                <td colSpan={5} style={{ padding: '80px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '18px', fontWeight: 700 }}>
                                  {searchQuery ? `Tidak ditemukan hasil untuk "${searchQuery}".` : `Belum ada data ${userSubTab === 'staff' ? 'staf' : 'anggota'} terdaftar.`}
                                </td>
                              </tr>
                            );
                          }

                          return list.map((u, idx) => {
                            const isMe = u.id === user?.id;
                            const isPassVisible = visiblePasswords[u.id] || false;
                            
                            let badgeColors = { bg: 'var(--border-primary)', border: 'var(--text-secondary)', text: 'var(--text-primary)' };
                            if (u.role === 'super_admin') badgeColors = { bg: '#f3c653', border: '#f3c653', text: '#02130e' };
                            else if (u.role === 'manager') badgeColors = { bg: 'rgba(255, 255, 255, 0.05)', border: '#60a5fa', text: '#60a5fa' };
                            else if (u.role === 'member') badgeColors = { bg: 'rgba(255, 255, 255, 0.05)', border: '#34d399', text: '#34d399' };
                            else badgeColors = { bg: 'rgba(255, 255, 255, 0.05)', border: '#a78bfa', text: '#a78bfa' };

                            return (
                              <tr 
                                key={u.id} 
                                style={{ 
                                  borderBottom: '1px solid rgba(204,163,52,0.15)',
                                  background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                                  transition: 'background 0.2s'
                                }}
                              >
                                <td style={{ padding: '20px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div style={{ 
                                      width: '36px', height: '36px', borderRadius: '10px', 
                                      background: '#cca334', color: '#02130e',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                      fontSize: '16px', fontWeight: 900
                                    }}>
                                      {u.full_name ? u.full_name.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 900, fontSize: '16px', color: 'var(--text-primary)' }}>
                                        {u.full_name || '—'} 
                                        {isMe && <span style={{ fontSize: '11px', background: '#f3c653', color: '#02130e', padding: '3px 8px', borderRadius: '5px', marginLeft: '8px', fontWeight: 900 }}>ANDA</span>}
                                      </div>
                                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>ID: {u.id.substring(0, 8)}...</div>
                                    </div>
                                  </div>
                                </td>

                                <td style={{ padding: '20px', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{u.email}</td>

                                <td style={{ padding: '20px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <code style={{ background: '#010d09', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 10px', borderRadius: '6px', fontSize: '13px', color: '#f3c653', fontFamily: 'monospace' }}>
                                      {isPassVisible ? u.password : '••••••••'}
                                    </code>
                                    <button onClick={() => togglePasswordVisibility(u.id)} style={{ background: 'transparent', border: 'none', color: '#60a5fa', fontSize: '12px', cursor: 'pointer', fontWeight: 800 }}>{isPassVisible ? '🙈' : '👁️'}</button>
                                  </div>
                                </td>

                                <td style={{ padding: '20px' }}>
                                  <span style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', background: badgeColors.bg, border: `1.5px solid ${badgeColors.border}`, color: badgeColors.text }}>{u.role}</span>
                                </td>

                                <td style={{ padding: '20px', textAlign: 'center' }}>
                                  {!isMe && (
                                    <button onClick={() => handleOpenEditRole(u)} style={{ background: 'rgba(243, 198, 83, 0.1)', border: '2px solid #f3c653', color: '#f3c653', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>Edit Role</button>
                                  )}
                                </td>
                              </tr>
                            );
                          });
                        })()
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
                <div style={{ fontSize: '16px', color: 'var(--text-primary)', fontWeight: 700 }}>
                  Menampilkan <strong style={{ color: '#f3c653', fontSize: '18px' }}>{membersList.length}</strong> Data CIF Fisik Terverifikasi.
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  {/* SUPER ADMIN DUMMY INJECTION - Visual demo shortcut */}
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
                      background: 'rgba(4, 49, 33, 0.7)',
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
                background: 'rgba(4, 49, 33, 0.7)',
                border: '3px solid #cca334',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.4)'
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255, 255, 255, 0.05)', borderBottom: '3px solid #cca334' }}>
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
                          <td colSpan={5} style={{ padding: '80px', textAlign: 'center', color: 'var(--text-primary)', fontSize: '16px', fontWeight: 700 }}>
                            Membaca data fisik CIF secara terenkripsi...
                          </td>
                        </tr>
                      ) : membersList.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '80px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '16px', fontWeight: 700, lineHeight: 1.6 }}>
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
                                <div style={{ fontWeight: 900, fontSize: '16px', color: 'var(--text-primary)' }}>
                                  {m.users?.full_name || 'Nama Tidak Sinkron'}
                                </div>
                                <div style={{ fontSize: '12px', color: '#f3c653', fontWeight: 800, marginTop: '3px', fontFamily: 'monospace' }}>
                                  NIK: {m.nik}
                                </div>
                              </td>

                              {/* Mother Name */}
                              <td style={{ padding: '20px', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                👩‍👧‍👦 {m.mother_name}
                              </td>

                              {/* Occupation and Money */}
                              <td style={{ padding: '20px' }}>
                                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{m.occupation}</div>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399', marginTop: '3px' }}>
                                  💵 {formatter.format(m.monthly_income)} / bulan
                                </div>
                              </td>

                              {/* Phone / Contact */}
                              <td style={{ padding: '20px', fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                                📱 {m.phone_number}
                              </td>

                              {/* KYC Audit Button */}
                              <td style={{ padding: '20px', textAlign: 'center' }}>
                                <button 
                                  onClick={() => setSelectedCIF(m)}
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
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
                                  onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.color = '#34d399'; }}
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
              background: 'var(--bg-page)',
              border: '4px solid var(--gold-intense)', // Heavy Gold Border for clear focus
              borderRadius: '28px',
              width: '100%',
              maxWidth: '500px',
              padding: '40px',
              boxShadow: '0 30px 80px var(--shadow-color)',
              animation: 'scaleUp 0.2s ease-out'
            }}>
              
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--gold-intense)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>🛡️ Promosi Jabatan Staf</h2>
              <p style={{ color: 'var(--text-primary)', fontSize: '15px', marginBottom: '28px', fontWeight: 500, lineHeight: 1.5 }}>
                Silakan pilih hak akses sistem baru untuk akun <strong>{editingUser.full_name}</strong>:
              </p>

              {/* Option Dropdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
                <label style={{ fontSize: '14px', fontWeight: 800, color: 'var(--gold-intense)' }}>Daftar Peran Otoritas</label>
                <select 
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  style={{
                    background: 'var(--bg-page)', // Pure high-contrast dynamic
                    border: '3px solid #cca334', // Premium Golden Border
                    borderRadius: '14px',
                    padding: '16px',
                    color: 'var(--text-primary)', // Dynamic text color for extreme legibility
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
                  <option value="super_admin">SUPER ADMIN (Otoritas Penuh IT)</option>
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
                color: 'var(--text-primary)',
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
                    border: '2px solid var(--border-primary)',
                    color: 'var(--text-primary)',
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
              background: 'rgba(4, 49, 33, 0.7)',
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
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 900, color: '#cca334', marginBottom: '8px', textTransform: 'uppercase' }}>Nama Lengkap</label>
                  <input 
                    type="text"
                    required
                    placeholder="Contoh: Muhammad Ridwan"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    style={{
                      width: '100%', background: 'var(--bg-page)', border: '2px solid var(--border-primary)',
                      borderRadius: '12px', padding: '14px', color: 'var(--text-primary)', fontSize: '16px',
                      fontWeight: 700, outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 900, color: '#cca334', marginBottom: '8px', textTransform: 'uppercase' }}>Email Institusi</label>
                  <input 
                    type="email"
                    required
                    placeholder="nama.staff@koperasi.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    style={{
                      width: '100%', background: 'var(--bg-page)', border: '2px solid var(--border-primary)',
                      borderRadius: '12px', padding: '14px', color: 'var(--text-primary)', fontSize: '16px',
                      fontWeight: 700, outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 900, color: '#cca334', marginBottom: '8px', textTransform: 'uppercase' }}>Kata Sandi Sementara</label>
                  <input 
                    type="password"
                    required
                    minLength={6}
                    placeholder="Minimal 6 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{
                      width: '100%', background: 'var(--bg-page)', border: '2px solid var(--border-primary)',
                      borderRadius: '12px', padding: '14px', color: 'var(--text-primary)', fontSize: '16px',
                      fontWeight: 700, outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 900, color: '#cca334', marginBottom: '8px', textTransform: 'uppercase' }}>Pilih Hak Akses (Role)</label>
                  <select 
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    style={{
                      width: '100%', background: 'var(--bg-page)', border: '3px solid #cca334',
                      borderRadius: '12px', padding: '14px', color: 'var(--text-primary)', fontSize: '16px',
                      fontWeight: 700, outline: 'none', cursor: 'pointer'
                    }}
                  >
                    <option value="member" style={{ color: '#000' }}>Nasabah (MEMBER)</option>
                    <option value="teller" style={{ color: '#000' }}>Kasir Utama (TELLER)</option>
                    <option value="customer_service" style={{ color: '#000' }}>Customer Service (CS)</option>
                    <option value="account_officer" style={{ color: '#000' }}>Account Officer (AO)</option>
                    <option value="accounting" style={{ color: '#000' }}>Accounting (SAK EP)</option>
                    <option value="manager" style={{ color: '#000' }}>General Manager (GM)</option>
                    <option value="dps" style={{ color: '#000' }}>Dewan Pengawas Syariah (DPS)</option>
                    <option value="super_admin" style={{ color: '#000' }}>Super Admin (IT ADMIN)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '14px', marginTop: '16px' }}>
                  <button 
                    type="button"
                    onClick={() => setIsCreatingUser(false)}
                    style={{
                      flexGrow: 1, background: 'transparent', border: '2px solid var(--border-primary)',
                      color: 'var(--text-primary)', padding: '16px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer'
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
              background: 'rgba(4, 49, 33, 0.7)',
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
                  background: 'rgba(4, 49, 33, 0.7)',
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'rgba(255, 255, 255, 0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '4px' }}>NAMA LENGKAP (CIF)</div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>{selectedCIF.users?.full_name || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '4px' }}>NOMOR WHATSAPP</div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>{selectedCIF.phone_number}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '4px' }}>NIK (NOMOR KTP)</div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#f3c653', fontFamily: 'monospace' }}>{selectedCIF.nik}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '4px' }}>NOMOR KARTU KELUARGA (KK)</div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{selectedCIF.kk_number}</div>
                    </div>
                  </div>
                </div>

                {/* Section B: Keamanan & Geografis */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <div style={{ color: '#f3c653', fontSize: '12px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px', borderLeft: '3px solid #f3c653', paddingLeft: '8px' }}>
                      2. Keamanan Bank
                    </div>
                    <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', height: 'calc(100% - 24px)' }}>
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '4px' }}>IBU KANDUNG</div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>{selectedCIF.mother_name}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '4px' }}>KEYAKINAN / AGAMA</div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>{selectedCIF.religion || 'Islam'}</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#f3c653', fontSize: '12px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px', borderLeft: '3px solid #f3c653', paddingLeft: '8px' }}>
                      3. Profil Ekonomi
                    </div>
                    <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', height: 'calc(100% - 24px)' }}>
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '4px' }}>PROFESI PEKERJAAN</div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>{selectedCIF.occupation}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '4px' }}>PENDAPATAN PER BULAN</div>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255, 255, 255, 0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '4px' }}>ALAMAT KTP RESMI</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>{selectedCIF.ktp_address}</div>
                    </div>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', marginTop: '4px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '4px' }}>ALAMAT TINGGAL AKTIF (DOMISILI)</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>{selectedCIF.domicile_address}</div>
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
        
        {/* NEW: ACCESS RULES MANAGEMENT MODAL */}
        {(isCreatingRule || editingRule) && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(1, 10, 7, 0.9)', backdropFilter: 'blur(8px)',
            zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}>
            <div style={{ background: 'rgba(4, 49, 33, 0.7)', border: '4px solid #cca334', borderRadius: '28px', width: '100%', maxWidth: '550px', padding: '36px', boxShadow: '0 30px 80px rgba(0,0,0,0.8)' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#f3c653', marginBottom: '8px' }}>
                {editingRule ? '✏️ Edit Aturan Akses' : '➕ Tambah Aturan Baru'}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '24px' }}>Konfigurasi parameter otoritas untuk jabatan sistem.</p>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const payload = {
                  role_name: formData.get('role_name'),
                  responsibility: formData.get('responsibility'),
                  authority_scope: formData.get('authority_scope'),
                  limitations: formData.get('limitations')
                };
                
                const supabase = createClient();
                const { error } = editingRule 
                  ? await supabase.from('access_rules').update(payload).eq('id', editingRule.id)
                  : await supabase.from('access_rules').insert([payload]);
                
                if (!error) {
                  fetchAccessRules();
                  setIsCreatingRule(false);
                  setEditingRule(null);
                } else {
                  alert('Gagal menyimpan: ' + error.message);
                }
              }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#cca334', marginBottom: '8px' }}>NAMA JABATAN / ROLE</label>
                  <input name="role_name" defaultValue={editingRule?.role_name} required style={{ width: '100%', background: 'var(--bg-page)', border: '2px solid var(--border-primary)', borderRadius: '12px', padding: '14px', color: 'var(--text-primary)', fontWeight: 600 }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#cca334', marginBottom: '8px' }}>TANGGUNG JAWAB UTAMA</label>
                  <input name="responsibility" defaultValue={editingRule?.responsibility} placeholder="Contoh: Operasional Kas & Pelayanan" style={{ width: '100%', background: 'var(--bg-page)', border: '2px solid var(--border-primary)', borderRadius: '12px', padding: '14px', color: 'var(--text-primary)' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#cca334', marginBottom: '8px' }}>CAKUPAN OTORITAS</label>
                  <textarea name="authority_scope" defaultValue={editingRule?.authority_scope} rows={3} style={{ width: '100%', background: 'var(--bg-page)', border: '2px solid var(--border-primary)', borderRadius: '12px', padding: '14px', color: 'var(--text-primary)' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#cca334', marginBottom: '8px' }}>BATASAN AKSES</label>
                  <input name="limitations" defaultValue={editingRule?.limitations} placeholder="Contoh: Tidak bisa menghapus jurnal" style={{ width: '100%', background: 'var(--bg-page)', border: '2px solid var(--border-primary)', borderRadius: '12px', padding: '14px', color: 'var(--text-primary)' }} />
                </div>

                <div style={{ display: 'flex', gap: '14px', marginTop: '10px' }}>
                  <button type="button" onClick={() => { setIsCreatingRule(false); setEditingRule(null); }} style={{ flexGrow: 1, background: 'transparent', border: '2px solid var(--border-primary)', color: 'var(--text-primary)', padding: '16px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>Batal</button>
                  <button type="submit" style={{ flexGrow: 2, background: 'linear-gradient(135deg, #f3c653 0%, #cca334 100%)', border: 'none', color: '#02130e', padding: '16px', borderRadius: '12px', fontWeight: 900, fontSize: '15px', cursor: 'pointer' }}>Simpan Aturan</button>
                </div>
              </form>
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
        background: 'transparent',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative'
      }}>
        
        <div 
          className="hero-glass-container"
          style={{
            background: 'rgba(4, 49, 33, 0.75)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
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
            <BrandLogo size={60} fontSize="32px" />
          </div>

          <h1 style={{ color: '#ffffff', fontSize: '34px', fontWeight: 900, marginBottom: '14px', letterSpacing: '-0.5px' }}>
            Dasbor <span style={{ color: '#f3c653' }}>Nasabah</span>
          </h1>
          
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '18px', lineHeight: 1.6, marginBottom: '36px', fontWeight: 500 }}>
            Selamat datang di gerbang utama transaksi Syariah. Status autentikasi akses Anda aman dan tervalidasi!
          </p>

          {/* Info Display Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(16px)',
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
