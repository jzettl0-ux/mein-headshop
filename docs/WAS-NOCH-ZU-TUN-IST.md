# Was noch zu tun ist

Kurzüberblick über offene Punkte (Stand nach Blueprint Phasen 16–21 und Editorials-CRUD).

---

## Vor Go-Live (Pflicht)

| Aufgabe | Wo |
|--------|-----|
| **Migrations in Supabase ausführen** | SQL-Editor: Reihenfolge siehe [BLUEPRINT-PHASEN-PLAN.md](./BLUEPRINT-PHASEN-PLAN.md) (Komplette Migrations-Reihenfolge). Die `[ ]` in den PHASE-X-MIGRATIONS-REIHENFOLGE.md sind deine Checkliste beim Abarbeiten. |
| **Mollie Live-Key** | `.env` / Vercel: `MOLLIE_API_KEY` (Live, nicht Test). |
| **E-Mail-Domain (Resend) verifiziert** | Resend Dashboard; `RESEND_API_KEY` gesetzt. |
| **Rechtliches mit echten Daten** | Impressum, AGB, Datenschutz – Platzhalter durch echte Texte ersetzen; rechtlich prüfen lassen. |
| **Storage-Buckets** | Supabase Dashboard: z. B. `product-images`, `ugc-images` (Rate-my-Setup); Policies siehe [SUPABASE-STORAGE.md](./SUPABASE-STORAGE.md). |
| **Build erfolgreich** | `npm run build` lokal bzw. im CI; Fehler beheben. |

Details: [PRODUCTION-CHECKLIST.md](../PRODUCTION-CHECKLIST.md), [BLUEPRINT-PHASEN-PLAN.md](./BLUEPRINT-PHASEN-PLAN.md) (Phase 15).

---

## Manuell / Betrieb

| Aufgabe | Hinweis |
|--------|--------|
| **Bucket `ugc-images`** | Für Rate-my-Setup Fotos; Anleitung in [PHASE-5-MIGRATIONS-REIHENFOLGE.md](./PHASE-5-MIGRATIONS-REIHENFOLGE.md) und [SUPABASE-STORAGE.md](./SUPABASE-STORAGE.md). |
| **Cron-Jobs einrichten** | z. B. cron-job.org oder Vercel Cron: `refresh-fbt`, `refresh-asin-locks`, `refresh-vault-drops`, `notify-drop-radar`, `refresh-vendor-metrics`, `check-tracking`, `auto-cancel-unpaid` – siehe Phasen-Plan Phase 15. |
| **Phase-14-Grants** | Nach allen gewünschten Migrations: `migration-blueprint-grants.sql` und ggf. weitere Grant-Dateien ausführen. |

---

## Optional / Erweiterungen

| Thema | Doc |
|-------|-----|
| **Vendor-Portal** | Mehrere Benutzer pro Vendor, Angebote selbst bearbeiten, E-Mail bei Bestellungen, Mollie Connect – [VENDOR-PORTAL-SPEC.md](./VENDOR-PORTAL-SPEC.md). |
| **Barrierefreiheit (BFSG)** | Kontraste, Tastatur, Screenreader, Formulare – [BFSG-BARRIEREFREIHEIT.md](./BFSG-BARRIEREFREIHEIT.md). |
| **GOBD / Revisionssicherheit** | Audit-Logs-Migration, Backups, Aufbewahrung – [GOBD-REVISIONSSICHERHEIT.md](./GOBD-REVISIONSSICHERHEIT.md). |
| **Multi-Umgebung** | Dev/Staging/Prod, Keys, Deploy – [MULTI-ENVIRONMENT.md](./MULTI-ENVIRONMENT.md). |
| **Widerrufsbelehrung** | Eigene Seite oder Abschnitt; in Production-Checklist erwähnt. |

---

## Code/Blueprint – aktuell erledigt

- Blueprint Phasen 1–21: Migrations beschrieben, APIs/Admin für TEIL 10–21 umgesetzt (inkl. TEIL 16 Editorials & Hotspots CRUD).
- Shop-Seitenleiste und Admin-Seitenleiste: Menü eigenständig scrollbar.
- Keine offenen Code-TODOs, die für den Betrieb zwingend wären.

Wenn du etwas Bestimmtes (z. B. nur Go-Live, nur Cron, nur Rechtliches) priorisieren willst, kann die Liste darauf eingegrenzt werden.
