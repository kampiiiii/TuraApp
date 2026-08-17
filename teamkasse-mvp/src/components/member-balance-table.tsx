import { formatMoney } from "@/lib/money";
import type { MemberBalance, Team } from "@/lib/types";

export function MemberBalanceTable({ balances, team }: { balances: MemberBalance[]; team: Team | null }) {
  return (
    <section className="table-section">
      <div className="section-title-row">
        <h2>Spieleruebersicht</h2>
        <span>{balances.length} aktive Spieler</span>
      </div>
      <div className="table-wrap">
        <table>
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
                <td>{balance.display_name}</td>
                <td>{formatMoney(balance.fine_cents, team?.currency)}</td>
                <td>{formatMoney(balance.drink_cents, team?.currency)}</td>
                <td>{formatMoney(balance.payment_cents, team?.currency)}</td>
                <td>{formatMoney(balance.open_charge_cents, team?.currency)}</td>
                <td>
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
