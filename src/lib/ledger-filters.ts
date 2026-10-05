import type { LedgerEntry, LedgerType } from "@/lib/types";

export type LedgerFilters = {
  query: string;
  memberId: string;
  type: LedgerType | "all";
  status: "all" | "open" | "partial" | "paid" | "voided";
  hideVoided: boolean;
  dateFrom: string;
  dateTo: string;
  order: "newest" | "oldest";
};

export const DEFAULT_LEDGER_FILTERS: LedgerFilters = {
  query: "", memberId: "", type: "all", status: "all", hideVoided: true,
  dateFrom: "", dateTo: "", order: "newest"
};

export function filterLedger(entries: LedgerEntry[], filters: LedgerFilters): LedgerEntry[] {
  const terms = normalize(filters.query).split(/\s+/).filter(Boolean);
  return entries.filter((entry) => {
    if (filters.hideVoided && entry.status === "voided") return false;
    if (filters.memberId && entry.member_id !== filters.memberId) return false;
    if (filters.type !== "all" && entry.type !== filters.type) return false;
    if (filters.status === "open") {
      if (entry.status !== "open" && entry.status !== "partial") return false;
    } else if (filters.status !== "all" && entry.status !== filters.status) return false;
    const date = entry.booking_date.slice(0, 10);
    if (filters.dateFrom && date < filters.dateFrom) return false;
    if (filters.dateTo && date > filters.dateTo) return false;
    const searchable = normalize([entry.member_name, entry.description, entry.notes, entry.catalog_item_name].join(" "));
    return terms.every((term) => searchable.includes(term));
  }).sort((left, right) => {
    const comparison = left.booking_date.localeCompare(right.booking_date)
      || left.created_at.localeCompare(right.created_at)
      || left.id.localeCompare(right.id);
    return filters.order === "oldest" ? comparison : -comparison;
  });
}

export function paginateLedger(entries: LedgerEntry[], page: number, pageSize = 50) {
  const pageCount = Math.max(1, Math.ceil(entries.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), pageCount);
  const start = (currentPage - 1) * pageSize;
  return { entries: entries.slice(start, start + pageSize), currentPage, pageCount, start };
}

function normalize(value: string) {
  return value.toLocaleLowerCase("de-DE").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ß/g, "ss");
}
