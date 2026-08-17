import { BookingForm } from "@/components/booking-form";
import { CatalogManager } from "@/components/catalog-manager";
import { ForbiddenState, LoginRequired, NoTeamState } from "@/components/empty-state";
import { LedgerTable } from "@/components/ledger-table";
import { MemberManager } from "@/components/member-manager";
import { PageHeader } from "@/components/page-header";
import { getAppData } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const data = await getAppData();

  if (data.authState === "anonymous") {
    return <LoginRequired />;
  }

  if (data.authState === "no-team") {
    return <NoTeamState />;
  }

  if (data.currentMember?.role !== "admin") {
    return <ForbiddenState />;
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Admin"
        title="Kassenwart-Zentrale"
        description="Spieler, Katalog und Buchungen an einem Ort. Im Demo-Modus sind Speichern-Buttons deaktiviert."
      />

      <BookingForm members={data.members} catalog={data.catalog} team={data.team} disabled={data.isDemo} />
      <div className="admin-grid">
        <MemberManager members={data.members} disabled={data.isDemo} />
        <CatalogManager catalog={data.catalog} team={data.team} disabled={data.isDemo} />
      </div>
      <LedgerTable entries={data.ledger.slice(0, 12)} team={data.team} canVoid disabled={data.isDemo} />
    </div>
  );
}
