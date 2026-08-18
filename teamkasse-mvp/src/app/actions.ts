"use server";

import { randomUUID } from "node:crypto";
import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearSessionCookie,
  hashPin,
  isAuthConfigured,
  isPlayerRegistrationConfigured,
  setSessionCookie,
  verifyAdminPassword,
  verifyJoinCode,
  verifyPin
} from "@/lib/auth";
import { parseEuroToCents, parseQuantity } from "@/lib/money";
import { attachLedgerNames, loadTeamState, saveTeamState } from "@/lib/team-store";
import type { CatalogItem, CatalogType, LedgerType, StoredTeamMember } from "@/lib/types";

export type PinChangeState = {
  status: "idle" | "success" | "error";
  message: string;
};

export type LoginState = {
  status: "idle" | "error";
  message: string;
};

export type MemberPinState = {
  status: "idle" | "success" | "error";
  message: string;
};

export type SelfDrinkState = {
  status: "idle" | "success" | "error";
  message: string;
};

export type RegistrationState = {
  status: "idle" | "error";
  message: string;
};

export async function loginAdminAction(
  _previousState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const password = String(formData.get("admin_password") ?? "");
  const memberId = String(formData.get("member_id") ?? "");

  if (!isAuthConfigured() || !verifyAdminPassword(password)) {
    return { status: "error", message: "Das Admin-Passwort stimmt nicht. Eine Spieler-PIN funktioniert hier nicht." };
  }

  const state = await loadTeamState();
  const admin = state.members.find(
    (member) => member.active && member.role === "admin" && (!memberId || member.id === memberId)
  );

  if (!admin) {
    return { status: "error", message: "Bitte ein Admin-Konto auswaehlen." };
  }

  await setSessionCookie(admin);
  redirect("/dashboard");
}

export async function loginPlayerAction(
  _previousState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const memberId = String(formData.get("member_id") ?? "");
  const pin = String(formData.get("pin") ?? "");

  if (!isAuthConfigured()) {
    return { status: "error", message: "Der Login ist noch nicht eingerichtet." };
  }

  const state = await loadTeamState();
  const member = state.members.find(
    (candidate) => candidate.id === memberId && candidate.active && candidate.role === "player"
  );

  if (!member || !verifyPin(pin, member.pin_hash)) {
    return { status: "error", message: "Spieler oder PIN stimmt nicht. Admin-Konten verwenden das Admin-Passwort." };
  }

  await setSessionCookie(member);
  redirect("/dashboard");
}

export async function registerPlayerAction(
  _previousState: RegistrationState,
  formData: FormData
): Promise<RegistrationState> {
  if (!isAuthConfigured() || !isPlayerRegistrationConfigured()) {
    return { status: "error", message: "Die Selbstregistrierung ist noch nicht freigeschaltet." };
  }

  const joinCode = String(formData.get("join_code") ?? "");
  const displayName = normalizeMemberName(formData.get("display_name"));
  const jerseyNumberRaw = String(formData.get("jersey_number") ?? "").trim();
  const pin = String(formData.get("pin") ?? "").trim();
  const confirmPin = String(formData.get("confirm_pin") ?? "").trim();
  const jerseyNumber = jerseyNumberRaw ? Number(jerseyNumberRaw) : null;

  if (!verifyJoinCode(joinCode)) {
    return { status: "error", message: "Der Mannschaftscode stimmt nicht." };
  }

  if (displayName.length < 2 || displayName.length > 80) {
    return { status: "error", message: "Bitte einen gueltigen Namen eingeben." };
  }

  if (jerseyNumber !== null && (!Number.isInteger(jerseyNumber) || jerseyNumber < 1 || jerseyNumber > 99)) {
    return { status: "error", message: "Die Rueckennummer muss zwischen 1 und 99 liegen." };
  }

  if (pin.length < 4) {
    return { status: "error", message: "Die PIN muss mindestens 4 Zeichen haben." };
  }

  if (pin !== confirmPin) {
    return { status: "error", message: "Die beiden PINs stimmen nicht ueberein." };
  }

  const state = await loadTeamState();
  if (hasMemberWithName(state.members, displayName)) {
    return { status: "error", message: "Dieser Spielername ist bereits registriert." };
  }

  const member: StoredTeamMember = {
    id: randomUUID(),
    team_id: state.team.id,
    user_id: null,
    display_name: displayName,
    jersey_number: jerseyNumber,
    role: "player",
    active: true,
    pin_hash: hashPin(pin)
  };

  state.members.push(member);
  await saveTeamState(state);
  revalidatePath("/login");
  revalidatePath("/dashboard");
  await setSessionCookie(member);
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

export async function createMemberAction(formData: FormData) {
  const { state } = await requireAdmin();
  const displayName = normalizeMemberName(formData.get("display_name"));
  const jerseyNumberRaw = String(formData.get("jersey_number") ?? "").trim();
  const accessPin = String(formData.get("access_pin") ?? "").trim();
  const role = String(formData.get("role") ?? "player") === "admin" ? "admin" : "player";

  if (!displayName) {
    throw new Error("Name fehlt.");
  }

  if (hasMemberWithName(state.members, displayName)) {
    throw new Error("Dieser Spielername ist bereits vorhanden.");
  }

  if (jerseyNumberRaw && (!Number.isInteger(Number(jerseyNumberRaw)) || Number(jerseyNumberRaw) < 1 || Number(jerseyNumberRaw) > 99)) {
    throw new Error("Die Rueckennummer muss zwischen 1 und 99 liegen.");
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

export async function setMemberPinAction(
  _previousState: MemberPinState,
  formData: FormData
): Promise<MemberPinState> {
  const { state } = await requireAdmin();
  const memberId = String(formData.get("member_id") ?? "");
  const accessPin = String(formData.get("access_pin") ?? "").trim();
  const member = state.members.find((candidate) => candidate.id === memberId);

  if (!member) {
    return { status: "error", message: "Das Mitglied wurde nicht gefunden." };
  }

  if (accessPin.length < 4) {
    return { status: "error", message: "Die PIN muss mindestens 4 Zeichen haben." };
  }

  member.pin_hash = hashPin(accessPin);
  await saveTeamState(state);
  revalidatePath("/admin");

  return {
    status: "success",
    message:
      member.role === "admin"
        ? "Spieler-PIN gespeichert. Als Admin erfolgt die Anmeldung weiterhin mit dem Admin-Passwort."
        : "Neue Spieler-PIN erfolgreich gespeichert."
  };
}

export async function updateMemberRoleAction(formData: FormData) {
  const { state, member: currentAdmin } = await requireAdmin();
  const memberId = String(formData.get("member_id") ?? "");
  const role = String(formData.get("role") ?? "player") === "admin" ? "admin" : "player";
  const member = state.members.find((candidate) => candidate.id === memberId);

  if (!member) {
    throw new Error("Mitglied wurde nicht gefunden.");
  }

  if (member.id === currentAdmin.id && role !== "admin") {
    throw new Error("Das aktuell verwendete Admin-Konto kann sich nicht selbst herabstufen.");
  }

  if (member.role === "admin" && role === "player" && activeAdminCount(state.members) <= 1) {
    throw new Error("Der letzte Admin kann nicht zum Spieler gemacht werden.");
  }

  if (role === "player" && !member.pin_hash) {
    throw new Error("Bitte zuerst eine Spieler-PIN fuer dieses Mitglied setzen.");
  }

  member.role = role;
  await saveTeamState(state);
  revalidateAll();
}

export async function deleteMemberAction(formData: FormData) {
  const { state, member: currentAdmin } = await requireAdmin();
  const memberId = String(formData.get("member_id") ?? "");
  const confirmation = String(formData.get("confirm_delete") ?? "");
  const memberIndex = state.members.findIndex((candidate) => candidate.id === memberId);
  const member = state.members[memberIndex];

  if (confirmation !== "delete-member") {
    throw new Error("Das Loeschen wurde nicht bestaetigt.");
  }

  if (!member || memberIndex < 0) {
    throw new Error("Mitglied wurde nicht gefunden.");
  }

  if (member.id === currentAdmin.id) {
    throw new Error("Das aktuell verwendete Admin-Konto kann nicht geloescht werden.");
  }

  if (member.role === "admin" && activeAdminCount(state.members) <= 1) {
    throw new Error("Der letzte Admin kann nicht geloescht werden.");
  }

  state.members.splice(memberIndex, 1);
  await saveTeamState(state);
  revalidateAll();
}

export async function changeOwnPinAction(
  _previousState: PinChangeState,
  formData: FormData
): Promise<PinChangeState> {
  const { state, member } = await requireMember();
  const currentPin = String(formData.get("current_pin") ?? "").trim();
  const newPin = String(formData.get("new_pin") ?? "").trim();
  const confirmPin = String(formData.get("confirm_pin") ?? "").trim();

  if (member.role !== "player") {
    return { status: "error", message: "Diese Funktion ist fuer Spieler-PINs vorgesehen." };
  }

  if (!verifyPin(currentPin, member.pin_hash)) {
    return { status: "error", message: "Die bisherige PIN stimmt nicht." };
  }

  if (newPin.length < 4) {
    return { status: "error", message: "Die neue PIN muss mindestens 4 Zeichen haben." };
  }

  if (newPin !== confirmPin) {
    return { status: "error", message: "Die beiden neuen PINs stimmen nicht ueberein." };
  }

  member.pin_hash = hashPin(newPin);
  await saveTeamState(state);
  revalidatePath("/profil");

  return { status: "success", message: "Deine PIN wurde geaendert." };
}

export async function createCatalogItemAction(formData: FormData) {
  const { state } = await requireAdmin();
  const type = normalizeCatalogType(formData.get("type"));
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const inKindLabel = String(formData.get("in_kind_label") ?? "").trim() || null;
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
    in_kind_label: inKindLabel,
    amount_cents: amountCents,
    active: true
  });

  await saveTeamState(state);
  revalidateAll();
}

export async function deleteCatalogItemAction(formData: FormData) {
  const { state } = await requireAdmin();
  const itemId = String(formData.get("item_id") ?? "");
  const confirmation = String(formData.get("confirm_delete") ?? "");

  if (confirmation !== "delete-catalog-item") {
    throw new Error("Das Loeschen wurde nicht bestaetigt.");
  }

  const itemIndex = state.catalog.findIndex((item) => item.id === itemId);

  if (itemIndex < 0) {
    throw new Error("Katalogeintrag wurde nicht gefunden.");
  }

  state.catalog.splice(itemIndex, 1);
  await saveTeamState(state);
  revalidateAll();
}

export async function moveCatalogItemAction(formData: FormData) {
  const { state } = await requireAdmin();
  const itemId = String(formData.get("item_id") ?? "");
  const direction = String(formData.get("direction") ?? "up") === "down" ? "down" : "up";
  const item = state.catalog.find((candidate) => candidate.id === itemId);

  if (!item) {
    throw new Error("Katalogeintrag wurde nicht gefunden.");
  }

  const typeIndexes = state.catalog
    .map((candidate, index) => (candidate.type === item.type ? index : -1))
    .filter((index) => index >= 0);
  const currentCatalogIndex = state.catalog.findIndex((candidate) => candidate.id === itemId);
  const currentTypeIndex = typeIndexes.indexOf(currentCatalogIndex);
  const targetTypeIndex = direction === "down" ? currentTypeIndex + 1 : currentTypeIndex - 1;

  if (targetTypeIndex < 0 || targetTypeIndex >= typeIndexes.length) {
    return;
  }

  const targetCatalogIndex = typeIndexes[targetTypeIndex];
  [state.catalog[currentCatalogIndex], state.catalog[targetCatalogIndex]] = [
    state.catalog[targetCatalogIndex],
    state.catalog[currentCatalogIndex]
  ];

  await saveTeamState(state);
  revalidateAll();
}

export async function sortCatalogItemsAction(formData: FormData) {
  const { state } = await requireAdmin();
  const type = normalizeCatalogType(formData.get("type"));
  const sortBy = String(formData.get("sort_by") ?? "name") === "amount" ? "amount" : "name";
  const typeIndexes = state.catalog
    .map((item, index) => (item.type === type ? index : -1))
    .filter((index) => index >= 0);
  const sortedItems = typeIndexes.map((index) => state.catalog[index]).sort((left, right) => {
    if (sortBy === "amount") {
      return left.amount_cents - right.amount_cents || left.name.localeCompare(right.name, "de");
    }

    return left.name.localeCompare(right.name, "de", { sensitivity: "base" });
  });

  typeIndexes.forEach((catalogIndex, sortedIndex) => {
    state.catalog[catalogIndex] = sortedItems[sortedIndex];
  });

  await saveTeamState(state);
  revalidateAll();
}

export async function createSelfDrinkAction(
  _previousState: SelfDrinkState,
  formData: FormData
): Promise<SelfDrinkState> {
  const { state, member } = await requireMember();
  const catalogItemId = String(formData.get("catalog_item_id") ?? "");
  const quantityRaw = Number(String(formData.get("quantity") ?? "1").replace(",", "."));

  if (member.role !== "player") {
    return { status: "error", message: "Diese Buchung ist nur fuer Spieler vorgesehen." };
  }

  if (!Number.isInteger(quantityRaw) || quantityRaw < 1 || quantityRaw > 50) {
    return { status: "error", message: "Bitte eine Menge zwischen 1 und 50 eingeben." };
  }

  const drink = state.catalog.find(
    (item) => item.id === catalogItemId && item.team_id === state.team.id && item.type === "drink" && item.active
  );

  if (!drink) {
    return { status: "error", message: "Das Getraenk wurde im Katalog nicht gefunden." };
  }

  state.ledger.unshift({
    id: randomUUID(),
    team_id: state.team.id,
    member_id: member.id,
    member_name: member.display_name,
    catalog_item_id: drink.id,
    catalog_item_name: drink.name,
    type: "drink",
    description: drink.name,
    quantity: quantityRaw,
    unit_amount_cents: drink.amount_cents,
    total_amount_cents: drink.amount_cents * quantityRaw,
    status: "open",
    booking_date: new Date().toISOString().slice(0, 10),
    notes: null,
    in_kind_label: null,
    in_kind_completed_at: null,
    in_kind_completed_by_member_id: null,
    in_kind_completed_by_name: null,
    source: "player",
    created_by_member_id: member.id,
    created_by_name: member.display_name,
    correction_of: null,
    void_reason: null,
    created_at: new Date().toISOString()
  });

  await saveTeamState(state);
  revalidatePath("/dashboard");
  revalidatePath("/buchungen");
  refresh();

  return { status: "success", message: `${quantityRaw} x ${drink.name} wurde sofort gebucht.` };
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
  let selectedCatalogItem: CatalogItem | null = null;

  if (catalogItemId && type !== "payment" && type !== "adjustment") {
    selectedCatalogItem =
      state.catalog.find((candidate) => candidate.id === catalogItemId && candidate.team_id === state.team.id) ?? null;

    if (!selectedCatalogItem) {
      throw new Error("Katalogeintrag wurde nicht gefunden.");
    }

    unitAmountCents = selectedCatalogItem.amount_cents;
    description = selectedCatalogItem.name;
  }

  if (!description) {
    description = type === "payment" ? "Zahlung erhalten" : "Manuelle Buchung";
  }

  if (unitAmountCents === 0 && !selectedCatalogItem?.in_kind_label) {
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
    catalog_item_name: selectedCatalogItem?.name ?? null,
    type,
    description,
    quantity,
    unit_amount_cents: unitAmountCents,
    total_amount_cents: totalAmountCents,
    status,
    booking_date: bookingDate,
    notes,
    in_kind_label: selectedCatalogItem?.in_kind_label ?? null,
    in_kind_completed_at: null,
    in_kind_completed_by_member_id: null,
    in_kind_completed_by_name: null,
    source: "admin",
    created_by_member_id: admin.id,
    created_by_name: admin.display_name,
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

export async function deleteLedgerEntryAction(formData: FormData) {
  const { state } = await requireAdmin();
  const entryId = String(formData.get("entry_id") ?? "");
  const confirmation = String(formData.get("confirm_delete") ?? "");

  if (confirmation !== "permanent") {
    throw new Error("Dauerhaftes Loeschen wurde nicht bestaetigt.");
  }

  const entryIndex = state.ledger.findIndex((entry) => entry.id === entryId);
  if (entryIndex < 0) {
    throw new Error("Buchung fehlt.");
  }

  state.ledger.splice(entryIndex, 1);
  await saveTeamState(state);
  revalidateAll();
}

export async function setInKindCompletionAction(formData: FormData) {
  const { state, member: admin } = await requireAdmin();
  const entryId = String(formData.get("entry_id") ?? "");
  const completed = String(formData.get("completed") ?? "false") === "true";
  const entry = state.ledger.find((candidate) => candidate.id === entryId);

  if (!entry?.in_kind_label) {
    throw new Error("Sachleistung wurde nicht gefunden.");
  }

  if (entry.status === "voided") {
    throw new Error("Eine stornierte Buchung kann nicht abgehakt werden.");
  }

  entry.in_kind_completed_at = completed ? new Date().toISOString() : null;
  entry.in_kind_completed_by_member_id = completed ? admin.id : null;
  entry.in_kind_completed_by_name = completed ? admin.display_name : null;
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

async function requireMember() {
  if (!isAuthConfigured()) {
    throw new Error("Login ist noch nicht eingerichtet.");
  }

  const state = await loadTeamState();
  const { getCurrentSession } = await import("@/lib/auth");
  const session = await getCurrentSession(state);
  const member = state.members.find((candidate) => candidate.id === session?.memberId && candidate.active);

  if (!member) {
    throw new Error("Bitte erneut anmelden.");
  }

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

function normalizeMemberName(value: FormDataEntryValue | null) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function hasMemberWithName(members: StoredTeamMember[], displayName: string) {
  const normalizedName = displayName.toLocaleLowerCase("de-DE");
  return members.some((member) => member.display_name.toLocaleLowerCase("de-DE") === normalizedName);
}

function activeAdminCount(members: StoredTeamMember[]) {
  return members.filter((member) => member.active && member.role === "admin").length;
}

function revalidateAll() {
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  revalidatePath("/buchungen");
  revalidatePath("/katalog");
  revalidatePath("/profil");
  revalidatePath("/login");
  refresh();
}
