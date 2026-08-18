import { Landmark } from "lucide-react";
import { createTreasuryEntryAction } from "@/app/actions";
import { todayInputValue } from "@/lib/money";

export function TreasuryForm({ disabled = false }: { disabled?: boolean }) {
  return (
    <section className="treasury-panel">
      <div className="section-title-row">
        <h2>Kassenbucheintrag</h2>
        <span>Bestand, Einnahme oder Ausgabe</span>
      </div>

      <form action={createTreasuryEntryAction} className="treasury-form">
        <label>
          Art
          <select name="type" defaultValue="expense" disabled={disabled}>
            <option value="expense">Ausgabe</option>
            <option value="income">Sonstige Einnahme</option>
            <option value="balance">Kassenbestand festlegen</option>
          </select>
        </label>

        <label>
          Betrag
          <input name="amount" inputMode="decimal" placeholder="0,00" disabled={disabled} required />
        </label>

        <label>
          Datum
          <input name="booking_date" type="date" defaultValue={todayInputValue()} disabled={disabled} />
        </label>

        <label className="span-2">
          Beschreibung
          <input name="description" placeholder="Zum Beispiel Getraenkeeinkauf" disabled={disabled} />
        </label>

        <label className="span-2">
          Notiz
          <input name="notes" placeholder="Geschaeft, Beleg oder Anlass" disabled={disabled} />
        </label>

        <button className="primary-button align-end" type="submit" disabled={disabled}>
          <Landmark size={16} />
          Eintragen
        </button>
      </form>
    </section>
  );
}
