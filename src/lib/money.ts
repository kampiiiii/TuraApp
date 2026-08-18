export function formatMoney(cents: number, currency = "EUR") {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency
  }).format(cents / 100);
}

export function parseEuroToCents(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return 0;
  }

  const normalized = raw.replace(/\s/g, "").replace(",", ".");
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    throw new Error("Betrag konnte nicht gelesen werden.");
  }

  return Math.round(parsed * 100);
}

export function parseQuantity(value: FormDataEntryValue | null) {
  const raw = String(value ?? "1").trim().replace(",", ".");
  const parsed = Number(raw || "1");

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Menge muss groesser als 0 sein.");
  }

  return parsed;
}

export function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}
