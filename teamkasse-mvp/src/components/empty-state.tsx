import Link from "next/link";
import { LogIn, ShieldAlert } from "lucide-react";

export function LoginRequired() {
  return (
    <section className="empty-state">
      <ShieldAlert size={28} />
      <h2>Anmeldung erforderlich</h2>
      <p>Verbinde Supabase und melde dich an, damit echte Mannschaftsdaten geladen werden.</p>
      <Link className="primary-button" href="/login">
        <LogIn size={16} />
        Zum Login
      </Link>
    </section>
  );
}

export function NoTeamState() {
  return (
    <section className="empty-state">
      <ShieldAlert size={28} />
      <h2>Noch keiner Mannschaft zugeordnet</h2>
      <p>Der Auth-User ist vorhanden, aber es gibt noch keinen passenden Eintrag in `team_members`.</p>
    </section>
  );
}

export function ForbiddenState() {
  return (
    <section className="empty-state">
      <ShieldAlert size={28} />
      <h2>Nur fuer Kassenwarte</h2>
      <p>Diese Seite ist fuer Admins vorgesehen. Spieler koennen ihre eigenen Buchungen im Dashboard sehen.</p>
    </section>
  );
}
