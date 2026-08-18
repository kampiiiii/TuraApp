"use client";

import { Trash2 } from "lucide-react";
import { deleteMemberAction } from "@/app/actions";

export function DeleteMemberButton({
  memberId,
  memberName,
  disabled = false
}: {
  memberId: string;
  memberName: string;
  disabled?: boolean;
}) {
  return (
    <form
      action={deleteMemberAction}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `${memberName} wirklich loeschen? Der Zugang wird entfernt. Vorhandene Buchungen bleiben in der Historie.`
        );
        if (!confirmed) event.preventDefault();
      }}
    >
      <input type="hidden" name="member_id" value={memberId} />
      <input type="hidden" name="confirm_delete" value="delete-member" />
      <button className="ghost-button member-delete-button" type="submit" disabled={disabled}>
        <Trash2 size={16} />
        Loeschen
      </button>
    </form>
  );
}
