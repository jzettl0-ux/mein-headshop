# reCAPTCHA v2 einrichten (Kontaktformular)

Das Kontaktformular kann mit **Google reCAPTCHA v2** geschützt werden („Ich bin kein Roboter“ + ggf. Bild-Aufgaben). Ohne konfigurierte Keys funktioniert das Formular weiterhin ohne CAPTCHA.

## 1. Keys anlegen

1. Öffne [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin).
2. **+** (Eintrag erstellen).
3. **Titel** z. B. „Mein Headshop Kontakt“.
4. **reCAPTCHA-Typ:** **reCAPTCHA v2** → **„Ich bin kein Roboter“-Checkbox**.
5. **Domains** eintragen:
   - `localhost` (für Entwicklung)
   - deine Produktions-Domain (z. B. `mein-headshop.de`)
6. Speichern. Du erhältst:
   - **Site Key** (öffentlich) → `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
   - **Secret Key** (geheim) → `RECAPTCHA_SECRET_KEY`

## 2. Umgebungsvariablen setzen

In `.env.local` (lokal) bzw. in den Einstellungen deines Hostings (Vercel, etc.):

```env
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Lc...dein-Site-Key...
RECAPTCHA_SECRET_KEY=6Lc...dein-Secret-Key...
```

- **NEXT_PUBLIC_RECAPTCHA_SITE_KEY** wird im Browser geladen (sichtbar).
- **RECAPTCHA_SECRET_KEY** nur auf dem Server verwenden, nie im Frontend.

Nach dem Setzen: Server neu starten (`npm run dev` bzw. Neudeploy).

## 3. Verhalten

- **Ohne Keys:** Kontaktformular sendet wie bisher, keine CAPTCHA-Anzeige.
- **Mit beiden Keys:** Unter dem Nachrichtenfeld erscheint die reCAPTCHA-Box. Nutzer muss „Ich bin kein Roboter“ bestätigen (ggf. Bild-Aufgabe). Erst danach ist „Nachricht senden“ klickbar. Der Token wird beim Absenden an die API geschickt und dort mit Google verifiziert.

## 4. Andere Formulare

Die Komponente `components/recaptcha.tsx` und die Verifizierung in `lib/recaptcha.ts` können auch für andere öffentliche Formulare genutzt werden (z. B. Login, Registrierung), indem du:

1. `<Recaptcha siteKey={...} onVerify={setCaptchaToken} ... />` einbindest,
2. `captcha_token` im Request-Body mitsendest,
3. serverseitig `verifyRecaptcha(body.captcha_token)` aufrufst.

## 5. Content-Security-Policy (CSP)

Falls du eine CSP setzt, müssen erlaubt sein:

- `script-src`: `https://www.google.com` und `https://www.gstatic.com`
- `frame-src`: `https://www.google.com`
