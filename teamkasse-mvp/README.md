# Teamkasse MVP

Kostenlose MVP-Web-App/PWA fuer eine Fussballmannschaft: Strafen, Getraenke, Zahlungen und nachvollziehbare Korrekturen.

## Stack

- Next.js App Router als PWA
- Netlify Hosting plus Netlify Functions
- Netlify Blobs als einfacher Speicher fuer das MVP
- Eigener Login: Admin-Passwort fuer Kassenwarte, Spieler-PINs und geschuetzte Selbstregistrierung

Die App braucht kein Supabase-Projekt. Ohne Login-Variablen zeigt sie eine Setup-Meldung. Sobald die Netlify-Variablen gesetzt sind, koennen Admin und Spieler getrennt rein.

## Lokal starten

```bash
npm install
npm run dev
```

Dann im Browser `http://localhost:3000` oeffnen.

## Login einrichten

Lege lokal eine `.env.local` an oder setze die Werte in Netlify:

```bash
TEAMKASSE_ADMIN_PASSWORD=ein-sicheres-admin-passwort
TEAMKASSE_SESSION_SECRET=ein-langes-zufaelliges-geheimnis
TEAMKASSE_JOIN_CODE=ein-gemeinsamer-mannschaftscode
```

Der Kassenwart meldet sich mit dem Admin-Passwort an. Neue Spieler registrieren sich einmalig mit Mannschaftscode, Name und eigener PIN. Danach melden sie sich mit Name und PIN an. Admins koennen Rollen und Spieler-PINs weiterhin in der Admin-Seite verwalten. Die bei einem Admin-Konto gespeicherte Spieler-PIN gilt erst wieder, wenn dieses Konto die Rolle `Spieler` erhaelt.

## Netlify Deployment

```bash
npm run build
```

Netlify-Einstellungen:

- Build command: `npm run build`
- Publish directory: `.next`
- Runtime: Next.js
- Environment variables: `TEAMKASSE_ADMIN_PASSWORD`, `TEAMKASSE_SESSION_SECRET` und `TEAMKASSE_JOIN_CODE`

## Enthaltene MVP-Funktionen

- Rollen: Admin/Kassenwart und Spieler
- Admin: Spieler und Rollen verwalten, Katalog sortieren, Strafen/Getraenke/Zahlungen buchen, Sachleistungen abhaken sowie Eintraege stornieren oder loeschen
- Spieler: eigene Buchungen, Zahlungen, Sachleistungen, Summen und Gesamtsaldo sehen sowie die eigene PIN aendern
- Neue Spieler: eigener Zugang per Mannschaftscode, Name und PIN
- Historie: geloeschte Spieler werden aus dem Login entfernt, ihre vorhandenen Buchungen und Salden bleiben erhalten
- Server-Aktionen pruefen Adminrechte, Spieler bekommen nur eigene Daten
- PWA-Grundlage: Manifest, Icon, Offline-Fallback, Service Worker

## Projekt-Dokumente

- `docs/DATENMODELL.md`
- `docs/RECHTEKONZEPT.md`
- `docs/SEITENSTRUKTUR.md`
- `docs/ZAHLUNGEN_ROADMAP.md`

## Geplante Erweiterungen

- SEPA-QR-Code je offenem Saldo
- Zahlungsabgleich per CSV-Import oder spaeter Open-Banking
- Einladungslinks als spaetere Alternative zum Mannschaftscode
- Detailzuordnung von Zahlungen auf einzelne Buchungen
- Export fuer Kassenpruefung
