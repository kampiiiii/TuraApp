import { getStore } from "@netlify/blobs";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { demoData } from "@/lib/demo-data";
import type {
  CatalogItem,
  LedgerEntry,
  MemberBalance,
  StoredTeamMember,
  TeamState,
  TreasuryBookEntry,
  TreasuryData
} from "@/lib/types";

const STORE_NAME = "teamkasse";
const STATE_KEY = "state.json";
const LOCAL_STATE_PATH = join(process.cwd(), ".teamkasse", STATE_KEY);

export async function loadTeamState(): Promise<TeamState> {
  const stored = await readStoredState();

  if (stored) {
    const normalized = normalizeState(stored);
    if (applyRecurringCharges(normalized)) {
      await saveTeamState(normalized);
    }
    return normalized;
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
    ledger: demoData.ledger,
    treasury_entries: [],
    recurring_plans: [],
    suppressed_recurring_entries: []
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
      fee_cents: 0,
      interest_cents: 0,
      payment_cents: 0,
      open_charge_cents: 0,
      amount_due_cents: 0,
      credit_cents: 0,
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
        fee_cents: 0,
        interest_cents: 0,
        payment_cents: 0,
        open_charge_cents: 0,
        amount_due_cents: 0,
        credit_cents: 0,
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
    if (entry.type === "fee") balance.fee_cents += entry.total_amount_cents;
    if (entry.type === "interest") balance.interest_cents += entry.total_amount_cents;
    if (entry.type === "payment") balance.payment_cents -= entry.total_amount_cents;
    if (entry.type !== "payment" && entry.total_amount_cents > 0) {
      balance.open_charge_cents += Math.max(0, entry.total_amount_cents - entry.settled_amount_cents);
    }
    balance.balance_cents += entry.total_amount_cents;
  }

  return Array.from(balances.values()).map((balance) => ({
    ...balance,
    amount_due_cents: Math.max(0, balance.balance_cents),
    credit_cents: Math.max(0, -balance.balance_cents)
  }));
}

export function recurringSuppressionKey(entry: LedgerEntry): string | null {
  if (entry.type === "interest" && entry.interest_for_entry_id && entry.interest_period) {
    return `interest:${entry.interest_for_entry_id}:${entry.interest_period}`;
  }

  if (entry.recurring_plan_id && entry.recurring_period) {
    return `charge:${entry.recurring_plan_id}:${entry.member_id}:${entry.recurring_period}`;
  }

  return null;
}

export function applyRecurringCharges(state: TeamState, today = todayInBerlin()): boolean {
  let changed = false;
  const currentMonth = today.slice(0, 7);
  const generatedAt = new Date().toISOString();
  const memberNames = new Map(state.members.map((member) => [member.id, member.display_name]));

  for (const plan of state.recurring_plans.filter((candidate) => candidate.active)) {
    if (!isValidMonth(plan.start_month) || plan.start_month > currentMonth) {
      continue;
    }

    const assignedMembers = state.members.filter(
      (member) =>
        member.active &&
        member.role === "player" &&
        (plan.applies_to_all || plan.member_ids.includes(member.id))
    );

    for (const member of assignedMembers) {
      const memberStartMonth = plan.applies_to_all
        ? maxMonth(plan.start_month, member.joined_at.slice(0, 7))
        : plan.start_month;

      for (const period of monthPeriods(memberStartMonth, currentMonth)) {
        const dueDate = `${period}-${String(plan.due_day).padStart(2, "0")}`;
        if (dueDate > today) {
          continue;
        }

        const alreadyBooked = state.ledger.some(
          (entry) =>
            entry.recurring_plan_id === plan.id &&
            entry.recurring_period === period &&
            entry.member_id === member.id &&
            entry.type !== "interest"
        );
        const wasDeleted = state.suppressed_recurring_entries.includes(
          `charge:${plan.id}:${member.id}:${period}`
        );

        if (alreadyBooked || wasDeleted) {
          continue;
        }

        state.ledger.push({
          id: randomUUID(),
          team_id: state.team.id,
          member_id: member.id,
          member_name: member.display_name,
          catalog_item_id: null,
          catalog_item_name: null,
          type: plan.ledger_type,
          description: plan.name,
          quantity: 1,
          unit_amount_cents: plan.amount_cents,
          total_amount_cents: plan.amount_cents,
          settled_amount_cents: 0,
          status: "open",
          booking_date: dueDate,
          notes: `Automatische Monatsbuchung ${period}`,
          in_kind_label: null,
          in_kind_completed_at: null,
          in_kind_completed_by_member_id: null,
          in_kind_completed_by_name: null,
          source: "system",
          created_by_member_id: null,
          created_by_name: "Automatisch",
          correction_of: null,
          recurring_plan_id: plan.id,
          recurring_period: period,
          interest_for_entry_id: null,
          interest_period: null,
          void_reason: null,
          created_at: generatedAt
        });
        changed = true;
      }
    }
  }

  state.ledger = allocatePayments(state.ledger);

  const plansById = new Map(state.recurring_plans.map((plan) => [plan.id, plan]));
  const principals = state.ledger.filter(
    (entry) =>
      entry.status !== "voided" &&
      (entry.type === "fee" || entry.type === "drink") &&
      Boolean(entry.recurring_plan_id)
  );

  for (const principal of principals) {
    const plan = principal.recurring_plan_id ? plansById.get(principal.recurring_plan_id) : null;
    if (!plan || plan.annual_interest_rate_bps <= 0) {
      continue;
    }

    let checkpoint = addDays(principal.booking_date, plan.grace_days);
    let periodDays = plan.grace_days;
    let safetyCounter = 0;

    while (checkpoint <= today && safetyCounter < 120) {
      const alreadyBooked = state.ledger.some(
        (entry) =>
          entry.type === "interest" &&
          entry.interest_for_entry_id === principal.id &&
          entry.interest_period === checkpoint
      );
      const wasDeleted = state.suppressed_recurring_entries.includes(
        `interest:${principal.id}:${checkpoint}`
      );

      if (!alreadyBooked && !wasDeleted) {
        const historicalLedger = state.ledger.filter((entry) => entry.booking_date <= checkpoint);
        const historicalPrincipal = allocatePayments(historicalLedger).find((entry) => entry.id === principal.id);
        const remainingPrincipal = historicalPrincipal
          ? Math.max(0, historicalPrincipal.total_amount_cents - historicalPrincipal.settled_amount_cents)
          : 0;
        const interestCents = Math.round(
          remainingPrincipal * (plan.annual_interest_rate_bps / 10_000) * (periodDays / 365)
        );

        if (interestCents > 0) {
          state.ledger.push({
            id: randomUUID(),
            team_id: state.team.id,
            member_id: principal.member_id,
            member_name: memberNames.get(principal.member_id) ?? principal.member_name,
            catalog_item_id: null,
            catalog_item_name: null,
            type: "interest",
            description: `Zinsen: ${plan.name}`,
            quantity: 1,
            unit_amount_cents: interestCents,
            total_amount_cents: interestCents,
            settled_amount_cents: 0,
            status: "open",
            booking_date: checkpoint,
            notes: `${(plan.annual_interest_rate_bps / 100).toLocaleString("de-DE")} % p.a. auf offenen Betrag`,
            in_kind_label: null,
            in_kind_completed_at: null,
            in_kind_completed_by_member_id: null,
            in_kind_completed_by_name: null,
            source: "system",
            created_by_member_id: null,
            created_by_name: "Automatisch",
            correction_of: null,
            recurring_plan_id: plan.id,
            recurring_period: principal.recurring_period,
            interest_for_entry_id: principal.id,
            interest_period: checkpoint,
            void_reason: null,
            created_at: generatedAt
          });
          changed = true;
        }
      }

      checkpoint = addDays(checkpoint, 30);
      periodDays = 30;
      safetyCounter += 1;
    }
  }

  state.ledger = allocatePayments(state.ledger);
  return changed;
}

function monthPeriods(startMonth: string, endMonth: string) {
  const [startYear, startMonthNumber] = startMonth.split("-").map(Number);
  const [endYear, endMonthNumber] = endMonth.split("-").map(Number);
  const result: string[] = [];
  let year = startYear;
  let month = startMonthNumber;

  while ((year < endYear || (year === endYear && month <= endMonthNumber)) && result.length < 120) {
    result.push(`${year}-${String(month).padStart(2, "0")}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return result;
}

function isValidMonth(month: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return false;
  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  return year >= 2000 && monthNumber >= 1 && monthNumber <= 12;
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function maxMonth(left: string, right: string) {
  return left >= right ? left : right;
}

function todayInBerlin() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

export function calculateTreasury(state: TeamState): TreasuryData {
  const activeBalanceEntries = state.treasury_entries
    .filter((entry) => entry.status === "active" && entry.type === "balance")
    .sort((left, right) => right.created_at.localeCompare(left.created_at));
  const balanceEntry = activeBalanceEntries[0] ?? null;
  const isAfterBalance = (bookingDate: string, createdAt: string) =>
    !balanceEntry ||
    bookingDate > balanceEntry.booking_date ||
    (bookingDate === balanceEntry.booking_date && createdAt > balanceEntry.created_at);
  const memberNames = new Map(state.members.map((member) => [member.id, member.display_name]));

  const manualEntries: TreasuryBookEntry[] = state.treasury_entries.map((entry) => ({
    id: entry.id,
    type: entry.type,
    description: entry.description,
    member_name: null,
    amount_cents: entry.amount_cents,
    booking_date: entry.booking_date,
    notes: entry.notes,
    status: entry.status,
    source: "manual",
    included_in_balance:
      entry.status === "active" &&
      (entry.type === "balance"
        ? entry.id === balanceEntry?.id
        : isAfterBalance(entry.booking_date, entry.created_at)),
    created_at: entry.created_at
  }));

  const paymentEntries: TreasuryBookEntry[] = state.ledger
    .filter((entry) => entry.type === "payment")
    .map((entry) => ({
      id: entry.id,
      type: "player_payment",
      description: entry.description,
      member_name: memberNames.get(entry.member_id) ?? entry.member_name,
      amount_cents: Math.abs(entry.total_amount_cents),
      booking_date: entry.booking_date,
      notes: entry.notes,
      status: entry.status === "voided" ? "voided" : "active",
      source: "ledger",
      included_in_balance:
        entry.status !== "voided" && isAfterBalance(entry.booking_date, entry.created_at),
      created_at: entry.created_at
    }));

  const entries = [...manualEntries, ...paymentEntries].sort(
    (left, right) => right.created_at.localeCompare(left.created_at)
  );
  const includedEntries = entries.filter((entry) => entry.included_in_balance);
  const balanceSetCents = balanceEntry?.amount_cents ?? 0;
  const playerPaymentsCents = sumTreasuryEntries(includedEntries, "player_payment");
  const otherIncomeCents = sumTreasuryEntries(includedEntries, "income");
  const expensesCents = Math.abs(sumTreasuryEntries(includedEntries, "expense"));

  return {
    summary: {
      balance_set_cents: balanceSetCents,
      player_payments_cents: playerPaymentsCents,
      other_income_cents: otherIncomeCents,
      expenses_cents: expensesCents,
      current_balance_cents: balanceSetCents + playerPaymentsCents + otherIncomeCents - expensesCents,
      balance_set_at: balanceEntry?.created_at ?? null
    },
    entries
  };
}

function sumTreasuryEntries(entries: TreasuryBookEntry[], type: TreasuryBookEntry["type"]) {
  return entries
    .filter((entry) => entry.type === type)
    .reduce((total, entry) => total + entry.amount_cents, 0);
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
    source: entry.source === "player" ? "player" : entry.source === "system" ? "system" : "admin",
    created_by_member_id: entry.created_by_member_id ?? null,
    created_by_name:
      entry.created_by_name === "Max Kassenwart" ? "Dustyn Kassenwart" : entry.created_by_name ?? null,
    correction_of: entry.correction_of ?? null,
    recurring_plan_id: entry.recurring_plan_id ?? null,
    recurring_period: entry.recurring_period ?? null,
    interest_for_entry_id: entry.interest_for_entry_id ?? null,
    interest_period: entry.interest_period ?? null,
    void_reason: entry.void_reason ?? null
  }));

  return {
    version: Math.max(state.version || 1, 4),
    team: {
      ...state.team,
      currency: state.team.currency || "EUR"
    },
    members: state.members.map((member) => ({
      ...member,
      display_name: member.display_name === "Max Kassenwart" ? "Dustyn Kassenwart" : member.display_name,
      user_id: member.user_id ?? null,
      pin_hash: member.pin_hash ?? null,
      active: member.active !== false,
      joined_at: member.joined_at ?? "1970-01-01T00:00:00.000Z"
    })),
    catalog: state.catalog.map((item) => ({
      ...item,
      in_kind_label: item.in_kind_label ?? null,
      active: item.active !== false
    })),
    ledger: allocatePayments(normalizedLedger),
    treasury_entries: (state.treasury_entries ?? []).map((entry) => ({
      ...entry,
      notes: entry.notes ?? null,
      status: entry.status === "voided" ? "voided" : "active",
      created_by_member_id: entry.created_by_member_id ?? null,
      created_by_name: entry.created_by_name ?? null,
      void_reason: entry.void_reason ?? null
    })),
    recurring_plans: (state.recurring_plans ?? []).map((plan) => ({
      ...plan,
      ledger_type: plan.ledger_type === "drink" ? "drink" : "fee",
      due_day: Math.min(28, Math.max(1, plan.due_day || 1)),
      applies_to_all: plan.applies_to_all === true,
      member_ids: Array.isArray(plan.member_ids) ? plan.member_ids : [],
      annual_interest_rate_bps: Math.max(0, plan.annual_interest_rate_bps || 0),
      grace_days: Math.max(1, plan.grace_days || 30),
      active: plan.active !== false,
      created_by_member_id: plan.created_by_member_id ?? null,
      created_by_name: plan.created_by_name ?? null
    })),
    suppressed_recurring_entries: Array.isArray(state.suppressed_recurring_entries)
      ? state.suppressed_recurring_entries
      : []
  };
}

function useLocalFileStore() {
  return !process.env.NETLIFY_BLOBS_CONTEXT;
}
