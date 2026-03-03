# Blueprint Vollständige Umsetzung – Reihenfolge & Status

> Alle Blueprint-Teile 3–15 als Migrations und Module für mein-headshop.

**→ Master (alle Teile konsolidiert):** [BLUEPRINT-MASTER.md](./BLUEPRINT-MASTER.md)  
**→ Abarbeitung nach Phasen:** [BLUEPRINT-PHASEN-PLAN.md](./BLUEPRINT-PHASEN-PLAN.md) (Phasen 0–15, Migrations + APIs/UI)

---

## Migrations-Reihenfolge (Supabase SQL Editor)

Führe die Dateien in dieser Reihenfolge aus:

```
1. migration-blueprint-gamification.sql      # Teil 4: Vault, Loyalty, Price Lock, Drop-Radar
2. migration-blueprint-community-split.sql   # Teil 5: UGC, Split Payment
3. migration-blueprint-enforcement.sql       # Teil 6: RFS, ASIN Locks
4. migration-blueprint-financials-infra.sql  # Teil 7+8: Blended Shipping, Reserve, EPR, FBT, Dayparting, SOR
5. migration-blueprint-deep-tech.sql         # Teil 9: De-Dup, Risk AVS, Payout, Live-Streams, 3D Bin-Packing
6. migration-cx-a2z-sla-ext.sql              # A2Z 48h-SLA Spalten
7. migration-gamification-gated-category-ext.sql  # Optional: Secret Shop Spalte
8. migration-gated-categories-min-loyalty-tier.sql  # Fallback falls Spalte fehlt
9. migration-blueprint-grants.sql            # Berechtigungen

10. migration-blueprint-teil-10-marketing-b2b-security.sql  # Teil 10: Attribution, Messaging, Hazmat, RFQ, A/B
11. migration-blueprint-teil-11-power-user.sql              # Teil 11: Project Zero, NCX, Off-Platform, Brand Analytics
12. migration-blueprint-teil-12-margins-fraud.sql           # Teil 12: Returnless, Vendor Flex, Buyer Fraud, Factoring
13. migration-blueprint-teil-13-15-ux-state-ui.sql          # Teil 13–15: 1-Click, Replenishment, Cart, Facets, Funnel
14. migration-blueprint-teil-11-15-supplement.sql           # IPI, 3D-Assets, A+ Module Types
15. migration-blueprint-teil-10-12-supplement.sql           # Strike-Log, Messaging-SLA, RFQ 48h, Promo is_active, OTP
```

---

## Implementierungs-Status

### Teil 3: Advanced Operations & B2B (bereits vorhanden)

| Feature | Tabelle/Modul | Status |
|---------|---------------|--------|
| Transparency | security.transparency_codes | ✅ |
| B2B Guided Buying | b2b.purchasing_policies, order_approvals | ✅ |
| Product Recalls | compliance.product_recalls | ✅ |
| SAFE-T Claims | seller_services.safet_claims | ✅ |
| Product Guidance | analytics.search_term_gaps | ✅ |

### Teil 4: Gamification (Schema neu)

| Feature | Tabelle | Status |
|---------|---------|--------|
| 4:20 Vault | gamification.vault_drops | ✅ Migration |
| User Clipped Vouchers | gamification.user_clipped_vouchers | ✅ Migration |
| Loyalty Tiers | gamification.loyalty_tiers | ✅ Migration |
| Price Lock | gamification.price_locks | ✅ Migration |
| Drop-Radar | gamification.drop_radar_subscriptions | ✅ Migration |
| Secret Shop | admin.gated_categories.min_loyalty_tier_required | ✅ Migration + Admin UI + Shop-Filter |

### Teil 5: Social Commerce (Schema neu)

| Feature | Tabelle | Status |
|---------|---------|--------|
| UGC Posts (Rate my Setup) | community.ugc_posts | ✅ Migration |
| UGC Hotspots | community.ugc_hotspots | ✅ Migration |
| Split Payment | checkout.split_payments | ✅ Migration |
| Split Participants | checkout.split_payment_participants | ✅ Migration |

### Teil 6: Enforcement (Schema neu)

| Feature | Tabelle | Status |
|---------|---------|--------|
| RFS vs. Hygiene | enforcement.return_inspections_ext | ✅ Migration |
| ASIN Locks (Anti Review-Hijacking) | enforcement.asin_locks | ✅ Migration |

### Teil 7: Financial Security (Schema neu)

| Feature | Tabelle | Status |
|---------|---------|--------|
| Blended Shipping | advanced_financials.blended_shipping_rules | ✅ Migration |
| Account Reserve | advanced_financials.account_reserves | ✅ Migration |
| Percolate Rules | catalog_defense.percolate_rules | ✅ Migration |
| External Prices (Buy Box Suppression) | catalog_defense.external_prices | ✅ Migration |

### Teil 8: Infrastructure (Schema neu)

| Feature | Tabelle | Status |
|---------|---------|--------|
| EPR Registrations | infrastructure.epr_registrations | ✅ Migration |
| Frequently Bought Together | infrastructure.frequently_bought_together | ✅ Migration |
| PPC Dayparting | infrastructure.campaign_schedules | ✅ Migration |
| Smart Order Routing | infrastructure.smart_order_routing_logs | ✅ Migration |

### Teil 9: Deep Tech (Schema neu)

| Feature | Tabelle | Status |
|---------|---------|--------|
| Catalog Duplicates | deep_tech.catalog_duplicates | ✅ Migration |
| Risk Evaluations | deep_tech.risk_evaluations | ✅ Migration |
| Payout Batches | deep_tech.payout_batches | ✅ Migration |
| Live Streams | deep_tech.live_streams | ✅ Migration |
| Live Stream Products | deep_tech.live_stream_products | ✅ Migration |
| Standard Boxes | deep_tech.standard_boxes | ✅ Migration |
| Order Packaging Plans | deep_tech.order_packaging_plans | ✅ Migration |

---

## APIs (bereits angelegt)

- `GET /api/vault-drops` – aktive 4:20 Vault Drops
- `POST /api/drop-radar/subscribe` – Warteliste für Restock
- `POST /api/price-lock` – Preis einfrieren, Checkout-Link
- `GET /api/price-lock/[token]` – Price Lock abrufen
- `GET /api/products/[id]/frequently-bought-together` – FBT-Produkte
- `GET /api/shop/loyalty-gated-categories` – Secret Shop: Kategorien mit Tier-Anforderung
- `GET /api/split/[token]`, `POST /api/split/[token]/participants`, `POST /api/split/[token]/pay` – Split Payment
- `lib/percolate-compliance.ts` – Pre-Index Compliance-Check
- `lib/blended-shipping.ts` – Blended Shipping Fee

## Cron-Routen

| Route | Beschreibung | Empfohlener Rhythmus |
|-------|--------------|----------------------|
| `GET /api/cron/refresh-fbt?secret=CRON_SECRET` | FBT aus Bestellungen | Täglich 3:00 |
| `GET /api/cron/refresh-asin-locks?secret=CRON_SECRET` | ASIN-Locks (Review-Count) | Täglich 3:30 |
| `GET /api/cron/refresh-vault-drops?secret=CRON_SECRET` | Vault-Drop-Status | Alle 15 Min |
| `GET /api/cron/notify-drop-radar?secret=CRON_SECRET` | Drop-Radar Restock-E-Mails | Alle 30 Min |
| `GET /api/cron/refresh-vendor-metrics?secret=CRON_SECRET` | Vendor-Metriken | Täglich 4:00 |
| `GET /api/cron/check-tracking?secret=CRON_SECRET` | DHL Tracking-Sync | Täglich 8:00 |
| `GET /api/cron/auto-cancel-unpaid?secret=CRON_SECRET` | Storno unbezahlter Bestellungen | Alle 6 Std |

**Hinweis:** Nutze [cron-job.org](https://cron-job.org) oder ähnlich: Vercel Cron sendet keine Query-Parameter. URL mit `?secret=CRON_SECRET` aufrufen.

### Implementiert

- Drop-Radar E-Mail-Versand bei Restock (Cron + Resend) ✅
- Gamified Cart (Loyalty-Tier-Fortschritt, Punkte-Vorschau im Warenkorb) ✅
- Split-Payment-Flow: Checkout-Option „Rechnung teilen“, `/split/[token]`, Teilnehmer hinzufügen, Mollie-Teilzahlungen ✅
- Mollie Refund-Integration (process-return) ✅
- Secret Shop (Loyalty-gated Kategorien, Admin + Shop-Filter) ✅
- **UGC (Rate my Setup):** Community-Galerie unter `/rate-my-setup`, Foto-Upload für eingeloggte Nutzer, Admin-Moderation unter `/admin/ugc`, Shoppable-Hotspots-Anzeige (Hotspots können in späterer Phase hinzugefügt werden) ✅

### Teil 10–15 (Migrations erstellt, APIs/UI noch offen)

| Feature | Schema/Tabelle | Status |
|---------|----------------|--------|
| Brand Referral Bonus | marketing.attribution_campaigns, attribution_events | ✅ Migration |
| Buyer-Seller Messaging | communications.masked_emails, messages | ✅ Migration |
| Hazmat Pipeline | compliance_hazmat.product_safety_data | ✅ Migration |
| B2B RFQ | b2b_negotiation.quote_requests, quote_responses | ✅ Migration |
| A/B Experiments | marketing.ab_experiments, ab_experiment_metrics | ✅ Migration |
| Project Zero | brand_tools.project_zero_takedowns, project_zero_accuracy | ✅ Migration |
| NCX-Score | advanced_analytics.ncx_scores | ✅ Migration |
| Off-Platform Checkout | external_commerce.widget_deployments, off_platform_orders | ✅ Migration |
| Search Frequency Rank | advanced_analytics.search_frequency_rank | ✅ Migration |
| Returnless Refunds | margins.returnless_refund_rules | ✅ Migration |
| Vendor Flex Node | margins.vendor_flex_nodes | ✅ Migration |
| Buyer Fraud Engine | fraud_prevention.buyer_health_scores | ✅ Migration |
| B2B Factoring | b2b_finance.factoring_agreements | ✅ Migration |
| Brand Tailored Promotions | marketing.brand_tailored_promotions | ✅ Migration |
| 1-Click Checkout | customer_profiles.checkout_preferences | ✅ Migration |
| Buy It Again | frontend_ux.replenishment_predictions | ✅ Migration |
| Cart Management | cart_management.shopping_carts, cart_items | ✅ Migration |
| Category Facets | storefront.category_facet_config, facet_predefined_values | ✅ Migration |
| Homepage Layouts | ui_config.homepage_layouts | ✅ Migration |
| Checkout Funnel | funnel_analytics.checkout_dropoffs | ✅ Migration |
| IPI-Score | advanced_logistics.ipi_scores | ✅ Migration (Supplement) |
| 3D/AR Assets | catalog.product_3d_assets | ✅ Migration (Supplement) |
| A+ Module Types | ui_config.aplus_module_types | ✅ Migration (Supplement) |
| Strike-System | communications.strike_log | ✅ Migration (Teil 10–12 Supplement) |
| Messaging-SLA 24h CRT | communications.vendor_messaging_sla | ✅ Migration (Teil 10–12 Supplement) |
| RFQ Token 48h | quote_responses.checkout_token_expires_at | ✅ Migration (Teil 10–12 Supplement) |
| Promo is_active | brand_tailored_promotions.is_active_computed | ✅ Migration (Teil 10–12 Supplement) |
| OTP-Friction | buyer_health_scores.requires_otp_on_delivery | ✅ Migration (Teil 10–12 Supplement) |

---

### Teil 16–21 (Migrations + APIs/UI umgesetzt)

**→ Reihenfolge & Details:** [BLUEPRINT-PHASEN-PLAN.md](./BLUEPRINT-PHASEN-PLAN.md) (Phase 16–21)

| Teil | Schwerpunkt | Status |
|------|--------------|--------|
| **16** | Retail Media (Native Banners, Editorials, Sensory, Brand Boutiques) | ✅ Migration + Admin + API |
| **17** | Legal (PAngV, Geo-Restrictions), CSBA, Launchpad, Market Basket | ✅ Migration + Admin + API |
| **18** | Enterprise (Reimbursements, Warranties, PO, Wave Picking, MAP) | ✅ Migration + Admin + API |
| **19** | PunchOut, CRAP, FEFO Lots, Creator Storefronts, Velocity Anomalies | ✅ Migration + Admin + API |
| **20–21** | Micro-Logistics (Routing, Stranded, SFP, Virtual Bundles, BSR, Badges), Visual Merchandising (Navigation Hubs, Media, Quizzes, Quick View), Product Attributes, Review Requests | ✅ Migration + Admin + API |

Migrations: `migration-blueprint-teil-16-retail-media.sql` … `migration-blueprint-teil-20-21-micro-logistics-visual-merchandising.sql`, `migration-blueprint-teil-20-21-grants.sql`. Siehe Phasen-Plan für vollständige Migrations-Reihenfolge.
