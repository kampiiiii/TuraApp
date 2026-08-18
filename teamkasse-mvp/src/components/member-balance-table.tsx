import { formatMoney } from "@/lib/money";
import type { MemberBalance, Team } from "@/lib/types";

export function MemberBalanceTable({ balances, team }: { balances: MemberBalance[]; team: Team | null }) {
  return (
    <section className="table-section">
      <div className="section-title-row">
        <h2>Mitgliederuebersicht</h2>
        <span>{balances.length} Konten</span>
      </div>
      <div className="table-wrap">
        <table className="responsive-table">
          <thead>
            <tr>
              <th>Spieler</th>
              <th>Strafen</th>
              <th>Getraenke</th>
              <th>Bezahlt</th>
              <th>Offen</th>
              <th>Saldo</th>
            </tr>
          </thead>
          <tbody>
            {balances.map((balance) => (
              <tr key={balance.member_id}>
                <td data-label="Spieler" data-wide="true">
                  {balance.display_name}
                </td>
                <td data-label="Strafen">{formatMoney(balance.fine_cents, team?.currency)}</td>
                <td data-label="Getraenke">{formatMoney(balance.drink_cents, team?.currency)}</td>
                <td data-label="Bezahlt">{formatMoney(balance.payment_cents, team?.currency)}</td>
                <td data-label="Offen">{formatMoney(balance.open_charge_cents, team?.currency)}</td>
                <td data-label="Saldo">
                  <strong>{formatMoney(balance.balance_cents, team?.currency)}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
