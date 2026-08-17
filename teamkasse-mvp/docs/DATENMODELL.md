# Datenmodell

## Kernidee

Alle finanziellen Bewegungen liegen in `ledger_entries`. Strafen, Getraenke, Zahlungen und Korrekturen sind dadurch eine gemeinsame, pruefbare Historie.

## Tabellen

- `teams`: Mannschaft inkl. optionaler Konto-Metadaten fuer spaetere SEPA-Funktionen.
- `profiles`: Basisprofil je Supabase Auth-User.
- `team_members`: Spieler/Admins innerhalb einer Mannschaft. `user_id` darf leer sein, damit der Admin Personen vor deren Login anlegen kann.
- `catalog_items`: Strafenkatalog und Getraenkekatalog mit Preisen.
- `ledger_entries`: Buchungen pro Mitglied.
- `payment_allocations`: vorbereitet fuer spaetere Zuordnung einer Zahlung auf einzelne offene Buchungen.

## Wichtige Regeln

- Positive Betraege erhoehen die Schuld.
- Zahlungen werden als negativer Betrag gespeichert.
- Eintraege werden nicht geloescht, sondern mit `status = 'voided'` storniert.
- Korrekturen koennen ueber `correction_of` auf eine Ursprungsbuchung zeigen.
- `created_by`, `voided_by`, `void_reason` und Zeitstempel machen Aenderungen nachvollziehbar.
