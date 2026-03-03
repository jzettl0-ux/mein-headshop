# Blueprint Teil 2 & 3: Konsolidierte Advanced Marketplace Extensions & B2B Governance

Dieses Dokument vereint alle Erweiterungen aus Blueprint Teil 2 (Advanced Marketplace Extensions) und Teil 3 (Advanced Operations & B2B Governance) in einer übersichtlichen Spezifikation.

---

## Teil A: Advanced Marketplace Extensions

### 1. Re-Commerce: Trade-In & "Renewed" Programm

**Ziel:** Sekundärmarkt für gebrauchte Premium-Geräte (Vaporizer, Rosin-Pressen).

#### 1.1 Feature-Spezifikation
- **Trade-In Workflow:** Kunden wählen gekaufte Produkte, beantworten 3–4 Zustandsfragen, System berechnet sofortigen Trade-In-Wert.
- **Store Credit:** Guthaben wird als Plattform-Guthaben gutgeschrieben (nicht auf Bankkonto).
- **Refurbished ASINs:** Geräte werden als Child-ASIN mit Condition RENEWED wieder eingepflegt.

#### 1.2 Tabellen
- `recommerce.trade_in_requests`
- `recommerce.store_credit_wallets`

---

### 2. Seller Inventory Health & Restock Engine

**Ziel:** Analysetool für Vendoren – wann nachbestellen?

#### 2.1 Feature-Spezifikation
- **Safety Stock & Reorder Point:** Formelbasiert aus Verkaufsdaten (30/60/90 Tage).
- **Automatische Warn-E-Mails:** "ASIN erreicht in 5 Tagen kritischen Bestand."

#### 2.2 Tabellen
- `analytics.inventory_health`

---

### 3. Automatisierte Preisanpassung (Repricer)

**Ziel:** Regelbasierte Preis-Engine analog Amazon "Automate Pricing".

#### 3.1 Feature-Spezifikation
- **Guardrails:** Min-/Maxpreis pro SKU.
- **Buy Box Logik:** Match, Stay Below, Lowest Price.
- **Race-to-the-Bottom-Schutz:** Stopp bei Untergrenze.

#### 3.2 Tabellen
- `pricing.automated_rules`

---

### 4. Multi-Channel Fulfillment (MCF) & FBN API

**Ziel:** Lager und Versand für externe Shops (Shopify, WooCommerce).

#### 4.1 Feature-Spezifikation
- **REST-API:** Vendoren binden externe Shops an.
- **Webhook:** Shopify/WooCommerce feuert bei Bestellung.
- **Monetarisierung:** Pick & Pack + Versandkosten (keine Referral Fee).

#### 4.2 Tabellen
- `logistics.mcf_orders`

---

### 5. Eco-Zertifizierungsprogramm

**Ziel:** Nachhaltigkeits-Badge ("Eco-Smoker Verified") analog Climate Pledge Friendly.

#### 5.1 Feature-Spezifikation
- **Zertifikats-Upload:** FSC, EU-Bio, GOTS etc.
- **Admin-Review & Badge:** Nach Prüfung grünes Badge.
- **Such-Boost & Filter:** "Nur nachhaltige Produkte".

#### 5.2 Tabellen
- `catalog.eco_certifications`

---

## Teil B: Advanced Operations & B2B Governance

### 6. Transparency-Programm (Anti-Fälschung)

**Ziel:** Jede physische Einheit mit eindeutigem QR-Code – Originalgarantie.

#### 6.1 Feature-Spezifikation
- **Unique Codes:** 7–20 Zeichen, kryptografisch sicher.
- **Label-Pflicht:** Code auf Verpackung.
- **Fulfillment-Scan:** Ohne gültigen Code kein Versand.
- **Kunden-Verifizierung:** Scan bestätigt Authentizität.

#### 6.2 Tabellen
- `security.transparency_brands`
- `security.transparency_codes`

---

### 7. B2B Guided Buying & Genehmigungs-Workflows

**Ziel:** CSCs (Cannabis Social Clubs) mit Policies und Freigabeprozessen.

#### 7.1 Feature-Spezifikation
- **Multi-User:** Unter-Nutzer mit Rollen.
- **Policies:** Max. Bestellwert, Kategorie-Sperren, Preferred Vendor.
- **Approval-Routing:** PENDING_APPROVAL → E-Mail an Vorstand → Freigabe/Ablehnung.

#### 7.2 Tabellen
- `b2b.purchasing_policies`
- `b2b.order_approvals`

---

### 8. Product Recall Management (Kill-Switch)

**Ziel:** Vollautomatisierter Notfall-Prozess bei Rückrufen.

#### 8.1 Feature-Spezifikation
- **Sofortige Sperre:** ASIN → inaktiv/suppressed.
- **Logistik-Stopp:** In-Transit-Bestellungen stornieren.
- **Kunden-Warnung:** Automatische E-Mail an Käufer (5 Jahre Historie).

#### 8.2 Tabellen
- `compliance.product_recalls`
- `compliance.recall_customer_notifications`

---

### 9. SAFE-T Claims (Verkäufer-Schutz)

**Ziel:** Händler-Absicherung bei Retouren-Betrug (leere Box, zerstörte Ware).

#### 9.1 Feature-Spezifikation
- **Voraussetzung:** Kunde hat bereits Erstattung erhalten.
- **15 Tage:** Claim mit Fotos (Ware, Paket, Label).
- **Entscheidung:** Support prüft → Payout aus Plattform-Risikofonds.

#### 9.2 Tabellen
- `seller_services.safet_claims`

---

### 10. Marketplace Product Guidance (Search Gaps)

**Ziel:** Datenbasierte Sortimentsempfehlungen für Vendoren.

#### 10.1 Feature-Spezifikation
- **Suchbegriff-Analyse:** Hohes Volumen, wenig/f keine Treffer.
- **Opportunity Dashboard:** "1.200 Suchen nach X – keine Angebote."
- **Katalog-Qualität:** Fehlende Attribute warnen.

#### 10.2 Tabellen
- `analytics.search_term_gaps`
- `analytics.vendor_product_recommendations`

---

## Implementierungsreihenfolge (empfohlen)

| Phase | Feature | Abhängigkeiten |
|-------|---------|----------------|
| 1 | SQL-Migrationen (alle Tabellen) | — |
| 2 | Eco-Certifications | ASIN-Registry |
| 3 | Product Recalls | ASIN-Registry |
| 4 | Trade-In & Store Credit | Produkte, Kunden |
| 5 | Transparency | ASIN-Registry, vendor_accounts |
| 6 | SAFE-T Claims | order_items, fulfillment.order_lines |
| 7 | B2B Guided Buying | b2b.business_accounts, orders |
| 8 | Repricer | vendor_offers |
| 9 | Inventory Health | vendor_offers, Verkaufsdaten |
| 10 | MCF | vendor_accounts |
| 11 | Product Guidance | Suchdaten, product_categories |

---

## Schema-Anpassungen an mein-headshop

Die Blueprint-Schemas verwenden folgende Mappings zum bestehenden System:

| Blueprint | Bestehend |
|-----------|-----------|
| `vendors.accounts(vendor_id)` | `vendor_accounts(id)` |
| `catalog.vendor_offers(offer_id)` | `vendor_offers(id)` |
| `fulfillment.orders` | `orders` |
| `fulfillment.order_lines(line_id)` | `fulfillment.order_lines(id)` |
| `b2b.business_accounts(b2b_account_id)` | `b2b.business_accounts(id)` |
