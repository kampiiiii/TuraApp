export type AppRole = "admin" | "player";
export type CatalogType = "fine" | "drink";
export type LedgerType = "fine" | "drink" | "payment" | "adjustment";
export type LedgerStatus = "open" | "partial" | "paid" | "voided";
export type BookingSource = "admin" | "player";
export type AuthState = "setup-required" | "anonymous" | "member" | "no-team";
export type TreasuryEntryType = "balance" | "income" | "expense";
export type TreasuryEntryStatus = "active" | "voided";

export type Team = {
  id: string;
  name: string;
  currency: string;
  bank_account_holder: string | null;
  bank_iban: string | null;
  bank_bic: string | null;
};

export type TeamMember = {
  id: string;
  team_id: string;
  user_id: string | null;
  display_name: string;
  jersey_number: number | null;
  role: AppRole;
  active: boolean;
};

export type StoredTeamMember = TeamMember & {
  pin_hash: string | null;
};

export type CatalogItem = {
  id: string;
  team_id: string;
  type: CatalogType;
  name: string;
  description: string | null;
  in_kind_label: string | null;
  amount_cents: number;
  active: boolean;
};

export type LedgerEntry = {
  id: string;
  team_id: string;
  member_id: string;
  member_name: string;
  catalog_item_id: string | null;
  catalog_item_name: string | null;
  type: LedgerType;
  description: string;
  quantity: number;
  unit_amount_cents: number;
  total_amount_cents: number;
  settled_amount_cents: number;
  status: LedgerStatus;
  booking_date: string;
  notes: string | null;
  in_kind_label: string | null;
  in_kind_completed_at: string | null;
  in_kind_completed_by_member_id: string | null;
  in_kind_completed_by_name: string | null;
  source: BookingSource;
  created_by_member_id: string | null;
  created_by_name: string | null;
  correction_of: string | null;
  void_reason: string | null;
  created_at: string;
};

export type MemberBalance = {
  team_id: string;
  member_id: string;
  display_name: string;
  fine_cents: number;
  drink_cents: number;
  adjustment_cents: number;
  payment_cents: number;
  open_charge_cents: number;
  amount_due_cents: number;
  credit_cents: number;
  balance_cents: number;
};

export type TreasuryEntry = {
  id: string;
  team_id: string;
  type: TreasuryEntryType;
  description: string;
  amount_cents: number;
  booking_date: string;
  notes: string | null;
  status: TreasuryEntryStatus;
  created_by_member_id: string | null;
  created_by_name: string | null;
  void_reason: string | null;
  created_at: string;
};

export type TreasuryBookEntry = {
  id: string;
  type: TreasuryEntryType | "player_payment";
  description: string;
  member_name: string | null;
  amount_cents: number;
  booking_date: string;
  notes: string | null;
  status: TreasuryEntryStatus;
  source: "manual" | "ledger";
  included_in_balance: boolean;
  created_at: string;
};

export type TreasurySummary = {
  balance_set_cents: number;
  player_payments_cents: number;
  other_income_cents: number;
  expenses_cents: number;
  current_balance_cents: number;
  balance_set_at: string | null;
};

export type TreasuryData = {
  summary: TreasurySummary;
  entries: TreasuryBookEntry[];
};

export type AppData = {
  isDemo: boolean;
  authState: AuthState;
  team: Team | null;
  currentMember: TeamMember | null;
  members: TeamMember[];
  catalog: CatalogItem[];
  ledger: LedgerEntry[];
  balances: MemberBalance[];
  treasury: TreasuryData;
};

export type TeamState = {
  version: number;
  team: Team;
  members: StoredTeamMember[];
  catalog: CatalogItem[];
  ledger: LedgerEntry[];
  treasury_entries: TreasuryEntry[];
};
