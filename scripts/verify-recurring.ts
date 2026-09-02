import assert from "node:assert/strict";
import { applyRecurringCharges, createInitialTeamState } from "../src/lib/team-store";
import type { LedgerEntry, RecurringPlan, TeamState } from "../src/lib/types";

const recurringState = emptyState();
const player = recurringState.members[0];
player.joined_at = "2026-02-10T12:00:00.000Z";
recurringState.recurring_plans.push(plan({ active: true, start_month: "2026-01" }));

assert.equal(applyRecurringCharges(recurringState, "2026-03-01"), true);
assert.deepEqual(
  recurringState.ledger.filter((entry) => entry.type === "fee").map((entry) => entry.recurring_period),
  ["2026-02", "2026-03"]
);
assert.equal(applyRecurringCharges(recurringState, "2026-03-01"), false);
assert.equal(recurringState.ledger.filter((entry) => entry.type === "fee").length, 2);

const deletedEntry = recurringState.ledger.find((entry) => entry.recurring_period === "2026-02");
assert.ok(deletedEntry);
recurringState.suppressed_recurring_entries.push(
  `charge:${deletedEntry.recurring_plan_id}:${deletedEntry.member_id}:${deletedEntry.recurring_period}`
);
recurringState.ledger = recurringState.ledger.filter((entry) => entry.id !== deletedEntry.id);
assert.equal(applyRecurringCharges(recurringState, "2026-03-01"), false);
assert.equal(recurringState.ledger.some((entry) => entry.recurring_period === "2026-02"), false);

const partialPaymentState = interestState(5_000);
assert.equal(applyRecurringCharges(partialPaymentState, "2026-01-31"), true);
assert.equal(interestEntries(partialPaymentState).length, 1);
assert.equal(interestEntries(partialPaymentState)[0].total_amount_cents, 49);
assert.equal(applyRecurringCharges(partialPaymentState, "2026-01-31"), false);
assert.equal(interestEntries(partialPaymentState).length, 1);
assert.equal(applyRecurringCharges(partialPaymentState, "2026-03-02"), true);
assert.equal(interestEntries(partialPaymentState).length, 2);
assert.equal(interestEntries(partialPaymentState).reduce((sum, entry) => sum + entry.total_amount_cents, 0), 98);

const fullyPaidState = interestState(10_000);
assert.equal(applyRecurringCharges(fullyPaidState, "2026-01-31"), false);
assert.equal(interestEntries(fullyPaidState).length, 0);

console.log("Monatsbuchungen und Zinsberechnung erfolgreich geprueft.");

function emptyState(): TeamState {
  const state = createInitialTeamState();
  state.members = [state.members.find((member) => member.role === "player")!];
  state.ledger = [];
  state.treasury_entries = [];
  state.recurring_plans = [];
  state.suppressed_recurring_entries = [];
  return state;
}

function interestState(paymentCents: number): TeamState {
  const state = emptyState();
  const member = state.members[0];
  const recurringPlan = plan({ active: false, annual_interest_rate_bps: 1_200 });
  const principal = entry({
    id: "principal",
    member_id: member.id,
    member_name: member.display_name,
    type: "fee",
    description: "Monatsbeitrag",
    total_amount_cents: 10_000,
    unit_amount_cents: 10_000,
    booking_date: "2026-01-01",
    recurring_plan_id: recurringPlan.id,
    recurring_period: "2026-01"
  });
  const payment = entry({
    id: "payment",
    member_id: member.id,
    member_name: member.display_name,
    type: "payment",
    description: "Zahlung",
    total_amount_cents: -paymentCents,
    unit_amount_cents: -paymentCents,
    booking_date: "2026-01-20",
    status: "paid"
  });

  state.recurring_plans = [recurringPlan];
  state.ledger = [principal, payment];
  return state;
}

function plan(overrides: Partial<RecurringPlan> = {}): RecurringPlan {
  return {
    id: "monthly-fee",
    team_id: "demo-team",
    name: "Monatsbeitrag",
    ledger_type: "fee",
    amount_cents: 1_000,
    due_day: 1,
    start_month: "2026-01",
    applies_to_all: true,
    member_ids: [],
    annual_interest_rate_bps: 0,
    grace_days: 30,
    active: true,
    created_by_member_id: null,
    created_by_name: "Test",
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
}

function entry(overrides: Partial<LedgerEntry>): LedgerEntry {
  return {
    id: "entry",
    team_id: "demo-team",
    member_id: "demo-player",
    member_name: "Testspieler",
    catalog_item_id: null,
    catalog_item_name: null,
    type: "fee",
    description: "Test",
    quantity: 1,
    unit_amount_cents: 0,
    total_amount_cents: 0,
    settled_amount_cents: 0,
    status: "open",
    booking_date: "2026-01-01",
    notes: null,
    in_kind_label: null,
    in_kind_completed_at: null,
    in_kind_completed_by_member_id: null,
    in_kind_completed_by_name: null,
    source: "system",
    created_by_member_id: null,
    created_by_name: "Test",
    correction_of: null,
    recurring_plan_id: null,
    recurring_period: null,
    interest_for_entry_id: null,
    interest_period: null,
    void_reason: null,
    voided_at: null,
    voided_by_member_id: null,
    voided_by_name: null,
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
}

function interestEntries(state: TeamState) {
  return state.ledger.filter((entry) => entry.type === "interest");
}
