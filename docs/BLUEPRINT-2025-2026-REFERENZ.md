# Technischer, Operativer und Rechtlicher Blueprint: Cannabis-Marktplatz Deutschland 2025/2026

> Referenzdokument für mein-headshop. Vollständige Übernahme der Blueprint-Spezifikationen.

---

## 1. Systemarchitektur und Cloud-Infrastruktur

### 1.1 Microservices-Topologie und Event-Driven Design

| Komponente | Technologie | Funktion |
|------------|-------------|----------|
| Frontend | Next.js (SSR), React | TTI, SEO, ASIN-Sichtbarkeit |
| API Gateway | AWS API Gateway / Kong | Auth, SSL, Rate-Limiting, Routing |
| Container | ECS Fargate / Kubernetes | Serverlos, autoskalierend |
| Messaging | Apache Kafka / AWS SQS | Entkopplung, Saga-Pattern, Transaktionssicherheit |

**Event-Driven:** Order-Event → Inventory, Payment, Notification asynchron. Keine Race Conditions, kein Deadlock.

### 1.2 Polyglotte Persistenz

| Anwendungsfall | Technologie | Begründung |
|----------------|-------------|------------|
| Transaktional (Orders, Ledger) | PostgreSQL (ACID) | Multi-AZ, Konsistenz |
| Produktdaten/Katalog | DocumentDB/MongoDB, JSONB | Dynamische Attribute |
| Suche | Elasticsearch | Volltext über Millionen ASINs |

---

## 2. ASIN-Katalogmodell und Multi-Vendor-Struktur

### 2.1 Parent-Child und Variation Themes

| Ebene | Funktion | Attribute |
|-------|----------|-----------|
| **Parent ASIN** | Logische Klammer, nicht kaufbar. Aggregiert Reviews, BSR. | Titel-Stamm, Marke, Sterne, Kategorie |
| **Child ASIN** | Kaufbares Produkt, eigene Bestands-/Preisdaten | Farbe, Größe, EAN/UPC, Bilder, Gewicht |
| **Variation Theme** | Erlaubte Unterscheidungsachse | Size, Color, SizeColor, PackQuantity |

**Review-Hijacking verhindern:** Algorithmische Prüfung, dass keine fundamental unterschiedlichen Produkte unter einer Parent-ASIN gebündelt werden.

### 2.2 EAV vs. JSONB

- Produkte haben unterschiedliche Spezifikationen (T-Shirt: Größe; Vaporizer: Akku; Samen: Blütezeit).
- **JSONB** (PostgreSQL) statt klassischem EAV für flexible Attribute.
- Validierung gegen Product Type Definitions (JSON-Schema pro Kategorie).
- **Offer-Only-Payload:** Bei ASIN-Matching nur Preis/Bestand/Zustand, keine Produktdatenänderung.

### 2.3 SQL-Schema: Catalog

```sql
CREATE SCHEMA IF NOT EXISTS catalog;

CREATE TABLE catalog.amazon_standard_identification_numbers (
    asin VARCHAR(10) PRIMARY KEY,
    product_type_id VARCHAR(50) NOT NULL,
    is_parent BOOLEAN DEFAULT FALSE,
    parent_asin VARCHAR(10) REFERENCES catalog.amazon_standard_identification_numbers(asin) ON DELETE SET NULL,
    variation_theme VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_parent_logic CHECK (
        (is_parent = TRUE AND parent_asin IS NULL) OR (is_parent = FALSE)
    )
);

CREATE TABLE catalog.product_attributes (
    asin VARCHAR(10) PRIMARY KEY REFERENCES catalog.amazon_standard_identification_numbers(asin) ON DELETE CASCADE,
    brand VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    attributes JSONB NOT NULL,
    compliance_media JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE catalog.vendor_offers (
    offer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL,
    asin VARCHAR(10) NOT NULL REFERENCES catalog.amazon_standard_identification_numbers(asin),
    vendor_sku VARCHAR(100) NOT NULL,
    item_condition VARCHAR(20) DEFAULT 'NEW',
    price_item NUMERIC(10, 2) NOT NULL,
    price_shipping NUMERIC(10, 2) DEFAULT 0.00,
    price_landed NUMERIC(10, 2) GENERATED ALWAYS AS (price_item + price_shipping) STORED,
    currency VARCHAR(3) DEFAULT 'EUR',
    fulfillment_channel VARCHAR(10) CHECK (fulfillment_channel IN ('FBM', 'FBA')),
    stock_quantity INT DEFAULT 0,
    is_buybox_eligible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vendor_id, vendor_sku)
);
```

---

## 3. Buy Box (Featured Offer) 2025

### 3.1 Gewichtungsfaktoren (A10-Analogon)

| Metrik | Definition | Ziel 2025 | Gewichtung |
|--------|------------|-----------|------------|
| Liefergeschwindigkeit | Prognostizierte Zeit bis Zustellung | ≤ 2 Tage | 25–30% |
| Landed Price | Artikel + Versand | Niedrigster + max. 3% Toleranz | 25% |
| Fulfillment | FBA vs. FBM | FBA/SFP bevorzugt | 20% |
| Seller Metrics | ODR, LSR, VTR | ODR &lt;1%, VTR &gt;95%, LSR &lt;4% | 15% |
| Lagerbestand | Verfügbarkeit | &gt; 0 (Knock-out) | 10% |

### 3.2 Strafen und Suppression

- **ODR &gt; 1%:** Buy-Box-Berechtigung entzogen.
- **VTR &lt; 95%:** Abwertung.
- **Buy Box Suppression:** Wenn Vendor extern signifikant günstiger anbietet → Buy Box ausgeblendet, nur „Alle Kaufoptionen“.

### 3.3 SQL-Schema: Buy Box

```sql
CREATE TABLE analytics.vendor_performance_metrics (
    vendor_id UUID PRIMARY KEY,
    calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    order_defect_rate NUMERIC(5, 4) DEFAULT 0.0000,
    late_shipment_rate NUMERIC(5, 4) DEFAULT 0.0000,
    pre_fulfillment_cancellation_rate NUMERIC(5, 4) DEFAULT 0.0000,
    valid_tracking_rate NUMERIC(5, 4) DEFAULT 1.0000,
    response_time_avg_hours NUMERIC(5, 2),
    is_buybox_eligible BOOLEAN DEFAULT TRUE
);

CREATE MATERIALIZED VIEW analytics.mv_active_buybox_winners AS
SELECT DISTINCT ON (o.asin)
    o.asin, o.offer_id, o.vendor_id, o.price_landed,
    o.fulfillment_channel, vpm.order_defect_rate,
    (CASE WHEN o.fulfillment_channel = 'FBA' THEN 30.0 ELSE 0.0 END) +
    (100.0 / NULLIF(o.price_landed, 0)) - (vpm.order_defect_rate * 1000.0) AS buybox_score
FROM catalog.vendor_offers o
JOIN analytics.vendor_performance_metrics vpm ON o.vendor_id = vpm.vendor_id
WHERE o.stock_quantity > 0 AND o.is_buybox_eligible = TRUE AND vpm.is_buybox_eligible = TRUE
ORDER BY o.asin, buybox_score DESC;
```

---

## 4. Rechtliche Compliance: KCanG, JuSchG, DDG, BFSG

### 4.1 KCanG

- **Katalogrestriktion:** Keine ASINs für Cannabis-Stecklinge, THC-Blüten (Genuss). Serverseitig blockieren.
- **Werbeverbot § 6 KCanG:** Kein verherrlichendes Marketing. PPC darf keine AIDA-Trigger setzen.
- **Mengenbegrenzung:** Besitzobergrenzen beachten, Bestelldaten pseudonymisiert archivierbar.

### 4.2 JuSchG – Zweistufiges AVS

1. **Session:** Identitäts- und Altersprüfung im Checkout (Schufa Q-Bit, Postident, eID). Nur Hash speichern.
2. **Logistik:** `VisualCheckOfAge` an DHL-API übergeben bei Übergabe.

### 4.3 DDG

- **Notice & Action:** Meldeverfahren für illegale Inhalte, Trusted Flaggers.
- **§ 17 Transparenzbericht:** Beschwerden, Maßnahmen, Sperrungen protokollieren.

### 4.4 BFSG (ab 28.06.2025)

- **WCAG 2.1 AA:** Alt-Texte, Farbkontrast, Tastaturbedienung, WAI-ARIA, Timeout-Anpassung.
- **Kleinstunternehmen:** &lt; 10 MA und &lt; 2 Mio € Umsatz → Ausnahme. Bei Onboarding abfragen.

### 4.5 SQL-Schema: Compliance

```sql
CREATE TABLE compliance.age_verification_logs (...);
CREATE TABLE compliance.ddg_content_reports (...);
CREATE TABLE compliance.vendor_legal_flags (
    bfsg_micro_enterprise_exemption BOOLEAN DEFAULT FALSE,
    cang_advertising_ban_acknowledged BOOLEAN DEFAULT FALSE,
    requires_medical_license BOOLEAN DEFAULT FALSE,
    ...
);
```

---

## 5. Vendor Onboarding (KYB)

### 5.1 Vierstufiger KYB-Workflow

| Stufe | Inhalt |
|-------|--------|
| 1 | Basisdaten, USt-IdNr., VIES-Validierung |
| 2 | Dokumente, OCR, manuelles Review (Maker-Checker) |
| 3 | UBO-Identifikation (&gt;25% Anteile) |
| 4 | Sanctions- und PEP-Screening |

### 5.2 SQL-Schema: Vendors

```sql
CREATE TABLE vendors.accounts (...);
CREATE TABLE vendors.ubos (...);
CREATE TABLE vendors.kyb_documents (...);
```

---

## 6. Logistik: FBA/FBM, DHL API

### 6.1 Order Splitting

- Master Order → Order Lines pro Vendor. Jeder Vendor sieht nur seine Positionen.

### 6.2 DHL GKP API

- OAuth 2.0, POST /shipping/v2/orders
- `VisualCheckOfAge` bei has_adult_items
- Response: Tracking-ID, Label (Base64 PDF/ZPL)

### 6.3 SQL-Schema: Fulfillment

```sql
CREATE TABLE fulfillment.orders (...);
CREATE TABLE fulfillment.order_lines (
    order_id, vendor_id, asin, quantity, unit_price_landed,
    fulfillment_method, line_status, requires_age_verification
);
CREATE TABLE fulfillment.shipments (
    order_line_id, carrier, tracking_number, label_format, label_data_base64, ...
);
```

---

## 7. Abrechnungsarchitektur: EU-VAT, Self-Billing

### 7.1 Deemed Seller Rule

- Checkout: VAT nach Bestimmungsland.
- OSS-Abgabe durch Marktplatz, Vendor erhält Netto-Payout.

### 7.2 Self-Billing § 14 UStG

- Marktplatz stellt Gutschriften aus.
- E-Rechnungspflicht 2025: ZUGFeRD/XRechnung, kein reines PDF.

### 7.3 SQL-Schema: Financials

```sql
CREATE TABLE financials.ledger (
    transaction_type IN ('SALE', 'REFUND', 'COMMISSION_FEE', 'FBA_FEE', 'PAYOUT'),
    is_deemed_supplier BOOLEAN DEFAULT FALSE, ...
);
CREATE TABLE financials.invoices (
    document_type IN ('CUSTOMER_INVOICE', 'SELF_BILLING_CREDIT_NOTE'),
    e_invoice_xml_s3_url, ...
);
```

---

## 8. Sponsored Products (PPC)

- **GSP-Auktion:** Ad Rank = Bid × Quality Score.
- CPC = marginal notwendig, um Zweitplatzierten zu übertreffen + 0,01 €.
- **Dynamic Bidding:** Down Only / Up and Down.

```sql
CREATE TABLE advertising.campaigns (...);
CREATE TABLE advertising.targets (target_type: KEYWORD/ASIN, match_type, quality_score);
CREATE TABLE advertising.ad_events (event_type: IMPRESSION/CLICK/CONVERSION);
```

---

## 9. Admin Governance

- **Category Gating:** Gated Categories, Approval-Workflow, Dokumentenprüfung.
- **Commission Rules Engine:** Individuell pro Vendor/Kategorie.
- **Performance Monitoring:** Alerts bei ODR &gt; 1%, Buy-Box-Sperre.

```sql
CREATE TABLE admin.gated_categories (...);
CREATE TABLE admin.vendor_category_approvals (...);
CREATE TABLE admin.commission_rules (...);
```

---

## 10. Customer Experience

- **Subscribe & Save:** Abos mit Rabatt, Cron für automatische Bestellungen.
- **Cross-Selling:** „Wird oft zusammen gekauft“ (Warenkorb-Aggregation).
- **A-bis-z-Garantie:** Eskalations-Workflow, Admin-Eingriff.
- **Verified Purchase:** Badge für tatsächliche Käufer.
- **Vine-Programm:** Produkttester, kostenlose Muster, verpflichtendes Review.

```sql
CREATE TABLE cx.subscriptions (...);
CREATE TABLE cx.a_to_z_claims (...);
CREATE TABLE cx.product_reviews (is_verified_purchase, is_tester_program);
```

---

## 11. Advanced Features

- **Lightning Deals:** Zeitlich begrenzt, Kontingent, Countdown.
- **Shoppable Videos:** MP4/MOV, max 5GB, Admin-Freigabe.
- **QR-Retouren:** Druckerlose Retouren via DHL API.
- **B2B:** Geschäftskonten, USt-IdNr., Staffelpreise.
- **A+ Content:** Enhanced Brand Content auf PDP.

```sql
CREATE TABLE promotions.lightning_deals (...);
CREATE TABLE catalog.shoppable_videos (...);
CREATE TABLE catalog.aplus_content (...);
CREATE TABLE fulfillment.returns (dhl_qr_code_base64, ...);
CREATE TABLE b2b.business_accounts (...);
CREATE TABLE b2b.tiered_pricing (...);
```

---

## 12. Experten-Features

- **Return Inspections:** Restocking Fees, Zustandsprüfung durch Vendor.
- **Brand Registry:** Markenverifikation, Katalog-Hoheit.
- **Coupons:** Klickbare Badges in Suchergebnissen, Budget-Deckelung.
- **Q&A:** Fragen & Antworten auf PDP, UGC, SEO.
- **Affiliate/PartnerNet:** Tracking-Links, Cookie-Laufzeit, Provision.

```sql
CREATE TABLE advanced_ops.return_inspections (...);
CREATE TABLE advanced_ops.brand_registry (...);
CREATE TABLE advanced_ops.coupons (...);
CREATE TABLE advanced_ops.product_qa (...);
CREATE TABLE advanced_ops.affiliate_links (...);
```

---

*Referenz für mein-headshop. Abgleich mit Umsetzung siehe BLUEPRINT-VOLLSTAENDIGE-UMSETZUNG.md.*
