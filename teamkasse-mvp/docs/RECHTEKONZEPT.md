# Rollen- und Rechtekonzept

## Admin / Kassenwart

- sieht alle Mitglieder der eigenen Mannschaft
- pflegt Strafenkatalog und Getraenkekatalog
- bucht Strafen, Getraenke, Zahlungen und Anpassungen
- storniert Buchungen nachvollziehbar
- sieht Summen je Spieler und Mannschaft

## Spieler

- meldet sich mit eigenem Namen und eigener PIN an
- sieht nur eigene Mitgliedschaftsdaten
- sieht nur eigene Buchungen, Zahlungen und Salden
- kann keine Buchungen veraendern
- kann keine anderen Spieler sehen

## Serverseitige Grenze im MVP

Die verbindliche Pruefung liegt in Server-Aktionen und Server-Abfragen:

- `TEAMKASSE_ADMIN_PASSWORD` oeffnet den Kassenwart-Zugang.
- Spieler-PINs werden nicht im Klartext gespeichert, sondern als HMAC-Hash.
- Die Session liegt als signiertes, `httpOnly` Cookie im Browser.
- Admin-Aktionen rufen `requireAdmin()` auf.
- Spieler-Abfragen filtern Ledger, Salden und Mitgliedsdaten auf den angemeldeten Spieler.

Wichtig: Wenn spaeter mehrere Mannschaften, Einladungslinks oder echte Bankfunktionen dazukommen, ist Supabase/Postgres mit Row Level Security weiterhin ein guter naechster Sicherheitsausbau.
