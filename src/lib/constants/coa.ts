/**
 * Chart of Accounts (COA) for Sharia Cooperative
 * Compliant with SAK EP and PSAK Syariah
 * Maps directly to 'coa_accounts' table codes in database.
 */
export const COA = {
  // ASSETS (1xx)
  CASH_ON_HAND: "110102",             // Kas Teller
  CASH_IN_BANK: "110201",             // Giro Bank A
  RECEIVABLE_MURABAHAH: "140001",     // Piutang Murabahah Anggota
  RECEIVABLE_QARDH: "170001",         // Pembiayaan Mudharabah/Qardh Anggota (Mudharabah in DB seed)
  
  // LIABILITIES / DANA SYIRKAH (2xx / 3xx)
  SAVINGS_WADIAH: "230001",           // Simpanan Wadiah Anggota
  SAVINGS_MUDHARABAH: "310001",       // Simpanan Mudharabah Anggota (Dana Syirkah)
  SAVINGS_HAJI: "302020",             // Simpanan Haji Khusus (Dana Syirkah Temporer)
  SAVINGS_UMRAH: "302030",            // Simpanan Umrah (Dana Syirkah Temporer)
  ZISWAF: "220002",                   // Titipan ZISWAF
  DANA_KEBAJIKAN: "220003",           // Titipan Dana Sosial / Non-Halal / Dana Kebajikan
  
  // EQUITY (4xx)
  MEMBER_CAPITAL_PRINCIPAL: "400001", // Simpanan Pokok
  MEMBER_CAPITAL_MANDATORY: "400002", // Simpanan Wajib
  RETAINED_EARNINGS: "400009",        // SHU Tahun Berjalan (mapped as Retained Earnings equivalent)
  
  // REVENUE (5xx)
  INCOME_MURABAHAH_MARGIN: "510001",  // Pendapatan Murabahah - Margin
  INCOME_SERVICE_FEE: "520001",       // Pendapatan Administrasi Pembiayaan
  
  // EXPENSES (6xx / 7xx)
  EXPENSE_OPERATIONAL: "730001",      // Beban Listrik dan Air / Beban Umum
  EXPENSE_PROFIT_SHARING: "600001",   // Bagi Hasil Simpanan Mudharabah
};

export type AccountCode = keyof typeof COA;
