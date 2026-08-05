export type Role = "owner" | "contributor" | "viewer";

export type InterestType = "flat";

export type LoanStatus = "open" | "repaid" | "defaulted" | "cancelled";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  highlight_color: string;
  receives_admin_fee: boolean;
  created_at: string;
}

export interface Borrower {
  id: string;
  name: string;
  contact_info: string;
  notes: string;
  created_by: string;
  created_at: string;
}

export interface Loan {
  id: string;
  borrower_id: string;
  principal: number;
  interest_rate_percent: number;
  interest_type: InterestType;
  date_issued: string;
  due_date: string | null;
  term_description: string;
  status: LoanStatus;
  created_by: string;
  created_at: string;
}

export interface LoanContribution {
  id: string;
  loan_id: string;
  friend_id: string;
  amount: number;
  created_at: string;
}

export interface Payment {
  id: string;
  loan_id: string;
  amount: number;
  date_received: string;
  note: string;
  created_by: string;
  created_at: string;
}
