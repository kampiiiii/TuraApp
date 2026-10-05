import { LoginRequired, NoTeamState } from "@/components/empty-state";
import { PrintButton } from "@/components/print-button";
import { PageHeader } from "@/components/page-header";
import { getAppData } from "@/lib/team-queries";
import { accountStatement } from "@/lib/account-statement";
import { validBookingDate } from "@/lib/training-bookings";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";
export default async function StatementPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const data = await getAppData(true);
  if (data.authState === "anonymous" || data.authState === "setup-required") return <LoginRequired />;
  if (!data.currentMember || !data.team) return <NoTeamState />;
  const params = await searchParams;
  const value = (key: string) => typeof params[key] === "string" ? params[key] as string : "";
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(new Date());
  const from = value("von") || today.slice(0, 7) + "-01";
  const to = value("bis") || today;
  let error = "";
  try { validBookingDate(from); validBookingDate(to); if (from > to) error = "Das Enddatum muss nach dem Startdatum liegen."; }
  catch { error = "Bitte einen gültigen Zeitraum auswählen."; }
  const admin = data.currentMember.role === "admin";
  const member = admin ? data.members.find((player) => player.id === value("spieler")) ?? data.currentMember : data.currentMember;
  const result = error ? null : accountStatement(data.ledger, member.id, from, to, value("storniert") === "1");
  const money = (amount: number) => formatMoney(amount, data.team?.currency);
  const date = (day: string) => day.split("-").reverse().join(".");
  return <div className="page-stack account-statement">
    <PageHeader eyebrow={data.team.name} title="Kontoauszug" description={member.display_name} />
    <form method="get" className="workflow-grid no-print">
      {admin ? <label>Spieler<select name="spieler" defaultValue={member.id}>{data.members.map((player) => <option key={player.id} value={player.id}>{player.display_name}{player.active ? "" : " (inaktiv)"}</option>)}</select></label> : null}
      <label>Von<input type="date" name="von" defaultValue={from} required /></label>
      <label>Bis<input type="date" name="bis" defaultValue={to} required /></label>
      <label className="workflow-check"><input type="checkbox" name="storniert" value="1" defaultChecked={value("storniert") === "1"} /> Stornierte anzeigen</label>
      <button type="submit">Anzeigen</button>
    </form>
    {error ? <p role="alert">{error}</p> : result ? <>
      <div className="section-title-row"><strong>{date(from)} bis {date(to)}</strong><PrintButton /></div>
      <div className="statement-totals">
        <span>Anfangssaldo<strong>{money(result.opening)}</strong></span>
        <span>Belastungen<strong>{money(result.charges)}</strong></span>
        <span>Gutschriften / Zahlungen<strong>{money(result.credits)}</strong></span>
        <span>{result.closing < 0 ? "Guthaben" : "Endsaldo"}<strong>{money(Math.abs(result.closing))}</strong></span>
      </div>
      <div className="statement-rows">{result.rows.map(({ entry, amount, balance }) => <div className="statement-row" key={entry.id}>
        <span><small>{date(entry.booking_date)}{entry.status === "voided" ? " · Storniert" : ""}</small><strong>{entry.description}</strong><small>{entry.quantity} × {money(entry.unit_amount_cents)}{entry.notes ? ` · ${entry.notes}` : ""}</small></span>
        <span><strong>{money(amount)}</strong><small>Saldo {money(balance)}</small></span>
      </div>)}</div>
      {!result.rows.length ? <p>Keine Buchungen in diesem Zeitraum.</p> : null}
    </> : null}
  </div>;
}
