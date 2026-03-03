# GoBD – Revisionssicherheit (Audit-Logs)

In Deutschland sind die **Grundsätze zur ordnungsmäßigen Führung und Aufbewahrung von Büchern, Aufzeichnungen und Unterlagen in elektronischer Form sowie zum Datenzugriff (GoBD)** zu beachten. Jede Änderung im Backend – von Preisänderungen über Bestellstatus bis zu Kunden- oder Mitarbeiterdaten – muss **manipulationssicher und lückenlos** in Audit-Logs protokolliert werden.

## Anforderungen

- **Lückenlose Protokollierung**: Jede relevante Änderung (Preise, Bestände, Steuersätze, Finanz-Parameter, Bestellstatus, Mitarbeiter) wird mit Zeitstempel, Akteur (E-Mail/ID), Entität und alt/neu-Werten erfasst.
- **Manipulationssicherheit**: Nach dem Schreiben dürfen Einträge weder geändert noch gelöscht werden (append-only). So bleibt die Nachvollziehbarkeit erhalten.
- **Aufbewahrungsfristen**: GoBD verlangt Aufbewahrung in der Regel 10 Jahre; die technische Aufbewahrung (Backups, Retention) ist betrieblich zu regeln.

## Umsetzung im Projekt

- **Tabelle `audit_logs`** (Migration `migration-audit-logs.sql`): Felder u. a. `entity_type`, `entity_id`, `action`, `field_name`, `old_value`, `new_value`, `changed_by_email`, `changed_by_id`, `created_at`.
- **Append-Only**: Migration `migration-audit-logs-gobd-append-only.sql` legt einen Trigger an, der **UPDATE** und **DELETE** auf `audit_logs` verweigert (Exception). Nur **INSERT** ist erlaubt.
- **`lib/audit-log.ts`**:
  - `writeAuditLog`: einzelner Eintrag (z. B. bei Löschung).
  - `logEntityChanges`: vergleicht alt/neu für konfigurierte Felder pro Entitätstyp und schreibt je geändertes Feld einen Eintrag.
- **Entitätstypen**: `product`, `finance_settings`, `order`, `staff`, `customer` (weitere bei Bedarf ergänzbar).
- **Wo wird geloggt?**
  - Produktänderungen (PATCH `/api/admin/products/[id]`)
  - Finanz-Parameter (Settings Finanzen)
  - Bestellstatus (PATCH `/api/admin/orders/[id]`)
  - Mitarbeiter (PATCH/DELETE `/api/admin/staff/[id]`)

## Zugriff auf das Audit-Log

- **Nur Owner**: Die Route `/api/admin/audit-logs` und die Seite „Audit-Log“ im Admin sind nur für die Rolle **Owner** zugänglich (kein Support, kein Admin ohne Owner-Rolle). So bleibt die Nachvollziehbarkeit auf Inhaber-Ebene kontrolliert.

## Checkliste

- [ ] Migration `migration-audit-logs.sql` und `migration-audit-logs-gobd-append-only.sql` in allen Umgebungen (Dev, Staging, Prod) ausgeführt.
- [ ] Bei neuen Änderungs-Endpunkten: Audit-Aufruf ergänzen (`logEntityChanges` oder `writeAuditLog`).
- [ ] Backups und Aufbewahrungsfristen für die Datenbank (inkl. `audit_logs`) betrieblich festgelegt.
