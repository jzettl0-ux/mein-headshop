# Phase 13: CX, PPC, Vine – Migrations-Reihenfolge

**Abhängigkeiten:** Phase 0. Optional für A2Z: fulfillment.order_lines (sonst Standalone-Migration nutzen).

---

## Migrations (Reihenfolge)

| # | Datei | Inhalt |
|---|--------|--------|
| 1 | `migration-product-reviews-verified-purchase.sql` | Verified-Purchase-Flag für Bewertungen |
| 2 | `migration-cx-schema.sql` | cx.subscriptions (Subscribe & Save), cx.a_to_z_claims (A-bis-z-Garantie) |
| 3 | `migration-vine-program.sql` | Vine-Einladungen, Produkt-Verknüpfung |
| 4 | `migration-advertising-schema.sql` | advertising.campaigns, targets, ad_events (PPC) |
| 5 | `migration-advertising-vendor-optional.sql` | vendor_id NULL für Plattform-Kampagnen |
| 6a | `migration-cx-a2z-sla-ext.sql` | A2Z 48h-SLA-Spalten + order_line_id (nur wenn **fulfillment.order_lines** existiert) |
| 6b | `migration-cx-a2z-sla-ext-standalone.sql` | A2Z 48h-SLA-Spalten **ohne** order_line_id (wenn kein Fulfillment-Schema) |

**Schritt 6:** Entweder 6a **oder** 6b ausführen – 6a nur bei vorhandener Tabelle `fulfillment.order_lines`, sonst 6b.

---

## Phase-13-Checkliste

- [ ] 1. `migration-product-reviews-verified-purchase.sql`
- [ ] 2. `migration-cx-schema.sql`
- [ ] 3. `migration-vine-program.sql`
- [ ] 4. `migration-advertising-schema.sql`
- [ ] 5. `migration-advertising-vendor-optional.sql`
- [ ] 6. `migration-cx-a2z-sla-ext.sql` **oder** `migration-cx-a2z-sla-ext-standalone.sql`

---

## APIs/UI (bereits umgesetzt ✅)

- [x] A2Z Claims: `/admin/a-to-z`, `GET/PATCH /api/admin/a-to-z-claims`
- [x] Subscriptions: `GET/POST /api/account/subscriptions`, Admin `/admin/subscriptions`
- [x] Vine: `/admin/vine`, `GET/POST /api/admin/vine/products`, `GET/POST /api/admin/vine/invitations`
- [x] PPC: `/admin/advertising`, Kampagnen CRUD, Targets

**Phase 13 abgeschlossen**, wenn alle Migrations fehlerfrei gelaufen sind.

---

## Nächste Schritte (manuell)

1. **Supabase SQL Editor** – die 6 Schritte nacheinander ausführen (siehe Tabelle oben).
2. **A2Z SLA:** Wenn `fulfillment.order_lines` **nicht** existiert: Schritt 6 mit `migration-cx-a2z-sla-ext-standalone.sql` ausführen. Andernfalls `migration-cx-a2z-sla-ext.sql` (enthält zusätzlich order_line_id).
3. **Hinweis:** Falls bei Schritt 6 ein Fehler „generation expression is not immutable“ auftritt (GENERATED-Spalte vendor_sla_deadline), die A2Z-SLA-Migration ggf. anpassen (Trigger statt GENERATED) oder vorerst weglassen – A2Z funktioniert auch ohne die SLA-Spalten.
