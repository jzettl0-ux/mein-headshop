# Phase 11: Blueprint Teil 12 – Margins, Fraud, Factoring – Migrations-Reihenfolge

**Abhängigkeiten:** Phase 0, 1 (product_categories, vendor_accounts). Optional für Factoring: b2b.business_accounts.

---

## Migrations

| # | Datei | Inhalt |
|---|--------|--------|
| 1 | `supabase/migration-blueprint-teil-12-margins-fraud.sql` | Returnless Refunds, Vendor Flex, Buyer Health Scores, Factoring (bedingt), Brand Tailored Promotions |

---

## Phase-11-Checkliste

- [ ] 1. `migration-blueprint-teil-12-margins-fraud.sql`

---

## APIs/UI (bereits umgesetzt ✅)

- [x] Returnless Refunds: `/admin/operations/returnless-refunds`, `GET /api/admin/returnless-rules`
- [x] Vendor Flex: `/admin/vendors/vendor-flex`, `GET /api/admin/vendor-flex-nodes`
- [x] Buyer Fraud: `/admin/customers/fraud-scores`, `GET /api/admin/buyer-health-scores`
- [x] B2B Factoring: `/admin/b2b/factoring`, `GET /api/admin/factoring-agreements`
- [x] Brand Tailored Promotions: `/admin/marketing/tailored-promotions`, `GET /api/admin/brand-tailored-promotions`

**Phase 11 abgeschlossen**, wenn die Migration fehlerfrei gelaufen ist.

---

## Nächste Schritte (manuell)

1. **Supabase SQL Editor:** `supabase/migration-blueprint-teil-12-margins-fraud.sql` ausführen.
2. **Bedingte Tabellen:** Factoring (b2b_finance.factoring_agreements) wird nur erstellt, wenn `b2b.business_accounts` existiert. Alle übrigen Tabellen (returnless_refund_rules, vendor_flex_nodes, buyer_health_scores, brand_tailored_promotions) werden immer angelegt. Schema `marketing` wird bei Bedarf erstellt (für brand_tailored_promotions).
3. **Admin-Seiten:** Returnless Refunds, Vendor Flex, Fraud-Scores, Factoring, Tailored Promotions stehen nach der Migration bereit.
