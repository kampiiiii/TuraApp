import { CatalogBrowser } from "@/components/catalog-browser";
import { LoginRequired, NoTeamState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
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

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Katalog"
        title="Strafen und Getränke"
        description="Der Katalog ist die Klickliste für den Kassenwart und die Preisliste für Spieler."
      />
      <CatalogBrowser catalog={data.catalog} currency={data.team?.currency} />
    </div>
  );
}
