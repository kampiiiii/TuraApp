import { Plus } from "lucide-react";
import { createMemberAction } from "@/app/actions";
import type { TeamMember } from "@/lib/types";

export function MemberManager({ members, disabled = false }: { members: TeamMember[]; disabled?: boolean }) {
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
          <span key={member.id} className="member-chip">
            {member.jersey_number ? <strong>#{member.jersey_number}</strong> : null}
            {member.display_name}
            <small>{member.role === "admin" ? "Admin" : "Spieler"}</small>
          </span>
        ))}
      </div>
    </section>
  );
}
