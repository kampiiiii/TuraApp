import type { ReactNode } from "react";
import { Banknote, CircleDollarSign, Landmark, ShoppingCart, WalletCards } from "lucide-react";
import { formatMoney } from "@/lib/money";
import type { Team, TreasurySummary as TreasurySummaryData } from "@/lib/types";

export function TreasurySummary({ summary, team }: { summary: TreasurySummaryData; team: Team | null }) {
  const currency = team?.currency ?? "EUR";

  return (
    <section className="treasury-overview" aria-label="Mannschaftskasse">
      <div className="section-title-row">
        <h2>Mannschaftskasse</h2>
        <span>{summary.balance_set_at ? "Aktueller Geldbestand" : "Bestand noch nicht festgelegt"}</span>
      </div>
      <div className="metric-grid treasury-metrics">
        <TreasuryMetric
          label="Kassenbestand"
          value={formatMoney(summary.current_balance_cents, currency)}
          icon={<Landmark size={20} />}
          strong
        />
        <TreasuryMetric
          label="Bestand gesetzt"
          value={formatMoney(summary.balance_set_cents, currency)}
          icon={<WalletCards size={20} />}
        />
        <TreasuryMetric
          label="Spielerzahlungen"
          value={formatMoney(summary.player_payments_cents, currency)}
          icon={<Banknote size={20} />}
        />
        <TreasuryMetric
          label="Sonstige Einnahmen"
          value={formatMoney(summary.other_income_cents, currency)}
          icon={<CircleDollarSign size={20} />}
        />
        <TreasuryMetric
          label="Ausgaben"
          value={formatMoney(summary.expenses_cents, currency)}
          icon={<ShoppingCart size={20} />}
        />
      </div>
    </section>
  );
}

function TreasuryMetric({
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
