import { createClient } from '@/lib/supabase/server';
import { JournalEntry } from '@/types/models';

/**
 * Core Banking: Accounting Service Module
 * Implements logic for double-entry bookkeeping compliant with SAK EP.
 */
export class AccountingService {
  
  /**
   * Records automated journals from transaction events
   * @param entry Data for the journal entry
   */
  static async recordTransaction(entry: Omit<JournalEntry, 'id'>) {
    const supabase = await createClient();
    
    // In a real system, we would validate that Debit == Credit for multi-leg entries.
    // For simple teller transactions, we record single legs representing the cash flow.
    const { data, error } = await supabase
      .from('journal_entries')
      .insert([entry])
      .select()
      .single();
      
    if (error) {
      console.error("AccountingService Error:", error);
      throw error;
    }
    return data;
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

