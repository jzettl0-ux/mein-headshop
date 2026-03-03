# Vendor-Portal – Konzept & Spezifikation

## 1. Überblick

Das **Vendor-Portal** ist der Login-Bereich für Verkäufer (Vendors) im Marktplatz. Vendors sehen nur ihre eigenen Daten: Bestellungen, Angebote, Umsätze, Dokumente.

| Aspekt | Beschreibung |
|--------|--------------|
| **Zielgruppe** | Vendors mit `kyb_status = 'approved'`, `is_active = true` |
| **Login** | Supabase Auth (wie Admin/Kunde), Einladung per Magic-Link/Passwort-Link |
| **Basis** | `vendor_accounts.user_id` verknüpft `auth.users` mit dem Vendor |
| **URL** | `/vendor/*` (klar getrennt von `/admin`, `/account`) |

---

## 2. User Journey

```
1. Admin lädt Vendor ein („Willkommen senden“) → E-Mail mit Registrierungslink
2. Vendor klickt Link → /auth/set-password (Passwort setzen)
3. Nach Passwort-Set: Redirect zu /vendor (Dashboard)
4. Vendor loggt sich künftig über /auth ein, wird bei /vendor zugewiesen
```

---

## 3. Funktionale Bereiche (Scope)

### Phase 1 (MVP)

| Bereich | Beschreibung | Datenquellen |
|---------|--------------|--------------|
| **Dashboard** | Übersicht: Umsatz, offene Bestellungen, Warnungen | `fulfillment.order_lines`, `vendor_performance_metrics` |
| **Bestellungen** | Eigene Bestellungen (nur vendor-Zeilen), Versandstatus, Tracking | `orders`, `order_items`, `fulfillment.order_lines` |
| **Angebote** | Eigenes Sortiment (Preis, Lager, Aktiv) | `vendor_offers`, `products` |
| **Konto** | Firmenstammdaten (read-only), Kontakt-Adresse | `vendor_accounts` |

### Phase 2 (später)

| Bereich | Beschreibung |
|---------|--------------|
| **Dokumente** | KYB-Dokumente hochladen / Status prüfen |
| **Finanzen** | Umsatzübersicht, Rechnungen, Auszahlungen |
| **Einstellungen** | Bankverbindung, Benachrichtigungen |
| **MCF** | Fulfillment by Platform (falls aktiv) |

---

## 4. Authentifizierung

### Verknüpfung Vendor ↔ User

- `vendor_accounts.user_id` = `auth.users.id`
- Beim Versand der Willkommens-E-Mail wird ggf. ein neuer Auth-User per Invite erstellt und `user_id` gesetzt
- Nur ein User pro Vendor (Phase 1); spätere Erweiterung `vendor_users` möglich

### Auth-Flow

1. **Middleware**: `/vendor/*` erfordert eingeloggten User
2. **lib/vendor-auth.ts**: `getVendorContext()` prüft, ob `vendor_accounts.user_id = auth.uid()` und `kyb_status = 'approved'`, `is_active = true`
3. **Redirect**: Nicht eingeloggt → `/auth?redirect=/vendor`, nicht berechtigt → Fehlerseite oder Kontakt-Hinweis

---

## 5. Routing-Struktur

```
/vendor
├── layout.tsx          # Vendor-Layout, Auth-Check, Sidebar
├── page.tsx            # Dashboard
├── orders/
│   ├── page.tsx        # Bestellliste
│   └── [id]/page.tsx   # Bestelldetail
├── offers/
│   └── page.tsx        # Angebote
├── account/
│   └── page.tsx        # Konto/Stammdaten
└── login/              # optional: dedizierter Login (oder /auth nutzen)
```

---

## 6. API-Struktur

| Route | Methode | Beschreibung |
|-------|---------|--------------|
| `/api/vendor/context` | GET | Liefert `{ vendor, isVendor }` für Client |
| `/api/vendor/dashboard` | GET | KPIs, offene Bestellungen, Warnungen |
| `/api/vendor/orders` | GET | Bestellungen des Vendors (paginiert) |
| `/api/vendor/orders/[id]` | GET | Bestelldetail (nur eigene Zeilen) |
| `/api/vendor/offers` | GET | Eigene Angebote |
| `/api/vendor/offers` | PATCH | Preis/Lager/Bulk-Update (Phase 2) |
| `/api/vendor/account` | GET | Stammdaten (read-only) |

Alle API-Routes nutzen `requireVendor()` / `getVendorContext()`.

---

## 7. Berechtigungen (Zugriffskontrolle)

- **RLS**: Bereits vorhanden – Vendor sieht nur `WHERE vendor_accounts.user_id = auth.uid()`
- **API**: Jede Route filtert nach `vendor_id` aus `getVendorContext()`
- **Kein Admin-Zugriff**: Vendors haben keinen Zugriff auf `/admin`

---

## 8. UI/UX

- Eigenes Layout (Sidebar/Nav), optisch an Admin angelehnt, aber reduzierter
- Dunkles Theme (luxe-charcoal, luxe-gold) wie Shop
- Responsive, mobile-tauglich

---

## 9. Technische Abhängigkeiten

| Komponente | Status |
|------------|--------|
| `vendor_accounts.user_id` | ✅ Vorhanden |
| RLS Policies (Vendor SELECT) | ✅ Vorhanden |
| `lib/vendor-invite-link.ts` | ✅ Vorhanden |
| `lib/send-vendor-email.ts` | ✅ Vorhanden |
| Middleware /auth Redirect | ✅ Erweitern um /vendor |
| `/auth/set-password` Redirect | Anpassen: nach Set → /vendor wenn Vendor |

---

## 10. Offene Punkte

- [ ] Mehrere Benutzer pro Vendor (`vendor_users`)?
- [ ] Vendor darf Angebote selbst bearbeiten (Preis/Lager) – Phase 2
- [ ] E-Mail-Benachrichtigungen bei neuen Bestellungen
- [ ] Mollie Connect für Vendor-Auszahlungen (Split-Payments)
