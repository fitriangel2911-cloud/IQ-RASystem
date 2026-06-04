import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // 1. Fetch all active contracts
    const { data: contracts, error: fetchError } = await supabaseAdmin
      .from('financing_contracts')
      .select('*')
      .eq('status', 'active');

    if (fetchError) {
      throw new Error(`Failed to fetch contracts: ${fetchError.message}`);
    }

    if (!contracts || contracts.length === 0) {
      return NextResponse.json({ success: true, message: 'No active contracts found', provisionedCount: 0 });
    }

    let provisionedCount = 0;
    let totalProvisionAmount = 0;
    const now = new Date();

    for (const contract of contracts) {
      // Simulate NPL check: For MVP, if contract is older than 90 days, consider it NPL.
      // In a real system, this would check the latest installment date.
      const contractDate = new Date(contract.created_at);
      const diffTime = Math.abs(now.getTime() - contractDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 90) {
        // Calculate CKPN (e.g., 100% of remaining balance for NPL > 90 days)
        // For MVP, we'll provision 100% of the original amount or a fixed percentage.
        const provisionAmount = Number(contract.amount) * 0.5; // 50% provision for simplicity
        
        // Create double-entry journal for CKPN
        // Debit: 710002 (Beban CKPN Murabahah)
        // Credit: 190002 (CKPN Piutang Murabahah (-))
        
        const journalEntries = [
          { account_code: '710002', debit: provisionAmount, credit: 0 },
          { account_code: '190002', debit: 0, credit: provisionAmount }
        ];

        // We use fetch to call the existing accounting/record-v2 API or just insert directly
        // Let's insert directly for admin
        const referenceNo = `NPL-${Date.now()}-${contract.id.substring(0, 4)}`;
        
        for (const entry of journalEntries) {
          await supabaseAdmin.from('journal_entries').insert([{
            date: new Date().toISOString().split('T')[0],
            reference_no: referenceNo,
            description: `[AUTO-PROVISIONING] CKPN Kontrak ${contract.id} (Overdue >90 hari)`,
            account_code: entry.account_code,
            debit: entry.debit,
            credit: entry.credit
          }]);
        }

        // Update contract status to 'npl'
        await supabaseAdmin
          .from('financing_contracts')
          .update({ status: 'npl' })
          .eq('id', contract.id);

        // Create a notification for the manager
        // (we could look up the manager, but we'll skip direct notification here or send to admin)

        provisionedCount++;
        totalProvisionAmount += provisionAmount;
      }
    }

    return NextResponse.json({ 
      success: true, 
      provisionedCount, 
      totalProvisionAmount,
      message: `Successfully provisioned ${provisionedCount} NPL contracts.`
    });

  } catch (error: any) {
    console.error("Auto-Provisioning Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
