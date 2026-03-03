# Rechtstexte – Durchsicht und offene Punkte

Kurze technische und inhaltliche Prüfung der Rechtstexte (keine Rechtsberatung).  
**Vor Go-Live:** Alle Platzhalter mit echten Daten ersetzen und Texte von einem Rechtsanwalt prüfen lassen.

---

## Übersicht der Seiten

| Seite | Route | Datei | Datenquelle |
|-------|--------|------|-------------|
| Impressum | `/impressum` | `app/(main)/impressum/page.tsx` | `lib/company.ts` (ENV) |
| Datenschutz | `/privacy` | `app/(main)/privacy/page.tsx` | `lib/company.ts` |
| AGB | `/terms` | `app/(main)/terms/page.tsx` | `lib/company.ts` |
| Widerrufsbelehrung | `/returns` | `app/(main)/returns/page.tsx` | `lib/company.ts` |

PDF-Downloads: `/api/legal/agb` (AGB), `/api/legal/widerruf` (Widerrufsbelehrung) – nutzen ebenfalls `getCompanyInfo()`.

---

## Durchgeführte Anpassungen

- **Firmenname:** In AGB (§ 1 + Fußzeile) und Widerrufsbelehrung (Fußzeile) sowie im Impressum (Altershinweis) wurde der hardcodierte Name „Premium Headshop GmbH“ entfernt; überall wird nun `getCompanyInfo().name` verwendet (also ENV: `INVOICE_COMPANY_NAME` bzw. Fallback „Premium Headshop“).
- **Datenschutz:** Formulierung „Kontolöschung“ in „Konto-Löschung“ geändert (Lesbarkeit).

---

## Noch von dir zu erledigen (Platzhalter / echte Daten)

### Impressum
- **Registereintrag:** „Registergericht: Amtsgericht Berlin“ und „Registernummer: HRB 123456“ sind Platzhalter → durch dein tatsächliches Registergericht und deine Registernummer ersetzen (oder Abschnitt entfernen, falls kein Eintrag).
- **.env.local:** `INVOICE_COMPANY_NAME`, `INVOICE_COMPANY_ADDRESS`, `INVOICE_POSTAL_CODE`, `INVOICE_CITY`, `INVOICE_COUNTRY`, `INVOICE_VAT_ID`, `INVOICE_EMAIL`, ggf. `INVOICE_PHONE`, `COMPANY_REPRESENTED_BY` mit echten Angaben füllen.

### Datenschutz
- **Cookie-/Technologie-Tabelle:** Es sind u. a. „Google Analytics“, „Google Ads“, „GTM“ aufgeführt. Nur die Dienste behalten bzw. erwähnen, die du tatsächlich einsetzt; nicht genutzte entfernen oder durch deine Dienste ersetzen.
- **Auftragsverarbeiter:** Liste (Supabase, Mollie, Resend) passt zum Stack; bei weiteren Dienstleistern (z. B. Analytics, Support-Tools) ergänzen.

### AGB
- **§ 3 Preise:** Versandkosten 4,90 € und Freigrenze 50 € sowie 2,00 € Alterssichtprüfung – mit deinen tatsächlichen Konditionen abgleichen.
- **§ 6 Zahlungsarten:** „Vorkasse, PayPal, Kreditkarte“ – an deine bei Mollie aktivierten Zahlungsarten anpassen.
- **§ 4 Lieferung:** „2–5 Werktage“ und „Deutschland“ – ggf. an Liefergebiete und -zeiten anpassen.

### Widerrufsbelehrung
- Inhaltlich an BGB § 355 ff. angelehnt; Ausnahmen (hygienerelevant, personalisiert etc.) sind erwähnt. Bei anderen Produktgruppen oder Sonderfällen ggf. ergänzen.

---

## Rechtliche Prüfung (empfohlen)

- **Impressum:** Mit echten Daten ausfüllen und ggf. rechtlich prüfen (DDG, RStV).
- **Datenschutzerklärung:** Von einem Rechtsanwalt prüfen lassen (DSGVO, BDSG, DDG, verwendete Dienste).
- **AGB und Widerrufsbelehrung:** Von einem Rechtsanwalt prüfen und an dein Geschäftsmodell anpassen.

Die Hinweise „Muster-… / von einem Rechtsanwalt prüfen lassen“ stehen bewusst auf den jeweiligen Seiten und in der Production-Checklist.

---

## Verweise im Projekt

- Checkliste: `PRODUCTION-CHECKLIST.md` (Impressum, Datenschutz, AGB, Widerrufsbelehrung).
- DSGVO/DDG: `docs/DSGVO-DDG-CHECKLISTE.md`.
- Unternehmensdaten: `lib/company.ts` (ENV-Variablen).

Stand der Prüfung: Februar 2026.
