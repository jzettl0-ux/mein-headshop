# Blueprint Teil 14–18: Abgleich mit bestehender Implementierung

Übersicht, welche Teile des Blueprints (Next-Gen UI/UX, Frontend-Logik, Retail Media, Legal, Enterprise) bereits umgesetzt sind.

---

## Teil 14: Immersive Shopping & Dynamic State Management

| Blueprint-Feature | Migration / Modul | Status | Anpassung |
|-------------------|-------------------|--------|-----------|
| **1. WebXR / 3D Product Previews** | `migration-blueprint-teil-11-15-supplement.sql` → `catalog.product_3d_assets` | ✅ | `product_id` statt ASIN, `file_url` statt `file_s3_url` |
| **2. Cross-Device Cart Sync** | `migration-blueprint-teil-13-15-ux-state-ui.sql` → `cart_management.shopping_carts`, `cart_items` | ✅ | `product_id` statt `offer_id` (kein vendor_offers) |
| **3. Dynamic Faceted Search** | `storefront.category_facet_config`, `facet_predefined_values` | ✅ | FK auf `admin.gated_categories` oder `product_categories` |
| GIN-Index JSONB | `catalog.product_attributes` (EAV) | ✅ | GIN auf `attribute_value` |

---

## Teil 15: Premium Frontend Design & UX

| Blueprint-Feature | Migration / Modul | Status |
|-------------------|-------------------|--------|
| **1. Bento Grid Layouts** | `ui_config.homepage_layouts` | ✅ |
| **2. A+ Module Types (Scrollytelling)** | `ui_config.aplus_module_types` | ✅ |
| **3. Checkout Dropoff Tracking** | `funnel_analytics.checkout_dropoffs` | ✅ |
| **4–5. Hyper-Personalisierung, Cognitive Load** | Frontend-Logik | ⚡ UI |

---

## Teil 16: High-End Retail Media & Sensory UI

| Blueprint-Feature | Migration / Modul | Status | Anpassung |
|-------------------|-------------------|--------|-----------|
| **1. Native Bento-Ads** | `retail_media.native_banners` | ✅ | `vendor_accounts` |
| **2. Shoppable Editorials** | `retail_media.editorials`, `editorial_hotspots` | ✅ | `product_id` statt ASIN |
| **3. Terpen-Visualizer** | `catalog.sensory_profiles` | ✅ | `product_id` statt ASIN |
| **4. Brand Boutiques** | `brand_stores.custom_storefronts` | ✅ | `brand_registry_id` optional FK |
| **5. Unboxing/Gifting** | Frontend-Checkout | ⚡ UI |

---

## Teil 17: Legal Automation & Vendor Programs

| Blueprint-Feature | Migration / Modul | Status |
|-------------------|-------------------|--------|
| **1. PAngV Grundpreis** | `legal_compliance.base_pricing_rules` | ✅ |
| **2. Geo-Restrictions** | `legal_compliance.geo_restrictions` | ✅ |
| **3. CSBA** | `vendor_programs.csba_subscriptions` | ✅ |
| **4. Launchpad** | `vendor_programs.launchpad_enrollments` | ✅ |
| **5. Market Basket** | `advanced_analytics.market_basket_correlations` | ✅ |

---

## Teil 18: Enterprise Backend Operations

| Blueprint-Feature | Migration / Modul | Status |
|-------------------|-------------------|--------|
| **1. FBA Reimbursement** | `warehouse_ops.inventory_discrepancies`, `reimbursements` | ✅ |
| **2. Third-Party Warranties** | `catalog.warranty_plans` | ✅ |
| **3. 1P Vendor Central** | `vendor_central.suppliers`, `purchase_orders`, `po_items` | ✅ |
| **4. Wave Picking** | `warehouse_ops.picking_waves`, `pick_tasks` | ✅ |
| **5. MAP Enforcement** | `brand_enforcement.map_policies`, `map_violations` | ✅ |

---

## Projekt-spezifische Anpassungen

- **ASIN vs. product_id:** Das Projekt nutzt `products(id)` statt ASIN; alle Tabellen verwenden `product_id`.
- **vendor_accounts:** Stammt aus `migration-vendors-kyb.sql` (public).
- **Kategorien:** `product_categories` + `admin.gated_categories` für Facet-Config.

---

## Relevante Migrationen (Reihenfolge)

```
migration-product-categories.sql
migration-vendors-kyb.sql
migration-category-gating.sql
migration-blueprint-teil-13-15-ux-state-ui.sql
migration-blueprint-teil-11-15-supplement.sql
migration-blueprint-teil-16-retail-media.sql
migration-blueprint-teil-17-legal-vendor-programs.sql
migration-blueprint-teil-18-enterprise.sql
migration-blueprint-teil-13-18-grants.sql
```
