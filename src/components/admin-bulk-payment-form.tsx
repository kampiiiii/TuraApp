"use client";

import { useMemo, useState } from "react";
import { Banknote, Plus, Trash2, Users } from "lucide-react";
import { createBulkPaymentAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { formatMoney, todayInputValue } from "@/lib/money";
import type { MemberBalance, Team, TeamMember } from "@/lib/types";

export function AdminBulkPaymentForm({
  balances,
  members,
  team,
  disabled = false
}: {
  balances: MemberBalance[];
  members: TeamMember[];
  team: Team | null;
  disabled?: boolean;
}) {
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [nextMemberId, setNextMemberId] = useState("");
  const playerIds = useMemo(
    () => new Set(members.filter((member) => member.active && member.role === "player").map((member) => member.id)),
    [members]
  );
  const playerBalances = useMemo(
    () =>
      balances
        .filter((balance) => playerIds.has(balance.member_id))
        .sort((left, right) => left.display_name.localeCompare(right.display_name, "de", { sensitivity: "base" })),
    [balances, playerIds]
  );
  const availableBalances = playerBalances.filter((balance) => !selectedMemberIds.includes(balance.member_id));
  const selectedBalances = selectedMemberIds
    .map((memberId) => playerBalances.find((balance) => balance.member_id === memberId))
    .filter((balance): balance is MemberBalance => Boolean(balance));

  function addPlayer() {
    if (!nextMemberId || selectedMemberIds.includes(nextMemberId)) return;
    setSelectedMemberIds((ids) => [...ids, nextMemberId]);
    setNextMemberId("");
  }

  function removePlayer(memberId: string) {
    setSelectedMemberIds((ids) => ids.filter((id) => id !== memberId));
  }

  return (
    <section className="admin-panel admin-bulk-payment">
      <div className="section-title-row">
        <span className="section-heading">
          <span className="section-icon">
            <Users size={19} />
          </span>
          <span>
            <h2>Sammelzahlung erfassen</h2>
            <small>Mehrere Spieler mit jeweils eigenem Zahlbetrag buchen</small>
          </span>
        </span>
        <span>{selectedMemberIds.length} ausgewählt</span>
      </div>

      <div className="admin-bulk-payment-add">
        <label>
          Spieler hinzufügen
          <select value={nextMemberId} onChange={(event) => setNextMemberId(event.target.value)} disabled={disabled}>
            <option value="">Spieler auswählen</option>
            {availableBalances.map((balance) => (
              <option value={balance.member_id} key={balance.member_id}>
                {balance.display_name} | offen {formatMoney(balance.amount_due_cents, team?.currency)}
              </option>
            ))}
          </select>
        </label>
        <button className="ghost-button" type="button" onClick={addPlayer} disabled={disabled || !nextMemberId}>
          <Plus size={16} />
          Hinzufügen
        </button>
      </div>

      <form action={createBulkPaymentAction} className="admin-bulk-payment-form">
        <div className={selectedBalances.length ? "admin-bulk-payment-list has-players" : "admin-bulk-payment-list"}>
          {selectedBalances.length ? (
            selectedBalances.map((balance) => (
              <div className="admin-bulk-payment-row" key={balance.member_id}>
                <input type="hidden" name="member_ids" value={balance.member_id} />
                <span>
                  <strong>{balance.display_name}</strong>
                  <small>Offen: {formatMoney(balance.amount_due_cents, team?.currency)}</small>
                </span>
                <label>
                  Zahlbetrag
                  <input
                    name={`amount_${balance.member_id}`}
                    inputMode="decimal"
                    placeholder="0,00"
                    aria-label={`Zahlbetrag für ${balance.display_name}`}
                    disabled={disabled}
                    required
                  />
                </label>
                <button
                  className="icon-button danger"
                  type="button"
                  onClick={() => removePlayer(balance.member_id)}
                  aria-label={`${balance.display_name} aus Sammelzahlung entfernen`}
                  title="Auswahl entfernen"
                  disabled={disabled}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          ) : (
            <p className="muted compact-message">Spieler hinzufügen und den tatsächlich erhaltenen Betrag eintragen.</p>
          )}
        </div>

        <div className="admin-bulk-payment-meta">
          <label>
            Datum
            <input name="booking_date" type="date" defaultValue={todayInputValue()} disabled={disabled} />
          </label>
          <label>
            Buchungsgrund
            <input name="description" placeholder="Barzahlung erhalten" disabled={disabled} />
          </label>
          <SubmitButton
            className="primary-button"
            disabled={disabled || !selectedBalances.length}
            pendingLabel="Zahlungen werden gespeichert"
          >
            <Banknote size={16} />
            {selectedBalances.length} Zahlungen buchen
          </SubmitButton>
        </div>
      </form>
    </section>
  );
}
