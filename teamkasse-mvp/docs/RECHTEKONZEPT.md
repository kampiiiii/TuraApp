# Rollen- und Rechtekonzept

## Admin / Kassenwart

- sieht alle Mitglieder der eigenen Mannschaft
- pflegt Strafenkatalog und Getraenkekatalog
- bucht Strafen, Getraenke, Zahlungen und Anpassungen
- storniert Buchungen nachvollziehbar
- sieht Summen je Spieler und Mannschaft

## Spieler

- sieht nur eigene Mitgliedschaftsdaten
- sieht nur eigene Buchungen, Zahlungen und Salden
- kann keine Buchungen veraendern
- kann keine anderen Spieler sehen

## Row Level Security

Die SQL-Migration aktiviert RLS auf allen fachlichen Tabellen. Hilfsfunktionen wie `is_team_admin(team_id)` und `is_team_member(team_id)` pruefen die Rechte serverseitig anhand von `auth.uid()`.

Wichtig: Client-Code darf nie als alleinige Sicherheitsgrenze gelten. Die UI versteckt Admin-Aktionen fuer Spieler, aber die verbindliche Grenze liegt in den Supabase-Policies.
