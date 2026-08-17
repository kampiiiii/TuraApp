# Teamkasse MVP

Kostenlose MVP-Web-App/PWA fuer eine Fussballmannschaft: Strafen, Getraenke, Zahlungen und nachvollziehbare Korrekturen.

## Stack

- Next.js App Router als PWA
- Supabase Auth, Postgres und Row Level Security
- Cloudflare Workers Deployment mit `@opennextjs/cloudflare`

Die App laeuft ohne Supabase-Konfiguration im Demo-Modus mit Beispieldaten. Sobald die Supabase-Variablen gesetzt sind, nutzt sie echte Auth- und Datenbankdaten.

## Lokal starten

```bash
npm install
npm run dev
```

Dann im Browser `http://localhost:3000` oeffnen.

## Supabase einrichten

1. Neues Supabase-Projekt anlegen.
2. `supabase/migrations/0001_initial_schema.sql` im SQL Editor ausfuehren.
3. Optional `supabase/seed.sql` ausfuehren und die Beispiel-UUIDs anpassen.
4. `.env.example` nach `.env.local` kopieren und die Supabase URL sowie den anon key eintragen.
5. Fuer den ersten echten Admin entweder die Onboarding-Policy nutzen oder im Supabase Dashboard einen Auth-User mit einem `team_members.user_id` verknuepfen.

## Cloudflare Workers Deployment

```bash
npm run deploy
```

Fuer lokale Workers-Vorschau:

```bash
npm run preview
```

Die Runtime-Variablen `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` muessen in Cloudflare auch als Build-/Runtime-Variablen gesetzt werden.

## Enthaltene MVP-Funktionen

- Rollen: Admin/Kassenwart und Spieler
- Admin: Spieler verwalten, Katalog pflegen, Strafen/Getraenke/Zahlungen buchen, Eintraege stornieren
- Spieler: eigene Buchungen, Zahlungen, Summen und Gesamtsaldo sehen
- Ledger-Modell: keine harten Loeschungen, Korrekturen laufen ueber Storno oder Gegenbuchung
- RLS-Policies: Admins sehen ihr Team, Spieler nur eigene Daten
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
