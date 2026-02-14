# ⚡ Quick Reference - Premium Headshop

## 🔗 WICHTIGE URLS

### Development:
```
Homepage:         http://localhost:3000
Shop:             http://localhost:3000/shop
Warenkorb:        http://localhost:3000/cart
Kunden-Auth:      http://localhost:3000/auth
Kunden-Account:   http://localhost:3000/account
Checkout:         http://localhost:3000/checkout
Admin-Login:      http://localhost:3000/login
Admin-Panel:      http://localhost:3000/admin
Impressum:        http://localhost:3000/impressum
```

### Supabase:
```
Dashboard:        https://tqjjjnvuuxcqrwxmhgkn.supabase.co
SQL Editor:       [Dashboard] → SQL Editor
Table Editor:     [Dashboard] → Table Editor
Authentication:   [Dashboard] → Authentication
Storage:          [Dashboard] → Storage
```

---

## 🔑 CREDENTIALS

### Admin-Account:
```
Email:    jzettl0@gmail.com
Passwort: [Das was du bei der Erstellung gesetzt hast]
URL:      http://localhost:3000/login
```

### Test-Customer:
```
Erstelle über: http://localhost:3000/auth
Email:         test@example.com
Passwort:      testtest123
```

---

## 📝 HÄUFIGE BEFEHLE

### Development:
```bash
# Server starten
npm run dev

# Build für Production
npm run build

# Production-Server starten
npm start

# TypeScript-Check
npm run type-check

# Linting
npm run lint
```

### Git:
```bash
# Status prüfen
git status

# Änderungen committen
git add .
git commit -m "Update: Beschreibung"
git push

# Neuer Branch
git checkout -b feature/neue-funktion
```

---

## 🗄️ SUPABASE QUERIES

### Alle Produkte:
```sql
SELECT * FROM products ORDER BY created_at DESC;
```

### Store-Produkte:
```sql
SELECT * FROM products WHERE influencer_id IS NULL;
```

### Influencer-Produkte:
```sql
SELECT p.*, i.name as influencer_name
FROM products p
JOIN influencers i ON p.influencer_id = i.id;
```

### Alle Bestellungen:
```sql
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;
```

### User mit Bestellungen:
```sql
SELECT 
  u.email,
  COUNT(o.id) as order_count,
  SUM(o.total) as total_spent
FROM auth.users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id;
```

### Produkte pro Influencer:
```sql
SELECT 
  i.name,
  COUNT(p.id) as product_count
FROM influencers i
LEFT JOIN products p ON p.influencer_id = i.id
GROUP BY i.id, i.name;
```

---

## 🎨 FARB-CODES

### Dark Luxe Palette:
```css
--luxe-black:    #0A0A0A  /* Haupthintergrund */
--luxe-charcoal: #1A1A1A  /* Cards */
--luxe-gray:     #2A2A2A  /* Borders */
--luxe-silver:   #8A8A8A  /* Text */
--luxe-gold:     #D4AF37  /* Akzent */
--luxe-neon:     #39FF14  /* Influencer */
```

### Influencer-Colors (Presets):
```
Neon-Grün:  #39FF14
Gold:       #D4AF37
Orange:     #FF6B35
Pink:       #FF1493
Cyan:       #00FFFF
Lila:       #9D4EDD
```

---

## 📦 WICHTIGE ORDNER

```
app/              → Alle Seiten (Pages)
components/       → React-Komponenten
lib/              → Utils & Helpers
store/            → State-Management
supabase/         → SQL-Scripts
public/           → Statische Assets
```

---

## 🐛 TROUBLESHOOTING QUICK-FIXES

### Problem → Lösung

```
App startet nicht
→ npm install && npm run dev

Bilder laden nicht
→ Check next.config.js domains

Admin-Login geht nicht
→ Account in Supabase erstellt?

Produkte nicht sichtbar
→ Seed-Data importiert?

Build-Fehler
→ npm run type-check

Supabase-Error
→ Check .env.local Credentials

Middleware-Error
→ npm install @supabase/ssr

Age-Gate erscheint ständig
→ localStorage.clear() im Browser
```

---

## 📞 SUPPORT-RESOURCEN

### Dokumentation:
```
Allgemein:     → README.md
Installation:  → INSTALLATION.md
Admin:         → ADMIN-GUIDE.md
Features:      → FEATURES.md
Deployment:    → DEPLOY.md
Production:    → PRODUCTION-CHECKLIST.md
```

### External:
```
Next.js:       https://nextjs.org/docs
Supabase:      https://supabase.com/docs
Tailwind:      https://tailwindcss.com/docs
shadcn/ui:     https://ui.shadcn.com
Framer Motion: https://www.framer.com/motion
```

---

## ⚡ KEYBOARD-SHORTCUTS

### In der App:
```
Search:    / (Focus Search)
ESC:       Close Overlays
Tab:       Navigate Forms
Enter:     Submit Forms
```

### In VS Code:
```
Strg + P:     Quick File Open
Strg + B:     Toggle Sidebar
Strg + `:     Toggle Terminal
Strg + Shift + P: Command Palette
```

---

## 📊 PERFORMANCE-TIPPS

### Bilder:
```typescript
// Next.js Image immer nutzen
<Image src="..." alt="..." width={800} height={800} />

// Unsplash mit Parametern
?w=800&q=80  // Width & Quality
```

### Datenbank:
```sql
-- Indexes nutzen (bereits in schema.sql)
-- Limit bei Queries
SELECT * FROM products LIMIT 20;

-- Spezifische Felder
SELECT id, name, price FROM products;
```

### Caching:
```typescript
// Supabase Queries cachen (später)
const { data } = await supabase
  .from('products')
  .select()
  .cache(60) // 60 Sekunden
```

---

## 🎯 TYPISCHE WORKFLOWS

### Neues Produkt hinzufügen:
```
1. /admin/products → "Neues Produkt"
2. Formular ausfüllen
3. Influencer wählen (optional)
4. Speichern
5. ✅ Live auf /shop
```

### Bestellung bearbeiten:
```
1. /admin/orders
2. Bestellung finden
3. Status-Dropdown ändern
4. ✅ Kunde sieht Update in /account
```

### Influencer-Kollektion launchen:
```
1. /admin/influencers → "Neuer Influencer"
2. Influencer erstellen
3. /admin/products → Mehrere Produkte erstellen
4. Bei jedem: Influencer auswählen
5. ✅ Kollektion auf /influencer/[slug]
```

---

## 🔐 SICHERHEITS-CHECKS

### Vor Go-Live:
```bash
# 1. Environment Variables
✅ NEXT_PUBLIC_SUPABASE_URL gesetzt
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY gesetzt
✅ Keine Secrets im Code

# 2. Supabase
✅ RLS Policies aktiviert
✅ Admin-Account existiert
✅ Storage-Policies gesetzt

# 3. Middleware
✅ /admin/* geschützt
✅ Nur Admin-Email hat Zugriff

# 4. Auth
✅ Password-Requirements
✅ Session-Management
✅ Logout funktioniert
```

---

## 🚀 DEPLOYMENT QUICK-STEPS

### Vercel (1-Click):
```bash
1. GitHub-Repo erstellen
2. Code pushen
3. Vercel.com → "Import Project"
4. Environment Variables setzen
5. Deploy! ✅
```

### Environment Variables für Vercel:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL=https://deine-domain.vercel.app
```

---

## 💡 PRO-TIPPS

### Development:
- Nutze `npm run dev` mit Turbo-Mode
- Hot-Reload ist aktiv
- Browser DevTools nutzen (F12)
- React DevTools installieren

### Admin:
- Erst Influencer erstellen
- Dann Produkte zuordnen
- Regelmäßig Backups
- Statistiken monitoren

### Shop:
- Hochwertige Bilder (min 800px)
- SEO-optimierte Beschreibungen
- Klare Kategorisierung
- Stock immer aktuell halten

---

## 📋 LAUNCH-CHECKLISTE (Kurz)

```
Before Launch:
├─ [x] Code komplett
├─ [x] Features getestet
├─ [ ] Payment integriert
├─ [ ] Echte Produktdaten
├─ [ ] Rechtliches finalisiert
├─ [ ] Domain gekauft
└─ [ ] Deployed auf Vercel
```

---

## 🎉 THAT'S IT!

**Alles was du brauchst auf einer Seite!**

Für Details → Siehe die anderen Dokumentations-Dateien

**Happy Coding! 🚀**
