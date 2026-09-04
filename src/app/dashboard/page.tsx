import Link from "next/link";
import { ArrowRight, ReceiptText } from "lucide-react";
import { BalanceCards } from "@/components/balance-cards";
import { LoginRequired, NoTeamState } from "@/components/empty-state";
import { LedgerTable } from "@/components/ledger-table";
import { InKindObligationList } from "@/components/in-kind-obligation-list";
import { MemberDashboard } from "@/components/member-dashboard";
import { PageHeader } from "@/components/page-header";
import { SelfDrinkForm } from "@/components/self-drink-form";
import { TreasurySummary } from "@/components/treasury-summary";
import { formatMoney } from "@/lib/money";
import { getAppData } from "@/lib/team-queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getAppData();

  if (data.authState === "anonymous" || data.authState === "setup-required") {
    return <LoginRequired />;
  }

  if (data.authState === "no-team") {
    return <NoTeamState />;
  }

  const isAdmin = data.currentMember?.role === "admin";
  const currentBalance = data.balances.find((balance) => balance.member_id === data.currentMember?.id);
  const openEntries = data.ledger.filter((entry) => entry.status === "open" || entry.status === "partial");

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={isAdmin ? "Kassenwart" : "Spieler"}
        title={isAdmin ? "Mannschaftskasse" : `Hallo ${data.currentMember?.display_name ?? ""}`}
        description={
          isAdmin
            ? "Überblick über offene Strafen, Getränke und Zahlungen der Mannschaft."
            : "Deine eigenen offenen Buchungen, Zahlungen und dein aktueller Saldo."
        }
      />

      <BalanceCards
        balances={data.balances}
        team={data.team}
        currentMemberId={isAdmin ? undefined : data.currentMember?.id}
      />

      {isAdmin ? <TreasurySummary summary={data.treasury.summary} team={data.team} /> : null}

      {!isAdmin && currentBalance ? (
        <section className="pay-preview">
          <span>
            <strong>{currentBalance.credit_cents > 0 ? "Dein Guthaben" : "Aktuell offen"}</strong>
            <small>
              {currentBalance.credit_cents > 0
                ? "Das Guthaben wird automatisch mit neuen Buchungen verrechnet."
                : "Zahlungen werden automatisch mit den ältesten offenen Buchungen verrechnet."}
            </small>
          </span>
          <strong>
            {formatMoney(
              currentBalance.credit_cents > 0 ? currentBalance.credit_cents : currentBalance.amount_due_cents,
              data.team?.currency
            )}
          </strong>
        </section>
      ) : null}

      {!isAdmin ? <SelfDrinkForm catalog={data.catalog} team={data.team} /> : null}

      {isAdmin ? (
        <MemberDashboard
          balances={data.balances}
          ledger={data.ledger}
          members={data.members}
          catalog={data.catalog}
          team={data.team}
          disabled={data.isDemo}
        />
      ) : null}

      <InKindObligationList entries={data.ledger} canManage={isAdmin} disabled={data.isDemo} />

      <section className="split-section">
        <div>
          <div className="section-title-row">
            <h2>{isAdmin ? "Letzte offene Buchungen" : "Deine offenen Buchungen"}</h2>
            <Link className="text-link" href="/buchungen">
              Alle anzeigen
              <ArrowRight size={16} />
            </Link>
          </div>
          <LedgerTable
            entries={openEntries.slice(0, 6)}
            team={data.team}
            members={data.members}
            catalog={data.catalog}
            canVoid={isAdmin}
            disabled={data.isDemo}
          />
        </div>

        {isAdmin ? (
          <Link className="quick-action" href="/admin">
            <ReceiptText size={22} />
            <span>
              <strong>Neue Buchung</strong>
              <small>Spieler wählen, Katalogposition klicken, speichern.</small>
            </span>
            <ArrowRight size={18} />
          </Link>
        ) : null}
      </section>
    </div>
  );
}
