# Phase 7: Financials & Infrastructure – Migrations-Reihenfolge

**Abhängigkeiten:** Phase 0, 1

---

## Migrations

| # | Datei | Inhalt |
|---|--------|--------|
| 1 | `supabase/migration-blueprint-financials-infra.sql` | Blended Shipping, FBT, weitere Financial/Infra-Strukturen |

---

## Phase-7-Checkliste

- [ ] 1. `migration-blueprint-financials-infra.sql`

---

## APIs/UI (bereits umgesetzt ✅)

- [x] Blended Shipping: `lib/blended-shipping.ts`, Admin `/admin/blended-shipping`, API `/api/admin/blended-shipping`
- [x] FBT: `GET /api/products/[id]/frequently-bought-together`
- [x] Cron: `refresh-fbt`, `refresh-vendor-metrics` (Vercel Cron)

**Phase 7 abgeschlossen**, wenn die Migration fehlerfrei gelaufen ist.

---

## Nächste Schritte (manuell)

1. **Supabase SQL Editor:** `supabase/migration-blueprint-financials-infra.sql` ausführen.
2. **Bedingte Tabellen:** Die Migration läuft auch ohne Fulfillment/Advertising:
   - **account_reserves** wird nur erstellt, wenn `fulfillment.order_lines` existiert.
   - **campaign_schedules** wird nur erstellt, wenn `advertising.campaigns` existiert.
   - Alle übrigen Tabellen (blended_shipping_rules, percolate_rules, external_prices, epr_registrations, frequently_bought_together, smart_order_routing_logs) werden immer angelegt.
3. **Cron:** `refresh-fbt` und `refresh-vendor-metrics` sind in `vercel.json` eingetragen; nach der Migration füllt der FBT-Cron die Tabelle `infrastructure.frequently_bought_together`.
