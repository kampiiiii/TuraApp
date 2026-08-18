import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, Beer, ClipboardList, Euro, ListOrdered, Plus } from "lucide-react";
import { createCatalogItemAction, moveCatalogItemAction, sortCatalogItemsAction } from "@/app/actions";
import { formatMoney } from "@/lib/money";
import type { CatalogItem, CatalogType, Team } from "@/lib/types";

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
            Sachleistung
            <input name="in_kind_label" placeholder="z. B. 1 Kiste Bier" disabled={disabled} />
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
        <CatalogList
          title="Strafen"
          type="fine"
          items={fines}
          team={team}
          icon={<ClipboardList size={18} />}
          disabled={disabled}
        />
        <CatalogList
          title="Getraenke"
          type="drink"
          items={drinks}
          team={team}
          icon={<Beer size={18} />}
          disabled={disabled}
        />
      </div>
    </section>
  );
}

function CatalogList({
  title,
  type,
  items,
  team,
  icon,
  disabled
}: {
  title: string;
  type: CatalogType;
  items: CatalogItem[];
  team: Team | null;
  icon: ReactNode;
  disabled: boolean;
}) {
  return (
    <div className="catalog-group">
      <div className="catalog-group-heading">
        <span className="section-icon compact">{icon}</span>
        <h3>{title}</h3>
        <div className="catalog-group-tools">
          <span className="catalog-count">{items.length}</span>
          <CatalogSortButton type={type} sortBy="name" label={`${title} alphabetisch sortieren`} icon={<ListOrdered size={15} />} disabled={disabled} />
          <CatalogSortButton type={type} sortBy="amount" label={`${title} nach Preis sortieren`} icon={<Euro size={15} />} disabled={disabled} />
        </div>
      </div>
      {items.map((item, index) => (
        <div className="catalog-row" key={item.id}>
          <span>
            <strong>{item.name}</strong>
            {item.description ? <small>{item.description}</small> : null}
            {item.in_kind_label ? <small className="in-kind-catalog-label">+ {item.in_kind_label}</small> : null}
          </span>
          <div className="catalog-row-controls">
            <strong>{formatMoney(item.amount_cents, team?.currency)}</strong>
            <span className="catalog-move-actions">
              <CatalogMoveButton
                itemId={item.id}
                direction="up"
                label={`${item.name} nach oben`}
                icon={<ArrowUp size={15} />}
                disabled={disabled || index === 0}
              />
              <CatalogMoveButton
                itemId={item.id}
                direction="down"
                label={`${item.name} nach unten`}
                icon={<ArrowDown size={15} />}
                disabled={disabled || index === items.length - 1}
              />
            </span>
          </div>
        </div>
      ))}
      {!items.length ? <p className="muted catalog-empty">Noch keine Positionen vorhanden.</p> : null}
    </div>
  );
}

function CatalogMoveButton({
  itemId,
  direction,
  label,
  icon,
  disabled
}: {
  itemId: string;
  direction: "up" | "down";
  label: string;
  icon: ReactNode;
  disabled: boolean;
}) {
  return (
    <form action={moveCatalogItemAction} className="inline-action">
      <input type="hidden" name="item_id" value={itemId} />
      <input type="hidden" name="direction" value={direction} />
      <button className="icon-button catalog-order-button" type="submit" title={label} aria-label={label} disabled={disabled}>
        {icon}
      </button>
    </form>
  );
}

function CatalogSortButton({
  type,
  sortBy,
  label,
  icon,
  disabled
}: {
  type: CatalogType;
  sortBy: "name" | "amount";
  label: string;
  icon: ReactNode;
  disabled: boolean;
}) {
  return (
    <form action={sortCatalogItemsAction} className="inline-action">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="sort_by" value={sortBy} />
      <button className="icon-button catalog-order-button" type="submit" title={label} aria-label={label} disabled={disabled}>
        {icon}
      </button>
    </form>
  );
}
