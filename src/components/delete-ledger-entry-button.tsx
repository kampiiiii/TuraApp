"use client";

import { Ban } from "lucide-react";
import { deleteLedgerEntryAction } from "@/app/actions";

export function DeleteLedgerEntryButton({ entryId, disabled = false }: { entryId: string; disabled?: boolean }) {
  return (
    <form
      action={deleteLedgerEntryAction}
      className="inline-action"
      onSubmit={(event) => {
        const confirmed = window.confirm(
          "Buchung stornieren? Der Eintrag bleibt in der Historie sichtbar."
        );
        if (!confirmed) event.preventDefault();
      }}
    >
      <input type="hidden" name="entry_id" value={entryId} />
      <input type="hidden" name="confirm_delete" value="permanent" />
      <button className="icon-button danger" type="submit" title="Buchung stornieren" disabled={disabled}>
        <Ban size={16} />
      </button>
    </form>
  );
}
