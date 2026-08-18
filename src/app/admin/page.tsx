import { BookingForm } from "@/components/booking-form";
import { CatalogManager } from "@/components/catalog-manager";
import { ForbiddenState, LoginRequired, NoTeamState } from "@/components/empty-state";
import { LedgerTable } from "@/components/ledger-table";
import { MemberManager } from "@/components/member-manager";
import { PageHeader } from "@/components/page-header";
import { getAppData } from "@/lib/team-queries";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const data = await getAppData();

  if (data.authState === "anonymous" || data.authState === "setup-required") {
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
        description="Spieler, Katalog und Buchungen an einem Ort. Nur angemeldete Admins koennen hier speichern."
      />

      <BookingForm members={data.members} catalog={data.catalog} team={data.team} disabled={data.isDemo} />
      <CatalogManager catalog={data.catalog} team={data.team} disabled={data.isDemo} />
      <MemberManager members={data.members} currentMemberId={data.currentMember.id} disabled={data.isDemo} />
      <LedgerTable entries={data.ledger.slice(0, 12)} team={data.team} canVoid disabled={data.isDemo} />
    </div>
  );
}
