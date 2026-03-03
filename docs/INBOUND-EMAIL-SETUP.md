# E-Mail-Antworten automatisch erfassen (Resend Inbound)

Wenn Nutzer auf Support- oder Beschwerde-E-Mails **antworten**, landen die Antworten automatisch im jeweiligen Chat – vorausgesetzt, du richtest **Resend Inbound** ein.

## Unterstützte Kontexte

1. **Kundenanfragen** (`reply+{Anfrage-ID}@…`) – Support → Kundenservice
2. **Mitarbeiter-Beschwerden** (`beschwerde+{Beschwerde-ID}@…`) – Inhaber/Chef antwortet → Mitarbeiter kann per E-Mail zurückantworten

## Schritte

### 1. Inbound in Resend aktivieren

1. Einloggen auf [resend.com](https://resend.com) → **Receiving** / **Inbound**.
2. **Domain** für eingehende E-Mails hinzufügen (z. B. deine verifizierte Shop-Domain oder die Resend-Inbound-Domain).
3. Notiere die **E-Mail-Adresse**, unter der du E-Mails empfängst (z. B. `reply@inbound.resend.dev` oder `reply@inbound.deine-domain.de`).  
   Daraus ergibt sich die **Domain** (z. B. `inbound.resend.dev`) für die Umgebung.

### 2. Webhook eintragen

1. In Resend bei **Receiving** / **Inbound** die **Webhook-URL** setzen:
   - `https://deine-shop-domain.de/api/webhooks/inbound-email`
2. Webhook-Ereignis: **email.received** (oder das, was Resend dafür vorsieht).

### 3. Umgebungsvariablen setzen

In `.env` (oder Hosting-Umgebung):

```env
# Domain der Inbound-Adresse (nur der Domain-Teil, ohne reply@)
# Beispiele: inbound.resend.dev  oder  inbound.deine-domain.de
RESEND_INBOUND_DOMAIN=inbound.resend.dev

# Optional: lokaler Teil vor dem + für Kundenanfragen (Standard: reply)
# Reply-To: reply+{Anfrage-ID}@RESEND_INBOUND_DOMAIN
RESEND_INBOUND_REPLY_PREFIX=reply

# Optional: für Mitarbeiter-Beschwerden (Standard: beschwerde)
# Reply-To: beschwerde+{Beschwerde-ID}@RESEND_INBOUND_DOMAIN
RESEND_INBOUND_COMPLAINT_PREFIX=beschwerde
```

### 4. Ablauf

**Kundenanfragen:**
- Du antwortest im Admin auf eine Kundenanfrage und schickst die E-Mail **per E-Mail senden**.
- Die App setzt **Reply-To** auf `reply+{Anfrage-ID}@RESEND_INBOUND_DOMAIN`.
- Der Kunde antwortet → seine Antwort landet in `inquiry_messages` und erscheint im Support-Chat.

**Mitarbeiter-Beschwerden:**
- Du antwortest im Admin auf eine Beschwerde und wählst **Antwort per E-Mail senden**.
- Die App setzt **Reply-To** auf `beschwerde+{Beschwerde-ID}@RESEND_INBOUND_DOMAIN`.
- Der Mitarbeiter antwortet auf die E-Mail → seine Nachricht landet in `staff_complaint_messages` und erscheint im Beschwerde-Chat.

### Hinweis

- **RESEND_INBOUND_DOMAIN** muss gesetzt sein, damit Reply-To gesetzt wird und Antworten automatisch zugeordnet werden können.
- Ohne Inbound-Einrichtung werden E-Mail-Antworten **nicht** automatisch im Chat gespeichert.
