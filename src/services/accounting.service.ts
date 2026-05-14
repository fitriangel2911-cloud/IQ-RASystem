import { createClient } from '@/lib/supabase/server';
import { JournalEntry } from '@/types/models';

/**
 * Core Banking: Accounting Service Module
 * Implements logic for double-entry bookkeeping compliant with SAK EP.
 */
export class AccountingService {
  
  /**
   * Records automated journals from transaction events (supports Double-Entry)
   * @param data Object containing transaction metadata and entries array
   */
  static async recordTransaction(data: { date: string, description: string, reference_no: string, member_id?: string, entries: any[] }) {
    const supabase = await createClient();
    
    // Validate Double-Entry: Total Debit must equal Total Credit
    const totalDebit = data.entries.reduce((sum, e) => sum + (Number(e.debit) || 0), 0);
    const totalCredit = data.entries.reduce((sum, e) => sum + (Number(e.credit) || 0), 0);

    if (totalDebit !== totalCredit) {
      throw new Error(`Accounting Error: Debit (${totalDebit}) does not match Credit (${totalCredit}).`);
    }

    // Map entries to the database structure
    const dbEntries = data.entries.map(e => ({
      date: data.date,
      description: data.description,
      reference_no: data.reference_no,
      member_id: data.member_id,
      account_code: e.account_code,
      debit: e.debit,
      credit: e.credit
    }));

    const { data: result, error } = await supabase
      .from('journal_entries')
      .insert(dbEntries)
      .select();
      
    if (error) {
      console.error("AccountingService Error:", error);
      throw error;
    }
    return result;
  }

  /**
   * Fetches total balance for a specific account code
   */
  static async getAccountBalance(accountCode: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('journal_entries')
      .select('debit, credit')
      .eq('account_code', accountCode);
      
    if (error) throw error;
    
    return data.reduce((acc, curr) => acc + (Number(curr.debit) - Number(curr.credit)), 0);
  }

  /**
   * Generates Balance Sheet / Laporan Posisi Keuangan snapshot
   */
  static async getBalanceSheet(endDate: string) {
    // Implementation for Phase IV
    return { status: "PHASE_IV_PLANNED", endDate };
  }
}

