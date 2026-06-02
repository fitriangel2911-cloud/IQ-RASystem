const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'dashboard', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add states
if (!content.includes('isSidebarOpen')) {
  content = content.replace(
    'const [loading, setLoading] = useState(true);',
    `const [loading, setLoading] = useState(true);\n  const [isSidebarOpen, setIsSidebarOpen] = useState(true);\n  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);\n  const [isDarkMode, setIsDarkMode] = useState(true);`
  );
}

// 2. Reduce DashboardMenuButton padding
content = content.replace(
  /padding: '15px 18px'/g,
  `padding: '10px 14px'`
).replace(
  /fontSize: '15px',(\s+)cursor: 'pointer',/g,
  `fontSize: '14px',$1cursor: 'pointer',`
);

// 3. Extract Identity Card and Remove from Sidebar
const identityCardStart = content.indexOf('{/* Admin Identity Card */}');
const identityCardEnd = content.indexOf('{/* Sidebar Nav */}');

// 4. Extract Sidebar Foot Action and Remove
const footerActionStart = content.indexOf('{/* Sidebar Footer Action */}');
const footerActionEnd = content.indexOf('</aside>');

// 5. Replace Sidebar Brand with new layout
const brandStart = content.indexOf('{/* Sidebar Brand */}');
const brandEnd = identityCardStart;

const newBrand = `          {/* Sidebar Brand */}
          <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ marginTop: '-10px' }}>
                <BrandLogo size={50} fontSize="22px" />
              </div>
              <div style={{ fontSize: '11px', color: '#f3c653', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '4px', marginLeft: '62px' }}>IT Administrator</div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '20px', cursor: 'pointer', padding: '4px' }}>✖</button>
          </div>
`;

// 6. Sidebar Nav replacement (Flattened)
const navStart = content.indexOf('{/* Sidebar Nav */}');
const navEnd = footerActionStart;

const newNav = `          {/* Sidebar Nav */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexGrow: 1, overflowY: 'auto', paddingRight: '4px' }}>
            
            <div style={{ fontSize: '11px', color: '#f3c653', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', paddingLeft: '14px', marginBottom: '4px', marginTop: '10px' }}>CORE BANKING</div>
            
            <DashboardMenuButton active={activeTab === 'overview'} onClick={() => { setActiveTab('overview'); setActiveSubMenu('overview'); }} icon="📊" label="Ringkasan Eksekutif" />

            <DashboardMenuButton active={activeTab === 'cs' && activeSubMenu === 'onboarding'} onClick={() => { setActiveTab('cs'); setActiveSubMenu('onboarding'); }} icon="🎧" label="Pendaftaran Anggota (CIF)" />
            <DashboardMenuButton active={activeTab === 'cs' && activeSubMenu === 'members'} onClick={() => { setActiveTab('cs'); setActiveSubMenu('members'); }} icon="📁" label="Database Anggota Aktif" />

            <DashboardMenuButton active={activeTab === 'teller'} onClick={() => { setActiveTab('teller'); setActiveSubMenu('overview'); }} icon="🏪" label="Layanan Kasir / Teller" />

            <DashboardMenuButton active={activeTab === 'ao' && activeSubMenu === 'overview'} onClick={() => { setActiveTab('ao'); setActiveSubMenu('overview'); }} icon="🤝" label="Pipeline Nasabah" />
            <DashboardMenuButton active={activeTab === 'ao' && activeSubMenu === 'prospects'} onClick={() => { setActiveTab('ao'); setActiveSubMenu('prospects'); }} icon="📋" label="Analisis Akad & AI" />
            <DashboardMenuButton active={activeTab === 'ao' && activeSubMenu === 'survey'} onClick={() => { setActiveTab('ao'); setActiveSubMenu('survey'); }} icon="📍" label="Verifikasi Lapangan" />

            <DashboardMenuButton active={activeTab === 'accounting' && activeSubMenu === 'journal'} onClick={() => { setActiveTab('accounting'); setActiveSubMenu('journal'); }} icon="💼" label="Jurnal Umum Otomatis" />
            <DashboardMenuButton active={activeTab === 'accounting' && activeSubMenu === 'ledger'} onClick={() => { setActiveTab('accounting'); setActiveSubMenu('ledger'); }} icon="📓" label="Buku Besar & Neraca" />
            <DashboardMenuButton active={activeTab === 'accounting' && activeSubMenu === 'reports'} onClick={() => { setActiveTab('accounting'); setActiveSubMenu('reports'); }} icon="📈" label="Laporan SAK EP" />

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '12px 0' }} />
            
            <div style={{ fontSize: '11px', color: '#f3c653', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', paddingLeft: '14px', marginBottom: '4px' }}>PENGAWASAN & OTO</div>

            <DashboardMenuButton active={activeTab === 'manager'} onClick={() => { setActiveTab('manager'); setActiveSubMenu('overview'); }} icon="🏢" label="Otorisasi Manager" />
            
            <DashboardMenuButton active={activeTab === 'dps' && activeSubMenu === 'overview'} onClick={() => { setActiveTab('dps'); setActiveSubMenu('overview'); }} icon="🕌" label="Ringkasan Kepatuhan" />
            <DashboardMenuButton active={activeTab === 'dps' && activeSubMenu === 'audit'} onClick={() => { setActiveTab('dps'); setActiveSubMenu('audit'); }} icon="🔍" label="Audit Akad Pembiayaan" />
            <DashboardMenuButton active={activeTab === 'dps' && activeSubMenu === 'products'} onClick={() => { setActiveTab('dps'); setActiveSubMenu('products'); }} icon="🏷️" label="Reviu Produk Baru" />
            <DashboardMenuButton active={activeTab === 'dps' && activeSubMenu === 'purification'} onClick={() => { setActiveTab('dps'); setActiveSubMenu('purification'); }} icon="💧" label="Pembersihan Dana (ZISWAF)" />
            <DashboardMenuButton active={activeTab === 'dps' && activeSubMenu === 'report'} onClick={() => { setActiveTab('dps'); setActiveSubMenu('report'); }} icon="📑" label="Cetak Laporan LHPS" />
            <DashboardMenuButton active={activeTab === 'dps' && activeSubMenu === 'rag'} onClick={() => { setActiveTab('dps'); setActiveSubMenu('rag'); }} icon="🤖" label="Ingesti Basis Data RAG" />

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '12px 0' }} />
            
            <div style={{ fontSize: '11px', color: '#f3c653', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', paddingLeft: '14px', marginBottom: '4px' }}>KECERDASAN BUATAN</div>
            <DashboardMenuButton active={activeTab === 'ai_knowledge'} onClick={() => { setActiveTab('ai_knowledge'); setActiveSubMenu('overview'); }} icon="🧠" label="Knowledge Base (RAG)" />

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '12px 0' }} />

            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', paddingLeft: '14px', marginBottom: '4px' }}>ADMINISTRASI IT</div>
            
            <DashboardMenuButton active={activeTab === 'users'} onClick={() => { setActiveTab('users'); setActiveSubMenu('overview'); }} icon="👥" label="Manajemen User" />
            <DashboardMenuButton active={activeTab === 'rules'} onClick={() => { setActiveTab('rules'); setActiveSubMenu('overview'); }} icon="🛡️" label="Aturan Akses (RBAC)" />
            <DashboardMenuButton active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setActiveSubMenu('overview'); }} icon="🛠️" label="Konfigurasi Sistem" />
            <DashboardMenuButton active={activeTab === 'audit_logs'} onClick={() => { setActiveTab('audit_logs'); setActiveSubMenu('overview'); }} icon="📋" label="Log Audit Keamanan" />
            <DashboardMenuButton active={activeTab === 'coa'} onClick={() => { setActiveTab('coa'); setActiveSubMenu('overview'); }} icon="📒" label="Manajemen COA" />
            <DashboardMenuButton active={activeTab === 'tasks'} onClick={() => { setActiveTab('tasks'); setActiveSubMenu('overview'); }} icon="✅" label="Penugasan Staf" />
            <DashboardMenuButton active={activeTab === 'diagnostics'} onClick={() => { setActiveTab('diagnostics'); setActiveSubMenu('overview'); }} icon="🩺" label="Diagnostik & Latensi" />
            <DashboardMenuButton active={activeTab === 'backup'} onClick={() => { setActiveTab('backup'); setActiveSubMenu('overview'); }} icon="📦" label="Pencadangan Data" />
          </nav>\n`;

const preBrand = content.substring(0, brandStart);
const postNav = content.substring(footerActionEnd);

let newSidebar = preBrand + newBrand + newNav;

// Now handle isSidebarOpen wrapping
newSidebar = newSidebar.replace(
  /<aside style=\{\{([\s\S]*?)padding: '36px 24px',([\s\S]*?)boxShadow: '8px 0 25px rgba\(0,0,0,0\.5\)'/m,
  `{isSidebarOpen && (<aside style={{$1padding: '24px 18px',$2boxShadow: '8px 0 25px rgba(0,0,0,0.5)'`
);
newSidebar = newSidebar.replace(
  '        </aside>\n\n        {/* 2. MAIN CONTENT AREA: Crystal Clear High Contrast */}',
  '        </aside>)}\n\n        {/* 2. MAIN CONTENT AREA: Crystal Clear High Contrast */}'
);

// Now handle Header
const headerStart = newSidebar.indexOf('<header style={{ display: \'flex\', justifyContent: \'space-between\', alignItems: \'center\', marginBottom: \'44px\' }}>');
const headerEnd = newSidebar.indexOf('</header>');
const headerBlock = newSidebar.substring(headerStart, headerEnd + 9);

const newHeaderBlock = headerBlock.replace(
  `            <div style={{ background: '#022b1c', border: '2px solid #34d399', borderRadius: '30px', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 800, color: '#34d399', boxShadow: '0 4px 15px rgba(52, 211, 153, 0.2)' }}>
              <div style={{ width: '10px', height: '10px', background: '#34d399', borderRadius: '50%', boxShadow: '0 0 10px #34d399' }} />
              DATABASE SEHAT (LIVE)
            </div>`,
  `            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ background: '#022b1c', border: '2px solid #34d399', borderRadius: '30px', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 800, color: '#34d399', boxShadow: '0 4px 15px rgba(52, 211, 153, 0.2)' }}>
                <div style={{ width: '10px', height: '10px', background: '#34d399', borderRadius: '50%', boxShadow: '0 0 10px #34d399' }} />
                DATABASE SEHAT (LIVE)
              </div>
              
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                style={{ background: 'transparent', border: 'none', color: '#f3c653', fontSize: '24px', cursor: 'pointer' }}
              >
                {isDarkMode ? '🌙' : '☀️'}
              </button>

              <div style={{ position: 'relative' }}>
                <div 
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(243, 198, 83, 0.2)',
                    borderRadius: '30px', padding: '8px 16px 8px 8px', display: 'flex', alignItems: 'center', gap: '10px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f3c653', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 900, color: '#02130e' }}>
                    {profile?.full_name ? profile.full_name.charAt(0) : 'A'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '14px', color: '#ffffff' }}>{profile?.full_name}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>{profile?.role?.toUpperCase()}</div>
                  </div>
                </div>

                {isProfileMenuOpen && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '10px', background: '#032419', border: '1px solid rgba(243, 198, 83, 0.3)', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 15px 35px rgba(0,0,0,0.5)', zIndex: 100, minWidth: '180px' }}>
                    <button style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '14px 20px', color: '#fff', fontSize: '13px', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>✏️ Edit Profil</button>
                    <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '14px 20px', color: '#ef4444', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>🔌 Keluar</button>
                  </div>
                )}
              </div>
            </div>`
);

newSidebar = newSidebar.replace(headerBlock, newHeaderBlock);

// Also add a menu trigger if sidebar is closed
newSidebar = newSidebar.replace(
  '<header style={{ display: \'flex\', justifyContent: \'space-between\', alignItems: \'center\', marginBottom: \'44px\' }}>',
  `<header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '44px' }}>
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} style={{ background: 'transparent', border: 'none', color: '#f3c653', fontSize: '24px', cursor: 'pointer', marginRight: '20px' }}>
                ☰
              </button>
            )}`
);

fs.writeFileSync(filePath, newSidebar, 'utf-8');
console.log('Successfully updated UI as requested!');
