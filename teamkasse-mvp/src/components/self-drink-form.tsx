"use client";

import { useActionState } from "react";
import { Beer, Plus } from "lucide-react";
import { createSelfDrinkAction, type SelfDrinkState } from "@/app/actions";
import { formatMoney } from "@/lib/money";
import type { CatalogItem, Team } from "@/lib/types";

const initialState: SelfDrinkState = {
  status: "idle",
  message: ""
};

export function SelfDrinkForm({ catalog, team }: { catalog: CatalogItem[]; team: Team | null }) {
  const [state, formAction, pending] = useActionState(createSelfDrinkAction, initialState);
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
          <h2>Getraenk selbst eintragen</h2>
          <small>Die Buchung wird sofort deinem Saldo hinzugefuegt.</small>
        </span>
      </div>

      <form action={formAction} className="self-drink-form">
        <label>
          Getraenk
          <select name="catalog_item_id" required>
            <option value="">Auswaehlen</option>
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

        <button className="primary-button align-end" type="submit" disabled={pending}>
          <Plus size={16} />
          {pending ? "Wird gebucht..." : "Sofort buchen"}
        </button>
      </form>

      {state.message ? (
        <p className={`form-message ${state.status}`} role={state.status === "error" ? "alert" : "status"}>
          {state.message}
        </p>
      ) : null}
    </section>
  );
}
