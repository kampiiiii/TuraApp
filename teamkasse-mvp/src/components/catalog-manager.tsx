import type { ReactNode } from "react";
import { Beer, ClipboardList, Plus } from "lucide-react";
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
    <section className="admin-panel catalog-manager">
      <div className="section-title-row">
        <span className="section-heading">
          <span className="section-icon">
            <ClipboardList size={19} />
          </span>
          <span>
            <h2>Katalog verwalten</h2>
            <small>Preise fuer Buchungen zentral pflegen</small>
          </span>
        </span>
        <span>{catalog.length} Positionen</span>
      </div>

      <div className="catalog-create-area">
        <div className="subsection-heading">
          <strong>Neue Position</strong>
          <small>Art, Name und Preis festlegen</small>
        </div>
        <form action={createCatalogItemAction} className="form-grid catalog-form">
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
            Hinzufuegen
          </button>
        </form>
      </div>

      <div className="catalog-groups">
        <CatalogList title="Strafen" items={fines} team={team} icon={<ClipboardList size={18} />} />
        <CatalogList title="Getraenke" items={drinks} team={team} icon={<Beer size={18} />} />
      </div>
    </section>
  );
}

function CatalogList({
  title,
  items,
  team,
  icon
}: {
  title: string;
  items: CatalogItem[];
  team: Team | null;
  icon: ReactNode;
}) {
  return (
    <div className="catalog-group">
      <div className="catalog-group-heading">
        <span className="section-icon compact">{icon}</span>
        <h3>{title}</h3>
        <span>{items.length}</span>
      </div>
      {items.map((item) => (
        <div className="catalog-row" key={item.id}>
          <span>
            <strong>{item.name}</strong>
            {item.description ? <small>{item.description}</small> : null}
          </span>
          <strong>{formatMoney(item.amount_cents, team?.currency)}</strong>
        </div>
      ))}
      {!items.length ? <p className="muted catalog-empty">Noch keine Positionen vorhanden.</p> : null}
    </div>
  );
}
