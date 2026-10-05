const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require(process.env.TS_COMPILER_PATH || "typescript");
const root = path.resolve(__dirname, "..");
function load(file, dependencies = {}) {
  const result = ts.transpileModule(fs.readFileSync(path.join(root, file), "utf8"), {
    fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX }, reportDiagnostics: true
  });
  assert.equal((result.diagnostics || []).filter((d) => d.category === ts.DiagnosticCategory.Error).length, 0, file);
  const module = { exports: {} };
  vm.runInNewContext(result.outputText, { exports: module.exports, module, process, Date, Intl,
    require: (name) => { assert.ok(name in dependencies, `Unexpected dependency: ${name}`); return dependencies[name]; }
  }, { filename: file });
  return module.exports;
}
const helpers = load("src/lib/recurring-memberships.ts");
const { membershipAt, nextMonth, berlinMonth, addMembershipChange } = helpers;
assert.equal(nextMonth("2026-12"), "2027-01");
assert.equal(berlinMonth(new Date("2026-09-30T22:30:00Z")), "2026-10");
const members = ["alpha", "beta", "gamma"].map((id) => ({ id, display_name: id, role: "player", active: true, joined_at: "2026-08-01T00:00:00Z" }));
members[2].joined_at = "2026-10-15T00:00:00Z";
const plan = { id: "flat", team_id: "team", name: "Getränkeflat", ledger_type: "drink", amount_cents: 2000, due_day: 1,
  start_month: "2026-08", applies_to_all: false, member_ids: ["alpha"], annual_interest_rate_bps: 0, grace_days: 30, active: true };
const audit = { id: "change", memberId: "admin", name: "Admin", changedAt: "2026-10-05T12:00:00Z" };
const state = { version: 5, team: { id: "team", currency: "EUR" }, members, catalog: [], ledger: [], treasury_entries: [], recurring_plans: [plan], suppressed_recurring_entries: [] };
let uuid = 0, stored = "";
const store = load("src/lib/team-store.ts", {
  "@/lib/recurring-memberships": helpers, "@/lib/demo-data": { demoData: {} },
  "@netlify/blobs": { getStore: () => ({ get: async () => null, setJSON: async () => {} }) },
  "node:crypto": { ...require("node:crypto"), randomUUID: () => `id-${++uuid}` }, "node:path": path,
  "node:fs/promises": { mkdir: async () => {}, open: async () => ({ close: async () => {} }), unlink: async () => {}, rename: async () => {},
    readFile: async () => stored, writeFile: async (_path, text) => { stored = text; } }
});
store.applyRecurringCharges(state, "2026-09-30");
assert.equal(state.ledger.length, 2);
const historical = JSON.stringify(state.ledger);
addMembershipChange(plan, members, { effectiveMonth: "2026-10", appliesToAll: false, memberIds: ["alpha", "beta", "beta"] }, audit, "2026-10");
assert.equal(plan.member_ids.length, 1, "Legacy selection must not be overwritten");
assert.equal(membershipAt(plan, "2026-09").member_ids.join(), "alpha");
assert.equal(membershipAt(plan, "2026-10").member_ids.join(), "alpha,beta");
addMembershipChange(plan, members, { effectiveMonth: "2026-11", appliesToAll: false, memberIds: ["beta"] }, { ...audit, id: "exit" }, "2026-10");
assert.equal(JSON.stringify(state.ledger), historical, "Membership edits must not touch existing bookings");
store.applyRecurringCharges(state, "2026-11-05");
assert.equal(state.ledger.length, 5);
assert.equal(JSON.stringify(state.ledger.slice(0, 2)), historical);
assert.equal(state.ledger.filter((entry) => entry.member_id === "beta").map((entry) => entry.recurring_period).join(), "2026-10,2026-11");
assert.equal(state.ledger.some((entry) => entry.member_id === "alpha" && entry.recurring_period === "2026-11"), false);
const existing = JSON.stringify(state.ledger);
store.applyRecurringCharges(state, "2026-11-05");
assert.equal(JSON.stringify(state.ledger), existing, "Recurring generation must remain idempotent");
state.ledger[0].status = "voided";
store.applyRecurringCharges(state, "2026-11-05");
assert.equal(state.ledger.length, 5, "Voided bookings must not be recreated");
assert.equal(state.ledger[0].status, "voided");
assert.throws(() => addMembershipChange(plan, members, { effectiveMonth: "2026-09", appliesToAll: false, memberIds: ["alpha"] }, audit, "2026-10"));
assert.throws(() => addMembershipChange(plan, members, { effectiveMonth: "2026-13", appliesToAll: true, memberIds: [] }, audit, "2026-10"));
assert.throws(() => addMembershipChange(plan, members, { effectiveMonth: "2026-11", appliesToAll: false, memberIds: ["missing"] }, audit, "2026-10"));
addMembershipChange(plan, members, { effectiveMonth: "2026-12", appliesToAll: false, memberIds: [] }, audit, "2026-10");
store.applyRecurringCharges(state, "2026-12-05");
assert.equal(state.ledger.length, 5, "Removing all participants must stop future charges");
addMembershipChange(plan, members, { effectiveMonth: "2026-12", appliesToAll: true, memberIds: [] }, audit, "2026-10");
store.applyRecurringCharges(state, "2026-12-05");
assert.equal(state.ledger.length, 8, "Latest edit for the same month wins");
assert.equal(plan.membership_changes.length, 4, "All edits stay in audit history");
const legacy = { ...plan, membership_changes: undefined, applies_to_all: true };
const legacyState = { ...state, ledger: [], recurring_plans: [legacy] };
store.applyRecurringCharges(legacyState, "2026-09-30");
assert.equal(legacyState.ledger.length, 4, "Existing all-player plans keep joined-date behavior");

async function checkActionsAndPersistence() {
  stored = JSON.stringify(state);
  await store.saveTeamState(await store.loadTeamState());
  const saved = JSON.parse(stored);
  assert.equal(saved.version, 7);
  assert.equal(saved.recurring_plans[0].membership_changes.length, 4);
  assert.equal(saved.ledger.length, state.ledger.length);
  stored = JSON.stringify(legacyState);
  await store.saveTeamState(await store.loadTeamState());
  assert.equal(JSON.parse(stored).recurring_plans[0].membership_changes.length, 0, "Legacy plans migrate without data loss");
  let role = "player", saveCount = 0;
  const actionState = { ...state, members: [...members, { id: "admin", role: "admin" }] };
  const actions = load("src/app/actions.ts", {
    "node:crypto": { randomUUID: () => `id-${++uuid}` },
    "next/cache": { refresh: () => {}, revalidatePath: () => {} }, "next/navigation": { redirect: () => {} },
    "@/lib/auth": { isAuthConfigured: () => true, getCurrentSession: async () => ({ memberId: role === "admin" ? "admin" : "alpha" }) },
    "@/lib/money": {}, "@/lib/recurring-memberships": helpers,
    "@/lib/booking-requests": {}, "@/lib/training-bookings": {},
    "@/lib/team-store": { loadTeamState: async () => actionState, saveTeamState: async () => { saveCount++; }, attachLedgerNames: (ledger) => ledger }
  });
  const fields = new Map([["plan_id", "flat"], ["effective_month", nextMonth(berlinMonth())]]);
  const form = { get: (key) => fields.get(key) ?? null, getAll: () => ["beta"] };
  const denied = await actions.updateRecurringMembersAction({ status: "idle", message: "" }, form);
  assert.equal(denied.status, "error");
  assert.equal(saveCount, 0, "Players cannot change participants");
  role = "admin";
  const ledgerBefore = JSON.stringify(actionState.ledger);
  const result = await actions.updateRecurringMembersAction({ status: "idle", message: "" }, form);
  assert.equal(result.status, "success");
  assert.equal(saveCount, 1);
  assert.equal(JSON.stringify(actionState.ledger), ledgerBefore);
  console.log("PASS: dated joins/exits, no retroactive charges, immutable history, legacy migration, idempotency, admin-only saves");
}
checkActionsAndPersistence().catch((error) => { console.error(error); process.exitCode = 1; });
