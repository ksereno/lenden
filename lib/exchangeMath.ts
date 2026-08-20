import type {
  ExchangeCapitalDeposit,
  ExchangeTransaction,
  ExchangeTransactionShare,
  PoolTransfer,
  Profile,
} from "@/lib/types";

/**
 * The service fee for a given transaction amount, same schedule regardless
 * of cash-in or cash-out. Each full ₱1,000 crossed adds a flat ₱20; the
 * remainder after the last full ₱1,000 is looked up in the same 3-tier
 * table used for amounts under ₱1,000.
 */
export function computeTieredFee(amount: number): number {
  if (amount <= 0) return 0;
  const thousands = Math.floor((amount - 1) / 1000);
  const remainder = amount - thousands * 1000;
  const base = thousands * 20;
  const tier = remainder <= 299 ? 10 : remainder <= 599 ? 15 : 20;
  return base + tier;
}

/** The fee IS the profit -- there's no separate physical/digital-diff calc. */
export function computeProfit(tx: ExchangeTransaction): number {
  return tx.fee;
}

/** Physical/digital legs are derived, never stored. */
export function physicalAmount(tx: ExchangeTransaction): number {
  return tx.type === "cash_in" ? tx.amount + tx.fee : tx.amount;
}

export function digitalAmount(tx: ExchangeTransaction): number {
  return tx.type === "cash_in" ? tx.amount : tx.amount + tx.fee;
}

/** Flat cut to whoever has profiles.receives_exchange_fee -- mirrors
 * ADMIN_FEE_RATE/adminFee, but this is one of TWO independent cuts. */
export const EXCHANGE_FEE_RATE = 0.1;
export function exchangeFee(tx: ExchangeTransaction): number {
  return computeProfit(tx) * EXCHANGE_FEE_RATE;
}

/** "Tita A": external, non-group recipient of the second flat cut. No
 * profiles row is possible (profiles.id FKs to auth.users) -- just a
 * hardcoded label + rate, her running total is a derived aggregate over
 * all transactions. */
export const TITA_A_LABEL = "Tita A";
export const TITA_A_FEE_RATE = 0.1;
export function titaAFee(tx: ExchangeTransaction): number {
  return computeProfit(tx) * TITA_A_FEE_RATE;
}

/** What's left after both flat cuts -- splits equally (pool) or by manual
 * entry (individual) among the 5 friends. */
export function distributableProfit(tx: ExchangeTransaction): number {
  return computeProfit(tx) - exchangeFee(tx) - titaAFee(tx);
}

export interface ExchangeFriendShare {
  friendId: string;
  profitShare: number;
}

/**
 * Per-friend profit breakdown for one transaction, after both flat cuts.
 *
 * Pool-funded: distributableProfit splits equally across `coreFriends`,
 * regardless of any share rows.
 *
 * Individual-funded: read directly off exchange_transaction_shares --
 * fully manual entry, not derived proportionally from any amount.
 */
export function exchangeFriendShares(
  tx: ExchangeTransaction,
  shares: ExchangeTransactionShare[],
  coreFriends: Profile[] = [],
): ExchangeFriendShare[] {
  if (tx.funding_source === "pool") {
    if (coreFriends.length === 0) return [];
    const equalShare = distributableProfit(tx) / coreFriends.length;
    return coreFriends.map((f) => ({ friendId: f.id, profitShare: equalShare }));
  }

  return shares.map((s) => ({ friendId: s.friend_id, profitShare: s.profit_share }));
}

export interface ExchangePoolBalance {
  physicalBalance: number;
  digitalBalance: number;
  /** Accumulated fees from pool-funded transactions, plus any deposit
   * logged with source 'other_income' (e.g. mobile load top-up margins) --
   * money the business actually earned, as opposed to capital friends
   * contributed. The amount used to fund a cash-in/cash-out just cycles
   * between physical and digital form; it's never retained on its own. */
  profit: number;
  /** profit + net capital deposited/transferred in -- always equals
   * physicalBalance + digitalBalance, computed once here so the two figures
   * can never drift apart. This is "the pool" in the sense people mean when
   * they ask what LendenX actually has. */
  totalAvailable: number;
}

/**
 * LendenX's own physical/digital balances -- a separate capital pool from
 * Lenden's lending pool. Only pool-funded, non-cancelled transactions move
 * these; individual-funded ones are the friends' own outside money and
 * never touch LendenX's balances.
 */
export function exchangePoolBalance(
  transactions: ExchangeTransaction[],
  capitalDeposits: ExchangeCapitalDeposit[],
  transfers: PoolTransfer[],
): ExchangePoolBalance {
  let physicalBalance = 0;
  let digitalBalance = 0;
  let profit = 0;

  for (const d of capitalDeposits) {
    if (d.balance_type === "physical") physicalBalance += d.amount;
    else digitalBalance += d.amount;
    if (d.source === "other_income") profit += d.amount;
  }

  for (const t of transfers) {
    if (t.direction === "lending_to_exchange_physical") physicalBalance += t.amount;
    else if (t.direction === "exchange_physical_to_lending") physicalBalance -= t.amount;
    else if (t.direction === "lending_to_exchange_digital") digitalBalance += t.amount;
    else if (t.direction === "exchange_digital_to_lending") digitalBalance -= t.amount;
  }

  for (const tx of transactions) {
    if (tx.status === "cancelled" || tx.funding_source !== "pool") continue;
    if (tx.type === "cash_in") {
      physicalBalance += physicalAmount(tx);
      digitalBalance -= digitalAmount(tx);
    } else {
      digitalBalance += digitalAmount(tx);
      physicalBalance -= physicalAmount(tx);
    }
    profit += tx.fee;
  }

  return { physicalBalance, digitalBalance, profit, totalAvailable: physicalBalance + digitalBalance };
}
