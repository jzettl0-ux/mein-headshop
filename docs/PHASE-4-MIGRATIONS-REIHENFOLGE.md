# Phase 4: Gamification (Vault, Loyalty, Drop-Radar) – Migrations-Reihenfolge

**Abhängigkeiten:** Phase 0, Phase 1 (Category Gating optional für gated-categories-min-loyalty-tier).

---

## Migrations (Reihenfolge)

| # | Datei | Inhalt |
|---|--------|--------|
| 1 | `supabase/migration-blueprint-gamification.sql` | Loyalty-Tiers, Vault Drops, Drop-Radar, Price Lock, gated categories |
| 2 | `supabase/migration-gamification-gated-category-ext.sql` | *(optional)* Erweiterung Gated Categories |
| 3 | `supabase/migration-gated-categories-min-loyalty-tier.sql` | Mindest-Loyalty-Tier pro gated category |

---

## Phase-4-Checkliste

- [ ] 1. `migration-blueprint-gamification.sql`
- [ ] 2. `migration-gamification-gated-category-ext.sql` *(optional)*
- [ ] 3. `migration-gated-categories-min-loyalty-tier.sql`

---

## APIs/UI (bereits umgesetzt ✅)

- [x] `GET /api/vault-drops`, `POST /api/drop-radar/subscribe`, `POST /api/price-lock`, `GET /api/price-lock/[token]`
- [x] Gamified Cart (Loyalty-Fortschritt), Secret Shop (Admin + Shop-Filter)
- [x] Cron: `notify-drop-radar`

**Phase 4 abgeschlossen**, wenn die Migrations (mind. 1 und 3) fehlerfrei gelaufen sind.

---

## Nächste Schritte (manuell)

1. **Supabase SQL Editor** öffnen und nacheinander ausführen:
   - `supabase/migration-blueprint-gamification.sql` (Pflicht)  
     *Hinweis:* Enthält Referenz auf `discount_codes(id)`. Falls die Tabelle fehlt, zuerst `migration-rabatte-bestseller.sql` ausführen oder die Zeilen zu `user_clipped_vouchers` ggf. auskommentieren.
   - `supabase/migration-gamification-gated-category-ext.sql` (optional)
   - `supabase/migration-gated-categories-min-loyalty-tier.sql` (Pflicht für Secret Shop; setzt `admin.gated_categories` voraus, z. B. aus Phase 1.)
2. **Cron** ist bereits in `vercel.json` eingetragen: `refresh-vault-drops` (alle 15 Min), `notify-drop-radar` (alle 30 Min). Nach Migration laufen die Jobs automatisch.
