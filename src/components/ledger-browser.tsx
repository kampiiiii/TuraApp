"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { LedgerTable } from "@/components/ledger-table";
import { DEFAULT_LEDGER_FILTERS, filterLedger, paginateLedger, type LedgerFilters } from "@/lib/ledger-filters";
import type { CatalogItem, LedgerEntry, Team, TeamMember } from "@/lib/types";

export function LedgerBrowser({ entries, team, members, catalog, canVoid, disabled }: {
  entries: LedgerEntry[];
  team: Team | null;
  members: TeamMember[];
  catalog: CatalogItem[];
  canVoid: boolean;
  disabled: boolean;
}) {
  const [filters, setFilters] = useState<LedgerFilters>(DEFAULT_LEDGER_FILTERS);
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtered = useMemo(() => filterLedger(entries, filters), [entries, filters]);
  const result = paginateLedger(filtered, page);
  const players = useMemo(() => {
    const names = new Map(members.map((member) => [member.id, member.display_name]));
    entries.forEach((entry) => { if (!names.has(entry.member_id)) names.set(entry.member_id, entry.member_name); });
    return Array.from(names, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, "de"));
  }, [members, entries]);

  function updateFilters(next: Partial<LedgerFilters>) {
    setFilters((previous) => ({ ...previous, ...next }));
    setPage(1);
  }

  const activeFilters = [
    filters.memberId ? players.find((player) => player.id === filters.memberId)?.name ?? "Spieler" : "",
    filters.type === "all" ? "" : ({ fine: "Strafen", drink: "Getränke", payment: "Zahlungen", fee: "Beiträge", interest: "Zinsen", adjustment: "Anpassungen" })[filters.type],
    filters.status === "all" ? "" : ({ open: "Offen / teilbezahlt", partial: "Teilbezahlt", paid: "Bezahlt", voided: "Storniert" })[filters.status],
    filters.dateFrom ? `Ab ${filters.dateFrom.split("-").reverse().join(".")}` : "",
    filters.dateTo ? `Bis ${filters.dateTo.split("-").reverse().join(".")}` : "",
    filters.order === "oldest" ? "Älteste zuerst" : "",
    !filters.hideVoided && filters.status !== "voided" ? "Mit Stornierungen" : ""
  ].filter(Boolean);

  const filterFields = <>
        {canVoid ? (
          <label>Spieler<select value={filters.memberId} onChange={(event) => updateFilters({ memberId: event.target.value })}>
            <option value="">Alle Spieler</option>{players.map((player) => <option value={player.id} key={player.id}>{player.name}</option>)}
          </select></label>
        ) : null}
        <label>Buchungsart<select value={filters.type} onChange={(event) => updateFilters({ type: event.target.value as LedgerFilters["type"] })}>
          <option value="all">Alle Arten</option><option value="fine">Strafen</option><option value="drink">Getränke</option>
          <option value="payment">Zahlungen</option><option value="fee">Beiträge</option><option value="interest">Zinsen</option><option value="adjustment">Anpassungen</option>
        </select></label>
        <label>Status<select value={filters.status} onChange={(event) => {
          const status = event.target.value as LedgerFilters["status"];
          updateFilters({ status, ...(status === "voided" ? { hideVoided: false } : {}) });
        }}><option value="all">Alle Status</option><option value="open">Offen / teilbezahlt</option>
          <option value="partial">Teilbezahlt</option><option value="paid">Bezahlt</option><option value="voided">Storniert</option>
        </select></label>
        <label>Von<input type="date" value={filters.dateFrom} max={filters.dateTo || undefined} onChange={(event) => updateFilters({ dateFrom: event.target.value })} /></label>
        <label>Bis<input type="date" value={filters.dateTo} min={filters.dateFrom || undefined} onChange={(event) => updateFilters({ dateTo: event.target.value })} /></label>
        <label>Sortierung<select value={filters.order} onChange={(event) => updateFilters({ order: event.target.value as LedgerFilters["order"] })}>
          <option value="newest">Neueste zuerst</option><option value="oldest">Älteste zuerst</option>
        </select></label>
        <div className="booking-filter-actions">
          <label className="booking-void-toggle"><input type="checkbox" checked={filters.hideVoided} onChange={(event) => updateFilters({
            hideVoided: event.target.checked, ...(event.target.checked && filters.status === "voided" ? { status: "all" } : {})
          })} />Stornierte ausblenden</label>
          <button type="button" className="icon-button" title="Filter zurücksetzen" aria-label="Filter zurücksetzen"
            onClick={() => { setFilters(DEFAULT_LEDGER_FILTERS); setPage(1); }}><RotateCcw size={18} /></button>
        </div>
  </>;

  return (
    <div className="ledger-browser">
      <div className="booking-filters" role="search" aria-label="Buchungen filtern">
        <label className="booking-search">
          Suche
          <input type="search" placeholder="Spieler oder Buchungsgrund" value={filters.query}
            onChange={(event) => updateFilters({ query: event.target.value })} />
        </label>
        <button type="button" className="ghost-button mobile-filter-button" aria-haspopup="dialog" aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={18} />Filter{activeFilters.length ? ` (${activeFilters.length})` : ""}</button>
        <div className="booking-advanced">{filterFields}</div>
      </div>
      {activeFilters.length ? <div className="mobile-active-filters" aria-label="Aktive Filter">{activeFilters.map((label, index) => <span key={index}>{label}</span>)}</div> : null}
      {filtersOpen ? <ResponsiveDialog label="Buchungen filtern" className="filter-dialog" onClose={() => setFiltersOpen(false)}>
        <div className="mobile-dialog-heading"><h2>Filter</h2><button type="button" className="icon-button" aria-label="Schließen" onClick={() => setFiltersOpen(false)}><X size={20} /></button></div>
        <div className="filter-dialog-fields">{filterFields}</div>
        <div className="filter-dialog-actions">
          <button className="primary-button" type="button" onClick={() => setFiltersOpen(false)}>{filtered.length} Treffer anzeigen</button>
        </div>
      </ResponsiveDialog> : null}
      <div className="booking-results" role="status" aria-live="polite">
        {filtered.length ? `${result.start + 1}–${result.start + result.entries.length} von ${filtered.length} Treffern` : "Keine passenden Buchungen"}
        <span>{entries.length} Buchungen insgesamt</span>
      </div>
      {filtered.length ? (
        <LedgerTable entries={result.entries} team={team} members={members} catalog={catalog} canVoid={canVoid} disabled={disabled} />
      ) : <p className="booking-empty">Keine Buchungen für diese Filter.</p>}
      <nav className="booking-pagination" aria-label="Buchungsseiten">
        <button type="button" className="icon-button" title="Vorherige Seite" aria-label="Vorherige Seite"
          disabled={result.currentPage === 1} onClick={() => setPage(result.currentPage - 1)}><ChevronLeft size={20} /></button>
        <label>
          Seite
          <input aria-label="Buchungsseite" type="number" min={1} max={result.pageCount} value={result.currentPage}
            onChange={(event) => setPage(Math.min(result.pageCount, Math.max(1, Number(event.target.value) || 1)))} />
        </label>
        <span>von {result.pageCount}</span>
        <button type="button" className="icon-button" title="Nächste Seite" aria-label="Nächste Seite"
          disabled={result.currentPage === result.pageCount} onClick={() => setPage(result.currentPage + 1)}><ChevronRight size={20} /></button>
      </nav>
    </div>
  );
}
