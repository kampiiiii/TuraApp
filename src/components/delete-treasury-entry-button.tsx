"use client";

import { Trash2 } from "lucide-react";
import { deleteTreasuryEntryAction } from "@/app/actions";

export function DeleteTreasuryEntryButton({ entryId, disabled = false }: { entryId: string; disabled?: boolean }) {
  return (
    <form
      action={deleteTreasuryEntryAction}
      className="inline-action"
      onSubmit={(event) => {
        const confirmed = window.confirm(
          "Kassenbucheintrag dauerhaft loeschen? Er kann danach nicht wiederhergestellt werden."
        );
        if (!confirmed) event.preventDefault();
      }}
    >
      <input type="hidden" name="entry_id" value={entryId} />
      <input type="hidden" name="confirm_delete" value="delete-treasury-entry" />
      <button className="icon-button permanent-delete" type="submit" title="Eintrag dauerhaft loeschen" disabled={disabled}>
        <Trash2 size={16} />
      </button>
    </form>
  );
}
