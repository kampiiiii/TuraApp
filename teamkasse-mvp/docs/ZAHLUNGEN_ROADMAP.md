# Zahlungsarchitektur

## Version 1

- Keine automatische Bankanbindung.
- Zahlungen werden vom Admin manuell als `ledger_entries.type = 'payment'` gebucht.
- Zahlungen sind negative Ledger-Betraege und senken den Gesamtsaldo.
- Bankdaten der Mannschaft liegen optional in `teams`, werden aber noch nicht fuer echte Zahlungsfunktionen genutzt.

## Naechster Schritt: SEPA-QR

Vorgesehen ist ein Modul, das aus diesen Daten einen Zahlungsauftrag vorbereitet:

- Empfaenger aus `teams.bank_account_holder`
- IBAN aus `teams.bank_iban`
- Betrag aus `member_balances.balance_cents`
- Verwendungszweck aus Teamname, Spielername und Zeitraum

Die App sollte daraus zuerst nur einen QR-Code fuer die Banking-App erzeugen. Die Zahlung bleibt trotzdem erst dann verbindlich verbucht, wenn der Kassenwart sie bestaetigt.

## Spaeter: Bankabgleich

Fuer Bankabgleich gibt es zwei sichere Ausbaustufen:

- CSV-Import aus dem Online-Banking, manuell durch den Kassenwart.
- Open-Banking-Anbindung ueber einen externen Anbieter, falls Kosten, Datenschutz und Vereinsregeln passen.

`payment_allocations` ist bereits vorbereitet, damit eine Zahlung spaeter einzelnen offenen Buchungen zugeordnet werden kann.
