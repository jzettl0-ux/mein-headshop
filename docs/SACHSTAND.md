# Sachstand: Premium Headshop – Was der Shop kann

> Vollständige Übersicht aller Funktionen, Benutzergruppen, Dateien und Stil-Patterns.

---

## 1. Benutzergruppen & Rollen

| Gruppe | Beschreibung | Zugang |
|--------|--------------|--------|
| **Gäste/Kunden** | Besucher ohne Login | Öffentliche Shop-Seiten, Warenkorb, Checkout (optional als Gast) |
| **Kunden (eingeloggt)** | Registrierte Nutzer | Konto, Bestellhistorie, Adressen, Loyalty, Referral |
| **Admin/Mitarbeiter** | Staff mit Rollen | Admin-Panel je nach Rolle |
| **Influencer** | Kooperationspartner mit Login | Influencer-Dashboard, Stats, Auszahlungen |
| **Owner** | Inhaber | Vollzugriff auf alles |

---

## 2. KUNDENSEITEN (Öffentlich)

### Routen

| Route | Datei | Funktion |
|-------|-------|----------|
| `/` | `app/(main)/page.tsx` | Startseite |
| `/shop` | `app/(main)/shop/page.tsx` | Produktübersicht |
| `/shop/[slug]` | `app/(main)/shop/[slug]/page.tsx` | Produktdetail |
| `/cart` | `app/(main)/cart/page.tsx` | Warenkorb |
| `/checkout` | `app/(main)/checkout/page.tsx` | Kasse |
| `/order-confirmation` | `app/(main)/order-confirmation/page.tsx` | Bestellbestätigung |
| `/payment` | `app/(main)/payment/page.tsx` | Zahlungsmethoden-Info |
| `/payment/success` | `app/(main)/payment/success/page.tsx` | Zahlungs-Erfolg |
| `/wishlist` | `app/(main)/wishlist/page.tsx` | Wunschliste |
| `/about` | `app/(main)/about/page.tsx` | Über uns |
| `/faq` | `app/(main)/faq/page.tsx` | FAQ |
| `/contact` | `app/(main)/contact/page.tsx` | Kontaktformular |
| `/influencer` | `app/(main)/influencer/page.tsx` | Influencer-Übersicht |
| `/influencer/[slug]` | `app/(main)/influencer/[slug]/page.tsx` | Influencer-Profil |
| `/partner` | `app/(main)/partner/page.tsx` | Partner werden |
| `/bewertungen` | `app/(main)/bewertungen/page.tsx` | Shop-Bewertungen |
| `/vorschlaege` | `app/(main)/vorschlaege/page.tsx` | Verbesserungsvorschläge |
| `/shipping` | `app/(main)/shipping/page.tsx` | Versand & Lieferung |
| `/returns` | `app/(main)/returns/page.tsx` | Widerrufsrecht |
| `/compliance` | `app/(main)/compliance/page.tsx` | Compliance |
| `/impressum` | `app/(main)/impressum/page.tsx` | Impressum |
| `/privacy` | `app/(main)/privacy/page.tsx` | Datenschutz |
| `/terms` | `app/(main)/terms/page.tsx` | AGB |

### Kundenfunktionen

- **Shop:** Produkte durchsuchen, filtern (Kategorie, Unterkategorie, Marke, Preis, 18+), Suche, Produktdetails, Bewertungen schreiben
- **Warenkorb:** Hinzufügen, Menge ändern, Löschen, Wunschliste, Loyalty-Punkte-Anzeige
- **Checkout:** Als Gast oder angemeldet, Adresse, Rabattcodes, Loyalty-Punkte einlösen, Empfehlungs-Rabatt
- **Wunschliste:** Produkte speichern (localStorage/Zustand)
- **Kontakt:** Formular mit reCAPTCHA
- **Vorschläge:** Formular (neue Kategorie, Feature, Verbesserung etc.)
- **Navigation:** Header mit Logo, Home, Shop, Influencer, Über uns, Suche, User, Wunschliste, Warenkorb; Mobile-Menü

---

## 3. KUNDENKONTO (app/account/)

| Route | Datei | Funktion |
|-------|-------|----------|
| `/account` | `app/account/page.tsx` | Profil-Übersicht |
| `/account/orders/[id]` | `app/account/orders/[id]/page.tsx` | Bestelldetails |
| `/account/loyalty` | `app/account/loyalty/page.tsx` | Punkte & Belohnungen |
| `/account/referral` | `app/account/referral/page.tsx` | Empfehlungsprogramm |

**Kontofunktionen:**
- Profil: E-Mail, Mitgliedschaft, Bestellstatistik
- Adressen: CRUD, Standard-Adresse
- Bestellungen: Übersicht, Status, Tracking, Rechnung PDF, Storno-/Rücksendeanfragen
- Loyalty: Punkte, Belohnungen, einlösbar im Checkout
- Referral: Empfehlungslink, Statistiken

---

## 4. ADMIN-BEREICH (app/admin/)

### Layout & Stil

- **Datei:** `app/admin/layout.tsx`
- **Stil:** Dunkles Theme (`bg-luxe-black`, `bg-luxe-charcoal`), Sidebar mit klappbaren Gruppen, Suche, Benachrichtigungs-Glocke
- **Farben:** Gold (luxe-gold), Emerald für Hover/aktive Links

### Bereiche & Rollen

| Bereich | Routen | Rollen |
|---------|--------|--------|
| **Start** | `/admin` | Alle |
| **Verkauf & Service** | `/admin/orders`, `/admin/orders/[id]`, `/admin/requests`, `/admin/support`, `/admin/support/[id]` | owner, chef, admin, support, employee |
| **Bewertungen** | `/admin/reviews`, `/admin/shop-reviews`, `/admin/feedback`, `/admin/suggestions` | owner, chef, admin, product_care, support, employee |
| **Sortiment** | `/admin/products`, `/admin/products/new`, `/admin/products/[id]/edit`, `/admin/influencers`, `/admin/influencers/new`, `/admin/influencers/[id]/edit`, `/admin/categories`, `/admin/assets`, `/admin/assets/preview`, `/admin/startseite` | owner, chef, admin, product_care |
| **Finanzen** | `/admin/finances`, `/admin/operations`, `/admin/operations/new`, `/admin/operations/expenses`, `/admin/operations/archive`, `/admin/suppliers`, `/admin/suppliers/[id]`, `/admin/suppliers/[id]/mapping`, `/admin/integrations` | owner, chef, admin (Finanzen nur owner) |
| **Lager** | `/admin/inventory`, `/admin/inventory/wareneingang`, `/admin/inventory/trends`, `/admin/margin` | owner, chef (margin auch admin) |
| **Marketing** | `/admin/sales`, `/admin/discount-codes`, `/admin/marketing/newsletter`, `/admin/marketing/referrals` | owner, chef, admin, product_care |
| **Kunden** | `/admin/customers`, `/admin/loyalty` | owner, chef, admin |
| **Analytics** | `/admin/analytics/trends`, `/admin/analytics/health` | owner, chef, admin |
| **Einstellungen** | `/admin/settings`, `/admin/settings/finances`, `/admin/settings/media`, `/admin/settings/team`, `/admin/settings/webhooks`, `/admin/staff`, `/admin/compliance`, `/admin/datenschutz`, `/admin/audit` | owner (staff: owner, chef) |
| **Sonstiges** | `/admin/complaints` | owner, chef |

### Admin-Funktionen im Detail

- **Bestellungen:** Liste, Detail, Status, Tracking, Storno, Rücksendung, Zuweisung, Versand-Mail, Sync mit Mollie
- **Produkte:** CRUD, Kategorie/Unterkategorie, Influencer, Lieferant, Bilder, Rabatte
- **Influencer:** CRUD, Startseite, Provision, Auszahlungen
- **Kategorien:** Hauptkategorien und Unterkategorien
- **Finanzen:** Dashboard, Einkauf, Ausgaben, Lieferanten, Schnittstellen
- **Lager:** Übersicht, Wareneingang, Trends, Kostenrechner
- **Vorschläge:** Einsehen, Status setzen (Neu, In Arbeit, Umgesetzt, Abgelehnt), Admin-Notizen

---

## 5. INFLUENCER-BEREICH (app/influencer/)

| Route | Datei | Funktion |
|-------|-------|----------|
| `/influencer/dashboard` | `app/influencer/dashboard/page.tsx` | Übersicht: Umsatz, Provisionen, Klicks, Code |
| `/influencer/assets` | `app/influencer/assets/page.tsx` | Mediathek |

**Stil:** Eigenes Layout mit stone/neutralen Tönen, separater Header

---

## 6. AUTH / LOGIN

| Route | Datei | Funktion |
|-------|-------|----------|
| `/auth` | `app/auth/page.tsx` | Login/Registrierung |
| `/auth/forgot-password` | `app/auth/forgot-password/page.tsx` | Passwort vergessen |
| `/auth/reset-password` | `app/auth/reset-password/page.tsx` | Passwort zurücksetzen |
| `/auth/set-password` | `app/auth/set-password/page.tsx` | Neues Passwort setzen |
| `/login` | `app/login/page.tsx` | Redirect zu `/auth` |

- Login/Registrierung mit E-Mail + Passwort
- Passwort-Stärke (zxcvbn)
- Referral-Parameter `?ref=CODE`
- Redirect nach Login (z.B. `/admin`)

---

## 7. DESIGN & STIL

### Farbschema (globals.css)

| Variable | Dark (Standard) | Light (.theme-light) |
|----------|-----------------|----------------------|
| `--luxe-black` | #0A0A0A | #F8F6F1 (Cremeton) |
| `--luxe-charcoal` | #1A1A1A | #EEF4ED (Salbei) |
| `--luxe-gray` | #2A2A2A | #DCE8DA |
| `--luxe-silver` | #8A8A8A | #4A6B4A |
| `--luxe-primary` | #D4AF37 (Gold) | #2D5A2D (Grün) |
| `--luxe-accent` | #39FF14 (Neon) | #3D8B3D |

### Tailwind-Klassen

- `bg-luxe-black`, `bg-luxe-charcoal`, `bg-luxe-gray`, `text-luxe-silver`, `text-luxe-gold`, `border-luxe-gray`
- `container-luxe` – zentrierter Container
- `text-gradient-gold`, `text-gradient-flow` – Gradient-Text
- `product-card` – Produktkarten-Styling
- `glass` – Glas-Effekt

### Komponenten-Styles

- **Button-Varianten:** `luxe` (Gold), `neon` (Grün), `admin-outline`
- **Badge-Varianten:** `adult` (18+), `featured` (Highlight), `influencer`, `stock`
- **Admin:** `.admin-area`, `.nav-link-active` (Emerald/Gold)

---

## 8. KOMPONENTEN

| Komponente | Pfad | Zweck |
|------------|------|-------|
| Header | `components/layout/header.tsx` | Navigation, Suche, User, Warenkorb |
| Footer | `components/layout/footer.tsx` | Links, Kontakt, Cookie-Einstellungen |
| Logo | `components/logo.tsx` | Logo mit/ohne Text |
| ProductCard | `components/shop/product-card.tsx` | Produktkarte |
| ProductFilters | `components/shop/product-filters.tsx` | Kategorie, Marke, Preis, 18+ |
| SearchBar | `components/search-bar.tsx` | Produktsuche |
| ShopBreadcrumbs | `components/shop-breadcrumbs.tsx` | Breadcrumbs im Shop |
| AdminBreadcrumbs | `components/admin/admin-breadcrumbs.tsx` | Admin-Breadcrumbs |
| CheckoutGuard | `components/checkout-guard.tsx` | Checkout-Schutz |
| ReferralCapture | `components/referral-capture.tsx` | Referral-Code erfassen |
| Recaptcha | `components/recaptcha.tsx` | reCAPTCHA |
| AgeGate | `components/age-gate.tsx` | Altersprüfung (18+) |

---

## 9. API-ROUTEN (Auswahl)

| Kategorie | Beispiele |
|-----------|-----------|
| **Öffentlich** | `/api/checkout`, `/api/contact`, `/api/suggestions`, `/api/categories`, `/api/subcategories`, `/api/shop-reviews`, `/api/reviews` |
| **Account** | `/api/account/orders/[id]/invoice`, `/api/account/orders/[id]/request-cancel`, `/api/account/loyalty`, `/api/account/referral` |
| **Admin** | `/api/admin/*` (me, orders, products, categories, influencers, suggestions, finances, ...) |
| **Influencer** | `/api/influencer/stats`, `/api/influencer/code`, `/api/influencer/payouts` |
| **Webhooks** | `/api/payment/webhook`, `/api/webhooks/inbound-email` |
| **Cron** | `/api/cron/send-review-requests`, `/api/cron/auto-cancel-unpaid`, `/api/cron/check-tracking` (DHL → delivered) |

---

## 10. TECHNOLOGIEN

| Bereich | Technologie |
|---------|-------------|
| Framework | Next.js 14.1 |
| UI | React 18, Framer Motion 11 |
| Styling | Tailwind CSS 3 |
| Backend/Auth | Supabase |
| Zahlung | Mollie |
| E-Mail | Resend, React Email |
| State | Zustand |
| UI-Primitives | Radix UI |
| Charts | Recharts |
| PDF | pdf-lib |
| Icons | Lucide React |

---

## 11. Wichtige Lib-Dateien

| Datei | Zweck |
|-------|-------|
| `lib/supabase*.ts` | Supabase-Client |
| `lib/mollie.ts` | Mollie-Zahlungen |
| `lib/company.ts` | Firmendaten |
| `lib/admin-auth.ts` | Admin-Authentifizierung |
| `lib/admin-permissions.ts` | Rollen & Berechtigungen |
| `lib/invoice-pdf.ts` | Kundenrechnung PDF |
| `lib/credit-note-pdf.ts` | Gutschrift PDF |
| `lib/loyalty.ts`, `lib/referral.ts` | Treue & Empfehlung |
| `lib/shipping.ts` | Versandberechnung |
| `lib/dhl-parcel.ts` | DHL Parcel DE API v2 (OAuth, Labels, VisualCheckOfAge) |
| `lib/dhl-tracking.ts` | DHL Tracking-Status (delivered etc.) |
| `lib/get-buybox-winners.ts` | Buy-Box-Gewinner pro Produkt (Multi-Vendor-Checkout) |
| `lib/calculate-payment-splits.ts` | Mollie Split-Routing (Vendor-Payouts, Commission) |
| `lib/fulfillment-routing.ts` | FBA vs. FBM Routing (Versandverantwortung) |
| `lib/avs-compliance-log.ts` | AVS-Compliance-Log (compliance.age_verification_logs) |
| `lib/recaptcha.ts` | reCAPTCHA-Verifizierung |

---

*Stand: Februar 2025*
