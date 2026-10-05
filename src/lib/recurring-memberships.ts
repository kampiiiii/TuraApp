import type { RecurringPlan, TeamMember } from "@/lib/types";

export function berlinMonth(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Europe/Berlin", year: "numeric", month: "2-digit"
  }).formatToParts(date);
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}`;
}

export function nextMonth(month: string): string {
  const [year, number] = month.split("-").map(Number);
  return number === 12 ? `${year + 1}-01` : `${year}-${String(number + 1).padStart(2, "0")}`;
}

export function membershipAt(plan: RecurringPlan, month: string) {
  let selection = { applies_to_all: plan.applies_to_all, member_ids: plan.member_ids };
  let effectiveMonth = plan.start_month;
  // Later edits for the same month supersede the selection, but remain in the audit history.
  for (const change of plan.membership_changes ?? []) {
    if (change.effective_month <= month && change.effective_month >= effectiveMonth) {
      selection = change;
      effectiveMonth = change.effective_month;
    }
  }
  return selection;
}

export function addMembershipChange(
  plan: RecurringPlan,
  members: TeamMember[],
  input: { effectiveMonth: string; appliesToAll: boolean; memberIds: string[] },
  audit: { id: string; memberId: string; name: string; changedAt: string },
  currentMonth = berlinMonth()
) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(input.effectiveMonth) ||
      input.effectiveMonth < currentMonth || input.effectiveMonth < plan.start_month) {
    throw new Error("Bitte den aktuellen oder einen zukünftigen Monat ab Regelbeginn wählen.");
  }
  const validIds = new Set(members.filter((member) => member.active && member.role === "player").map((member) => member.id));
  const memberIds = Array.from(new Set(input.memberIds));
  if (!input.appliesToAll && memberIds.some((id) => !validIds.has(id))) {
    throw new Error("Die Spielerauswahl ist nicht mehr aktuell. Bitte erneut öffnen.");
  }
  const change = {
    id: audit.id, effective_month: input.effectiveMonth,
    applies_to_all: input.appliesToAll, member_ids: input.appliesToAll ? [] : memberIds,
    changed_at: audit.changedAt, changed_by_member_id: audit.memberId, changed_by_name: audit.name
  };
  plan.membership_changes = [...(plan.membership_changes ?? []), change];
  return change;
}
