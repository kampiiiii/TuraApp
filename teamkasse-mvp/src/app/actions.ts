"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseEuroToCents, parseQuantity } from "@/lib/money";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import type { CatalogType, LedgerType, TeamMember } from "@/lib/types";

export async function logoutAction() {
  if (!hasSupabaseEnv()) {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createMemberAction(formData: FormData) {
  const { supabase, member } = await requireAdmin();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const jerseyNumberRaw = String(formData.get("jersey_number") ?? "").trim();
  const role = String(formData.get("role") ?? "player") === "admin" ? "admin" : "player";

  if (!displayName) {
    throw new Error("Name fehlt.");
  }

  const { error } = await supabase.from("team_members").insert({
    team_id: member.team_id,
    display_name: displayName,
    jersey_number: jerseyNumberRaw ? Number(jerseyNumberRaw) : null,
    role
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidateAll();
}

export async function createCatalogItemAction(formData: FormData) {
  const { supabase, member } = await requireAdmin();
  const type = normalizeCatalogType(formData.get("type"));
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const amountCents = parseEuroToCents(formData.get("amount"));

  if (!name) {
    throw new Error("Name fehlt.");
  }

  const { error } = await supabase.from("catalog_items").insert({
    team_id: member.team_id,
    type,
    name,
    description,
    amount_cents: amountCents
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidateAll();
}

export async function createLedgerEntryAction(formData: FormData) {
  const { supabase, member: admin } = await requireAdmin();
  const type = normalizeLedgerType(formData.get("type"));
  const memberId = String(formData.get("member_id") ?? "");
  const submittedCatalogItemId = String(formData.get("catalog_item_id") ?? "") || null;
  const catalogItemId = type === "payment" || type === "adjustment" ? null : submittedCatalogItemId;
  const manualDescription = String(formData.get("description") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const quantity = type === "payment" ? 1 : parseQuantity(formData.get("quantity"));
  const bookingDate = String(formData.get("booking_date") ?? "").trim() || new Date().toISOString().slice(0, 10);

  if (!memberId) {
    throw new Error("Spieler fehlt.");
  }

  const { data: bookedMember, error: memberError } = await supabase
    .from("team_members")
    .select("id,team_id")
    .eq("id", memberId)
    .eq("team_id", admin.team_id)
    .maybeSingle();

  if (memberError || !bookedMember) {
    throw new Error("Spieler wurde nicht gefunden.");
  }

  let unitAmountCents = parseEuroToCents(formData.get("amount"));
  let description = manualDescription;

  if (catalogItemId && type !== "payment" && type !== "adjustment") {
    const { data: item, error: catalogError } = await supabase
      .from("catalog_items")
      .select("id,name,amount_cents,type")
      .eq("id", catalogItemId)
      .eq("team_id", admin.team_id)
      .maybeSingle();

    if (catalogError || !item) {
      throw new Error("Katalogeintrag wurde nicht gefunden.");
    }

    unitAmountCents = Number(item.amount_cents);
    description = String(item.name);
  }

  if (!description) {
    description = type === "payment" ? "Zahlung erhalten" : "Manuelle Buchung";
  }

  if (unitAmountCents === 0) {
    throw new Error("Betrag fehlt.");
  }

  if (type === "payment") {
    unitAmountCents = -Math.abs(unitAmountCents);
  } else if (type !== "adjustment") {
    unitAmountCents = Math.abs(unitAmountCents);
  }

  const totalAmountCents = Math.round(unitAmountCents * quantity);
  const status = type === "payment" ? "paid" : "open";

  const { error } = await supabase.from("ledger_entries").insert({
    team_id: admin.team_id,
    member_id: memberId,
    catalog_item_id: catalogItemId,
    type,
    description,
    quantity,
    unit_amount_cents: unitAmountCents,
    total_amount_cents: totalAmountCents,
    status,
    booking_date: bookingDate,
    notes,
    created_by: admin.id
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidateAll();
}

export async function voidLedgerEntryAction(formData: FormData) {
  const { supabase, member } = await requireAdmin();
  const entryId = String(formData.get("entry_id") ?? "");
  const reason = String(formData.get("void_reason") ?? "").trim() || "Storno durch Kassenwart";

  if (!entryId) {
    throw new Error("Buchung fehlt.");
  }

  const { error } = await supabase
    .from("ledger_entries")
    .update({
      status: "voided",
      voided_by: member.id,
      voided_at: new Date().toISOString(),
      void_reason: reason
    })
    .eq("id", entryId)
    .eq("team_id", member.team_id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateAll();
}

async function requireAdmin(): Promise<{ supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>; member: TeamMember }> {
  if (!hasSupabaseEnv()) {
    throw new Error("Demo-Modus: Zum Speichern bitte Supabase konfigurieren.");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memberships, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("user_id", user.id)
    .eq("active", true)
    .order("created_at", { ascending: true })
    .limit(1);

  if (error || !memberships?.length) {
    throw new Error("Keine Mannschaft zugeordnet.");
  }

  const member = memberships[0] as TeamMember;

  if (member.role !== "admin") {
    throw new Error("Keine Admin-Rechte.");
  }

  return { supabase, member };
}

function normalizeCatalogType(value: FormDataEntryValue | null): CatalogType {
  return value === "drink" ? "drink" : "fine";
}

function normalizeLedgerType(value: FormDataEntryValue | null): LedgerType {
  if (value === "drink" || value === "payment" || value === "adjustment") {
    return value;
  }

  return "fine";
}

function revalidateAll() {
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  revalidatePath("/buchungen");
  revalidatePath("/katalog");
}
