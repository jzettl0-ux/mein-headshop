# Multi-Environment-Strategie (Dev, Staging, Produktion)

Ein Profi-Shop arbeitet mit einer **getrennten Systemlandschaft**. Änderungen werden **niemals zuerst direkt am Live-System** vorgenommen.

## Umgebungen

| Umgebung   | Zweck |
|-----------|--------|
| **Development (Dev)** | Lokale oder geteilte Entwicklung; Datenbank und Dienste getrennt von Live. |
| **Staging**          | Test unter Live-Bedingungen (gleiche Konfiguration wie Produktion, aber Testdaten). Freigabe-Tests, QA, Abnahme. |
| **Produktion (Prod)** | Live-Shop; nur freigegebene und auf Staging getestete Änderungen. |

## Grundsätze

- **Keine direkten Änderungen in Produktion**: Schema-Änderungen, neue Features und Konfigurationen werden zuerst in Dev/Staging erprobt und erst nach Freigabe in Prod ausgerollt.
- **Getrennte Datenbanken**: Jede Umgebung hat eine eigene Supabase-Instanz (oder Projekt) bzw. eigene DB. Keine gemeinsame Datenbank zwischen Staging und Prod.
- **Getrennte Secrets**: `.env` bzw. Umgebungsvariablen pro Umgebung (z. B. `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, Mollie, E-Mail) – keine Prod-Keys in Dev/Staging verwenden.
- **Deploy-Pfad**: Typischer Ablauf: Merge in Main → Build → Deploy auf Staging → Tests → Freigabe → Deploy auf Produktion (manuell oder per Pipeline).

## Technische Hinweise

- **NODE_ENV**: `development` / `staging` / `production` – kann genutzt werden, um z. B. Debug-Ausgaben oder strengere Prüfungen nur in Non-Prod zu aktivieren.
- **Destruktive Aktionen**: Besonders kritische Aktionen (z. B. Massenlöschung, Schema-Migrationen) sollten in der Anwendung oder im Prozess so gesteuert werden, dass sie in Produktion nur mit expliziter Bestätigung oder nur aus Staging/CI ausgeführt werden.
- **Migrations**: Supabase-Migrationen zuerst in Dev/Staging anwenden und testen, danach in Prod.

## Checkliste

- [ ] Supabase-Projekte getrennt: Dev, Staging, Prod.
- [ ] Umgebungsvariablen pro Umgebung gesetzt; Prod-Keys nicht in Repos oder Staging.
- [ ] Deploy-Prozess definiert: Staging vor Prod; keine direkten Hotfixes nur in Prod ohne Staging-Test (außer Notfall).
- [ ] Dokumentation und Zugang zu den Umgebungen nur für berechtigte Personen (RBAC/Zero-Trust).
