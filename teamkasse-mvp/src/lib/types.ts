export type AppRole = "admin" | "player";
export type CatalogType = "fine" | "drink";
export type LedgerType = "fine" | "drink" | "payment" | "adjustment";
export type LedgerStatus = "open" | "paid" | "voided";
export type AuthState = "demo" | "anonymous" | "member" | "no-team";

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

export type CatalogItem = {
  id: string;
  team_id: string;
  type: CatalogType;
  name: string;
  description: string | null;
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
  status: LedgerStatus;
  booking_date: string;
  notes: string | null;
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
  balance_cents: number;
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
};
