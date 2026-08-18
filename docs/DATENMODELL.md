# Datenmodell

## Kernidee

Alle finanziellen Bewegungen liegen in `ledger_entries`. Strafen, Getraenke, Zahlungen und Korrekturen sind dadurch eine gemeinsame, pruefbare Historie.

## Speicherstruktur

Im Netlify-only-MVP liegt der Zustand als ein JSON-Dokument in Netlify Blobs:

- `team`: Mannschaft inkl. optionaler Konto-Metadaten fuer spaetere SEPA-Funktionen.
- `members`: Spieler/Admins innerhalb einer Mannschaft. Der Beitrittszeitpunkt verhindert rueckwirkende Monatsbeitraege fuer neue Spieler.
- `catalog`: Strafenkatalog und Getraenkekatalog mit Preisen, manueller Reihenfolge und optionaler Sachleistung.
- `ledger`: Buchungen pro Mitglied inklusive des damaligen Sachleistungstextes und ihres Erledigungsstatus.
- `recurring_plans`: Monatsregeln fuer Beitraege oder Getraenkeflats, Zielspieler, Startmonat und optionalen Jahreszins.
- `suppressed_recurring_entries`: interne Schluessel dauerhaft geloeschter Automatikbuchungen, damit sie nicht neu erzeugt werden.

Die Typen liegen in `src/lib/types.ts`. Der Zugriff auf den Speicher liegt in `src/lib/team-store.ts`.

## Wichtige Regeln

- Positive Betraege erhoehen die Schuld.
- Zahlungen werden als negativer Betrag gespeichert.
- Negative Zahlungen werden automatisch auf die aeltesten positiven Buchungen desselben Spielers verteilt.
- `settled_amount_cents` speichert den angerechneten Betrag; daraus entstehen die Status `open`, `partial` und `paid`.
- Buchungen koennen storniert oder durch einen Admin dauerhaft geloescht werden.
- Monatsregeln erzeugen pro Spieler und Monat hoechstens eine Buchung und holen fehlende Monate beim naechsten App-Aufruf nach.
- Ein optionaler Jahreszins wird nach 30 Tagen fuer jeweils 30 Tage anteilig nur auf den noch offenen Hauptbetrag berechnet.
- Zinsbuchungen werden nicht selbst verzinst.
- Sachleistungen wie `1 Kiste Bier` werden unabhaengig vom Geldbetrag als offen oder mitgebracht gespeichert.
- Beim Loeschen eines Spielers bleiben dessen Ledger-Eintraege mit gespeichertem Namen erhalten.
- Korrekturen koennen ueber `correction_of` auf eine Ursprungsbuchung zeigen.
- `void_reason` und Zeitstempel machen Aenderungen nachvollziehbar.
- Fuer spaetere Datenbank-Nutzung kann dieses Modell fast direkt in echte Tabellen ueberfuehrt werden.
