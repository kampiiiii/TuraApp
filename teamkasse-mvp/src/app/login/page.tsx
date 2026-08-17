import { LoginForm } from "@/components/login-form";
import { PageHeader } from "@/components/page-header";
import { hasSupabaseEnv } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="page-stack narrow">
      <PageHeader
        eyebrow="Login"
        title="Mannschaft anmelden"
        description="Supabase Auth uebernimmt die Anmeldung. Rollen und Rechte kommen aus `team_members` und RLS."
      />
      <LoginForm configured={hasSupabaseEnv()} />
    </div>
  );
}
