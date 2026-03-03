# Phase 2: DHL & Logistik – Migrations-Reihenfolge

Führe die Migrations **in dieser Reihenfolge** im Supabase SQL Editor aus (falls noch nicht in Phase 1 erledigt).

---

## Voraussetzungen

- **Phase 0** (schema, product-categories, vendors-kyb, fulfillment-order-lines)
- **Phase 1** – Schritt 5b: `migration-order-shipments.sql` (Tabelle `order_shipments`) ist bereits in Phase 1 enthalten. Falls du Phase 1 vollständig ausgeführt hast, ist Schritt 1 unten bereits erledigt.

---

## Phase 2 – Migrations (Reihenfolge)

| # | Datei | Inhalt |
|---|--------|--------|
| 1 | `supabase/migration-order-shipments.sql` | Tabelle `order_shipments` (tracking_number, tracking_carrier, RLS) – **bereits in Phase 1 als Schritt 5b** |
| 2 | `supabase/migration-order-shipments-label-url.sql` | Spalten `label_url`, `return_label_url`, `shipped_at` |
| 3 | `supabase/migration-order-shipments-delivered-at.sql` | Spalte `delivered_at` (für Tracking-Sync/Cron) |

---

## Phase-2-Checkliste

- [ ] 1. `migration-order-shipments.sql` *(falls noch nicht in Phase 1 ausgeführt)*
- [ ] 2. `migration-order-shipments-label-url.sql`
- [ ] 3. `migration-order-shipments-delivered-at.sql`

---

## APIs/UI (bereits umgesetzt ✅)

| Komponente | Status | Beschreibung |
|------------|--------|--------------|
| DHL GKP API (OAuth, Labels) | ✅ | `lib/dhl-parcel.ts` – Token-Caching, Label-Generierung, VisualCheckOfAge bei 18+ |
| Admin: Versand-Label-Button | ✅ | Admin → Bestellung → „DHL/ GLS Label erstellen“, Label-PDF, Tracking-Link |
| Tracking-Sync (delivered_at) | ✅ | Cron `/api/cron/check-tracking` – setzt `delivered_at` bei DHL-Zustellung |

**Dokumentation:** [DHL-API-SETUP.md](./DHL-API-SETUP.md)

**Phase 2 abgeschlossen**, wenn die 3 Migrations (bzw. 2 und 3, wenn 1 schon in Phase 1 lief) fehlerfrei durchgelaufen sind.
