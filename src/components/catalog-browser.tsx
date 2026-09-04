"use client";

import { useMemo, useState } from "react";
import { Beer, ChevronDown, ClipboardList, Search } from "lucide-react";
import { formatMoney } from "@/lib/money";
import type { CatalogItem } from "@/lib/types";

type CatalogView = "fine" | "drink";

const PAGE_SIZE = 6;

export function CatalogBrowser({
  catalog,
  currency
}: {
  catalog: CatalogItem[];
  currency?: string;
}) {
  const [type, setType] = useState<CatalogView>("fine");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const normalizedQuery = query.trim().toLocaleLowerCase("de-DE");
  const counts = {
    fine: catalog.filter((item) => item.type === "fine").length,
    drink: catalog.filter((item) => item.type === "drink").length
  };
  const items = useMemo(
    () =>
      catalog.filter((item) => {
        if (item.type !== type) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        return [item.name, item.description, item.in_kind_label]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("de-DE")
          .includes(normalizedQuery);
      }),
    [catalog, normalizedQuery, type]
  );
  const visibleItems = items.slice(0, visibleCount);
  const remainingCount = items.length - visibleItems.length;

  function selectType(nextType: CatalogView) {
    setType(nextType);
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <section className="catalog-browser">
      <div className="catalog-page-tools">
        <label className="catalog-search catalog-page-search">
          <Search size={17} />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder="Katalog durchsuchen"
            aria-label="Katalog durchsuchen"
          />
        </label>

        <div className="catalog-page-tabs" aria-label="Katalogart">
          <button
            type="button"
            className={type === "fine" ? "active" : ""}
            aria-pressed={type === "fine"}
            onClick={() => selectType("fine")}
          >
            <ClipboardList size={16} />
            Strafen
            <span>{counts.fine}</span>
          </button>
          <button
            type="button"
            className={type === "drink" ? "active" : ""}
            aria-pressed={type === "drink"}
            onClick={() => selectType("drink")}
          >
            <Beer size={16} />
            Getränke
            <span>{counts.drink}</span>
          </button>
        </div>
      </div>

      <div className="catalog-page-list">
        <div className="section-title-row catalog-page-list-head">
          <h2>{type === "fine" ? "Strafen" : "Getränke"}</h2>
          <span>{items.length} Treffer</span>
        </div>

        <div className="catalog-page-rows">
          {visibleItems.map((item) => (
            <div className="catalog-row catalog-page-row" key={item.id}>
              <span>
                <strong>{item.name}</strong>
                {item.description ? <small>{item.description}</small> : null}
                {item.in_kind_label ? (
                  <small className="in-kind-catalog-label">+ {item.in_kind_label}</small>
                ) : null}
              </span>
              <strong>{formatMoney(item.amount_cents, currency)}</strong>
            </div>
          ))}
        </div>

        {remainingCount > 0 ? (
          <button
            className="ghost-button catalog-more-button"
            type="button"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
          >
            <ChevronDown size={16} />
            Weitere {Math.min(PAGE_SIZE, remainingCount)} anzeigen
          </button>
        ) : null}

        {!items.length ? <p className="muted catalog-page-empty">Keine passenden Einträge.</p> : null}
      </div>
    </section>
  );
}
