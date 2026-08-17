import { LoginForm } from "@/components/login-form";
import { PageHeader } from "@/components/page-header";
import { getLoginData } from "@/lib/team-queries";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const data = await getLoginData();

  return (
    <div className="page-stack narrow">
      <PageHeader
        eyebrow="Login"
        title="Mannschaft anmelden"
        description="Admin und Spieler haben getrennte Zugänge. Der Kassenwart vergibt die Spieler-PINs."
      />
      <LoginForm configured={data.configured} members={data.members} />
    </div>
  );
}
