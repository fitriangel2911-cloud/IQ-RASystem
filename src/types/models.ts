/**
 * IQ-RA System Domain Models
 * Statically typed to enforce schema consistency as defined in doc/blueprint.md
 */

export type UserRole = 
  | "teller"
  | "customer_service"
  | "account_officer"
  | "manager"
  | "accounting"
  | "super_user"
  | "member";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  reference_no: string;
  description: string;
  debit: number;
  credit: number;
  account_code: string; // COA based on SAK EP / PSAK
  created_by: string;
}

export type ContractType = 
  | "murabahah"
  | "mudharabah"
  | "musyarakah"
  | "ijarah"
  | "istishna"
  | "qardhul_hasan";

export interface FinancingContract {
  id: string;
  member_id: string;
  type: ContractType;
  amount: number;
  tenor_months: number;
  margin_ratio: number; // For Murabahah
  profit_sharing_ratio?: number; // For Mudharabah/Musyarakah
  status: "pending" | "approved" | "active" | "completed" | "rejected";
  approved_by?: string;
}

export interface ShariaKnowledge {
  id: string;
  content: string; // Raw document chunk
  embedding: number[]; // Vector data (pgvector)
  metadata: {
    source: string; // e.g., "Fatwa DSN-MUI No. 04"
    category: "fatwa" | "sop" | "psak";
    page_number?: number;
  };
}

export interface RAGRecommendation {
  analysis_id: string;
  suggested_contract: ContractType;
  confidence_score: number; // Percentage 0-100
  rationale: string;
  additional_conditions: string[];
  references: string[];
}
