# Datenmodell

## Kernidee

Alle finanziellen Bewegungen liegen in `ledger_entries`. Strafen, Getraenke, Zahlungen und Korrekturen sind dadurch eine gemeinsame, pruefbare Historie.

## Speicherstruktur

Im Netlify-only-MVP liegt der Zustand als ein JSON-Dokument in Netlify Blobs:

- `team`: Mannschaft inkl. optionaler Konto-Metadaten fuer spaetere SEPA-Funktionen.
- `members`: Spieler/Admins innerhalb einer Mannschaft. Spieler haben eine PIN, Admins koennen weitere PINs setzen.
- `catalog`: Strafenkatalog und Getraenkekatalog mit Preisen, manueller Reihenfolge und optionaler Sachleistung.
- `ledger`: Buchungen pro Mitglied inklusive des damaligen Sachleistungstextes und ihres Erledigungsstatus.

Die Typen liegen in `src/lib/types.ts`. Der Zugriff auf den Speicher liegt in `src/lib/team-store.ts`.

## Wichtige Regeln

- Positive Betraege erhoehen die Schuld.
- Zahlungen werden als negativer Betrag gespeichert.
- Buchungen koennen storniert oder durch einen Admin dauerhaft geloescht werden.
- Sachleistungen wie `1 Kiste Bier` werden unabhaengig vom Geldbetrag als offen oder mitgebracht gespeichert.
- Beim Loeschen eines Spielers bleiben dessen Ledger-Eintraege mit gespeichertem Namen erhalten.
- Korrekturen koennen ueber `correction_of` auf eine Ursprungsbuchung zeigen.
- `void_reason` und Zeitstempel machen Aenderungen nachvollziehbar.
- Fuer spaetere Datenbank-Nutzung kann dieses Modell fast direkt in echte Tabellen ueberfuehrt werden.
