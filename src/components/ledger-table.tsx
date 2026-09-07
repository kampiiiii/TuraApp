import { LedgerEntryMenu } from "@/components/ledger-entry-menu";
import { StatusPill } from "@/components/status-pill";
import { formatMoney } from "@/lib/money";
import type { CatalogItem, LedgerEntry, Team, TeamMember } from "@/lib/types";

export function LedgerTable({
  entries,
  team,
  members = [],
  catalog = [],
  canVoid = false,
  disabled = false
}: {
  entries: LedgerEntry[];
  team: Team | null;
  members?: TeamMember[];
  catalog?: CatalogItem[];
  canVoid?: boolean;
  disabled?: boolean;
}) {
  if (!entries.length) {
    return (
      <section className="empty-state compact">
        <h2>Noch keine Buchungen</h2>
        <p>Sobald der Kassenwart etwas einträgt, erscheint es hier.</p>
      </section>
    );
  }

  return (
    <section className="table-section">
      <div className="section-title-row">
        <h2>Buchungshistorie</h2>
        <span>{entries.length} Einträge</span>
      </div>
      <div className="table-wrap">
        <table className="responsive-table ledger-booking-table">
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
                <td className="ledger-date" data-label="Datum">{formatDate(entry.booking_date)}</td>
                <td className="ledger-member" data-label="Spieler">{entry.member_name}</td>
                <td className="ledger-type" data-label="Art">{labelForType(entry.type)}</td>
                <td className="ledger-description" data-label="Beschreibung" data-wide="true">
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
                    {entry.voided_at || entry.voided_by_name ? (
                      <small>
                        Storniert {entry.voided_at ? `am ${formatDate(entry.voided_at)}` : ""}
                        {entry.voided_by_name ? ` durch ${entry.voided_by_name}` : ""}
                      </small>
                    ) : null}
                    {entry.correction_of ? <small>Korrektur zu vorheriger Buchung</small> : null}
                  </span>
                </td>
                <td className="ledger-quantity" data-label="Menge">{entry.quantity}×</td>
                <td className="ledger-amount" data-label="Betrag">
                  <span className="stacked-cell">
                    <strong>{formatMoney(entry.total_amount_cents, team?.currency)}</strong>
                    {entry.status === "partial" ? (
                      <small>Noch offen: {formatMoney(entry.total_amount_cents - entry.settled_amount_cents, team?.currency)}</small>
                    ) : null}
                  </span>
                </td>
                <td className="ledger-status" data-label="Status">
                  <StatusPill status={entry.status} />
                </td>
                {canVoid ? (
                  <td className="ledger-menu-cell" data-label="Aktion" data-wide="true">
                    <LedgerEntryMenu entry={entry} members={members} catalog={catalog} team={team} disabled={disabled} />
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
  if (type === "drink") return "Getränk";
  if (type === "fee") return "Beitrag";
  if (type === "interest") return "Zinsen";
  if (type === "payment") return "Zahlung";
  return "Anpassung";
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("de-DE").format(new Date(date));
}
