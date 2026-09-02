"use client";

import { Ban } from "lucide-react";
import { deleteTreasuryEntryAction } from "@/app/actions";

export function DeleteTreasuryEntryButton({ entryId, disabled = false }: { entryId: string; disabled?: boolean }) {
  return (
    <form
      action={deleteTreasuryEntryAction}
      className="inline-action"
      onSubmit={(event) => {
        const confirmed = window.confirm(
          "Kassenbucheintrag stornieren? Der Eintrag bleibt im Kassenbuch sichtbar."
        );
        if (!confirmed) event.preventDefault();
      }}
    >
      <input type="hidden" name="entry_id" value={entryId} />
      <input type="hidden" name="confirm_delete" value="delete-treasury-entry" />
      <button className="icon-button danger" type="submit" title="Eintrag stornieren" disabled={disabled}>
        <Ban size={16} />
      </button>
    </form>
  );
}
