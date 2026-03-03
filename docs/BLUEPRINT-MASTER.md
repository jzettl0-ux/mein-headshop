# Blueprint Master – Alle Teile 1–18, phasenweise abarbeitbar

> **Konsolidierte Referenz** aller Blueprint-Spezifikationen von Teil 1 bis Teil 18.  
> Jede Phase: Migrations → APIs/UI → Checkliste zum Abhaken.

---

## Vollständiger Abgleich: Teil 1 bis Teil 18

| Teil | Thema | Migrations | Status |
|------|-------|------------|--------|
| **1** | Basis, Architektur, ASIN, Buy Box, Compliance, KYB, Logistik | schema.sql, vendors-kyb, asin-*, vendor-performance-*, compliance-schema, financials-ledger, category-gating, order-shipments, mollie-split, fulfillment-order-lines | ✅ |
| **2** | Advanced Marketplace (Trade-In, Inventory Health, Repricer, MCF, Eco) | migration-blueprint-recommerce, migration-blueprint-inventory-analytics, migration-blueprint-repricer, migration-blueprint-mcf, migration-blueprint-eco-certifications | ✅ |
| **3** | Advanced Ops & B2B (Transparency, B2B Guided Buying, Recalls, SAFE-T, Product Guidance) | migration-blueprint-transparency, migration-blueprint-b2b-guided-buying, migration-blueprint-product-recalls, migration-blueprint-safet-claims, migration-blueprint-product-guidance | ✅ |
| **4** | Gamification | migration-blueprint-gamification, migration-gamification-gated-category-ext, migration-gated-categories-min-loyalty-tier | ✅ |
| **5** | Community & Split Payment | migration-blueprint-community-split | ✅ |
| **6** | Enforcement | migration-blueprint-enforcement, migration-cx-a2z-sla-ext | ✅ |
| **7+8** | Financials & Infrastructure | migration-blueprint-financials-infra | ✅ |
| **9** | Deep Tech | migration-blueprint-deep-tech | ✅ |
| **10** | Marketing, B2B, Hazmat, RFQ, A/B | migration-blueprint-teil-10-marketing-b2b-security, migration-blueprint-teil-10-12-supplement | ✅ |
| **11** | Project Zero, NCX, Off-Platform, Brand Analytics | migration-blueprint-teil-11-power-user, migration-blueprint-teil-11-15-supplement | ✅ |
| **12** | Returnless, Fraud, Factoring, Tailored Promos | migration-blueprint-teil-12-margins-fraud, migration-blueprint-teil-10-12-supplement | ✅ |
| **13–15** | UX, Cart, Facets, Funnel | migration-blueprint-teil-13-15-ux-state-ui, migration-blueprint-teil-11-15-supplement | ✅ |
| **16** | Retail Media, Shoppable Editorials, Terpen-Visualizer, Brand Boutiques | migration-blueprint-teil-16-retail-media | ✅ |
| **17** | PAngV, Geo-Restrictions, CSBA, Launchpad, Market Basket | migration-blueprint-teil-17-legal-vendor-programs | ✅ |
| **18** | FBA Reimbursement, Warranties, Vendor Central (1P), Wave Picking, MAP | migration-blueprint-teil-18-enterprise | ✅ |
| **19** | PunchOut, CRAP, FEFO, Creator Economy, Anti-Hijacking, OSS | migration-blueprint-teil-19-enterprise | ✅ |

**Referenz-Dokumente:** BLUEPRINT-2025-2026-REFERENZ.md (Abschnitte 1–12), BLUEPRINT-2-3-CONSOLIDATED.md (Teil 2 & 3)

### REFERENZ 1–12 → Umsetzung

| REFERENZ § | Inhalt | Migration / Modul |
|------------|--------|-------------------|
| 1 | Systemarchitektur, Event-Driven | schema, Domain Events (migration-domain-events) |
| 2 | ASIN-Katalog, Parent/Child | migration-asin-product-attributes, migration-asin-parent-child |
| 3 | Buy Box | migration-vendor-performance-metrics, migration-buybox |
| 4 | Compliance (KCanG, JuSchG, DDG, BFSG) | migration-compliance-schema, migration-age-verification |
| 5 | Vendor KYB | migration-vendors-kyb |
| 6 | Logistik (DHL, Order Splitting) | migration-order-shipments, migration-fulfillment-order-lines, lib/dhl-parcel |
| 7 | Abrechnung, Self-Billing | migration-financials-ledger, lib/self-billing |
| 8 | PPC / Sponsored Products | migration-advertising-schema |
| 9 | Admin Governance | migration-category-gating |
| 10 | Customer Experience | migration-cx-schema, migration-product-reviews-verified-purchase |
| 11 | Advanced Features | migration-lightning-deals, migration-shoppable-videos, migration-aplus-content, migration-b2b-schema, migration-fulfillment-returns |
| 12 | Experten-Features | migration-return-inspections, migration-brand-registry, migration-coupons-voucher-badges, migration-product-qa, migration-affiliate-links |

---

## Übersicht: Phasen 0–15

| Phase | Schwerpunkt | Migrations | APIs/UI Status | Priorität |
|-------|-------------|------------|----------------|-----------|
| 0 | Basis (vorausgesetzt) | schema, vendors, categories | — | — |
| 1 | ASIN, Compliance, Category Gating | 9 Dateien | — | Hoch |
| 2 | DHL & Logistik | 3 Dateien | ✅ | Hoch |
| 3 | Mollie Split, Order Splitting | 2 Dateien | ✅ | Mittel |
| 4 | Gamification (Vault, Loyalty, Drop-Radar) | 3 Dateien | ✅ | Hoch |
| 5 | Community (UGC, Split Payment) | 1 Datei | ✅ | Hoch |
| 6 | Enforcement (RFS, ASIN Locks) | 1 Datei | ✅ | Niedrig |
| 7 | Financials & Infrastructure | 1 Datei | teilw. | Mittel |
| 8 | Deep Tech | 1 Datei | offen | Niedrig |
| 9 | **Teil 10:** Marketing, B2B, Hazmat, RFQ, A/B | 1 Datei | ✅ | Mittel |
| 10 | **Teil 11:** Project Zero, NCX, Off-Platform, Brand Analytics | 1 Datei | ✅ | Niedrig |
| 11 | **Teil 12:** Returnless, Fraud, Factoring, Tailored Promos | 1 Datei | ✅ | Niedrig |
| 12 | **Teil 13–15:** UX, Cart, Facets, Funnel | 1 Datei | ✅ | Mittel |
| 12b | **Teil 16:** Retail Media, Sensory UI, Brand Boutiques | 1 Datei | ✅ | Niedrig |
| 12c | **Teil 17:** PAngV, Geo, CSBA, Launchpad, Market Basket | 1 Datei | ✅ | Niedrig |
| 12d | **Teil 18:** FBA, Warranties, 1P Vendor Central, Wave Picking, MAP | 1 Datei | ✅ | Niedrig |
| 13 | CX, PPC, Vine | 6 Dateien | teilw. | Mittel |
| 14 | Grants & Berechtigungen | 8 Dateien | — | Hoch |
| 15 | Go-Live | — | Cron, Prod-Checklist | Hoch |

---

## Phase 0: Basis (vorausgesetzt)

| Komponente | Datei |
|------------|-------|
| Basis-Schema | `schema.sql` |
| Produktkategorien | `migration-product-categories.sql` |
| Vendors & Offers | `migration-vendors-kyb.sql` |
| B2B | `migration-b2b-schema.sql` |
| Fulfillment | `migration-fulfillment-order-lines.sql` |

---

## Phase 1: ASIN, Compliance, Category Gating

**Migrations (Reihenfolge):**
1. `migration-asin-product-attributes.sql`
2. `migration-asin-parent-child.sql`
3. `migration-asin-catalog-sync-trigger.sql`
4. `migration-asin-catalog-backfill.sql`
5. `migration-vendor-performance-metrics.sql`
6. `migration-vendor-performance-aggregation.sql`
7. `migration-compliance-schema.sql`
8. `migration-financials-ledger.sql`
9. `migration-category-gating.sql`

---

## Phase 2: DHL & Logistik

**Migrations:** `migration-order-shipments.sql`, `migration-order-shipments-label-url.sql`, `migration-order-shipments-delivered-at.sql`  
**APIs/UI:** DHL GKP, Admin Versand-Label ✅

---

## Phase 3: Mollie Split & Order Splitting

**Migrations:** `migration-mollie-split-vendors.sql`  
**APIs/UI:** Split-Payment-Checkout ✅

---

## Phase 4: Blueprint Teil 4 – Gamification

**Migrations:** `migration-blueprint-gamification.sql`, `migration-gamification-gated-category-ext.sql`, `migration-gated-categories-min-loyalty-tier.sql`  
**APIs/UI:** Vault-Drops, Drop-Radar, Price Lock, Gamified Cart, Secret Shop ✅

---

## Phase 5: Blueprint Teil 5 – Community & Split Payment

**Migrations:** `migration-blueprint-community-split.sql`  
**APIs/UI:** UGC (Rate my Setup), Split Payment ✅  
**Storage:** Bucket `ugc-images`

---

## Phase 6: Blueprint Teil 6 – Enforcement

**Migrations:** `migration-blueprint-enforcement.sql`  
**APIs/UI:** Return Inspections ✅, ASIN-Locks-Cron ✅, Admin ASIN-Locks-Seite ✅

---

## Phase 7: Blueprint Teil 7+8 – Financials & Infrastructure

**Migrations:** `migration-blueprint-financials-infra.sql`  
**APIs/UI:** Blended Shipping, FBT ✅, Cron (offen)

---

## Phase 8: Blueprint Teil 9 – Deep Tech

**Migrations:** `migration-blueprint-deep-tech.sql`  
**APIs/UI:** Catalog Duplicates, Risk Evaluations, Payout Batches (offen)

---

## Phase 9: Blueprint Teil 10 – Advanced Marketing, B2B Sales & Platform Security

**Migrations:** `migration-blueprint-teil-10-marketing-b2b-security.sql`, `migration-blueprint-teil-10-12-supplement.sql`  
**APIs/UI:** A/B Experimente ✅, Attribution Campaigns ✅, Gefahrgut (Hazmat) ✅, B2B RFQ ✅

**Quelle:** Dein Blueprint-Text (Teil 10)

### 1. Brand Referral Bonus & Externe Attribution
- Attribution Engine: Tracking-Links `?ref=vendorID_campaign123`
- Cookie- & Session-Tracking (14-Tage-Attributions-Cookie)
- Automatischer Provisions-Rabatt (z. B. 5 % statt 15 %)
- **Migration:** `marketing.attribution_campaigns`, `marketing.attribution_events` ✅

### 2. Anonymisiertes Buyer-Seller Messaging & Anti-Poaching
- E-Mail-Maskierung (Alias: buyer-xyz@msg.deinshop.de)
- Echtzeit-Regex-Filter (URLs, Telefon, „Shopify“, „außerhalb“)
- Auto-Strike-System (3 Strikes → Suspendierung)
- SLA-Tracking (24 h CRT, fließt in Buy Box)
- **Migration:** `communications.masked_emails`, `communications.messages` ✅

### 3. Gefahrgut-Pipeline (Hazmat)
- Katalog-Quarantäne: DANGEROUS_GOOD_PENDING
- SDS-Zwang (Sicherheitsdatenblatt, UN3481)
- Logistik-Flagging: is_hazmat = TRUE, DHL-Parameter
- **Migration:** `compliance_hazmat.product_safety_data` ✅

### 4. Dynamic RFQ für B2B
- „Angebot anfordern“-Button (Zielmenge, Zielpreis)
- Verhandlungs-Ping-Pong (Ablehnen, Akzeptieren, Gegenangebot)
- Temporary Checkout Token (48 h gültig)
- **Migration:** `b2b_negotiation.quote_requests`, `b2b_negotiation.quote_responses` ✅

### 5. Manage Your Experiments (A/B Testing)
- Split-Testing (Bild A vs. B, A+ Content)
- Traffic-Allocation (50/50 Hash der Session-ID)
- Konversions-Reporting, automatischer Gewinner-Übernahme
- **Migration:** `marketing.ab_experiments`, `marketing.ab_experiment_metrics` ✅

**Migration-Datei:** `migration-blueprint-teil-10-marketing-b2b-security.sql`  
**Ergänzung:** `migration-blueprint-teil-10-12-supplement.sql` (Strike-Log, Messaging-SLA, RFQ 48h)

---

## Phase 10: Blueprint Teil 11 – Brand Protection, Off-Platform Checkout & Deep Analytics

**Migrations:** `migration-blueprint-teil-11-power-user.sql`, `migration-blueprint-teil-11-15-supplement.sql`  
**APIs/UI:** NCX-Score ✅, Search Frequency Rank ✅, Widget Deployments (Buy With) ✅

**Quelle:** Dein Blueprint-Text (Teil 11)

### 1. Project Zero (Self-Service Takedowns)
- Takedown per Knopfdruck für Markeninhaber
- Accuracy Tracking (unter 99 % → Privileg entzogen)
- **Migration:** `brand_tools.project_zero_takedowns`, `brand_tools.project_zero_accuracy` ✅

### 2. Voice of the Customer (NCX-Score)
- Signal-Aggregation (Retouren, Reviews, A2Z)
- NCX-Berechnung, algorithmische Sperre (>8 %, ≥50 Bestellungen)
- Plan of Action bei Suppression
- **Migration:** `advanced_analytics.ncx_scores` ✅

### 3. Buy With (Off-Platform Checkout)
- Widget-Snippet für Shopify/Händler
- Checkout-Overlay, AVS-Abnahme, Versand aus FBA
- **Migration:** `external_commerce.widget_deployments`, `external_commerce.off_platform_orders` ✅

### 4. Inventory Performance Index (IPI)
- Score 0–1000 (Sell-through, Overstock, In-Stock)
- inbound_creation_blocked bei IPI &lt; 400
- **Migration:** `advanced_logistics.ipi_scores` ✅ (Supplement)

### 5. B2B Spend Visibility Dashboard
- Gesamtausgaben, Ausgaben nach Kategorie, pro Mitglied
- **Migration:** Keine eigene Tabelle (Analytics auf orders/B2B)

### 6. Brand Analytics: Search Frequency Rank & Click Share
- SFR: Suchbegriffe nach Volumen ranken
- Click Share & Conversion Share pro Begriff
- **Migration:** `advanced_analytics.search_frequency_rank` ✅

**Migration-Datei:** `migration-blueprint-teil-11-power-user.sql`

---

## Phase 11: Blueprint Teil 12 – Margen-Optimierung, Fraud Prevention & Hyper-Targeting

**Migrations:** `migration-blueprint-teil-12-margins-fraud.sql`, `migration-blueprint-teil-10-12-supplement.sql`  
**APIs/UI:** Returnless Refunds ✅, Vendor Flex ✅, Buyer Health (Fraud) ✅, B2B Factoring ✅, Tailored Promotions ✅

**Quelle:** Dein Blueprint-Text (Teil 12)

### 7. Returnless Refunds
- Heuristik: Preis unter Schwellenwert → kein Label, sofortige Erstattung
- **Migration:** `margins.returnless_refund_rules` ✅

### 8. Vendor Flex Node
- Dezentrales FBA, Lager als API angebunden
- Virtuelles FBA-Badge, Routing in Hersteller-Lager
- **Migration:** `margins.vendor_flex_nodes` ✅

### 9. Buyer Fraud & Concession Abuse Engine
- Buyer Health Score, Friction (keine kostenlosen Retouren, OTP)
- **Migration:** `fraud_prevention.buyer_health_scores` ✅

### 10. B2B Pay by Invoice (API-Factoring)
- Mondu/Billie-Integration, Bonitätsprüfung, Netto 30/60
- **Migration:** `b2b_finance.factoring_agreements` ✅

### 11. Brand Tailored Promotions
- Segmente: CART_ABANDONERS, BRAND_FOLLOWERS, REPEAT_CUSTOMERS
- **Migration:** `marketing.brand_tailored_promotions` ✅

**Migration-Datei:** `migration-blueprint-teil-12-margins-fraud.sql`

---

## Phase 12: Blueprint Teil 13–15 – Frictionless Shopping, Immersive UI, Premium Design

**Migrations:** `migration-blueprint-teil-13-15-ux-state-ui.sql`, `migration-blueprint-teil-11-15-supplement.sql`  
**APIs/UI:** Component Registry ✅, Bento Layouts ✅, Checkout Dropoffs ✅, Such-Autocomplete ✅, Replenishment (Buy It Again) ✅

**Quelle:** Dein Blueprint-Text (Teil 13, 14, 15)

### Teil 13: Frictionless Shopping & UI-Architektur

1. **1-Click Checkout** – Standardadresse + Zahlungsmethode, direkter Kauf  
   **Migration:** `customer_profiles.checkout_preferences` ✅

2. **Visual Autocomplete** – Debounce, Produkt-Kacheln mit Bild/Preis  
   **Migration:** `frontend_ux.search_autocomplete_analytics` ✅

3. **Buy It Again** – Replenishment-Formel, Nudge 5 Tage vor Ablauf  
   **Migration:** `frontend_ux.replenishment_predictions` ✅

4. **Akkordeon-Checkout** – Schritte 1–3 ausklappbar, Fortschrittsbalken (UX, keine Tabelle)

5. **Self-Service Return Hub & Mobile QR-Drop** – DHL Parcel Returns API, QR statt PDF (bestehende DHL-Integration)

6. **Micro-Frontends** – Component Registry für isolierte UI-Module  
   **Migration:** `frontend_ux.component_registry` ✅

### Teil 14: Immersive Shopping & Dynamic State Management

1. **WebXR / 3D Product Previews** – .glb/.gltf, .usdz, AR Quick Look  
   **Migration:** `catalog.product_3d_assets` ✅ (Supplement)

2. **Cross-Device Cart** – session_id vs. customer_id, Merge-Engine bei Login  
   **Migration:** `cart_management.shopping_carts`, `cart_management.cart_items` ✅

3. **Advanced Faceted Search** – JSONB-Keys als Filter (Range-Slider, Checkbox)  
   **Migration:** `storefront.category_facet_config`, `storefront.facet_predefined_values` ✅

### Teil 15: Premium Frontend Design (Light Aesthetics)

1. **Bento Grid & Light Aesthetics** – Whitespace, schwarze Typo, Gold-Akzente  
   **Migration:** `ui_config.homepage_layouts` ✅

2. **Scrollytelling & Premium A+ Content** – Module HOTSPOT_IMAGE, COMPARISON_TABLE, VIDEO_HERO  
   **Migration:** `ui_config.aplus_module_types` ✅ (Supplement)

3. **Mobile-First App-Like** – Thumb Zone, Micro-Interactions (UX)

4. **Hyper-Personalisierung** – B2B vs. B2C Rendering, Predictive Replenishment (in homepage_layouts.target_audience)

5. **Cognitive Load Checkout** – Akkordeon, Trust-Signals  
   **Migration:** `funnel_analytics.checkout_dropoffs` ✅

**Migration-Datei:** `migration-blueprint-teil-13-15-ux-state-ui.sql`

---

## Phase 12b: Blueprint Teil 16 – Retail Media & Sensory UI

**Migrations:** `migration-blueprint-teil-16-retail-media.sql`  
**APIs/UI:** Native Banners ✅, Shoppable Editorials ✅, Sensory Profiles ✅, Brand Boutiques ✅

**Quelle:** Dein Blueprint-Text (Teil 16)

1. **Native Bento-Grid Ads** – Retail Media, nahtlose Integration ins Layout  
   **Migration:** `retail_media.native_banners` ✅

2. **Shoppable Editorials** – Lifestyle-Fotos mit Hotspots, Glassmorphism-Overlay  
   **Migration:** `retail_media.editorials`, `retail_media.editorial_hotspots` ✅

3. **Terpen- & Wirkungs-Visualizer** – Radar-/Spider-Charts, Sensory Profiles  
   **Migration:** `catalog.sensory_profiles` ✅

4. **Immersive Brand Boutiques** – Shop-in-Shop, CI-Isolierung  
   **Migration:** `brand_stores.custom_storefronts` ✅

**Migration-Datei:** `migration-blueprint-teil-16-retail-media.sql`

---

## Phase 12c: Blueprint Teil 17 – Legal Automation & Vendor Programs

**Migrations:** `migration-blueprint-teil-17-legal-vendor-programs.sql`  
**APIs/UI:** PAngV Grundpreis ✅, Geo-Restriktionen ✅, CSBA ✅, Launchpad ✅, Market Basket ✅

**Quelle:** Dein Blueprint-Text (Teil 17)

1. **PAngV Grundpreis-Engine** – automatische Grundpreis-Kalkulation, Bulk-Upselling  
   **Migration:** `legal_compliance.base_pricing_rules` ✅

2. **Geo-Compliance-Blocker** – Cross-Border Export Controls, Blacklist  
   **Migration:** `legal_compliance.geo_restrictions` ✅

3. **Customer Service by Admin (CSBA)** – Support-Auslagerung, Pauschale pro Bestellung  
   **Migration:** `vendor_programs.csba_subscriptions` ✅

4. **Launchpad Accelerator** – Neue Marken-Boost, Exklusivität  
   **Migration:** `vendor_programs.launchpad_enrollments` ✅

5. **Market Basket Analysis** – Share-of-Wallet Dashboard für Vendoren  
   **Migration:** `advanced_analytics.market_basket_correlations` ✅

**Migration-Datei:** `migration-blueprint-teil-17-legal-vendor-programs.sql`

---

## Phase 12d: Blueprint Teil 18 – Enterprise Backend Operations

**Migrations:** `migration-blueprint-teil-18-enterprise.sql`  
**APIs/UI:** FBA Reimbursement ✅, Warranties ✅, Vendor Central (POs) ✅, Wave Picking ✅, MAP Enforcement ✅

**Quelle:** Dein Blueprint-Text (Teil 18)

1. **FBA Lost & Damaged Reimbursement** – WMS-Sync, Fair Market Value, Auto-Auszahlung  
   **Migration:** `warehouse_ops.inventory_discrepancies`, `warehouse_ops.reimbursements` ✅

2. **Third-Party Warranties** – Garantie-Vermittlung, Broker-Provision  
   **Migration:** `catalog.warranty_plans` ✅

3. **1P Vendor Central** – Purchase Orders, Großhandel  
   **Migration:** `vendor_central.suppliers`, `vendor_central.purchase_orders`, `vendor_central.po_items` ✅

4. **Warehouse Wave Picking** – Traveling Salesman, Slotting  
   **Migration:** `warehouse_ops.picking_waves`, `warehouse_ops.pick_tasks` ✅

5. **Dynamic MAP Enforcement** – Minimum Advertised Price, Buy-Box-Suppression  
   **Migration:** `brand_enforcement.map_policies`, `brand_enforcement.map_violations` ✅

**Migration-Datei:** `migration-blueprint-teil-18-enterprise.sql`

---

## Phase 13: CX, PPC, Vine

**Migrations:** product-reviews-verified-purchase, cx-schema, vine-program, advertising-schema, advertising-vendor-optional, cx-a2z-sla-ext

---

## Phase 14: Grants & Berechtigungen

**Migrations:** blueprint-grants, transparency-grants, eco-recalls-safet-grants, b2b-guided-buying-grants, cx-grants, **migration-advertising-grants**, mcf-grants, inventory-health-grants, repricer-grants, **migration-blueprint-teil-13-18-grants** (Teil 13–18 Schemas)

---

## Phase 15: Go-Live

### Cron-Jobs (bereits in `vercel.json`)

| Route | Beschreibung | Zeitplan |
|-------|--------------|----------|
| `/api/cron/refresh-vault-drops` | Vault-Drop-Status (Gamification) | Alle 15 Min |
| `/api/cron/notify-drop-radar` | Drop-Radar Restock-E-Mails | Alle 30 Min |
| `/api/cron/refresh-fbt` | FBT-Aggregation aus Bestellungen | Täglich 3:00 |
| `/api/cron/refresh-asin-locks` | ASIN-Locks (Review-Count) | Täglich 3:30 |
| `/api/cron/refresh-vendor-metrics` | Vendor-Metriken | Täglich 4:00 |
| `/api/cron/check-tracking` | DHL Tracking-Sync | Täglich 8:00 |
| `/api/cron/auto-cancel-unpaid` | Storno unbezahlter Bestellungen | Alle 6 Std |

**Zusätzliche Cron-Routen** (nicht in vercel.json): `send-review-requests`, `sync-products`, `process-subscriptions`, `send-newsletter-discount-codes`, `refresh-search-gaps`, `calculate-inventory-health`, `run-repricer`.

**Auth:** Alle Routen erwarten `?secret=CRON_SECRET`. Vercel Cron sendet keine Query-Parameter – für Produktion externen Dienst (z. B. cron-job.org) mit voller URL nutzen.

### Checklist

- [ ] **Mollie** – Live API-Keys
- [ ] **E-Mail** – Resend/Domain konfiguriert
- [ ] **Rechtliches** – Impressum, AGB, Datenschutz
- [ ] **Storage** – Supabase Buckets (Produktbilder, UGC)
- [ ] **Build** – `npm run build` ohne Fehler

Siehe [PRODUCTION-CHECKLIST.md](../PRODUCTION-CHECKLIST.md) für Details.

---

## Vollständige Migrations-Reihenfolge (Copy & Paste)

```
# Teil 1: Basis (Phase 0–1)
Phase 0: schema.sql, migration-product-categories.sql, migration-vendors-kyb.sql, migration-b2b-schema.sql, migration-fulfillment-order-lines.sql

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

# Teil 2 & 3: Advanced Marketplace & B2B Governance (nach Phase 1)
  migration-blueprint-transparency.sql
  migration-blueprint-eco-certifications.sql
  migration-blueprint-product-recalls.sql
  migration-blueprint-b2b-guided-buying.sql
  migration-blueprint-safet-claims.sql
  migration-blueprint-recommerce.sql
  migration-blueprint-repricer.sql
  migration-blueprint-inventory-analytics.sql
  migration-blueprint-mcf.sql
  migration-blueprint-product-guidance.sql

Phase 2:
  migration-order-shipments.sql
  migration-order-shipments-label-url.sql
  migration-order-shipments-delivered-at.sql

Phase 3:
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
  migration-cart-merged-into-fk.sql   # merged_into_cart_id Self-FK (Teil 14)
  migration-blueprint-teil-11-15-supplement.sql   # IPI, 3D-Assets, A+ Module Types
  migration-blueprint-teil-10-12-supplement.sql   # Strike, Messaging-SLA, RFQ 48h, Promo is_active, OTP

Phase 12b:
  migration-blueprint-teil-16-retail-media.sql    # Retail Media, Editorials, Sensory UI, Brand Boutiques

Phase 12c:
  migration-blueprint-teil-17-legal-vendor-programs.sql   # PAngV, Geo-Restrictions, CSBA, Launchpad, Market Basket

Phase 12d:
  migration-blueprint-teil-18-enterprise.sql      # FBA Reimbursement, Warranties, 1P Vendor Central, Wave Picking, MAP

Phase 13:
  migration-product-reviews-verified-purchase.sql
  migration-cx-schema.sql
  migration-vine-program.sql
  migration-advertising-schema.sql
  migration-advertising-vendor-optional.sql
  migration-cx-a2z-sla-ext.sql

Phase 12e (Teil 19):
  migration-blueprint-teil-19-enterprise.sql   # PunchOut, CRAP, FEFO, Creator, Velocity, OSS
  migration-blueprint-teil-19-grants.sql

Phase 14:
  migration-blueprint-grants.sql
  migration-transparency-grants.sql
  migration-eco-recalls-safet-grants.sql
  migration-b2b-guided-buying-grants.sql
  migration-cx-grants.sql
  migration-advertising-grants.sql
  migration-mcf-grants.sql
  migration-inventory-health-grants.sql
  migration-repricer-grants.sql
  migration-blueprint-teil-13-18-grants.sql   # Teil 13–18: frontend_ux, storefront, ui_config, cart_management, retail_media, legal_compliance, warehouse_ops, etc.
  migration-blueprint-teil-19-grants.sql      # Teil 19: enterprise_b2b, financial_defense, wms_fefo, creator_economy

Phase 19 (Blueprint Teil 19):
  migration-blueprint-teil-19-enterprise.sql  # PunchOut, CRAP, FEFO, Creator Economy, Anti-Hijacking, OSS
```

---

## Blueprint-Abgleich (alle übernommen ✅)

| Feature | Blueprint-Referenz | Migration |
|---------|--------------------|-----------|
| IPI-Score | advanced_logistics.ipi_scores | migration-blueprint-teil-11-15-supplement.sql |
| 3D/AR product_3d_assets | catalog.product_3d_assets | migration-blueprint-teil-11-15-supplement.sql |
| aplus_module_types | ui_config.aplus_module_types | migration-blueprint-teil-11-15-supplement.sql |
| **Strike-System** (3 Strikes → Suspendierung) | communications.strike_log | migration-blueprint-teil-10-12-supplement.sql |
| **Messaging-SLA** (24h CRT, fließt in Buy Box) | communications.vendor_messaging_sla | migration-blueprint-teil-10-12-supplement.sql |
| **RFQ Checkout-Token 48h** | quote_responses.checkout_token_expires_at | migration-blueprint-teil-10-12-supplement.sql |
| **Promo is_active computed** | brand_tailored_promotions.is_active_computed | migration-blueprint-teil-10-12-supplement.sql |
| **OTP-Friction** (Buyer Fraud) | buyer_health_scores.requires_otp_on_delivery | migration-blueprint-teil-10-12-supplement.sql |
| **Teil 16:** Native Banners, Editorials, Sensory Profiles, Brand Boutiques | retail_media.*, catalog.sensory_profiles, brand_stores.* | migration-blueprint-teil-16-retail-media.sql |
| **Teil 17:** PAngV, Geo-Restrictions, CSBA, Launchpad, Market Basket | legal_compliance.*, vendor_programs.*, advanced_analytics.market_basket_correlations | migration-blueprint-teil-17-legal-vendor-programs.sql |
| **Teil 18:** FBA Reimbursement, Warranties, 1P Vendor Central, Wave Picking, MAP | warehouse_ops.*, vendor_central.*, brand_enforcement.* | migration-blueprint-teil-18-enterprise.sql |
| **Teil 19:** PunchOut, CRAP, FEFO, Creator Economy, Anti-Hijacking, OSS | enterprise_b2b.*, financial_defense.*, wms_fefo.*, creator_economy.* | migration-blueprint-teil-19-enterprise.sql |

---

## Abgleich-Hinweise (Vergleich mit deinem Blueprint-Text)

| Dein Blueprint | Umsetzung |
|----------------|-----------|
| NCX: „Retouren, Reviews, A2Z“ | `negative_returns`, `negative_reviews`, `negative_messages` (A2Z als Teil von Nachrichten/Claims) |
| product_id vs. ASIN | Projekt nutzt `products(id)` statt ASIN; Schemas entsprechend angepasst (inkl. Teil 16–18) |
| offer_id in RFQ | RFQ nutzt `product_id` (Projekt hat product_offers; für B2B-RFQ reicht Produktbezug) |

---

## Verweise

- **Phasen-Details:** [BLUEPRINT-PHASEN-PLAN.md](./BLUEPRINT-PHASEN-PLAN.md)
- **Implementierungs-Status:** [BLUEPRINT-VOLLSTANDS-UMSETZUNG.md](./BLUEPRINT-VOLLSTANDS-UMSETZUNG.md)
- **Produktion:** [PRODUCTION-CHECKLIST.md](../PRODUCTION-CHECKLIST.md)
- **Referenz:** [BLUEPRINT-2025-2026-REFERENZ.md](./BLUEPRINT-2025-2026-REFERENZ.md)
