const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const root = path.resolve(__dirname, "..");
function load(file, dependencies = {}) {
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(path.join(root, file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX }
  }).outputText;
  vm.runInNewContext(source, { module, exports: module.exports, Date, Intl,
    require: (name) => {
      if (name in dependencies) return dependencies[name];
      if (name === "react" || name === "react/jsx-runtime" || name === "lucide-react") return require(name);
      throw Error("Unexpected dependency: " + name);
    }
  });
  return module.exports;
}
const html = (component, props) => renderToStaticMarkup(React.createElement(component, props));
const dialog = load("src/components/responsive-dialog.tsx");
const nav = load("src/components/mobile-navigation.tsx", {
  "next/navigation": { usePathname: () => "/dashboard" },
  "next/link": { default: ({ children, ...props }) => React.createElement("a", props, children) },
  "@/components/responsive-dialog": dialog
});
const playerNavigation = html(nav.MobileNavigation, { isAdmin: false });
assert.equal((playerNavigation.match(/class="nav-link /g) || []).length, 4);
assert.ok(playerNavigation.includes('aria-current="page"'));
assert.ok(!playerNavigation.includes('href="/admin"'));
assert.ok(!playerNavigation.includes('href="/kasse"'));
const adminNavigation = html(nav.MobileNavigation, { isAdmin: true });
assert.ok(adminNavigation.includes('href="/kasse"'));
assert.equal((adminNavigation.match(/class="nav-link /g) || []).length, 4);
const money = load("src/lib/money.ts");
const cards = load("src/components/balance-cards.tsx", { "@/lib/money": money });
const disclosure = load("src/components/responsive-disclosure.tsx");
const overview = load("src/components/mobile-dashboard-overview.tsx", {
  "@/lib/money": money, "@/components/balance-cards": cards,
  "@/components/responsive-disclosure": disclosure,
  "@/components/treasury-summary": { TreasurySummary: () => React.createElement("div", null, "Treasury") }
});
const balance = { member_id: "self", fine_cents: 100, drink_cents: 200, fee_cents: 0, interest_cents: 0, payment_cents: 0, amount_due_cents: 300, credit_cents: 0 };
const data = { currentMember: { id: "self" }, balances: [balance, { ...balance, member_id: "other", amount_due_cents: 2000 }], treasury: { summary: {} }, team: { currency: "EUR" } };
const playerOverview = html(overview.MobileDashboardOverview, { data, isAdmin: false });
assert.ok(playerOverview.includes("Dein Saldo"));
assert.ok(playerOverview.includes("3,00"));
assert.ok(!playerOverview.includes("Treasury"));
const credit = html(overview.MobileDashboardOverview, { data: { ...data, balances: [{ ...balance, amount_due_cents: 0, credit_cents: 700 }] }, isAdmin: false });
assert.ok(credit.includes("Dein Guthaben"));
assert.ok(credit.includes("7,00"));
const list = load("src/components/mobile-ledger-list.tsx", {
  "@/lib/money": money,
  "@/components/status-pill": { StatusPill: ({ status }) => React.createElement("span", null, status) },
  "@/components/ledger-entry-menu": { LedgerEntryMenu: () => React.createElement("button", null, "Admin actions") }
});
const entry = { id: "entry", type: "fine", description: "Teststrafe", booking_date: "2026-10-01", member_name: "Spieler", quantity: 2, unit_amount_cents: 100, total_amount_cents: 200, settled_amount_cents: 100, status: "partial", notes: "Notiz", source: "admin", correction_of: "original", created_by_name: "Admin" };
const playerList = html(list.MobileLedgerList, { entries: [entry], members: [], catalog: [], team: null, canVoid: false, disabled: false });
assert.ok(playerList.includes("<details"));
assert.ok(playerList.includes("Noch offen:"));
assert.ok(playerList.includes("Notiz"));
assert.ok(playerList.includes("Korrektur zu vorheriger Buchung"));
assert.ok(!playerList.includes("Admin actions"));
assert.ok(html(list.MobileLedgerList, { entries: [entry], members: [], catalog: [], team: null, canVoid: true, disabled: false }).includes("Admin actions"));
const voidedList = html(list.MobileLedgerList, { entries: [{ ...entry, status: "voided", void_reason: "Fehler", voided_by_name: "Admin" }], members: [], catalog: [], team: null, canVoid: true, disabled: false });
assert.ok(voidedList.includes("Storno: Fehler"));
assert.ok(!voidedList.includes("Admin actions"));
const css = fs.readFileSync(path.join(root, "src/app/mobile-usability.css"), "utf8");
assert.ok(css.includes(".desktop-ledger"));
assert.ok(css.includes("grid-template-columns:repeat(4,minmax(0,1fr))"));
console.log("PASS: role-specific navigation, own balance/credit, expandable history, audit details, no player admin actions");
