"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Ban, CalendarRange, ExternalLink } from "lucide-react";
import { voidTreasuryEntryAction } from "@/app/actions";
import { formatMoney } from "@/lib/money";
import type { Team, TreasuryBookEntry } from "@/lib/types";

const LAST_TWO_MONTHS = "last-two";
const ALL_MONTHS = "all";

export function TreasuryTable({
  entries,
  team,
  disabled = false
}: {
  entries: TreasuryBookEntry[];
  team: Team | null;
  disabled?: boolean;
}) {
  const monthOptions = useMemo(
    () => Array.from(new Set(entries.map((entry) => monthKey(entry.booking_date)).filter(Boolean))).sort().reverse(),
    [entries]
  );
  const [period, setPeriod] = useState(LAST_TWO_MONTHS);
  const latestMonths = useMemo(() => monthOptions.slice(0, 2), [monthOptions]);
  const visibleEntries = useMemo(() => {
    if (period === ALL_MONTHS) return entries;
    if (period === LAST_TWO_MONTHS) {
      return entries.filter((entry) => latestMonths.includes(monthKey(entry.booking_date)));
    }
    return entries.filter((entry) => monthKey(entry.booking_date) === period);
  }, [entries, latestMonths, period]);

  if (!entries.length) {
    return (
      <section className="empty-state compact">
        <h2>Noch keine Kassenbewegungen</h2>
        <p>Lege zuerst den aktuellen Kassenbestand fest.</p>
      </section>
    );
  }

  return (
    <section className="table-section treasury-book">
      <div className="section-title-row treasury-book-heading">
        <span>
          <h2>Kassenbuch</h2>
          <small>{visibleEntries.length} von {entries.length} Einträgen</small>
        </span>
        <label className="treasury-period-filter">
          <CalendarRange size={17} aria-hidden="true" />
          <select value={period} onChange={(event) => setPeriod(event.target.value)} aria-label="Zeitraum auswählen">
            <option value={LAST_TWO_MONTHS}>Letzte 2 Monate</option>
            {monthOptions.map((month) => (
              <option value={month} key={month}>
                {formatMonth(month)}
              </option>
            ))}
            <option value={ALL_MONTHS}>Alle Buchungen</option>
          </select>
        </label>
      </div>

      {visibleEntries.length ? (
        <div className="table-wrap">
          <table className="responsive-table treasury-book-table">
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
              {visibleEntries.map((entry) => (
                <tr key={`${entry.source}-${entry.id}`}>
                  <td className="treasury-date" data-label="Datum">{formatDate(entry.booking_date)}</td>
                  <td className="treasury-type" data-label="Art">{labelForType(entry.type)}</td>
                  <td className="treasury-description" data-label="Beschreibung" data-wide="true">
                    <span className="stacked-cell">
                      <strong>{entry.description}</strong>
                      {entry.notes ? <small>{entry.notes}</small> : null}
                    </span>
                  </td>
                  <td className={`treasury-member${entry.member_name ? "" : " empty"}`} data-label="Spieler">
                    {entry.member_name ?? "-"}
                  </td>
                  <td className="treasury-amount" data-label="Betrag">
                    <strong className={entry.amount_cents < 0 ? "cash-amount expense" : "cash-amount income"}>
                      {formatMoney(entry.amount_cents, team?.currency)}
                    </strong>
                  </td>
                  <td className="treasury-status" data-label="Status">{statusForEntry(entry)}</td>
                  <td className="treasury-actions" data-label="Aktion" data-wide="true">
                    {entry.source === "manual" ? (
                      <span className="ledger-actions">
                        {entry.status !== "voided" ? (
                          <form action={voidTreasuryEntryAction} className="inline-action">
                            <input type="hidden" name="entry_id" value={entry.id} />
                            <button
                              className="icon-button danger"
                              type="submit"
                              title="Eintrag stornieren"
                              aria-label="Eintrag stornieren"
                              disabled={disabled}
                            >
                              <Ban size={16} />
                            </button>
                          </form>
                        ) : null}
                      </span>
                    ) : (
                      <Link
                        className="icon-button"
                        href="/buchungen"
                        title="Spielerzahlung in den Buchungen anzeigen"
                        aria-label="Spielerzahlung in den Buchungen anzeigen"
                      >
                        <ExternalLink size={16} />
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="treasury-period-empty">Für diesen Zeitraum sind keine Buchungen vorhanden.</p>
      )}
    </section>
  );
}

function monthKey(date: string) {
  const match = /^(\d{4})-(\d{2})/.exec(date);
  return match ? `${match[1]}-${match[2]}` : "";
}

function formatMonth(monthKeyValue: string) {
  const [year, month] = monthKeyValue.split("-").map(Number);
  return new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, 1))
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
