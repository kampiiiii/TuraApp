import { CalendarClock, Pause, Play } from "lucide-react";
import { createRecurringPlanAction, toggleRecurringPlanAction } from "@/app/actions";
import { DeleteRecurringPlanButton } from "@/components/delete-recurring-plan-button";
import { formatMoney } from "@/lib/money";
import type { RecurringPlan, Team, TeamMember } from "@/lib/types";

export function RecurringPlanManager({
  plans,
  members,
  team,
  disabled = false
}: {
  plans: RecurringPlan[];
  members: TeamMember[];
  team: Team | null;
  disabled?: boolean;
}) {
  const players = members.filter((member) => member.active && member.role === "player");

  return (
    <section className="recurring-panel">
      <div className="section-title-row">
        <h2>Neue Monatsregel</h2>
        <span>Beitrag oder Getraenkeflat</span>
      </div>

      <form action={createRecurringPlanAction} className="recurring-form">
        <label>
          Name
          <input name="name" placeholder="Monatsbeitrag" disabled={disabled} required />
        </label>

        <label>
          Art
          <select name="ledger_type" defaultValue="fee" disabled={disabled}>
            <option value="fee">Monatsbeitrag</option>
            <option value="drink">Getraenkeflat</option>
          </select>
        </label>

        <label>
          Betrag
          <input name="amount" inputMode="decimal" placeholder="0,00" disabled={disabled} required />
        </label>

        <label>
          Buchungstag
          <input name="due_day" type="number" min="1" max="28" defaultValue="1" disabled={disabled} required />
        </label>

        <label>
          Startmonat
          <input name="start_month" type="month" defaultValue={currentMonth()} disabled={disabled} required />
        </label>

        <label>
          Jahreszins nach 30 Tagen (optional)
          <input name="annual_interest_rate" inputMode="decimal" placeholder="z. B. 6,50" disabled={disabled} />
        </label>

        <fieldset className="recurring-members span-2">
          <legend>Spieler</legend>
          <label className="checkbox-row recurring-all">
            <input name="applies_to_all" type="checkbox" defaultChecked disabled={disabled} />
            Alle aktiven Spieler
          </label>
          <div className="recurring-member-grid">
            {players.map((member) => (
              <label className="checkbox-row" key={member.id}>
                <input name="member_ids" type="checkbox" value={member.id} disabled={disabled} />
                {member.display_name}
              </label>
            ))}
          </div>
        </fieldset>

        <button className="primary-button align-end" type="submit" disabled={disabled || players.length === 0}>
          <CalendarClock size={16} />
          Regel anlegen
        </button>
      </form>

      <div className="recurring-list">
        <div className="section-title-row">
          <h2>Monatsregeln</h2>
          <span>{plans.length} Regeln</span>
        </div>
        {plans.length ? (
          plans.map((plan) => (
            <div className="recurring-row" key={plan.id}>
              <span className="recurring-row-icon">
                <CalendarClock size={18} />
              </span>
              <span className="recurring-row-main">
                <strong>{plan.name}</strong>
                <small>
                  {plan.ledger_type === "drink" ? "Getraenkeflat" : "Monatsbeitrag"} | Tag {plan.due_day} | ab {formatMonth(plan.start_month)}
                </small>
                <small>
                  {plan.applies_to_all ? "Alle Spieler" : `${plan.member_ids.length} ausgewaehlte Spieler`}
                  {plan.annual_interest_rate_bps > 0
                    ? ` | ${(plan.annual_interest_rate_bps / 100).toLocaleString("de-DE")} % p.a. nach 30 Tagen`
                    : " | Keine Zinsen"}
                </small>
              </span>
              <strong className="recurring-amount">{formatMoney(plan.amount_cents, team?.currency)}</strong>
              <span className={plan.active ? "status-pill paid" : "status-pill voided"}>
                {plan.active ? "Aktiv" : "Pausiert"}
              </span>
              <span className="ledger-actions">
                <form action={toggleRecurringPlanAction} className="inline-action">
                  <input type="hidden" name="plan_id" value={plan.id} />
                  <button
                    className="icon-button"
                    type="submit"
                    title={plan.active ? "Regel pausieren" : "Regel aktivieren"}
                    disabled={disabled}
                  >
                    {plan.active ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                </form>
                <DeleteRecurringPlanButton planId={plan.id} disabled={disabled} />
              </span>
            </div>
          ))
        ) : (
          <p className="muted">Noch keine monatliche Regel angelegt.</p>
        )}
      </div>
    </section>
  );
}

function currentMonth() {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit"
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  return `${year}-${month}`;
}

function formatMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" }).format(
    new Date(Date.UTC(year, monthNumber - 1, 1))
  );
}
