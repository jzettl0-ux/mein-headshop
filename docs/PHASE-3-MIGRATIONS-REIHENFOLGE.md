# Phase 3: Mollie Split & Order Splitting – Migrations-Reihenfolge

**Abhängigkeiten:** Phase 0 (Schema, Vendors, Orders).

---

## Migrations (Reihenfolge)

| # | Datei | Inhalt |
|---|--------|--------|
| 1 | `supabase/migration-fulfillment-order-lines.sql` | Schema `fulfillment`, Tabelle `order_lines` (Vendor-Zuordnung pro Zeile), Anbindung an `order_items` |
| 2 | `supabase/migration-mollie-split-vendors.sql` | `vendor_accounts.mollie_organization_id`, Tabelle `financials.order_payment_splits` |

---

## Phase-3-Checkliste

- [ ] 1. `migration-fulfillment-order-lines.sql`
- [ ] 2. `migration-mollie-split-vendors.sql`

---

## APIs/UI

| Komponente | Status | Beschreibung |
|------------|--------|--------------|
| Split-Payment-Checkout | ✅ | Checkout mit Aufteilung Shop/Vendor, `/split/[token]`, `lib/calculate-payment-splits.ts` |
| Mollie Connect (Vendor-Organisationen) | Optional | OAuth-Flow, damit Vendoren ihre Mollie-Organisation anbinden (`mollie_organization_id`); für reine Shop-Bestellungen nicht zwingend |

**Phase 3 abgeschlossen**, wenn beide Migrations fehlerfrei gelaufen sind.

**Hinweis:** `fulfillment.order_lines` wird u.a. von Phase 1 (vendor_performance_aggregation) und vom Checkout genutzt. Wenn du Phase 1 vor Phase 3 ausgeführt hast, muss `migration-fulfillment-order-lines.sql` nachgezogen werden, damit die Funktion `refresh_vendor_performance_metrics()` keine Fehler wirft. Mollie Connect kann später ergänzt werden, wenn Vendor-Split-Payments live genutzt werden sollen.
