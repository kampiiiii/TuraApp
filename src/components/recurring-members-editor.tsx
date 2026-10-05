"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CalendarDays, Check, Search, Users, X } from "lucide-react";
import { updateRecurringMembersAction } from "@/app/actions";
import { berlinMonth, membershipAt, nextMonth } from "@/lib/recurring-memberships";
import type { RecurringPlan, TeamMember } from "@/lib/types";

export function RecurringMembersEditor({ plan, members, disabled = false }: {
  plan: RecurringPlan; members: TeamMember[]; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={trigger} className="icon-button" type="button" disabled={disabled}
        aria-label={`Teilnehmer bearbeiten: ${plan.name}`} title="Teilnehmer bearbeiten"
        onClick={() => { setSaved(false); setOpen(true); }}>
        <Users size={17} />
      </button>
      {saved ? <span className="recurring-saved" role="status"><Check size={14} /> Gespeichert</span> : null}
      {open ? <MembersDialog plan={plan} members={members} onClose={(success) => {
        setOpen(false); setSaved(success); trigger.current?.focus();
      }} /> : null}
    </>
  );
}

function MembersDialog({ plan, members, onClose }: {
  plan: RecurringPlan; members: TeamMember[]; onClose: (success: boolean) => void;
}) {
  const current = berlinMonth();
  const initialMonth = nextMonth(current) < plan.start_month ? plan.start_month : nextMonth(current);
  const [month, setMonth] = useState(initialMonth);
  const initial = membershipAt(plan, initialMonth);
  const [all, setAll] = useState(initial.applies_to_all);
  const [selected, setSelected] = useState(new Set(initial.member_ids));
  const [query, setQuery] = useState("");
  const [state, action, pending] = useActionState(updateRecurringMembersAction, { status: "idle" as const, message: "" });
  const dialog = useRef<HTMLDialogElement>(null);
  const players = members.filter((member) => member.active && member.role === "player")
    .sort((a, b) => a.display_name.localeCompare(b.display_name, "de"));
  const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("de").replace(/ß/g, "ss");
  const visible = players.filter((member) => normalize(member.display_name).includes(normalize(query.trim())));
  const chosen = players.filter((member) => selected.has(member.id));

  useEffect(() => {
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);

  useEffect(() => {
    if (state.status === "success") { dialog.current?.close(); onClose(true); }
  }, [state.status, onClose]);

  const close = () => {
    if (!pending) { dialog.current?.close(); onClose(false); }
  };

  return (
    <dialog ref={dialog} className="recurring-editor-dialog" aria-labelledby="recurring-editor-title"
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
      <form action={action} className="recurring-editor-form">
        <header className="recurring-editor-header">
          <span className="recurring-editor-symbol"><Users size={22} /></span>
          <div><h2 id="recurring-editor-title">Teilnehmer bearbeiten</h2><p>{plan.name}</p></div>
          <button className="icon-button" type="button" aria-label="Schließen" disabled={pending} onClick={close}><X size={20} /></button>
        </header>
        <input type="hidden" name="plan_id" value={plan.id} />
        {chosen.map((member) => <input key={member.id} type="hidden" name="member_ids" value={member.id} />)}
        <div className="recurring-editor-body">
          <label className="recurring-effective-month"><span><CalendarDays size={16} /> Gültig ab</span>
            <input name="effective_month" type="month" value={month} required disabled={pending}
              min={current < plan.start_month ? plan.start_month : current}
              onChange={(event) => {
                const value = event.target.value;
                setMonth(value);
                if (value) { const selection = membershipAt(plan, value); setAll(selection.applies_to_all); setSelected(new Set(selection.member_ids)); }
              }} />
          </label>
          <label className="recurring-editor-all"><input name="applies_to_all" type="checkbox" checked={all}
            disabled={pending} onChange={(event) => setAll(event.target.checked)} /> Alle aktiven Spieler</label>
          <div className="recurring-editor-search">
            <Search size={18} />
            <input type="search" aria-label="Spieler suchen" placeholder="Spieler suchen" value={query}
              onChange={(event) => setQuery(event.target.value)} disabled={pending} />
            <span>{all ? players.length : chosen.length} / {players.length}</span>
          </div>
          <div className="recurring-editor-players">
            {visible.map((member) => (
              <label className="recurring-editor-player" key={member.id}>
                <input type="checkbox" aria-label={member.display_name} checked={all || selected.has(member.id)} disabled={pending}
                  onChange={(event) => {
                    const selection = new Set(all ? players.map((player) => player.id) : selected);
                    if (event.target.checked) selection.add(member.id); else selection.delete(member.id);
                    setAll(false); setSelected(selection);
                  }} />
                <span>{member.display_name}</span>
                {member.jersey_number != null ? <small>#{member.jersey_number}</small> : null}
              </label>
            ))}
            {!visible.length ? <p className="muted">Keine Spieler gefunden.</p> : null}
          </div>
          {state.status === "error" ? <p className="recurring-editor-error" role="alert">{state.message}</p> : null}
        </div>
        <footer className="recurring-editor-footer">
          <span>{all ? "Alle aktiven Spieler" : `${chosen.length} ausgewählte Spieler`}<small>Ab {month || "…"}</small></span>
          <button className="ghost-button" type="button" onClick={close} disabled={pending}>Abbrechen</button>
          <button className="primary-button" type="submit" disabled={pending || !month}><Check size={17} />{pending ? "Speichert…" : "Speichern"}</button>
        </footer>
      </form>
    </dialog>
  );
}
