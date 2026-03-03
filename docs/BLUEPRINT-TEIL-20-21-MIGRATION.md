# Blueprint TEIL 20 & 21: Micro-Logistics, Catalog Automation, Visual Merchandising (1:1)

Umsetzung **genau nach** dem technischen Blueprint.

---

## Voraussetzungen

- **Phase 1 ASIN:** `catalog.amazon_standard_identification_numbers` muss existieren (z. B. `migration-asin-parent-child.sql`), sonst werden virtual_bundles, bestseller_ranks, platform_choice_badges, product_media_assets, quick_view_config **nicht** angelegt.
- **Phase 1 Category Gating:** `admin.gated_categories` für `bestseller_ranks`.
- **Projekt:** `vendor_accounts(id)`, `orders(id)`, `products(id)`, `auth.users(id)`.
- Blueprint-Referenzen: `vendors.accounts(vendor_id)` → `vendor_accounts(id)`, `fulfillment.orders(order_id)` → `orders(id)`.

---

## TEIL 20 – Inhalt (1:1)

1. **FBA Small & Light** – `logistics_optimization.routing_rules`; `catalog.product_attributes` (angelegt falls nicht vorhanden) mit `physical_thickness_mm`, `physical_weight_grams`.
2. **Virtual Product Bundles** – `catalog_automation.virtual_bundles` (bundle_asin PK → catalog.amazon_standard_identification_numbers), `virtual_bundle_components` (bundle_asin, component_asin). Nur wenn catalog existiert.
3. **SFP Trial & Revocation** – `vendor_performance.sfp_trials` inkl. GENERATED `on_time_delivery_rate` (CASE/Division), Index `idx_sfp_status`.
4. **Stranded Inventory** – `logistics_optimization.stranded_inventory` (asin VARCHAR(10), liquidation_eligible_at per **Trigger** = stranded_since + 60 Tage, da GENERATED mit INTERVAL nicht immutable), Index `idx_stranded_date`.
5. **Request a Review** – `customer_engagement.review_requests` (order_id → orders(id), customer_id → auth.users(id), CONSTRAINT check_request_timing 5–30 Tage, UNIQUE(order_id)).
6. **Bestseller Rank** – `catalog_automation.bestseller_ranks` (asin, category_id → admin.gated_categories(category_id), UNIQUE(asin, category_id)), Index `idx_bsr_ranking`. Nur wenn catalog + admin.gated_categories existieren.
7. **Platform Choice** – `catalog_automation.platform_choice_badges` (winning_asin → catalog). Nur wenn catalog existiert.

---

## TEIL 21 – Inhalt (1:1)

8. **Intentions-Hubs** – `visual_merchandising.navigation_hubs` (hub_name, ui_layout_type, slug_url, sort_order).
9. **Product Media** – `visual_merchandising.product_media_assets` (asin → catalog, media_type HERO_IMAGE_1600PX/HOVER_PREVIEW_VIDEO/360_SPIN_FRAME/LIFESTYLE_IMAGE, **CONSTRAINT check_high_res** 1600×1600 für HERO), Index `idx_media_asin`. Nur wenn catalog existiert.
10. **Guided Selling** – `guided_selling.quizzes`, `quiz_questions`, `quiz_answers` (associated_jsonb_filter, icon_url).
11. **Quick View** – `visual_merchandising.quick_view_config` (asin PK → catalog, allow_quick_view, force_redirect_to_pdp). Nur wenn catalog existiert.

---

## Migrations-Reihenfolge

1. `supabase/migration-blueprint-teil-20-21-micro-logistics-visual-merchandising.sql`
2. `supabase/migration-blueprint-teil-20-21-grants.sql`

---

## Einzige Abweichung vom Blueprint

- **liquidation_eligible_at:** Statt `GENERATED ALWAYS AS (stranded_since + INTERVAL '60 days') STORED` (in PostgreSQL nicht immutable) wird derselbe Wert per **BEFORE INSERT/UPDATE Trigger** gesetzt.
