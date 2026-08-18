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

export function calculateBalances(state: TeamState): MemberBalance[] {
  const balances = new Map<string, MemberBalance>();

  for (const member of state.members) {
    if (!member.active || member.role !== "player") {
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
    if (entry.status === "voided") {
      continue;
    }

    const balance = balances.get(entry.member_id);
    if (!balance) {
      continue;
    }

    if (entry.type === "fine") balance.fine_cents += entry.total_amount_cents;
    if (entry.type === "drink") balance.drink_cents += entry.total_amount_cents;
    if (entry.type === "adjustment") balance.adjustment_cents += entry.total_amount_cents;
    if (entry.type === "payment") balance.payment_cents -= entry.total_amount_cents;
    if (entry.status === "open" && entry.type !== "payment") {
      balance.open_charge_cents += entry.total_amount_cents;
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
    member_name: memberNames.get(entry.member_id) ?? "Unbekannt",
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
  return {
    version: state.version || 1,
    team: {
      ...state.team,
      currency: state.team.currency || "EUR"
    },
    members: state.members.map((member) => ({
      ...member,
      user_id: member.user_id ?? null,
      pin_hash: member.pin_hash ?? null,
      active: member.active !== false
    })),
    catalog: state.catalog.map((item) => ({
      ...item,
      active: item.active !== false
    })),
    ledger: state.ledger.map((entry) => ({
      ...entry,
      member_name: entry.member_name ?? "Unbekannt",
      catalog_item_name: entry.catalog_item_name ?? null,
      notes: entry.notes ?? null,
      source: entry.source === "player" ? "player" : "admin",
      created_by_member_id: entry.created_by_member_id ?? null,
      created_by_name: entry.created_by_name ?? null,
      correction_of: entry.correction_of ?? null,
      void_reason: entry.void_reason ?? null
    }))
  };
}

function useLocalFileStore() {
  return !process.env.NETLIFY_BLOBS_CONTEXT;
}
