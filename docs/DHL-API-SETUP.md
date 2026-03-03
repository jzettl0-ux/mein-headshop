# DHL Parcel DE Shipping API – Setup

Phase 1 der Marktplatz-Roadmap: Automatische Versandlabel-Erstellung mit DHL, inkl. **VisualCheckOfAge (Alterssichtprüfung 18+)** bei Bestellungen mit 18+ Produkten.

## Voraussetzungen

- DHL Geschäftskundenvertrag (EKP)
- Zugang zum Post & DHL Geschäftskundenportal (GKP): https://geschaeftskunden.dhl.de/
- API-Zugang: https://developer.dhl.com/ → App anlegen, DHL Parcel DE Shipping API hinzufügen

## Konfiguration (.env.local)

| Variable | Beschreibung | Beispiel |
|----------|--------------|----------|
| `DHL_API_KEY` | Client ID (API Key) | Von DHL Developer Portal |
| `DHL_API_SECRET` | Client Secret | Von DHL Developer Portal |
| `DHL_GKP_USERNAME` | GKP-Benutzername | Sandbox: `user-valid` |
| `DHL_GKP_PASSWORD` | GKP-Passwort | Sandbox: `SandboxPasswort2023!` |
| `DHL_BILLING_NUMBER` | 14-stellig (EKP+Produkt+Teilnahme) | `12345678905301` |
| `DHL_SANDBOX` | `true` = Sandbox | `true` |
| `DHL_SHIPPER_NAME` | Absender Firmenname | Aus INVOICE_* oder eigener Wert |
| `DHL_SHIPPER_STREET` | Straßenname | `Musterstraße` |
| `DHL_SHIPPER_HOUSE_NUMBER` | Hausnummer | `42` |
| `DHL_SHIPPER_POSTAL_CODE` | PLZ | `12345` |
| `DHL_SHIPPER_CITY` | Stadt | `Berlin` |
| `DHL_SHIPPER_COUNTRY` | ISO Alpha-3 | `DEU` |
| `DHL_DEFAULT_WEIGHT_KG` | Standard-Gewicht (kg) | `2` |

Fallback: Wenn `DHL_SHIPPER_*` fehlt, werden `INVOICE_COMPANY_*` Werte verwendet.

## Nutzung

1. Admin → Bestellung öffnen
2. Im Bereich „Sendungsverfolgung“ auf **„DHL Label erstellen“** klicken
3. Label wird erzeugt, Tracking-Nummer wird gespeichert, Label-URL öffnet sich in neuem Tab
4. Bei 18+ Bestellungen wird automatisch **VisualCheckOfAge (Alterssichtprüfung 18+)** gebucht

## API-Struktur (Referenz)

Die DHL API erwartet u.a.:
- `valueAddedServices`: `[{ identCheck: { active: true, minimumAge: 18 } }]` für Altersprüfung

Falls die DHL API andere Feldnamen nutzt (z.B. `visualCheckOfAge`), kann `lib/dhl-parcel.ts` entsprechend angepasst werden.

## Sandbox

- URL: `https://api-sandbox.dhl.com/parcel/de/shipping/v2/`
- User: `user-valid`, Passwort: `SandboxPasswort2023!`
- Billing Numbers und Produkte: siehe DHL Developer Portal → API-Dokumentation

## Produktion

- URL: `https://api-eu.dhl.com/parcel/de/shipping/v2/`
- `DHL_SANDBOX` weglassen oder auf `false` setzen
- Echte GKP-Daten und Billing-Nummer verwenden

## Phase 2 – Umgesetzt ✅

| Aufgabe | Status | Beschreibung |
|---------|--------|--------------|
| 2.1 OAuth & Token | ✅ | lib/dhl-parcel.ts: Token-Caching, 2 Min vor Ablauf erneuert |
| 2.2 Label-Generierung | ✅ | POST /shipping/v2/orders, VisualCheckOfAge bei has_adult_items |
| 2.3 Label & Tracking | ✅ | label_url, return_label_url, shipped_at, delivered_at (Cron check-tracking) |
| 2.4 Admin-UI | ✅ | DHL-Label-Button, Label-PDF-Link, Tracking-Link, Zugestellt-Anzeige |

**Cron:** `/api/cron/check-tracking?secret=CRON_SECRET` täglich aufrufen (Vercel Cron oder extern).
