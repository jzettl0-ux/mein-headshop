# Admin: Bereiche, Rollen und Teamleiter

Dieses Dokument beschreibt die erweiterbare Struktur für **Admin-Bereiche**, **konfigurierbare Rollen** und **Teamleiter**. Die Grundlage ist umgesetzt; die Verwaltungsoberfläche (Rollen anlegen/entfernen, Bereiche zuweisen, Unterstellung) kann darauf aufgebaut werden.

## Übersicht

- **Bereiche (admin_areas):** z. B. Bestellungen, Produkte, Team, Finanzen, Support, Lager, Einstellungen, Vendoren, Marketing.
- **Rollen (admin_roles):** Jede Rolle hat einen **Bereich** (optional), **Befugnisse** (permissions) und ist optional einer **übergeordneten Rolle** unterstellt (parent_role_id).
- **Mitarbeiter (staff):** Haben weiterhin `roles` (Array von Rollen-Slugs). Zusätzlich optional:
  - **reports_to_id** – Vorgesetzte/r (z. B. Teamleiter).
  - **lead_for_area_id** – Diese Person ist Teamleiter für genau einen Bereich.

So können später z. B. „Teamleiter Bestellungen“ oder „Teamleiter Support“ angelegt werden, und jede Rolle kann einem Bereich zugeordnet und jemandem unterstellt werden.

## Datenbank

### Tabellen (Migration: `migration-admin-areas-and-roles.sql`)

| Tabelle        | Zweck |
|----------------|--------|
| **admin_areas** | Bereiche (slug, name, description, sort_order). |
| **admin_roles** | Rollen: slug, name, description, **area_id**, **parent_role_id**, **permissions** (text[]), **is_system** (nicht löschbar), sort_order. |
| **staff** (Erweiterung) | Optionale Spalten **reports_to_id** (FK staff), **lead_for_area_id** (FK admin_areas). |

### System-Rollen (Seed)

- **owner** – Inhaber, kein Bereich, keine Unterstellung, Berechtigung `*`.
- **chef** – Stellvertreter, unterstellt owner.
- **admin** – Shop-Admin, unterstellt chef.
- **hr** – Personal / Einstellung: Mitarbeiter einladen, anlegen und verwalten; darf keine Rollen Owner/Chef vergeben; Inhaber-Konto nicht änderbar. Bereich Team, unterstellt chef.
- **team_leader** – Teamleiter für einen Bereich (z. B. Bestellungen, Support); Bestellungen + Kundenservice; unterstellt chef.
- **warehouse_lead** – Lagerleitung: Lager, Bestellungen, Versand; unterstellt chef.
- **marketing** – Nur Marketing (Rabattcodes, Newsletter, Werbung); unterstellt chef.
- **product_care** – Bereich Produkte, unterstellt (optional) chef/admin.
- **support** – Bereich Bestellungen/Support, unterstellt chef.
- **employee** – Bereich Bestellungen, unterstellt support.

Alle haben `is_system = true` und dürfen nicht gelöscht werden.

### Benutzerdefinierte Rollen (später)

- Neue Zeilen in **admin_roles** mit `is_system = false`.
- **area_id** = Bereich, für den die Rolle zuständig ist (z. B. Teamleiter Bestellungen → area „orders“).
- **parent_role_id** = übergeordnete Rolle (z. B. „Teamleiter Bestellungen“ unterstellt „chef“).
- **permissions** = Array von Strings wie `orders:view`, `orders:edit`, `team:manage` (Semantik in der App definieren).

Damit die neuen Slugs in **staff.roles** erlaubt sind, muss die CHECK-Constraint an **staff** angepasst werden: entweder Constraint entfernen und in der App gegen `admin_roles` validieren, oder eine DB-Constraint nutzen, die erlaubte Slugs aus `admin_roles` liest.

## Code

- **lib/admin-roles-types.ts** – Typen `AdminArea`, `AdminRole`, `SYSTEM_ROLE_SLUGS`.
- **lib/admin-areas-and-roles.ts** – Server-Funktionen: `getAdminAreas()`, `getAdminRoles()`, `getAdminRoleBySlug(slug)`.
- **lib/admin-auth.ts** – `StaffRow` um `reports_to_id` und `lead_for_area_id` erweitert.
- **lib/admin-permissions.ts** – Bleibt vorerst unverändert (Berechtigungslogik weiter über feste Rollen-Slugs). Später kann die Logik auf `admin_roles.permissions` umgestellt werden.

## Spätere UI (Rollen & Teamleiter)

1. **Bereiche verwalten** (nur Owner)
   - Liste `admin_areas`, CRUD (Anzeigename, Slug, Reihenfolge).

2. **Rollen verwalten** (nur Owner)
   - Liste `admin_roles` mit Bereich, Unterstellung, Befugnisse.
   - Neue Rolle anlegen: Name, Slug, Bereich (Dropdown aus admin_areas), unterstellt (Dropdown aus admin_roles), Befugnisse (Multi-Select oder Tags), is_system bleibt false.
   - Rolle bearbeiten/löschen (nur wenn `is_system = false` und keine Mitarbeiter haben diese Rolle).

3. **Mitarbeiter: Teamleiter & Unterstellung**
   - Beim Bearbeiten eines Mitarbeiters: optional **Vorgesetzte/r** (Dropdown staff) und **Teamleiter für Bereich** (Dropdown admin_areas, max. einer).
   - In der Mitarbeiter-Liste anzeigen: „Teamleiter Bestellungen“, „unterstellt [Name]“.

4. **Navigation**
   - Sichtbare Menüpunkte weiterhin aus `lib/admin-permissions.ts` (canAccessOrders, canAccessProducts, …). Optional: Bereiche aus `admin_areas` laden und nur Bereiche anzeigen, für die der Nutzer mindestens eine Rolle mit passender Berechtigung hat.

## Zusammenfassung

- **Bereiche** und **Rollen** sind in der DB abgebildet, inkl. Unterstellung und Bereichszuordnung.
- **Teamleiter** sind abbildbar über `staff.lead_for_area_id` (und ggf. eine Rolle „team_leader_orders“ in admin_roles mit area_id = orders).
- Rollen anlegen/entfernen und „wem unterstellt“ / „welche Befugnisse“ ist datenseitig vorbereitet; die Verwaltungsoberfläche kann schrittweise ergänzt werden.
