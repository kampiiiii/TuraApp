import { ForbiddenState, LoginRequired, NoTeamState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { RecurringPlanManager } from "@/components/recurring-plan-manager";
import { getAppData } from "@/lib/team-queries";

export const dynamic = "force-dynamic";

export default async function RecurringPlansPage() {
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
        title="Monatliche Beitraege"
        description="Wiederkehrende Monatsbeitraege und Getraenkeflats verwalten."
      />
      <RecurringPlanManager
        plans={data.recurring_plans}
        members={data.members}
        team={data.team}
        disabled={data.isDemo}
      />
    </div>
  );
}
