"use client";

import { useActionState, useEffect, useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import { setMemberPinAction, type MemberPinState } from "@/app/actions";
import type { TeamMember } from "@/lib/types";

const initialState: MemberPinState = {
  status: "idle",
  message: ""
};

export function MemberPinForm({ member, disabled = false }: { member: TeamMember; disabled?: boolean }) {
  const [state, formAction, pending] = useActionState(setMemberPinAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <div className="member-pin-block">
      <form ref={formRef} action={formAction} className="pin-form">
        <input type="hidden" name="member_id" value={member.id} />
        <input
          name="access_pin"
          type="password"
          inputMode="numeric"
          placeholder={member.role === "admin" ? "Spieler-PIN" : "Neue PIN"}
          aria-label={`Neue Spieler-PIN für ${member.display_name}`}
          disabled={disabled || pending}
          minLength={4}
          required
        />
        <button className="ghost-button" type="submit" disabled={disabled || pending}>
          {pending ? "..." : "PIN"}
        </button>
      </form>

      {state.status === "success" ? (
        <p className="member-pin-message success" role="status">
          <CheckCircle2 size={16} aria-hidden="true" />
          {state.message}
        </p>
      ) : null}

      {state.status === "error" ? (
        <p className="member-pin-message error" role="alert">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
