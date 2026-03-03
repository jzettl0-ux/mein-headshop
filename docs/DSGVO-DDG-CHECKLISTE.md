# DSGVO & DDG – Implementierungs-Checkliste

Diese Checkliste hilft dir, alle relevanten Anforderungen aus der Datenschutz-Grundverordnung (DSGVO) und dem Digitale-Dienste-Gesetz (DDG) umzusetzen.

---

## Bereits implementiert

| Anforderung | Status | Umsetzung |
|-------------|--------|-----------|
| **Cookie-Banner** (Einwilligung vor Marketing-Cookies) | ✅ | `ConsentBanner.tsx`, Google Consent Mode v2 |
| **Cookie-Einstellungen** (jederzeit änderbar) | ✅ | Footer-Link „Cookie-Einstellungen“ |
| **Datenschutzerklärung** | ✅ | `/privacy` mit Verantwortlicher, Rechten, Auftragsverarbeitern |
| **Impressum** (Art. 6 DDG) | ✅ | `/impressum` mit Company-Daten |
| **AGB & Widerrufsbelehrung** | ✅ | `/terms`, `/returns` |
| **Checkout: Pflicht-Checkboxen** (Datenschutz + AGB) | ✅ | Vor Bestellung zwingend |
| **Datenexport** (Art. 15 DSGVO) | ✅ | `/profile/privacy` → „Meine Daten anfordern“ |
| **Konto-Löschung** (Art. 17 DSGVO) | ✅ | `/profile/privacy` → Bestätigung per E-Mail |
| **Widerrufsbutton** (Pflicht ab 19.06.2026) | ✅ | Footer ab Stichtag |
| **Recht auf Beschwerde** (Art. 77 DSGVO) | ✅ | In Datenschutzerklärung erwähnt |
| **Admin: DSGVO-Kundendaten löschen** | ✅ | Admin → Einstellungen → DSGVO – Kundendaten |
| **Auftragsverarbeiter** (Supabase, Mollie, Resend) | ✅ | In Datenschutzerklärung aufgeführt |
| **Datenübertragung Drittländer** | ✅ | Standardvertragsklauseln erwähnt |

---

## Admin: Kundendaten löschen (Art. 17 DSGVO)

Unter **Admin → Einstellungen → DSGVO – Kundendaten**:

1. **Ausstehende Löschanträge**: Kunden, die die Löschung angefragt und auf den Bestätigungslink warten.
2. **Manuelle Löschung**: E-Mail eingeben → Suchen → Löschung durchführen (mit Bestätigung „LÖSCHEN BESTÄTIGEN“).

**Ablauf der Löschung:**
- Bestellungen werden **anonymisiert** (Name, E-Mail, Adresse entfernt) – Finanzdaten (Summen, Artikel) bleiben 10 Jahre für das Finanzamt.
- Kontaktanfragen, Bewertungsnamen und Referral-Daten werden anonymisiert.
- Konto, Adressen, Treuepunkte werden gelöscht.

---

## Manuelle Anpassungen (vor Go-Live)

1. **`.env.local` / Umgebungsvariablen**
   - `INVOICE_COMPANY_NAME`, `INVOICE_ADDRESS`, etc. mit echten Firmendaten
   - `COMPANY_REPRESENTED_BY` (z. B. „Max Mustermann, Geschäftsführer“)
   - `INVOICE_EMAIL` für Datenschutz-Anfragen und Widerruf

2. **Rechtliche Prüfung**
   - Datenschutzerklärung von einem Rechtsanwalt prüfen lassen
   - AGB und Widerrufsbelehrung prüfen lassen
   - Impressum mit Registereintrag, USt-ID etc. vervollständigen

3. **Handelsregister / Vertreten durch**
   - Im Impressum: Registergericht und Registernummer eintragen
   - `COMPANY_REPRESENTED_BY` in ENV setzen

4. **AVV (Auftragsverarbeitungsverträge)**
   - Mit Supabase, Mollie, Resend prüfen, ob AVV geschlossen
   - Bei Drittland-Übermittlungen: Standardvertragsklauseln dokumentieren

---

## DSGVO – Wichtige Rechte (bereits umgesetzt)

| Recht | Art. DSGVO | Umsetzung |
|-------|------------|-----------|
| Auskunft | 15 | Datenexport unter `/profile/privacy` |
| Löschung | 17 | Konto-Löschung mit Bestätigungs-Mail |
| Berichtigung | 16 | Nutzer kann Profil/Adressen bearbeiten |
| Einschränkung | 18 | Auf Anfrage (manuell) |
| Datenübertragbarkeit | 20 | Export als JSON |
| Widerspruch | 21 | Cookie-Opt-Out, Werbe-Mail-Opt-Out |
| Beschwerde Aufsichtsbehörde | 77 | In Datenschutzerklärung genannt |
| Widerruf Einwilligung | 7 Abs. 3 | Cookie-Einstellungen, jederzeit |

---

## DDG – Digitale-Dienste-Gesetz

| Anforderung | Status | Hinweis |
|-------------|--------|---------|
| Anbieterkennzeichnung (Art. 6 DDG) | ✅ | Impressum mit allen Pflichtangaben |
| Transparenz (Art. 26) | ✅ | Datenschutzerklärung, AGB |
| Widerrufsbutton (ab 19.06.2026) | ✅ | Footer-Link „Widerruf ausüben“ |
| Gewährleistungs-/Garantie-Label (ab 27.09.2026) | ✅ | Auf `/returns#gewaehrleistung` |
| Beschwerdemechanismus | ⚠️ | Für kleine Shops: Kontaktformular / E-Mail genügt |

---

## Verzeichnis der Verarbeitungstätigkeiten (VVT)

Ein formales Verzeichnis der Verarbeitungstätigkeiten (Art. 30 DSGVO) ist gesetzlich vorgeschrieben, aber nicht im Code abgebildet. Du solltest es separat führen (z. B. Excel/PDF) mit:

- Zweck der Verarbeitung
- Kategorien betroffener Personen
- Kategorien personenbezogener Daten
- Empfänger / Auftragsverarbeiter
- Speicherdauer
- Technisch-organisatorische Maßnahmen
- Rechtsgrundlage

---

## Kontakt für Datenschutz-Anfragen

Nutzer können sich unter der in Impressum und Datenschutzerklärung angegebenen E-Mail an dich wenden:
- Auskunftsanfragen (Art. 15)
- Löschanträge (Art. 17)
- Berichtigung (Art. 16)
- Sonstige Betroffenenrechte

Die E-Mail-Adresse kommt aus `INVOICE_EMAIL` bzw. `RESEND_FROM_EMAIL` und wird in `lib/company.ts` verwendet.
