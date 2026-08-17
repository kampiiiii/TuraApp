import type { LedgerStatus } from "@/lib/types";

export function StatusPill({ status }: { status: LedgerStatus }) {
  const label = status === "open" ? "Offen" : status === "paid" ? "Bezahlt" : "Storniert";
  return <span className={`status-pill ${status}`}>{label}</span>;
}
