# Cookie-Consent & Werbung (DSGVO/DDG)

**Ein Banner:** Es gibt nur eine Banner-Komponente, siehe [COOKIE-BANNER.md](./COOKIE-BANNER.md).

Wenn du Werbung für den Shop schaltest (z. B. Google Ads, Facebook/Meta Pixel, TikTok), müssen Nutzer **vor** dem Setzen von Marketing-Cookies zustimmen. Das Cookie-Banner und die Cookie-Einstellungen sind dafür vorbereitet.

## Was umgesetzt ist

- **Banner** (beim ersten Besuch): „Wir nutzen Cookies …“ mit **Akzeptieren**, **Opt out** (nur Essential) und **Cookie-Einstellungen** (öffnet Modal).
- **Modal „Cookie-Einstellungen“**:
  - **Essential**: immer an (Warenkorb, Anmeldung) – nicht abschaltbar.
  - **Analytics & Marketing**: Opt-in (Standard: aus). Wenn an: Nutzungsdaten für Verbesserung und für Marketing/Werbezwecke.
- **Footer**: Link **Cookie-Einstellungen** – öffnet das Modal jederzeit.
- **Speicherung**: `localStorage` unter dem Schlüssel `cookie-consent` (Struktur: `essential`, `analyticsMarketing`, `date`).

## Nutzung der Einwilligung im Code

**Nur wenn der Nutzer „Analytics & Marketing“ zugestimmt hat**, dürfen z. B. Tracking-Pixel oder Werbe-Skripte geladen werden.

Beispiel (Client, z. B. in einer Komponente oder in `useEffect`):

```ts
import { mayUseAnalyticsMarketing } from '@/lib/cookie-consent'

if (mayUseAnalyticsMarketing()) {
  // Google Analytics, Google Ads, Meta Pixel, TikTok Pixel etc. hier laden
  // z. B. window.gtag(...) oder ein Script-Tag dynamisch einfügen
}
```

Wichtig: Skripte für Werbung/Analytics **nicht** im HTML vorladen, sondern erst nach Prüfung von `mayUseAnalyticsMarketing()` einbinden. So bleibt die Einwilligung wirksam (Opt-in vor dem Setzen von Marketing-Cookies).

## Event bei Änderung

Nach „Übernehmen“ im Modal wird das Event `cookie-consent-updated` ausgelöst (Detail = neues Consent-Objekt). Du kannst darauf reagieren, um z. B. Skripte nachträglich zu laden oder zu entfernen:

```ts
window.addEventListener('cookie-consent-updated', (e: CustomEvent) => {
  if (e.detail?.analyticsMarketing) {
    // Marketing-Skript laden
  }
})
```

## Datenschutzerklärung

Unter **Datenschutz** (`/privacy`) ist der Abschnitt **Cookies** mit `id="cookies"` versehen – der Link „Mehr erfahren“ im Banner/Modal führt zu `/privacy#cookies`. Dort solltest du die Kategorien (Essential, Analytics & Marketing) und ggf. konkrete Dienste (z. B. Google Ads) beschreiben.
