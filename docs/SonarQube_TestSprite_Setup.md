# PANDUAN INTEGRASI SONARQUBE & TESTSPRITE
**Proyek: IQ-RA System**

Dokumen ini menjelaskan langkah-langkah praktis untuk mengaktifkan pemindaian kualitas kode menggunakan **SonarCloud (SonarQube Cloud)** dan pengujian otomatis berbasis AI menggunakan **TestSprite** pada repositori GitHub Anda.

---

## BAGIAN 1: MENJALANKAN SONARCLOUD (SONARQUBE CLOUD)

Karena proyek Anda dideploy menggunakan Vercel dan Git, menggunakan **SonarCloud** (gratis untuk repositori publik) adalah metode termudah dan paling otomatis tanpa perlu menginstal server lokal di komputer Anda.

### Langkah 1: Hubungkan Repositori ke SonarCloud
1. Buka [SonarCloud.io](https://sonarcloud.io/) dan masuk menggunakan akun **GitHub** Anda.
2. Klik tombol **"+" (plus)** di pojok kanan atas lalu pilih **Analyze new project**.
3. Pilih organisasi GitHub Anda dan centang repositori `IQ-RASystem`, lalu klik **Set Up**.

### Langkah 2: Buat Token Akses SonarCloud
1. Di SonarCloud, buka akun Anda (klik avatar di kanan atas) -> **My Account** -> **Security**.
2. Di bagian **Generate Tokens**, masukkan nama (misalnya: `IQRA_GITHUB_TOKEN`), lalu klik **Generate**.
3. Salin token yang muncul (simpan sementara).

### Langkah 3: Masukkan Token ke GitHub Secrets
1. Buka repositori `IQ-RASystem` Anda di **GitHub**.
2. Pergi ke tab **Settings** -> **Secrets and variables** (di sidebar kiri) -> **Actions**.
3. Klik **New repository secret**.
4. Beri nama: `SONAR_TOKEN`.
5. Tempelkan token yang Anda salin dari SonarCloud tadi ke kolom nilai (value), lalu klik **Add secret**.

*Catatan: File konfigurasi `.github/workflows/sonar.yml` dan `sonar-project.properties` telah saya buat di proyek Anda. Setiap kali Anda melakukan `git push` ke branch `main`, GitHub Actions akan otomatis melakukan analisis kode dan mengirimkan hasilnya ke dashboard SonarCloud Anda.*

---

## BAGIAN 2: MENJALANKAN TESTSPRITE (AI-POWERED E2E TESTING)

TestSprite adalah penguji bertenaga AI yang tidak memerlukan instalasi script lokal yang rumit karena dijalankan langsung di server cloud TestSprite.

### Langkah 1: Hubungkan Proyek ke TestSprite
1. Kunjungi situs web resmi [TestSprite.com](https://testsprite.com/) dan masuk menggunakan akun **GitHub** Anda.
2. Hubungkan repositori `IQ-RASystem` Anda di platform TestSprite.
3. TestSprite akan memindai folder repositori Anda untuk memahami struktur kode (ia akan membaca file-file di folder `src` dan berkas kebutuhan sistem).

### Langkah 2: Menjalankan Pengujian Fungsional Pertama Anda
1. Di dasbor TestSprite, pilih proyek `IQ-RASystem`.
2. Klik **Create Test Journey** atau tombol buat pengujian baru.
3. Masukkan URL staging Vercel Anda (misalnya: `https://iq-ra-system-staging.vercel.app`) sebagai basis pengujian.
4. Tulis skenario pengujian dengan instruksi bahasa manusia sederhana pada kolom input yang tersedia.
   *   **Contoh Prompt Pengujian**:
       > *"Open the homepage, go to the login page. Login as Customer Service and go to the Deposit Verification tab. Find a pending deposit, click approve, and verify that the notification success modal pops up."*
5. Klik **Run Test**.

### Langkah 3: Memantau Hasil
*   AI TestSprite akan secara otomatis merumuskan Test Cases, menulis skrip Playwright di latar belakang, membuka browser virtual di cloud, dan mengeksekusi langkah-langkah di atas.
*   Anda akan disuguhi **laporan video pengujian** dan notifikasi jika ada bagian tombol atau alur yang patah (eror).
