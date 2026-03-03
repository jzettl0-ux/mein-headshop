# Phase 9: Blueprint Teil 10 – Marketing, B2B, Hazmat, RFQ – Migrations-Reihenfolge

**Abhängigkeiten:** Phase 0, 1 (vendor_accounts, products, b2b, orders)

---

## Migrations

| # | Datei | Inhalt |
|---|--------|--------|
| 1 | `supabase/migration-blueprint-teil-10-marketing-b2b-security.sql` | Schemas/Tabellen: `marketing.attribution_campaigns`, `attribution_events`, `communications.masked_emails`, `messages`, `compliance_hazmat.product_safety_data`, `b2b_negotiation.quote_requests`, `quote_responses`, `marketing.ab_experiments`, `ab_experiment_metrics` |

---

## Phase-9-Checkliste

- [ ] 1. `migration-blueprint-teil-10-marketing-b2b-security.sql`

---

## APIs/UI (bereits umgesetzt ✅)

- [x] Attribution: `/admin/marketing/attribution`, `GET /api/admin/attribution-campaigns`
- [x] Messaging: `/admin/support/messaging`, `GET /api/admin/messaging`
- [x] Hazmat: `/admin/compliance/hazmat`, `GET /api/admin/hazmat`
- [x] B2B RFQ: `/admin/b2b/rfq`, `GET /api/admin/rfq`
- [x] A/B-Experimente: `/admin/marketing/ab-experiments`, `GET /api/admin/ab-experiments`
- [x] Optional: Strike-System, SDS-Upload, RFQ Checkout-Token, A/B Metriken

**Phase 9 abgeschlossen**, wenn die Migration fehlerfrei gelaufen ist.

---

## Nächste Schritte (manuell)

1. **Supabase SQL Editor:** `supabase/migration-blueprint-teil-10-marketing-b2b-security.sql` ausführen.
2. **Bedingte Tabellen:** Die Migration läuft auch ohne B2B-Schema:
   - **Attribution, Messaging, Hazmat, A/B-Experimente** werden immer angelegt (marketing.*, communications.*, compliance_hazmat.*).
   - **RFQ** (b2b_negotiation.quote_requests, quote_responses) wird nur erstellt, wenn `b2b.business_accounts` existiert (z. B. nach `migration-b2b-schema.sql`).
3. **Admin-Seiten:** Nach der Migration: Attribution (`/admin/marketing/attribution`), Messaging (`/admin/support/messaging`), Hazmat (`/admin/compliance/hazmat`), RFQ (`/admin/b2b/rfq`), A/B-Experimente (`/admin/marketing/ab-experiments`).
