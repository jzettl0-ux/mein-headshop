# Phase 5: Community & Split Payment – Migrations-Reihenfolge

**Abhängigkeiten:** Phase 0

---

## Migrations

| # | Datei | Inhalt |
|---|--------|--------|
| 1 | `supabase/migration-blueprint-community-split.sql` | UGC (Rate my Setup), Split-Payment-Struktur, ggf. weitere Community-Tabellen |

---

## Phase-5-Checkliste

- [ ] 1. `migration-blueprint-community-split.sql`

---

## APIs/UI (bereits umgesetzt ✅)

- [x] UGC: `/rate-my-setup`, `/admin/ugc`
- [x] Split Payment: `/split/[token]`, APIs

## Manuell nach Migration

- [ ] **Storage:** Bucket `ugc-images` im Supabase Dashboard anlegen (für Rate-my-Setup Fotos). Anleitung: siehe [SUPABASE-STORAGE.md](../SUPABASE-STORAGE.md) (Abschnitt „ugc-images“).

**Phase 5 abgeschlossen**, wenn die Migration fehlerfrei gelaufen ist und der Bucket `ugc-images` existiert.
