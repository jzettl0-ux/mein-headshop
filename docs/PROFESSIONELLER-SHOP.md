# Shop professioneller machen – Ideen & Prioritäten

## Sofort umsetzbar (bereits ergänzt)

- **Breadcrumbs** im Shop und auf der Produktseite (Orientierung, SEO).
- **Produkt-Metadaten** (Title/Description pro Produkt für Suchmaschinen).
- **Vertrauen im Footer** (z. B. „14 Tage Widerrufsrecht“, Supportzeiten).

---

## Trust & Glaubwürdigkeit

| Maßnahme | Aufwand | Nutzen |
|----------|---------|--------|
| **Trusted Shops / EHI-Siegel** einbinden (Badge + optional Bewertungs-Widget) | Mittel | Hohe Vertrauenswirkung |
| **Konkrete Garantie** im Trust-Banner (z. B. „30 Tage Rückgabe“ statt nur „100 % Garantie“) | Gering | Klarheit, weniger Rückfragen |
| **Supportzeiten** im Footer (z. B. „Support: Mo–Fr 10–18 Uhr“) | Gering | Erwartungsmanagement |
| **Kundenstimmen** auf der Startseite (2–3 Zitate + Name/Ort) | Mittel | Social Proof |
| **Presse-/Partner-Logos** („Wie in … erwähnt“) | Gering | Autorität |

---

## UX & Conversion

| Maßnahme | Aufwand | Nutzen |
|----------|---------|--------|
| **Sticky „In den Warenkorb“** auf der Produktseite beim Scrollen | Gering | Weniger Scrollen, mehr Abschlüsse |
| **Optionale Bestellnotiz** im Checkout („Anmerkung zur Bestellung“) | Gering | Weniger Support-Anfragen, bessere Abwicklung |
| **Klare Lieferzeiten** (z. B. „Lieferung in 2–4 Werktagen“) auf Produkt/Cart | Gering | Bereits teilweise umgesetzt, ausweiten |
| **Wunschliste** (localStorage oder Konto) | Mittel | Rückkehrer, höhere Conversion |
| **Quick-View** für Produkte in der Grid-Ansicht (Modal mit Bild, Preis, „In den Warenkorb“) | Mittel | Schnellerer Überblick |
| **„Kunden kauften auch“** auf Produktseite (bereits ähnliche Produkte – ggf. ergänzen) | Gering | Höherer Warenkorbwert |

---

## SEO & Auffindbarkeit

| Maßnahme | Aufwand | Nutzen |
|----------|---------|--------|
| **Meta-Titel/Beschreibung pro Kategorie** (z. B. `/shop?category=bongs`) | Gering | Bessere Snippets in Google |
| **Open-Graph-Bilder** pro Produkt für Social Sharing | Gering | Ansprechende Vorschau bei Teilen |
| **Strukturierte Daten** für Organisation/BreadcrumbList (bereits Product) | Gering | Rich Snippets |
| **Blog/Magazin** (Pflege, SEO-Content) | Hoch | Langfristig Traffic |

---

## Technik & Performance

| Maßnahme | Aufwand | Nutzen |
|----------|---------|--------|
| **Lazy Loading** für Bilder unterhalb des Fold | Gering | Schnellere Ladezeiten |
| **PWA** (manifest.json, Service Worker) für „Zum Homescreen“ | Mittel | Mobile Nutzer binden |
| **Skeleton-Loader** für Shop-Grid und Produktseite | Gering | Wahrgenommene Geschwindigkeit |
| **Kritische CSS/Above-the-fold** optimieren | Mittel | Gute Core Web Vitals |

---

## Recht & Service

| Maßnahme | Aufwand | Nutzen |
|----------|---------|--------|
| **AGB/Widerruf** als PDF zum Download anbieten | Gering | Professionell, für Händler nützlich |
| **Klare Widerrufsfrist** im Checkout (z. B. „14 Tage Widerrufsrecht“) | Gering | Rechtssicherheit, Vertrauen |
| **Datenschutz-Checkbox** im Checkout (Einwilligung Werbe-E-Mails, optional) | Gering | DSGVO-konform |

---

## Operativ (Admin)

| Maßnahme | Aufwand | Nutzen |
|----------|---------|--------|
| **E-Mail-Vorlagen** einheitlich (Absender, Signatur, Fußzeile) | Gering | Professioneller Eindruck |
| **Automatische „Versandt“-E-Mail** mit Tracking-Link (ggf. vorhanden) | – | Prüfen und ggf. ausbauen |
| **Dashboard-Kennzahlen** (Umsatz heute/Woche, offene Bestellungen) | Mittel | Schneller Überblick |

---

## Design (Clean Luxe)

| Maßnahme | Aufwand | Nutzen |
|----------|---------|--------|
| **Einheitliche Abstände** (z. B. 8px-Grid) in allen Bereichen | Gering | Ruhigeres, professionelleres Layout |
| **Favicon & App-Icons** in allen Größen (bereits API) | Gering | Saubere Tabs/Bookmarks |
| **Dark/Light** konsistent (bereits Theme) | – | Beibehalten und prüfen |

---

Priorität für den nächsten Sprint: **Breadcrumbs**, **Produkt-Metadaten**, **Supportzeiten/Widerruf im Footer**, danach **Sticky CTA** und **Bestellnotiz**.

---

## Weitere Ideen – Shop noch professioneller machen

*(Nach vollständiger Durchsicht von Shop, Checkout, Account, Admin und Technik.)*

### 1. Struktur & Navigation

| Maßnahme | Wo / Referenz | Aufwand | Nutzen |
|----------|----------------|---------|--------|
| **Auth-Einstieg vereinheitlichen** | `app/auth/` und `app/login/` (inkl. forgot/set-password) existieren doppelt | Gering | Weniger Verwirrung, eine Anmeldeseite |
| **„Mein Konto“ zusammenführen** | `app/account/` (Bestellungen, Adressen) vs. `app/profile/` (Referral, Loyalty) | Mittel | Ein Konto-Bereich mit Unter-Navigation (Bestellungen, Adressen, Punkte, Empfehlungen) |
| **Footer-Kontakt aus zentralen Daten** | `components/layout/footer.tsx` nutzt aktuell feste Werte (Musterstraße 123, +49 123…, kontakt@…) | Gering | Adresse/Telefon/E-Mail aus `lib/company.ts` (getCompanyInfo) oder Admin-Einstellungen laden – eine Quelle für Impressum, Rechnungen, Footer |
| **Supportzeiten konfigurierbar** | Footer: „Support Mo–Fr 10–18 Uhr“ ist fest | Gering | Env oder Admin-Setting (z. B. SUPPORT_HOURS), dann im Footer anzeigen |

### 2. UX & Ladezustände

| Maßnahme | Wo / Referenz | Aufwand | Nutzen |
|----------|----------------|---------|--------|
| **Loading-Seiten für alle schweren Routen** | Bisher: nur `shop/`, `shop/[slug]` haben `loading.tsx` | Gering | `app/(main)/cart/loading.tsx`, `checkout/loading.tsx`, `account/loading.tsx`, `wishlist/loading.tsx` – weniger Flackern, bessere wahrgenommene Performance |
| **Error-Boundaries pro Bereich** | Nur Root `error.tsx` und `global-error.tsx` | Gering | `app/(main)/error.tsx` (und ggf. `app/account/error.tsx`) mit freundlicher Meldung + „Zur Startseite“ / „Erneut versuchen“ |
| **Leere Zustände klar gestalten** | Wunschliste hat schon einen; Account „Keine Bestellungen“; Shop-Filter „Keine Treffer“ | Gering | Überall einheitlich: Icon, kurzer Text, klarer CTA (z. B. „Erste Bestellung aufgeben“, „Filter zurücksetzen“) |
| **Checkout-Fehler sichtbar** | Bei 429/400 von `/api/checkout` nur Toast | Gering | Fehlermeldung nah am Button (z. B. unter „Zahlungspflichtig bestellen“), optional „Erneut versuchen“ |
| **Quick-View im Shop** | Produktkarte öffnet nur Detailseite | Mittel | Modal: Bild, Name, Preis, „In den Warenkorb“ + „Details ansehen“ – weniger Seitenwechsel beim Vergleichen |

### 3. Trust & Inhalte

| Maßnahme | Wo / Referenz | Aufwand | Nutzen |
|----------|----------------|---------|--------|
| **Trusted Shops / EHI aus Env** | `components/trust-signals.tsx` – URLs aus NEXT_PUBLIC_… | Gering | Badge nur anzeigen wenn gesetzt; ggf. Bewertungs-Widget (Trusted Shops) |
| **Presse-/Partner-Logos** | Noch nicht vorhanden | Gering | Kleine Sektion „Wie in … erwähnt“ oder „Partner“ mit 2–3 Logos (optional) |
| **Konkrete Lieferzeiten überall** | Cart, Checkout, ggf. Produktseite | Gering | Ein Satz wie „Lieferung in 2–4 Werktagen“ (oder aus Env) an zentralen Stellen sichtbar |
| **Altershinweis (18+) einheitlich** | Footer hat ihn; ggf. Age-Gate, Produkt-Badges | Gering | Einheitliche Formulierung und Platzierung |

### 4. SEO & Sichtbarkeit

| Maßnahme | Wo / Referenz | Aufwand | Nutzen |
|----------|----------------|---------|--------|
| **Meta pro Kategorie** | `/shop?category=bongs` etc. – Shop-Seite ist Client, Layout könnte searchParams nicht nutzen | Mittel | Server-Komponente oder Layout mit Kategorie-Liste; dynamischer Title/Description je Kategorie (z. B. „Bongs \| Shop“) |
| **Organisation-Schema (JSON-LD)** | Nur Product + BreadcrumbList pro Produkt | Gering | Auf der Startseite oder im Root-Layout `Organization` mit Name, URL, Logo, Kontakt – gut für Google |
| **Sitemap** | Noch nicht vorhanden | Gering | `app/sitemap.ts` mit Home, Shop, Kategorien, wichtige statische Seiten (AGB, Impressum, etc.) |
| **robots.txt** | Prüfen ob vorhanden | Gering | Sitemap-URL angeben, ggf. Admin-Bereich disallow |

### 5. Technik & Stabilität

| Maßnahme | Wo / Referenz | Aufwand | Nutzen |
|----------|----------------|---------|--------|
| **Rate-Limiting ausweiten** | Bisher: Checkout, Passwort-Reset, Newsletter, Admin Loyalty | Gering | Contact (`/api/contact`), Login-POST, Newsletter-Signup mit Limits (z. B. 5/15 Min pro IP) |
| **Rate-Limit in Produktion** | `lib/rate-limit.ts` in-memory | Mittel | Für mehrere Instanzen (z. B. Vercel): Redis/Upstash – in SOVEREIGN-EXCELLENCE und PASSWORT-RESET-SICHERHEIT erwähnt |
| **CSP verschärfen** | `next.config.js`: script-src mit 'unsafe-inline' / 'unsafe-eval' | Mittel | Nonces oder Hashes für Inline-Scripts wo möglich – weniger Angriffsfläche |
| **E-Mail-Absender einheitlich** | ShopEmailHeader/Footer vorhanden; alle Transaktions-Mails prüfen | Gering | Ein Absender (z. B. Resend), einheitliche Signatur und Link zu AGB/Datenschutz in jeder Mail |

### 6. Recht & Compliance

| Maßnahme | Wo / Referenz | Aufwand | Nutzen |
|----------|----------------|---------|--------|
| **AGB/Widerruf-PDF verlinken** | API: `/api/legal/agb`, `/api/legal/widerruf` | Erledigt | Auf `/terms` und `/returns` Buttons „Als PDF herunterladen“ (bereits umgesetzt) |
| **Widerrufsfrist im Checkout** | Deutlich sichtbar | Erledigt | Bereits ergänzt |
| **Cookie-Banner prüfen** | ConsentBanner (`components/consent/ConsentBanner.tsx`), siehe [COOKIE-BANNER.md](./COOKIE-BANNER.md) | Gering | Opt-in/Opt-out klar; Link zu Datenschutz; ggf. notwendige Cookies vor Abfrage setzen (Session) dokumentieren |

### 7. Conversion & Verkauf

| Maßnahme | Wo / Referenz | Aufwand | Nutzen |
|----------|----------------|---------|--------|
| **„Kunden kauften auch“ / Ähnliche Produkte** | Produktseite hat bereits `similarProducts` | – | Bereits umgesetzt; ggf. Logik verfeinern (gleiche Kategorie, gleicher Influencer) |
| **Mindestbestellwert anzeigen** | Falls ihr einen habt | Gering | Im Cart/Checkout „Noch X € bis versandkostenfrei“ (Free-Shipping-Threshold ist 50 €) |
| **Rabatt-Code-Platzierung** | Checkout hat Rabattfeld | – | Optional: Hinweis „Code bei der Bestellung eingeben“ im Cart |
| **Trust-Strip im Checkout** | Lock, Shield, Links zu Impressum/Datenschutz/AGB | – | Bereits vorhanden |

### 8. Admin & Betrieb

| Maßnahme | Wo / Referenz | Aufwand | Nutzen |
|----------|----------------|---------|--------|
| **Dashboard-Kennzahlen** | `app/admin/page.tsx`, `app/api/admin/analytics/` | Mittel | Übersicht: Umsatz heute/diese Woche, offene Bestellungen, Bestellungen „in Bearbeitung“, ggf. Lager-Alerts |
| **Rabatt-Codes End-to-End** | Admin discount-codes ↔ Checkout-Anwendung | Gering | Prüfen: Codes aus DB, Gültigkeit, Mindestbestellwert – alles konsistent |
| **Versand-E-Mail mit Tracking** | ShippingNotification, Send-Logik | – | Prüfen ob bei „Versandt“-Status automatisch versendet wird und Link stimmt |
| **Einstellungen „Unternehmen“** | Adresse, Telefon, Supportzeiten, E-Mail | Mittel | Admin-Seite (oder Erweiterung Settings) → eine Quelle für Footer, Impressum, Rechnungen, E-Mails |

### 9. Barrierefreiheit & Qualität

| Maßnahme | Wo / Referenz | Aufwand | Nutzen |
|----------|----------------|---------|--------|
| **Fokus-Indikatoren** | Buttons/Links | Gering | Sichtbarer Focus-Ring (z. B. ring-2 ring-luxe-gold) für Tastatur-Nutzer, WCAG |
| **Alt-Texte für alle Bilder** | Produktbilder, Icons als Hintergrund | Gering | Produktname/kontextbezogen; dekorative Bilder mit alt="" |
| **Formulare: Labels + Fehler** | Checkout, Kontakt, Auth | Gering | Jedes Feld mit `<label>`, Fehlermeldungen mit `aria-describedby` / `aria-invalid` |
| **Überschriften-Hierarchie** | Alle Seiten | Gering | Eine H1 pro Seite, dann H2/H3 logisch – gut für Screenreader und SEO |

### 10. Design & Konsistenz

| Maßnahme | Wo / Referenz | Aufwand | Nutzen |
|----------|----------------|---------|--------|
| **Spacing-System** | Verschiedene Abstände (4, 6, 8, 10, 12…) | Gering | 8px-Grid oder Tailwind-Skala konsequent (z. B. gap-4, p-6, mb-8) – in PROFESSIONELLER-SHOP bereits erwähnt |
| **Button-Varianten einheitlich** | Primär „Zum Warenkorb“ vs. Sekundär „Zum Shop“ | Gering | Wenige Varianten (z. B. luxe, outline, ghost) überall gleich genutzt |
| **Farben für Status** | Erfolg (z. B. Bestellung bestätigt), Fehler, Warnung | Gering | Einheitlich z. B. green-500, red-500, amber-500 für Texte/Buttons |

---

## Priorisierung – Empfehlung

**Schnell umsetzbar (1–2 h je Punkt):**
- Footer-Kontakt aus `getCompanyInfo()` oder Env
- Loading-Seiten für Cart, Checkout, Account, Wishlist
- Sitemap + robots.txt
- Rate-Limit für Contact (und ggf. Login/Newsletter)
- Organisation-JSON-LD auf der Startseite
- Fokus-Ringe und Label/Fehler in kritischen Formularen

**Mittlerer Aufwand (halber bis ganzer Tag):**
- Auth-Einstieg vereinheitlichen (eine Route, Redirects)
- „Mein Konto“-Bereich zusammenführen (Account + Profile)
- Meta pro Kategorie (Server-Komponente oder separates Layout)
- Dashboard-Kennzahlen im Admin
- Redis/Upstash für Rate-Limit (wenn Multi-Instance)

**Größere Themen (mehrere Tage):**
- Quick-View-Modal im Shop
- Admin-Einstellungen „Unternehmen“ (eine Quelle für alle Kontaktdaten)
- CSP ohne unsafe-inline/unsafe-eval (Nonces)
- Blog/Magazin für SEO (langfristig)
