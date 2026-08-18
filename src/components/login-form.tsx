"use client";

import { useActionState } from "react";
import { LogIn, ShieldCheck } from "lucide-react";
import { loginAdminAction, loginPlayerAction, type LoginState } from "@/app/actions";
import { RegistrationForm } from "@/components/registration-form";
import type { TeamMember } from "@/lib/types";

export function LoginForm({
  configured,
  registrationConfigured,
  members
}: {
  configured: boolean;
  registrationConfigured: boolean;
  members: TeamMember[];
}) {
  const initialState: LoginState = { status: "idle", message: "" };
  const [adminState, adminAction, adminPending] = useActionState(loginAdminAction, initialState);
  const [playerState, playerAction, playerPending] = useActionState(loginPlayerAction, initialState);

  if (!configured) {
    return (
      <section className="login-card">
        <h2>Login noch nicht eingerichtet</h2>
        <p>
          Setze in Netlify `TEAMKASSE_ADMIN_PASSWORD`, `TEAMKASSE_SESSION_SECRET` und `TEAMKASSE_JOIN_CODE`. Danach
          koennen sich Kassenwart und Spieler anmelden.
        </p>
      </section>
    );
  }

  const admins = members.filter((member) => member.role === "admin");
  const players = members.filter((member) => member.role === "player");

  return (
    <div className="login-grid">
      <section className="login-card">
        <h2>Kassenwart</h2>
        <form action={adminAction} className="login-form">
          <label>
            Admin
            <select name="member_id" required>
              <option value="">Auswaehlen</option>
              {admins.map((member) => (
                <option value={member.id} key={member.id}>
                  {member.display_name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Admin-Passwort (keine Spieler-PIN)
            <input name="admin_password" type="password" autoComplete="current-password" required />
          </label>
          {adminState.status === "error" ? (
            <p className="form-message error compact-message" role="alert">
              {adminState.message}
            </p>
          ) : null}
          <button className="primary-button" type="submit" disabled={adminPending}>
            <ShieldCheck size={16} />
            {adminPending ? "Anmeldung laeuft..." : "Als Admin anmelden"}
          </button>
        </form>
      </section>

      <section className="login-card">
        <h2>Spieler</h2>
        <form action={playerAction} className="login-form">
          <label>
            Spieler
            <select name="member_id" required>
              <option value="">Auswaehlen</option>
              {players.map((member) => (
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
          {playerState.status === "error" ? (
            <p className="form-message error compact-message" role="alert">
              {playerState.message}
            </p>
          ) : null}
          <button className="ghost-button" type="submit" disabled={playerPending}>
            <LogIn size={16} />
            {playerPending ? "Anmeldung laeuft..." : "Als Spieler anmelden"}
          </button>
        </form>
      </section>

      <RegistrationForm enabled={registrationConfigured} />
    </div>
  );
}
