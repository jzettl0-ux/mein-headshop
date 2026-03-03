# Phase 1: Migrations-Reihenfolge (sequential)

Führe die Migrations **in dieser exakten Reihenfolge** im Supabase SQL Editor aus (jeweils kompletten Dateiinhalt einfügen und ausführen).

---

## Voraussetzungen (Phase 0 – müssen bereits gelaufen sein)

| Reihenfolge | Datei | Zweck |
|-------------|--------|--------|
| 1 | `schema.sql` | Basis-Schema, `update_updated_at_column()` |
| 2 | `migration-product-categories.sql` | `product_categories` (für Category Gating) |
| 3 | `migration-vendors-kyb.sql` | `vendor_accounts`, `vendor_offers` |
| 4 | `migration-fulfillment-order-lines.sql` | `fulfillment.order_lines` (für Vendor Metrics) |
| 5 | `migration-buybox.sql` | View `product_offers`, Spalten `vendor_accounts.odr/lsr/vtr` (für Phase 1.2) |

**Wichtig:** Die Funktion `refresh_vendor_performance_metrics()` (Schritt 6) referenziert die Tabelle `order_shipments`. Diese wird von `migration-order-shipments.sql` (eigentlich Phase 2) angelegt. Deshalb **zwischen Schritt 5 und 6** die Datei `migration-order-shipments.sql` ausführen (siehe Schritt 5b).

---

## Phase 1.1 – Parent/Child ASIN

| # | Datei | Inhalt |
|---|--------|--------|
| 1 | `supabase/migration-asin-product-attributes.sql` | `products.asin`, Schema `catalog`, `catalog.product_attributes` |
| 2 | `supabase/migration-asin-parent-child.sql` | `catalog.amazon_standard_identification_numbers`, `products.parent_asin` / `variation_theme` |
| 3 | `supabase/migration-asin-catalog-sync-trigger.sql` | Trigger: Produkt-Änderungen → ASIN-Registry Sync |
| 4 | `supabase/migration-asin-catalog-backfill.sql` | Backfill: bestehende Produkte mit ASIN in Registry übernehmen |

## Phase 1.2 – Vendor Performance Metrics

| # | Datei | Inhalt |
|---|--------|--------|
| 5 | `supabase/migration-vendor-performance-metrics.sql` | `vendor_performance_metrics`, View `product_offers_with_score`, MV `mv_active_buybox_winners` |
| 5b | **`supabase/migration-order-shipments.sql`** (Phase 2) | Tabelle `order_shipments` – **vor Schritt 6 ausführen**, da `refresh_vendor_performance_metrics()` darauf zugreift. |
| 6 | `supabase/migration-vendor-performance-aggregation.sql` | Funktion `refresh_vendor_performance_metrics()` |

## Phase 1.3 – Compliance-Schema

| # | Datei | Inhalt |
|---|--------|--------|
| 7 | `supabase/migration-compliance-schema.sql` | Schema `compliance`: `age_verification_logs`, `ddg_content_reports`, `vendor_legal_flags` |

## Phase 1.4 – Financials Ledger

| # | Datei | Inhalt |
|---|--------|--------|
| 8 | `supabase/migration-financials-ledger.sql` | Schema `financials`: `ledger`, `invoices`, Sequenz für Self-Billing-Gutschriften |

## Phase 1.5 – Category Gating

| # | Datei | Inhalt |
|---|--------|--------|
| 9 | `supabase/migration-category-gating.sql` | Schema `admin`: `gated_categories`, `vendor_category_approvals`, `commission_rules` |

---

## Phase-1-Checkliste (abhaken nach Ausführung)

- [ ] 1. `migration-asin-product-attributes.sql`
- [ ] 2. `migration-asin-parent-child.sql`
- [ ] 3. `migration-asin-catalog-sync-trigger.sql`
- [ ] 4. `migration-asin-catalog-backfill.sql`
- [ ] 5. `migration-vendor-performance-metrics.sql`
- [ ] 5b. `migration-order-shipments.sql` (Phase 2 – für Schritt 6 nötig)
- [ ] 6. `migration-vendor-performance-aggregation.sql`
- [ ] 7. `migration-compliance-schema.sql`
- [ ] 8. `migration-financials-ledger.sql`
- [ ] 9. `migration-category-gating.sql`

**Phase 1 abgeschlossen**, wenn alle Schritte 1–9 (inkl. 5b) fehlerfrei durchgelaufen sind. APIs/UI: laut Plan keine neuen APIs in Phase 1 (reine Backend-Grundlage).

---

## Phase 2: DHL API & Logistik (Schema-Erweiterungen)

10. `migration-order-shipments.sql` – order_shipments (tracking_number, tracking_carrier)
11. `migration-order-shipments-label-url.sql` – label_url, return_label_url, shipped_at
12. `migration-order-shipments-delivered-at.sql` – delivered_at (Tracking-Sync)

---

## Phase 3: Order Splitting (bereits in Migrations enthalten)

- `migration-fulfillment-order-lines.sql` – fulfillment.order_lines, order_items.order_line_id
- `migration-mollie-split-vendors.sql` – vendor_accounts.mollie_organization_id, financials.order_payment_splits

---

## Phase 8: Customer Experience (Schema)

- `migration-product-reviews-verified-purchase.sql` – is_verified_purchase, is_tester_program
- `migration-cx-schema.sql` – cx.subscriptions, cx.a_to_z_claims
- `migration-vine-program.sql` – cx.vine_products, cx.vine_invitations

---

## Phase 9: PPC & Sponsored Products

- `migration-advertising-schema.sql` – advertising.campaigns, targets, ad_events
- `migration-advertising-vendor-optional.sql` – vendor_id nullable für Platform-Kampagnen
