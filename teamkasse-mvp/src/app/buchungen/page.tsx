import { LoginRequired, NoTeamState } from "@/components/empty-state";
import { LedgerTable } from "@/components/ledger-table";
import { PageHeader } from "@/components/page-header";
import { getAppData } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const data = await getAppData();

  if (data.authState === "anonymous") {
    return <LoginRequired />;
  }

  if (data.authState === "no-team") {
    return <NoTeamState />;
  }

  const isAdmin = data.currentMember?.role === "admin";

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Historie"
        title={isAdmin ? "Alle Buchungen" : "Meine Buchungen"}
        description="Stornierte Eintraege bleiben sichtbar, damit die Kasse nachvollziehbar bleibt."
      />
      <LedgerTable entries={data.ledger} team={data.team} canVoid={isAdmin} disabled={data.isDemo} />
    </div>
  );
}
