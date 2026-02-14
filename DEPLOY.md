# 🚀 Deployment Guide - Premium Headshop

## 🎯 Production Deployment mit Vercel

Die einfachste und empfohlene Methode für Next.js Apps.

---

## 📋 VORBEREITUNG

### 1. Git-Repository erstellen

```bash
# Im Projekt-Ordner:
git init
git add .
git commit -m "Initial commit: Premium Headshop v1.0"
```

### 2. GitHub-Repository

1. Gehe zu https://github.com/new
2. Erstelle neues Repository:
   - Name: `premium-headshop`
   - Private: ✅ (empfohlen)
3. Verbinde lokales Repo:

```bash
git remote add origin https://github.com/DEIN-USERNAME/premium-headshop.git
git branch -M main
git push -u origin main
```

---

## 🚀 VERCEL DEPLOYMENT

### Schritt 1: Vercel-Account

1. Gehe zu https://vercel.com
2. Registriere mit GitHub-Account
3. Autorisiere Vercel für GitHub

### Schritt 2: Projekt importieren

1. Im Vercel Dashboard: **"Add New..."** → **"Project"**
2. Wähle dein GitHub-Repository: `premium-headshop`
3. Klicke **"Import"**

### Schritt 3: Environment Variables

Im "Configure Project" Screen:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tqjjjnvuuxcqrwxmhgkn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[Dein Anon Key]
NEXT_PUBLIC_SITE_URL=https://premium-headshop.vercel.app
```

**Wichtig:** Kopiere aus deiner lokalen `.env.local`!

### Schritt 4: Deploy

1. Klicke **"Deploy"**
2. Warte 2-3 Minuten
3. ✅ Deine App ist live!

**URL:** `https://premium-headshop.vercel.app`

---

## 🌐 CUSTOM DOMAIN

### Domain verbinden:

1. Im Vercel-Projekt: **Settings** → **Domains**
2. Klicke **"Add"**
3. Gib deine Domain ein: `www.premium-headshop.de`
4. Folge den DNS-Anweisungen

### DNS-Konfiguration:

Bei deinem Domain-Anbieter (z.B. Namecheap, GoDaddy):

**A-Record:**
```
Type: A
Name: @
Value: 76.76.21.21 (Vercel IP)
```

**CNAME:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**Warte:** 24-48h für DNS-Propagation

---

## 🔒 SSL/HTTPS

Vercel aktiviert automatisch:
- ✅ SSL-Zertifikat (Let's Encrypt)
- ✅ HTTPS erzwungen
- ✅ Auto-Renewal

Keine Konfiguration nötig! 🎉

---

## 🔄 UPDATES DEPLOYEN

### Automatisches Deployment:

```bash
# Änderungen machen
# Dann:
git add .
git commit -m "Update: Neue Features"
git push

# Vercel deployed automatisch!
# → Production: main branch
# → Preview: andere branches
```

### Manual Deploy:

```bash
# Vercel CLI installieren
npm install -g vercel

# Deployen
vercel --prod
```

---

## 🔧 VERCEL-KONFIGURATION

### `vercel.json` (optional):

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "framework": "nextjs",
  "regions": ["fra1"],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/"
    }
  ]
}
```

### Environment per Branch:

```
Production (main):
NEXT_PUBLIC_SITE_URL=https://premium-headshop.de

Preview (dev):
NEXT_PUBLIC_SITE_URL=https://preview.premium-headshop.de
```

---

## 📊 MONITORING

### Vercel Analytics (kostenlos):

1. Im Projekt: **Analytics**
2. Aktiviere **Web Analytics**
3. Siehst du:
   - Page Views
   - Unique Visitors
   - Top Pages
   - Performance Metrics

### Vercel Logs:

1. **Logs** Tab im Dashboard
2. Real-time Logs
3. Error-Tracking
4. Build-Logs

---

## ⚡ PERFORMANCE

### Automatisch von Vercel:
- ✅ Edge Network (CDN)
- ✅ Image-Optimization
- ✅ Code-Splitting
- ✅ Compression (Gzip/Brotli)
- ✅ HTTP/2 & HTTP/3

### Eigene Optimierungen:
- ✅ Next.js Image Component (schon implementiert)
- ✅ Dynamic Imports (wo sinnvoll)
- ✅ Font-Optimization (Inter font)

---

## 🐛 TROUBLESHOOTING

### Problem: Build Failed

```bash
# Lokal testen:
npm run build

# Fehler beheben, dann:
git add .
git commit -m "Fix build error"
git push
```

### Problem: Environment Variables nicht verfügbar

1. Vercel Dashboard → Settings → Environment Variables
2. Alle Keys prüfen
3. Neu deployen: **Deployments** → **"Redeploy"**

### Problem: 404 bei Custom Routes

```javascript
// vercel.json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

### Problem: Domain nicht erreichbar

1. DNS-Propagation prüfen: https://dnschecker.org
2. Warte 24-48h
3. SSL-Status prüfen in Vercel

---

## 🔐 SICHERHEIT

### Vercel Security:
- ✅ DDoS-Protection
- ✅ Firewall
- ✅ Rate-Limiting

### Eigene Maßnahmen:
- [ ] Supabase RLS aktiviert
- [ ] Sensitive Keys in Environment Variables
- [ ] Admin-Routes geschützt (Middleware)
- [ ] CORS korrekt konfiguriert

---

## 💰 KOSTEN

### Vercel Pricing:

**Hobby (Kostenlos):**
- ✅ Unbegrenzte Deployments
- ✅ 100GB Bandwidth/Monat
- ✅ Serverless Functions
- ✅ SSL
- ⚠️ Nur für persönliche Projekte

**Pro ($20/Monat):**
- ✅ Kommerziell nutzbar
- ✅ Team-Features
- ✅ Advanced Analytics
- ✅ Priority Support

**Für Premium Headshop:**
→ Pro-Plan empfohlen! (kommerziell)

---

## 📱 ALTERNATIVE HOSTING

### Netlify:
```bash
# netlify.toml
[build]
  command = "npm run build"
  publish = ".next"
```

### Railway:
- Automatische Next.js Erkennung
- Docker-Support
- Postgres-Hosting

### Eigener Server (VPS):
```bash
# PM2 Process Manager
npm install -g pm2
npm run build
pm2 start npm --name "premium-headshop" -- start
```

---

## ✅ POST-DEPLOYMENT

### Nach erstem Deploy:

1. **Teste Production-URL:**
   ```
   https://deine-app.vercel.app
   ```

2. **Prüfe alle Features:**
   - [ ] Age-Gate
   - [ ] Shop & Filter
   - [ ] Warenkorb
   - [ ] Checkout
   - [ ] Admin-Login
   - [ ] CRUD-Operations

3. **Performance-Check:**
   ```
   https://pagespeed.web.dev
   → URL eingeben
   → Score sollte > 90 sein
   ```

4. **SEO-Check:**
   ```
   → Google Search Console registrieren
   → Sitemap einreichen
   ```

---

## 🎉 FERTIG!

Dein Shop ist live unter:
```
🌐 https://premium-headshop.vercel.app
```

**Was jetzt:**
1. ✅ Share mit Influencern
2. ✅ Teste alle Funktionen
3. ✅ Sammle Feedback
4. ✅ Iteriere & Verbessere

**Du hast es geschafft! 🎊**
