export type Role = "owner" | "contributor" | "viewer";

export type InterestType = "flat";

export type LoanStatus = "open" | "repaid" | "defaulted" | "cancelled";

export type FundingSource = "individual" | "pool";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  highlight_color: string;
  receives_admin_fee: boolean;
  receives_exchange_fee: boolean;
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
  funding_source: FundingSource;
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

export interface PoolDeposit {
  id: string;
  friend_id: string;
  amount: number;
  date: string;
  note: string;
  created_by: string;
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

export type ExchangeTransactionType = "cash_in" | "cash_out";
export type ExchangeTransactionStatus = "completed" | "cancelled";
export type BalanceType = "physical" | "digital";
export type PoolTransferDirection =
  | "lending_to_exchange_physical"
  | "lending_to_exchange_digital"
  | "exchange_physical_to_lending"
  | "exchange_digital_to_lending";

export interface ExchangeTransaction {
  id: string;
  type: ExchangeTransactionType;
  funding_source: FundingSource;
  amount: number;
  fee: number;
  fee_is_manual: boolean;
  counterparty_name: string;
  date: string;
  note: string;
  status: ExchangeTransactionStatus;
  created_by: string;
  created_at: string;
}

export interface ExchangeTransactionShare {
  id: string;
  transaction_id: string;
  friend_id: string;
  profit_share: number;
  created_at: string;
}

export interface ExchangeCapitalDeposit {
  id: string;
  friend_id: string;
  balance_type: BalanceType;
  amount: number;
  date: string;
  note: string;
  created_by: string;
  created_at: string;
}

export interface PoolTransfer {
  id: string;
  direction: PoolTransferDirection;
  amount: number;
  date: string;
  note: string;
  created_by: string;
  created_at: string;
}
