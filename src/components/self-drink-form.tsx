"use client";

import { Beer, Plus } from "lucide-react";
import { createSelfDrinkFeedbackAction } from "@/app/actions";
import { FeedbackForm } from "@/components/feedback-form";
import { SubmitButton } from "@/components/submit-button";
import { formatMoney } from "@/lib/money";
import type { CatalogItem, Team } from "@/lib/types";

export function SelfDrinkForm({ catalog, team }: { catalog: CatalogItem[]; team: Team | null }) {
  const drinks = catalog.filter((item) => item.active && item.type === "drink");

  if (!drinks.length) {
    return null;
  }

  return (
    <section className="self-drink-panel">
      <div className="self-drink-heading">
        <span className="section-icon">
          <Beer size={20} />
        </span>
        <span>
          <h2>Getränk selbst eintragen</h2>
          <small>Die Buchung wird sofort deinem Saldo hinzugefügt.</small>
        </span>
      </div>

      <FeedbackForm action={createSelfDrinkFeedbackAction} className="self-drink-form">
        <label>
          Getränk
          <select name="catalog_item_id" required>
            <option value="">Auswählen</option>
            {drinks.map((drink) => (
              <option value={drink.id} key={drink.id}>
                {drink.name} ({formatMoney(drink.amount_cents, team?.currency)})
              </option>
            ))}
          </select>
        </label>

        <label>
          Menge
          <input name="quantity" type="number" inputMode="numeric" min="1" max="50" step="1" defaultValue="1" required />
        </label>

        <SubmitButton className="primary-button align-end" pendingLabel="Wird gespeichert…">
          <Plus size={16} />
          Sofort buchen
        </SubmitButton>
      </FeedbackForm>
    </section>
  );
}
