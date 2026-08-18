import { LoginForm } from "@/components/login-form";
import { PageHeader } from "@/components/page-header";
import { getLoginData } from "@/lib/team-queries";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const data = await getLoginData();

  return (
    <div className="page-stack login-page">
      <PageHeader
        eyebrow="Login"
        title="Mannschaft anmelden"
        description="Admin und Spieler haben getrennte Zugaenge. Neue Spieler koennen ihren Zugang selbst anlegen."
      />
      <LoginForm
        configured={data.configured}
        registrationConfigured={data.registrationConfigured}
        members={data.members}
      />
    </div>
  );
}
