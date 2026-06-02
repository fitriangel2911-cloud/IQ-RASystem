# Supabase Tables Mapping

Berikut ini adalah daftar tabel Supabase yang ditemukan di kode proyek beserta lokasi file yang menggunakannya. Daftar ini di‑generate oleh skrip `scripts/scan_supabase_tables.js` dan disimpan di `supabase/tables_map.json`.

| Tabel | Lokasi Kode (sample) |
|-------|----------------------|
| users | `src/app/accounting/page.tsx:36`, `src/app/ao/page.tsx:36`, `src/app/api/admin/parameters/route.ts:21`, ... |
| system_parameters | `src/app/api/admin/parameters/route.ts:37`, `src/app/api/admin/parameters/route.ts:90`, `src/app/dashboard/page.tsx:173`, ... |
| financing_contracts | `src/app/api/ai/audit-contract/route.ts:21`, `src/app/api/financing/approve/route.ts:17`, `src/app/api/financing/disburse/route.ts:17`, ... |
| prospects | `src/app/api/ai/audit-contract/route.ts:34`, `src/app/api/financing/approve/route.ts:26`, ... |
| sharia_knowledge | `src/app/api/ai/audit-contract/route.ts:76`, `src/app/api/ai/debug-knowledge/route.ts:11`, ... |
| audit_logs | `src/app/dashboard/page.tsx:132`, `src/app/dashboard/page.tsx:148` |
| coa_accounts | `src/app/dashboard/page.tsx:156`, `src/app/dashboard/page.tsx:185`, `src/app/dashboard/page.tsx:220`, ... |
| system_tasks | `src/app/dashboard/page.tsx:164`, `src/app/dashboard/page.tsx:271` |
| access_rules | `src/app/dashboard/page.tsx:186`, `src/app/dashboard/page.tsx:415` |
| members | `src/app/dashboard/page.tsx:381`, `src/app/dashboard/page.tsx:387`, `src/app/dashboard/page.tsx:528`, ... |
| journal_entries | `src/components/dashboard/AccountingDashboard.tsx:89`, `src/components/dashboard/DPSDashboard.tsx:156`, ... |
| savings_accounts | `src/components/dashboard/CSDashboard.tsx:28`, `src/components/dashboard/CSDashboard.tsx:225`, ... |
| savings_transactions | `src/components/dashboard/CSDashboard.tsx:308`, `src/components/dashboard/teller/Panel2Member.tsx:94`, ... |
| teller_shifts | `src/components/dashboard/teller/Panel6Shift.tsx:54`, `src/components/dashboard/teller/Panel6Shift.tsx:69`, ... |
| notifications | *Tidak ada referensi di kode (tabel baru untuk notifikasi UI)* |

> **Catatan**: Tabel `notifications` ditambahkan secara manual pada migrasi `20260603000000_add_notifications_table.sql` untuk menampung notifikasi pengguna.

File ini dapat dipelihara secara berkala dengan menjalankan kembali `node scripts/scan_supabase_tables.js`.
