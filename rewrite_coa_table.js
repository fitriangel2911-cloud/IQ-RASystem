const fs = require('fs');

let content = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// 1. Add coaSearchQuery state if not exists
if (!content.includes('const [coaSearchQuery, setCoaSearchQuery]')) {
  content = content.replace(
    "const [newCoaDescription, setNewCoaDescription] = useState('');",
    "const [newCoaDescription, setNewCoaDescription] = useState('');\n  const [coaSearchQuery, setCoaSearchQuery] = useState('');"
  );
}

// 2. Replace the description and table header area to add search bar
const descPattern = /<p style=\{\{ color: 'var\(--text-secondary\)', lineHeight: 1\.6, marginBottom: '24px' \}\}>Daftar pos-pos akuntansi standar SAK EP yang ditarik secara dinamis dari tabel <code>coa_accounts<\/code>\.<\/p>/;
const newDesc = `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>Daftar pos-pos akuntansi standar SAK EP yang ditarik secara dinamis dari tabel <code>coa_accounts</code>.</p>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
                  <input 
                    type="text" 
                    placeholder="Cari kode, nama, atau kategori..." 
                    value={coaSearchQuery}
                    onChange={(e) => setCoaSearchQuery(e.target.value)}
                    style={{ padding: '10px 16px 10px 40px', borderRadius: '10px', border: '1px solid var(--border-primary)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', width: '300px' }}
                  />
                </div>
              </div>`;
content = content.replace(descPattern, newDesc);

// 3. Replace the table body with grouped map
const tableBodyStart = content.indexOf('<tbody>');
const tableBodyEnd = content.indexOf('</tbody>', tableBodyStart) + 8;

const originalTbody = content.substring(tableBodyStart, tableBodyEnd);

const newTbody = `<tbody>
                    {loadingCoa ? (
                      <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center' }}>Memuat COA...</td></tr>
                    ) : coaAccounts.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Belum ada data COA.</td></tr>
                    ) : (
                      (() => {
                        const filtered = coaAccounts.filter(coa => 
                          coa.code.toLowerCase().includes(coaSearchQuery.toLowerCase()) || 
                          coa.name.toLowerCase().includes(coaSearchQuery.toLowerCase()) || 
                          coa.category.toLowerCase().includes(coaSearchQuery.toLowerCase())
                        );
                        
                        if (filtered.length === 0) {
                          return <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Pencarian tidak ditemukan.</td></tr>;
                        }

                        const grouped = filtered.reduce((acc, coa) => {
                          if (!acc[coa.category]) acc[coa.category] = [];
                          acc[coa.category].push(coa);
                          return acc;
                        }, {});

                        return Object.keys(grouped).map(category => (
                          <React.Fragment key={category}>
                            <tr style={{ background: 'rgba(204, 163, 52, 0.15)', borderBottom: '2px solid rgba(204, 163, 52, 0.3)' }}>
                              <td colSpan={5} style={{ padding: '12px 16px', fontWeight: 900, color: '#cca334', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                📁 KATEGORI: {category} ({grouped[category].length} Akun)
                              </td>
                            </tr>
                            {grouped[category].map(coa => (
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
                                    <button onClick={() => handleDeleteCoa(coa.id, coa.code)} style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '4px 10px', fontSize: '13px', borderRadius: '6px', cursor: 'pointer' }}>Hapus</button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ));
                      })()
                    )}
                  </tbody>`;

content = content.substring(0, tableBodyStart) + newTbody + content.substring(tableBodyEnd);

fs.writeFileSync('src/app/dashboard/page.tsx', content);
console.log('Grouped COA table applied successfully.');
