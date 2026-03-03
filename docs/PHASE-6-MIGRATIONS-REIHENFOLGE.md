# Phase 6: Enforcement (RFS, ASIN Locks) – Migrations-Reihenfolge

**Abhängigkeiten:** Phase 1 (ASIN)

---

## Migrations

| # | Datei | Inhalt |
|---|--------|--------|
| 1 | `supabase/migration-blueprint-enforcement.sql` | Return/Refund-Inspection, ASIN-Locks, ggf. weitere Enforcement-Tabellen |

---

## Phase-6-Checkliste

- [ ] 1. `migration-blueprint-enforcement.sql`

---

## APIs/UI (bereits umgesetzt ✅)

- [x] Admin: Return Inspections (`/admin/operations/return-inspections`, `GET /api/admin/return-inspections`)
- [x] Cron: `refresh-asin-locks`

**Phase 6 abgeschlossen**, wenn die Migration fehlerfrei gelaufen ist.

---

## Nächste Schritte (manuell)

1. **Supabase SQL Editor:** `supabase/migration-blueprint-enforcement.sql` ausführen.
2. **Abhängigkeit:** Die Migration läuft auch ohne `fulfillment.returns`: `enforcement.asin_locks` wird immer angelegt. Die Tabelle `enforcement.return_inspections_ext` wird nur erstellt, wenn `fulfillment.returns` existiert – sonst wird dieser Teil übersprungen.
3. **ASIN-Locks:** Nach der Migration füllt der Cron `GET /api/cron/refresh-asin-locks?secret=CRON_SECRET` (oder der Button „Jetzt aktualisieren“ unter `/admin/asin-locks`) die Tabelle `enforcement.asin_locks`.
