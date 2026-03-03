# Blueprint Phasen-Plan – Konsolidierte Abarbeitung

> **Alle Blueprint-Teile 3–15 in einer phasenweise abarbeitbaren Reihenfolge.**  
> Jede Phase: Migrations → APIs/UI → Abhängigkeiten → Status  
> **→ Master-Referenz:** [BLUEPRINT-MASTER.md](./BLUEPRINT-MASTER.md) (alle Teile 10–15 mit vollständigem Blueprint-Text)

---

## Übersicht: Phasen-Matrix

| Phase | Schwerpunkt | Migrations | APIs/UI | Priorität |
|-------|-------------|------------|---------|-----------|
| 0 | Basis (bereits vorhanden) | schema, vendors, categories | — | — |
| 1 | ASIN, Compliance, Category Gating | 9 Dateien | — | Hoch |
| 2 | DHL, Logistik, Order Shipments | 3 Dateien | ✅ | Mittel |
| 3 | Mollie Split, Order Splitting | 2 Dateien | ✅ | Mittel |
| 4 | Gamification (Vault, Loyalty, Drop-Radar) | 3 Dateien | ✅ | Hoch |
| 5 | Community (UGC, Split Payment) | 1 Datei | ✅ | Hoch |
| 6 | Enforcement (RFS, ASIN Locks) | 1 Datei | ✅ | Niedrig |
| 7 | Financials & Infrastructure | 1 Datei | ✅ | Mittel |
| 8 | Deep Tech | 1 Datei | ✅ | Niedrig |
| 9 | Teil 10: Marketing, B2B, Hazmat, RFQ | 1 Datei | ✅ | Mittel |
| 10 | Teil 11: Project Zero, NCX, Off-Platform | 1 Datei | ✅ | Niedrig |
| 11 | Teil 12: Returnless, Fraud, Factoring | 1 Datei | ✅ | Niedrig |
| 12 | Teil 13–15: UX, Cart, Facets, Funnel | 1 Datei | ✅ | Mittel |
| 13 | CX, PPC, Vine | 3 Dateien | — | Mittel |
| 14 | Grants & Berechtigungen | 1 Datei | — | Hoch |
| 15 | Go-Live | — | Cron, Prod-Checklist | Hoch |
| 16 | TEIL 16: Retail Media, Sensory, Brand Boutiques | 1 Datei | ✅ | Mittel |
| 17 | TEIL 17: Legal, CSBA, Launchpad, Market Basket | 1 Datei | ✅ | Mittel |
| 18 | TEIL 18: Enterprise (Reimbursements, PO, Wave Picking) | 1 Datei | ✅ | Mittel |
| 19 | TEIL 19: B2B PunchOut, CRAP, FEFO, Creator, Velocity | 1 Datei | ✅ | Mittel |
| 20–21 | TEIL 20–21: Micro-Logistics, Visual Merchandising | 2 Dateien | ✅ | Hoch |

---

## Phase 0: Basis (vorausgesetzt)

**Status:** Bereits vorhanden im Projekt.

| Komponente | Datei / Modul |
|------------|---------------|
| Basis-Schema | `schema.sql` |
| Produktkategorien | `migration-product-categories.sql` |
| Vendors & Offers | `migration-vendors-kyb.sql` (vendor_accounts, vendor_offers) |
| B2B | `migration-b2b-schema.sql` |
| Fulfillment | `migration-fulfillment-order-lines.sql` |

---

## Phase 1: ASIN, Compliance, Category Gating

**Abhängigkeiten:** Phase 0 (+ `migration-buybox.sql` für product_offers/vendor odr-lsr-vtr)

**→ Detaillierte Reihenfolge & Checkliste:** [PHASE-1-MIGRATIONS-REIHENFOLGE.md](./PHASE-1-MIGRATIONS-REIHENFOLGE.md)

### Migrations (Supabase SQL Editor, in dieser Reihenfolge)

1. `migration-asin-product-attributes.sql`
2. `migration-asin-parent-child.sql`
3. `migration-asin-catalog-sync-trigger.sql`
4. `migration-asin-catalog-backfill.sql`
5. `migration-vendor-performance-metrics.sql`
5b. `migration-order-shipments.sql` *(Phase 2 – vor Schritt 6 nötig für refresh_vendor_performance_metrics)*
6. `migration-vendor-performance-aggregation.sql`
7. `migration-compliance-schema.sql`
8. `migration-financials-ledger.sql`
9. `migration-category-gating.sql`

### APIs/UI

- [ ] Keine neuen APIs (Backend-Grundlage)

---

## Phase 2: DHL & Logistik ✅

**Abhängigkeiten:** Phase 0, 1

**→ Migrations-Reihenfolge:** [PHASE-2-MIGRATIONS-REIHENFOLGE.md](./PHASE-2-MIGRATIONS-REIHENFOLGE.md)

### Migrations

1. `migration-order-shipments.sql` *(oft bereits in Phase 1 als Schritt 5b)*
2. `migration-order-shipments-label-url.sql`
3. `migration-order-shipments-delivered-at.sql`

### APIs/UI (umgesetzt ✅)

- [x] DHL GKP API (OAuth, Labels) – `lib/dhl-parcel.ts`, VisualCheckOfAge 18+
- [x] Admin: Versand-Label-Button (DHL, GLS, DPD, Hermes, UPS), Label-PDF, Tracking, delivered_at
- [x] Cron: `/api/cron/check-tracking` für Tracking-Sync

---

## Phase 3: Mollie Split & Order Splitting

**Abhängigkeiten:** Phase 0

**→ Migrations-Reihenfolge:** [PHASE-3-MIGRATIONS-REIHENFOLGE.md](./PHASE-3-MIGRATIONS-REIHENFOLGE.md)

### Migrations

1. `migration-fulfillment-order-lines.sql` (falls noch nicht)
2. `migration-mollie-split-vendors.sql`

### APIs/UI (Split-Payment umgesetzt ✅)

- [x] Split-Payment-Checkout – `/split/[token]`, `lib/calculate-payment-splits.ts`, Checkout schreibt `order_payment_splits`
- [x] Mollie Connect (Vendor-Organisationen) – optional für Vendor-Split-Payments

---

## Phase 4: Blueprint Teil 4 – Gamification

**Abhängigkeiten:** Phase 0, 1

**→ Migrations-Reihenfolge:** [PHASE-4-MIGRATIONS-REIHENFOLGE.md](./PHASE-4-MIGRATIONS-REIHENFOLGE.md)

### Migrations

1. `migration-blueprint-gamification.sql`
2. `migration-gamification-gated-category-ext.sql` *(optional)*
3. `migration-gated-categories-min-loyalty-tier.sql`

### APIs/UI (bereits implementiert ✅)

- [x] `GET /api/vault-drops`
- [x] `POST /api/drop-radar/subscribe`
- [x] `POST /api/price-lock`, `GET /api/price-lock/[token]`
- [x] Gamified Cart (Loyalty-Fortschritt)
- [x] Secret Shop (Admin + Shop-Filter)
- [x] Cron: `notify-drop-radar`

---

## Phase 5: Blueprint Teil 5 – Community & Split Payment

**Abhängigkeiten:** Phase 0

**→ Migrations-Reihenfolge:** [PHASE-5-MIGRATIONS-REIHENFOLGE.md](./PHASE-5-MIGRATIONS-REIHENFOLGE.md)

### Migrations

1. `migration-blueprint-community-split.sql`

### APIs/UI (bereits implementiert ✅)

- [x] UGC (Rate my Setup): `/rate-my-setup`, `/admin/ugc`
- [x] Split Payment: `/split/[token]`, APIs

### Storage

- [ ] Bucket `ugc-images` anlegen (Supabase Dashboard)

---

## Phase 6: Blueprint Teil 6 – Enforcement

**Abhängigkeiten:** Phase 1 (ASIN)

**→ Migrations-Reihenfolge:** [PHASE-6-MIGRATIONS-REIHENFOLGE.md](./PHASE-6-MIGRATIONS-REIHENFOLGE.md)

### Migrations

1. `migration-blueprint-enforcement.sql`

### APIs/UI

- [x] Admin: Return Inspections (`/admin/operations/return-inspections`, `GET /api/admin/return-inspections`)
- [x] Cron: `refresh-asin-locks` (vorhanden)

---

## Phase 7: Blueprint Teil 7+8 – Financials & Infrastructure

**Abhängigkeiten:** Phase 0, 1

**→ Migrations-Reihenfolge:** [PHASE-7-MIGRATIONS-REIHENFOLGE.md](./PHASE-7-MIGRATIONS-REIHENFOLGE.md)

### Migrations

1. `migration-blueprint-financials-infra.sql`

### APIs/UI

- [x] Blended Shipping (lib/blended-shipping.ts, Admin `/admin/blended-shipping`, API `/api/admin/blended-shipping`)
- [x] FBT: `GET /api/products/[id]/frequently-bought-together`
- [x] Cron: `refresh-fbt`, `refresh-vendor-metrics` (Vercel Cron in vercel.json)

---

## Phase 8: Blueprint Teil 9 – Deep Tech

**Abhängigkeiten:** Phase 0

**→ Migrations-Reihenfolge:** [PHASE-8-MIGRATIONS-REIHENFOLGE.md](./PHASE-8-MIGRATIONS-REIHENFOLGE.md)

### Migrations

1. `migration-blueprint-deep-tech.sql`

### APIs/UI

- [x] Admin: Catalog Duplicates (`/admin/operations/catalog-duplicates`, `GET /api/admin/catalog-duplicates`)
- [x] Admin: Risk Evaluations (`/admin/operations/risk-evaluations`, `GET /api/admin/risk-evaluations`)
- [x] Admin: Payout Batches (`/admin/operations/payout-batches`, `GET /api/admin/payout-batches`)
- [x] (optional) Live-Streams: Admin `/admin/operations/live-streams`, GET/POST/PATCH /api/admin/live-streams, Produkte zuordnen; 3D Bin-Packing: `/admin/operations/bin-packing`, GET/POST boxes, POST calculate

---

## Phase 9: Blueprint Teil 10 – Marketing, B2B, Hazmat, RFQ

**Abhängigkeiten:** Phase 0, 1 (vendor_accounts, products, b2b, orders)

**→ Migrations-Reihenfolge:** [PHASE-9-MIGRATIONS-REIHENFOLGE.md](./PHASE-9-MIGRATIONS-REIHENFOLGE.md)

### Migrations

1. `migration-blueprint-teil-10-marketing-b2b-security.sql`

### Tabellen

- `marketing.attribution_campaigns`, `attribution_events` (Brand Referral Bonus)
- `communications.masked_emails`, `messages` (Anti-Poaching)
- `compliance_hazmat.product_safety_data` (Gefahrgut)
- `b2b_negotiation.quote_requests`, `quote_responses` (RFQ)
- `marketing.ab_experiments`, `ab_experiment_metrics` (A/B-Testing)

### APIs/UI

- [x] Attribution: Kampagnen-Liste, Tracking-Links (`/admin/marketing/attribution`, `GET /api/admin/attribution-campaigns`)
- [x] Messaging: Nachrichten-Liste, Regex-Flag, Status (`/admin/support/messaging`, `GET /api/admin/messaging`)
- [x] Admin: Hazmat-Review (`/admin/compliance/hazmat`, `GET /api/admin/hazmat`)
- [x] B2B RFQ: Angebotsanfragen-Liste (`/admin/b2b/rfq`, `GET /api/admin/rfq`)
- [x] Admin: A/B-Experimente Liste (`/admin/marketing/ab-experiments`, `GET /api/admin/ab-experiments`)
- [x] Optional: Strike-System (GET/POST /api/admin/strikes), SDS-Upload (POST /api/admin/hazmat/sds-upload), RFQ Checkout-Token (POST /api/admin/rfq/[id]/checkout-token), A/B anlegen & Metriken (POST ab-experiments, GET/POST ab-experiments/[id]/metrics); Cookie/Provisions über attribution_campaigns.commission_discount_percentage

---

## Phase 10: Blueprint Teil 11 – Power User

**Abhängigkeiten:** Phase 0, 1 (security.transparency_brands, vendor_offers optional für Project Zero)

**→ Migrations-Reihenfolge:** [PHASE-10-MIGRATIONS-REIHENFOLGE.md](./PHASE-10-MIGRATIONS-REIHENFOLGE.md)

### Migrations

1. `migration-blueprint-teil-11-power-user.sql`
2. `migration-search-clicks-click-share.sql` (Click Share: `advanced_analytics.search_clicks`)

### Tabellen

- `brand_tools.project_zero_takedowns`, `project_zero_accuracy`
- `advanced_analytics.ncx_scores`
- `external_commerce.widget_deployments`, `off_platform_orders`
- `advanced_analytics.search_frequency_rank`

### APIs/UI

- [x] Project Zero: Takedown-Übersicht (`/admin/compliance/project-zero`, `GET /api/admin/project-zero-takedowns`)
- [x] NCX-Score: Liste (`/admin/analytics/ncx`, `GET /api/admin/ncx-scores`)
- [x] Buy With: Widget-Deployments (`/admin/integrations/widgets`, `GET /api/admin/widget-deployments`)
- [x] Brand Analytics: Search Frequency Rank (`/admin/analytics/search-frequency-rank`, `GET /api/admin/search-frequency-rank`)
- [x] NCX-Worker: Cron `refresh-ncx-scores` (täglich 5:00), aggregiert aus orders/order_items/product_reviews
- [x] Widget-Snippet: `GET /api/widget/embed?apiKey=…` (JS), `GET /api/widget/config?apiKey=…` (JSON), Admin „Snippet kopieren“
- [x] Off-Platform-Checkout: `POST /api/off-platform/checkout` (Header `x-widget-api-key`), erstellt Order + `off_platform_orders`
- [x] Click Share: Tabelle `advanced_analytics.search_clicks`, `POST /api/analytics/record-search-click`, Cron `refresh-search-frequency-rank` (Sonntag 6:00), Migration `migration-search-clicks-click-share.sql`

---

## Phase 11: Blueprint Teil 12 – Margins, Fraud, Factoring

**Abhängigkeiten:** Phase 0, 1 (optional für Factoring: b2b.business_accounts)

**→ Migrations-Reihenfolge:** [PHASE-11-MIGRATIONS-REIHENFOLGE.md](./PHASE-11-MIGRATIONS-REIHENFOLGE.md)

### Migrations

1. `migration-blueprint-teil-12-margins-fraud.sql`

### Tabellen

- `margins.returnless_refund_rules`, `vendor_flex_nodes`
- `fraud_prevention.buyer_health_scores`
- `b2b_finance.factoring_agreements`
- `marketing.brand_tailored_promotions`

### APIs/UI

- [x] Returnless Refunds: Regeln-Liste (`/admin/operations/returnless-refunds`, `GET /api/admin/returnless-rules`)
- [x] Vendor Flex Node: Liste (`/admin/vendors/vendor-flex`, `GET /api/admin/vendor-flex-nodes`)
- [x] Buyer Fraud: Buyer-Health-Scores (`/admin/customers/fraud-scores`, `GET /api/admin/buyer-health-scores`)
- [x] B2B Factoring: Agreements-Liste (`/admin/b2b/factoring`, `GET /api/admin/factoring-agreements`)
- [x] Brand Tailored Promotions: Liste (`/admin/marketing/tailored-promotions`, `GET /api/admin/brand-tailored-promotions`)
- [x] Optional: Heuristik im Retouren-Flow (lib/return-heuristics.ts, GET /api/account/orders/[id]/return-suggestion), Vendor-Flex-API (GET /api/vendor-flex/nodes, Header x-vendor-flex-api-key), Friction/OTP (fulfillment.delivery_otp, request-delivery-otp, POST /api/carrier/verify-delivery-otp), Mondu/Billie (Admin /admin/settings/bnpl, bnpl-status), Promo-Segmentierung (target_audience in brand_tailored_promotions, Admin-Liste)

---

## Phase 12: Blueprint Teil 13–15 – UX, State, Funnel

**Abhängigkeiten:** Phase 0, 1 (product_categories, admin.gated_categories optional)

**→ Migrations-Reihenfolge:** [PHASE-12-MIGRATIONS-REIHENFOLGE.md](./PHASE-12-MIGRATIONS-REIHENFOLGE.md)

### Migrations

1. `migration-blueprint-teil-13-15-ux-state-ui.sql`

### Tabellen

- `customer_profiles.checkout_preferences` (1-Click)
- `frontend_ux.replenishment_predictions`, `search_autocomplete_analytics`, `component_registry`
- `cart_management.shopping_carts`, `cart_items`
- `storefront.category_facet_config`, `facet_predefined_values`
- `ui_config.homepage_layouts`
- `funnel_analytics.checkout_dropoffs`

### APIs/UI

- [x] 1-Click Checkout: Einstellungen (`GET/PATCH /api/account/checkout-preferences`, customer_profiles.checkout_preferences)
- [x] Buy It Again: Replenishment-Liste (`/admin/ux/replenishment`, `GET /api/admin/replenishment-predictions`)
- [x] Visual Autocomplete: Such-Analytics (`/admin/analytics/search-terms`, `GET /api/admin/search-autocomplete-analytics`)
- [x] Cross-Device Cart: Warenkorb-Übersicht (`/admin/ux/carts`, `GET /api/admin/carts`)
- [x] Category Facets: Facet-Config (`/admin/ux/category-facets`, `GET /api/admin/category-facets`)
- [x] Bento Grid Homepage: Layouts (`/admin/ux/homepage-layouts`, `GET /api/admin/homepage-layouts`)
- [x] Checkout Funnel: Dropoff-Tracking (`/admin/analytics/checkout-dropoffs`, `GET /api/admin/checkout-dropoffs`)
- [x] Component Registry: (`/admin/ux/component-registry`, `GET /api/admin/component-registry`)
- [x] Optional: 1-Click-Frontend-Button, Replenishment-Worker, Cart-Merge bei Login, Facet-Frontend (1-Click-Checkbox + Button im Checkout; Cron `refresh-replenishment-predictions` 0 7 * * *; Cart merge/sync + CartMergeSync; Facets-API + FacetFilters in Shop)

---

## Phase 13: CX, PPC, Vine

**Abhängigkeiten:** Phase 0. Optional für A2Z: fulfillment.order_lines (sonst migration-cx-a2z-sla-ext-standalone.sql).

**→ Migrations-Reihenfolge:** [PHASE-13-MIGRATIONS-REIHENFOLGE.md](./PHASE-13-MIGRATIONS-REIHENFOLGE.md)

### Migrations

1. `migration-product-reviews-verified-purchase.sql`
2. `migration-cx-schema.sql`
3. `migration-vine-program.sql`
4. `migration-advertising-schema.sql`
5. `migration-advertising-vendor-optional.sql`
6. `migration-cx-a2z-sla-ext.sql` (oder ohne Fulfillment: `migration-cx-a2z-sla-ext-standalone.sql`)

### APIs/UI

- [x] A2Z Claims: Admin `/admin/a-to-z`, `GET/PATCH /api/admin/a-to-z-claims`, Kunde kann Anspruch stellen
- [x] Subscriptions (Subscribe & Save): `GET/POST /api/account/subscriptions`, Admin `/admin/subscriptions`, `GET/PATCH /api/admin/subscriptions`
- [x] Vine-Einladungen: Admin `/admin/vine`, `GET/POST /api/admin/vine/products`, `GET/POST /api/admin/vine/invitations`, PATCH Status, E-Mail-Einladung
- [x] PPC-Kampagnen (Admin): `/admin/advertising`, Kampagnen CRUD, Targets; API ohne vendor_accounts-Abhängigkeit

---

## Phase 14: Grants & Berechtigungen

**Abhängigkeiten:** Alle vorherigen Migrations (Grants setzen Rechte auf bereits angelegte Schemas)

**→ Migrations-Reihenfolge:** [PHASE-14-MIGRATIONS-REIHENFOLGE.md](./PHASE-14-MIGRATIONS-REIHENFOLGE.md)

### Migrations

1. `migration-blueprint-grants.sql`
2. `migration-transparency-grants.sql`
3. `migration-eco-recalls-safet-grants.sql`
4. `migration-b2b-guided-buying-grants.sql`
5. `migration-cx-grants.sql`
6. `migration-mcf-grants.sql`
7. `migration-inventory-health-grants.sql`
8. `migration-repricer-grants.sql`

### APIs/UI

- [ ] Keine – nur DB-Grants für service_role

---

## Phase 16: Blueprint TEIL 16 – Retail Media & Sensory

**Abhängigkeiten:** Phase 0, 1 (vendor_accounts, products). Optional: ui_config.homepage_layouts, security.transparency_brands für brand_stores.

**→ Doku:** [BLUEPRINT-TEIL-20-21-MIGRATION.md](./BLUEPRINT-TEIL-20-21-MIGRATION.md) (Referenz für TEIL 20/21; TEIL 16 eigenständig)

### Migrations

1. `migration-blueprint-teil-16-retail-media.sql`

### Tabellen

- `retail_media.native_banners`, `retail_media.editorials`, `retail_media.editorial_hotspots`
- `catalog.sensory_profiles`
- `brand_stores.custom_storefronts`

### APIs/UI

- [x] Native Banners: `/admin/retail-media/native-banners`, `GET/POST /api/admin/native-banners`
- [x] Shoppable Editorials: `/admin/retail-media/editorials`, `GET /api/admin/editorials`
- [x] Sensory/Terpen: `/admin/retail-media/sensory`, `GET /api/admin/sensory-profiles`
- [x] Brand Boutiques: `/admin/retail-media/brand-boutiques`, `GET /api/admin/brand-boutiques`

---

## Phase 17: Blueprint TEIL 17 – Legal & Vendor Programs

**Abhängigkeiten:** Phase 0, 1 (vendor_accounts, products).

### Migrations

1. `migration-blueprint-teil-17-legal-vendor-programs.sql`

### Tabellen

- `legal_compliance.base_pricing_rules`, `legal_compliance.geo_restrictions`
- `vendor_programs.csba_subscriptions`, `vendor_programs.launchpad_enrollments`
- `advanced_analytics.market_basket_correlations`

### APIs/UI

- [x] PAngV Grundpreis: `/admin/compliance/base-pricing`, `GET/POST /api/admin/base-pricing-rules`
- [x] Geo-Restrictions: `/admin/compliance/geo-restrictions`, `GET/POST /api/admin/geo-restrictions`
- [x] CSBA: `/admin/vendors/csba`, `GET/POST /api/admin/csba-subscriptions`
- [x] Launchpad: `/admin/vendors/launchpad`, `GET/POST /api/admin/launchpad-enrollments`
- [x] Market Basket: `/admin/analytics/market-basket`, `GET /api/admin/market-basket`, `GET /api/admin/market-basket-correlations`

---

## Phase 18: Blueprint TEIL 18 – Enterprise Operations

**Abhängigkeiten:** Phase 0, 1. Optional: fulfillment.order_lines für pick_tasks.

### Migrations

1. `migration-blueprint-teil-18-enterprise.sql`

### Tabellen

- `warehouse_ops.inventory_discrepancies`, `warehouse_ops.reimbursements`
- `catalog.warranty_plans`
- `vendor_central.suppliers`, `vendor_central.purchase_orders`, `vendor_central.po_items`
- `warehouse_ops.picking_waves`, `warehouse_ops.pick_tasks`
- `brand_enforcement.map_rules` (MAP Enforcement)

### APIs/UI

- [x] Reimbursements: `/admin/operations/reimbursements`, `GET /api/admin/inventory-discrepancies`, `GET /api/admin/reimbursements`
- [x] Garantien: `/admin/operations/warranties`, `GET/POST /api/admin/warranty-plans`
- [x] Purchase Orders: `/admin/operations/purchase-orders`, `GET/POST /api/admin/purchase-orders`
- [x] Wave Picking: `/admin/operations/wave-picking`, `/admin/inventory/wave-picking`, `GET/POST /api/admin/picking-waves`
- [x] MAP Enforcement: `/admin/operations/map-enforcement`, `/admin/governance/map-enforcement`

---

## Phase 19: Blueprint TEIL 19 – Enterprise B2B & Defense

**Abhängigkeiten:** Phase 0, 1. Optional: b2b.business_accounts für PunchOut, influencers(id) für creator_economy.

### Migrations

1. `migration-blueprint-teil-19-enterprise.sql`
2. `migration-blueprint-teil-19-grants.sql` (falls vorhanden)

### Tabellen

- `enterprise_b2b.punchout_sessions`
- `financial_defense.crap_metrics`, `financial_defense.velocity_anomalies`
- `wms_fefo.inventory_lots`
- `creator_economy.influencer_profiles`, `creator_economy.storefront_idea_lists`

### APIs/UI

- [x] PunchOut: `/admin/enterprise/punchout`, `GET /api/admin/punchout-sessions`
- [x] CRAP: `/admin/enterprise/crap`, `GET /api/admin/crap-metrics`
- [x] Velocity Anomalies: `/admin/enterprise/velocity-anomalies`, `GET /api/admin/velocity-anomalies`
- [x] Inventory Lots (FEFO): `/admin/enterprise/inventory-lots`, `GET/POST /api/admin/inventory-lots`
- [x] Creator Storefronts: `GET /api/admin/creator-storefronts`

---

## Phase 20–21: Blueprint TEIL 20–21 – Micro-Logistics & Visual Merchandising

**Abhängigkeiten:** Phase 0, 1. Optional: catalog.amazon_standard_identification_numbers, admin.gated_categories (für ASIN-abhängige Tabellen).

**→ Doku:** [BLUEPRINT-TEIL-20-21-MIGRATION.md](./BLUEPRINT-TEIL-20-21-MIGRATION.md)

### Migrations

1. `migration-blueprint-teil-20-21-micro-logistics-visual-merchandising.sql`
2. `migration-blueprint-teil-20-21-grants.sql`

### Tabellen (Auswahl)

- `logistics_optimization.routing_rules`, `stranded_inventory`
- `catalog.product_attributes`, `catalog_automation.virtual_bundles`, `vendor_performance.sfp_trials`
- `customer_engagement.review_requests`, `catalog_automation.bestseller_ranks`, `platform_choice_badges`
- `visual_merchandising.navigation_hubs`, `product_media_assets`, `quick_view_config`
- `guided_selling.quizzes`, `quiz_questions`, `quiz_answers`

### APIs/UI

- [x] Routing Rules (Small & Light): `/admin/operations/routing-rules`, `GET/POST/PATCH/DELETE /api/admin/routing-rules`
- [x] Product Attributes: `/admin/operations/product-attributes`, `GET/POST/PATCH/DELETE /api/admin/product-attributes`
- [x] Virtual Bundles: `/admin/frequently-bought-together/virtual-bundles`, `GET/POST /api/admin/virtual-bundles`, Components
- [x] SFP Trials: `/admin/sfp-trials`, `GET/POST/PATCH /api/admin/sfp-trials`
- [x] Stranded Inventory: `/admin/inventory/stranded`, `GET/POST/PATCH/DELETE /api/admin/stranded-inventory`
- [x] Review Requests: `/admin/review-requests`, `GET/PATCH /api/admin/review-requests`
- [x] Bestseller Ranks: `/admin/analytics/bestseller-ranks`, `GET/POST/PATCH/DELETE /api/admin/bestseller-ranks`
- [x] Platform Choice Badges: `/admin/analytics/platform-choice-badges`, `GET/POST/PATCH/DELETE /api/admin/platform-choice-badges`
- [x] Navigation Hubs: `/admin/ux/navigation-hubs`, `GET/POST/PATCH/DELETE /api/admin/navigation-hubs`
- [x] Product Media Assets: `/admin/ux/product-media-assets`, `GET/POST/PATCH/DELETE /api/admin/product-media-assets`
- [x] Quizzes (Guided Selling): `/admin/ux/quizzes`, `GET/POST/PATCH/DELETE /api/admin/quizzes`, quiz-questions, quiz-answers
- [x] Quick View Config: `/admin/ux/quick-view-config`, `GET/POST/PATCH/DELETE /api/admin/quick-view-config`

---

## Phase 15: Go-Live

**Abhängigkeiten:** Phasen 0–14 (nach Bedarf). Phasen 16–21 optional für erweiterte Features.

### Cron-Jobs (cron-job.org oder Vercel Cron)

| Route | Rhythmus |
|-------|----------|
| `/api/cron/refresh-fbt` | Täglich 3:00 |
| `/api/cron/refresh-asin-locks` | Täglich 3:30 |
| `/api/cron/refresh-vault-drops` | Alle 15 Min |
| `/api/cron/notify-drop-radar` | Alle 30 Min |
| `/api/cron/refresh-vendor-metrics` | Täglich 4:00 |
| `/api/cron/check-tracking` | Täglich 8:00 |
| `/api/cron/auto-cancel-unpaid` | Alle 6 Std |

### Production-Checklist

- [ ] Mollie Live-Key
- [ ] E-Mail-Domain (Resend) verifiziert
- [ ] Rechtliches (Impressum, AGB, Datenschutz) mit echten Daten
- [ ] Storage-Buckets (product-images, ugc-images)
- [ ] Build erfolgreich (`npm run build`)

---

## Komplette Migrations-Reihenfolge (Copy & Paste)

Für den Supabase SQL Editor – führe nacheinander aus:

```
Phase 1:
  migration-asin-product-attributes.sql
  migration-asin-parent-child.sql
  migration-asin-catalog-sync-trigger.sql
  migration-asin-catalog-backfill.sql
  migration-vendor-performance-metrics.sql
  migration-vendor-performance-aggregation.sql
  migration-compliance-schema.sql
  migration-financials-ledger.sql
  migration-category-gating.sql

Phase 2:
  migration-order-shipments.sql
  migration-order-shipments-label-url.sql
  migration-order-shipments-delivered-at.sql

Phase 3:
  migration-fulfillment-order-lines.sql
  migration-mollie-split-vendors.sql

Phase 4:
  migration-blueprint-gamification.sql
  migration-gamification-gated-category-ext.sql
  migration-gated-categories-min-loyalty-tier.sql

Phase 5:
  migration-blueprint-community-split.sql

Phase 6:
  migration-blueprint-enforcement.sql

Phase 7:
  migration-blueprint-financials-infra.sql

Phase 8:
  migration-blueprint-deep-tech.sql

Phase 9:
  migration-blueprint-teil-10-marketing-b2b-security.sql

Phase 10:
  migration-blueprint-teil-11-power-user.sql

Phase 11:
  migration-blueprint-teil-12-margins-fraud.sql

Phase 12:
  migration-blueprint-teil-13-15-ux-state-ui.sql
  migration-blueprint-teil-11-15-supplement.sql
  migration-blueprint-teil-10-12-supplement.sql

Phase 13:
  migration-product-reviews-verified-purchase.sql
  migration-cx-schema.sql
  migration-vine-program.sql
  migration-advertising-schema.sql
  migration-advertising-vendor-optional.sql
  migration-cx-a2z-sla-ext.sql
  (Ohne fulfillment: migration-cx-a2z-sla-ext-standalone.sql statt migration-cx-a2z-sla-ext.sql)

Phase 14:
  migration-blueprint-grants.sql
  (+ weitere Grant-Migrations je nach genutzten Schemas)

Phase 16 (TEIL 16 – Retail Media):
  migration-blueprint-teil-16-retail-media.sql

Phase 17 (TEIL 17 – Legal & Vendor Programs):
  migration-blueprint-teil-17-legal-vendor-programs.sql

Phase 18 (TEIL 18 – Enterprise):
  migration-blueprint-teil-18-enterprise.sql

Phase 19 (TEIL 19 – Enterprise B2B):
  migration-blueprint-teil-19-enterprise.sql
  migration-blueprint-teil-19-grants.sql

Phase 20–21 (TEIL 20–21 – Micro-Logistics & Visual Merchandising):
  migration-blueprint-teil-20-21-micro-logistics-visual-merchandising.sql
  migration-blueprint-teil-20-21-grants.sql
```

---

## Verweise

- **Master (alle Blueprints konsolidiert):** [BLUEPRINT-MASTER.md](./BLUEPRINT-MASTER.md)
- **Detail-Status:** [BLUEPRINT-VOLLSTANDS-UMSETZUNG.md](./BLUEPRINT-VOLLSTANDS-UMSETZUNG.md)
- **Produktion:** [PRODUCTION-CHECKLIST.md](../PRODUCTION-CHECKLIST.md)
- **Marktplatz-Roadmap:** [MARKTPLATZ-BLUEPRINT-ROADMAP.md](./MARKTPLATZ-BLUEPRINT-ROADMAP.md)
