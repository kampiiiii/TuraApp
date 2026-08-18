# Seitenstruktur

- `/dashboard`: Startseite mit Salden, offenen Betraegen, Sachleistungen und Kurzlisten.
- `/admin`: Arbeitsbereich fuer Kassenwart: Spieler, sortierbarer Katalog und Buchungen.
- `/buchungen`: Historie der sichtbaren Buchungen.
- `/katalog`: Strafenkatalog und Getraenkekatalog.
- `/login`: Anmeldung als Kassenwart mit Admin-Passwort oder als Spieler mit PIN.
- `/profil`: Spieler koennen ihre PIN aendern und erhalten danach eine sichtbare Bestaetigung.
- `/offline`: PWA-Fallback, wenn das Geraet offline ist.

## MVP-Workflow Admin

1. Spieler anlegen.
2. Spieler-PIN setzen oder direkt beim Anlegen vergeben.
3. Katalogposition anlegen oder vorhandene Position nutzen.
4. Spieler waehlen und Strafe, Getraenk, Zahlung oder Anpassung buchen.
5. Eine Zahlung wird automatisch auf die aeltesten offenen Buchungen des Spielers angerechnet.
6. Mitgebrachte Sachleistungen abhaken.
7. Falsche Eintraege stornieren oder bei Bedarf dauerhaft loeschen.

## MVP-Workflow Spieler

1. Namen waehlen und mit PIN einloggen.
2. Eigenen Saldo sehen.
3. Eigene Buchungen und Zahlungen pruefen.
4. Eigene Sachleistungen und deren Status pruefen.
5. Eigene PIN im Profil aendern.
6. Spaeter: SEPA-QR aus offenem Saldo generieren.
