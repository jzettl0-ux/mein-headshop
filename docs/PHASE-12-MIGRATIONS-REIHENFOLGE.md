# Phase 12: Blueprint Teil 13–15 – UX, State, Funnel – Migrations-Reihenfolge

**Abhängigkeiten:** Phase 0, 1. Optional: product_categories, admin.gated_categories (für Category Facet Config).

---

## Migrations

| # | Datei | Inhalt |
|---|--------|--------|
| 1 | `supabase/migration-blueprint-teil-13-15-ux-state-ui.sql` | 1-Click, Replenishment, Search Analytics, Component Registry, Cart, Facets, Homepage Layouts, Checkout Dropoffs |

---

## Phase-12-Checkliste

- [ ] 1. `migration-blueprint-teil-13-15-ux-state-ui.sql`

---

## APIs/UI (bereits umgesetzt ✅)

- [x] 1-Click: `GET/PATCH /api/account/checkout-preferences`, customer_profiles.checkout_preferences
- [x] Replenishment: `/admin/ux/replenishment`, `GET /api/admin/replenishment-predictions`, Cron `refresh-replenishment-predictions`
- [x] Search Autocomplete: `/admin/analytics/search-terms`, `GET /api/admin/search-autocomplete-analytics`
- [x] Carts: `/admin/ux/carts`, `GET /api/admin/carts`
- [x] Category Facets: `/admin/ux/category-facets`, `GET /api/admin/category-facets`
- [x] Homepage Layouts: `/admin/ux/homepage-layouts`, `GET /api/admin/homepage-layouts`
- [x] Checkout Dropoffs: `/admin/analytics/checkout-dropoffs`, `GET /api/admin/checkout-dropoffs`
- [x] Component Registry: `/admin/ux/component-registry`, `GET /api/admin/component-registry`

**Phase 12 abgeschlossen**, wenn die Migration fehlerfrei gelaufen ist.

---

## Nächste Schritte (manuell)

1. **Supabase SQL Editor:** `supabase/migration-blueprint-teil-13-15-ux-state-ui.sql` ausführen (evtl. vorher `migration-blueprint-teil-11-15-supplement.sql` / `migration-blueprint-teil-10-12-supplement.sql` laut Plan prüfen).
2. **Bedingte Tabellen:** Die Migration ist bereits robust:
   - **Cart:** shopping_carts/cart_items nur wenn noch nicht vorhanden.
   - **Category Facet Config:** nur wenn admin.gated_categories oder product_categories existiert; facet_predefined_values nur wenn category_facet_config existiert.
   - **Checkout Dropoffs:** mit oder ohne cart_id-FK (je nach cart_management).
3. **Schemas:** frontend_ux, customer_profiles, storefront, ui_config, funnel_analytics, cart_management werden bei Bedarf angelegt.
