# Seitenstruktur

- `/dashboard`: Startseite mit Salden, offenen Betraegen und Kurzlisten.
- `/admin`: Arbeitsbereich fuer Kassenwart: Spieler, Katalog und Buchungen.
- `/buchungen`: Historie der sichtbaren Buchungen.
- `/katalog`: Strafenkatalog und Getraenkekatalog.
- `/login`: Anmeldung mit Supabase Auth.
- `/offline`: PWA-Fallback, wenn das Geraet offline ist.

## MVP-Workflow Admin

1. Spieler anlegen.
2. Katalogposition anlegen oder vorhandene Position nutzen.
3. Spieler waehlen und Strafe, Getraenk, Zahlung oder Anpassung buchen.
4. Falsche Eintraege stornieren statt loeschen.

## MVP-Workflow Spieler

1. Einloggen.
2. Eigenen Saldo sehen.
3. Eigene Buchungen und Zahlungen pruefen.
4. Spaeter: SEPA-QR aus offenem Saldo generieren.
