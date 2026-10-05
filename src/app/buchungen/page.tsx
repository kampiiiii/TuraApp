import { LoginRequired, NoTeamState } from "@/components/empty-state";
import { LedgerBrowser } from "@/components/ledger-browser";
import { PageHeader } from "@/components/page-header";
import { getAppData } from "@/lib/team-queries";
import "./bookings.css";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const data = await getAppData(true);

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
            ? "Buchungen und nachvollziehbare Korrekturen der Mannschaft."
            : "Deine Buchungen und nachvollziehbaren Korrekturen."
        }
      />
      <LedgerBrowser
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
