# Phase 8: Deep Tech – Migrations-Reihenfolge

**Abhängigkeiten:** Phase 0

---

## Migrations

| # | Datei | Inhalt |
|---|--------|--------|
| 1 | `supabase/migration-blueprint-deep-tech.sql` | Catalog Duplicates, Risk Evaluations, Payout Batches, optional Live-Streams, Bin-Packing |

---

## Phase-8-Checkliste

- [ ] 1. `migration-blueprint-deep-tech.sql`

---

## APIs/UI (bereits umgesetzt ✅)

- [x] Admin: Catalog Duplicates (`/admin/operations/catalog-duplicates`)
- [x] Admin: Risk Evaluations (`/admin/operations/risk-evaluations`)
- [x] Admin: Payout Batches (`/admin/operations/payout-batches`)
- [x] Optional: Live-Streams (`/admin/operations/live-streams`), Bin-Packing (`/admin/operations/bin-packing`)

**Phase 8 abgeschlossen**, wenn die Migration fehlerfrei gelaufen ist.

---

## Nächste Schritte (manuell)

1. **Supabase SQL Editor:** `supabase/migration-blueprint-deep-tech.sql` ausführen.
2. **Abhängigkeiten:** Nur Standard-Tabellen (products, orders, auth.users, vendor_accounts) – keine optionalen Schemas nötig.
3. **Inhalt:** Schema `deep_tech` mit catalog_duplicates, risk_evaluations, payout_batches, live_streams, live_stream_products, standard_boxes, order_packaging_plans. Danach stehen die Admin-Seiten Catalog Duplicates, Risk Evaluations, Payout Batches, Live-Streams und Bin-Packing bereit.
