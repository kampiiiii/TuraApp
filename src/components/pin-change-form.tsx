"use client";

import { useActionState, useEffect, useRef } from "react";
import { CheckCircle2, KeyRound } from "lucide-react";
import { changeOwnPinAction, type PinChangeState } from "@/app/actions";

const initialState: PinChangeState = {
  status: "idle",
  message: ""
};

export function PinChangeForm() {
  const [state, formAction, pending] = useActionState(changeOwnPinAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

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

      <form ref={formRef} action={formAction} className="pin-change-form">
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

        {state.status === "success" ? (
          <div className="pin-success-message" role="status">
            <CheckCircle2 size={22} aria-hidden="true" />
            <span>
              <strong>PIN erfolgreich geaendert</strong>
              <small>{state.message} Die Eingabefelder wurden geleert.</small>
            </span>
          </div>
        ) : null}

        {state.status === "error" ? (
          <p className="form-message error" role="alert">
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
