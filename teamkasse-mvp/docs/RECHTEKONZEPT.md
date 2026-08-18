# Rollen- und Rechtekonzept

## Admin / Kassenwart

- sieht alle Mitglieder der eigenen Mannschaft
- pflegt Strafenkatalog und Getraenkekatalog
- sortiert Katalogpositionen und verschiebt sie nach oben oder unten
- bucht Strafen, Getraenke, Zahlungen und Anpassungen
- hakt mitgebrachte Sachleistungen ab oder oeffnet sie wieder
- aendert Mitgliederrollen zwischen Spieler und Admin
- loescht Spielerzugaenge, ohne deren Finanzhistorie zu entfernen
- storniert oder loescht Buchungen
- sieht Summen je Spieler und Mannschaft

## Spieler

- meldet sich mit eigenem Namen und eigener PIN an
- legt den Zugang beim ersten Mal mit dem Mannschaftscode selbst an
- sieht nur eigene Mitgliedschaftsdaten
- sieht nur eigene Buchungen, Zahlungen und Salden
- sieht eigene offene und erledigte Sachleistungen
- aendert die eigene PIN nach Pruefung der bisherigen PIN
- kann keine Buchungen veraendern
- kann keine anderen Spieler sehen

## Serverseitige Grenze im MVP

Die verbindliche Pruefung liegt in Server-Aktionen und Server-Abfragen:

- `TEAMKASSE_ADMIN_PASSWORD` oeffnet den Kassenwart-Zugang.
- `TEAMKASSE_JOIN_CODE` schuetzt die Selbstregistrierung vor fremden Anmeldungen.
- Spieler-PINs werden nicht im Klartext gespeichert, sondern als HMAC-Hash.
- Die Session liegt als signiertes, `httpOnly` Cookie im Browser.
- Admin-Aktionen rufen `requireAdmin()` auf.
- Die Selbstregistrierung kann ausschliesslich Spieler anlegen. Adminrechte vergibt nur ein vorhandener Admin.
- Der letzte Admin und das aktuell verwendete Admin-Konto sind gegen Herabstufung und Loeschung geschuetzt.
- Spieler-Abfragen filtern Ledger, Salden und Mitgliedsdaten auf den angemeldeten Spieler.

Wichtig: Wenn spaeter mehrere Mannschaften, Einladungslinks oder echte Bankfunktionen dazukommen, ist Supabase/Postgres mit Row Level Security weiterhin ein guter naechster Sicherheitsausbau.
