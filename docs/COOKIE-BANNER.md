# Cookie-Banner (ein Banner)

Es gibt **einen** Cookie-/Consent-Banner im Projekt:

- **Komponente:** `components/consent/ConsentBanner.tsx`
- **Consent-Speicherung:** Cookie `cookie_consent_v3` (Google Consent Mode v2-kompatibel), Logging optional über `/api/consent/log`
- **Öffnen des Modals „Cookie-Einstellungen“:** Über das Custom-Event `OPEN_CONSENT_BANNER_EVENT` aus `lib/consent-v3.ts` (z. B. Footer-Link)

Der Footer-Link **„Cookie-Einstellungen“** nutzt die Komponente `components/cookie-settings-link.tsx`: Er feuert das Event, der ConsentBanner reagiert darauf und öffnet die granularen Einstellungen.

Die alte Komponente `cookie-banner.tsx` (mit `lib/cookie-consent.ts`) wurde entfernt; es wird nur noch ConsentBanner verwendet. Weitere Details zu Consent und Werbung: `docs/COOKIE-CONSENT-WERBUNG.md`.
