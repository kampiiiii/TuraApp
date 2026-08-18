"use client";

import { Trash2 } from "lucide-react";
import { deleteRecurringPlanAction } from "@/app/actions";

export function DeleteRecurringPlanButton({ planId, disabled = false }: { planId: string; disabled?: boolean }) {
  return (
    <form
      action={deleteRecurringPlanAction}
      className="inline-action"
      onSubmit={(event) => {
        const confirmed = window.confirm(
          "Monatliche Regel loeschen? Bereits erzeugte Buchungen bleiben in der Historie erhalten."
        );
        if (!confirmed) event.preventDefault();
      }}
    >
      <input type="hidden" name="plan_id" value={planId} />
      <input type="hidden" name="confirm_delete" value="delete-recurring-plan" />
      <button className="icon-button permanent-delete" type="submit" title="Regel loeschen" disabled={disabled}>
        <Trash2 size={16} />
      </button>
    </form>
  );
}
