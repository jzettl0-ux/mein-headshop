# Blueprint- und Farben-Vorgaben

## 1. Blueprints: Genau so umsetzen

Alle Blueprints, die für dieses Projekt vorgegeben werden, sind **genau so** umzusetzen:

- **Tabellen & Spalten:** Wie im Blueprint (Schema-Namen, Spaltennamen, Datentypen, Constraints).
- **Referenzen:** Nur dort anpassen, wo die Projekt-Basis abweicht (z. B. `vendors.accounts` → `vendor_accounts(id)`, `fulfillment.orders` → `orders(id)`).
- **GENERATED-Spalten:** Wenn der Blueprint eine GENERATED-Spalte vorsieht und PostgreSQL sie ablehnt (z. B. „not immutable“), nur dann durch Trigger/Spalte ersetzen – und im Code/Doku vermerken.
- **Bedingte Tabellen:** Nur wenn der Blueprint optionale Abhängigkeiten nennt (z. B. „nur wenn catalog existiert“), sonst Tabellen immer anlegen, sofern die referenzierten Objekte existieren.

**Bereits 1:1 umgesetzt:** Blueprint TEIL 20 & 21 (Micro-Logistics, Catalog Automation, Visual Merchandising) in `migration-blueprint-teil-20-21-micro-logistics-visual-merchandising.sql`.

---

## 2. Farben: Zuletzt gegebene beibehalten

Die **Farben**, die zuletzt vorgegeben wurden, bleiben unverändert:

- **Nicht ändern:** `app/globals.css` und alle Theme-/Farb-Definitionen (z. B. `--luxe-*`, `--chill-*`, `.theme-chillmart`, `.theme-light`, Admin-Bereich Gold/Sage).
- Bei neuen UI-Komponenten oder Seiten die **bestehenden** CSS-Variablen und Utility-Klassen (z. B. `luxe-primary`, `luxe-gold`, `chill-green`) verwenden – keine neuen Farbwerte einführen, die die bestehende Palette ersetzen.

Damit gilt: **Blueprints exakt umsetzen, Farben/Theme nicht anpassen.**
