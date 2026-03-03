# Reihenfolge der Migrationen (frische DB)

Für eine **komplett frische Datenbank** zuerst die Basis ausführen, danach die Migrationen in der unten stehenden Reihenfolge. Welche Basis du nimmst, hängt davon ab, ob du Seed-Daten willst:

- **Mit Seed (Influencer + Produkte):** `KOMPLETTES-RESET.sql`
- **Ohne Seed (leere Tabellen):** `schema.sql`

Anschließend **unbedingt** `site-settings.sql` ausführen (legt Tabelle `site_settings` und Standard-Keys an). Viele Migrationen und die App lesen daraus (z. B. `logo_url`, `newsletter_test_email`).

Danach die Migrationen **in dieser Reihenfolge** ausführen (Abhängigkeiten eingehalten):

## 1. Basis (eine davon)

- `KOMPLETTES-RESET.sql` **oder** `schema.sql`
- `site-settings.sql`

## 2. Kern-Tabellen (ohne Abhängigkeit untereinander)

1. `migration-connectors-suppliers-integrations.sql` – suppliers, integrations, products.supplier_id
2. `migration-rabatte-bestseller.sql` – discount_codes
3. `migration-staff.sql` – staff
4. `migration-audit-logs.sql` – audit_logs
5. `migration-invoice-email.sql` – orders (invoice_url, discount_code, discount_amount)
6. `migration-cost-price.sql` – products.cost_price
7. `migration-products-brand.sql` – products.brand
8. `migration-products-is-active.sql` – products.is_active
9. `migration-homepage-influencers.sql` – influencers Spalten
10. `migration-homepage-categories.sql` – homepage_categories
11. `migration-homepage-categories-hex.sql` – homepage_categories hex

## 3. Staff erweitern

12. `migration-staff-roles-extended.sql`
13. `migration-staff-multi-roles.sql`
14. `migration-staff-profile-and-complaints.sql`

## 4. Orders erweitern

15. `migration-orders-status-extended.sql`
16. `migration-orders-mollie-payment-id.sql`
17. `migration-orders-tracking.sql`
18. `migration-orders-assigned-to.sql`
19. `migration-orders-assigned-and-processing.sql`
20. `migration-orders-cancellation-request.sql`
21. `migration-orders-return-request.sql`
22. `migration-orders-return-shipping.sql`
23. `migration-orders-return-shipping-options.sql`
24. `migration-orders-return-carrier-preference.sql`
25. `migration-orders-request-status-and-items.sql` – order_request_items
26. `migration-orders-status-rejected.sql`
27. `migration-orders-status-fix-existing.sql`
28. `migration-orders-customer-note.sql`

## 5. Order-Items & Shipments

29. `migration-order-items-status.sql`
30. `migration-request-items-quantity.sql`
31. `migration-order-shipments.sql`

## 6. Produkte & Reviews

32. `migration-products-supplier-mapping.sql`
32a. `migration-product-subcategories.sql` – product_subcategories, products.subcategory_slug
33. `migration-stock-reservations.sql`
34. `migration-product-reviews.sql`
35. `migration-product-reviews-private.sql`
36. `migration-product-reviews-display-name.sql`
37. `migration-product-reviews-moderation.sql`
38. `migration-shop-reviews.sql` – shop_reviews (allgemeine + Google-Bewertungen)

## 7. Influencer, Loyalty, Referrals, Kunden

38. `migration-influencer-portal.sql` – discount_codes.influencer_id, influencer_clicks, payouts, code_requests
39. `migration-loyalty.sql`
40. `migration-loyalty-enabled.sql` (falls vorhanden)
41. `migration-loyalty-min-order-discount.sql` (falls vorhanden)
42. `migration-referrals.sql`
43. `migration-customer-addresses.sql`
44. `migration-customer-inquiries.sql`
45. `migration-inquiry-messages.sql`

## 8. Lieferanten & Bestand

46. `migration-suppliers-extended-fields.sql`
47. `migration-suppliers-manual-fields.sql`
48. `migration-supplier-products.sql`
49. `migration-dropship-suppliers-submissions.sql`
50. `migration-order-paid-decrement-stock.sql` (falls vorhanden)
51. `migration-order-cancel-restore-stock.sql` (falls vorhanden)
52. `migration-inventory-refunds.sql`

## 9. Finanzen & Ausgaben

53. `migration-finance-settings.sql`
54. `migration-finance-settings-fix-columns.sql`
55. `migration-expenses-table.sql`
56. `migration-expenses-invoice-pdf.sql`
57. `migration-expenses-date.sql` – expense_date für tagesgenaue Ausgaben
58. `migration-purchases-procurement.sql` – Einkäufe (purchases, purchase_items) für Procurement & Expense
59. `migration-purchases-bundle.sql` – Bundle-Einkauf (Stück pro Bundle, default_bundle_size am Produkt)
60. `migration-purchase-receive-tracking.sql` – purchase_items.quantity_received für Wareneingang-Workflow (Einkauf → Lager → Wareneingang buchen)

## 10. Weitere Features (optional je nach Nutzung)

60. `migration-influencer-assets.sql`
59. `migration-seasonal-events.sql` – **optional**
60. `migration-newsletter.sql`
61. `migration-watermark-settings.sql` – **optional**
62. `migration-site-assets-logo.sql` – Storage + site_settings logo_url
63. `migration-mollie-webhook-log.sql`
64. `migration-consent-logs.sql`
65. `migration-server-event-logs.sql`
66. `migration-audit-logs-gobd-append-only.sql` – **optional** (GOBD)
67. `migration-security-audit-logs.sql` – **optional**
68. `migration-products-newsletter-badges.sql`
69. `migration-products-reference-price-30d.sql`

---

**Hinweis:** Wenn du Supabase CLI mit `supabase migration up` nutzt, werden Migrationen aus dem Ordner `supabase/migrations/` automatisch in alphabetischer/zeitlicher Reihenfolge ausgeführt. Diese Liste ist für das **manuelle** Ausführen im SQL-Editor (z. B. nach KOMPLETTES-RESET) oder für ein eigenes Skript gedacht. Bei abweichender Ordnerstruktur die Abhängigkeiten (REFERENCES, ALTER TABLE) aus den Dateien beachten.
