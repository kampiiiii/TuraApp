const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require(process.env.TS_COMPILER_PATH || "typescript");
const root = path.resolve(__dirname, "..");

function load(file, dependencies = {}) {
  const result = ts.transpileModule(fs.readFileSync(path.join(root, file), "utf8"), {
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
    reportDiagnostics: true
  });
  assert.equal((result.diagnostics || []).filter((d) => d.category === ts.DiagnosticCategory.Error).length, 0, file);
  const module = { exports: {} };
  vm.runInNewContext(result.outputText, {
    exports: module.exports, module,
    require: (name) => {
      assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
      return dependencies[name];
    }
  }, { filename: file });
  return module.exports;
}

const { DEFAULT_LEDGER_FILTERS: defaults, filterLedger, paginateLedger } = load("src/lib/ledger-filters.ts");
const entries = Array.from({ length: 135 }, (_, i) => ({
  id: `entry-${String(i).padStart(3, "0")}`, member_id: i % 2 ? "daniel" : "niklas",
  member_name: i % 2 ? "Daniel" : "Niklas", description: "Getraenk", notes: null,
  catalog_item_name: null, type: "drink", status: "paid", booking_date: "2026-09-01",
  created_at: `2026-09-01T10:00:${String(i % 60).padStart(2, "0")}Z`
}));
entries[0] = { ...entries[0], status: "open", type: "fine", description: "Bälle suchen", booking_date: "2025-01-01" };
entries[1] = { ...entries[1], status: "partial", type: "fine", booking_date: "2025-01-31" };
entries[2] = { ...entries[2], status: "voided", type: "fine" };
entries[3] = { ...entries[3], status: "open", type: "fine", description: "Glücksrad", booking_date: "2025-02-01" };
const original = JSON.stringify(entries);
assert.equal(filterLedger(entries, defaults).length, 134);
assert.equal(filterLedger(entries, { ...defaults, hideVoided: false }).length, 135);
assert.equal(filterLedger(entries, { ...defaults, status: "voided", hideVoided: false }).length, 1);
assert.equal(filterLedger(entries, { ...defaults, status: "open" }).length, 3);
assert.equal(filterLedger(entries, { ...defaults, memberId: "niklas", type: "fine", status: "open" })[0].id, "entry-000");
assert.equal(filterLedger(entries, { ...defaults, query: "niklas balle" })[0].id, "entry-000");
assert.equal(filterLedger(entries, { ...defaults, dateFrom: "2025-01-01", dateTo: "2025-01-31" }).length, 2);
assert.equal(filterLedger(entries, { ...defaults, order: "oldest" })[0].id, "entry-000");
assert.equal(JSON.stringify(entries), original, "Filtering must not mutate bookings");
const all = filterLedger(entries, { ...defaults, hideVoided: false });
const pages = [1, 2, 3].flatMap((page) => paginateLedger(all, page).entries);
assert.equal(new Set(pages.map((entry) => entry.id)).size, 135);
assert.equal(paginateLedger(all, 999).currentPage, 3);
assert.equal(paginateLedger([], 5).currentPage, 1);
assert.equal(paginateLedger([], 5).entries.length, 0);

async function checkVisibility() {
  let memberId = "admin";
  const state = { team: {}, members: [{ id: "admin", role: "admin" }, { id: "niklas", role: "player" }], ledger: entries, catalog: [] };
  const { getAppData } = load("src/lib/team-queries.ts", {
    react: { cache: (fn) => fn },
    "@/lib/auth": { isAuthConfigured: () => true, getCurrentSession: async () => memberId ? { memberId } : null },
    "@/lib/team-store": {
      loadTeamState: async () => state, attachLedgerNames: (ledger) => ledger.slice(),
      calculateBalances: () => [], calculateTreasury: () => ({}), publicMembers: (members) => members
    }
  });
  assert.equal((await getAppData()).ledger.length, 100);
  assert.equal((await getAppData(true)).ledger.length, 135);
  memberId = "niklas";
  const playerData = await getAppData(true);
  assert.ok(playerData.ledger.every((entry) => entry.member_id === "niklas"));
  assert.equal(playerData.ledger.length, 68);
  assert.equal(playerData.members.length, 1);
  memberId = null;
  assert.equal((await getAppData(true)).ledger.length, 0);
  console.log("PASS: filters, older entries, pagination, immutability and admin/player visibility");
}
checkVisibility().catch((error) => { console.error(error); process.exitCode = 1; });
