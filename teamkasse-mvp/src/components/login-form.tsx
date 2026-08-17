import { LogIn, ShieldCheck } from "lucide-react";
import { loginAdminAction, loginPlayerAction } from "@/app/actions";
import type { TeamMember } from "@/lib/types";

export function LoginForm({ configured, members }: { configured: boolean; members: TeamMember[] }) {
  if (!configured) {
    return (
      <section className="login-card">
        <h2>Login noch nicht eingerichtet</h2>
        <p>
          Setze in Netlify die Variablen `TEAMKASSE_ADMIN_PASSWORD` und `TEAMKASSE_SESSION_SECRET`. Danach kann der
          Kassenwart Spieler-PINs vergeben.
        </p>
      </section>
    );
  }

  return (
    <div className="login-grid">
      <section className="login-card">
        <h2>Kassenwart</h2>
        <form action={loginAdminAction} className="login-form">
          <label>
            Admin-Passwort
            <input name="admin_password" type="password" autoComplete="current-password" required />
          </label>
          <button className="primary-button" type="submit">
            <ShieldCheck size={16} />
            Als Admin anmelden
          </button>
        </form>
      </section>

      <section className="login-card">
        <h2>Spieler</h2>
        <form action={loginPlayerAction} className="login-form">
          <label>
            Spieler
            <select name="member_id" required>
              <option value="">Auswaehlen</option>
              {members.map((member) => (
                <option value={member.id} key={member.id}>
                  {member.display_name}
                </option>
              ))}
            </select>
          </label>
          <label>
            PIN
            <input name="pin" type="password" inputMode="numeric" autoComplete="current-password" required />
          </label>
          <button className="ghost-button" type="submit">
            <LogIn size={16} />
            Als Spieler anmelden
          </button>
        </form>
      </section>
    </div>
  );
}
