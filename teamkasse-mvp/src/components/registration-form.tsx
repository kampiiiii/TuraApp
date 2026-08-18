"use client";

import { useActionState } from "react";
import { UserPlus } from "lucide-react";
import { registerPlayerAction, type RegistrationState } from "@/app/actions";

const initialState: RegistrationState = {
  status: "idle",
  message: ""
};

export function RegistrationForm({ enabled }: { enabled: boolean }) {
  const [state, formAction, pending] = useActionState(registerPlayerAction, initialState);

  return (
    <section className="login-card registration-card">
      <div>
        <h2>Zum ersten Mal dabei?</h2>
        <p>Lege deinen Spielerzugang selbst an. Den Mannschaftscode bekommst du vom Kassenwart.</p>
      </div>

      {enabled ? (
        <form action={formAction} className="registration-form">
          <label>
            Vor- und Nachname
            <input name="display_name" autoComplete="name" maxLength={80} required />
          </label>
          <label>
            Rueckennummer
            <input name="jersey_number" type="number" inputMode="numeric" min="1" max="99" placeholder="Optional" />
          </label>
          <label>
            Eigene PIN
            <input name="pin" type="password" inputMode="numeric" autoComplete="new-password" minLength={4} required />
          </label>
          <label>
            PIN wiederholen
            <input name="confirm_pin" type="password" inputMode="numeric" autoComplete="new-password" minLength={4} required />
          </label>
          <label className="registration-code">
            Mannschaftscode
            <input name="join_code" type="password" autoComplete="off" required />
          </label>

          {state.message ? (
            <p className="form-message error registration-message" role="alert">
              {state.message}
            </p>
          ) : null}

          <button className="primary-button registration-submit" type="submit" disabled={pending}>
            <UserPlus size={16} />
            {pending ? "Zugang wird angelegt..." : "Spielerzugang anlegen"}
          </button>
        </form>
      ) : (
        <p className="form-message">Der Kassenwart muss die Selbstregistrierung einmalig freischalten.</p>
      )}
    </section>
  );
}
