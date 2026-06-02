const fs = require('fs');

let content = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// 1. Add states
const stateInjection = `  // SUPER ADMIN RESTORED STATES
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
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
`;

if (!content.includes('const [auditLogs')) {
  content = content.replace(
    "const [membersList, setMembersList] = useState<any[]>([]);",
    stateInjection + "\n  const [membersList, setMembersList] = useState<any[]>([]);"
  );
}

// 2. Add functions
const functionsInjection = `
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
    await supabase.from('system_parameters').select('id').limit(1);
    setPingLatency(Date.now() - start);
  };

  const handleExportBackup = async () => {
    setIsExportingBackup(true);
    try {
      const supabase = createClient();
      const { data: params } = await supabase.from('system_parameters').select('*');
      const { data: coa } = await supabase.from('coa_accounts').select('*');
      const backupData = {
        timestamp: new Date().toISOString(),
        system_parameters: params,
        coa_accounts: coa
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`iqra-backup-\${new Date().toISOString().split('T')[0]}.json\`;
      a.click();
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
    if (editingCoa) {
      await supabase.from('coa_accounts').update(payload).eq('id', editingCoa.id);
    } else {
      await supabase.from('coa_accounts').insert([payload]);
    }
    fetchCoaAccounts();
    setIsCoaModalOpen(false);
    setIsSavingCoa(false);
  };

  const handleDeleteCoa = async (id: string) => {
    if (confirm('Hapus akun COA ini?')) {
      const supabase = createClient();
      await supabase.from('coa_accounts').delete().eq('id', id);
      fetchCoaAccounts();
    }
  };

  useEffect(() => {
    if (activeTab === 'audit_logs') fetchAuditLogs();
    if (activeTab === 'coa') fetchCoaAccounts();
    if (activeTab === 'tasks') fetchTasks();
    if (activeTab === 'diagnostics') measurePing();
  }, [activeTab]);
`;

if (!content.includes('const fetchAuditLogs')) {
  content = content.replace(
    "const fetchSystemParams = async () => {",
    functionsInjection + "\n  const fetchSystemParams = async () => {"
  );
}

// 3. Add Sidebar Buttons
const sidebarInjection = `
              <button onClick={() => setActiveTab('audit_logs')} style={{ padding: '12px 16px', background: activeTab === 'audit_logs' ? 'rgba(204, 163, 52, 0.1)' : 'transparent', border: 'none', borderLeft: activeTab === 'audit_logs' ? '4px solid #cca334' : '4px solid transparent', color: activeTab === 'audit_logs' ? '#cca334' : 'var(--text-secondary)', textAlign: 'left', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '18px' }}>📋</span> <span style={{ opacity: isSidebarOpen ? 1 : 0 }}>Log Audit Sistem</span>
              </button>
              <button onClick={() => setActiveTab('coa')} style={{ padding: '12px 16px', background: activeTab === 'coa' ? 'rgba(204, 163, 52, 0.1)' : 'transparent', border: 'none', borderLeft: activeTab === 'coa' ? '4px solid #cca334' : '4px solid transparent', color: activeTab === 'coa' ? '#cca334' : 'var(--text-secondary)', textAlign: 'left', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '18px' }}>📒</span> <span style={{ opacity: isSidebarOpen ? 1 : 0 }}>Manajemen COA</span>
              </button>
              <button onClick={() => setActiveTab('tasks')} style={{ padding: '12px 16px', background: activeTab === 'tasks' ? 'rgba(204, 163, 52, 0.1)' : 'transparent', border: 'none', borderLeft: activeTab === 'tasks' ? '4px solid #cca334' : '4px solid transparent', color: activeTab === 'tasks' ? '#cca334' : 'var(--text-secondary)', textAlign: 'left', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '18px' }}>✅</span> <span style={{ opacity: isSidebarOpen ? 1 : 0 }}>Penugasan Staf</span>
              </button>
              <button onClick={() => setActiveTab('diagnostics')} style={{ padding: '12px 16px', background: activeTab === 'diagnostics' ? 'rgba(204, 163, 52, 0.1)' : 'transparent', border: 'none', borderLeft: activeTab === 'diagnostics' ? '4px solid #cca334' : '4px solid transparent', color: activeTab === 'diagnostics' ? '#cca334' : 'var(--text-secondary)', textAlign: 'left', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '18px' }}>🩺</span> <span style={{ opacity: isSidebarOpen ? 1 : 0 }}>Diagnostik & Latensi</span>
              </button>
              <button onClick={() => setActiveTab('backup')} style={{ padding: '12px 16px', background: activeTab === 'backup' ? 'rgba(204, 163, 52, 0.1)' : 'transparent', border: 'none', borderLeft: activeTab === 'backup' ? '4px solid #cca334' : '4px solid transparent', color: activeTab === 'backup' ? '#cca334' : 'var(--text-secondary)', textAlign: 'left', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '18px' }}>📦</span> <span style={{ opacity: isSidebarOpen ? 1 : 0 }}>Pencadangan Data</span>
              </button>
`;

if (!content.includes('Log Audit Sistem')) {
  content = content.replace(
    /<button onClick=\{\(\) => setActiveTab\('ai_knowledge'\)\} style=\{\{ padding: '12px 16px', background: activeTab === 'ai_knowledge' \? 'rgba\(204, 163, 52, 0\.1\)' : 'transparent', border: 'none', borderLeft: activeTab === 'ai_knowledge' \? '4px solid #cca334' : '4px solid transparent', color: activeTab === 'ai_knowledge' \? '#cca334' : 'var\(--text-secondary\)', textAlign: 'left', cursor: 'pointer', fontWeight: 600, transition: 'all 0\.2s', display: 'flex', alignItems: 'center', gap: '12px' \}\}>\s*<span style=\{\{ fontSize: '18px' \}\}>🧠<\/span> <span style=\{\{ opacity: isSidebarOpen \? 1 : 0 \}\}>Basis Pengetahuan AI<\/span>\s*<\/button>/,
    "$&" + "\n" + sidebarInjection
  );
}

// 4. Add Panels & Modals
const panelsInjection = `
          {activeTab === 'audit_logs' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out', background: 'var(--bg-card)', padding: '40px', borderRadius: '24px', border: '1.5px solid var(--border-primary)' }}>
              <h2 style={{ color: 'var(--gold-intense)', margin: '0 0 24px 0' }}>📋 Log Audit Sistem</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-page)', borderBottom: '2px solid var(--border-primary)' }}>
                    <th style={{ padding: '16px', textAlign: 'left' }}>WAKTU</th>
                    <th style={{ padding: '16px', textAlign: 'left' }}>AKSI</th>
                    <th style={{ padding: '16px', textAlign: 'left' }}>TARGET</th>
                    <th style={{ padding: '16px', textAlign: 'left' }}>DESKRIPSI</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '16px' }}>{new Date(log.created_at).toLocaleString()}</td>
                      <td style={{ padding: '16px' }}>{log.action_type}</td>
                      <td style={{ padding: '16px' }}>{log.target_id}</td>
                      <td style={{ padding: '16px' }}>{log.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'diagnostics' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out', background: 'var(--bg-card)', padding: '40px', borderRadius: '24px', border: '1.5px solid var(--border-primary)' }}>
              <h2 style={{ color: 'var(--gold-intense)', margin: '0 0 24px 0' }}>🩺 Diagnostik & Latensi</h2>
              <p>Latensi Database Supabase: <strong>{pingLatency !== null ? pingLatency + ' ms' : 'Mengukur...'}</strong></p>
            </div>
          )}

          {activeTab === 'backup' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out', background: 'var(--bg-card)', padding: '40px', borderRadius: '24px', border: '1.5px solid var(--border-primary)' }}>
              <h2 style={{ color: 'var(--gold-intense)', margin: '0 0 24px 0' }}>📦 Pencadangan Data</h2>
              <button onClick={handleExportBackup} disabled={isExportingBackup} style={{ background: '#cca334', border: 'none', color: '#02130e', padding: '12px 24px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>
                {isExportingBackup ? 'Memproses Ekspor...' : 'Unduh Backup Konfigurasi (JSON)'}
              </button>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out', background: 'var(--bg-card)', padding: '40px', borderRadius: '24px', border: '1.5px solid var(--border-primary)' }}>
              <h2 style={{ color: 'var(--gold-intense)', margin: '0 0 24px 0' }}>✅ Penugasan Staf</h2>
              <p>Modul penugasan tugas harian untuk staf beroperasi normal.</p>
            </div>
          )}

          {activeTab === 'coa' && (
            <div style={{ animation: 'fadeIn 0.3s ease-out', background: 'var(--bg-card)', padding: '40px', borderRadius: '24px', border: '1.5px solid var(--border-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: 'var(--gold-intense)', margin: 0 }}>📒 Manajemen Chart of Accounts (COA)</h2>
                <button 
                  onClick={() => {
                    setEditingCoa(null);
                    setNewCoaCode('');
                    setNewCoaName('');
                    setNewCoaCategory('Aset');
                    setNewCoaNormalBalance('Debit');
                    setNewCoaDescription('');
                    setIsCoaModalOpen(true);
                  }}
                  style={{ background: '#cca334', border: 'none', color: '#02130e', padding: '10px 20px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}
                >
                  + Tambah Akun COA Baru
                </button>
              </div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>Daftar pos-pos akuntansi standar SAK EP yang ditarik secara dinamis dari tabel <code>coa_accounts</code>. Gunakan filter di setiap kolom untuk mencari data.</p>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-page)', borderBottom: '2px solid var(--border-primary)' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 900, color: '#cca334', verticalAlign: 'top' }}>
                        KODE AKUN
                        <input type="text" value={filterCoaCode} onChange={e => setFilterCoaCode(e.target.value)} placeholder="Filter kode..." style={{ display: 'block', width: '100%', marginTop: '8px', padding: '6px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'var(--text-primary)', fontSize: '12px', fontWeight: 'normal' }} />
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 900, color: '#cca334', verticalAlign: 'top' }}>
                        NAMA AKUN
                        <input type="text" value={filterCoaName} onChange={e => setFilterCoaName(e.target.value)} placeholder="Filter nama..." style={{ display: 'block', width: '100%', marginTop: '8px', padding: '6px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'var(--text-primary)', fontSize: '12px', fontWeight: 'normal' }} />
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 900, color: '#cca334', verticalAlign: 'top' }}>
                        KATEGORI
                        <select value={filterCoaCategory} onChange={e => setFilterCoaCategory(e.target.value)} style={{ display: 'block', width: '100%', marginTop: '8px', padding: '6px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'var(--text-primary)', fontSize: '12px', fontWeight: 'normal' }}>
                          <option value="">Semua Kategori</option>
                          <option value="Aset">Aset</option>
                          <option value="Liabilitas">Liabilitas</option>
                          <option value="Ekuitas">Ekuitas</option>
                          <option value="Pendapatan">Pendapatan</option>
                          <option value="Beban">Beban</option>
                          <option value="Kontra-Aset">Kontra-Aset</option>
                          <option value="Dana Syirkah">Dana Syirkah</option>
                          <option value="Bagi Hasil">Bagi Hasil</option>
                        </select>
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 900, color: '#cca334', verticalAlign: 'top' }}>
                        SALDO NORMAL
                        <select value={filterCoaNormalBalance} onChange={e => setFilterCoaNormalBalance(e.target.value)} style={{ display: 'block', width: '100%', marginTop: '8px', padding: '6px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'var(--text-primary)', fontSize: '12px', fontWeight: 'normal' }}>
                          <option value="">Semua Saldo</option>
                          <option value="Debit">Debit</option>
                          <option value="Kredit">Kredit</option>
                        </select>
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 900, color: '#cca334', verticalAlign: 'top' }}>
                        AKSI
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingCoa ? (
                      <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center' }}>Memuat COA...</td></tr>
                    ) : coaAccounts.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Belum ada data COA.</td></tr>
                    ) : (
                      (() => {
                        const filtered = coaAccounts.filter(coa => {
                          const codeMatch = filterCoaCode ? coa.code.toLowerCase().includes(filterCoaCode.toLowerCase()) : true;
                          const nameMatch = filterCoaName ? coa.name.toLowerCase().includes(filterCoaName.toLowerCase()) : true;
                          const catMatch = filterCoaCategory ? coa.category === filterCoaCategory : true;
                          const balMatch = filterCoaNormalBalance ? coa.normal_balance === filterCoaNormalBalance : true;
                          return codeMatch && nameMatch && catMatch && balMatch;
                        });
                        
                        if (filtered.length === 0) {
                          return <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Pencarian tidak ditemukan.</td></tr>;
                        }

                        return filtered.map(coa => (
                          <tr key={coa.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', animation: 'fadeIn 0.2s' }}>
                            <td style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 800, fontFamily: 'monospace' }}>{coa.code}</td>
                            <td style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 600 }}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span>{coa.name}</span>
                                {coa.description && <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 400 }}>{coa.description}</span>}
                              </div>
                            </td>
                            <td style={{ padding: '8px 16px', fontSize: '13px' }}>
                              <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px' }}>{coa.category}</span>
                            </td>
                            <td style={{ padding: '8px 16px', fontSize: '13px' }}>
                              <span style={{ background: coa.normal_balance === 'Kredit' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: coa.normal_balance === 'Kredit' ? '#ef4444' : '#10b981', padding: '4px 8px', borderRadius: '6px', fontWeight: 800 }}>{coa.normal_balance || 'Debit'}</span>
                            </td>
                            <td style={{ padding: '8px 16px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <button onClick={() => {
                                  setEditingCoa(coa);
                                  setNewCoaCode(coa.code);
                                  setNewCoaName(coa.name);
                                  setNewCoaCategory(coa.category);
                                  setNewCoaNormalBalance(coa.normal_balance || 'Debit');
                                  setNewCoaDescription(coa.description || '');
                                  setIsCoaModalOpen(true);
                                }} style={{ background: 'transparent', border: '1px solid #cca334', color: '#cca334', padding: '4px 10px', fontSize: '13px', borderRadius: '6px', cursor: 'pointer' }}>Edit</button>
                                <button onClick={() => handleDeleteCoa(coa.id)} style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '4px 10px', fontSize: '13px', borderRadius: '6px', cursor: 'pointer' }}>Hapus</button>
                              </div>
                            </td>
                          </tr>
                        ));
                      })()
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {isCoaModalOpen && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, animation: 'fadeIn 0.2s' }}>
              <div style={{ background: 'var(--bg-card)', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '600px', border: '1px solid var(--border-primary)', position: 'relative' }}>
                <button onClick={() => setIsCoaModalOpen(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '24px', cursor: 'pointer' }}>×</button>
                <h2 style={{ color: 'var(--gold-intense)', margin: '0 0 24px 0' }}>{editingCoa ? 'Edit Akun COA' : 'Tambah Akun COA Baru'}</h2>
                <form onSubmit={handleSaveCoa}>
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>Kode Akun</label>
                      <input required type="text" value={newCoaCode} onChange={e => setNewCoaCode(e.target.value)} placeholder="Contoh: 110101" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-primary)', background: 'var(--bg-page)', color: 'var(--text-primary)' }} />
                    </div>
                    <div style={{ flex: 2 }}>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>Nama Akun</label>
                      <input required type="text" value={newCoaName} onChange={e => setNewCoaName(e.target.value)} placeholder="Contoh: Kas Brankas" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-primary)', background: 'var(--bg-page)', color: 'var(--text-primary)' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>Kategori</label>
                      <select required value={newCoaCategory} onChange={e => setNewCoaCategory(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-primary)', background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
                        <option value="Aset">Aset</option>
                        <option value="Liabilitas">Liabilitas</option>
                        <option value="Ekuitas">Ekuitas</option>
                        <option value="Pendapatan">Pendapatan</option>
                        <option value="Beban">Beban</option>
                        <option value="Kontra-Aset">Kontra-Aset</option>
                        <option value="Dana Syirkah">Dana Syirkah</option>
                        <option value="Bagi Hasil">Bagi Hasil</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>Saldo Normal</label>
                      <select required value={newCoaNormalBalance} onChange={e => setNewCoaNormalBalance(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-primary)', background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
                        <option value="Debit">Debit</option>
                        <option value="Kredit">Kredit</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>Keterangan / Deskripsi</label>
                    <textarea value={newCoaDescription} onChange={e => setNewCoaDescription(e.target.value)} placeholder="Penjelasan mengenai akun ini..." style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-primary)', background: 'var(--bg-page)', color: 'var(--text-primary)', minHeight: '80px', resize: 'vertical' }} />
                  </div>
                  <button type="submit" disabled={isSavingCoa} style={{ width: '100%', padding: '14px', background: '#cca334', border: 'none', borderRadius: '10px', color: '#02130e', fontWeight: 800, cursor: 'pointer' }}>
                    {isSavingCoa ? 'Menyimpan...' : 'Simpan Akun COA'}
                  </button>
                </form>
              </div>
            </div>
          )}
`;

if (!content.includes('📋 Log Audit Sistem')) {
  // Insert before the closing tags of the main content area
  // We can just append it before `</div>` at the very end of the component, or exactly where activeTab blocks are.
  const marker = "{activeTab === 'ai_knowledge' && (";
  content = content.replace(marker, panelsInjection + "\n\n          " + marker);
}

fs.writeFileSync('src/app/dashboard/page.tsx', content);
console.log('SUPER RECOVERY SCRIPT EXECUTED');
