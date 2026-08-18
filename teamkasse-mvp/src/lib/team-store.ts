import { getStore } from "@netlify/blobs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { demoData } from "@/lib/demo-data";
import type { CatalogItem, LedgerEntry, MemberBalance, StoredTeamMember, TeamState } from "@/lib/types";

const STORE_NAME = "teamkasse";
const STATE_KEY = "state.json";
const LOCAL_STATE_PATH = join(process.cwd(), ".teamkasse", STATE_KEY);

export async function loadTeamState(): Promise<TeamState> {
  const stored = await readStoredState();

  if (stored) {
    return normalizeState(stored);
  }

  const initial = createInitialTeamState();
  await saveTeamState(initial);
  return initial;
}

export async function saveTeamState(state: TeamState) {
  const normalized = normalizeState(state);

  if (useLocalFileStore()) {
    await mkdir(join(process.cwd(), ".teamkasse"), { recursive: true });
    await writeFile(LOCAL_STATE_PATH, JSON.stringify(normalized, null, 2), "utf8");
    return;
  }

  const store = getStore(STORE_NAME);
  await store.setJSON(STATE_KEY, normalized);
}

export function createInitialTeamState(): TeamState {
  return normalizeState({
    version: 1,
    team: demoData.team!,
    members: demoData.members.map((member) => ({
      ...member,
      pin_hash: null
    })),
    catalog: demoData.catalog,
    ledger: demoData.ledger
  });
}

export function publicMembers(members: StoredTeamMember[]) {
  return members.map(({ pin_hash: _pinHash, ...member }) => member);
}

export function allocatePayments(ledger: LedgerEntry[]): LedgerEntry[] {
  const creditsByMember = new Map<string, number>();
  const allocated = ledger.map((entry) => ({ ...entry, settled_amount_cents: 0 }));

  for (const entry of allocated) {
    if (entry.status === "voided" || entry.total_amount_cents >= 0) {
      continue;
    }

    creditsByMember.set(
      entry.member_id,
      (creditsByMember.get(entry.member_id) ?? 0) + Math.abs(entry.total_amount_cents)
    );
    entry.status = "paid";
    entry.settled_amount_cents = Math.abs(entry.total_amount_cents);
  }

  const charges = allocated
    .filter((entry) => entry.status !== "voided" && entry.type !== "payment" && entry.total_amount_cents >= 0)
    .sort(
      (left, right) =>
        left.booking_date.localeCompare(right.booking_date) || left.created_at.localeCompare(right.created_at)
    );

  for (const entry of charges) {
    if (entry.total_amount_cents === 0) {
      entry.status = entry.in_kind_label && !entry.in_kind_completed_at ? "open" : "paid";
      continue;
    }

    const availableCredit = creditsByMember.get(entry.member_id) ?? 0;
    const settledAmount = Math.min(availableCredit, entry.total_amount_cents);

    entry.settled_amount_cents = settledAmount;
    entry.status =
      settledAmount >= entry.total_amount_cents ? "paid" : settledAmount > 0 ? "partial" : "open";
    creditsByMember.set(entry.member_id, availableCredit - settledAmount);
  }

  return allocated;
}

export function calculateBalances(state: TeamState, memberId?: string): MemberBalance[] {
  const balances = new Map<string, MemberBalance>();
  const membersById = new Map(state.members.map((member) => [member.id, member]));

  for (const member of state.members) {
    if (member.role !== "player" || (memberId && member.id !== memberId)) {
      continue;
    }

    balances.set(member.id, {
      team_id: state.team.id,
      member_id: member.id,
      display_name: member.display_name,
      fine_cents: 0,
      drink_cents: 0,
      adjustment_cents: 0,
      payment_cents: 0,
      open_charge_cents: 0,
      balance_cents: 0
    });
  }

  for (const entry of state.ledger) {
    if (entry.status === "voided" || (memberId && entry.member_id !== memberId)) {
      continue;
    }

    let balance = balances.get(entry.member_id);
    if (!balance && !memberId) {
      const storedMember = membersById.get(entry.member_id);
      balance = {
        team_id: state.team.id,
        member_id: entry.member_id,
        display_name: storedMember?.display_name ?? `${entry.member_name || "Unbekannt"} (geloescht)`,
        fine_cents: 0,
        drink_cents: 0,
        adjustment_cents: 0,
        payment_cents: 0,
        open_charge_cents: 0,
        balance_cents: 0
      };
      balances.set(entry.member_id, balance);
    }

    if (!balance) {
      continue;
    }

    if (entry.type === "fine") balance.fine_cents += entry.total_amount_cents;
    if (entry.type === "drink") balance.drink_cents += entry.total_amount_cents;
    if (entry.type === "adjustment") balance.adjustment_cents += entry.total_amount_cents;
    if (entry.type === "payment") balance.payment_cents -= entry.total_amount_cents;
    if (entry.type !== "payment" && entry.total_amount_cents > 0) {
      balance.open_charge_cents += Math.max(0, entry.total_amount_cents - entry.settled_amount_cents);
    }
    balance.balance_cents += entry.total_amount_cents;
  }

  return Array.from(balances.values());
}

export function attachLedgerNames(
  ledger: LedgerEntry[],
  members: StoredTeamMember[],
  catalog: CatalogItem[]
): LedgerEntry[] {
  const memberNames = new Map(members.map((member) => [member.id, member.display_name]));
  const catalogNames = new Map(catalog.map((item) => [item.id, item.name]));

  return ledger.map((entry) => ({
    ...entry,
    member_name: memberNames.get(entry.member_id) ?? entry.member_name ?? "Unbekannt",
    catalog_item_name: entry.catalog_item_id ? catalogNames.get(entry.catalog_item_id) ?? null : null
  }));
}

async function readStoredState(): Promise<TeamState | null> {
  try {
    if (useLocalFileStore()) {
      const raw = await readFile(LOCAL_STATE_PATH, "utf8");
      return JSON.parse(raw) as TeamState;
    }

    const store = getStore(STORE_NAME);
    return (await store.get(STATE_KEY, { type: "json" })) as TeamState | null;
  } catch {
    return null;
  }
}

function normalizeState(state: TeamState): TeamState {
  const normalizedLedger: LedgerEntry[] = state.ledger.map((entry) => ({
    ...entry,
    member_name: entry.member_name === "Max Kassenwart" ? "Dustyn Kassenwart" : entry.member_name ?? "Unbekannt",
    catalog_item_name: entry.catalog_item_name ?? null,
    notes: entry.notes ?? null,
    settled_amount_cents: entry.settled_amount_cents ?? 0,
    in_kind_label: entry.in_kind_label ?? null,
    in_kind_completed_at: entry.in_kind_completed_at ?? null,
    in_kind_completed_by_member_id: entry.in_kind_completed_by_member_id ?? null,
    in_kind_completed_by_name: entry.in_kind_completed_by_name ?? null,
    source: entry.source === "player" ? "player" : "admin",
    created_by_member_id: entry.created_by_member_id ?? null,
    created_by_name:
      entry.created_by_name === "Max Kassenwart" ? "Dustyn Kassenwart" : entry.created_by_name ?? null,
    correction_of: entry.correction_of ?? null,
    void_reason: entry.void_reason ?? null
  }));

  return {
    version: state.version || 1,
    team: {
      ...state.team,
      currency: state.team.currency || "EUR"
    },
    members: state.members.map((member) => ({
      ...member,
      display_name: member.display_name === "Max Kassenwart" ? "Dustyn Kassenwart" : member.display_name,
      user_id: member.user_id ?? null,
      pin_hash: member.pin_hash ?? null,
      active: member.active !== false
    })),
    catalog: state.catalog.map((item) => ({
      ...item,
      in_kind_label: item.in_kind_label ?? null,
      active: item.active !== false
    })),
    ledger: allocatePayments(normalizedLedger)
  };
}

function useLocalFileStore() {
  return !process.env.NETLIFY_BLOBS_CONTEXT;
}
