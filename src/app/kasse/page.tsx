import { ForbiddenState, LoginRequired, NoTeamState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { TreasuryForm } from "@/components/treasury-form";
import { TreasurySummary } from "@/components/treasury-summary";
import { TreasuryTable } from "@/components/treasury-table";
import { getAppData } from "@/lib/team-queries";

export const dynamic = "force-dynamic";

export default async function TreasuryPage() {
  const data = await getAppData();

  if (data.authState === "anonymous" || data.authState === "setup-required") {
    return <LoginRequired />;
  }

  if (data.authState === "no-team") {
    return <NoTeamState />;
  }

  if (data.currentMember?.role !== "admin") {
    return <ForbiddenState />;
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Kassenwart"
        title="Kassenbestand"
        description="Tatsaechliche Einnahmen und Ausgaben der Mannschaftskasse."
      />
      <TreasurySummary summary={data.treasury.summary} team={data.team} />
      <TreasuryForm disabled={data.isDemo} />
      <TreasuryTable entries={data.treasury.entries} team={data.team} disabled={data.isDemo} />
    </div>
  );
}
