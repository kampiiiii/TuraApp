import { ForbiddenState, LoginRequired, NoTeamState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PinChangeForm } from "@/components/pin-change-form";
import { getAppData } from "@/lib/team-queries";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const data = await getAppData();

  if (data.authState === "anonymous" || data.authState === "setup-required") {
    return <LoginRequired />;
  }

  if (data.authState === "no-team") {
    return <NoTeamState />;
  }

  if (data.currentMember?.role !== "player") {
    return <ForbiddenState />;
  }

  return (
    <div className="page-stack narrow">
      <PageHeader
        eyebrow="Mein Profil"
        title={`Hallo ${data.currentMember.display_name}`}
        description="Hier kannst du deine persoenliche Spieler-PIN selbst aendern."
      />
      <PinChangeForm />
    </div>
  );
}
