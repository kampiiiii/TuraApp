"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearSessionCookie,
  hashPin,
  isAuthConfigured,
  setSessionCookie,
  verifyAdminPassword,
  verifyPin
} from "@/lib/auth";
import { parseEuroToCents, parseQuantity } from "@/lib/money";
import { attachLedgerNames, loadTeamState, saveTeamState } from "@/lib/team-store";
import type { CatalogType, LedgerType, StoredTeamMember } from "@/lib/types";

export async function loginAdminAction(formData: FormData) {
  const password = String(formData.get("admin_password") ?? "");

  if (!isAuthConfigured() || !verifyAdminPassword(password)) {
    throw new Error("Admin-Passwort stimmt nicht.");
  }

  const state = await loadTeamState();
  const admin = state.members.find((member) => member.active && member.role === "admin");

  if (!admin) {
    throw new Error("Kein Admin-Mitglied gefunden.");
  }

  await setSessionCookie(admin);
  redirect("/dashboard");
}

export async function loginPlayerAction(formData: FormData) {
  const memberId = String(formData.get("member_id") ?? "");
  const pin = String(formData.get("pin") ?? "");

  if (!isAuthConfigured()) {
    throw new Error("Login ist noch nicht eingerichtet.");
  }

  const state = await loadTeamState();
  const member = state.members.find((candidate) => candidate.id === memberId && candidate.active);

  if (!member || !verifyPin(pin, member.pin_hash)) {
    throw new Error("Spieler oder PIN stimmt nicht.");
  }

  await setSessionCookie(member);
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

export async function createMemberAction(formData: FormData) {
  const { state } = await requireAdmin();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const jerseyNumberRaw = String(formData.get("jersey_number") ?? "").trim();
  const accessPin = String(formData.get("access_pin") ?? "").trim();
  const role = String(formData.get("role") ?? "player") === "admin" ? "admin" : "player";

  if (!displayName) {
    throw new Error("Name fehlt.");
  }

  const member: StoredTeamMember = {
    id: randomUUID(),
    team_id: state.team.id,
    user_id: null,
    display_name: displayName,
    jersey_number: jerseyNumberRaw ? Number(jerseyNumberRaw) : null,
    role,
    active: true,
    pin_hash: accessPin ? hashPin(accessPin) : null
  };

  state.members.push(member);
  await saveTeamState(state);
  revalidateAll();
}

export async function setMemberPinAction(formData: FormData) {
  const { state } = await requireAdmin();
  const memberId = String(formData.get("member_id") ?? "");
  const accessPin = String(formData.get("access_pin") ?? "").trim();
  const member = state.members.find((candidate) => candidate.id === memberId);

  if (!member) {
    throw new Error("Spieler wurde nicht gefunden.");
  }

  if (accessPin.length < 4) {
    throw new Error("PIN sollte mindestens 4 Zeichen haben.");
  }

  member.pin_hash = hashPin(accessPin);
  await saveTeamState(state);
  revalidateAll();
}

export async function createCatalogItemAction(formData: FormData) {
  const { state } = await requireAdmin();
  const type = normalizeCatalogType(formData.get("type"));
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const amountCents = parseEuroToCents(formData.get("amount"));

  if (!name) {
    throw new Error("Name fehlt.");
  }

  state.catalog.push({
    id: randomUUID(),
    team_id: state.team.id,
    type,
    name,
    description,
    amount_cents: amountCents,
    active: true
  });

  await saveTeamState(state);
  revalidateAll();
}

export async function createLedgerEntryAction(formData: FormData) {
  const { state, member: admin } = await requireAdmin();
  const type = normalizeLedgerType(formData.get("type"));
  const memberId = String(formData.get("member_id") ?? "");
  const submittedCatalogItemId = String(formData.get("catalog_item_id") ?? "") || null;
  const catalogItemId = type === "payment" || type === "adjustment" ? null : submittedCatalogItemId;
  const manualDescription = String(formData.get("description") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const quantity = type === "payment" ? 1 : parseQuantity(formData.get("quantity"));
  const bookingDate = String(formData.get("booking_date") ?? "").trim() || new Date().toISOString().slice(0, 10);
  const bookedMember = state.members.find((candidate) => candidate.id === memberId && candidate.team_id === state.team.id);

  if (!bookedMember) {
    throw new Error("Spieler wurde nicht gefunden.");
  }

  let unitAmountCents = parseEuroToCents(formData.get("amount"));
  let description = manualDescription;

  if (catalogItemId && type !== "payment" && type !== "adjustment") {
    const item = state.catalog.find((candidate) => candidate.id === catalogItemId && candidate.team_id === state.team.id);

    if (!item) {
      throw new Error("Katalogeintrag wurde nicht gefunden.");
    }

    unitAmountCents = item.amount_cents;
    description = item.name;
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

  state.ledger.unshift({
    id: randomUUID(),
    team_id: state.team.id,
    member_id: memberId,
    member_name: bookedMember.display_name,
    catalog_item_id: catalogItemId,
    catalog_item_name: catalogItemId ? state.catalog.find((item) => item.id === catalogItemId)?.name ?? null : null,
    type,
    description,
    quantity,
    unit_amount_cents: unitAmountCents,
    total_amount_cents: totalAmountCents,
    status,
    booking_date: bookingDate,
    notes,
    correction_of: null,
    void_reason: null,
    created_at: new Date().toISOString()
  });

  await saveTeamState(state);
  revalidateAll();
}

export async function voidLedgerEntryAction(formData: FormData) {
  const { state } = await requireAdmin();
  const entryId = String(formData.get("entry_id") ?? "");
  const reason = String(formData.get("void_reason") ?? "").trim() || "Storno durch Kassenwart";
  const entry = state.ledger.find((candidate) => candidate.id === entryId);

  if (!entry) {
    throw new Error("Buchung fehlt.");
  }

  entry.status = "voided";
  entry.void_reason = reason;
  await saveTeamState(state);
  revalidateAll();
}

async function requireAdmin() {
  if (!isAuthConfigured()) {
    throw new Error("Login ist noch nicht eingerichtet.");
  }

  const state = await loadTeamState();
  const { getCurrentSession } = await import("@/lib/auth");
  const session = await getCurrentSession(state);
  const member = state.members.find((candidate) => candidate.id === session?.memberId);

  if (!member || member.role !== "admin") {
    throw new Error("Keine Admin-Rechte.");
  }

  state.ledger = attachLedgerNames(state.ledger, state.members, state.catalog);
  return { state, member };
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
  revalidatePath("/login");
}
