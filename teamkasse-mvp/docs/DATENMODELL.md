# Datenmodell

## Kernidee

Alle finanziellen Bewegungen liegen in `ledger_entries`. Strafen, Getraenke, Zahlungen und Korrekturen sind dadurch eine gemeinsame, pruefbare Historie.

## Speicherstruktur

Im Netlify-only-MVP liegt der Zustand als ein JSON-Dokument in Netlify Blobs:

- `team`: Mannschaft inkl. optionaler Konto-Metadaten fuer spaetere SEPA-Funktionen.
- `members`: Spieler/Admins innerhalb einer Mannschaft. Spieler haben eine PIN, Admins koennen weitere PINs setzen.
- `catalog`: Strafenkatalog und Getraenkekatalog mit Preisen.
- `ledger`: Buchungen pro Mitglied.

Die Typen liegen in `src/lib/types.ts`. Der Zugriff auf den Speicher liegt in `src/lib/team-store.ts`.

## Wichtige Regeln

- Positive Betraege erhoehen die Schuld.
- Zahlungen werden als negativer Betrag gespeichert.
- Eintraege werden nicht geloescht, sondern mit `status = 'voided'` storniert.
- Korrekturen koennen ueber `correction_of` auf eine Ursprungsbuchung zeigen.
- `void_reason` und Zeitstempel machen Aenderungen nachvollziehbar.
- Fuer spaetere Datenbank-Nutzung kann dieses Modell fast direkt in echte Tabellen ueberfuehrt werden.
