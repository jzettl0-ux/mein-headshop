# Supplier Portal & Tracking – Webhook

Lieferanten können Sendungsnummern an deinen Shop senden. Bei gültigem Webhook wird die Bestellung aktualisiert und der Kunde erhält automatisch eine **Versandbestätigung** per E-Mail (Resend) inkl. Tracking-Link.

## Endpunkt

- **URL:** `POST /api/supplier/tracking`
- **Sicherheit:** `Authorization: Bearer <SUPPLIER_TRACKING_SECRET>` oder Header `X-Supplier-Tracking-Token: <SUPPLIER_TRACKING_SECRET>`
- **Body (JSON):**
  - `order_number` (string) oder `order_id` (string) – Pflicht (eines von beiden)
  - `tracking_number` (string) – Pflicht
  - `tracking_carrier` (string, optional) – z. B. `DHL`, `DPD`, `GLS` (Default: `DHL`)

## Ablauf

1. Lieferant sendet z. B.:
   ```json
   {
     "order_number": "10042",
     "tracking_number": "00340434161234567890",
     "tracking_carrier": "DHL"
   }
   ```
2. Shop prüft Token, sucht Bestellung anhand `order_number` oder `order_id`.
3. Neue Zeile in `order_shipments`, Update von `orders` (tracking_number, tracking_carrier, status → `shipped`).
4. Versand-E-Mail an Kunden-E-Mail mit allen Sendungsnummern und Tracking-Links (DHL/DPD/GLS).

## Konfiguration

In `.env.local` (bzw. Produktion) setzen:

```env
SUPPLIER_TRACKING_SECRET=dein-geheimes-token
```

Dieses Token an Lieferanten weitergeben (z. B. per Passwort-Manager oder sicheren Kanal). Ohne gesetztes Token ist der Endpunkt ohne Auth aufrufbar (nur für Tests geeignet).
