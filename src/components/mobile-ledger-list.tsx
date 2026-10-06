import { ChevronDown } from "lucide-react";
import { LedgerEntryMenu } from "@/components/ledger-entry-menu";
import { StatusPill } from "@/components/status-pill";
import { formatMoney } from "@/lib/money";
import type { CatalogItem, LedgerEntry, Team, TeamMember } from "@/lib/types";

const labels = { fine: "Strafe", drink: "Getränk", fee: "Beitrag", interest: "Zinsen", payment: "Zahlung", adjustment: "Anpassung" };
const date = (value: string) => new Intl.DateTimeFormat("de-DE").format(new Date(value));

export function MobileLedgerList({ entries, members, catalog, team, canVoid, disabled }: {
  entries: LedgerEntry[]; members: TeamMember[]; catalog: CatalogItem[]; team: Team | null; canVoid: boolean; disabled: boolean;
}) {
  return <div className="mobile-ledger-list">{entries.map((entry) => <article className={`mobile-ledger-row ${entry.status === "voided" ? "voided" : ""}`} key={entry.id}>
    <details className="mobile-ledger-details">
      <summary>
        <span className="mobile-ledger-main"><strong>{entry.description}</strong>
          <small>{date(entry.booking_date)}{canVoid ? ` · ${entry.member_name}` : ""} · {labels[entry.type]}</small>
        </span>
        <span className="mobile-ledger-price"><strong>{formatMoney(entry.total_amount_cents, team?.currency)}</strong><StatusPill status={entry.status} /></span>
        <ChevronDown size={16} className="ledger-expand-icon" />
      </summary>
      <div className="mobile-ledger-info">
        <span>{entry.quantity} × {formatMoney(entry.unit_amount_cents, team?.currency)}</span>
        {entry.status === "partial" ? <strong>Noch offen: {formatMoney(entry.total_amount_cents - entry.settled_amount_cents, team?.currency)}</strong> : null}
        {entry.notes ? <p>{entry.notes}</p> : null}
        <span>{entry.source === "player" ? "Vom Spieler selbst gebucht" : entry.source === "system" ? "Automatisch gebucht" : "Vom Admin gebucht"}</span>
        {entry.created_by_name ? <span>Erfasst von {entry.created_by_name}</span> : null}
        {entry.in_kind_label ? <span>Sachleistung: {entry.in_kind_label} ({entry.in_kind_completed_at ? "mitgebracht" : "offen"})</span> : null}
        {entry.void_reason ? <span>Storno: {entry.void_reason}</span> : null}
        {entry.voided_at || entry.voided_by_name ? <span>Storniert {entry.voided_at ? `am ${date(entry.voided_at)}` : ""}{entry.voided_by_name ? ` durch ${entry.voided_by_name}` : ""}</span> : null}
        {entry.correction_of ? <span>Korrektur zu vorheriger Buchung</span> : null}
      </div>
    </details>
    {canVoid && entry.status !== "voided" ? <LedgerEntryMenu entry={entry} members={members} catalog={catalog} team={team} disabled={disabled} /> : null}
  </article>)}</div>;
}
