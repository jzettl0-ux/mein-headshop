# Phase 14: Grants & Berechtigungen – Migrations-Reihenfolge

**Abhängigkeiten:** Phasen 0–13 (Grants setzen Berechtigungen auf bereits angelegte Schemas/Tabellen).

---

## Migrations (Reihenfolge)

| # | Datei | Inhalt |
|---|--------|--------|
| 1 | `migration-blueprint-grants.sql` | USAGE + CRUD für gamification, community, checkout, enforcement, advanced_financials, catalog_defense, infrastructure, deep_tech |
| 2 | `migration-transparency-grants.sql` | Berechtigungen für security.transparency_brands (Project Zero) |
| 3 | `migration-eco-recalls-safet-grants.sql` | Eco/Recalls/SaFET-Schemas |
| 4 | `migration-b2b-guided-buying-grants.sql` | B2B Guided Buying |
| 5 | `migration-cx-grants.sql` | cx (subscriptions, a_to_z_claims, vine_products, vine_invitations) |
| 6 | `migration-mcf-grants.sql` | MCF (Multi-Channel Fulfillment) |
| 7 | `migration-inventory-health-grants.sql` | Inventory Health |
| 8 | `migration-repricer-grants.sql` | Repricer-Schema |

**Hinweis:** Jede Grant-Migration setzt Rechte auf konkrete Schemas/Tabellen. Wenn ein Schema noch nicht existiert (z. B. weil die zugehörige Blueprint-Migration nicht ausgeführt wurde), kann der entsprechende GRANT fehlschlagen – dann diese Zeile überspringen oder die Schema-Migration zuerst ausführen. `migration-blueprint-grants.sql` deckt die meisten Blueprint-Schemas (Phase 4–8) ab.

---

## Phase-14-Checkliste

- [ ] 1. `migration-blueprint-grants.sql`
- [ ] 2. `migration-transparency-grants.sql`
- [ ] 3. `migration-eco-recalls-safet-grants.sql`
- [ ] 4. `migration-b2b-guided-buying-grants.sql`
- [ ] 5. `migration-cx-grants.sql`
- [ ] 6. `migration-mcf-grants.sql`
- [ ] 7. `migration-inventory-health-grants.sql`
- [ ] 8. `migration-repricer-grants.sql`

---

## APIs/UI

- Keine – nur DB-Grants (service_role, ggf. anon/authenticated) für Backend-APIs.

**Phase 14 abgeschlossen**, wenn die benötigten Grant-Migrations fehlerfrei gelaufen sind (optional: nur die zu genutzten Schemas passenden ausführen).

---

## Nächste Schritte (manuell)

1. **Supabase SQL Editor** – die Grant-Migrations nacheinander ausführen (siehe Tabelle).
2. **Optional:** Nur die Migrations ausführen, deren Schemas bereits existieren. Bei Fehlern „schema xy does not exist“ die Migration anpassen oder überspringen und nachziehen, sobald das Schema angelegt ist.
3. **Danach:** Phase 15 (Go-Live) – Cron prüfen, Production-Checklist abarbeiten.
