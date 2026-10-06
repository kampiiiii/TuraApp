import { BalanceCards } from "@/components/balance-cards";
import { TreasurySummary } from "@/components/treasury-summary";
import { ResponsiveDisclosure } from "@/components/responsive-disclosure";
import { formatMoney } from "@/lib/money";
import type { AppData } from "@/lib/types";

export function MobileDashboardOverview({ data, isAdmin }: { data: AppData; isAdmin: boolean }) {
  const own = data.balances.find((balance) => balance.member_id === data.currentMember?.id);
  const credit = !isAdmin && Boolean(own?.credit_cents);
  const amount = isAdmin ? data.balances.reduce((sum, balance) => sum + balance.amount_due_cents, 0) : credit ? own?.credit_cents ?? 0 : own?.amount_due_cents ?? 0;
  return <div className="mobile-dashboard-overview">
    <section className="mobile-balance-strip" aria-label={isAdmin ? "Offene Mannschaftsbeträge" : "Dein Saldo"}>
      <span><strong>{isAdmin ? "Mannschaft offen" : credit ? "Dein Guthaben" : "Aktuell offen"}</strong>
        <small>{isAdmin ? `${data.balances.filter((balance) => balance.amount_due_cents > 0).length} Spieler mit offenen Beträgen` : credit ? "Für kommende Buchungen" : "Dein Gesamtsaldo"}</small>
      </span>
      <strong>{formatMoney(amount, data.team?.currency)}</strong>
    </section>
    <ResponsiveDisclosure title={isAdmin ? "Summen & Kassenbestand" : "Saldo im Detail"}>
      <BalanceCards balances={data.balances} team={data.team} currentMemberId={isAdmin ? undefined : data.currentMember?.id} />
      {isAdmin ? <TreasurySummary summary={data.treasury.summary} team={data.team} /> : null}
    </ResponsiveDisclosure>
  </div>;
}
