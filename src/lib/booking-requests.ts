import type { TeamState } from "@/lib/types";

export function bookingRequestId(form: FormData, memberId: string, operation: string) {
  const id = String(form.get("booking_request_id") ?? "");
  if (!id) return null;
  if (!/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(id)) {
    throw new Error("Ungültige Buchungskennung. Bitte das Formular erneut öffnen.");
  }
  return `${memberId}:${operation}:${id}`;
}

export function requestAlreadyBooked(state: TeamState, id: string | null) {
  return Boolean(id && state.ledger.some((entry) => entry.request_id === id));
}
