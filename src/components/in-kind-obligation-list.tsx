import { Check, PackageCheck, RotateCcw } from "lucide-react";
import { setInKindCompletionAction } from "@/app/actions";
import type { LedgerEntry } from "@/lib/types";

export function InKindObligationList({
  entries,
  canManage = false,
  disabled = false
}: {
  entries: LedgerEntry[];
  canManage?: boolean;
  disabled?: boolean;
}) {
  const obligations = entries
    .filter((entry) => entry.in_kind_label && entry.status !== "voided")
    .sort((left, right) => Number(Boolean(left.in_kind_completed_at)) - Number(Boolean(right.in_kind_completed_at)));

  if (!obligations.length) {
    return null;
  }

  const openCount = obligations.filter((entry) => !entry.in_kind_completed_at).length;

  return (
    <section className="in-kind-panel">
      <div className="section-title-row">
        <span className="section-heading">
          <span className="section-icon">
            <PackageCheck size={19} />
          </span>
          <span>
            <h2>Sachleistungen</h2>
            <small>Kisten, Material und andere offene Abgaben</small>
          </span>
        </span>
        <span>{openCount} offen</span>
      </div>

      <div className="in-kind-list">
        {obligations.map((entry) => {
          const completed = Boolean(entry.in_kind_completed_at);

          return (
            <article className={completed ? "in-kind-item completed" : "in-kind-item"} key={entry.id}>
              <span className="in-kind-item-main">
                <strong>{entry.in_kind_label}</strong>
                <small>
                  {entry.member_name} | {formatDate(entry.booking_date)} | {entry.description}
                </small>
              </span>

              <span className={completed ? "in-kind-state completed" : "in-kind-state open"}>
                {completed ? "Mitgebracht" : "Offen"}
              </span>

              {canManage ? (
                <form action={setInKindCompletionAction} className="inline-action">
                  <input type="hidden" name="entry_id" value={entry.id} />
                  <input type="hidden" name="completed" value={completed ? "false" : "true"} />
                  <button className="ghost-button in-kind-action" type="submit" disabled={disabled}>
                    {completed ? <RotateCcw size={15} /> : <Check size={16} />}
                    {completed ? "Wieder oeffnen" : "Abhaken"}
                  </button>
                </form>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("de-DE").format(new Date(date));
}
