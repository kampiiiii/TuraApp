# Datenmodell

## Kernidee

Alle finanziellen Bewegungen liegen in `ledger_entries`. Strafen, Getraenke, Zahlungen und Korrekturen sind dadurch eine gemeinsame, pruefbare Historie.

## Speicherstruktur

Im Netlify-only-MVP liegt der Zustand als ein JSON-Dokument in Netlify Blobs:

- `team`: Mannschaft inkl. optionaler Konto-Metadaten fuer spaetere SEPA-Funktionen.
- `members`: Spieler/Admins innerhalb einer Mannschaft. Der Beitrittszeitpunkt verhindert rueckwirkende Monatsbeitraege fuer neue Spieler.
- `catalog`: Strafenkatalog und Getraenkekatalog mit Preisen, manueller Reihenfolge und optionaler Sachleistung.
- `ledger`: Buchungen pro Mitglied inklusive des damaligen Sachleistungstextes, ihres Erledigungsstatus und Storno-Metadaten.
- `recurring_plans`: Monatsregeln fuer Beitraege oder Getraenkeflats, Zielspieler, Startmonat und optionalen Jahreszins.
- `suppressed_recurring_entries`: interne Schluessel unterdrueckter Automatikbuchungen, damit sie nicht neu erzeugt werden.

Die Typen liegen in `src/lib/types.ts`. Der Zugriff auf den Speicher liegt in `src/lib/team-store.ts`.

## Wichtige Regeln

- Positive Betraege erhoehen die Schuld.
- Zahlungen werden als negativer Betrag gespeichert.
- Negative Zahlungen werden automatisch auf die aeltesten positiven Buchungen desselben Spielers verteilt.
- `settled_amount_cents` speichert den angerechneten Betrag; daraus entstehen die Status `open`, `partial` und `paid`.
- Buchungen koennen storniert werden. Der Eintrag bleibt im Ledger und erhaelt `status = "voided"`, `void_reason`, `voided_at`, `voided_by_member_id` und `voided_by_name`.
- Bearbeiten erzeugt eine neue korrigierte Buchung mit `correction_of` auf die Ursprungsbuchung und storniert die Ursprungsbuchung nachvollziehbar.
- Monatsregeln erzeugen pro Spieler und Monat hoechstens eine Buchung und holen fehlende Monate beim naechsten App-Aufruf nach.
- Ein optionaler Jahreszins wird nach 30 Tagen fuer jeweils 30 Tage anteilig nur auf den noch offenen Hauptbetrag berechnet.
- Zinsbuchungen werden nicht selbst verzinst.
- Sachleistungen wie `1 Kiste Bier` werden unabhaengig vom Geldbetrag als offen oder mitgebracht gespeichert.
- Beim Loeschen eines Spielers bleiben dessen Ledger-Eintraege mit gespeichertem Namen erhalten.
- Korrekturen koennen ueber `correction_of` auf eine Ursprungsbuchung zeigen.
- `void_reason`, `voided_at`, `voided_by_member_id`, `voided_by_name`, `correction_of` und `created_at` machen Aenderungen nachvollziehbar.
- Die Migration auf State-Version 5 ist additiv: vorhandene Ledger-Eintraege bekommen fehlende Storno-Metadaten als `null`.
- Fuer spaetere Datenbank-Nutzung kann dieses Modell fast direkt in echte Tabellen ueberfuehrt werden.
