import Link from "next/link";
import { ArrowRight, ReceiptText } from "lucide-react";
import { BalanceCards } from "@/components/balance-cards";
import { LoginRequired, NoTeamState } from "@/components/empty-state";
import { LedgerTable } from "@/components/ledger-table";
import { MemberBalanceTable } from "@/components/member-balance-table";
import { PageHeader } from "@/components/page-header";
import { formatMoney } from "@/lib/money";
import { getAppData } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getAppData();

  if (data.authState === "anonymous") {
    return <LoginRequired />;
  }

  if (data.authState === "no-team") {
    return <NoTeamState />;
  }

  const isAdmin = data.currentMember?.role === "admin";
  const currentBalance = data.balances.find((balance) => balance.member_id === data.currentMember?.id);
  const openEntries = data.ledger.filter((entry) => entry.status === "open");

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={isAdmin ? "Kassenwart" : "Spieler"}
        title={isAdmin ? "Mannschaftskasse" : `Hallo ${data.currentMember?.display_name ?? ""}`}
        description={
          isAdmin
            ? "Ueberblick ueber offene Strafen, Getraenke und Zahlungen der Mannschaft."
            : "Deine eigenen offenen Buchungen, Zahlungen und dein aktueller Saldo."
        }
      />

      <BalanceCards
        balances={data.balances}
        team={data.team}
        currentMemberId={isAdmin ? undefined : data.currentMember?.id}
      />

      {!isAdmin && currentBalance ? (
        <section className="pay-preview">
          <span>
            <strong>Aktuell offen</strong>
            <small>SEPA-QR ist als naechster Schritt vorbereitet.</small>
          </span>
          <strong>{formatMoney(currentBalance.balance_cents, data.team?.currency)}</strong>
        </section>
      ) : null}

      {isAdmin ? <MemberBalanceTable balances={data.balances} team={data.team} /> : null}

      <section className="split-section">
        <div>
          <div className="section-title-row">
            <h2>{isAdmin ? "Letzte offene Buchungen" : "Deine offenen Buchungen"}</h2>
            <Link className="text-link" href="/buchungen">
              Alle anzeigen
              <ArrowRight size={16} />
            </Link>
          </div>
          <LedgerTable entries={openEntries.slice(0, 6)} team={data.team} />
        </div>

        {isAdmin ? (
          <Link className="quick-action" href="/admin">
            <ReceiptText size={22} />
            <span>
              <strong>Neue Buchung</strong>
              <small>Spieler waehlen, Katalogposition klicken, speichern.</small>
            </span>
            <ArrowRight size={18} />
          </Link>
        ) : null}
      </section>
    </div>
  );
}
