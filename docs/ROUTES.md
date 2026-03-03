# Routen & Canonical URLs

## Auth vs. Login

| Pfad | Rolle | Hinweis |
|------|--------|--------|
| **`/auth`** | **Canonical** | Einzige Anmeldeseite (Login + Registrierung). Middleware leitet unangemeldete Admins hierher (`/auth?redirect=/admin`). |
| `/login` | Client-Redirect | Die Seite `/login` leitet im Client auf `/auth` weiter; Query-Parameter (z. B. `?redirect=/admin`) bleiben erhalten. Kein Server-Redirect, damit `redirect` nicht verloren geht. |

**Empfehlung:** Links immer auf `/auth` setzen. `/login` bleibt für externe Links/Bookmarks erhalten.

---

## Account vs. Profile

| Pfad | Rolle | Hinweis |
|------|--------|--------|
| **`/account`** | **Canonical** | Kundenkonto-Übersicht. Alle internen Links (Header, E-Mails, Checkout) zeigen auf `/account`, `/account/orders`, `/account/loyalty`, `/account/referral`. |
| `/account/orders` | Canonical | Bestellübersicht. |
| `/account/loyalty` | Canonical | Treuepunkte. |
| `/account/referral` | Canonical | Empfehlungsprogramm. |
| `/profile/privacy` | Eigenständig | Datenschutz-Einstellungen (eine Seite, die nur unter `/profile` existiert). Von Account-Seite verlinkt. |
| `/profile/loyalty` | Redirect → `/account/loyalty` | Doppelter Pfad; Next.js-Redirect auf kanonische URL. |
| `/profile/referral` | Redirect → `/account/referral` | Doppelter Pfad; Next.js-Redirect auf kanonische URL. |

**Empfehlung:** Neue Links immer auf `/account` und Unterpfade setzen. `/profile/privacy` bleibt; `/profile/loyalty` und `/profile/referral` leiten auf `/account/*` um.
