# 💳 Payment-Integration Guide - Mollie

## ✅ Was wurde vorbereitet:

### 1. **Mollie SDK installiert**
```bash
✅ @mollie/api-client installiert
✅ API Key in .env.local gespeichert
```

### 2. **Payment-Funktionen erstellt**
```typescript
lib/mollie.ts
- createMolliePayment() → Zahlung erstellen
- getMolliePaymentStatus() → Status prüfen
```

### 3. **API Routes erstellt**
```typescript
/api/payment/create → Payment initiieren
/api/payment/webhook → Status-Updates von Mollie
/api/orders/send-confirmation → Email-Versand
```

### 4. **Email-Template vorhanden**
```typescript
lib/email-templates.ts
- Bestellbestätigung (HTML)
- Versandbestätigung (HTML)
```

---

## 🚀 WIE ES JETZT FUNKTIONIERT:

### Aktuell (Development):
```
Checkout → Bestellung erstellen → Direkt bestätigt
✅ KEIN echtes Payment
✅ Bestellung wird direkt gespeichert
✅ Email-Log in Console
```

### Mit Mollie (Production):
```
Checkout 
→ Bestellung erstellen (status: pending)
→ Mollie Payment erstellen
→ User zu Mollie weiterleiten
→ User bezahlt
→ Mollie Webhook sendet Status
→ Order auf "paid" setzen
→ Email-Bestätigung versenden
```

---

## 🔧 AKTIVIERUNG (Für später):

### Schritt 1: Checkout mit Mollie verbinden

In `app/(main)/checkout/page.tsx` nach Zeile 116 (nach Order-Creation):

```typescript
// OPTIONAL: Mollie Payment aktivieren
const paymentResponse = await fetch('/api/payment/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderNumber,
    amount: total,
    customerEmail: user.email,
  }),
})

const paymentData = await paymentResponse.json()

if (paymentData.success) {
  // Redirect zu Mollie Checkout
  window.location.href = paymentData.checkoutUrl
} else {
  // Fallback: Bestellung ohne Payment
  router.push(`/order-confirmation?order=${orderNumber}`)
}
```

### Schritt 2: Webhook-URL in Mollie Dashboard

```bash
1. Gehe zu: https://www.mollie.com/dashboard
2. Settings → Webhooks
3. Füge hinzu: https://deine-domain.com/api/payment/webhook
```

### Schritt 3: Email-Service aktivieren

**Option A: Resend (Empfohlen)**
```bash
npm install resend

# .env.local
RESEND_API_KEY=re_...
```

**Option B: SendGrid**
```bash
npm install @sendgrid/mail

# .env.local
SENDGRID_API_KEY=SG...
```

**Option C: Supabase Edge Functions**
```bash
# Nutze Supabase's eigene Functions
# Siehe: https://supabase.com/docs/guides/functions
```

---

## 📧 EMAIL-BESTÄTIGUNG (Aktuell)

### Was passiert jetzt:
```typescript
// Nach erfolgreicher Bestellung:
1. fetch('/api/orders/send-confirmation')
2. Email-HTML wird generiert
3. ✅ Wird in Console geloggt (Development)
4. ⏳ Kein echter Email-Versand (noch)
```

### Aktivierung:
In `app/api/orders/send-confirmation/route.ts` entkommentieren:

```typescript
// Resend-Beispiel:
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

const { data, error } = await resend.emails.send({
  from: 'Premium Headshop <noreply@premium-headshop.de>',
  to: order.customer_email,
  subject: `Bestellbestätigung #${order.order_number}`,
  html: emailHtml,
})
```

---

## 🧪 TESTEN (Development)

### Test 1: Bestellung ohne Payment
```bash
1. Checkout durchführen
✅ Bestellung wird direkt erstellt
✅ Status: "pending"
✅ Redirect zu Bestätigung
✅ Console zeigt: "📧 Email würde versendet"
```

### Test 2: Mit Mollie (Test-Mode)
```bash
# Nachdem du Mollie aktiviert hast:
1. Checkout
2. → Redirect zu Mollie
3. Test-Zahlung (keine echte Karte nötig)
4. → Redirect zurück
5. ✅ Status: "paid"
```

---

## 💰 MOLLIE CONFIGURATION

### Test vs Production:

**Test-Modus (Aktuell):**
```env
MOLLIE_API_KEY=test_Rpxf9zDuwjy5Keb3shffDT28wKhjH9
→ Keine echten Zahlungen
→ Test-Zahlungen möglich
→ Kostenlos testen
```

**Live-Modus (Production):**
```env
MOLLIE_API_KEY=live_...
→ Echte Zahlungen
→ Gebühren: 1,29% + 0,29€ pro Transaktion
→ Auszahlung auf Bankkonto
```

---

## 📊 PAYMENT-FLOW

### Komplett mit Mollie:
```
1. User: Checkout ausfüllen
   ↓
2. App: Bestellung in DB erstellen (pending)
   ↓
3. App: Mollie Payment erstellen
   ↓
4. App: User zu Mollie redirecten
   ↓
5. User: Bezahlt mit iDEAL/Karte/etc
   ↓
6. Mollie: Webhook an App senden
   ↓
7. App: Order-Status auf "paid" setzen
   ↓
8. App: Bestätigungs-Email versenden
   ↓
9. User: Redirect zu Success-Page
   ↓
10. ✅ Fertig!
```

---

## 🎯 WAS JETZT FUNKTIONIERT:

### Automatisch nach jeder Bestellung:
1. ✅ **Order-Confirmation API wird aufgerufen**
2. ✅ **Email-HTML wird generiert**
3. ✅ **Console-Log** (Development)
4. ⏳ **Echter Email-Versand** (nach Resend-Setup)

### Success-Page:
- ✅ `/payment/success` Seite erstellt
- ✅ Loading-Animation
- ✅ Success-Feedback
- ✅ Bestellnummer angezeigt

---

## 🔜 NÄCHSTE SCHRITTE (Optional):

### Für echte Emails:
```bash
1. npm install resend
2. Account bei resend.com erstellen
3. API Key holen
4. In .env.local einfügen
5. Code in send-confirmation/route.ts entkommentieren
6. ✅ Emails werden versendet!
```

### Für Live-Payment:
```bash
1. Mollie-Account verifizieren
2. Live API Key holen
3. Webhook-URL setzen
4. In Checkout: Mollie-Integration aktivieren
5. ✅ Echte Zahlungen möglich!
```

---

## 📁 Neue Dateien:

```
premium-headshop/
├── lib/
│   └── mollie.ts                           ← NEU! Mollie-Client
├── app/api/
│   ├── payment/
│   │   ├── create/route.ts                 ← NEU! Payment erstellen
│   │   └── webhook/route.ts                ← NEU! Status-Updates
│   └── orders/
│       └── send-confirmation/route.ts      ← NEU! Email-Versand
└── app/(main)/payment/
    └── success/page.tsx                    ← NEU! Success-Page
```

---

## ✅ STATUS:

**Bestellbestätigung:** ✅ Automatisch (Console-Log)  
**Email-Template:** ✅ Vorhanden  
**Mollie-Integration:** ✅ Vorbereitet  
**API-Routes:** ✅ Funktionsfähig  

**Email-Versand:** ⏳ Aktivierung mit Resend nötig  
**Live-Payment:** ⏳ Aktivierung in Checkout nötig  

---

## 🎉 WAS DU JETZT HAST:

Nach jeder Bestellung:
```bash
✅ Bestellung wird in DB gespeichert
✅ API wird aufgerufen
✅ Email-HTML wird generiert
✅ Console zeigt: "📧 Email würde versendet"
✅ Alle Daten bereit für Email-Service
```

---

## 💡 TESTE JETZT:

```bash
1. Checkout durchführen
2. Öffne Browser Console (F12)
3. Nach Bestellung siehst du:
   "📧 Email würde versendet an: user@email.com"
   "Bestellnummer: ORD-..."
✅ Email-System funktioniert!
```

---

## 📞 FÜR PRODUCTION:

Wenn du live gehst:
1. Resend-Account erstellen (10€/Monat)
2. API Key in `.env.local`
3. Code entkommentieren
4. ✅ Emails werden automatisch versendet!

---

**Teste jetzt den Checkout und schau in die Console!** 🚀

Die Bestellbestätigung wird automatisch getriggert! 📧