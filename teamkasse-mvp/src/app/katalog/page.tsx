import { ClipboardList } from "lucide-react";
import { LoginRequired, NoTeamState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { formatMoney } from "@/lib/money";
import { getAppData } from "@/lib/team-queries";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const data = await getAppData();

  if (data.authState === "anonymous" || data.authState === "setup-required") {
    return <LoginRequired />;
  }

  if (data.authState === "no-team") {
    return <NoTeamState />;
  }

  const fines = data.catalog.filter((item) => item.type === "fine");
  const drinks = data.catalog.filter((item) => item.type === "drink");

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Katalog"
        title="Strafen und Getraenke"
        description="Der Katalog ist die Klickliste fuer den Kassenwart und die Preisliste fuer Spieler."
      />
      <section className="catalog-page-grid">
        <CatalogColumn title="Strafen" items={fines} currency={data.team?.currency} />
        <CatalogColumn title="Getraenke" items={drinks} currency={data.team?.currency} />
      </section>
    </div>
  );
}

function CatalogColumn({
  title,
  items,
  currency
}: {
  title: string;
  items: Array<{
    id: string;
    name: string;
    description: string | null;
    in_kind_label: string | null;
    amount_cents: number;
  }>;
  currency?: string;
}) {
  return (
    <section className="catalog-column">
      <div className="section-title-row">
        <h2>{title}</h2>
        <ClipboardList size={18} />
      </div>
      {items.map((item) => (
        <div className="catalog-row large" key={item.id}>
          <span>
            <strong>{item.name}</strong>
            {item.description ? <small>{item.description}</small> : null}
            {item.in_kind_label ? <small className="in-kind-catalog-label">+ {item.in_kind_label}</small> : null}
          </span>
          <strong>{formatMoney(item.amount_cents, currency)}</strong>
        </div>
      ))}
    </section>
  );
}
