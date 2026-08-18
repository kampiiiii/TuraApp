"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { changeOwnPinAction, type PinChangeState } from "@/app/actions";

const initialState: PinChangeState = {
  status: "idle",
  message: ""
};

export function PinChangeForm() {
  const [state, formAction, pending] = useActionState(changeOwnPinAction, initialState);

  return (
    <section className="profile-panel">
      <div className="profile-panel-heading">
        <span className="section-icon">
          <KeyRound size={20} />
        </span>
        <span>
          <h2>Spieler-PIN aendern</h2>
          <small>Die neue PIN wird beim naechsten Login verwendet.</small>
        </span>
      </div>

      <form action={formAction} className="pin-change-form">
        <label>
          Bisherige PIN
          <input name="current_pin" type="password" inputMode="numeric" autoComplete="current-password" required />
        </label>
        <label>
          Neue PIN
          <input name="new_pin" type="password" inputMode="numeric" autoComplete="new-password" minLength={4} required />
        </label>
        <label>
          Neue PIN wiederholen
          <input name="confirm_pin" type="password" inputMode="numeric" autoComplete="new-password" minLength={4} required />
        </label>

        {state.message ? (
          <p className={`form-message ${state.status}`} role={state.status === "error" ? "alert" : "status"}>
            {state.message}
          </p>
        ) : null}

        <button className="primary-button" type="submit" disabled={pending}>
          <KeyRound size={16} />
          {pending ? "Wird gespeichert..." : "PIN speichern"}
        </button>
      </form>
    </section>
  );
}
