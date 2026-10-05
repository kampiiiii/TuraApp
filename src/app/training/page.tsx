import { LoginRequired, NoTeamState } from "@/components/empty-state";
import { TrainingForm } from "@/components/training-form";
import { PageHeader } from "@/components/page-header";
import { getAppData } from "@/lib/team-queries";

export const dynamic = "force-dynamic";
export default async function TrainingPage() {
  const data = await getAppData();
  if (data.authState === "anonymous" || data.authState === "setup-required") return <LoginRequired />;
  if (!data.team || !data.currentMember) return <NoTeamState />;
  if (data.currentMember.role !== "admin") return <p>Dieser Bereich ist nur für Admins zugänglich.</p>;
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(new Date());
  return <div className="page-stack"><PageHeader eyebrow="Kassenwart" title="Trainingsabend" description="" />
    <TrainingForm members={data.members} catalog={data.catalog} today={today} /></div>;
}
