# Passwort vergessen – Sicherheit (OWASP/NIST 2024)

Passwort-Reset ist für **Mitarbeiter** (`/login`) und **Kunden** (`/auth`) umgesetzt und folgt aktuellen Sicherheitsempfehlungen.

## Umgesetzte Maßnahmen

### 1. Rate-Limiting (OWASP)
- **Pro IP:** max. 5 Anfragen pro 15 Minuten
- **Pro E-Mail:** max. 2 Anfragen pro Stunde (gegen E-Mail-Flooding)
- Bei Überschreitung: HTTP 429 mit `Retry-After`-Header

### 2. CAPTCHA (reCAPTCHA v2)
- Wenn `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` und `RECAPTCHA_SECRET_KEY` gesetzt sind, muss vor dem Absenden die Sicherheitsprüfung bestanden werden.
- Schutz vor automatisierten Anfragen (Bots).

### 3. Keine Account-Enumeration (OWASP)
- Einheitliche Antwort: *"Falls ein Konto mit dieser E-Mail existiert, wurde eine E-Mail gesendet."*
- **Einheitliche Antwortzeit** (mind. 1,5 s), damit Angreifer nicht per Timing erkennen können, ob die E-Mail existiert.

### 4. Sichere Tokens (Supabase)
- Reset-Link wird serverseitig mit Supabase `generateLink` (type: recovery) erzeugt.
- Token ist einmalig und zeitlich begrenzt (Supabase-Standard).

### 5. Referrer-Policy (OWASP)
- Auf den Seiten **Passwort setzen** (`/login/set-password`, `/auth/set-password`) wird `Referrer-Policy: no-referrer` gesetzt, um Referrer-Leakage zu vermeiden.

### 6. Passwortrichtlinie (NIST 2024)
- Mindestlänge 8 Zeichen (Supabase-Standard), Empfehlung 12+ Zeichen im UI.
- Kein automatisches Login nach Reset: Nutzer meldet sich mit neuem Passwort an (Staff → /admin, Kunden → /auth).

### 7. E-Mail-Versand
- Reset-E-Mail wird über **Resend** versendet (nur serverseitig), nicht über Supabase-Standard-Mail.
- So liegt das Rate-Limiting bei uns; bei fehlendem Resend greift für Staff/Kunden ein Fallback auf den Supabase-Client (ohne unser Rate-Limit).

## Konfiguration

- **Resend:** `RESEND_API_KEY` und `RESEND_FROM_EMAIL` für den Versand der Reset-Mail (siehe `.env.local.example`).
- **reCAPTCHA:** optional, siehe `RECAPTCHA-SETUP.md`.
- **Supabase Redirect URLs:** In Supabase Dashboard → Authentication → URL Configuration folgende URLs eintragen:
  - `https://deine-domain.de/login/set-password`
  - `https://deine-domain.de/auth/set-password`
  - Für Lokal: `http://localhost:3000/login/set-password`, `http://localhost:3000/auth/set-password`

## Hinweis zu Sicherheitsfragen (NIST/OWASP)

Sicherheitsfragen („Name der ersten Lehrerin?“) gelten heute als **unsicher** (NIST hat sie als Authentifizierungsmethode abgelehnt). Stattdessen werden u. a. Rate-Limiting, CAPTCHA und E-Mail-Token mit kurzer Gültigkeit empfohlen – alles hier umgesetzt.

## Produktion: Rate-Limiting mit Redis (optional)

Der eingebaute Rate-Limiter ist **in-memory** (pro Server-Instanz). Bei mehreren Instanzen (z. B. Vercel) sollte ein gemeinsamer Store (z. B. **Upstash Redis** / Vercel KV) genutzt werden. Siehe z. B. `@upstash/ratelimit` und Anpassung in `lib/rate-limit.ts`.
