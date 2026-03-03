# VIES USt-IdNr.-Validierung

Phase 2.3 des KYB-Workflows: Validierung der Umsatzsteuer-Identifikationsnummer über den offiziellen EU-Dienst **VIES** (VAT Information Exchange System).

## Funktionsweise

- **API:** Offizieller SOAP-Service der EU-Kommission (`ec.europa.eu/taxation_customs/vies`)
- **Keine API-Keys** erforderlich – öffentlicher Dienst
- **Abhängigkeit:** `soap` (npm)

## Verwendung im Admin

1. **Neuer Vendor:** Im Formular „Neuer Vendor“ neben dem USt-IdNr.-Feld auf **Prüfen** klicken.
2. **Vendor-Detail:** Bei vorhandener USt-IdNr. in den Stammdaten auf **VIES prüfen** klicken.

## Akzeptierte Formate

- `DE123456789` (Land + Nummer)
- `DE 123456789` (mit Leerzeichen)
- `123456789` (nur Nummer → DE wird angenommen)

## Hinweise

- VIES kann zeitweise nicht erreichbar sein (z. B. Wartung).
- Für deutsche Unternehmen liefert VIES meist nur die Validität, weniger Zusatzinfos.
- Bei anderen EU-Ländern werden ggf. Firmenname und Adresse zurückgegeben.
