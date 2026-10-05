"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { CheckCircle2, CircleAlert, LoaderCircle } from "lucide-react";
import type { BookingFeedback } from "@/app/actions";

export function FeedbackForm({ action, children, className, onSuccess }: {
  action: (previous: BookingFeedback, form: FormData) => Promise<BookingFeedback>;
  children: ReactNode; className?: string; onSuccess?: () => void;
}) {
  const [requestId, setRequestId] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const submitting = useRef(false);
  const allowReset = useRef(false);
  const [state, submit, pending] = useActionState(async (previous: BookingFeedback, data: FormData) => {
    try { return await action(previous, data); }
    catch { return { status: "error" as const, message: "Speichern konnte nicht bestätigt werden. Bitte erneut versuchen." }; }
  }, { status: "idle" as const, message: "" });

  useEffect(() => { setRequestId(crypto.randomUUID()); }, []);
  useEffect(() => {
    if (pending || state.status === "idle") return;
    submitting.current = false;
    if (state.status === "success") {
      allowReset.current = true;
      form.current?.reset();
      allowReset.current = false;
      setRequestId(crypto.randomUUID());
      onSuccess?.();
    }
  }, [state, pending]);

  return (
    <form ref={form} action={submit} className={className} aria-busy={pending}
      onSubmit={(event) => {
        if (submitting.current || !requestId) { event.preventDefault(); return; }
        submitting.current = true;
      }}
      onReset={(event) => { if (!allowReset.current) event.preventDefault(); }}>
      <input type="hidden" name="booking_request_id" value={requestId} />
      <fieldset className="feedback-fields" disabled={pending || !requestId} aria-label="Buchungseingabe">{children}</fieldset>
      {pending || state.message ? (
        <p className={`booking-feedback ${pending ? "pending" : state.status}`} role={state.status === "error" && !pending ? "alert" : "status"}>
          {pending ? <LoaderCircle size={17} className="saving-spinner" /> : state.status === "success" ? <CheckCircle2 size={17} /> : <CircleAlert size={17} />}
          {pending ? "Wird gespeichert…" : state.message}
        </p>
      ) : null}
    </form>
  );
}
