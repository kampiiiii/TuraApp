import { Ban } from "lucide-react";
import { voidLedgerEntryAction } from "@/app/actions";
import { formatMoney } from "@/lib/money";
import type { LedgerEntry, Team } from "@/lib/types";
import { StatusPill } from "@/components/status-pill";

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
        <table>
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
                <td>{formatDate(entry.booking_date)}</td>
                <td>{entry.member_name}</td>
                <td>{labelForType(entry.type)}</td>
                <td>
                  <span className="stacked-cell">
                    <strong>{entry.description}</strong>
                    {entry.notes ? <small>{entry.notes}</small> : null}
                    {entry.void_reason ? <small>Storno: {entry.void_reason}</small> : null}
                  </span>
                </td>
                <td>{entry.quantity}</td>
                <td>{formatMoney(entry.total_amount_cents, team?.currency)}</td>
                <td>
                  <StatusPill status={entry.status} />
                </td>
                {canVoid ? (
                  <td>
                    {entry.status !== "voided" ? (
                      <form action={voidLedgerEntryAction} className="inline-action">
                        <input type="hidden" name="entry_id" value={entry.id} />
                        <input type="hidden" name="void_reason" value="Fehleintrag storniert" />
                        <button className="icon-button danger" type="submit" title="Buchung stornieren" disabled={disabled}>
                          <Ban size={16} />
                        </button>
                      </form>
                    ) : (
                      <span className="muted">-</span>
                    )}
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
  if (type === "payment") return "Zahlung";
  return "Anpassung";
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("de-DE").format(new Date(date));
}
