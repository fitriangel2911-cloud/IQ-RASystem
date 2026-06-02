const fs = require('fs');

let content = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// 1. Add description and normal_balance to state
content = content.replace(
  /const \[newCoaCategory, setNewCoaCategory\] = useState\('Aset'\);/,
  "const [newCoaCategory, setNewCoaCategory] = useState('Aset');\n  const [newCoaNormalBalance, setNewCoaNormalBalance] = useState('Debit');\n  const [newCoaDescription, setNewCoaDescription] = useState('');"
);

// 2. Add to payload
content = content.replace(
  /code:\s*newCoaCode,\s*name:\s*newCoaName,\s*category:\s*newCoaCategory\s*\};/,
  "code: newCoaCode,\n      name: newCoaName,\n      category: newCoaCategory,\n      normal_balance: newCoaNormalBalance,\n      description: newCoaDescription\n    };"
);

// 3. Add to Tambah Akun COA Baru button
content = content.replace(
  /setNewCoaCategory\('Aset'\);\s*setNewCoaNormalBalance\('Debit'\);\s*setIsCoaModalOpen\(true\);/,
  "setNewCoaCategory('Aset');\n                    setNewCoaNormalBalance('Debit');\n                    setNewCoaDescription('');\n                    setIsCoaModalOpen(true);"
);
// Fallback if previous patch failed
content = content.replace(
  /setNewCoaCategory\('Aset'\);\s*setIsCoaModalOpen\(true\);/,
  "setNewCoaCategory('Aset');\n                    setNewCoaNormalBalance('Debit');\n                    setNewCoaDescription('');\n                    setIsCoaModalOpen(true);"
);

// 4. Add to Edit button
content = content.replace(
  /setNewCoaCategory\(coa\.category\);\s*setNewCoaNormalBalance\(coa\.normal_balance \|\| 'Debit'\);\s*setIsCoaModalOpen\(true\);/,
  "setNewCoaCategory(coa.category);\n                            setNewCoaNormalBalance(coa.normal_balance || 'Debit');\n                            setNewCoaDescription(coa.description || '');\n                            setIsCoaModalOpen(true);"
);
// Fallback if previous patch failed
content = content.replace(
  /setNewCoaCategory\(coa\.category\);\s*setIsCoaModalOpen\(true\);/,
  "setNewCoaCategory(coa.category);\n                            setNewCoaNormalBalance(coa.normal_balance || 'Debit');\n                            setNewCoaDescription(coa.description || '');\n                            setIsCoaModalOpen(true);"
);

// 5. Form fields
// We add "Saldo Normal" and "Keterangan" select and textarea after Kategori
const formPattern = /<option value="Bagi Hasil">Bagi Hasil<\/option>\s*<\/select>\s*<\/div>\s*<div style=\{\{\s*display:\s*'flex',\s*gap:\s*'10px',\s*marginTop:\s*'10px'\s*\}\}>/;
content = content.replace(
  formPattern,
  `<option value="Bagi Hasil">Bagi Hasil</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-primary)', fontWeight: 600 }}>Saldo Normal</label>
                  <select required value={newCoaNormalBalance} onChange={e => setNewCoaNormalBalance(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-primary)', background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
                    <option value="Debit">Debit</option>
                    <option value="Kredit">Kredit</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-primary)', fontWeight: 600 }}>Keterangan / Deskripsi</label>
                  <textarea value={newCoaDescription} onChange={e => setNewCoaDescription(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-primary)', background: 'var(--bg-page)', color: 'var(--text-primary)', minHeight: '80px', resize: 'vertical' }} placeholder="Penjelasan mengenai akun ini..." />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>`
);
// If it was already patched with Saldo Normal, replace after Saldo Normal
const formPattern2 = /<option value="Kredit">Kredit<\/option>\s*<\/select>\s*<\/div>\s*<div style=\{\{\s*display:\s*'flex',\s*gap:\s*'10px',\s*marginTop:\s*'10px'\s*\}\}>/;
content = content.replace(
  formPattern2,
  `<option value="Kredit">Kredit</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-primary)', fontWeight: 600 }}>Keterangan / Deskripsi</label>
                  <textarea value={newCoaDescription} onChange={e => setNewCoaDescription(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-primary)', background: 'var(--bg-page)', color: 'var(--text-primary)', minHeight: '80px', resize: 'vertical' }} placeholder="Penjelasan mengenai akun ini..." />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>`
);


// Ensure Table Headers have Saldo Normal (if they don't already)
const thPattern = /<th style=\{\{ padding: '1\dpx 16px', textAlign: 'left', fontWeight: 900, color: '#cca334' \}\}>KATEGORI<\/th>\s*<th style=\{\{ padding: '1\dpx 16px', textAlign: 'right', fontWeight: 900, color: '#cca334' \}\}>AKSI<\/th>/;
content = content.replace(
  thPattern,
  `<th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 900, color: '#cca334' }}>KATEGORI</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 900, color: '#cca334' }}>SALDO NORMAL</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 900, color: '#cca334' }}>AKSI</th>`
);
const thPatternOld = /<th style=\{\{ padding: '16px', textAlign: 'left', fontWeight: 900, color: '#cca334' \}\}>KATEGORI<\/th>\s*<th style=\{\{ padding: '16px', textAlign: 'right', fontWeight: 900, color: '#cca334' \}\}>AKSI<\/th>/;
content = content.replace(
  thPatternOld,
  `<th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 900, color: '#cca334' }}>KATEGORI</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 900, color: '#cca334' }}>SALDO NORMAL</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 900, color: '#cca334' }}>AKSI</th>`
);

// Fix table rows compactness
const tdPattern = /<td style=\{\{ padding: '16px', fontSize: '15px', fontWeight: 800, fontFamily: 'monospace' \}\}>\{coa\.code\}<\/td>\s*<td style=\{\{ padding: '16px', fontSize: '15px', fontWeight: 600 \}\}>\{coa\.name\}<\/td>\s*<td style=\{\{ padding: '16px', fontSize: '14px' \}\}>\s*<span style=\{\{ background: 'rgba\(255,255,255,0\.1\)', padding: '4px 10px', borderRadius: '6px' \}\}>\{coa\.category\}<\/span>\s*<\/td>\s*<td style=\{\{ padding: '16px', textAlign: 'right' \}\}>/;
content = content.replace(
  tdPattern,
  `<td style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 800, fontFamily: 'monospace' }}>{coa.code}</td>
                        <td style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 600 }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span>{coa.name}</span>
                            {coa.description && <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{coa.description}</span>}
                          </div>
                        </td>
                        <td style={{ padding: '8px 16px', fontSize: '13px' }}>
                          <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px' }}>{coa.category}</span>
                        </td>
                        <td style={{ padding: '8px 16px', fontSize: '13px' }}>
                          <span style={{ background: coa.normal_balance === 'Kredit' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: coa.normal_balance === 'Kredit' ? '#ef4444' : '#10b981', padding: '4px 8px', borderRadius: '6px', fontWeight: 800 }}>{coa.normal_balance || 'Debit'}</span>
                        </td>
                        <td style={{ padding: '8px 16px', textAlign: 'right' }}>`
);

// Ensure Edit/Delete are side-by-side if they aren't
const btnPattern = /<button onClick=\{\(\) => \{\s*setEditingCoa\(coa\);[\s\S]*?setIsCoaModalOpen\(true\);\s*\}\} style=\{\{ background: 'transparent', border: '1px solid #cca334', color: '#cca334', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', marginRight: '8px' \}\}>Edit<\/button>\s*<button onClick=\{\(\) => handleDeleteCoa\(coa\.id, coa\.code\)\} style=\{\{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' \}\}>Hapus<\/button>/;
content = content.replace(
  btnPattern,
  `<div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
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
                          </div>`
);

// If the padding was already replaced to 8px 16px but we just need to add description to name td:
const tdPattern2 = /<td style=\{\{ padding: '8px 16px', fontSize: '14px', fontWeight: 600 \}\}>\{coa\.name\}<\/td>/;
content = content.replace(
  tdPattern2,
  `<td style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 600 }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span>{coa.name}</span>
                            {coa.description && <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 400 }}>{coa.description}</span>}
                          </div>
                        </td>`
);

fs.writeFileSync('src/app/dashboard/page.tsx', content);
console.log('Done modifying page.tsx');
