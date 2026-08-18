import { ReceiptText } from "lucide-react";
import { createLedgerEntryAction } from "@/app/actions";
import { formatMoney, todayInputValue } from "@/lib/money";
import type { CatalogItem, Team, TeamMember } from "@/lib/types";

export function BookingForm({
  members,
  catalog,
  team,
  disabled = false
}: {
  members: TeamMember[];
  catalog: CatalogItem[];
  team: Team | null;
  disabled?: boolean;
}) {
  const players = members.filter((member) => member.active && member.role === "player");
  const fines = catalog.filter((item) => item.active && item.type === "fine");
  const drinks = catalog.filter((item) => item.active && item.type === "drink");

  return (
    <section className="admin-panel">
      <div className="section-title-row">
        <h2>Buchung erfassen</h2>
        <span>Strafe, Getraenk oder Zahlung</span>
      </div>

      <form action={createLedgerEntryAction} className="booking-grid">
        <label>
          Spieler
          <select name="member_id" disabled={disabled} required>
            <option value="">Auswaehlen</option>
            {players.map((member) => (
              <option value={member.id} key={member.id}>
                {member.display_name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Art
          <select name="type" defaultValue="fine" disabled={disabled}>
            <option value="fine">Strafe</option>
            <option value="drink">Getraenk</option>
            <option value="payment">Zahlung</option>
            <option value="adjustment">Anpassung</option>
          </select>
        </label>

        <label>
          Katalog
          <select name="catalog_item_id" disabled={disabled}>
            <option value="">Manuell oder Zahlung</option>
            <optgroup label="Strafen">
              {fines.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name} ({formatMoney(item.amount_cents, team?.currency)})
                  {item.in_kind_label ? ` + ${item.in_kind_label}` : ""}
                </option>
              ))}
            </optgroup>
            <optgroup label="Getraenke">
              {drinks.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name} ({formatMoney(item.amount_cents, team?.currency)})
                </option>
              ))}
            </optgroup>
          </select>
        </label>

        <label>
          Menge
          <input name="quantity" inputMode="decimal" defaultValue="1" disabled={disabled} />
        </label>

        <label>
          Betrag manuell
          <input name="amount" inputMode="decimal" placeholder="0,00" disabled={disabled} />
        </label>

        <label>
          Datum
          <input name="booking_date" type="date" defaultValue={todayInputValue()} disabled={disabled} />
        </label>

        <label className="span-2">
          Beschreibung
          <input name="description" placeholder="Optional bei Katalog, Pflicht fuer freie Buchung sinnvoll" disabled={disabled} />
        </label>

        <label className="span-2">
          Notiz
          <input name="notes" placeholder="Training, Spieltag, Barzahlung..." disabled={disabled} />
        </label>

        <button className="primary-button align-end" type="submit" disabled={disabled}>
          <ReceiptText size={16} />
          Buchen
        </button>
      </form>
    </section>
  );
}
