import type { LedgerEntry } from "@/lib/types";

export function accountStatement(entries: LedgerEntry[], memberId: string, from: string, to: string, showVoided = false) {
  const all = entries.filter((entry) => entry.member_id === memberId);
  const movement = (entry: LedgerEntry) => entry.status === "voided" ? 0 : entry.total_amount_cents;
  const opening = all.filter((entry) => entry.booking_date < from).reduce((sum, entry) => sum + movement(entry), 0);
  let balance = opening;
  const rows = all.filter((entry) => entry.booking_date >= from && entry.booking_date <= to && (showVoided || entry.status !== "voided"))
    .sort((left, right) => left.booking_date.localeCompare(right.booking_date) || left.created_at.localeCompare(right.created_at) || left.id.localeCompare(right.id))
    .map((entry) => { const amount = movement(entry); balance += amount; return { entry, amount, balance }; });
  const charges = rows.reduce((sum, row) => sum + Math.max(0, row.amount), 0);
  const credits = rows.reduce((sum, row) => sum + Math.max(0, -row.amount), 0);
  return { opening, closing: balance, charges, credits, rows };
}
