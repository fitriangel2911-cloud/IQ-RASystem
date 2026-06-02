const fs = require('fs');

let content = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

content = content.replace(
  "const [newCoaCategory, setNewCoaCategory] = useState('Aset');",
  "const [newCoaCategory, setNewCoaCategory] = useState('Aset');\n  const [newCoaNormalBalance, setNewCoaNormalBalance] = useState('Debit');"
);

content = content.replace(
  "category: newCoaCategory\n    };",
  "category: newCoaCategory,\n      normal_balance: newCoaNormalBalance\n    };"
);

content = content.replace(
  "setNewCoaCategory('Aset');\n                      setIsCoaModalOpen(true);",
  "setNewCoaCategory('Aset');\n                      setNewCoaNormalBalance('Debit');\n                      setIsCoaModalOpen(true);"
);

content = content.replace(
  "setNewCoaCategory(coa.category);\n                              setIsCoaModalOpen(true);",
  "setNewCoaCategory(coa.category);\n                              setNewCoaNormalBalance(coa.normal_balance || 'Debit');\n                              setIsCoaModalOpen(true);"
);

content = content.replace(
  "<th style={{ textAlign: 'left', padding: '16px', borderBottom: '2px solid var(--border-primary)', color: 'var(--text-secondary)' }}>Kategori</th>\n                        <th style={{ textAlign: 'right', padding: '16px', borderBottom: '2px solid var(--border-primary)', color: 'var(--text-secondary)' }}>Aksi</th>",
  "<th style={{ textAlign: 'left', padding: '16px', borderBottom: '2px solid var(--border-primary)', color: 'var(--text-secondary)' }}>Kategori</th>\n                        <th style={{ textAlign: 'left', padding: '16px', borderBottom: '2px solid var(--border-primary)', color: 'var(--text-secondary)' }}>Saldo Normal</th>\n                        <th style={{ textAlign: 'right', padding: '16px', borderBottom: '2px solid var(--border-primary)', color: 'var(--text-secondary)' }}>Aksi</th>"
);

content = content.replace(
  "<td style={{ padding: '16px', borderBottom: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}>\n                          <span style={{ padding: '4px 10px', background: 'rgba(204, 163, 52, 0.1)', color: '#cca334', borderRadius: '6px', fontSize: '13px', fontWeight: 600 }}>{coa.category}</span>\n                        </td>\n                        <td style={{ padding: '16px', borderBottom: '1px solid var(--border-primary)', textAlign: 'right' }}>",
  "<td style={{ padding: '16px', borderBottom: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}>\n                          <span style={{ padding: '4px 10px', background: 'rgba(204, 163, 52, 0.1)', color: '#cca334', borderRadius: '6px', fontSize: '13px', fontWeight: 600 }}>{coa.category}</span>\n                        </td>\n                        <td style={{ padding: '16px', borderBottom: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}>\n                          <span style={{ padding: '4px 10px', background: coa.normal_balance === 'Kredit' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(4, 120, 87, 0.1)', color: coa.normal_balance === 'Kredit' ? '#ef4444' : '#10b981', borderRadius: '6px', fontSize: '13px', fontWeight: 600 }}>{coa.normal_balance || 'Debit'}</span>\n                        </td>\n                        <td style={{ padding: '16px', borderBottom: '1px solid var(--border-primary)', textAlign: 'right' }}>"
);

content = content.replace(
  "<option value=\"Bagi Hasil\">Bagi Hasil</option>\n                  </select>\n                </div>\n                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>",
  "<option value=\"Bagi Hasil\">Bagi Hasil</option>\n                  </select>\n                </div>\n                <div>\n                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-primary)', fontWeight: 600 }}>Saldo Normal</label>\n                  <select required value={newCoaNormalBalance} onChange={e => setNewCoaNormalBalance(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-primary)', background: 'var(--bg-page)', color: 'var(--text-primary)' }}>\n                    <option value=\"Debit\">Debit</option>\n                    <option value=\"Kredit\">Kredit</option>\n                  </select>\n                </div>\n                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>"
);

fs.writeFileSync('src/app/dashboard/page.tsx', content);
console.log('Patch applied successfully.');
