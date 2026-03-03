# Zero-Trust-Administration & RBAC

Ein professioneller Admin-Bereich trennt Kompetenzen strikt und gewährt nur den Zugriff, der für die Rolle nötig ist.

## Grundsätze

- **Keine geteilten Administrator-Accounts**: Jeder Zugang ist einer natürlichen Person zugeordnet (E-Mail, ggf. Staff-Eintrag). Kein gemeinsamer Login wie `admin@firma.de` für mehrere Personen.
- **Role-Based Access Control (RBAC)**: Mitarbeiter sehen und bearbeiten nur das, was ihre Rolle erlaubt (z. B. Support nur Bestellungen/Kundenservice, Produktpflege nur Sortiment, Owner alles inkl. Finanzen/Einstellungen).
- **Identity-Aware Proxies & MFA**: Der Zugang zum Admin wird idealerweise durch einen Identity-Aware Proxy (IAP) geschützt, der **hardwarebasierte MFA** (z. B. YubiKey) verlangt, **bevor** die Login-Maske geladen wird. So wird verhindert, dass gestohlene Passwörter allein ausreichen.

## Rollen im Projekt

| Rolle        | Bestellungen / Service | Produkte / Influencer / Startseite | Marketing (Rabatt, Newsletter) | Lager / Einkauf | Finanzen / Einstellungen / Audit |
|-------------|------------------------|-------------------------------------|--------------------------------|-----------------|-----------------------------------|
| **owner**   | ✓                      | ✓                                   | ✓                              | ✓               | ✓ (nur Owner)                     |
| **chef**    | ✓                      | ✓                                   | ✓                              | ✓               | – (Team-Verwaltung)               |
| **admin**   | ✓                      | ✓                                   | ✓                              | ✓               | –                                |
| **product_care** | –                 | ✓                                   | (Verkauf)                      | –               | –                                |
| **support** | ✓                      | –                                   | –                              | –               | –                                |
| **employee**| ✓                      | –                                   | –                              | –               | –                                |

- **Support** sieht nur Bestelldaten, Stornos, Kundenservice, Feedback, Bewertungen – keine Produktpreise, keine Einstellungen, kein Audit-Log.
- **Marketing**-relevante Bereiche (Rabattcodes, Newsletter, Empfehlungsprogramm) sind aktuell für Owner/Chef/Admin zugänglich; eine eigene Rolle „marketing“ kann bei Bedarf ergänzt werden.
- **Audit-Log** und Finanz-Parameter sind nur für **Owner** zugreifbar.

## Technische Umsetzung

- **`lib/admin-auth.ts`**: Ermittelt User, Staff-Eintrag, Rollen (Owner vs. Staff mit `roles[]`).
- **`lib/admin-permissions.ts`**: `canAccessOrders`, `canAccessProducts`, `canAccessFinances`, `canAccessSettingsOwnerOnly`, `canAccessInventory`, `canSeePurchasePrices` – alle API-Routen und die Sidebar nutzen diese Prüfungen.
- **API-Routen**: Jede Admin-API prüft nicht nur `isAdmin`, sondern die passende Berechtigung (z. B. `canAccessOrders` für Bestellungen, `canAccessProducts` für Produktliste/PATCH, `isOwner` für Audit-Log und Finanzen).
- **Sidebar**: Menüpunkte werden nach Rolle gefiltert; Support sieht z. B. keine Links zu Produkten oder Einstellungen.

## IAP & MFA (Empfehlung)

- **Identity-Aware Proxy**: z. B. Google Cloud IAP oder ein Reverse-Proxy mit OIDC/SAML vor `/admin`. Nur nach erfolgreicher Authentifizierung (inkl. MFA) wird die Anwendung erreichbar.
- **Hardware-MFA**: YubiKey oder vergleichbar als zweiter Faktor für alle Admin-Zugänge. Supabase Auth unterstützt MFA; für strengere Anforderungen MFA vor dem ersten Aufruf von `/admin` (z. B. über IAP) vorschalten.
- **Umgebungsvariable**: Optional z. B. `ADMIN_MFA_REQUIRED=true` oder Hinweis in der Doku, dass in Produktion MFA verpflichtend sein soll.
