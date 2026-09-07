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
  const label = `${memberName} löschen`;

  return (
    <form
      action={deleteMemberAction}
      className="member-delete-form"
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `${memberName} wirklich löschen? Der Zugang wird entfernt. Vorhandene Buchungen bleiben in der Historie.`
        );
        if (!confirmed) event.preventDefault();
      }}
    >
      <input type="hidden" name="member_id" value={memberId} />
      <input type="hidden" name="confirm_delete" value="delete-member" />
      <button className="icon-button danger member-delete-button" type="submit" title={label} aria-label={label} disabled={disabled}>
        <Trash2 size={16} />
      </button>
    </form>
  );
}
