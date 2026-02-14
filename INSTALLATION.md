# 🚀 Vollständige Installation - Premium Headshop

## ⚡ Quick Install (5 Minuten)

### Schritt 1: Dependencies installieren
```bash
npm install
```

### Schritt 2: Auth-Helper installieren
```bash
npm install @supabase/auth-helpers-nextjs
```

### Schritt 3: Umgebungsvariablen
Die `.env.local` ist bereits konfiguriert! ✅

### Schritt 4: Supabase Datenbank einrichten

#### A) Haupt-Schema
1. Öffne https://tqjjjnvuuxcqrwxmhgkn.supabase.co
2. Gehe zu **SQL Editor**
3. Kopiere **ALLES** aus `supabase/schema.sql`
4. Füge ein und klicke **"Run"**
5. Warte auf "Success" ✅

#### B) Test-Daten
1. Im SQL Editor (oder neue Query)
2. Kopiere **ALLES** aus `supabase/seed-data.sql`
3. Füge ein und klicke **"Run"**
4. Warte auf "Success" ✅

#### C) Admin-Sicherheit (RLS)
1. Im SQL Editor (oder neue Query)
2. Kopiere **ALLES** aus `supabase/admin-rls.sql`
3. Füge ein und klicke **"Run"**
4. Warte auf "Success" ✅

### Schritt 5: Admin-Account erstellen

1. Im Supabase Dashboard → **Authentication** → **Users**
2. Klicke **"Add user"** → **"Create new user"**
3. Fülle aus:
   ```
   Email: jzettl0@gmail.com
   Password: [Dein sicheres Passwort]
   Auto Confirm User: ✅ JA
   ```
4. Klicke **"Create user"**

### Schritt 6: App starten
```bash
npm run dev
```

### Schritt 7: Testen! 🎉

```bash
# Homepage
http://localhost:3000

# Admin-Login
http://localhost:3000/login
Email: jzettl0@gmail.com
Passwort: [Dein Passwort]

# Admin-Panel
http://localhost:3000/admin
```

---

## ✅ Installations-Checkliste

Nach der Installation solltest du folgendes haben:

### Node Modules:
- [x] `npm install` ausgeführt
- [x] `@supabase/auth-helpers-nextjs` installiert
- [x] Alle Dependencies installiert

### Supabase Datenbank:
- [x] `schema.sql` importiert (Tabellen)
- [x] `seed-data.sql` importiert (10 Produkte, 3 Influencer)
- [x] `admin-rls.sql` importiert (Sicherheit)

### Admin-Account:
- [x] User `jzettl0@gmail.com` erstellt
- [x] Passwort gesetzt
- [x] Email bestätigt (Auto-Confirm)

### App:
- [x] `.env.local` konfiguriert
- [x] Dev-Server läuft
- [x] Homepage lädt
- [x] Admin-Login funktioniert

---

## 🧪 Test-Checkliste

### 1. Homepage testen:
```bash
✅ http://localhost:3000
- [ ] Age-Gate erscheint
- [ ] Produkte werden angezeigt
- [ ] Bilder laden (Unsplash)
- [ ] Navigation funktioniert
```

### 2. Shop testen:
```bash
✅ http://localhost:3000/shop
- [ ] 10 Produkte sichtbar
- [ ] Filter funktionieren
- [ ] Influencer-Edition Badge sichtbar
- [ ] Produkt-Click öffnet Details
```

### 3. Warenkorb testen:
```bash
✅ Produkt in Warenkorb legen
- [ ] Badge im Header zeigt Anzahl
- [ ] Warenkorb-Seite zeigt Produkt
- [ ] 18+ Logik funktioniert (2€ Gebühr)
- [ ] Menge ändern funktioniert
```

### 4. Influencer testen:
```bash
✅ http://localhost:3000/influencer/max-gruen
- [ ] Landingpage lädt
- [ ] Accent-Color (Neon-Grün) sichtbar
- [ ] Gefilterte Produkte
- [ ] Social-Links funktionieren
```

### 5. Admin-Login testen:
```bash
✅ http://localhost:3000/login
- [ ] Login-Formular wird angezeigt
- [ ] Email: jzettl0@gmail.com eingeben
- [ ] Passwort eingeben
- [ ] "Anmelden" klicken
- [ ] Redirect zu /admin erfolgt
```

### 6. Admin-Panel testen:
```bash
✅ http://localhost:3000/admin
- [ ] Dashboard wird angezeigt
- [ ] Statistiken sichtbar
- [ ] Email oben rechts angezeigt
- [ ] Navigation funktioniert
```

### 7. Admin-Produkte testen:
```bash
✅ http://localhost:3000/admin/products
- [ ] 10 Produkte werden angezeigt
- [ ] Store vs Influencer Unterscheidung
- [ ] Suche funktioniert
- [ ] "Ansehen" öffnet Produkt
```

### 8. Admin-Influencer testen:
```bash
✅ http://localhost:3000/admin/influencers
- [ ] 3 Influencer in Grid
- [ ] Accent-Colors sichtbar
- [ ] Produkt-Anzahl angezeigt
- [ ] "Landingpage ansehen" funktioniert
```

### 9. Sicherheit testen:
```bash
✅ Ohne Login /admin öffnen
- [ ] Automatischer Redirect zu /login

✅ Mit falschem User /admin öffnen
- [ ] Redirect zu /login mit Fehler

✅ Logout-Button klicken
- [ ] Abmeldung erfolgreich
- [ ] Redirect zu /login
- [ ] Kann nicht mehr auf /admin zugreifen
```

---

## 🐛 Häufige Probleme

### Problem: "Module not found: @supabase/auth-helpers-nextjs"
```bash
npm install @supabase/auth-helpers-nextjs
npm run dev
```

### Problem: Login funktioniert nicht
**Checkliste:**
- [ ] Admin-User in Supabase erstellt?
- [ ] Email bestätigt (Auto-Confirm)?
- [ ] Richtiges Passwort?
- [ ] `.env.local` korrekt?

### Problem: Bilder laden nicht
```bash
# Next.js Config prüfen
# Sollte domains: ['images.unsplash.com'] enthalten
```

### Problem: /admin Redirect-Loop
```bash
# Browser-Cache leeren
# Cookies löschen
# Neu einloggen
```

### Problem: Middleware funktioniert nicht
```bash
# Sicherstellen dass installiert:
npm install @supabase/auth-helpers-nextjs

# Server neu starten
npm run dev
```

---

## 📚 Wichtige Dateien

### Konfiguration:
- `.env.local` - Supabase Credentials
- `next.config.js` - Next.js Config
- `tailwind.config.ts` - Design-System
- `middleware.ts` - Route-Protection

### Datenbank:
- `supabase/schema.sql` - Tabellen-Schema
- `supabase/seed-data.sql` - Test-Daten
- `supabase/admin-rls.sql` - Sicherheit

### Auth:
- `lib/supabase/auth.ts` - Auth-Helper
- `app/login/page.tsx` - Login-Seite
- `app/admin/layout.tsx` - Admin-Layout

### Dokumentation:
- `README.md` - Projekt-Übersicht
- `QUICK-START.md` - 5-Min Schnellstart
- `ADMIN-GUIDE.md` - Admin-Panel Guide
- `SUPABASE-AUTH-SETUP.md` - Auth-Setup
- `INSTALLATION.md` - Diese Datei

---

## 🎯 Nächste Schritte

Nach erfolgreicher Installation:

1. ✅ Teste alle Features
2. ✅ Schaue dir den Code an
3. 🔜 Checkout-Flow implementieren
4. 🔜 Produkt-Formulare erstellen
5. 🔜 Image-Upload implementieren
6. 🔜 Production-Deployment

---

## 🆘 Hilfe benötigt?

### Dokumentation:
- `README.md` - Projekt-Übersicht
- `QUICK-START.md` - Schnellstart
- `ADMIN-GUIDE.md` - Admin-Anleitung
- `SUPABASE-AUTH-SETUP.md` - Auth-Setup

### Supabase Dashboard:
https://tqjjjnvuuxcqrwxmhgkn.supabase.co

### Development URLs:
- Homepage: http://localhost:3000
- Login: http://localhost:3000/login
- Admin: http://localhost:3000/admin
- Shop: http://localhost:3000/shop

---

**Viel Erfolg mit deinem Premium Headshop! 🌿✨**
