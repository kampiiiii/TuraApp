"use client";

import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Banknote, Beer, ChevronDown, ClipboardList, Plus, Search, Users, X } from "lucide-react";
import { createBulkPaymentAction, createLedgerEntryAction } from "@/app/actions";
import { LedgerEntryMenu } from "@/components/ledger-entry-menu";
import { StatusPill } from "@/components/status-pill";
import { formatMoney, todayInputValue } from "@/lib/money";
import type { CatalogItem, LedgerEntry, MemberBalance, Team, TeamMember } from "@/lib/types";

type PlayerFilter = "all" | "open" | "fine" | "drink" | "paid";

export function MemberDashboard({
  balances,
  ledger,
  members,
  catalog,
  team,
  disabled = false
}: {
  balances: MemberBalance[];
  ledger: LedgerEntry[];
  members: TeamMember[];
  catalog: CatalogItem[];
  team: Team | null;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<PlayerFilter>("all");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [paymentMemberIds, setPaymentMemberIds] = useState<string[]>([]);
  const [showSettled, setShowSettled] = useState(false);

  const ledgerByMember = useMemo(() => groupLedgerByMember(ledger), [ledger]);
  const filteredBalances = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("de-DE");

    return balances
      .filter((balance) => {
        const memberEntries = ledgerByMember.get(balance.member_id) ?? [];
        const activeEntries = memberEntries.filter((entry) => entry.status !== "voided");
        const matchesQuery = !normalizedQuery || balance.display_name.toLocaleLowerCase("de-DE").includes(normalizedQuery);

        if (!matchesQuery) {
          return false;
        }

        if (filter === "open") return balance.amount_due_cents > 0;
        if (filter === "fine") return activeEntries.some((entry) => entry.type === "fine");
        if (filter === "drink") return activeEntries.some((entry) => entry.type === "drink");
        if (filter === "paid") {
          return balance.amount_due_cents === 0 && activeEntries.some((entry) => entry.type === "payment" || entry.status === "paid");
        }

        return true;
      })
      .sort(sortBalances);
  }, [balances, filter, ledgerByMember, query]);

  const openBalances = filteredBalances.filter((balance) => balance.amount_due_cents > 0);
  const settledBalances = filteredBalances.filter((balance) => balance.amount_due_cents <= 0);
  const paymentSelection = balances.filter((balance) => paymentMemberIds.includes(balance.member_id));
  const selectedBalance =
    filteredBalances.find((balance) => balance.member_id === selectedMemberId) ??
    balances.find((balance) => balance.member_id === selectedMemberId) ??
    null;
  const selectedMember = selectedBalance
    ? members.find((member) => member.id === selectedBalance.member_id) ?? null
    : null;
  const selectedEntries = selectedBalance ? ledgerByMember.get(selectedBalance.member_id) ?? [] : [];

  return (
    <section className="member-dashboard">
      <div className="member-dashboard-head">
        <span>
          <h2>Spieler</h2>
          <small>{balances.length} Konten</small>
        </span>
        {selectedBalance ? (
          <button className="ghost-button compact-button" type="button" onClick={() => setSelectedMemberId(null)}>
            <X size={16} />
            Detail schliessen
          </button>
        ) : null}
      </div>

      <div className="player-toolbar">
        <label className="player-search">
          <Search size={17} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Spieler suchen"
            aria-label="Spieler suchen"
          />
        </label>
        <div className="player-filters" aria-label="Spieler filtern">
          <label className="player-filter-select">
            Filter
            <select value={filter} onChange={(event) => setFilter(event.target.value as PlayerFilter)}>
              {playerFilters.map((item) => (
                <option value={item.value} key={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          {playerFilters.map((item) => (
            <button
              className={filter === item.value ? "filter-chip active" : "filter-chip"}
              type="button"
              onClick={() => setFilter(item.value)}
              key={item.value}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="player-dashboard-grid">
        <div className="player-list-panel">
          <BulkPaymentPanel
            balances={balances}
            selectedBalances={paymentSelection}
            selectedMemberIds={paymentMemberIds}
            setSelectedMemberIds={setPaymentMemberIds}
            team={team}
            disabled={disabled}
          />

          <PlayerRows
            balances={openBalances}
            ledgerByMember={ledgerByMember}
            selectedMemberId={selectedMemberId}
            onSelect={setSelectedMemberId}
            paymentMemberIds={paymentMemberIds}
            onTogglePayment={(memberId) => togglePaymentMember(memberId, setPaymentMemberIds)}
            members={members}
            catalog={catalog}
            team={team}
            disabled={disabled}
          />

          {settledBalances.length ? (
            <div className="settled-group">
              <button className="settled-toggle" type="button" onClick={() => setShowSettled((value) => !value)}>
                <span>Keine offenen Betraege</span>
                <span>
                  {settledBalances.length}
                  <ChevronDown size={17} className={showSettled ? "rotate" : ""} />
                </span>
              </button>
              {showSettled || filter === "paid" ? (
                <PlayerRows
                  balances={settledBalances}
                  ledgerByMember={ledgerByMember}
                  selectedMemberId={selectedMemberId}
                  onSelect={setSelectedMemberId}
                  paymentMemberIds={paymentMemberIds}
                  onTogglePayment={(memberId) => togglePaymentMember(memberId, setPaymentMemberIds)}
                  members={members}
                  catalog={catalog}
                  team={team}
                  disabled={disabled}
                  settled
                />
              ) : null}
            </div>
          ) : null}

          {!filteredBalances.length ? (
            <div className="empty-state compact">
              <h2>Keine Treffer</h2>
              <p>Suche oder Filter anpassen.</p>
            </div>
          ) : null}
        </div>

        <PlayerDetail
          balance={selectedBalance}
          member={selectedMember}
          entries={selectedEntries}
          members={members}
          catalog={catalog}
          team={team}
          disabled={disabled}
        />
      </div>
    </section>
  );
}

function PlayerRows({
  balances,
  ledgerByMember,
  selectedMemberId,
  onSelect,
  paymentMemberIds,
  onTogglePayment,
  members,
  catalog,
  team,
  disabled,
  settled = false
}: {
  balances: MemberBalance[];
  ledgerByMember: Map<string, LedgerEntry[]>;
  selectedMemberId: string | null;
  onSelect: (memberId: string) => void;
  paymentMemberIds: string[];
  onTogglePayment: (memberId: string) => void;
  members: TeamMember[];
  catalog: CatalogItem[];
  team: Team | null;
  disabled: boolean;
  settled?: boolean;
}) {
  return (
    <div className={settled ? "player-row-list settled" : "player-row-list"}>
      {balances.map((balance) => {
        const member = members.find((candidate) => candidate.id === balance.member_id) ?? null;
        const lastEntry = ledgerByMember.get(balance.member_id)?.[0] ?? null;

        return (
          <article className={selectedMemberId === balance.member_id ? "player-row selected" : "player-row"} key={balance.member_id}>
            <label className="payment-select" title={`${balance.display_name} fuer Sammelzahlung auswaehlen`}>
              <input
                type="checkbox"
                checked={paymentMemberIds.includes(balance.member_id)}
                onChange={() => onTogglePayment(balance.member_id)}
                aria-label={`${balance.display_name} fuer Sammelzahlung auswaehlen`}
                disabled={disabled}
              />
            </label>
            <button className="player-row-main" type="button" onClick={() => onSelect(balance.member_id)}>
              <span>
                <strong>{balance.display_name}</strong>
                <small>{lastEntry ? `${labelForType(lastEntry.type)} | ${formatDate(lastEntry.booking_date)}` : "Keine Buchung"}</small>
              </span>
              <strong className={balance.amount_due_cents > 0 ? "player-amount due" : "player-amount"}>
                {formatMoney(balance.amount_due_cents, team?.currency)}
              </strong>
            </button>
            {member ? (
              <QuickBooking member={member} catalog={catalog} team={team} disabled={disabled} compact />
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function BulkPaymentPanel({
  balances,
  selectedBalances,
  selectedMemberIds,
  setSelectedMemberIds,
  team,
  disabled
}: {
  balances: MemberBalance[];
  selectedBalances: MemberBalance[];
  selectedMemberIds: string[];
  setSelectedMemberIds: Dispatch<SetStateAction<string[]>>;
  team: Team | null;
  disabled: boolean;
}) {
  const openBalances = balances.filter((balance) => balance.amount_due_cents > 0);
  const selectedOpenTotal = selectedBalances.reduce((sum, balance) => sum + Math.max(0, balance.amount_due_cents), 0);

  return (
    <details className="bulk-payment-panel">
      <summary>
        <span>
          <Users size={17} />
          <strong>Sammelzahlung</strong>
        </span>
        <small>
          {selectedMemberIds.length} Spieler | {formatMoney(selectedOpenTotal, team?.currency)}
        </small>
      </summary>
      <div className="bulk-payment-actions">
        <button
          className="ghost-button compact-button"
          type="button"
          onClick={() => setSelectedMemberIds(openBalances.map((balance) => balance.member_id))}
          disabled={disabled || !openBalances.length}
        >
          Offene auswaehlen
        </button>
        <button
          className="ghost-button compact-button"
          type="button"
          onClick={() => setSelectedMemberIds([])}
          disabled={disabled || !selectedMemberIds.length}
        >
          Auswahl leeren
        </button>
      </div>
      <form action={createBulkPaymentAction} className="bulk-payment-form">
        {selectedMemberIds.map((memberId) => (
          <input type="hidden" name="member_ids" value={memberId} key={memberId} />
        ))}
        <label>
          Betrag je Spieler
          <input name="amount" inputMode="decimal" placeholder="leer = offen" disabled={disabled} />
        </label>
        <label>
          Datum
          <input name="booking_date" type="date" defaultValue={todayInputValue()} disabled={disabled} />
        </label>
        <label className="quick-book-wide">
          Buchungsgrund
          <input name="description" placeholder="Sammelzahlung erhalten" disabled={disabled} />
        </label>
        <button className="primary-button quick-book-wide" type="submit" disabled={disabled || !selectedMemberIds.length}>
          <Banknote size={16} />
          Zahlungen buchen
        </button>
      </form>
    </details>
  );
}

function PlayerDetail({
  balance,
  member,
  entries,
  members,
  catalog,
  team,
  disabled
}: {
  balance: MemberBalance | null;
  member: TeamMember | null;
  entries: LedgerEntry[];
  members: TeamMember[];
  catalog: CatalogItem[];
  team: Team | null;
  disabled: boolean;
}) {
  if (!balance || !member) {
    return (
      <aside className="player-detail-panel placeholder">
        <ClipboardList size={22} />
        <strong>Spieler auswaehlen</strong>
      </aside>
    );
  }

  const recentEntries = entries.slice(0, 8);

  return (
    <aside className="player-detail-panel">
      <div className="player-detail-title">
        <span>
          <h3>{balance.display_name}</h3>
          <small>Saldo und letzte Buchungen</small>
        </span>
        <strong className={balance.balance_cents > 0 ? "detail-balance due" : "detail-balance"}>
          {formatMoney(balance.balance_cents, team?.currency)}
        </strong>
      </div>

      <div className="player-detail-metrics">
        <Metric label="Gesamt" value={formatMoney(balance.balance_cents, team?.currency)} strong={balance.balance_cents > 0} />
        <Metric label="Strafen" value={formatMoney(balance.fine_cents, team?.currency)} />
        <Metric label="Getraenke" value={formatMoney(balance.drink_cents, team?.currency)} />
        <Metric label="Bezahlt" value={formatMoney(balance.payment_cents, team?.currency)} />
      </div>

      <QuickBooking member={member} catalog={catalog} team={team} disabled={disabled} defaultOpen />

      <div className="booking-card-list">
        <div className="compact-section-title">
          <h4>Letzte Buchungen</h4>
          <span>{recentEntries.length}</span>
        </div>
        {recentEntries.length ? (
          recentEntries.map((entry) => (
            <article className={entry.status === "voided" ? "booking-card voided" : "booking-card"} key={entry.id}>
              <div className="booking-card-main">
                <span>
                  <strong>{entry.description}</strong>
                  <small>
                    {labelForType(entry.type)} | {formatDate(entry.booking_date)} | Menge {entry.quantity}
                  </small>
                  {entry.void_reason ? <small>Storno: {entry.void_reason}</small> : null}
                  {entry.voided_at || entry.voided_by_name ? (
                    <small>
                      Storniert {entry.voided_at ? `am ${formatDate(entry.voided_at)}` : ""}
                      {entry.voided_by_name ? ` durch ${entry.voided_by_name}` : ""}
                    </small>
                  ) : null}
                  {entry.correction_of ? <small>Korrektur zu vorheriger Buchung</small> : null}
                </span>
                <strong>{formatMoney(entry.total_amount_cents, team?.currency)}</strong>
              </div>
              <div className="booking-card-footer">
                <StatusPill status={entry.status} />
                <LedgerEntryMenu entry={entry} members={members} catalog={catalog} team={team} disabled={disabled} />
              </div>
            </article>
          ))
        ) : (
          <p className="muted compact-message">Noch keine Buchungen.</p>
        )}
      </div>
    </aside>
  );
}

function QuickBooking({
  member,
  catalog,
  team,
  disabled,
  compact = false,
  defaultOpen = false
}: {
  member: TeamMember;
  catalog: CatalogItem[];
  team: Team | null;
  disabled: boolean;
  compact?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [type, setType] = useState<QuickBookingType>("fine");
  const items = catalog.filter((item) => item.active && item.type === type);

  if (!open) {
    return (
      <button className={compact ? "quick-book-toggle icon-only" : "quick-book-toggle"} type="button" onClick={() => setOpen(true)}>
        <Plus size={16} />
        {!compact ? "Buchen" : null}
      </button>
    );
  }

  return (
    <div className={compact ? "quick-book compact" : "quick-book"}>
      <div className="quick-book-head">
        <div className="quick-type-toggle" aria-label="Buchungsart">
          <button className={type === "fine" ? "active" : ""} type="button" onClick={() => setType("fine")}>
            <ClipboardList size={15} />
            Strafe
          </button>
          <button className={type === "drink" ? "active" : ""} type="button" onClick={() => setType("drink")}>
            <Beer size={15} />
            Getraenk
          </button>
          <button className={type === "payment" ? "active" : ""} type="button" onClick={() => setType("payment")}>
            <Banknote size={15} />
            Zahlung
          </button>
        </div>
        {defaultOpen ? null : (
          <button className="icon-button" type="button" onClick={() => setOpen(false)} aria-label="Schnellbuchung schliessen">
            <X size={15} />
          </button>
        )}
      </div>

      <form action={createLedgerEntryAction} className="quick-book-form">
        <input type="hidden" name="member_id" value={member.id} />
        <input type="hidden" name="type" value={type} />

        {type === "fine" || type === "drink" ? (
          <label className="quick-book-wide">
            Katalog
            <select name="catalog_item_id" disabled={disabled}>
              <option value="">Manuell</option>
              {items.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name} ({formatMoney(item.amount_cents, team?.currency)})
                </option>
              ))}
            </select>
          </label>
        ) : (
          <input type="hidden" name="catalog_item_id" value="" />
        )}

        <label>
          Menge
          <input name="quantity" inputMode="decimal" defaultValue="1" disabled={disabled} required />
        </label>

        <label>
          Betrag
          <input name="amount" inputMode="decimal" placeholder="0,00" disabled={disabled} required={type === "payment"} />
        </label>

        <label>
          Datum
          <input name="booking_date" type="date" defaultValue={todayInputValue()} disabled={disabled} />
        </label>

        <label className="quick-book-wide">
          Buchungsgrund
          <input name="description" placeholder={type === "payment" ? "Zahlung erhalten" : "Manuelle Buchung"} disabled={disabled} />
        </label>

        <button className="primary-button quick-book-wide" type="submit" disabled={disabled}>
          <Plus size={16} />
          Buchen
        </button>
      </form>
    </div>
  );
}

function Metric({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <span className={strong ? "player-detail-metric strong" : "player-detail-metric"}>
      <small>{label}</small>
      <strong>{value}</strong>
    </span>
  );
}

const playerFilters: { value: PlayerFilter; label: string }[] = [
  { value: "all", label: "Alle" },
  { value: "open", label: "Offen" },
  { value: "fine", label: "Strafen" },
  { value: "drink", label: "Getraenke" },
  { value: "paid", label: "Bezahlt" }
];

type QuickBookingType = "fine" | "drink" | "payment";

function groupLedgerByMember(ledger: LedgerEntry[]) {
  const result = new Map<string, LedgerEntry[]>();

  for (const entry of ledger) {
    const entries = result.get(entry.member_id) ?? [];
    entries.push(entry);
    result.set(entry.member_id, entries);
  }

  for (const entries of result.values()) {
    entries.sort((left, right) => right.created_at.localeCompare(left.created_at));
  }

  return result;
}

function sortBalances(left: MemberBalance, right: MemberBalance) {
  return (
    Number(right.amount_due_cents > 0) - Number(left.amount_due_cents > 0) ||
    right.amount_due_cents - left.amount_due_cents ||
    left.display_name.localeCompare(right.display_name, "de", { sensitivity: "base" })
  );
}

function togglePaymentMember(memberId: string, setPaymentMemberIds: Dispatch<SetStateAction<string[]>>) {
  setPaymentMemberIds((memberIds) =>
    memberIds.includes(memberId) ? memberIds.filter((selectedId) => selectedId !== memberId) : [...memberIds, memberId]
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
