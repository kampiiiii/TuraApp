import { Ban, Check, RotateCcw } from "lucide-react";
import { setInKindCompletionAction, voidLedgerEntryAction } from "@/app/actions";
import { formatMoney } from "@/lib/money";
import type { LedgerEntry, Team } from "@/lib/types";
import { StatusPill } from "@/components/status-pill";
import { DeleteLedgerEntryButton } from "@/components/delete-ledger-entry-button";

export function LedgerTable({
  entries,
  team,
  canVoid = false,
  disabled = false
}: {
  entries: LedgerEntry[];
  team: Team | null;
  canVoid?: boolean;
  disabled?: boolean;
}) {
  if (!entries.length) {
    return (
      <section className="empty-state compact">
        <h2>Noch keine Buchungen</h2>
        <p>Sobald der Kassenwart etwas eintraegt, erscheint es hier.</p>
      </section>
    );
  }

  return (
    <section className="table-section">
      <div className="section-title-row">
        <h2>Buchungshistorie</h2>
        <span>{entries.length} Eintraege</span>
      </div>
      <div className="table-wrap">
        <table className="responsive-table">
          <thead>
            <tr>
              <th>Datum</th>
              <th>Spieler</th>
              <th>Art</th>
              <th>Beschreibung</th>
              <th>Menge</th>
              <th>Betrag</th>
              <th>Status</th>
              {canVoid ? <th>Aktion</th> : null}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td data-label="Datum">{formatDate(entry.booking_date)}</td>
                <td data-label="Spieler">{entry.member_name}</td>
                <td data-label="Art">{labelForType(entry.type)}</td>
                <td data-label="Beschreibung" data-wide="true">
                  <span className="stacked-cell">
                    <strong>{entry.description}</strong>
                    {entry.notes ? <small>{entry.notes}</small> : null}
                    {entry.source === "player" ? <small className="booking-source">Vom Spieler selbst gebucht</small> : null}
                    {entry.source === "system" ? <small className="booking-source">Automatisch gebucht</small> : null}
                    {entry.in_kind_label ? (
                      <small className={entry.in_kind_completed_at ? "in-kind-entry-state completed" : "in-kind-entry-state open"}>
                        Sachleistung: {entry.in_kind_label} ({entry.in_kind_completed_at ? "mitgebracht" : "offen"})
                      </small>
                    ) : null}
                    {entry.void_reason ? <small>Storno: {entry.void_reason}</small> : null}
                  </span>
                </td>
                <td data-label="Menge">{entry.quantity}</td>
                <td data-label="Betrag">
                  <span className="stacked-cell">
                    <strong>{formatMoney(entry.total_amount_cents, team?.currency)}</strong>
                    {entry.status === "partial" ? (
                      <small>Noch offen: {formatMoney(entry.total_amount_cents - entry.settled_amount_cents, team?.currency)}</small>
                    ) : null}
                  </span>
                </td>
                <td data-label="Status">
                  <StatusPill status={entry.status} />
                </td>
                {canVoid ? (
                  <td data-label="Aktion" data-wide="true">
                    <span className="ledger-actions">
                      {entry.in_kind_label && entry.status !== "voided" ? (
                        <form action={setInKindCompletionAction} className="inline-action">
                          <input type="hidden" name="entry_id" value={entry.id} />
                          <input type="hidden" name="completed" value={entry.in_kind_completed_at ? "false" : "true"} />
                          <button
                            className="icon-button"
                            type="submit"
                            title={entry.in_kind_completed_at ? "Sachleistung wieder oeffnen" : "Sachleistung abhaken"}
                            disabled={disabled}
                          >
                            {entry.in_kind_completed_at ? <RotateCcw size={16} /> : <Check size={16} />}
                          </button>
                        </form>
                      ) : null}
                      {entry.status !== "voided" ? (
                        <form action={voidLedgerEntryAction} className="inline-action">
                          <input type="hidden" name="entry_id" value={entry.id} />
                          <input type="hidden" name="void_reason" value="Fehleintrag storniert" />
                          <button className="icon-button danger" type="submit" title="Buchung stornieren" disabled={disabled}>
                            <Ban size={16} />
                          </button>
                        </form>
                      ) : null}
                      <DeleteLedgerEntryButton entryId={entry.id} disabled={disabled} />
                    </span>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function labelForType(type: LedgerEntry["type"]) {
  if (type === "fine") return "Strafe";
  if (type === "drink") return "Getraenk";
  if (type === "fee") return "Beitrag";
  if (type === "interest") return "Zinsen";
  if (type === "payment") return "Zahlung";
  return "Anpassung";
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("de-DE").format(new Date(date));
}
