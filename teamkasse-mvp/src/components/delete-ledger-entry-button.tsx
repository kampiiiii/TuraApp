"use client";

import { Trash2 } from "lucide-react";
import { deleteLedgerEntryAction } from "@/app/actions";

export function DeleteLedgerEntryButton({ entryId, disabled = false }: { entryId: string; disabled?: boolean }) {
  return (
    <form
      action={deleteLedgerEntryAction}
      className="inline-action"
      onSubmit={(event) => {
        const confirmed = window.confirm(
          "Buchung dauerhaft loeschen? Sie verschwindet vollstaendig und kann nicht wiederhergestellt werden."
        );
        if (!confirmed) event.preventDefault();
      }}
    >
      <input type="hidden" name="entry_id" value={entryId} />
      <input type="hidden" name="confirm_delete" value="permanent" />
      <button className="icon-button permanent-delete" type="submit" title="Buchung dauerhaft loeschen" disabled={disabled}>
        <Trash2 size={16} />
      </button>
    </form>
  );
}
