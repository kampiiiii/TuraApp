import { LoginRequired, NoTeamState } from "@/components/empty-state";
import { LedgerTable } from "@/components/ledger-table";
import { PageHeader } from "@/components/page-header";
import { getAppData } from "@/lib/team-queries";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const data = await getAppData();

  if (data.authState === "anonymous" || data.authState === "setup-required") {
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
        description={
          isAdmin
            ? "Bearbeiten legt nachvollziehbare Korrekturen an. Stornierte Eintraege bleiben sichtbar."
            : "Stornierte Eintraege bleiben sichtbar, damit die Kasse nachvollziehbar bleibt."
        }
      />
      <LedgerTable
        entries={data.ledger}
        team={data.team}
        members={data.members}
        catalog={data.catalog}
        canVoid={isAdmin}
        disabled={data.isDemo}
      />
    </div>
  );
}
