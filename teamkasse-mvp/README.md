# Teamkasse MVP

Kostenlose MVP-Web-App/PWA fuer eine Fussballmannschaft: Strafen, Getraenke, Zahlungen und nachvollziehbare Korrekturen.

## Stack

- Next.js App Router als PWA
- Netlify Hosting plus Netlify Functions
- Netlify Blobs als einfacher Speicher fuer das MVP
- Eigener Login: Admin-Passwort fuer den Kassenwart, Spieler-PINs fuer Spieler

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
```

Der Kassenwart meldet sich mit dem Admin-Passwort an. Spieler melden sich mit Name und PIN an. PINs kann der Kassenwart in der Admin-Seite vergeben.

## Netlify Deployment

```bash
npm run build
```

Netlify-Einstellungen:

- Build command: `npm run build`
- Publish directory: `.next`
- Runtime: Next.js
- Environment variables: `TEAMKASSE_ADMIN_PASSWORD` und `TEAMKASSE_SESSION_SECRET`

## Enthaltene MVP-Funktionen

- Rollen: Admin/Kassenwart und Spieler
- Admin: Spieler verwalten, Katalog pflegen, Strafen/Getraenke/Zahlungen buchen, Eintraege stornieren
- Spieler: eigene Buchungen, Zahlungen, Summen und Gesamtsaldo sehen
- Ledger-Modell: keine harten Loeschungen, Korrekturen laufen ueber Storno oder Gegenbuchung
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
- Einladungslinks fuer Spieler
- Detailzuordnung von Zahlungen auf einzelne Buchungen
- Export fuer Kassenpruefung
