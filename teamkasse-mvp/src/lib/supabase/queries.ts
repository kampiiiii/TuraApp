import { demoData } from "@/lib/demo-data";
import type { AppData, CatalogItem, LedgerEntry, MemberBalance, Team, TeamMember } from "@/lib/types";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";

export async function getAppData(): Promise<AppData> {
  if (!hasSupabaseEnv()) {
    return demoData;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return emptyData("anonymous");
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("team_members")
    .select("*")
    .eq("user_id", user.id)
    .eq("active", true)
    .order("created_at", { ascending: true })
    .limit(1);

  if (membershipError || !memberships?.length) {
    return emptyData("no-team");
  }

  const currentMember = memberships[0] as TeamMember;
  const teamId = currentMember.team_id;
  const isAdmin = currentMember.role === "admin";

  const [{ data: team }, { data: memberRows }, { data: catalogRows }, { data: ledgerRows }, { data: balanceRows }] =
    await Promise.all([
      supabase
        .from("teams")
        .select("id,name,currency,bank_account_holder,bank_iban,bank_bic")
        .eq("id", teamId)
        .maybeSingle(),
      isAdmin
        ? supabase.from("team_members").select("*").eq("team_id", teamId).order("display_name")
        : supabase.from("team_members").select("*").eq("id", currentMember.id),
      supabase.from("catalog_items").select("*").eq("team_id", teamId).order("type").order("name"),
      isAdmin
        ? supabase
            .from("ledger_entries")
            .select("*")
            .eq("team_id", teamId)
            .order("created_at", { ascending: false })
            .limit(100)
        : supabase
            .from("ledger_entries")
            .select("*")
            .eq("team_id", teamId)
            .eq("member_id", currentMember.id)
            .order("created_at", { ascending: false })
            .limit(100),
      supabase.from("member_balances").select("*").eq("team_id", teamId).order("display_name")
    ]);

  const members = (memberRows ?? []) as TeamMember[];
  const catalog = (catalogRows ?? []) as CatalogItem[];
  const memberNames = new Map(members.map((member) => [member.id, member.display_name]));
  const catalogNames = new Map(catalog.map((item) => [item.id, item.name]));

  return {
    isDemo: false,
    authState: "member",
    team: (team as Team | null) ?? null,
    currentMember,
    members,
    catalog,
    ledger: ((ledgerRows ?? []) as Array<Record<string, unknown>>).map((row) =>
      mapLedgerRow(row, memberNames, catalogNames)
    ),
    balances: (balanceRows ?? []) as MemberBalance[]
  };
}

export async function getShellData() {
  const data = await getAppData();

  return {
    isDemo: data.isDemo,
    authState: data.authState,
    team: data.team,
    currentMember: data.currentMember
  };
}

function emptyData(authState: AppData["authState"]): AppData {
  return {
    isDemo: false,
    authState,
    team: null,
    currentMember: null,
    members: [],
    catalog: [],
    ledger: [],
    balances: []
  };
}

function mapLedgerRow(
  row: Record<string, unknown>,
  memberNames: Map<string, string>,
  catalogNames: Map<string, string>
): LedgerEntry {
  const id = String(row.id);
  const memberId = String(row.member_id);
  const catalogItemId = row.catalog_item_id ? String(row.catalog_item_id) : null;

  return {
    id,
    team_id: String(row.team_id),
    member_id: memberId,
    member_name: memberNames.get(memberId) ?? "Unbekannt",
    catalog_item_id: catalogItemId,
    catalog_item_name: catalogItemId ? catalogNames.get(catalogItemId) ?? null : null,
    type: row.type as LedgerEntry["type"],
    description: String(row.description),
    quantity: Number(row.quantity),
    unit_amount_cents: Number(row.unit_amount_cents),
    total_amount_cents: Number(row.total_amount_cents),
    status: row.status as LedgerEntry["status"],
    booking_date: String(row.booking_date),
    notes: row.notes ? String(row.notes) : null,
    correction_of: row.correction_of ? String(row.correction_of) : null,
    void_reason: row.void_reason ? String(row.void_reason) : null,
    created_at: String(row.created_at)
  };
}
