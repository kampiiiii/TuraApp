import type { ReactNode } from "react";
import { Banknote, Beer, CircleDollarSign, ClipboardList, WalletCards } from "lucide-react";
import { formatMoney } from "@/lib/money";
import type { MemberBalance, Team } from "@/lib/types";

export function BalanceCards({
  balances,
  team,
  currentMemberId
}: {
  balances: MemberBalance[];
  team: Team | null;
  currentMemberId?: string;
}) {
  const shownBalances = currentMemberId ? balances.filter((balance) => balance.member_id === currentMemberId) : balances;
  const totalFine = sum(shownBalances, "fine_cents");
  const totalDrinks = sum(shownBalances, "drink_cents");
  const totalPayments = sum(shownBalances, "payment_cents");
  const totalDue = sum(shownBalances, "amount_due_cents");
  const totalCredit = sum(shownBalances, "credit_cents");
  const currency = team?.currency ?? "EUR";

  return (
    <section className="metric-grid" aria-label="Salden">
      <Metric label="Strafen" value={formatMoney(totalFine, currency)} icon={<ClipboardList size={20} />} />
      <Metric label="Getraenke" value={formatMoney(totalDrinks, currency)} icon={<Beer size={20} />} />
      <Metric label="Bezahlt" value={formatMoney(totalPayments, currency)} icon={<Banknote size={20} />} />
      <Metric label="Offen" value={formatMoney(totalDue, currency)} icon={<CircleDollarSign size={20} />} strong={totalDue > 0} />
      <Metric label="Guthaben" value={formatMoney(totalCredit, currency)} icon={<WalletCards size={20} />} strong={totalCredit > 0} />
    </section>
  );
}

function Metric({
  label,
  value,
  icon,
  strong = false
}: {
  label: string;
  value: string;
  icon: ReactNode;
  strong?: boolean;
}) {
  return (
    <article className={strong ? "metric-card strong" : "metric-card"}>
      <span className="metric-icon">{icon}</span>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function sum(rows: MemberBalance[], key: keyof MemberBalance) {
  return rows.reduce((total, row) => total + Number(row[key]), 0);
}
