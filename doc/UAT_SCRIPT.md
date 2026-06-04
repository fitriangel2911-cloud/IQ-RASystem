# User Acceptance Testing (UAT) Script
**Proyek:** IQ-RA System
**Tanggal:** [Diisi saat pengujian]
**Penguji:** [Nama Penguji]

---

## Skenario 1: Customer Service (CS)
**Goal:** Registrasi anggota baru & pembukaan rekening.

| No | Langkah Pengujian | Expected Result | Status | Catatan |
|----|-------------------|-----------------|--------|---------|
| 1.1 | Login sebagai Customer Service. | Berhasil masuk ke CS Dashboard. | [ ] | |
| 1.2 | Isi form registrasi (A-D) lengkap. | Form terisi tanpa error. | [ ] | |
| 1.3 | Centang opsi "Alamat Domisili Sama dengan KTP". | Alamat tersalin otomatis. | [ ] | |
| 1.4 | Klik "Daftar & Proses Registrasi". | Sukses. Muncul pop-up nota bukti registrasi. | [ ] | |
| 1.5 | Cek di tabel Database Anggota. | Anggota baru muncul dengan status 'active'. | [ ] | |

---

## Skenario 2: Account Officer (AO) & AI
**Goal:** Pengajuan pembiayaan & validasi AI.

| No | Langkah Pengujian | Expected Result | Status | Catatan |
|----|-------------------|-----------------|--------|---------|
| 2.1 | Login sebagai Account Officer. | Berhasil masuk ke AO Dashboard. | [ ] | |
| 2.2 | Cari anggota baru di Panel Prospek. | Nama anggota muncul di dropdown. | [ ] | |
| 2.3 | Input tujuan "Beli Motor untuk Usaha Ojek". | Form terisi. | [ ] | |
| 2.4 | Klik "Minta Analisis AI". | AI merespons dengan skor Murabahah tertinggi. | [ ] | |
| 2.5 | Submit pengajuan pembiayaan. | Status prospek menjadi "Menunggu Approval". | [ ] | |

---

## Skenario 3: Dewan Pengawas Syariah (DPS)
**Goal:** Audit akad pembiayaan.

| No | Langkah Pengujian | Expected Result | Status | Catatan |
|----|-------------------|-----------------|--------|---------|
| 3.1 | Login sebagai DPS. | Masuk ke DPS Dashboard. | [ ] | |
| 3.2 | Buka tab "Audit Pembiayaan". | Prospek dari AO muncul di antrian audit. | [ ] | |
| 3.3 | Lihat detail Split-Screen. | AI RAG context muncul memberikan opini. | [ ] | |
| 3.4 | Setujui audit (Checklist Rukun Akad). | Kontrak lolos audit DPS. | [ ] | |

---

## Skenario 4: Manager
**Goal:** Persetujuan akhir pencairan.

| No | Langkah Pengujian | Expected Result | Status | Catatan |
|----|-------------------|-----------------|--------|---------|
| 4.1 | Login sebagai Manager. | Masuk ke Manager Dashboard. | [ ] | |
| 4.2 | Lihat antrian "Menunggu Persetujuan". | Prospek yang lolos DPS muncul. | [ ] | |
| 4.3 | Klik "Setujui". | Status kontrak berubah menjadi "Disetujui" (Siap Cair). | [ ] | |

---

## Skenario 5: Teller
**Goal:** Pencairan dana & transaksi kasir.

| No | Langkah Pengujian | Expected Result | Status | Catatan |
|----|-------------------|-----------------|--------|---------|
| 5.1 | Login sebagai Teller. | Masuk ke Terminal Teller. | [ ] | |
| 5.2 | Buka Shift. Input saldo awal Rp 10.000.000. | Shift aktif, logo Hijau. | [ ] | |
| 5.3 | Buka Panel 7 (Pencairan / Disbursement). | Kontrak dari Manager muncul. | [ ] | |
| 5.4 | Cairkan dengan metode "Transfer ke Wadiah". | Dana cair, saldo Kas tetap, saldo Wadiah anggota bertambah. | [ ] | |
| 5.5 | Buka Panel 4 (Penarikan). Tarik Rp 50.000. | Saldo Wadiah berkurang, Kas fisik berkurang. | [ ] | |

---

## Skenario 6: Accounting
**Goal:** Verifikasi jurnal SAK EP otomatis.

| No | Langkah Pengujian | Expected Result | Status | Catatan |
|----|-------------------|-----------------|--------|---------|
| 6.1 | Login sebagai Accounting. | Masuk ke Accounting Dashboard. | [ ] | |
| 6.2 | Buka tab Buku Besar Jurnal Harian. | Jurnal registrasi, pencairan, dan penarikan tercatat otomatis (Double-entry seimbang). | [ ] | |
| 6.3 | Buka tab Neraca Keuangan. | Aset dan Liabilitas balance (Seimbang). | [ ] | |

---
**Tanda Tangan Penguji:** ____________________
