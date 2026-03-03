# Cannabis-Marktplatz Blueprint 2025/2026 – Dokumentation, Abgleich & Migrations-Roadmap

Diese Datei dokumentiert den Abgleich zwischen dem aktuellen **mein-headshop** (Single-Vendor) und dem Zielbild eines **Multi-Vendor-Cannabis-Marktplatzes** sowie die geplanten Implementierungs- und Migrationsschritte.

> **Referenz:** Vollständige technische Spezifikationen, SQL-Schemas und Compliance in [BLUEPRINT-2025-2026-REFERENZ.md](./BLUEPRINT-2025-2026-REFERENZ.md). Umsetzungs-Roadmap in [BLUEPRINT-VOLLSTAENDIGE-UMSETZUNG.md](./BLUEPRINT-VOLLSTAENDIGE-UMSETZUNG.md).

---

## 1. Abgleich (Ist vs. Soll)

Übersicht für alle 8 Themenblöcke: aktueller Stand, Zielbild und grober Aufwand.

### Zusammenfassung

| # | Thema | Ist (aktuell) | Soll (Blueprint) | Priorität | Aufwand |
|---|-------|---------------|------------------|-----------|---------|
| 1 | **ASIN-Modell** | `products` mit `id`, `slug`, `category`, `subcategory_slug`, `brand` | Parent/Child-ASINs, Variation Themes, JSONB-Attribute | Hoch | Hoch |
| 2 | **Multi-Vendor** | Ein Shop-Betreiber, eigene Produkte | `vendors.accounts`, `vendor_offers`, Buy Box | Hoch | Sehr hoch |
| 3 | **Buy Box** | Nicht vorhanden | GSP-Algorithmus, Vendor-Metriken, Landed Price | Mittel | Hoch |
| 4 | **Event-Driven** | Synchrone REST-APIs, direkte DB-Zugriffe | Message-Broker (Kafka/SQS), asynchrone Events | Mittel | Hoch |
| 5 | **KYB-Workflow** | Kein Vendor-Onboarding | 4-stufiger KYB, UBO, Sanctions-Screening | Hoch | Hoch |
| 6 | **PPC/Bidding** | Keine Werbung | Sponsored Products, GSP-Auktion | Niedrig | Hoch |
| 7 | **DHL API** | `has_adult_items` in Bestellung, manuelle Labels | DHL GKP API, Label-Generierung, VisualCheckOfAge | Mittel | Mittel |
| 8 | **Self-Billing** | Normale Rechnungen, kein Self-Billing | Gutschriften § 14 UStG, E-Invoicing XRechnung/ZUGFeRD | Mittel | Mittel |

### Detail-Abgleich pro Themenblock

| Thema | Ist (aktuell) | Soll (Blueprint) | Grober Aufwand |
|-------|---------------|------------------|----------------|
| **ASIN-Modell** | Flache `products`-Tabelle, UUID als ID. Keine Varianten, feste Spalten für Attribute. | Hierarchie Parent/Child, 10-stellige ASIN, Variation Themes (Color, Size, PackQuantity). Produktdaten in JSONB (EAV). | 4–6 Wochen |
| **Multi-Vendor** | Nur eigener Bestand. Keine Vendor-Entität. | `vendors.accounts`, `vendor_offers`. Mehrere Angebote pro Produkt. Vendor-Dashboard, Onboarding. | 6–8 Wochen |
| **Buy Box** | Keine Auswahl – ein Preis pro Produkt. | Gewichteter Algorithmus (Landed Price, FBA/FBM, ODR, LSR, VTR). Materialized View für schnelle Zuordnung. | 3–4 Wochen |
| **Event-Driven** | Monolith: Checkout → direkte DB-Inserts, E-Mail-Sync. | Order-Event → Inventory, Payment, Notification asynchron. Saga-Pattern, Message-Broker. | 4+ Wochen |
| **KYB-Workflow** | Keine Vendor-Registrierung. | Stufe 1: Basisdaten + VIES. Stufe 2: Dokumente + OCR + Review. Stufe 3: UBO. Stufe 4: Sanctions/PEP. | 3–4 Wochen |
| **PPC/Bidding** | Keine Werbeanzeigen. | Kampagnen, Targets (Keyword/ASIN), Max Bid. GSP-Auktion, Quality Score. | 3+ Wochen |
| **DHL API** | `orders.has_adult_items`, Admin trägt Tracking manuell ein. | DHL GKP API: OAuth, Labels generieren, `VisualCheckOfAge` in Payload, Tracking-Sync. | 2–3 Wochen |
| **Self-Billing** | Kundenrechnungen als PDF. Kein Ledger für Vendor-Abrechnungen. | Gutschriften § 14 UStG, sequenzielle Nummern, XRechnung/ZUGFeRD. `financials.ledger`, Deemed-Seller. | 2–3 Wochen |

---

## 2. Detail-Abgleich pro Thema

Für jedes Thema: Ist-Zustand → Soll-Zustand (Blueprint).

| Thema | Ist → Soll |
|-------|------------|
| **ASIN-Modell** | Produkte (flache Tabelle, UUID) → Parent/Child-ASINs, Variation Themes, JSONB-Attribute |
| **Multi-Vendor** | Ein Anbieter, eigene Produkte → mehrere Vendoren (`vendor_offers`), Buy Box |
| **Event-Driven** | Monolith, synchrone APIs → Microservices, Message-Broker, asynchrone Events |
| **KYB-Workflow** | Kein Vendor-Onboarding → 4-stufiger KYB (Basisdaten, Dokumente, UBO, Sanctions) |
| **PPC/Bidding** | Keine Werbung → Sponsored Products, GSP-Auktion, Dynamic Bidding |
| **DHL API** | Manuell (Tracking-Eingabe, `has_adult_items`-Flag) → DHL GKP API, Labels, VisualCheckOfAge |
| **Self-Billing** | Normale Kundenrechnungen (PDF) → Gutschriften § 14 UStG, E-Invoicing (XRechnung/ZUGFeRD) |

---

## 3. Implementierungs-Roadmap

Für jedes Thema eine phasenweise Planung (Phase 1, 2, 3 …).

| Thema | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|-------|---------|---------|---------|---------|
| **ASIN-Modell** | Migration `products` → `catalog.product_attributes` + ASIN-Zuordnung | Parent/Child-Schema, Variation Themes (Color, Size, PackQuantity) | Product Type Definitions (JSON-Schema pro Kategorie) | Offer-Only-Payload für bestehende ASINs |
| **Multi-Vendor & Buy Box** | `vendors`-Schema, `vendor_offers`, Vendor-Dashboard | Buy Box Scoring (Landed Price, FBA/FBM, Metriken) | Materialized View `mv_active_buybox_winners` | UI „Alle Kaufoptionen“ auf Produktseite |
| **Event-Driven** | Supabase Edge Functions / DB Triggers als Event-Quellen | Message-Broker (Realtime/Redis) | Order/Inventory/Payment auslagern | API Gateway |
| **KYB-Workflow** | `vendors.accounts`, `ubos`, `kyb_documents` | Admin-Dashboard Dokumenten-Review (Maker-Checker) | VIES-API USt-IdNr. | Sanctions/PEP-Screening |
| **PPC/Bidding** | Schema `advertising.campaigns`, `targets`, `ad_events` | Keyword/ASIN-Targeting, Max Bid | GSP-Auktionslogik, Quality Score | Dynamic Bidding (Down/Up) |
| **DHL API** | DHL Parcel DE API v2 – OAuth, Test-Umgebung | POST /shipping/v2/orders + `VisualCheckOfAge` | Label-Speicherung, Tracking-Sync | Admin-Versand-UI anbinden |
| **Self-Billing** | `financials.ledger`, `invoices`, Self-Billing-Doc-Type | Sequenzielle Nummern, Gutschriften-Workflow | XRechnung/ZUGFeRD-Generierung | OSS, Deemed-Seller EU-VAT |

---

## 4. Migrations-Reihenfolge

| Phase | Fokus |
|-------|-------|
| **Phase 0** | Dokumentation & Schema-Design |
| **Phase 1** | DHL API + VisualCheckOfAge |
| **Phase 2** | Vendors + KYB ✅ (Migration, API, Admin-UI) |
| **Phase 3** | ASIN |
| **Phase 4** | Buy Box |
| **Phase 5** | Self-Billing |
| **Phase 6–7** | Event-Driven, PPC |

---

## 5. DHL VisualCheckOfAge

Beispiel-JSON für die DHL-Payload (DHL Parcel DE Shipping API v2). Bei Bestellungen mit `has_adult_items = true` muss der Zusatzservice `visualCheckOfAge` mit `minimumAge: 18` an die API übergeben werden.

```json
{
  "services": [
    {
      "visualCheckOfAge": {
        "active": true,
        "minimumAge": 18
      }
    }
  ]
}
```

---

## 6. ASIN-Modell (Parent/Child)

### Abgleich

| Aspekt | Aktuell | Soll |
|--------|---------|------|
| Produkt-ID | UUID (`products.id`) | ASIN (10-stellig) |
| Varianten | Keine | Parent-ASIN (nicht kaufbar) + Child-ASINs (Variation Theme) |
| Attribute | Relational (Spalten) | JSONB/EAV |
| Katalogstruktur | Flach | Hierarchisch |

### Implementierungs-Roadmap

1. **Phase 1:** Migration `products` → `catalog.product_attributes` + ASIN-Zuordnung
2. **Phase 2:** Parent/Child-Schema, Variation Themes (z.B. Color, Size, PackQuantity)
3. **Phase 3:** Product Type Definitions (JSON-Schema pro Kategorie)
4. **Phase 4:** Offer-Only-Payload für bestehende ASINs

### Migration (erster Schritt)

```sql
-- Supabase: ASIN-Modell als Erweiterung (nicht Ersatz) – Rückwärtskompatibel
-- Zuerst: products.asin als Fremdschlüssel auf catalog.amazon_standard_identification_numbers
-- catalog-Schema gemäß Blueprint anlegen
```

---

## 7. Multi-Vendor & Buy Box

### Abgleich

| Aspekt | Aktuell | Soll |
|--------|---------|------|
| Verkäufer | Ein Anbieter | `vendors.accounts`, KYB-Status |
| Angebote | 1:1 Produkt ↔ Preis | N:1 (mehrere Vendoren pro ASIN) |
| Auswahl | Keine | Buy Box, "Alle Kaufoptionen" |
| Metriken | Keine | ODR, LSR, VTR, Buy Box Score |

### Implementierungs-Roadmap

1. **Phase 1:** `vendors`-Schema, `vendor_offers`, Vendor-Dashboard
2. **Phase 2:** Buy Box Scoring (Landed Price, FBA/FBM, Metriken)
3. **Phase 3:** Materialized View `mv_active_buybox_winners`
4. **Phase 4:** UI "Alle Kaufoptionen" auf Produktseite

---

## 8. Event-Driven / Microservices

### Abgleich

| Aspekt | Aktuell | Soll |
|--------|---------|------|
| Architektur | Monolith (Next.js + Supabase) | API Gateway, Microservices |
| Kommunikation | Sync REST | Async Events (Kafka/SQS) |
| Skalierung | Vertikal | Horizontal (ECS/K8s) |

### Implementierungs-Roadmap

1. **Phase 1:** Supabase Edge Functions / DB Triggers als Event-Quellen (Order, Payment)
2. **Phase 2:** Externer Message-Broker (z.B. Supabase Realtime oder Upstash Redis als Pub/Sub)
3. **Phase 3:** Auslagerung Order/Inventory/Payment in eigene Services
4. **Phase 4:** API Gateway (Kong/AWS API Gateway)

*Hinweis: Für MVP reicht die Monolith-Struktur. Event-Driven lohnt sich bei starkem Wachstum.*

---

## 9. KYB-Workflow

### Abgleich

| Aspekt | Aktuell | Soll |
|--------|---------|------|
| Vendor-Registrierung | Keine | 4-stufiger KYB |
| Dokumente | – | OCR + manuelles Review |
| UBO | – | Identifikation, PEP/Sanctions-Screening |
| VIES | – | USt-IdNr.-Validierung |

### Implementierungs-Roadmap

1. **Phase 1:** `vendors.accounts`, `vendors.ubos`, `vendors.kyb_documents`
2. **Phase 2:** Admin-Dashboard für Dokumenten-Review (Maker-Checker) ✅
3. **Phase 3:** VIES-API-Integration für USt-IdNr. ✅
4. **Phase 4:** Sanctions/PEP-Screening (API oder manuell)

---

## 10. PPC/Bidding-Engine

### Abgleich

| Aspekt | Aktuell | Soll |
|--------|---------|------|
| Werbung | Keine | Sponsored Products |
| Auktion | – | Generalized Second Price |
| Gebote | – | Fixed / Dynamic Bidding |

### Implementierungs-Roadmap

1. **Phase 1:** Schema `advertising.campaigns`, `targets`, `ad_events`
2. **Phase 2:** Keyword/ASIN-Targeting, Max Bid
3. **Phase 3:** GSP-Auktionslogik, Quality Score
4. **Phase 4:** Dynamic Bidding (Down Only / Up and Down)

*Hinweis: KCanG beschränkt Werbung für Cannabis. Nur für Zubehör/Samen sinnvoll.*

---

## 11. DHL API (Label, VisualCheckOfAge)

### Abgleich

| Aspekt | Aktuell | Soll |
|--------|---------|------|
| Versand | Manuelle Eingabe Tracking | DHL GKP API, automatische Labels |
| Altersprüfung | `has_adult_items` in Bestellung | `VisualCheckOfAge` in API-Payload |
| Tracking | Manuell | Automatisch aus API |

### Implementierungs-Roadmap

1. **Phase 1:** DHL Parcel DE Shipping API v2 – OAuth, Test-Umgebung
2. **Phase 2:** POST /shipping/v2/orders mit `VisualCheckOfAge` wenn `has_adult_items`
3. **Phase 3:** Label-Speicherung (PDF/Base64), Tracking-Sync
4. **Phase 4:** Anbindung an Admin-Versand-UI

*Siehe Abschnitt 5 für die vollständige Beispiel-Payload.*

---

## 12. Self-Billing & E-Invoicing

### Abgleich

| Aspekt | Aktuell | Soll |
|--------|---------|------|
| Rechnungen | Kundenrechnungen (PDF) | + Self-Billing Gutschriften § 14 UStG |
| Format | PDF | XRechnung/ZUGFeRD (E-Rechnung 2025) |
| Ledger | Einfache Buchungen | Doppelte Buchführung, Deemed Seller |

### Implementierungs-Roadmap

1. **Phase 1:** `financials.ledger`, `financials.invoices`, `document_type = 'SELF_BILLING_CREDIT_NOTE'`
2. **Phase 2:** Sequenzielle Rechnungsnummern, Gutschriften-Workflow
3. **Phase 3:** XRechnung/ZUGFeRD-Generierung (Library oder API)
4. **Phase 4:** OSS, Deemed-Seller-Logik für EU-VAT

---

## 13. Nächste Schritte

1. **Priorisierung** festlegen (z.B. DHL API oder KYB zuerst)
2. **Supabase-Migrationen** für gewählte Schemas anlegen
3. **APIs/Endpoints** gemäß Roadmap implementieren
4. **Tests** für Compliance-relevante Bereiche (AVS, DDG, BFSG)

---

*Erstellt: 2025. Basierend auf Cannabis-Marktplatz Blueprint Deutschland 2025/2026.*
