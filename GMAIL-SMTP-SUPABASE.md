# Gmail mit Supabase verbinden (kostenlos)

## Warum du aktuell keine anderen E-Mail-Adressen einladen kannst

In der **kostenlosen Supabase-Version** versendet der eingebaute E-Mail-Dienst Auth-Mails (Einladung, Passwort vergessen) **nur an Projekt-Teammitglieder** – nicht an beliebige Adressen. Außerdem gilt ein Limit von etwa **2 E-Mails pro Stunde**.  
Das ist eine Supabase-Einschränkung, keine von unserem Shop-Code.

## Lösung: Eigenes SMTP (z. B. Gmail) – bleibt kostenlos

Wenn du in Supabase einen **eigenen SMTP-Server** einträgst, werden Einladungs- und Passwort-Reset-Mails **über dein Gmail-Konto** verschickt. Dann kannst du **beliebige E-Mail-Adressen** einladen (innerhalb der Gmail-Limits, z. B. 500 Mails/Tag bei normalem Gmail).

- **Supabase:** Custom SMTP ist in allen Plänen inklusive, keine Extra-Kosten.
- **Gmail:** Versand über SMTP ist kostenlos (normales Gmail-Konto reicht).

---

## Gmail als SMTP in Supabase einrichten

### 1. Google: Zwei-Faktor-Authentifizierung (2FA) aktivieren

- Gehe zu [https://myaccount.google.com/](https://myaccount.google.com/)
- Sicherheit → **Zwei-Faktor-Authentifizierung** aktivieren (wird für App-Passwörter vorausgesetzt).

### 2. App-Passwort erstellen

- [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)  
  (oder: Google-Konto → Sicherheit → „App-Passwörter“. Falls der Link fehlt, 2FA zuerst aktivieren.)
- „App auswählen“: z. B. „Mail“ oder „Andere (benutzerdefinierter Name)“ → z. B. „Supabase“.
- Erzeugen → das **16-stellige Passwort** kopieren (ohne Leerzeichen). Das ist dein SMTP-Passwort, nicht dein normales Gmail-Passwort.

### 3. In Supabase eintragen

- Supabase Dashboard → dein **Projekt** → links **Authentication** → **SMTP Settings** (oder **Email Templates** → dort oft der Link zu SMTP).
- **Enable Custom SMTP** aktivieren.
- Eintragen:

| Feld | Wert |
|------|------|
| **Sender email** | Deine Gmail-Adresse (z. B. `deine@gmail.com`) |
| **Sender name** | z. B. `Dein Shop Name` |
| **Host** | `smtp.gmail.com` |
| **Port** | `587` (oder 465) |
| **Username** | Deine Gmail-Adresse (gleich wie Sender email) |
| **Password** | Das 16-stellige **App-Passwort** aus Schritt 2 |

- Speichern und ggf. mit „Send test email“ prüfen.

### 4. Danach

- Einladungen und Passwort-zurücksetzen laufen über Gmail.
- Du kannst Mitarbeiter mit **beliebigen E-Mail-Adressen** einladen (nicht nur Teammitglieder).
- Es gelten die üblichen Gmail-Versandlimits (z. B. 500/Tag bei normalem Gmail).

---

## Wenn du es erstmal lassen willst

Du kannst alles so lassen wie jetzt. Dann:

- Einladungen/Passwort-Reset von Supabase gehen nur an **Supabase-Teammitglieder** (unter Organization Settings → Team).
- Die **Willkommens-Mail** aus unserem Shop (Resend) wird nur versendet, wenn `RESEND_API_KEY` gesetzt ist; sonst entfällt sie.

Sobald du später Gmail (oder einen anderen SMTP) in Supabase einträgst, funktionieren Einladungen an beliebige Adressen ohne Zusatzkosten.
