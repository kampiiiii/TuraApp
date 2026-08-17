import { Plus } from "lucide-react";
import { createCatalogItemAction } from "@/app/actions";
import { formatMoney } from "@/lib/money";
import type { CatalogItem, Team } from "@/lib/types";

export function CatalogManager({
  catalog,
  team,
  disabled = false
}: {
  catalog: CatalogItem[];
  team: Team | null;
  disabled?: boolean;
}) {
  const fines = catalog.filter((item) => item.type === "fine");
  const drinks = catalog.filter((item) => item.type === "drink");

  return (
    <section className="admin-panel">
      <div className="section-title-row">
        <h2>Katalog pflegen</h2>
        <span>{catalog.length} Positionen</span>
      </div>

      <form action={createCatalogItemAction} className="form-grid">
        <label>
          Art
          <select name="type" defaultValue="fine" disabled={disabled}>
            <option value="fine">Strafe</option>
            <option value="drink">Getraenk</option>
          </select>
        </label>
        <label>
          Name
          <input name="name" placeholder="Zu spaet" disabled={disabled} required />
        </label>
        <label>
          Betrag
          <input name="amount" inputMode="decimal" placeholder="5,00" disabled={disabled} required />
        </label>
        <label>
          Notiz
          <input name="description" placeholder="Optional" disabled={disabled} />
        </label>
        <button className="primary-button align-end" type="submit" disabled={disabled}>
          <Plus size={16} />
          Position
        </button>
      </form>

      <div className="catalog-columns">
        <CatalogList title="Strafen" items={fines} team={team} />
        <CatalogList title="Getraenke" items={drinks} team={team} />
      </div>
    </section>
  );
}

function CatalogList({ title, items, team }: { title: string; items: CatalogItem[]; team: Team | null }) {
  return (
    <div className="catalog-list">
      <h3>{title}</h3>
      {items.map((item) => (
        <div className="catalog-row" key={item.id}>
          <span>
            <strong>{item.name}</strong>
            {item.description ? <small>{item.description}</small> : null}
          </span>
          <strong>{formatMoney(item.amount_cents, team?.currency)}</strong>
        </div>
      ))}
    </div>
  );
}
