/**
 * Chart of Accounts (COA) for Sharia Cooperative
 * Compliant with SAK EP and PSAK Syariah (401-407)
 */
export const COA = {
  // ASSETS (1xx)
  CASH_ON_HAND: "101.01",
  CASH_IN_BANK: "101.02",
  RECEIVABLE_MURABAHAH: "102.01",
  RECEIVABLE_QARDH: "102.02",
  
  // LIABILITIES (2xx)
  SAVINGS_WADIAH: "201.01",
  SAVINGS_MUDHARABAH: "201.02",
  SAVINGS_HAJI: "201.03",
  SAVINGS_UMRAH: "201.04",
  
  // EQUITY (3xx)
  MEMBER_CAPITAL_PRINCIPAL: "301.01", // Simpanan Pokok
  MEMBER_CAPITAL_MANDATORY: "301.02", // Simpanan Wajib
  RETAINED_EARNINGS: "302.01",
  
  // REVENUE (4xx)
  INCOME_MURABAHAH_MARGIN: "401.01",
  INCOME_SERVICE_FEE: "401.02",
  
  // EXPENSES (5xx)
  EXPENSE_OPERATIONAL: "501.01",
  EXPENSE_PROFIT_SHARING: "501.02", // Bagi Hasil
};

export type AccountCode = keyof typeof COA;
