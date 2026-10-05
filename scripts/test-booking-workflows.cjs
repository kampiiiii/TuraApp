const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require(process.env.TS_COMPILER_PATH || "typescript");
const root = path.resolve(__dirname, "..");
function load(file, dependencies = {}, context = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(code, { exports: module.exports, module, Date, Intl, setTimeout, ...context,
    require: (name) => { assert.ok(name in dependencies, name); return dependencies[name]; } }, { filename: file });
  return module.exports;
}
const money = load("src/lib/money.ts");
const training = load("src/lib/training-bookings.ts", { "@/lib/money": money });
const requests = load("src/lib/booking-requests.ts");
const statement = load("src/lib/account-statement.ts");
const memberships = load("src/lib/recurring-memberships.ts");
const admin = { id: "admin", team_id: "team", role: "admin", active: true, display_name: "Admin" };
const player = { id: "player", team_id: "team", role: "player", active: true, display_name: "Spieler" };
let stored = { version: 6, team: { id: "team", currency: "EUR" }, members: [admin, player], catalog: [
  { id: "beer", team_id: "team", type: "drink", name: "Bier", active: true, amount_cents: 150 },
  { id: "fine", team_id: "team", type: "fine", name: "Sachstrafe", active: true, amount_cents: 0, in_kind_label: "Kuchen" }
], ledger: [], recurring_plans: [], treasury_entries: [], suppressed_recurring_entries: [] };
let uuid = 0, version = 1, writes = 0, readError = false, writeError = false, optionsSeen;
const clone = (value) => JSON.parse(JSON.stringify(value));
const store = load("src/lib/team-store.ts", {
  "@/lib/recurring-memberships": memberships, "@/lib/demo-data": { demoData: {} },
  "node:crypto": { ...require("node:crypto"), randomUUID: () => "id-" + ++uuid }, "node:path": path, "node:fs/promises": {},
  "@netlify/blobs": { getStore: (options) => { optionsSeen = options; return {
    getWithMetadata: async () => { if (readError) throw Error("read failed"); return { data: clone(stored), etag: String(version) }; },
    setJSON: async (_key, data, conditional) => {
      if (writeError) throw Error("write failed");
      if (conditional.onlyIfMatch !== String(version)) return { modified: false };
      stored = clone(data); version++; writes++; return { modified: true, etag: String(version) };
    }
  }; } }
}, { process: { env: { NETLIFY_BLOBS_CONTEXT: "test" }, cwd: () => root }, fetch: async () => ({ ok: false, status: 500 }) });
async function main() {
  const first = await store.loadTeamState(), second = await store.loadTeamState();
  const row = { id: "r", memberId: "player", type: "drink", catalogItemId: "beer", quantity: 2, amount: "1.50", description: "" };
  const entries = training.makeTrainingEntries(first, admin, [row], "2026-10-05", "", "batch", () => "entry", "2026-10-05T12:00:00Z");
  assert.equal(entries[0].total_amount_cents, 300);
  first.ledger.push(...entries);
  await store.saveTeamState(first);
  await assert.rejects(store.saveTeamState(second), (error) => error.name === "StateConflictError");
  assert.equal(stored.ledger.length, 1, "Stale save must never overwrite bookings");
  assert.equal(stored.version, 7);
  assert.equal(requests.requestAlreadyBooked(stored, "batch"), true);
  assert.throws(() => training.makeTrainingEntries(first, admin, [row, { ...row, memberId: "missing" }], "2026-10-05", "", "x", () => "id", ""), /Spieler/);
  assert.equal(first.ledger.length, 1, "Invalid batches must not mutate state");
  assert.throws(() => training.validBookingDate("2026-02-30"));
  assert.throws(() => training.makeTrainingEntries(first, admin, [{ ...row, amount: "1.00" }], "2026-10-05", "", "x", () => "id", ""), /Katalogpreis/);
  const inKind = training.makeTrainingEntries(first, admin, [{ ...row, type: "fine", catalogItemId: "fine", amount: "0" }], "2026-10-05", "", "x", () => "id", "");
  assert.equal(inKind[0].in_kind_label, "Kuchen");
  const count = writes;
  readError = true; await assert.rejects(store.loadTeamState(), /sicher geladen/); readError = false;
  assert.equal(writes, count, "Read failures must never initialize or overwrite data");
  writeError = true; await assert.rejects(store.saveTeamState(first), /nicht bestätigt/); writeError = false;
  assert.equal(stored.ledger.length, 1);
  await assert.rejects(optionsSeen.fetch("test"), /Datenspeicher/);
  const entry = entries[0];
  const result = statement.accountStatement([
    { ...entry, id: "old", total_amount_cents: 500, booking_date: "2026-09-30" },
    { ...entry, id: "drink" },
    { ...entry, id: "pay", type: "payment", total_amount_cents: -1000 },
    { ...entry, id: "void", status: "voided", total_amount_cents: 10000 },
    { ...entry, id: "other", member_id: "other" }
  ], "player", "2026-10-01", "2026-10-31");
  assert.equal(result.opening, 500);
  assert.equal(result.charges, 300);
  assert.equal(result.credits, 1000);
  assert.equal(result.closing, -200, "500 + 300 - 1000 = 200 cents credit");
  assert.equal(result.rows.length, 2);
  assert.equal(statement.accountStatement(Array.from({ length: 150 }, (_, index) => ({ ...entry, id: String(index) })), "player", "2026-10-01", "2026-10-31").rows.length, 150);
  let role = "admin";
  const actions = load("src/app/actions.ts", {
    "node:crypto": { randomUUID: () => "action-" + ++uuid },
    "next/cache": { refresh() {}, revalidatePath() {} }, "next/navigation": { redirect() {} },
    "@/lib/auth": { isAuthConfigured: () => true, getCurrentSession: async () => ({ memberId: role === "admin" ? "admin" : "player" }) },
    "@/lib/money": money, "@/lib/team-store": store, "@/lib/recurring-memberships": memberships,
    "@/lib/booking-requests": requests, "@/lib/training-bookings": training
  });
  // Names are attached in requireMember; use the real store's helper.
  function form(id) { const values = { booking_request_id: id, rows: JSON.stringify([row]), booking_date: "2026-10-05" }; return { get: (key) => values[key] ?? null }; }
  const idle = { status: "idle", message: "" };
  const id1 = "00000000-0000-4000-8000-000000000001", id2 = "00000000-0000-4000-8000-000000000002";
  const results = await Promise.all([actions.createTrainingBookingsAction(idle, form(id1)), actions.createTrainingBookingsAction(idle, form(id2))]);
  assert.ok(results.every((result) => result.status === "success"), JSON.stringify(results));
  assert.equal(stored.ledger.length, 3, "Concurrent distinct requests must both survive");
  await actions.createTrainingBookingsAction(idle, form(id1));
  assert.equal(stored.ledger.length, 3, "Retry must not duplicate a booking");
  role = "player";
  assert.equal((await actions.createTrainingBookingsAction(idle, form("00000000-0000-4000-8000-000000000003"))).status, "error");
  assert.equal(stored.ledger.length, 3, "Players cannot submit admin batches");
  console.log("PASS: concurrent saves, safe failures, batch validation, idempotency, admin guard, statement balances and full history");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
