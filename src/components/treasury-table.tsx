import Link from "next/link";
import { Ban, ExternalLink } from "lucide-react";
import { voidTreasuryEntryAction } from "@/app/actions";
import { DeleteTreasuryEntryButton } from "@/components/delete-treasury-entry-button";
import { formatMoney } from "@/lib/money";
import type { Team, TreasuryBookEntry } from "@/lib/types";

export function TreasuryTable({
  entries,
  team,
  disabled = false
}: {
  entries: TreasuryBookEntry[];
  team: Team | null;
  disabled?: boolean;
}) {
  if (!entries.length) {
    return (
      <section className="empty-state compact">
        <h2>Noch keine Kassenbewegungen</h2>
        <p>Lege zuerst den aktuellen Kassenbestand fest.</p>
      </section>
    );
  }

  return (
    <section className="table-section">
      <div className="section-title-row">
        <h2>Kassenbuch</h2>
        <span>{entries.length} Eintraege</span>
      </div>
      <div className="table-wrap">
        <table className="responsive-table">
          <thead>
            <tr>
              <th>Datum</th>
              <th>Art</th>
              <th>Beschreibung</th>
              <th>Spieler</th>
              <th>Betrag</th>
              <th>Status</th>
              <th>Aktion</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={`${entry.source}-${entry.id}`}>
                <td data-label="Datum">{formatDate(entry.booking_date)}</td>
                <td data-label="Art">{labelForType(entry.type)}</td>
                <td data-label="Beschreibung" data-wide="true">
                  <span className="stacked-cell">
                    <strong>{entry.description}</strong>
                    {entry.notes ? <small>{entry.notes}</small> : null}
                  </span>
                </td>
                <td data-label="Spieler">{entry.member_name ?? "-"}</td>
                <td data-label="Betrag">
                  <strong className={entry.amount_cents < 0 ? "cash-amount expense" : "cash-amount income"}>
                    {formatMoney(entry.amount_cents, team?.currency)}
                  </strong>
                </td>
                <td data-label="Status">{statusForEntry(entry)}</td>
                <td data-label="Aktion" data-wide="true">
                  {entry.source === "manual" ? (
                    <span className="ledger-actions">
                      {entry.status !== "voided" ? (
                        <form action={voidTreasuryEntryAction} className="inline-action">
                          <input type="hidden" name="entry_id" value={entry.id} />
                          <button className="icon-button danger" type="submit" title="Eintrag stornieren" disabled={disabled}>
                            <Ban size={16} />
                          </button>
                        </form>
                      ) : null}
                      <DeleteTreasuryEntryButton entryId={entry.id} disabled={disabled} />
                    </span>
                  ) : (
                    <Link className="icon-button" href="/buchungen" title="Spielerzahlung in den Buchungen anzeigen">
                      <ExternalLink size={16} />
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function labelForType(type: TreasuryBookEntry["type"]) {
  if (type === "balance") return "Bestand";
  if (type === "income") return "Einnahme";
  if (type === "expense") return "Ausgabe";
  return "Spielerzahlung";
}

function statusForEntry(entry: TreasuryBookEntry) {
  if (entry.status === "voided") {
    return <span className="status-pill voided">Storniert</span>;
  }

  if (!entry.included_in_balance) {
    return <span className="status-pill partial">Vor Bestand</span>;
  }

  return <span className="status-pill paid">Gebucht</span>;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("de-DE").format(new Date(date));
}
