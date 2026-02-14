# ✅ Production-Checklist - Premium Headshop

## 🚀 Vor dem Go-Live

Diese Checkliste hilft dir, den Shop production-ready zu machen.

---

## 1️⃣ SUPABASE KONFIGURATION

### Datenbank:
- [ ] Schema importiert (`schema.sql`)
- [ ] RLS Policies aktiviert (`admin-rls.sql`)
- [ ] Seed-Data importiert (optional für Testing)
- [ ] Backup-Strategy definiert

### Auth:
- [ ] Admin-Account erstellt (jzettl0@gmail.com)
- [ ] Email-Bestätigung konfiguriert
- [ ] Email-Templates angepasst
- [ ] Password-Reset funktioniert

### Storage:
- [ ] Buckets erstellt (product-images, influencer-images)
- [ ] Storage Policies gesetzt
- [ ] Max-File-Size konfiguriert
- [ ] CDN aktiviert

---

## 2️⃣ UMGEBUNGSVARIABLEN

### Production `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tqjjjnvuuxcqrwxmhgkn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[Dein Key]
NEXT_PUBLIC_SITE_URL=https://deine-domain.com

# Optional:
SUPABASE_SERVICE_ROLE_KEY=[Für Admin-Ops]
STRIPE_SECRET_KEY=[Für Payment]
RESEND_API_KEY=[Für Emails]
```

### Vercel Deployment:
- [ ] Environment Variables gesetzt
- [ ] Production URL konfiguriert
- [ ] Preview Deployments aktiviert

---

## 3️⃣ RECHTLICHES

### Pflichtseiten:
- [x] Impressum (`/impressum`) - ⚠️ MIT ECHTEN DATEN AUSFÜLLEN!
- [x] Datenschutz (`/privacy`) - ⚠️ VON ANWALT PRÜFEN LASSEN!
- [x] AGB (`/terms`) - ⚠️ VON ANWALT PRÜFEN LASSEN!
- [ ] Widerrufsbelehrung erstellen

### DSGVO:
- [ ] Cookie-Banner implementieren (falls Cookies genutzt werden)
- [ ] Datenschutz-Einstellungen
- [ ] Datenexport-Funktion für User
- [ ] Daten-Löschung-Funktion

### Jugendschutz:
- [x] Age-Gate implementiert
- [x] 18+ Kennzeichnung auf Produkten
- [x] DHL Ident-Check bei Versand
- [ ] Jugendschutzbeauftragter benennen (falls nötig)

---

## 4️⃣ PAYMENT-INTEGRATION

### Stripe/PayPal:
- [ ] Account erstellt
- [ ] API-Keys konfiguriert
- [ ] Webhook-Endpoint erstellt
- [ ] Test-Zahlungen durchgeführt
- [ ] Refund-System implementiert

### Rechnungen:
- [ ] PDF-Generation implementiert
- [ ] Automatischer Email-Versand
- [ ] Archivierung

---

## 5️⃣ EMAIL-SYSTEM

### Anbieter wählen:
- [ ] Resend.com (empfohlen)
- [ ] SendGrid
- [ ] Supabase Edge Functions

### Templates erstellen:
- [x] Bestellbestätigung (Vorlage in `lib/email-templates.ts`)
- [x] Versandbestätigung (Vorlage vorhanden)
- [ ] Passwort-Reset
- [ ] Willkommens-Email

### Testen:
- [ ] Test-Email versenden
- [ ] Spam-Score prüfen
- [ ] Mobile-Ansicht testen

---

## 6️⃣ CONTENT & DATEN

### Produkte:
- [ ] Alle Store-Produkte angelegt
- [ ] Hochwertige Produktfotos
- [ ] SEO-optimierte Beschreibungen
- [ ] Korrekte Preise & Stock
- [ ] 18+ Kennzeichnung korrekt

### Influencer:
- [ ] Alle Partner angelegt
- [ ] Verträge/Vereinbarungen
- [ ] Provision-System (falls nötig)
- [ ] Social-Media Abstimmung

### Bilder:
- [ ] Zu Supabase Storage hochladen
- [ ] WebP-Format für Performance
- [ ] Verschiedene Größen (responsive)
- [ ] Alt-Texte für SEO

---

## 7️⃣ SEO & PERFORMANCE

### Meta-Tags:
- [x] Title & Description (in layout.tsx)
- [x] Sitemap.xml (`/sitemap.xml`)
- [x] Robots.txt (`/robots.txt`)
- [x] Manifest.json (`/manifest.json`)
- [ ] Open Graph Images
- [ ] Twitter Cards

### Performance:
- [ ] Bilder optimiert (Next.js Image)
- [ ] Lazy Loading aktiviert
- [ ] Code-Splitting geprüft
- [ ] Lighthouse-Score > 90
- [ ] Core Web Vitals optimiert

### SEO:
- [ ] Strukturierte Daten (JSON-LD)
- [ ] Canonical URLs
- [ ] Meta-Beschreibungen für alle Seiten
- [ ] Alt-Texte für alle Bilder
- [ ] Interne Verlinkung

---

## 8️⃣ SICHERHEIT

### SSL/HTTPS:
- [ ] SSL-Zertifikat aktiv (automatisch bei Vercel)
- [ ] HTTPS erzwungen
- [ ] HSTS-Header gesetzt

### Auth:
- [x] Supabase Auth implementiert
- [x] Admin-Protection aktiv
- [x] RLS Policies gesetzt
- [ ] Rate-Limiting für Login
- [ ] CAPTCHA bei Registration (optional)

### Daten:
- [ ] Sensitive Daten verschlüsselt
- [ ] Keine API-Keys im Frontend
- [ ] CORS korrekt konfiguriert
- [ ] XSS-Protection

---

## 9️⃣ TESTING

### Funktional:
- [ ] Age-Gate funktioniert
- [ ] Shop-Funktionen (Filter, Suche)
- [ ] Warenkorb & 18+ Logik
- [ ] Checkout-Prozess
- [ ] Bestellungen in Account
- [ ] Admin-Panel CRUD

### Browser:
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari
- [ ] Mobile Chrome

### Devices:
- [ ] Desktop (1920px+)
- [ ] Laptop (1366px)
- [ ] Tablet (768px)
- [ ] Mobile (375px)

### Performance:
- [ ] Lighthouse-Audit
- [ ] PageSpeed Insights
- [ ] WebPageTest
- [ ] Load-Time < 3s

---

## 🔟 DEPLOYMENT

### Vercel (Empfohlen):
- [ ] GitHub-Repository erstellt
- [ ] Code gepusht
- [ ] Vercel-Account verbunden
- [ ] Projekt importiert
- [ ] Environment Variables gesetzt
- [ ] Domain konfiguriert
- [ ] SSL aktiv
- [ ] Preview-Deployments testen

### Custom Domain:
- [ ] Domain gekauft
- [ ] DNS konfiguriert
- [ ] SSL-Zertifikat
- [ ] Email-Setup (support@deine-domain.de)

---

## 1️⃣1️⃣ ANALYTICS & MONITORING

### Analytics:
- [ ] Google Analytics / Plausible
- [ ] Conversion-Tracking
- [ ] E-Commerce-Tracking
- [ ] Event-Tracking

### Monitoring:
- [ ] Error-Tracking (Sentry)
- [ ] Uptime-Monitoring
- [ ] Performance-Monitoring
- [ ] Log-Aggregation

---

## 1️⃣2️⃣ MARKETING & LAUNCH

### SEO:
- [ ] Google Search Console
- [ ] Bing Webmaster Tools
- [ ] XML-Sitemap eingereicht

### Social Media:
- [ ] Instagram Business Account
- [ ] TikTok-Profil
- [ ] Facebook-Seite (optional)
- [ ] Link-in-Bio Setup

### Launch:
- [ ] Soft-Launch (Beta-Tester)
- [ ] Influencer informiert
- [ ] Social-Media Posts vorbereitet
- [ ] PR-Strategie

---

## 1️⃣3️⃣ BETRIEB & SUPPORT

### Prozesse:
- [ ] Bestellabwicklung definiert
- [ ] Versand-Prozess dokumentiert
- [ ] Rückgabe-Prozess
- [ ] Support-Email eingerichtet
- [ ] FAQ erstellt

### Team:
- [ ] Admin-Zugriffe vergeben
- [ ] Support-Team geschult
- [ ] Influencer-Onboarding
- [ ] Partner-Kommunikation

---

## 🎯 KRITISCHE PUNKTE vor Go-Live

### ⚠️ UNBEDINGT erledigen:

1. **Impressum mit echten Daten**
   ```
   ❌ Musterdaten
   ✅ Echte Firma, Adresse, HRB
   ```

2. **Datenschutz von Anwalt prüfen**
   ```
   ⚠️ DSGVO-konform?
   ⚠️ Alle Dienste aufgeführt?
   ```

3. **Payment-System aktiv**
   ```
   ❌ Mock-Checkout
   ✅ Echte Zahlungen
   ```

4. **Echte Produktfotos**
   ```
   ❌ Unsplash-Placeholder
   ✅ Eigene Produktfotos
   ```

5. **Email-Versand aktiv**
   ```
   ❌ Keine Emails
   ✅ Bestellbestätigungen automatisch
   ```

6. **Domain & SSL**
   ```
   ❌ localhost
   ✅ https://deine-domain.de
   ```

---

## 📊 LAUNCH-PHASEN

### Phase 1: Soft-Launch (Woche 1)
- [ ] Nur für Influencer & Freunde
- [ ] Feedback sammeln
- [ ] Bugs fixen
- [ ] Prozesse optimieren

### Phase 2: Public Beta (Woche 2-3)
- [ ] Öffentlich zugänglich
- [ ] Limited Products
- [ ] Early-Bird Rabatte
- [ ] Community-Feedback

### Phase 3: Full-Launch (Woche 4+)
- [ ] Komplettes Sortiment
- [ ] Marketing-Kampagne
- [ ] Influencer-Posts
- [ ] PR & Media

---

## 🎉 GO-LIVE READY?

Wenn alle kritischen Punkte (⚠️) erledigt sind:

```bash
# Final Check
npm run build
npm run start

# Production Deployment
git push origin main
# → Automatischer Deploy bei Vercel
```

---

## 📞 SUPPORT & WARTUNG

### Nach dem Launch:
- [ ] Täglich Bestellungen prüfen
- [ ] Wöchentlich Analytics reviewen
- [ ] Monatlich Performance-Audit
- [ ] Regelmäßig Updates einspielen

### Notfall-Kontakte:
- Developer: [Deine Kontaktdaten]
- Hosting: Vercel Support
- Database: Supabase Support
- Payment: Stripe/PayPal Support

---

**Status aktuell:** 🟡 Development-Ready  
**Status Ziel:** 🟢 Production-Ready  

**Fortschritt:** 85% ✅ (15% = Payment + Emails + Rechtliches finalisieren)
