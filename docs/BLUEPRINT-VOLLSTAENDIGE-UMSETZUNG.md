# Cannabis-Marktplatz Blueprint 2025/2026 – Vollständige Umsetzungs-Roadmap

> Ziel: Schrittweise Implementierung aller Blueprint-Features für mein-headshop.  
> **Referenz:** [BLUEPRINT-2025-2026-REFERENZ.md](./BLUEPRINT-2025-2026-REFERENZ.md) – Technische Spezifikationen, SQL-Schemas, Compliance.  
> Abgleich mit bestehendem Sachstand (SACHSTAND.md) und MARKTPLATZ-BLUEPRINT-ROADMAP.md.

---

## Status: Bereits umgesetzt ✅

| Bereich | Umgesetzt | Dateien/Notizen |
|---------|-----------|-----------------|
| **Vendors + KYB** | vendor_accounts, vendor_ubos, vendor_kyb_documents, vendor_offers | migration-vendors-kyb.sql |
| **KYB Maker-Checker** | Dokumenten-Review, VIES USt-IdNr. | Admin Vendors, API validate-vat |
| **ASIN (Phase 1)** | products.asin, catalog.product_attributes (EAV) | migration-asin-product-attributes.sql |
| **Buy Box (Phase 1)** | product_offers View, mv_active_buybox_winners | migration-buybox.sql |
| **Alle Kaufoptionen UI** | Produktseite mit Multi-Vendor-Anzeige | shop/[slug]/page.tsx, API shop/products/[slug]/offers |
| **Altersverifikation** | age_verification_tokens | migration-age-verification.sql |
| **DHL-Flag** | orders.has_adult_items für VisualCheckOfAge | Bereits im Schema |
| **Phase 2: DHL API & Logistik** | OAuth, Label, VisualCheckOfAge, Tracking-Sync | lib/dhl-parcel.ts, API dhl-label, Cron check-tracking |
| **Phase 3: Order Splitting** | order_lines, Packages-UI, Mollie Split, FBA/FBM | checkout, fulfillment-routing, calculate-payment-splits |
| **Phase 4: JuSchG AVS** | Identitätsprüfung, compliance.age_verification_logs, Checkout-Redirect | age-verification API, avs-compliance-log, Simulation/IDnow/PostIdent/QBit |
| **Phase 5: DDG** | Notice & Action, Transparenzbericht §17 | /illegale-inhalte-melden, ddg_content_reports, Admin DDG-Reports |
| **Phase 6: BFSG** | WCAG 2.1 AA, Skip-Link, Fokus-Ring, BFSG Kleinstunternehmen | layout, globals.css, vendor_legal_flags |
| **Phase 7: Self-Billing** | Ledger, Gutschriften, XRechnung/ZUGFeRD, OSS | lib/ledger.ts, lib/self-billing.ts, lib/xrechnung.ts |
| **Phase 8: CX (Teil)** | Verified Purchase, cx.subscriptions, cx.a_to_z_claims | product_reviews, migration-cx-schema |

---

## Gesamtübersicht: Alle Blueprint-Themen

### Abhängigkeiten (was vor was)

```
Vendor/KYB ─────────────────────────────────────────────────────────┐
    │                                                                 │
ASIN Parent/Child ────────► Buy Box Scoring (ODR/LSR/VTR) ───────────┤
    │                                                                 │
    └──► Order Splitting (Multi-Vendor-Checkout) ────────────────────┤
                                                                     │
DHL API ─────────────────────────────────────────────────────────────┤
                                                                     │
Compliance (JuSchG, DDG, BFSG) ──────────────────────────────────────┤
                                                                     ▼
Self-Billing (§14 UStG, XRechnung) ◄── financials.ledger ◄───────────┤
                                                                     │
PPC/Ads, Event-Driven, API Gateway ◄── erst nach stabiler Basis ─────┘
```

---

## Phase 1: Datenbank & Schema (Foundation)

**Ziel:** Blueprint-Schema schrittweise einführen, bestehendes System nicht brechen.

### 1.1 Parent/Child ASIN ✅

| Aufgabe | Datei | Beschreibung |
|---------|-------|--------------|
| Migration | `migration-asin-parent-child.sql` | `catalog.amazon_standard_identification_numbers` (Blueprint 2.3) |
| Migration | – | `products.parent_asin`, `products.asin`, `variation_theme` |
| Sync | `migration-asin-catalog-sync-trigger.sql` | Trigger sync bei Produkt-Änderung |
| Admin | `/admin/asin-registry` | ASIN-Registry CRUD (Parent/Child) |

### 1.2 Vendor Performance Metrics (Buy Box 2025)

| Aufgabe | Datei | Beschreibung |
|---------|-------|--------------|
| Migration | `migration-vendor-performance-metrics.sql` | `analytics.vendor_performance_metrics` (Blueprint 3.3) |
| Migration | – | ODR, LSR, VTR, pre_fulfillment_cancellation_rate |
| Cron/Trigger | – | Aggregation aus Bestellungen/Shipments |
| **Gewichtung 2025** | – | Liefergeschwindigkeit 25–30%, Landed Price 25%, FBA 20%, Seller Metrics 15%, Inventory 10% |
| **Buy Box Suppression** | – | Wenn Vendor extern signifikant günstiger: Buy Box ausblenden, nur „Alle Kaufoptionen“ |

### 1.3 Compliance-Schema

| Aufgabe | Datei | Beschreibung |
|---------|-------|--------------|
| Migration | `migration-compliance-schema.sql` | `compliance.age_verification_logs` (Blueprint 4.5) |
| Migration | – | `compliance.ddg_content_reports` (Notice & Action) |
| Migration | – | `compliance.vendor_legal_flags` (BFSG, KCanG) |

### 1.4 Financials Ledger

| Aufgabe | Datei | Beschreibung |
|---------|-------|--------------|
| Migration | `migration-financials-ledger.sql` | `financials.ledger` (Blueprint 7.3) |
| Migration | – | `financials.invoices` (SELF_BILLING_CREDIT_NOTE) |

### 1.5 Category Gating

| Aufgabe | Datei | Beschreibung |
|---------|-------|--------------|
| Migration | `migration-category-gating.sql` | `admin.gated_categories`, `admin.vendor_category_approvals` |
| Migration | – | `admin.commission_rules` |

---

## Phase 2: DHL API & Logistik ✅

| Nr | Aufgabe | Aufwand | Beschreibung | Status |
|----|---------|---------|--------------|--------|
| 2.1 | DHL Parcel DE API v2 – OAuth | 1 Woche | Test-/Prod-Konto, Token-Management | ✅ lib/dhl-parcel.ts |
| 2.2 | POST /shipping/v2/orders | 1 Woche | Label-Generierung, VisualCheckOfAge bei has_adult_items | ✅ dhl-label API |
| 2.3 | Label-Speicherung, Tracking-Sync | 3–5 Tage | label_url, delivered_at, Cron check-tracking | ✅ |
| 2.4 | Admin-Versand-UI anbinden | 3–5 Tage | Button „DHL-Label erstellen“, Tracking-Anzeige | ✅ Admin Orders |

---

## Phase 3: Order Splitting & Multi-Vendor-Checkout ✅

| Nr | Aufgabe | Aufwand | Beschreibung | Status |
|----|---------|---------|--------------|--------|
| 3.1 | Order Lines pro Vendor | 1 Woche | fulfillment.order_lines (Blueprint 6.3) | ✅ migration-fulfillment-order-lines |
| 3.2 | Checkout: Produkte nach Vendor gruppieren | 1 Woche | Warenkorb → mehrere „Packages“ | ✅ packages-preview API, Checkout-UI |
| 3.3 | Zahlungsflow: Ein Checkout, mehrere Vendor-Payouts | 1–2 Wochen | Mollie Split oder aggregierter Flow | ✅ calculatePaymentSplits, order_payment_splits |
| 3.4 | FBA vs. FBM Routing | 1 Woche | Order Lines mit fulfillment_method | ✅ getFulfillmentRoutes, Admin DHL-Button |

---

## Phase 4: JuSchG & AVS (Altersverifikation) ✅

| Nr | Aufgabe | Aufwand | Beschreibung | Status |
|----|---------|---------|--------------|--------|
| 4.1 | Identitätsprüfung (Session) | 2 Wochen | Q-Bit, Postident oder eID – Integration | ✅ Simulation aktiv; IDnow/PostIdent/QBit Stubs |
| 4.2 | compliance.age_verification_logs befüllen | 2–3 Tage | Hash speichern, Session valid_until | ✅ lib/avs-compliance-log.ts |
| 4.3 | Checkout: AVS vor Zahlung prüfen | 3–5 Tage | Redirect zu AVS, dann Fortsetzung | ✅ /checkout/age-verification, Token-Prüfung |

---

## Phase 5: DDG (Digitale-Dienste-Gesetz) ✅

| Nr | Aufgabe | Aufwand | Beschreibung | Status |
|----|---------|---------|--------------|--------|
| 5.1 | Notice & Action Meldeverfahren | 1 Woche | Formular für illegale Inhalte, Trusted Flaggers | ✅ /illegale-inhalte-melden, /api/ddg/report |
| 5.2 | ddg_content_reports befüllen | 2–3 Tage | Status-Workflow (PENDING → INVESTIGATING → REMOVED) | ✅ Admin DDG-Reports |
| 5.3 | Transparenzbericht §17 DDG | 1 Woche | Automatisierte Aggregation, Export | ✅ /api/admin/ddg-reports/transparency (JSON/CSV) |

---

## Phase 6: BFSG (Barrierefreiheit, ab 28.06.2025) ✅

| Nr | Aufgabe | Aufwand | Beschreibung | Status |
|----|---------|---------|--------------|--------|
| 6.1 | WCAG 2.1 AA Audit | 3–5 Tage | Lighthouse, axe DevTools | ✅ Manuell; Compliance-Check prüft Alt-Texte |
| 6.2 | Alt-Texte, Farbkontrast, Tastaturbedienung | 1–2 Wochen | Systematische Anpassungen | ✅ Skip-Link, :focus-visible, Produktbilder alt |
| 6.3 | WAI-ARIA, Timeout-Anpassung Checkout | 3–5 Tage | SC 2.2.1 | ✅ Kein aggressives Checkout-Timeout; ARIA in Modals |
| 6.4 | vendor_legal_flags.bfsg_micro_enterprise_exemption | 1 Tag | Abfrage bei Vendor-Onboarding | ✅ Partner-Anfrage, Admin Vendor |

---

## Phase 7: Self-Billing & E-Invoicing

| Nr | Aufgabe | Aufwand | Beschreibung | Status |
|----|---------|---------|--------------|--------|
| 7.1 | financials.ledger: Buchungen bei Verkauf | 1 Woche | SALE, COMMISSION_FEE, PAYOUT | ✅ lib/ledger.ts |
| 7.2 | Sequenzielle Gutschriften-Nummern | 2–3 Tage | §14 UStG, SELF_BILLING_CREDIT_NOTE | ✅ lib/self-billing.ts, Admin-Finances |
| 7.3 | XRechnung/ZUGFeRD-Generierung | 2–3 Wochen | lib/xrechnung.ts (UBL 2.1), Storage, Kunden- + Self-Billing | ✅ |
| 7.4 | OSS & Deemed-Seller EU-VAT | 1–2 Wochen | lib/eu-vat.ts, Ledger is_deemed_supplier, OSS-Export | ✅ |

---

## Phase 8: Customer Experience (Subscribe & Save, A-z-Garantie, Vine)

| Nr | Aufgabe | Aufwand | Beschreibung | Status |
|----|---------|---------|--------------|--------|
| 8cx.1 | Subscribe & Save | 2 Wochen | cx.subscriptions, Cron für Abo-Bestellungen, Rabatt | ✅ Schema migration-cx-schema |
| 8cx.2 | Cross-Selling „Wird oft zusammen gekauft“ | 1 Woche | Warenkorb-Aggregation, Cache | ✅ Kategorie-basiert auf PDP |
| 8cx.3 | A-bis-z-Garantie | 2 Wochen | cx.a_to_z_claims, Eskalations-Workflow | ✅ Schema, Admin-UI, admin_notes, resolution_reason |
| 8cx.4 | Verified Purchase Badge | 2–3 Tage | product_reviews.is_verified_purchase | ✅ Migration, Badge, is_tester_program |
| 8cx.5 | Vine-Programm | 1–2 Wochen | Produkttester, kostenlose Muster | ✅ vine_products, vine_invitations, Admin-UI, E-Mail-Einladung, Accept/Decline |

## Phase 9: PPC & Sponsored Products

| Nr | Aufgabe | Aufwand | Beschreibung |
|----|---------|---------|--------------|
| 9.1 | Schema advertising.campaigns, targets, ad_events | 2–3 Tage | Blueprint 8.3 | ✅ migration-advertising-schema.sql |
| 9.2 | Keyword/ASIN-Targeting, Max Bid | 1–2 Wochen | Admin-UI, API | ✅ Admin-/API-Kampagnen & Targets |
| 9.3 | GSP-Auktionslogik | 2 Wochen | Ad Rank, CPC-Berechnung | ✅ lib/gsp-auction.ts, /api/advertising/events, eligible, stats |
| 9.4 | Dynamic Bidding (optional) | 1 Woche | Down Only / Up and Down | ✅ lib/dynamic-bidding.ts, eligible + events API |
| 9.5 | KCanG: Kein verherrlichendes Targeting | 1 Tag | Regel: Cannabis-spezifische Werbung vermeiden | ✅ lib/kcan-advertising-check.ts, Blockierung bei Target-Erstellung |

---

## Phase 10: Advanced Features (Lightning Deals, Videos, B2B, A+ Content)

| Nr | Aufgabe | Aufwand | Beschreibung |
|----|---------|---------|--------------|
| 10.1 | Lightning Deals (4:20 Deals) | 1–2 Wochen | promotions.lightning_deals, Countdown, Kontingent | ✅ Migration, Admin-UI, APIs |
| 10.2 | Shoppable Videos | 1 Woche | catalog.shoppable_videos, Admin-Freigabe, KCanG-konform | ✅ Migration, Admin UI, Upload, Freigabe, PDP-Komponente | ✅ Migration, Admin-UI, API, PDP-Player |
| 10.3 | Druckerlose QR-Retouren | 1 Woche | fulfillment.returns, DHL Returns API | ✅ lib/dhl-returns.ts, Admin-Button, Kunden-QR-Anzeige |
| 10.4 | B2B-Konten, Staffelpreise | 2 Wochen | b2b.business_accounts, tiered_pricing | ✅ Migration, Register, Admin, Checkout-Integration |
| 10.5 | A+ Content | 1–2 Wochen | catalog.aplus_content, visueller Baukasten für Marken | ✅ Migration, Admin-UI, APIs, PDP-Komponente (image_text, text_only, comparison_table, feature_list, image_gallery) |

## Phase 11: Experten-Features (Return Inspections, Brand Registry, Q&A, Affiliate)

| Nr | Aufgabe | Aufwand | Beschreibung |
|----|---------|---------|--------------|
| 11.1 | Return Inspections & Restocking Fees | 1–2 Wochen | advanced_ops.return_inspections, Guided Refund Workflow | ✅ Migration, API, Retourenprüfung auf Bestelldetail (Zustand, Restocking Fee, Gutschrift-Berechnung) |
| 11.2 | Brand Registry | 2 Wochen | advanced_ops.brand_registry, Markenschutz, Katalog-Hoheit | ✅ Migration, Admin-UI, APIs (CRUD), BrandSelect-Integration |
| 11.3 | Klickbare Coupons (Voucher Badges) | 1 Woche | advanced_ops.coupons, Budget-Deckelung | ✅ Migration, Admin-UI, APIs, Budget-Check in validate/checkout, VoucherBadges auf Shop & Checkout |
| 11.4 | Customer Q&A | 1 Woche | advanced_ops.product_qa, UGC, SEO | ✅ Migration, APIs (public + admin), PDP-Komponente, Admin-UI |
| 11.5 | Affiliate/PartnerNet | 2 Wochen | advanced_ops.affiliate_links, Tracking, Provision | ✅ Migration, AffiliateCapture (?aff=CODE), Checkout-Mitgabe, Provision bei Zahlung (mark-order-paid), Admin-CRUD, API affiliate-commissions |

## Phase 12: Event-Driven & Microservices (optional)

| Nr | Aufgabe | Aufwand | Beschreibung | Status |
|----|---------|---------|--------------|--------|
| 12.1 | DB-Trigger als Event-Quellen | 1 Woche | order_created, payment_received | ✅ migration-domain-events.sql, events.domain_events, Trigger |
| 12.2 | Message-Broker (Supabase Realtime) | 1–2 Wochen | Pub/Sub auf domain_events | ✅ Realtime-fähig, lib/domain-events.ts, Admin-API, siehe docs/PHASE-12-EVENT-DRIVEN.md |
| 12.3 | Order/Inventory/Payment auslagern | 4+ Wochen | Eigene Services | Geplant (docs) |
| 12.4 | API Gateway | 2–3 Wochen | Kong oder AWS API Gateway | Geplant (docs) |

> **Hinweis:** Für einen Shop im MVP-/ Wachstumsstadium reicht der Monolith. Event-Driven lohnt sich bei hohem Traffic und vielen externen Integrationen.

---

## Phase 13: Admin Governance ✅

| Nr | Aufgabe | Aufwand | Beschreibung | Status |
|----|---------|---------|--------------|--------|
| 13.1 | Category Gating UI | 1 Woche | Gated Categories, Approval-Requests | ✅ Admin /category-gating, APIs gated-categories, vendor-category-approvals |
| 13.2 | Commission Rules Engine | 1 Woche | Dynamische Provisionen pro Kategorie/Vendor | ✅ Admin /commission-rules, lib/commission-rules.ts, calculate-payment-splits Integration |
| 13.3 | Vendor Performance Monitoring | 3–5 Tage | Alerts bei ODR > 1% | ✅ Admin /vendor-performance, Alerts ODR/LSR/VTR |
| 13.4 | Buy Box Sperre pro Vendor | 2–3 Tage | is_buybox_eligible in Admin setzen | ✅ Bereits in Vendors-Detail (Metriken-Bereich) |

---

## Empfohlene Reihenfolge (Priorisiert)

| Priorität | Phase | Begründung |
|-----------|-------|------------|
| **P0** | 1.1 Parent/Child ASIN | Basis für Variationen, Katalog |
| **P0** | 1.2 Vendor Performance Metrics | Buy Box braucht ODR/LSR/VTR |
| **P1** | 2 DHL API | JuSchG-relevant, spart manuelle Arbeit |
| **P1** | 3 Order Splitting | Kern von Multi-Vendor |
| **P1** | 7.1–7.2 Ledger + Gutschriften | Rechtlich relevant, Vendor-Auszahlungen |
| **P2** | 4 JuSchG AVS | Compliance, aber externer Dienst nötig |
| **P2** | 5 DDG | Notice & Action, Transparenz |
| **P2** | 6 BFSG | Deadline 28.06.2025 |
| **P2** | 7.3–7.4 XRechnung, OSS | E-Invoicing-Pflicht |
| **P3** | 8 PPC | Monetarisierung, KCanG beachten |
| **P3** | 13 Admin Governance | Category Gating, Commission Rules |
| **P3** | 8 CX | Subscribe & Save, A-z-Garantie, Vine |
| **P3** | 10 Advanced Features | Lightning Deals, B2B, A+ Content (nach stabiler Basis) |
| **P4** | 11 Experten | Return Inspections, Brand Registry, Q&A, Affiliate |
| **P4** | 12 Event-Driven | Skalierung, optional |

---

## Nächste konkrete Schritte

1. **Phase 1.1 starten:** Migration für `catalog.amazon_standard_identification_numbers` und Parent/Child-Logik.
2. **Phase 1.2:** `analytics.vendor_performance_metrics` + Cron für ODR/LSR/VTR.
3. **Phase 2.1:** DHL API OAuth und Test-Umgebung einrichten.

Sag einfach, mit welcher Phase du starten willst – dann setze ich sie konkret um (Migrationen, APIs, UI).
