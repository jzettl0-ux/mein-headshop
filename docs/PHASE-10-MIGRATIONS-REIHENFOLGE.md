# Phase 10: Blueprint Teil 11 – Power User – Migrations-Reihenfolge

**Abhängigkeiten:** Phase 0, 1 (optional für Project Zero: security.transparency_brands, vendor_offers)

---

## Migrations

| # | Datei | Inhalt |
|---|--------|--------|
| 1 | `supabase/migration-blueprint-teil-11-power-user.sql` | Project Zero (bedingt), NCX-Scores, Widget-Deployments, Off-Platform-Orders, Search Frequency Rank |
| 2 | `supabase/migration-search-clicks-click-share.sql` | advanced_analytics.search_clicks für Click-Share / Brand Analytics |

---

## Phase-10-Checkliste

- [ ] 1. `migration-blueprint-teil-11-power-user.sql`
- [ ] 2. `migration-search-clicks-click-share.sql`

---

## APIs/UI (bereits umgesetzt ✅)

- [x] Project Zero: `/admin/compliance/project-zero`, `GET /api/admin/project-zero-takedowns`
- [x] NCX-Score: `/admin/analytics/ncx`, `GET /api/admin/ncx-scores`, Cron `refresh-ncx-scores`
- [x] Widget-Deployments: `/admin/integrations/widgets`, `GET /api/admin/widget-deployments`
- [x] Search Frequency Rank: `/admin/analytics/search-frequency-rank`, Cron `refresh-search-frequency-rank`
- [x] Widget-Snippet, Off-Platform-Checkout, Click Share: `POST /api/analytics/record-search-click`

**Phase 10 abgeschlossen**, wenn beide Migrations fehlerfrei gelaufen sind.

---

## Nächste Schritte (manuell)

1. **Supabase SQL Editor** – nacheinander ausführen:
   - `supabase/migration-blueprint-teil-11-power-user.sql` (erstellt u. a. Schemas advanced_analytics, brand_tools, external_commerce)
   - `supabase/migration-search-clicks-click-share.sql` (nutzt Schema advanced_analytics)
2. **Bedingte Tabellen:** Project-Zero-Tabellen (brand_tools.project_zero_takedowns, project_zero_accuracy) werden nur angelegt, wenn `security.transparency_brands` und `vendor_offers` existieren. NCX, Widgets, Off-Platform-Orders und Search Frequency Rank werden immer angelegt.
3. **Cron:** `refresh-ncx-scores` und `refresh-search-frequency-rank` sind in vercel.json eingetragen.
