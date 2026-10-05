import { parseEuroToCents } from "@/lib/money";
import type { LedgerEntry, StoredTeamMember, TeamState } from "@/lib/types";

export type TrainingRow = {
  id: string; memberId: string; type: "fine" | "drink"; catalogItemId: string;
  quantity: number; amount: string; description: string;
};

export function validBookingDate(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error("Bitte ein gültiges Buchungsdatum auswählen.");
  }
  return value;
}

export function makeTrainingEntries(state: TeamState, admin: StoredTeamMember,
  rows: TrainingRow[], date: string, notes: string, requestId: string, uuid: () => string, now: string): LedgerEntry[] {
  if (!Array.isArray(rows) || !rows.length || rows.length > 200) throw new Error("Bitte 1 bis 200 Positionen erfassen.");
  validBookingDate(date);
  return rows.map((row) => {
    if (!row || (row.type !== "fine" && row.type !== "drink")) throw new Error("Ungültige Buchungsart.");
    const member = state.members.find((candidate) => candidate.id === row.memberId && candidate.team_id === state.team.id && candidate.active && candidate.role === "player");
    if (!member) throw new Error("Ein ausgewählter Spieler ist nicht mehr verfügbar.");
    if (!Number.isInteger(row.quantity) || row.quantity < 1 || row.quantity > 50) throw new Error("Die Menge muss zwischen 1 und 50 liegen.");
    const item = row.catalogItemId ? state.catalog.find((candidate) => candidate.id === row.catalogItemId && candidate.team_id === state.team.id && candidate.type === row.type && candidate.active) : null;
    if (row.catalogItemId && !item) throw new Error("Eine Katalogposition ist nicht mehr verfügbar.");
    const enteredAmount = parseEuroToCents(String(row.amount ?? ""));
    if (item && enteredAmount !== item.amount_cents) throw new Error("Ein Katalogpreis wurde geändert. Bitte die Position neu hinzufügen.");
    const amount = item ? item.amount_cents : enteredAmount;
    const description = item?.name ?? String(row.description ?? "").trim();
    if (!description) throw new Error("Bitte einen Buchungsgrund angeben.");
    if (!Number.isSafeInteger(amount) || amount < 0 || amount > 100_000_000 || (!amount && !item?.in_kind_label)) throw new Error("Bitte einen gültigen Betrag eingeben.");
    return {
      id: uuid(), request_id: requestId, team_id: state.team.id,
      member_id: member.id, member_name: member.display_name, catalog_item_id: item?.id ?? null, catalog_item_name: item?.name ?? null,
      type: row.type, description, quantity: row.quantity, unit_amount_cents: amount, total_amount_cents: amount * row.quantity,
      settled_amount_cents: 0, status: "open", booking_date: date, notes: notes.trim() || null,
      in_kind_label: item?.in_kind_label ?? null, in_kind_completed_at: null,
      in_kind_completed_by_member_id: null, in_kind_completed_by_name: null, source: "admin",
      created_by_member_id: admin.id, created_by_name: admin.display_name,
      correction_of: null, recurring_plan_id: null, recurring_period: null,
      interest_for_entry_id: null, interest_period: null,
      void_reason: null, voided_at: null, voided_by_member_id: null, voided_by_name: null, created_at: now
    };
  });
}
