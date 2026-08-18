import { Plus, Save } from "lucide-react";
import { createMemberAction, updateMemberRoleAction } from "@/app/actions";
import { DeleteMemberButton } from "@/components/delete-member-button";
import { MemberPinForm } from "@/components/member-pin-form";
import type { TeamMember } from "@/lib/types";

export function MemberManager({
  members,
  currentMemberId,
  disabled = false
}: {
  members: TeamMember[];
  currentMemberId?: string;
  disabled?: boolean;
}) {
  return (
    <section className="admin-panel">
      <div className="section-title-row">
        <h2>Spieler verwalten</h2>
        <span>{members.length} Mitglieder</span>
      </div>

      <form action={createMemberAction} className="form-grid">
        <label>
          Name
          <input name="display_name" placeholder="Vorname Nachname" disabled={disabled} required />
        </label>
        <label>
          Rueckennummer
          <input name="jersey_number" type="number" min="1" placeholder="9" disabled={disabled} />
        </label>
        <label>
          Start-PIN
          <input name="access_pin" type="password" inputMode="numeric" placeholder="z. B. 1234" disabled={disabled} />
        </label>
        <label>
          Rolle
          <select name="role" defaultValue="player" disabled={disabled}>
            <option value="player">Spieler</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button className="primary-button align-end" type="submit" disabled={disabled}>
          <Plus size={16} />
          Spieler
        </button>
      </form>

      <div className="member-list">
        {members.map((member) => (
          <article key={member.id} className="member-chip">
            <div className="member-heading">
              <span>
                {member.jersey_number ? <strong>#{member.jersey_number} </strong> : null}
                {member.display_name}
              </span>
              <small>{member.id === currentMemberId ? "Aktuelles Konto" : member.role === "admin" ? "Admin" : "Spieler"}</small>
            </div>

            <form action={updateMemberRoleAction} className="member-role-form">
              <input type="hidden" name="member_id" value={member.id} />
              <label>
                Rolle
                <select name="role" defaultValue={member.role} disabled={disabled || member.id === currentMemberId}>
                  <option value="player">Spieler</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <button
                className="icon-button align-end"
                type="submit"
                title="Rolle speichern"
                aria-label="Rolle speichern"
                disabled={disabled || member.id === currentMemberId}
              >
                <Save size={16} />
              </button>
            </form>

            <MemberPinForm member={member} disabled={disabled} />

            <DeleteMemberButton
              memberId={member.id}
              memberName={member.display_name}
              disabled={disabled || member.id === currentMemberId}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
