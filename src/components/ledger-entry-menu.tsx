"use client";

import { useState } from "react";
import { Ban, Check, MoreVertical, Pencil, RotateCcw, X } from "lucide-react";
import { setInKindCompletionAction, updateLedgerEntryAction, voidLedgerEntryAction } from "@/app/actions";
import { formatMoney } from "@/lib/money";
import type { CatalogItem, LedgerEntry, Team, TeamMember } from "@/lib/types";

export function LedgerEntryMenu({
  entry,
  members,
  catalog,
  team,
  disabled = false
}: {
  entry: LedgerEntry;
  members: TeamMember[];
  catalog: CatalogItem[];
  team: Team | null;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [type, setType] = useState<EditableLedgerType>(editableType(entry.type) ?? "fine");
  const [catalogItemId, setCatalogItemId] = useState(entry.catalog_item_id ?? "");
  const players = members.filter((member) => member.active && member.role === "player");
  const catalogItems = catalog.filter(
    (item) => item.type === type && (item.active || item.id === entry.catalog_item_id)
  );
  const canEdit = entry.status !== "voided" && Boolean(editableType(entry.type));
  const canToggleInKind = Boolean(entry.in_kind_label) && entry.status !== "voided";

  return (
    <div className="entry-menu-wrap">
      <div className="entry-action-row" aria-label="Buchungsaktionen">
        {canEdit ? (
          <button className="ghost-button compact-button" type="button" onClick={() => setEditing(true)} disabled={disabled}>
            <Pencil size={15} />
            Bearbeiten
          </button>
        ) : null}
        {entry.status !== "voided" ? (
          <form
            action={voidLedgerEntryAction}
            onSubmit={(event) => {
              if (!window.confirm("Buchung stornieren? Der Eintrag bleibt in der Historie sichtbar.")) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="entry_id" value={entry.id} />
            <input type="hidden" name="void_reason" value="Fehleintrag storniert" />
            <button className="ghost-button compact-button member-delete-button" type="submit" disabled={disabled}>
              <Ban size={15} />
              Stornieren
            </button>
          </form>
        ) : null}
      </div>

      <details className="entry-menu">
        <summary className="icon-button" aria-label="Buchungsmenü" title="Buchungsmenü">
          <MoreVertical size={16} />
        </summary>
        <div className="entry-menu-list">
          {canEdit ? (
            <button className="entry-menu-item" type="button" onClick={() => setEditing(true)} disabled={disabled}>
              <Pencil size={15} />
              Bearbeiten
            </button>
          ) : null}
          {canToggleInKind ? (
            <form action={setInKindCompletionAction}>
              <input type="hidden" name="entry_id" value={entry.id} />
              <input type="hidden" name="completed" value={entry.in_kind_completed_at ? "false" : "true"} />
              <button className="entry-menu-item" type="submit" disabled={disabled}>
                {entry.in_kind_completed_at ? <RotateCcw size={15} /> : <Check size={15} />}
                {entry.in_kind_completed_at ? "Wieder öffnen" : "Abhaken"}
              </button>
            </form>
          ) : null}
          {entry.status !== "voided" ? (
            <form
              action={voidLedgerEntryAction}
              onSubmit={(event) => {
                if (!window.confirm("Buchung stornieren? Der Eintrag bleibt in der Historie sichtbar.")) {
                  event.preventDefault();
                }
              }}
            >
              <input type="hidden" name="entry_id" value={entry.id} />
              <input type="hidden" name="void_reason" value="Fehleintrag storniert" />
              <button className="entry-menu-item danger" type="submit" disabled={disabled}>
                <Ban size={15} />
                Stornieren
              </button>
            </form>
          ) : null}
        </div>
      </details>

      {editing ? (
        <div className="entry-dialog-backdrop" role="presentation">
          <div className="entry-dialog" role="dialog" aria-modal="true" aria-label="Buchung bearbeiten">
            <div className="entry-dialog-header">
              <span>
                <strong>Buchung bearbeiten</strong>
                <small>{entry.member_name} | {formatMoney(entry.total_amount_cents, team?.currency)}</small>
              </span>
              <button className="icon-button" type="button" onClick={() => setEditing(false)} aria-label="Schließen">
                <X size={16} />
              </button>
            </div>

            <form action={updateLedgerEntryAction} className="entry-edit-form">
              <input type="hidden" name="entry_id" value={entry.id} />

              <label>
                Spieler
                <select name="member_id" defaultValue={entry.member_id} required disabled={disabled}>
                  {players.map((member) => (
                    <option value={member.id} key={member.id}>
                      {member.display_name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Art
                <select
                  name="type"
                  value={type}
                  onChange={(event) => {
                    setType(event.target.value as EditableLedgerType);
                    setCatalogItemId("");
                  }}
                  disabled={disabled}
                >
                  <option value="fine">Strafe</option>
                  <option value="drink">Getränk</option>
                  <option value="payment">Zahlung</option>
                  <option value="adjustment">Anpassung</option>
                </select>
              </label>

              {type === "fine" || type === "drink" ? (
                <label className="entry-edit-wide">
                  Katalog
                  <select
                    name="catalog_item_id"
                    value={catalogItemId}
                    onChange={(event) => setCatalogItemId(event.target.value)}
                    disabled={disabled}
                  >
                    <option value="">Manuell</option>
                    {catalogItems.map((item) => (
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
                <input name="quantity" inputMode="decimal" defaultValue={entry.quantity} disabled={disabled} required />
              </label>

              <label>
                Betrag
                <input
                  name="amount"
                  inputMode="decimal"
                  defaultValue={formatAmountForInput(entry.unit_amount_cents)}
                  disabled={disabled}
                  required
                />
              </label>

              <label>
                Datum
                <input name="booking_date" type="date" defaultValue={entry.booking_date} disabled={disabled} required />
              </label>

              <label className="entry-edit-wide">
                Buchungsgrund
                <input name="description" defaultValue={entry.description} disabled={disabled} />
              </label>

              <label className="entry-edit-wide">
                Notiz
                <input name="notes" defaultValue={entry.notes ?? ""} disabled={disabled} />
              </label>

              <div className="entry-dialog-actions">
                <button className="ghost-button" type="button" onClick={() => setEditing(false)}>
                  Abbrechen
                </button>
                <button className="primary-button" type="submit" disabled={disabled}>
                  Korrektur speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type EditableLedgerType = "fine" | "drink" | "payment" | "adjustment";

function editableType(type: LedgerEntry["type"]): EditableLedgerType | null {
  if (type === "fine" || type === "drink" || type === "payment" || type === "adjustment") {
    return type;
  }

  return null;
}

function formatAmountForInput(cents: number) {
  return (cents / 100).toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
