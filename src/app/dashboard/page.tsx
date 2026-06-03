'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
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



// Intensely styled menu button for the dashboard sidebar
function DashboardMenuButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: string, label: string }) {
  return (
    <button 
      onClick={onClick}
      style={{
        background: active ? 'var(--sidebar-active-bg)' : 'transparent',
        border: 'none',
        textAlign: 'left',
        padding: '10px 14px',
        borderRadius: '14px',
        color: active ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
        fontWeight: 800,
        fontSize: '14px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        transition: 'all 0.2s',
        boxShadow: active ? '0 4px 15px var(--shadow-color)' : 'none'
      }}
    >
      <span style={{ fontSize: '18px' }}>{icon}</span>
      {label}
    </button>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  
  // Tab state (overview, users, members, settings, teller, manager, dps, ao, accounting, cs, rules, audit_logs, coa, tasks, diagnostics, backup, ai_knowledge)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'members' | 'settings' | 'teller' | 'manager' | 'dps' | 'ao' | 'accounting' | 'cs' | 'rules' | 'audit_logs' | 'coa' | 'tasks' | 'diagnostics' | 'backup' | 'ai_knowledge'>('overview');
  const [userSubTab, setUserSubTab] = useState<'staff' | 'members'>('staff');
  const [activeSubMenu, setActiveSubMenu] = useState<string>('overview');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // SUPER ADMIN RESTORED STATES
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
  const [coaAccounts, setCoaAccounts] = useState<any[]>([]);
  const [loadingCoa, setLoadingCoa] = useState(false);
  const [systemTasks, setSystemTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [isExportingBackup, setIsExportingBackup] = useState(false);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  
  const [isCoaModalOpen, setIsCoaModalOpen] = useState(false);
  const [editingCoa, setEditingCoa] = useState<any>(null);
  const [newCoaCode, setNewCoaCode] = useState('');
  const [newCoaName, setNewCoaName] = useState('');
  const [newCoaCategory, setNewCoaCategory] = useState('Aset');
  const [newCoaNormalBalance, setNewCoaNormalBalance] = useState('Debit');
  const [newCoaDescription, setNewCoaDescription] = useState('');
  const [filterCoaCode, setFilterCoaCode] = useState('');
  const [filterCoaName, setFilterCoaName] = useState('');
  const [filterCoaCategory, setFilterCoaCategory] = useState('');
  const [filterCoaNormalBalance, setFilterCoaNormalBalance] = useState('');
  const [isSavingCoa, setIsSavingCoa] = useState(false);
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [isSavingTask, setIsSavingTask] = useState(false);
  
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
  
  // CIF / Physical Membership data states
  const [membersList, setMembersList] = useState<any[]>([]);
  const [selectedCIF, setSelectedCIF] = useState<any>(null);

  // SUPER ADMIN RESTORED FUNCTIONS
  const logSuperAdminAction = async (actionType: string, targetId: string, details: string) => {
    try {
      const supabase = createClient();
      await supabase.from('audit_logs').insert([
        {
          action_type: actionType,
          target_id: targetId,
          description: details,
          created_at: new Date().toISOString()
        }
      ]);
    } catch (err) {
      console.error('Failed to log admin action:', err);
    }
  };

  const fetchAuditLogs = async () => {
    setLoadingAuditLogs(true);
    const supabase = createClient();
    const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
    if (data) setAuditLogs(data);
    setLoadingAuditLogs(false);
  };

  const fetchCoaAccounts = async () => {
    setLoadingCoa(true);
    const supabase = createClient();
    const { data } = await supabase.from('coa_accounts').select('*').order('code', { ascending: true });
    if (data) setCoaAccounts(data);
    setLoadingCoa(false);
  };

  const fetchTasks = async () => {
    setLoadingTasks(true);
    const supabase = createClient();
    const { data } = await supabase.from('system_tasks').select('*').order('created_at', { ascending: false });
    if (data) setSystemTasks(data);
    setLoadingTasks(false);
  };

  const measurePing = async () => {
    const start = Date.now();
    const supabase = createClient();
    try {
      await supabase.from('system_parameters').select('id').limit(1);
      setPingLatency(Date.now() - start);
    } catch (e) {
      setPingLatency(999);
    }
  };

  const handleExportBackup = async () => {
    setIsExportingBackup(true);
    try {
      const supabase = createClient();
      const { data: params } = await supabase.from('system_parameters').select('*');
      const { data: coa } = await supabase.from('coa_accounts').select('*');
      const { data: rules } = await supabase.from('access_rules').select('*');
      const backupData = {
        timestamp: new Date().toISOString(),
        system_parameters: params,
        coa_accounts: coa,
        access_rules: rules
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `iqra-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      await logSuperAdminAction('BACKUP_EXPORT', 'system_config', 'Mengekspor berkas konfigurasi cadangan JSON.');
    } catch (e) {
      console.error(e);
    }
    setIsExportingBackup(false);
  };

  const handleSaveCoa = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCoa(true);
    const supabase = createClient();
    const payload = {
      code: newCoaCode,
      name: newCoaName,
      category: newCoaCategory,
      normal_balance: newCoaNormalBalance,
      description: newCoaDescription
    };
    try {
      let error;
      if (editingCoa) {
        ({ error } = await supabase.from('coa_accounts').update(payload).eq('id', editingCoa.id));
        if (!error) {
          await logSuperAdminAction('COA_UPDATE', newCoaCode, `Memperbarui akun COA: ${newCoaName}`);
        }
      } else {
        ({ error } = await supabase.from('coa_accounts').insert([payload]));
        if (!error) {
          await logSuperAdminAction('COA_CREATE', newCoaCode, `Membuat akun COA baru: ${newCoaName}`);
        }
      }
      if (error) {
        alert('Gagal menyimpan COA: ' + error.message);
      } else {
        await fetchCoaAccounts();
        setIsCoaModalOpen(false);
      }
    } catch (err: any) {
      alert('Gagal menyimpan COA: ' + err.message);
    }
    setIsSavingCoa(false);
  };

  const handleDeleteCoa = async (id: string, code: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus akun COA ${code} - ${name}?`)) {
      const supabase = createClient();
      const { error } = await supabase.from('coa_accounts').delete().eq('id', id);
      if (!error) {
        await logSuperAdminAction('COA_DELETE', code, `Menghapus akun COA: ${name}`);
        await fetchCoaAccounts();
      } else {
        alert('Gagal menghapus COA: ' + error.message);
      }
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !newTaskAssignee) {
      alert('Judul tugas dan penerima wajib diisi.');
      return;
    }
    setIsSavingTask(true);
    const supabase = createClient();
    const payload = {
      title: newTaskTitle,
      description: newTaskDescription,
      assignee_name: newTaskAssignee,
      due_date: newTaskDueDate || null,
      status: 'PENDING'
    };
    try {
      const { error } = await supabase.from('system_tasks').insert([payload]);
      if (!error) {
        await logSuperAdminAction('TASK_CREATE', newTaskAssignee, `Membuat penugasan tugas baru: ${newTaskTitle}`);
        await fetchTasks();
        setIsTaskModalOpen(false);
        setNewTaskTitle('');
        setNewTaskDescription('');
        setNewTaskAssignee('');
        setNewTaskDueDate('');
      } else {
        alert('Gagal menyimpan tugas: ' + error.message);
      }
    } catch (err: any) {
      alert('Gagal menyimpan tugas: ' + err.message);
    }
    setIsSavingTask(false);
  };

  useEffect(() => {
    if (activeTab === 'audit_logs') fetchAuditLogs();
    if (activeTab === 'coa') fetchCoaAccounts();
    if (activeTab === 'tasks') fetchTasks();
    if (activeTab === 'diagnostics') measurePing();
  }, [activeTab]);

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
      await logSuperAdminAction('USER_ROLE_PROMOTION', editingUser.id, `Promosi peran akun ${editingUser.full_name} menjadi ${selectedRole}`);
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
      
      await logSuperAdminAction('USER_CREATE', data.user?.id || newEmail, `Mendaftarkan akun staf baru: ${newFullName} (${newRole})`);
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
      <>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', gap: '16px', position: 'relative', zIndex: 10 }}>
          <div style={{ border: '3px solid transparent', borderTopColor: 'var(--gold-intense)', borderRightColor: 'var(--gold-intense)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
          <h3 style={{ fontWeight: 800, fontSize: '18px', color: 'var(--gold-intense)' }}>Memuat Dasbor IQ-RA...</h3>
          <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </>
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
      <div style={{ 
        minHeight: '100vh', 
        background: 'transparent', // Animated Pattern Layer Support
        color: 'var(--text-primary)',
        display: 'flex',
        position: 'relative'
      }}>

        {/* 1. SIDEBAR: Solid, Bold, Premium Dark Emerald */}
        {isSidebarOpen && (
          <aside style={{
            width: '300px',
            background: 'var(--bg-sidebar)', // Deep saturated Emerald
            borderRight: '2px solid #cca334', // Rich gold divider
            display: 'flex',
            flexDirection: 'column',
            padding: '24px 18px',
            position: 'sticky',
            top: 0,
            height: '100vh',
            zIndex: 30,
            boxShadow: '8px 0 25px var(--shadow-color)'
          }}>
            {/* Sidebar Brand */}
            <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ marginTop: '-10px' }}>
                  <BrandLogo size={50} fontSize="22px" textColor="var(--sidebar-heading)" />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--sidebar-heading)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '4px', marginLeft: '62px' }}>IT Administrator</div>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '20px', cursor: 'pointer', padding: '4px', marginTop: '-5px' }}>✖</button>
            </div>

            {/* Sidebar Nav */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexGrow: 1, overflowY: 'auto', paddingRight: '4px' }}>
              
              <div style={{ fontSize: '11px', color: 'var(--sidebar-heading)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', paddingLeft: '14px', marginBottom: '4px', marginTop: '10px' }}>CORE BANKING</div>
              
              <DashboardMenuButton active={activeTab === 'overview'} onClick={() => { setActiveTab('overview'); setActiveSubMenu('overview'); }} icon="📊" label="Ringkasan Eksekutif" />

              <DashboardMenuButton active={activeTab === 'cs' && activeSubMenu === 'onboarding'} onClick={() => { setActiveTab('cs'); setActiveSubMenu('onboarding'); }} icon="🎧" label="Pendaftaran Anggota (CIF)" />
              <DashboardMenuButton active={activeTab === 'cs' && activeSubMenu === 'members'} onClick={() => { setActiveTab('cs'); setActiveSubMenu('members'); }} icon="📁" label="Database Anggota Aktif" />

              <DashboardMenuButton active={activeTab === 'teller'} onClick={() => { setActiveTab('teller'); setActiveSubMenu('overview'); }} icon="🏪" label="Layanan Kasir / Teller" />

              <DashboardMenuButton active={activeTab === 'ao' && activeSubMenu === 'leads'} onClick={() => { setActiveTab('ao'); setActiveSubMenu('leads'); }} icon="📝" label="Input Prospek Baru" />
              <DashboardMenuButton active={activeTab === 'ao' && activeSubMenu === 'overview'} onClick={() => { setActiveTab('ao'); setActiveSubMenu('overview'); }} icon="🤝" label="Pipeline Nasabah" />
              <DashboardMenuButton active={activeTab === 'ao' && activeSubMenu === 'prospects'} onClick={() => { setActiveTab('ao'); setActiveSubMenu('prospects'); }} icon="📋" label="Analisis Akad & AI" />
              <DashboardMenuButton active={activeTab === 'ao' && activeSubMenu === 'survey'} onClick={() => { setActiveTab('ao'); setActiveSubMenu('survey'); }} icon="📍" label="Verifikasi Lapangan" />

              <DashboardMenuButton active={activeTab === 'accounting' && activeSubMenu === 'overview'} onClick={() => { setActiveTab('accounting'); setActiveSubMenu('overview'); }} icon="📊" label="Ikhtisar Keuangan" />
              <DashboardMenuButton active={activeTab === 'accounting' && activeSubMenu === 'journal'} onClick={() => { setActiveTab('accounting'); setActiveSubMenu('journal'); }} icon="✒️" label="Manajemen Jurnal" />
              <DashboardMenuButton active={activeTab === 'accounting' && activeSubMenu === 'reports'} onClick={() => { setActiveTab('accounting'); setActiveSubMenu('reports'); }} icon="📑" label="Laporan SAK EP" />
              <DashboardMenuButton active={activeTab === 'accounting' && activeSubMenu === 'provisioning'} onClick={() => { setActiveTab('accounting'); setActiveSubMenu('provisioning'); }} icon="🛡️" label="Pencadangan CKPN" />
              <DashboardMenuButton active={activeTab === 'accounting' && activeSubMenu === 'eom'} onClick={() => { setActiveTab('accounting'); setActiveSubMenu('eom'); }} icon="💰" label="Bagi Hasil (EOM)" />
              <DashboardMenuButton active={activeTab === 'accounting' && activeSubMenu === 'eod'} onClick={() => { setActiveTab('accounting'); setActiveSubMenu('eod'); }} icon="🔒" label="Tutup Buku (EOD)" />

              <div style={{ height: '1px', background: 'var(--border-primary)', margin: '12px 0' }} />
              
              <div style={{ fontSize: '11px', color: 'var(--sidebar-heading)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', paddingLeft: '14px', marginBottom: '4px' }}>PENGAWASAN & OTO</div>

              <DashboardMenuButton active={activeTab === 'manager'} onClick={() => { setActiveTab('manager'); setActiveSubMenu('overview'); }} icon="🏢" label="Otorisasi Manager" />
              
              <DashboardMenuButton active={activeTab === 'dps' && activeSubMenu === 'overview'} onClick={() => { setActiveTab('dps'); setActiveSubMenu('overview'); }} icon="🕌" label="Ringkasan Kepatuhan" />
              <DashboardMenuButton active={activeTab === 'dps' && activeSubMenu === 'audit'} onClick={() => { setActiveTab('dps'); setActiveSubMenu('audit'); }} icon="🔍" label="Audit Akad Pembiayaan" />
              <DashboardMenuButton active={activeTab === 'dps' && activeSubMenu === 'products'} onClick={() => { setActiveTab('dps'); setActiveSubMenu('products'); }} icon="🏷️" label="Reviu Produk Baru" />
              <DashboardMenuButton active={activeTab === 'dps' && activeSubMenu === 'purification'} onClick={() => { setActiveTab('dps'); setActiveSubMenu('purification'); }} icon="💧" label="Pembersihan Dana (ZISWAF)" />
              <DashboardMenuButton active={activeTab === 'dps' && activeSubMenu === 'report'} onClick={() => { setActiveTab('dps'); setActiveSubMenu('report'); }} icon="📑" label="Cetak Laporan LHPS" />
              <DashboardMenuButton active={activeTab === 'dps' && activeSubMenu === 'rag'} onClick={() => { setActiveTab('dps'); setActiveSubMenu('rag'); }} icon="🤖" label="Ingesti Basis Data RAG" />

              <div style={{ height: '1px', background: 'var(--border-primary)', margin: '12px 0' }} />
              
              <div style={{ fontSize: '11px', color: 'var(--sidebar-heading)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', paddingLeft: '14px', marginBottom: '4px' }}>KECERDASAN BUATAN</div>
              <DashboardMenuButton active={activeTab === 'ai_knowledge'} onClick={() => { setActiveTab('ai_knowledge'); setActiveSubMenu('overview'); }} icon="🧠" label="Knowledge Base (RAG)" />

              <div style={{ height: '1px', background: 'var(--border-primary)', margin: '12px 0' }} />

              <div style={{ fontSize: '11px', color: 'var(--sidebar-heading)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', paddingLeft: '14px', marginBottom: '4px' }}>ADMINISTRASI IT</div>
              
              <DashboardMenuButton active={activeTab === 'users'} onClick={() => { setActiveTab('users'); setActiveSubMenu('overview'); }} icon="👥" label="Manajemen User" />
              <DashboardMenuButton active={activeTab === 'rules'} onClick={() => { setActiveTab('rules'); setActiveSubMenu('overview'); }} icon="🛡️" label="Aturan Akses (RBAC)" />
              <DashboardMenuButton active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setActiveSubMenu('overview'); }} icon="🛠️" label="Konfigurasi Sistem" />
              
              <DashboardMenuButton active={activeTab === 'audit_logs'} onClick={() => { setActiveTab('audit_logs'); setActiveSubMenu('overview'); }} icon="📋" label="Log Audit Keamanan" />
              <DashboardMenuButton active={activeTab === 'coa'} onClick={() => { setActiveTab('coa'); setActiveSubMenu('overview'); }} icon="📒" label="Manajemen COA" />
              <DashboardMenuButton active={activeTab === 'tasks'} onClick={() => { setActiveTab('tasks'); setActiveSubMenu('overview'); }} icon="✅" label="Penugasan Staf" />
              <DashboardMenuButton active={activeTab === 'diagnostics'} onClick={() => { setActiveTab('diagnostics'); setActiveSubMenu('overview'); }} icon="🩺" label="Diagnostik & Latensi" />
              <DashboardMenuButton active={activeTab === 'backup'} onClick={() => { setActiveTab('backup'); setActiveSubMenu('overview'); }} icon="📦" label="Pencadangan Data" />
            </nav>
          </aside>
        )}

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
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px' }}>
              {!isSidebarOpen && (
                <button onClick={() => setIsSidebarOpen(true)} style={{ background: 'transparent', border: 'none', color: 'var(--gold-intense)', fontSize: '28px', cursor: 'pointer', marginTop: '-2px' }}>
                  ☰
                </button>
              )}
              <div>
                <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: '6px', textShadow: '0 2px 10px var(--shadow-color)' }}>
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
              <p style={{ color: 'var(--text-secondary)', fontSize: '16px', fontWeight: 500 }}>
                {activeTab === 'overview' 
                  ? 'Statistik operasi infrastruktur backend IQ-RA System.' 
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
          </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ background: 'var(--bg-card)', border: '2px solid #34d399', borderRadius: '30px', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 800, color: 'var(--text-success)', boxShadow: '0 4px 15px rgba(52, 211, 153, 0.2)' }}>
                <div style={{ width: '10px', height: '10px', background: 'var(--text-success)', borderRadius: '50%', boxShadow: '0 0 10px #34d399' }} />
                DATABASE SEHAT (LIVE)
              </div>
              
              <button 
                onClick={toggleTheme} 
                style={{ background: 'transparent', border: 'none', color: 'var(--gold-intense)', fontSize: '24px', cursor: 'pointer' }}
                title="Ganti Tema"
              >
                {theme === 'dark' ? '🌙' : '☀️'}
              </button>

              <div style={{ position: 'relative' }}>
                <div 
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  style={{
                    background: 'var(--bg-dark-box)', border: '1px solid rgba(243, 198, 83, 0.2)',
                    borderRadius: '30px', padding: '8px 16px 8px 8px', display: 'flex', alignItems: 'center', gap: '10px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gold-intense)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 900, color: '#02130e' }}>
                    {profile?.full_name ? profile.full_name.charAt(0) : 'A'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>{profile?.full_name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{profile?.role}</div>
                  </div>
                </div>

                {isProfileMenuOpen && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '10px', background: 'var(--bg-card)', border: '1px solid rgba(243, 198, 83, 0.3)', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 15px 35px var(--shadow-color)', zIndex: 100, minWidth: '180px' }}>
                    <button style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '14px 20px', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>✏️ Edit Profil</button>
                    <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '14px 20px', color: 'var(--text-danger)', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>🔌 Keluar</button>
                  </div>
                )}
              </div>
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
                <div style={{ background: 'var(--bg-card)', border: '2px solid #cca334', borderRadius: '24px', padding: '32px', boxShadow: '0 15px 35px var(--shadow-color)' }}>
                  <div style={{ color: 'var(--gold-intense)', fontSize: '14px', fontWeight: 800, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Total Rekam Akun 👥
                  </div>
                  <div style={{ fontSize: '44px', fontWeight: 900, color: 'var(--text-primary)' }}>
                    {totalAccounts} <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)' }}>Akun</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--border-primary)', borderRadius: '3px', margin: '20px 0' }}>
                    <div style={{ height: '100%', background: 'var(--gold-intense)', width: '100%', borderRadius: '3px', boxShadow: '0 0 8px #f3c653' }} />
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Sinkron dengan modul keamanan Supabase Auth</div>
                </div>

                {/* Metric Card 2 */}
                <div className="gradient-border-card" style={{ padding: "32px" }}>
                  <div style={{ color: 'var(--text-info)', fontSize: '14px', fontWeight: 800, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Pegawai Koperasi Aktif 👔
                  </div>
                  <div style={{ fontSize: '44px', fontWeight: 900, color: 'var(--text-primary)' }}>
                    {totalStaff} <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)' }}>Staf</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--border-primary)', borderRadius: '3px', margin: '20px 0' }}>
                    <div style={{ height: '100%', background: 'var(--text-info)', width: `${totalAccounts ? (totalStaff/totalAccounts)*100 : 0}%`, borderRadius: '3px', boxShadow: '0 0 8px var(--text-info)' }} />
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Mencakup Level CS, Kasir, & Manajerial</div>
                </div>

                {/* Metric Card 3: Tied strictly to physical MEMBERS applications table */}
                <div style={{ background: 'var(--bg-card)', border: '2px solid #34d399', borderRadius: '24px', padding: '32px', boxShadow: '0 15px 35px var(--shadow-color)' }}>
                  <div style={{ color: 'var(--text-success)', fontSize: '14px', fontWeight: 800, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Anggota Resmi Terdaftar 💳
                  </div>
                  <div style={{ fontSize: '44px', fontWeight: 900, color: 'var(--text-primary)' }}>
                    {totalApprovedMembers} <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)' }}>Jiwa</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--border-primary)', borderRadius: '3px', margin: '20px 0' }}>
                    <div style={{ height: '100%', background: 'var(--text-success)', width: `${totalAccounts ? (totalApprovedMembers/totalAccounts)*100 : 0}%`, borderRadius: '3px', boxShadow: '0 0 8px #34d399' }} />
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Aktualisasi riil pengajuan dari modul registrasi Anggota</div>
                </div>

              </div>

              {/* Large Banner Spec Card */}
              <div style={{ 
                background: 'linear-gradient(90deg, #032419 0%, var(--bg-card) 100%)', 
                border: '3px solid #cca334', 
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
                      background: 'var(--gold-intense)', 
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
              <div style={{ background: 'var(--bg-card)', border: '3px solid #cca334', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 50px var(--shadow-color)' }}>
                <div style={{ padding: '32px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'linear-gradient(90deg, #021c13 0%, #032419 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ color: 'var(--gold-intense)', fontSize: '20px', fontWeight: 900, marginBottom: '8px' }}>Matriks Otoritas Keamanan (RBAC)</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Definisi kriteria akses sistem berdasarkan standar prosedur operasional IQ-RA.</p>
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
                      <tr style={{ background: 'var(--bg-dark-box)', borderBottom: '2px solid rgba(204,163,52,0.3)' }}>
                        <th style={{ padding: '20px', fontSize: '13px', fontWeight: 900, color: 'var(--gold-bright)', textTransform: 'uppercase' }}>Kriteria Jabatan</th>
                        <th style={{ padding: '20px', fontSize: '13px', fontWeight: 900, color: 'var(--gold-bright)', textTransform: 'uppercase' }}>Tanggung Jawab Utama</th>
                        <th style={{ padding: '20px', fontSize: '13px', fontWeight: 900, color: 'var(--gold-bright)', textTransform: 'uppercase' }}>Cakupan Otoritas</th>
                        <th style={{ padding: '20px', fontSize: '13px', fontWeight: 900, color: 'var(--gold-bright)', textTransform: 'uppercase' }}>Batasan Akses</th>
                        <th style={{ padding: '20px', fontSize: '13px', fontWeight: 900, color: 'var(--gold-bright)', textTransform: 'uppercase', textAlign: 'center' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingRules ? (
                        <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-primary)' }}>Memuat aturan akses...</td></tr>
                      ) : (
                        accessRules.map((r, i) => (
                          <tr key={r.id} style={{ borderBottom: '1px solid var(--bg-dark-box)', background: i % 2 === 0 ? 'transparent' : 'transparent' }}>
                            <td style={{ padding: '20px' }}>
                              <span style={{ color: 'var(--text-primary)', fontWeight: 900, fontSize: '14px', background: 'rgba(243, 198, 83, 0.1)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(243, 198, 83, 0.2)' }}>{r.role_name}</span>
                            </td>
                            <td style={{ padding: '20px', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600 }}>{r.responsibility}</td>
                            <td style={{ padding: '20px', color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5' }}>{r.authority_scope}</td>
                            <td style={{ padding: '20px' }}>
                              <span style={{ color: 'var(--text-danger)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🚫 {r.limitations}</span>
                            </td>
                            <td style={{ padding: '20px', textAlign: 'center' }}>
                              <button 
                                onClick={() => setEditingRule(r)}
                                style={{ background: 'transparent', border: '1px solid #f3c653', color: 'var(--gold-intense)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
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
                      background: userSubTab === 'staff' ? 'var(--gold-intense)' : 'var(--bg-badge)',
                      border: userSubTab === 'staff' ? '2px solid #f3c653' : '2px solid rgba(255,255,255,0.1)',
                      color: userSubTab === 'staff' ? '#02130e' : 'var(--text-primary)',
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
                      background: userSubTab === 'members' ? 'var(--gold-intense)' : 'var(--bg-badge)',
                      border: userSubTab === 'members' ? '2px solid #f3c653' : '2px solid rgba(255,255,255,0.1)',
                      color: userSubTab === 'members' ? '#02130e' : 'var(--text-primary)',
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
                        background: 'var(--bg-card)',
                        border: '2px solid #cca334',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        fontWeight: 700,
                        outline: 'none',
                        boxShadow: 'inset 0 2px 6px var(--shadow-color)'
                      }}
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--gold-intense)', fontWeight: 900, cursor: 'pointer', fontSize: '14px' }}
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
                      background: 'var(--bg-card)',
                      border: '2px solid #cca334',
                      color: 'var(--gold-intense)',
                      padding: '12px 24px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      boxShadow: '0 4px 15px var(--shadow-color)',
                      flexShrink: 0
                    }}
                  >
                  🔄 {loadingUsers ? '...' : 'Refresh'}
                </button>
              </div>
            </div>

              {/* MASTER TABLE: SOLID CONTRAST CANVAS */}
              <div style={{
                background: 'var(--bg-card)',
                border: '3px solid #cca334',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 20px 50px var(--shadow-color)'
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-card)', borderBottom: '3px solid #cca334' }}>
                        <th style={{ padding: '24px 20px', fontSize: '14px', fontWeight: 900, color: 'var(--gold-intense)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          {userSubTab === 'staff' ? 'Nama Karyawan / Staf' : 'Nama Anggota (Nasabah)'}
                        </th>
                        <th style={{ padding: '24px 20px', fontSize: '14px', fontWeight: 900, color: 'var(--gold-intense)', textTransform: 'uppercase', letterSpacing: '1px' }}>Email Akun</th>
                        <th style={{ padding: '24px 20px', fontSize: '14px', fontWeight: 900, color: 'var(--gold-intense)', textTransform: 'uppercase', letterSpacing: '1px' }}>Audit Password</th>
                        <th style={{ padding: '24px 20px', fontSize: '14px', fontWeight: 900, color: 'var(--gold-intense)', textTransform: 'uppercase', letterSpacing: '1px' }}>Status Role</th>
                        <th style={{ padding: '24px 20px', fontSize: '14px', fontWeight: 900, color: 'var(--gold-intense)', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>Otoritas</th>
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
                            
                            let badgeColors = { bg: 'var(--border-primary)', border: 'var(--text-primary)', text: 'var(--text-primary)' };
                            if (u.role === 'super_admin') badgeColors = { bg: 'var(--gold-intense)', border: 'var(--gold-intense)', text: '#02130e' };
                            else if (u.role === 'manager') badgeColors = { bg: 'var(--bg-card)', border: 'var(--text-info)', text: 'var(--text-info)' };
                            else if (u.role === 'member') badgeColors = { bg: 'var(--bg-card)', border: 'var(--text-success)', text: 'var(--text-success)' };
                            else badgeColors = { bg: 'var(--bg-card)', border: 'var(--text-warning)', text: 'var(--text-warning)' };

                            return (
                              <tr 
                                key={u.id} 
                                style={{ 
                                  borderBottom: '1px solid rgba(204,163,52,0.15)',
                                  background: idx % 2 === 0 ? 'transparent' : 'var(--bg-dark-box)',
                                  transition: 'background 0.2s'
                                }}
                              >
                                <td style={{ padding: '20px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div style={{ 
                                      width: '36px', height: '36px', borderRadius: '10px', 
                                      background: 'var(--gold-bright)', color: '#02130e',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                      fontSize: '16px', fontWeight: 900
                                    }}>
                                      {u.full_name ? u.full_name.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 900, fontSize: '16px', color: 'var(--text-primary)' }}>
                                        {u.full_name || '—'} 
                                        {isMe && <span style={{ fontSize: '11px', background: 'var(--gold-intense)', color: '#02130e', padding: '3px 8px', borderRadius: '5px', marginLeft: '8px', fontWeight: 900 }}>ANDA</span>}
                                      </div>
                                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>ID: {u.id.substring(0, 8)}...</div>
                                    </div>
                                  </div>
                                </td>

                                <td style={{ padding: '20px', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{u.email}</td>

                                <td style={{ padding: '20px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <code style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '6px 10px', borderRadius: '6px', fontSize: '13px', color: 'var(--gold-intense)', fontFamily: 'monospace' }}>
                                      {isPassVisible ? u.password : '••••••••'}
                                    </code>
                                    <button onClick={() => togglePasswordVisibility(u.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-info)', fontSize: '12px', cursor: 'pointer', fontWeight: 800 }}>{isPassVisible ? '🙈' : '👁️'}</button>
                                  </div>
                                </td>

                                <td style={{ padding: '20px' }}>
                                  <span style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', background: badgeColors.bg, border: `1.5px solid ${badgeColors.border}`, color: badgeColors.text }}>{u.role}</span>
                                </td>

                                <td style={{ padding: '20px', textAlign: 'center' }}>
                                  {!isMe && (
                                    <button onClick={() => handleOpenEditRole(u)} style={{ background: 'rgba(243, 198, 83, 0.1)', border: '2px solid #f3c653', color: 'var(--gold-intense)', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>Edit Role</button>
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
                  Menampilkan <strong style={{ color: 'var(--gold-intense)', fontSize: '18px' }}>{membersList.length}</strong> Data CIF Fisik Terverifikasi.
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
                      background: 'var(--bg-card)',
                      border: '2px solid #cca334',
                      color: 'var(--gold-intense)',
                      padding: '12px 24px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      boxShadow: '0 4px 15px var(--shadow-color)'
                    }}
                  >
                    🔄 Segarkan
                  </button>
                </div>
              </div>

              {/* CIF DATA TABLE */}
              <div style={{
                background: 'var(--bg-card)',
                border: '3px solid #cca334',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 20px 50px var(--shadow-color)'
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-card)', borderBottom: '3px solid #cca334' }}>
                        <th style={{ padding: '24px 20px', fontSize: '13px', fontWeight: 900, color: 'var(--gold-intense)', textTransform: 'uppercase', letterSpacing: '1px' }}>Identitas & NIK</th>
                        <th style={{ padding: '24px 20px', fontSize: '13px', fontWeight: 900, color: 'var(--gold-intense)', textTransform: 'uppercase', letterSpacing: '1px' }}>Verifikasi Ibu Kandung</th>
                        <th style={{ padding: '24px 20px', fontSize: '13px', fontWeight: 900, color: 'var(--gold-intense)', textTransform: 'uppercase', letterSpacing: '1px' }}>Pekerjaan & Pendapatan</th>
                        <th style={{ padding: '24px 20px', fontSize: '13px', fontWeight: 900, color: 'var(--gold-intense)', textTransform: 'uppercase', letterSpacing: '1px' }}>Kontak Aktif</th>
                        <th style={{ padding: '24px 20px', fontSize: '13px', fontWeight: 900, color: 'var(--gold-intense)', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>Audit Berkas</th>
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
                            <span style={{ fontSize: '13px', color: 'var(--gold-intense)', display: 'inline-block', marginTop: '8px', background: 'rgba(243,198,83,0.1)', padding: '6px 16px', borderRadius: '20px', border: '1px solid rgba(243,198,83,0.2)' }}>💡 Tip Admin: Klik tombol <strong>"⚡ Suntik 1 CIF Uji Coba"</strong> untuk melahirkan data simulasi secara instan!</span>
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
                                background: idx % 2 === 0 ? 'transparent' : 'var(--bg-dark-box)',
                                transition: 'background 0.2s'
                              }}
                            >
                              {/* Identity NIK */}
                              <td style={{ padding: '20px' }}>
                                <div style={{ fontWeight: 900, fontSize: '16px', color: 'var(--text-primary)' }}>
                                  {m.users?.full_name || 'Nama Tidak Sinkron'}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--gold-intense)', fontWeight: 800, marginTop: '3px', fontFamily: 'monospace' }}>
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
                                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-success)', marginTop: '3px' }}>
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
                                    background: 'var(--bg-card)',
                                    border: '2px solid #34d399',
                                    color: 'var(--text-success)',
                                    padding: '8px 16px',
                                    borderRadius: '10px',
                                    fontSize: '13px',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 2px 8px rgba(52,211,153,0.1)'
                                  }}
                                  onMouseOver={(e) => { e.currentTarget.style.background = 'var(--text-success)'; e.currentTarget.style.color = '#02130e'; }}
                                  onMouseOut={(e) => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-success)'; }}
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

          {/* ============================================== */}
          {/* TAB D: LOG AUDIT KEAMANAN                      */}
          {/* ============================================== */}
          {activeTab === 'audit_logs' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ color: 'var(--gold-intense)', fontSize: '20px', fontWeight: 900 }}>📋 Log Audit Keamanan</h3>
                <button 
                  onClick={fetchAuditLogs}
                  disabled={loadingAuditLogs}
                  style={{
                    background: 'var(--bg-card)', border: '2px solid #cca334', color: 'var(--gold-intense)',
                    padding: '10px 20px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer'
                  }}
                >
                  🔄 {loadingAuditLogs ? 'Memuat...' : 'Segarkan'}
                </button>
              </div>

              <div style={{ background: 'var(--bg-card)', border: '3px solid #cca334', borderRadius: '24px', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-card)', borderBottom: '3px solid #cca334' }}>
                        <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 900, color: 'var(--gold-intense)', textTransform: 'uppercase' }}>Waktu Kejadian</th>
                        <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 900, color: 'var(--gold-intense)', textTransform: 'uppercase' }}>Jenis Aksi</th>
                        <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 900, color: 'var(--gold-intense)', textTransform: 'uppercase' }}>Target ID</th>
                        <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 900, color: 'var(--gold-intense)', textTransform: 'uppercase' }}>Deskripsi Aktivitas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingAuditLogs ? (
                        <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-primary)' }}>Mengunduh log audit...</td></tr>
                      ) : auditLogs.length === 0 ? (
                        <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Belum ada log audit yang terekam.</td></tr>
                      ) : (
                        auditLogs.map((log: any, idx: number) => (
                          <tr key={log.id} style={{ borderBottom: '1px solid rgba(204,163,52,0.15)', background: idx % 2 === 0 ? 'transparent' : 'var(--bg-dark-box)' }}>
                            <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                              {new Date(log.created_at).toLocaleString('id-ID')}
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <span style={{ background: 'rgba(243,198,83,0.1)', border: '1px solid #f3c653', color: 'var(--gold-intense)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 900 }}>
                                {log.action_type}
                              </span>
                            </td>
                            <td style={{ padding: '16px 20px', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'monospace' }}>
                              {log.target_id}
                            </td>
                            <td style={{ padding: '16px 20px', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600 }}>
                              {log.description}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================== */}
          {/* TAB E: MANAJEMEN CHART OF ACCOUNTS (COA)       */}
          {/* ============================================== */}
          {activeTab === 'coa' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ color: 'var(--gold-intense)', fontSize: '20px', fontWeight: 900 }}>📒 Daftar Chart of Accounts (COA)</h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => {
                      setEditingCoa(null);
                      setNewCoaCode('');
                      setNewCoaName('');
                      setNewCoaCategory('ASSET');
                      setNewCoaNormalBalance('DEBIT');
                      setNewCoaDescription('');
                      setIsCoaModalOpen(true);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #f3c653 0%, #cca334 100%)', border: 'none', color: '#02130e',
                      padding: '10px 20px', borderRadius: '12px', fontWeight: 900, cursor: 'pointer'
                    }}
                  >
                    ➕ Tambah Akun COA
                  </button>
                  <button 
                    onClick={fetchCoaAccounts}
                    disabled={loadingCoa}
                    style={{
                      background: 'var(--bg-card)', border: '2px solid #cca334', color: 'var(--gold-intense)',
                      padding: '10px 20px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer'
                    }}
                  >
                    🔄 Segarkan
                  </button>
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', border: '3px solid #cca334', borderRadius: '24px', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-card)', borderBottom: '3px solid #cca334' }}>
                        <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 900, color: 'var(--gold-intense)', textTransform: 'uppercase' }}>Kode Akun</th>
                        <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 900, color: 'var(--gold-intense)', textTransform: 'uppercase' }}>Nama Akun</th>
                        <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 900, color: 'var(--gold-intense)', textTransform: 'uppercase' }}>Kategori</th>
                        <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 900, color: 'var(--gold-intense)', textTransform: 'uppercase' }}>Saldo Normal</th>
                        <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 900, color: 'var(--gold-intense)', textTransform: 'uppercase' }}>Keterangan</th>
                        <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 900, color: 'var(--gold-intense)', textTransform: 'uppercase', textAlign: 'center' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingCoa ? (
                        <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-primary)' }}>Mengunduh data COA...</td></tr>
                      ) : coaAccounts.length === 0 ? (
                        <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Belum ada akun COA terdaftar.</td></tr>
                      ) : (
                        coaAccounts.map((coa: any, idx: number) => (
                          <tr key={coa.id} style={{ borderBottom: '1px solid rgba(204,163,52,0.15)', background: idx % 2 === 0 ? 'transparent' : 'var(--bg-dark-box)' }}>
                            <td style={{ padding: '16px 20px', color: 'var(--gold-intense)', fontSize: '14px', fontWeight: 900, fontFamily: 'monospace' }}>
                              {coa.code}
                            </td>
                            <td style={{ padding: '16px 20px', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 800 }}>
                              {coa.name}
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <span style={{ background: 'var(--bg-badge)', color: 'var(--text-primary)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                                {coa.category}
                              </span>
                            </td>
                            <td style={{ padding: '16px 20px', color: coa.normal_balance === 'DEBIT' ? 'var(--text-info)' : 'var(--text-success)', fontSize: '12px', fontWeight: 900 }}>
                              {coa.normal_balance}
                            </td>
                            <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                              {coa.description || '—'}
                            </td>
                            <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                <button 
                                  onClick={() => {
                                    setEditingCoa(coa);
                                    setNewCoaCode(coa.code);
                                    setNewCoaName(coa.name);
                                    setNewCoaCategory(coa.category);
                                    setNewCoaNormalBalance(coa.normal_balance);
                                    setNewCoaDescription(coa.description || '');
                                    setIsCoaModalOpen(true);
                                  }}
                                  style={{ background: 'transparent', border: '1px solid #f3c653', color: 'var(--gold-intense)', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => handleDeleteCoa(coa.id, coa.code, coa.name)}
                                  style={{ background: 'transparent', border: '1px solid #ef4444', color: 'var(--text-danger)', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                                >
                                  Hapus
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================== */}
          {/* TAB F: TUGAS & PEKERJAAN STAF                  */}
          {/* ============================================== */}
          {activeTab === 'tasks' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ color: 'var(--gold-intense)', fontSize: '20px', fontWeight: 900 }}>✅ Penugasan Tata Kelola Staf</h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => {
                      setNewTaskTitle('');
                      setNewTaskDescription('');
                      setNewTaskAssignee('');
                      setNewTaskDueDate('');
                      setIsTaskModalOpen(true);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #f3c653 0%, #cca334 100%)', border: 'none', color: '#02130e',
                      padding: '10px 20px', borderRadius: '12px', fontWeight: 900, cursor: 'pointer'
                    }}
                  >
                    ➕ Buat Tugas Baru
                  </button>
                  <button 
                    onClick={fetchTasks}
                    disabled={loadingTasks}
                    style={{
                      background: 'var(--bg-card)', border: '2px solid #cca334', color: 'var(--gold-intense)',
                      padding: '10px 20px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer'
                    }}
                  >
                    🔄 Segarkan
                  </button>
                </div>
              </div>

              {loadingTasks ? (
                <div style={{ color: 'var(--text-primary)', textAlign: 'center', padding: '40px' }}>Mengunduh daftar tugas...</div>
              ) : systemTasks.length === 0 ? (
                <div style={{ background: 'var(--bg-card)', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Belum ada penugasan terdaftar.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {systemTasks.map((task: any) => (
                    <div key={task.id} style={{ background: 'var(--bg-card)', border: '2px solid #cca334', borderRadius: '20px', padding: '24px', position: 'relative' }}>
                      <span style={{
                        position: 'absolute', top: '20px', right: '20px',
                        background: task.status === 'COMPLETED' ? 'rgba(52,211,153,0.1)' : 'rgba(243,198,83,0.1)',
                        border: task.status === 'COMPLETED' ? '1px solid #34d399' : '1px solid #f3c653',
                        color: task.status === 'COMPLETED' ? 'var(--text-success)' : 'var(--gold-intense)',
                        padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 900
                      }}>
                        {task.status}
                      </span>
                      <h4 style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 800, paddingRight: '70px', marginBottom: '8px' }}>{task.title}</h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', minHeight: '40px', marginBottom: '16px', lineHeight: 1.5 }}>{task.description || 'Tanpa deskripsi'}</p>
                      
                      <div style={{ borderTop: '1px solid var(--bg-track)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <div>
                          <span style={{ color: 'var(--text-secondary)', display: 'block' }}>PENERIMA TUGAS</span>
                          <strong style={{ color: 'var(--text-primary)' }}>👤 {task.assignee_name}</strong>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ color: 'var(--text-secondary)', display: 'block' }}>TENGGAT WAKTU</span>
                          <strong style={{ color: 'var(--gold-intense)' }}>📅 {task.due_date ? new Date(task.due_date).toLocaleDateString('id-ID') : '—'}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================== */}
          {/* TAB G: MONITOR DIAGNOSTIK & LATENSI            */}
          {/* ============================================== */}
          {activeTab === 'diagnostics' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <h3 style={{ color: 'var(--gold-intense)', fontSize: '20px', fontWeight: 900, marginBottom: '24px' }}>🩺 Diagnostik & Monitor Latensi</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginBottom: '28px' }}>
                <div style={{ background: 'var(--bg-card)', border: '2px solid #cca334', borderRadius: '20px', padding: '24px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 800 }}>LATENSI SUPABASE</span>
                  <div style={{ fontSize: '32px', fontWeight: 900, color: (pingLatency !== null && pingLatency < 150) ? 'var(--text-success)' : 'var(--gold-intense)', marginTop: '10px' }}>
                    {pingLatency !== null ? pingLatency : '-'} ms
                  </div>
                  <button onClick={measurePing} style={{ marginTop: '14px', background: 'var(--bg-badge)', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>
                    Uji Ulang Latensi
                  </button>
                </div>

                <div style={{ background: 'var(--bg-card)', border: '2px solid #cca334', borderRadius: '20px', padding: '24px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 800 }}>AKUN AUTENTIKASI</span>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '10px', wordBreak: 'break-all' }}>
                    {user?.email}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--gold-intense)', marginTop: '4px' }}>ID: {user?.id}</div>
                </div>

                <div style={{ background: 'var(--bg-card)', border: '2px solid #cca334', borderRadius: '20px', padding: '24px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 800 }}>STATUS KONEKSI</span>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-success)', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--text-success)', boxShadow: '0 0 10px #34d399' }} />
                    TERHUBUNG
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '32px' }}>
                <h4 style={{ color: 'var(--gold-intense)', fontSize: '16px', fontWeight: 900, marginBottom: '14px' }}>Informasi Lingkungan Sistem (Environment)</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--bg-dark-box)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Framework UI</span>
                    <strong style={{ color: 'var(--text-primary)' }}>Next.js (App Router)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--bg-dark-box)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Database Backend</span>
                    <strong style={{ color: 'var(--text-primary)' }}>Supabase PostgreSQL Engine v15</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--bg-dark-box)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Tema Desain</span>
                    <strong style={{ color: 'var(--gold-intense)' }}>Emerald Gold (Institutional Class)</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================== */}
          {/* TAB H: PENCADANGAN CONFIG & DATA               */}
          {/* ============================================== */}
          {activeTab === 'backup' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <h3 style={{ color: 'var(--gold-intense)', fontSize: '20px', fontWeight: 900, marginBottom: '24px' }}>📦 Pencadangan & Konfigurasi Ekspor</h3>
              
              <div style={{ background: 'var(--bg-card)', border: '3px solid #cca334', borderRadius: '24px', padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>💾</div>
                <h4 style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 900, marginBottom: '12px' }}>Ekspor Konfigurasi Cadangan Sistem</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '600px', margin: '0 auto 28px', lineHeight: 1.6 }}>
                  Anda dapat mengekspor seluruh konfigurasi system_parameters, chart of accounts (COA), dan matriks access_rules ke dalam satu berkas format JSON untuk pengamanan sistem secara offline.
                </p>

                <button 
                  onClick={handleExportBackup}
                  disabled={isExportingBackup}
                  style={{
                    background: 'linear-gradient(135deg, #f3c653 0%, #cca334 100%)', border: 'none', color: '#02130e',
                    padding: '16px 36px', borderRadius: '14px', fontWeight: 900, fontSize: '16px', cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(243,198,83,0.3)', transition: 'transform 0.1s'
                  }}
                >
                  {isExportingBackup ? 'Memproses Ekspor...' : 'Unduh Berkas Konfigurasi JSON'}
                </button>
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
              background: 'var(--bg-card)',
              border: '4px solid #f3c653', // Heavy Gold Border for clear focus
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
                    background: 'var(--text-primary)', // Pure high-contrast white
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
                  <option value="super_admin">SUPER ADMIN (Otoritas Penuh IT)</option>
                </select>
              </div>

              {/* Critical Alert box inside modal */}
              <div style={{
                background: 'rgba(234, 179, 8, 0.1)',
                border: '2px solid var(--text-warning)',
                borderRadius: '14px',
                padding: '16px',
                marginBottom: '32px',
                fontSize: '14px',
                color: 'var(--text-primary)',
                fontWeight: 600,
                lineHeight: 1.5
              }}>
                ⚠️ <span style={{ color: 'var(--text-warning)', fontWeight: 900 }}>INFORMASI:</span> Jabatan baru akan langsung aktif secara real-time di semua terminal perangkat user.
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
                    background: 'var(--gold-intense)',
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
              background: 'var(--bg-card)',
              border: '4px solid #cca334',
              borderRadius: '28px',
              width: '100%',
              maxWidth: '520px',
              padding: '36px',
              boxShadow: '0 30px 80px var(--shadow-color)',
              animation: 'scaleUp 0.2s ease-out',
              maxHeight: '95vh',
              overflowY: 'auto'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--gold-intense)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                ➕ Tambah Akun Staf Baru
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', fontWeight: 500 }}>
                Daftarkan hak akses baru ke sistem secara langsung dan aman.
              </p>

              {createErrorMsg && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '2px solid #fca5a5',
                  borderRadius: '12px',
                  padding: '12px',
                  color: 'var(--border-danger)',
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
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--gold-intense)', marginBottom: '8px', textTransform: 'uppercase' }}>Nama Lengkap</label>
                  <input 
                    type="text"
                    required
                    placeholder="Contoh: Muhammad Ridwan"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    style={{
                      width: '100%', background: 'var(--bg-card)', border: '2px solid rgba(255,255,255,0.2)',
                      borderRadius: '12px', padding: '14px', color: 'var(--text-primary)', fontSize: '15px',
                      fontWeight: 600, outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--gold-intense)', marginBottom: '8px', textTransform: 'uppercase' }}>Email Institusi</label>
                  <input 
                    type="email"
                    required
                    placeholder="nama.staff@koperasi.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    style={{
                      width: '100%', background: 'var(--bg-card)', border: '2px solid rgba(255,255,255,0.2)',
                      borderRadius: '12px', padding: '14px', color: 'var(--text-primary)', fontSize: '15px',
                      fontWeight: 600, outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--gold-intense)', marginBottom: '8px', textTransform: 'uppercase' }}>Kata Sandi Sementara</label>
                  <input 
                    type="password"
                    required
                    minLength={6}
                    placeholder="Minimal 6 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{
                      width: '100%', background: 'var(--bg-card)', border: '2px solid rgba(255,255,255,0.2)',
                      borderRadius: '12px', padding: '14px', color: 'var(--text-primary)', fontSize: '15px',
                      fontWeight: 600, outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--gold-intense)', marginBottom: '8px', textTransform: 'uppercase' }}>Pilih Hak Akses (Role)</label>
                  <select 
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    style={{
                      width: '100%', background: 'var(--text-primary)', border: '3px solid #cca334',
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
                    <option value="super_admin">Super Admin (IT ADMIN)</option>
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
              background: 'var(--bg-card)',
              border: '4px solid #34d399', // Vibrant Green security border
              borderRadius: '28px',
              width: '100%',
              maxWidth: '650px',
              padding: '40px',
              boxShadow: '0 40px 100px var(--shadow-color)',
              animation: 'scaleUp 0.2s ease-out',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              
              {/* Header & Logo banner inside modal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-success)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                    📂 Dokumen Fisik KYC Nasabah
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0' }}>
                    ID Sistem Unik: {selectedCIF.id}
                  </p>
                </div>
                <span style={{
                  fontSize: '11px',
                  background: 'var(--bg-card)',
                  color: 'var(--text-success)',
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
                  <div style={{ color: 'var(--gold-intense)', fontSize: '12px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px', borderLeft: '3px solid #f3c653', paddingLeft: '8px' }}>
                    1. Kredensial & Identitas Negara
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--bg-dark-box)' }}>
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
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--gold-intense)', fontFamily: 'monospace' }}>{selectedCIF.nik}</div>
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
                    <div style={{ color: 'var(--gold-intense)', fontSize: '12px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px', borderLeft: '3px solid #f3c653', paddingLeft: '8px' }}>
                      2. Keamanan Bank
                    </div>
                    <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '16px', border: '1px solid var(--bg-dark-box)', height: 'calc(100% - 24px)' }}>
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
                    <div style={{ color: 'var(--gold-intense)', fontSize: '12px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px', borderLeft: '3px solid #f3c653', paddingLeft: '8px' }}>
                      3. Profil Ekonomi
                    </div>
                    <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '16px', border: '1px solid var(--bg-dark-box)', height: 'calc(100% - 24px)' }}>
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '4px' }}>PROFESI PEKERJAAN</div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>{selectedCIF.occupation}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '4px' }}>PENDAPATAN PER BULAN</div>
                        <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-success)' }}>
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(selectedCIF.monthly_income)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section C: Alamat Lengkap */}
                <div>
                  <div style={{ color: 'var(--gold-intense)', fontSize: '12px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px', borderLeft: '3px solid #f3c653', paddingLeft: '8px' }}>
                    4. Informasi Geografis & Domisili
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--bg-dark-box)' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '4px' }}>ALAMAT KTP RESMI</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>{selectedCIF.ktp_address}</div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--bg-dark-box)', paddingTop: '10px', marginTop: '4px' }}>
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
                    background: 'var(--text-success)',
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
            <div style={{ background: 'var(--bg-card)', border: '4px solid #cca334', borderRadius: '28px', width: '100%', maxWidth: '550px', padding: '36px', boxShadow: '0 30px 80px var(--shadow-color)' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--gold-intense)', marginBottom: '8px' }}>
                {editingRule ? '✏️ Edit Aturan Akses' : '➕ Tambah Aturan Baru'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>Konfigurasi parameter otoritas untuk jabatan sistem.</p>
              
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
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--gold-intense)', marginBottom: '8px' }}>NAMA JABATAN / ROLE</label>
                  <input name="role_name" defaultValue={editingRule?.role_name} required style={{ width: '100%', background: 'var(--bg-card)', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '14px', color: 'var(--text-primary)', fontWeight: 600 }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--gold-intense)', marginBottom: '8px' }}>TANGGUNG JAWAB UTAMA</label>
                  <input name="responsibility" defaultValue={editingRule?.responsibility} placeholder="Contoh: Operasional Kas & Pelayanan" style={{ width: '100%', background: 'var(--bg-card)', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '14px', color: 'var(--text-primary)' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--gold-intense)', marginBottom: '8px' }}>CAKUPAN OTORITAS</label>
                  <textarea name="authority_scope" defaultValue={editingRule?.authority_scope} rows={3} style={{ width: '100%', background: 'var(--bg-card)', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '14px', color: 'var(--text-primary)' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--gold-intense)', marginBottom: '8px' }}>BATASAN AKSES</label>
                  <input name="limitations" defaultValue={editingRule?.limitations} placeholder="Contoh: Tidak bisa menghapus jurnal" style={{ width: '100%', background: 'var(--bg-card)', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '14px', color: 'var(--text-primary)' }} />
                </div>

                <div style={{ display: 'flex', gap: '14px', marginTop: '10px' }}>
                  <button type="button" onClick={() => { setIsCreatingRule(false); setEditingRule(null); }} style={{ flexGrow: 1, background: 'transparent', border: '2px solid var(--border-primary)', color: 'var(--text-primary)', padding: '16px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>Batal</button>
                  <button type="submit" style={{ flexGrow: 2, background: 'linear-gradient(135deg, #f3c653 0%, #cca334 100%)', border: 'none', color: '#02130e', padding: '16px', borderRadius: '12px', fontWeight: 900, fontSize: '15px', cursor: 'pointer' }}>Simpan Aturan</button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* NEW: CHART OF ACCOUNTS (COA) CREATION/EDIT MODAL */}
        {isCoaModalOpen && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(1, 10, 7, 0.9)', backdropFilter: 'blur(8px)',
            zIndex: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}>
            <div style={{ background: 'var(--bg-card)', border: '4px solid #cca334', borderRadius: '28px', width: '100%', maxWidth: '500px', padding: '36px', boxShadow: '0 30px 80px var(--shadow-color)' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--gold-intense)', marginBottom: '8px' }}>
                {editingCoa ? '✏️ Edit Akun COA' : '➕ Tambah Akun COA Baru'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>Konfigurasi detail akun akuntansi untuk pembukuan koperasi.</p>
              
              <form onSubmit={handleSaveCoa} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--gold-intense)', marginBottom: '6px' }}>KODE AKUN</label>
                  <input 
                    type="text" required placeholder="Contoh: 10101" 
                    value={newCoaCode} onChange={(e) => setNewCoaCode(e.target.value)} 
                    style={{ width: '100%', background: 'var(--bg-card)', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '12px', color: 'var(--text-primary)', fontWeight: 600 }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--gold-intense)', marginBottom: '6px' }}>NAMA AKUN</label>
                  <input 
                    type="text" required placeholder="Contoh: Kas Utama Teller" 
                    value={newCoaName} onChange={(e) => setNewCoaName(e.target.value)} 
                    style={{ width: '100%', background: 'var(--bg-card)', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '12px', color: 'var(--text-primary)', fontWeight: 600 }} 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--gold-intense)', marginBottom: '6px' }}>KATEGORI</label>
                    <select 
                      value={newCoaCategory} onChange={(e) => setNewCoaCategory(e.target.value)} 
                      style={{ width: '100%', background: 'var(--text-primary)', border: '2px solid #cca334', borderRadius: '12px', padding: '12px', color: '#02130e', fontWeight: 800, cursor: 'pointer' }}
                    >
                      <option value="ASSET">ASSET</option>
                      <option value="LIABILITY">LIABILITY</option>
                      <option value="EQUITY">EQUITY</option>
                      <option value="REVENUE">REVENUE</option>
                      <option value="EXPENSE">EXPENSE</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--gold-intense)', marginBottom: '6px' }}>SALDO NORMAL</label>
                    <select 
                      value={newCoaNormalBalance} onChange={(e) => setNewCoaNormalBalance(e.target.value)} 
                      style={{ width: '100%', background: 'var(--text-primary)', border: '2px solid #cca334', borderRadius: '12px', padding: '12px', color: '#02130e', fontWeight: 800, cursor: 'pointer' }}
                    >
                      <option value="DEBIT">DEBIT</option>
                      <option value="CREDIT">CREDIT</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--gold-intense)', marginBottom: '6px' }}>DESKRIPSI / KETERANGAN</label>
                  <textarea 
                    value={newCoaDescription} onChange={(e) => setNewCoaDescription(e.target.value)} rows={2} 
                    style={{ width: '100%', background: 'var(--bg-card)', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '12px', color: 'var(--text-primary)' }} 
                  />
                </div>

                <div style={{ display: 'flex', gap: '14px', marginTop: '10px' }}>
                  <button type="button" onClick={() => { setIsCoaModalOpen(false); setEditingCoa(null); }} style={{ flexGrow: 1, background: 'transparent', border: '2px solid var(--border-primary)', color: 'var(--text-primary)', padding: '14px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>Batal</button>
                  <button type="submit" disabled={isSavingCoa} style={{ flexGrow: 2, background: 'linear-gradient(135deg, #f3c653 0%, #cca334 100%)', border: 'none', color: '#02130e', padding: '14px', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}>
                    {isSavingCoa ? 'Menyimpan...' : 'Simpan Akun'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* NEW: SYSTEM TASKS CREATION MODAL */}
        {isTaskModalOpen && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(1, 10, 7, 0.9)', backdropFilter: 'blur(8px)',
            zIndex: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}>
            <div style={{ background: 'var(--bg-card)', border: '4px solid #cca334', borderRadius: '28px', width: '100%', maxWidth: '500px', padding: '36px', boxShadow: '0 30px 80px var(--shadow-color)' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--gold-intense)', marginBottom: '8px' }}>
                ➕ Tambah Tugas Operasional Baru
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>Berikan penugasan dan tenggat waktu penyelesaian kepada staf koperasi.</p>
              
              <form onSubmit={handleSaveTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--gold-intense)', marginBottom: '6px' }}>JUDUL TUGAS</label>
                  <input 
                    type="text" required placeholder="Contoh: Audit Rekonsiliasi Kas Bulanan" 
                    value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} 
                    style={{ width: '100%', background: 'var(--bg-card)', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '12px', color: 'var(--text-primary)', fontWeight: 600 }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--gold-intense)', marginBottom: '6px' }}>DESKRIPSI TUGAS</label>
                  <textarea 
                    required placeholder="Deskripsikan secara detail langkah yang harus dikerjakan..." 
                    value={newTaskDescription} onChange={(e) => setNewTaskDescription(e.target.value)} rows={3} 
                    style={{ width: '100%', background: 'var(--bg-card)', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '12px', color: 'var(--text-primary)' }} 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--gold-intense)', marginBottom: '6px' }}>PENERIMA TUGAS</label>
                    <input 
                      type="text" required placeholder="Contoh: Ahmad Kasir" 
                      value={newTaskAssignee} onChange={(e) => setNewTaskAssignee(e.target.value)} 
                      style={{ width: '100%', background: 'var(--bg-card)', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '12px', color: 'var(--text-primary)', fontWeight: 600 }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--gold-intense)', marginBottom: '6px' }}>TENGGAT WAKTU</label>
                    <input 
                      type="date" required 
                      value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} 
                      style={{ width: '100%', background: 'var(--bg-card)', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '12px', color: 'var(--text-primary)', fontWeight: 600 }} 
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '14px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setIsTaskModalOpen(false)} style={{ flexGrow: 1, background: 'transparent', border: '2px solid var(--border-primary)', color: 'var(--text-primary)', padding: '14px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>Batal</button>
                  <button type="submit" disabled={isSavingTask} style={{ flexGrow: 2, background: 'linear-gradient(135deg, #f3c653 0%, #cca334 100%)', border: 'none', color: '#02130e', padding: '14px', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}>
                    {isSavingTask ? 'Menyimpan...' : 'Kirim Tugas'}
                  </button>
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
        background: 'var(--bg-card)',
        color: 'var(--text-primary)',
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
            background: 'var(--bg-card)',
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

          <h1 style={{ color: 'var(--text-primary)', fontSize: '34px', fontWeight: 900, marginBottom: '14px', letterSpacing: '-0.5px' }}>
            Dasbor <span style={{ color: 'var(--gold-intense)' }}>Nasabah</span>
          </h1>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: '18px', lineHeight: 1.6, marginBottom: '36px', fontWeight: 500 }}>
            Selamat datang di gerbang utama transaksi Syariah. Status autentikasi akses Anda aman dan tervalidasi!
          </p>

          {/* Info Display Card */}
          <div style={{
            background: 'var(--bg-card)',
            border: '2px solid rgba(204,163,52,0.3)',
            borderRadius: '20px',
            padding: '24px',
            textAlign: 'left',
            marginBottom: '36px'
          }}>
            <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--bg-track)', paddingBottom: '14px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '15px', fontWeight: 600 }}>Nama Lengkap</span>
              <span style={{ fontWeight: 900, color: 'var(--text-primary)', fontSize: '16px' }}>{profile?.full_name || user?.user_metadata?.full_name || 'Pengguna'}</span>
            </div>
            <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--bg-track)', paddingBottom: '14px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '15px', fontWeight: 600 }}>Email Akun</span>
              <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '16px' }}>{user?.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '15px', fontWeight: 600 }}>Hak Akses</span>
              <span style={{ 
                fontWeight: 900, 
                color: '#02130e',
                background: 'var(--gold-intense)',
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
                color: 'var(--text-primary)',
                padding: '15px 36px',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'var(--text-danger)'; }}
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
                  background: 'linear-gradient(135deg, #34d399 0%, var(--text-success) 100%)',
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
