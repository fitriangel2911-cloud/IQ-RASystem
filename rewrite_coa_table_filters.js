const fs = require('fs');

let content = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// 1. Remove old coaSearchQuery and replace with new column filters
content = content.replace(
  "const [coaSearchQuery, setCoaSearchQuery] = useState('');",
  "const [filterCoaCode, setFilterCoaCode] = useState('');\n  const [filterCoaName, setFilterCoaName] = useState('');\n  const [filterCoaCategory, setFilterCoaCategory] = useState('');\n  const [filterCoaNormalBalance, setFilterCoaNormalBalance] = useState('');"
);

// 2. Remove the global search bar
const descPattern = /<div style=\{\{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' \}\}>[\s\S]*?<\/div>\s*<\/div>/;
const newDesc = `<p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>Daftar pos-pos akuntansi standar SAK EP yang ditarik secara dinamis dari tabel <code>coa_accounts</code>. Gunakan filter di setiap kolom untuk mencari data.</p>`;
content = content.replace(descPattern, newDesc);

// 3. Replace the <thead>
const theadStart = content.indexOf('<thead>');
const theadEnd = content.indexOf('</thead>') + 8;
const newThead = `<thead>
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
                  </thead>`;
content = content.substring(0, theadStart) + newThead + content.substring(theadEnd);

// 4. Update the filter logic
const oldFilterStart = content.indexOf('const filtered = coaAccounts.filter(coa =>');
const oldFilterEnd = content.indexOf(');', oldFilterStart) + 2;

const newFilter = `const filtered = coaAccounts.filter(coa => {
                          const codeMatch = filterCoaCode ? coa.code.toLowerCase().includes(filterCoaCode.toLowerCase()) : true;
                          const nameMatch = filterCoaName ? coa.name.toLowerCase().includes(filterCoaName.toLowerCase()) : true;
                          const catMatch = filterCoaCategory ? coa.category === filterCoaCategory : true;
                          const balMatch = filterCoaNormalBalance ? coa.normal_balance === filterCoaNormalBalance : true;
                          return codeMatch && nameMatch && catMatch && balMatch;
                        });`;

content = content.substring(0, oldFilterStart) + newFilter + content.substring(oldFilterEnd);

fs.writeFileSync('src/app/dashboard/page.tsx', content);
console.log('Column filters added successfully.');
