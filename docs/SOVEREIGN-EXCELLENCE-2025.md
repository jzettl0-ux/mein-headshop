# Sovereign Excellence Architektur (2025 Sicherheitsleitfaden)

Kurzdokumentation der umgesetzten Maßnahmen.

## 1. Geschäftslogik-Sicherheit (Anti-Manipulation)

- **Preis-Validierung (BLV-Schutz):** In `app/api/checkout/route.ts` wird jeder vom Client übermittelte Produktpreis mit dem aktuellen DB-Preis verglichen (Toleranz 1 Ct). Bei Abweichung wird der Checkout mit 400 abgelehnt.
- **State-Machine Checkout:** Die Bestätigungsseite `/order-confirmation` ist nur nach erfolgreicher Zahlung zugänglich:
  - `GET /api/order-confirmation/validate?order=XXX` prüft serverseitig `payment_status === 'paid'` und optional BOLA (user_id).
  - Bei ungültigem Status Redirect auf `/payment/success?order=XXX` oder `/account`.

## 2. API-Schutz & Integrität

- **BOLA:** Alle Account-Endpunkte unter `app/api/account/orders/[id]` prüfen `order.user_id === session user.id`. Hilfsmodul `lib/bola.ts` für einheitliche Prüfung.
- **Rate-Limiting:** Checkout-API: 10 Anfragen pro 60 s pro IP (`lib/rate-limit.ts`, Key aus `x-forwarded-for`/`x-real-ip`).
- **Honeypot:**
  - Checkout: Feld `company_website` im Body – wenn gesendet und nicht leer → stilles 200 (Bot-Abwehr).
  - Kontakt: Feld `website_url` + verstecktes Input; bei Nicht-Leer → stilles 200.

## 3. Client-Side Security & PCI DSS 4.0.1

- **CSP:** In `next.config.js` ergänzt: `object-src 'none'`. Bestehende CSP (script, style, connect, frame-src für Mollie) unverändert.
- **E-Skimming-Schutz:** Komponente `components/checkout-guard.tsx` auf Checkout- und Payment-Success-Seite. Überwacht DOM per MutationObserver auf unerwartete `<script>`/`<iframe>`-Injection und zeigt Sicherheitshinweis.

## 4. Compliance & Barrierefreiheit

- **DDG:** Impressum (`app/(main)/impressum/page.tsx`): „§ 5 TMG“ durch „Art. 6 DDG (Digitale-Dienste-Gesetz)“ ersetzt; Verantwortlichkeit „§ 55 Abs. 2 RStV“ zu „RStV / DDG“ angepasst.
- **WCAG:**
  - Skip-Link „Zum Inhalt springen“ im Main-Layout, versteckt bis Fokus (`sr-only` + `focus:not-sr-only`).
  - `<main id="main-content" role="main" tabIndex={-1}>` für Fokus-Ziel.
  - Globale `:focus-visible`-Darstellung in `app/globals.css`.

## 5. Performance & Vertrauen

- **Trust-Signale:** Komponente `components/trust-signals.tsx` (SSL, sichere Zahlung, Versand, Bewertungen) im Footer eingebunden.
- **CLS:** Nutzung von `aspect-ratio` und `object-fit: cover` für Bilder empfohlen; Hilfsklassen in `globals.css` (`.aspect-reserve`, `.img-cover`).

## UUIDs

Öffentliche URLs für Bestellungen nutzen bereits UUIDs (`/account/orders/[id]` mit `order.id`).

## Weitere Empfehlungen

- SRI für externe Skripte, sobald feste URLs genutzt werden.
- Redis/Upstash für Rate-Limiting bei Multi-Instance-Betrieb.
- Trusted-Shops-Badge/Widget optional in `TrustSignals` integrieren.
