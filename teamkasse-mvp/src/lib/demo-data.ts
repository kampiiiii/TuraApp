import type { AppData, CatalogItem, LedgerEntry, MemberBalance, Team, TeamMember } from "@/lib/types";

const team: Team = {
  id: "demo-team",
  name: "FC Beispiel",
  currency: "EUR",
  bank_account_holder: "FC Beispiel Mannschaftskasse",
  bank_iban: "DE02120300000000202051",
  bank_bic: "BYLADEM1001"
};

const members: TeamMember[] = [
  {
    id: "demo-admin",
    team_id: team.id,
    user_id: "demo-user",
    display_name: "Max Kassenwart",
    jersey_number: 1,
    role: "admin",
    active: true
  },
  {
    id: "demo-timo",
    team_id: team.id,
    user_id: null,
    display_name: "Timo Stuermer",
    jersey_number: 9,
    role: "player",
    active: true
  },
  {
    id: "demo-leon",
    team_id: team.id,
    user_id: null,
    display_name: "Leon Abwehr",
    jersey_number: 4,
    role: "player",
    active: true
  }
];

const catalog: CatalogItem[] = [
  {
    id: "demo-fine-late",
    team_id: team.id,
    type: "fine",
    name: "Zu spaet zum Training",
    description: "Bis 15 Minuten",
    amount_cents: 500,
    active: true
  },
  {
    id: "demo-fine-kit",
    team_id: team.id,
    type: "fine",
    name: "Material vergessen",
    description: "Schuhe, Schienbeinschoner oder Leibchen",
    amount_cents: 300,
    active: true
  },
  {
    id: "demo-drink-beer",
    team_id: team.id,
    type: "drink",
    name: "Bier",
    description: "Flasche",
    amount_cents: 250,
    active: true
  },
  {
    id: "demo-drink-water",
    team_id: team.id,
    type: "drink",
    name: "Wasser",
    description: "Flasche",
    amount_cents: 120,
    active: true
  }
];

const ledger: LedgerEntry[] = [
  {
    id: "demo-ledger-1",
    team_id: team.id,
    member_id: "demo-timo",
    member_name: "Timo Stuermer",
    catalog_item_id: "demo-fine-late",
    catalog_item_name: "Zu spaet zum Training",
    type: "fine",
    description: "Zu spaet zum Training",
    quantity: 1,
    unit_amount_cents: 500,
    total_amount_cents: 500,
    status: "open",
    booking_date: "2026-08-12",
    notes: "Training Mittwoch",
    correction_of: null,
    void_reason: null,
    created_at: "2026-08-12T18:10:00Z"
  },
  {
    id: "demo-ledger-2",
    team_id: team.id,
    member_id: "demo-timo",
    member_name: "Timo Stuermer",
    catalog_item_id: "demo-drink-beer",
    catalog_item_name: "Bier",
    type: "drink",
    description: "Bier",
    quantity: 3,
    unit_amount_cents: 250,
    total_amount_cents: 750,
    status: "open",
    booking_date: "2026-08-14",
    notes: null,
    correction_of: null,
    void_reason: null,
    created_at: "2026-08-14T21:00:00Z"
  },
  {
    id: "demo-ledger-3",
    team_id: team.id,
    member_id: "demo-leon",
    member_name: "Leon Abwehr",
    catalog_item_id: null,
    catalog_item_name: null,
    type: "payment",
    description: "Zahlung erhalten",
    quantity: 1,
    unit_amount_cents: -1000,
    total_amount_cents: -1000,
    status: "paid",
    booking_date: "2026-08-15",
    notes: "Bar",
    correction_of: null,
    void_reason: null,
    created_at: "2026-08-15T19:00:00Z"
  }
];

const balances: MemberBalance[] = members
  .filter((member) => member.role === "player")
  .map((member) => {
    const entries = ledger.filter((entry) => entry.member_id === member.id && entry.status !== "voided");
    const sum = (predicate: (entry: LedgerEntry) => boolean) =>
      entries.filter(predicate).reduce((total, entry) => total + entry.total_amount_cents, 0);

    return {
      team_id: team.id,
      member_id: member.id,
      display_name: member.display_name,
      fine_cents: sum((entry) => entry.type === "fine"),
      drink_cents: sum((entry) => entry.type === "drink"),
      adjustment_cents: sum((entry) => entry.type === "adjustment"),
      payment_cents: -sum((entry) => entry.type === "payment"),
      open_charge_cents: entries
        .filter((entry) => entry.status === "open" && entry.type !== "payment")
        .reduce((total, entry) => total + entry.total_amount_cents, 0),
      balance_cents: sum(() => true)
    };
  });

export const demoData: AppData = {
  isDemo: true,
  authState: "demo",
  team,
  currentMember: members[0],
  members,
  catalog,
  ledger,
  balances
};
