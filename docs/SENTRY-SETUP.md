# Sentry Error-Tracking

Sentry ist integriert und optional. Ohne DSN läuft der Shop normal, Fehler werden nicht an Sentry gesendet.

## Aktivierung

1. [sentry.io](https://sentry.io) → Account & Projekt erstellen
2. DSN kopieren (Settings → Client Keys)
3. In `.env.local`:
   ```
   NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
   ```

## Source Maps (Stack Traces lesbar)

Für lesbare Stack Traces in Sentry:

1. Sentry → Settings → Auth Tokens → Create
2. In `.env.local` / Vercel:
   ```
   SENTRY_ORG=dein-org-slug
   SENTRY_PROJECT=dein-projekt-slug
   SENTRY_AUTH_TOKEN=sntrys_...
   ```
3. Beim Build werden Source Maps hochgeladen

## Konfiguration

- **Client:** `sentry.client.config.ts` – Replay (Session Recording), Traces
- **Server:** `sentry.server.config.ts`
- **Edge:** `sentry.edge.config.ts`
- **Global Error:** `app/global-error.tsx` – React Render-Fehler

## Test

Fehler werfen und in Sentry prüfen:

```tsx
<button onClick={() => { throw new Error('Sentry Test') }}>Test</button>
```
