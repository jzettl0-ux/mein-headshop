# 🚀 Quick Start Guide

## In 5 Minuten zum laufenden Shop!

### Schritt 1: Dependencies installieren ⚡
```bash
npm install
```

### Schritt 2: Supabase Datenbank einrichten 🗄️

#### A) Schema erstellen
1. Öffne https://tqjjjnvuuxcqrwxmhgkn.supabase.co
2. Gehe zu **SQL Editor**
3. Kopiere **ALLES** aus `supabase/schema.sql`
4. Füge ein und klicke **"Run"**
5. Warte auf "Success" ✅

#### B) Test-Daten importieren
1. Im SQL Editor (oder neue Query)
2. Kopiere **ALLES** aus `supabase/seed-data.sql`
3. Füge ein und klicke **"Run"**
4. Warte auf "Success" ✅

**Das wars!** Du hast jetzt:
- ✅ 10 Premium-Produkte mit echten Bildern
- ✅ 3 Test-Influencer
- ✅ Komplett funktionsfähige Datenbank

### Schritt 3: App starten 🎉
```bash
npm run dev
```

Öffne: **http://localhost:3000**

---

## 🎯 Was du jetzt testen kannst:

### 1. Homepage (/)
- ✅ Age-Gate beim ersten Besuch
- ✅ Hero-Section mit Animationen
- ✅ Featured Products (4 Produkte)
- ✅ Kategorie-Showcase
- ✅ Influencer-Grid

### 2. Shop (/shop)
- ✅ Alle Produkte durchstöbern
- ✅ Nach Kategorie filtern
- ✅ Nach Preis filtern
- ✅ 18+ Filter
- ✅ Suchfunktion

### 3. Produkt-Details (/shop/premium-glasbong-crystal)
- ✅ Image-Galerie mit Thumbnails
- ✅ Produkt-Beschreibung
- ✅ Menge ändern
- ✅ "In den Warenkorb" Button
- ✅ 18+ Warnung (wenn zutreffend)
- ✅ Stock-Status

**Weitere Produkte zum Testen:**
- `/shop/xxl-grinder-gold`
- `/shop/raw-black-king-size`
- `/shop/mighty-plus-vaporizer`
- `/shop/max-choice-perkolator-bong`

### 4. Warenkorb (/cart)
- ✅ Produkte hinzufügen
- ✅ Menge ändern (+/-)
- ✅ Produkte entfernen
- ✅ **WICHTIG:** Füge ein 18+ Produkt hinzu!
  - Du siehst die rote Warnung
  - Automatisch 2,00 € DHL Ident-Check Gebühr
- ✅ Versandkosten-Berechnung
- ✅ Gesamt-Summe

### 5. Influencer-Pages
- `/influencer/max-gruen` (Neon-Grün)
- `/influencer/lisa-high` (Gold)
- `/influencer/tom-smoke` (Orange)
- ✅ Individuelle Farben
- ✅ Banner & Avatar
- ✅ Social-Links
- ✅ Gefilterte Produkte

---

## 🎨 Design-Features testen:

### Animationen
- ✅ Scroll-Animationen auf Homepage
- ✅ Hover-Effekte auf Produkt-Cards
- ✅ Smooth Page-Transitions
- ✅ Button-Feedback (z.B. "In den Warenkorb")

### Mobile-Ansicht
1. Öffne Dev-Tools (F12)
2. Toggle Device Toolbar (Strg + Shift + M)
3. Wähle "iPhone 12 Pro" oder "Samsung Galaxy S20"
4. Teste:
   - ✅ Burger-Menü
   - ✅ Touch-optimierte Buttons
   - ✅ Responsive Images
   - ✅ Mobile Filters (Shop)

### Dark Luxe Theme
- ✅ Schwarze Backgrounds (#0A0A0A)
- ✅ Gold-Akzente (#D4AF37)
- ✅ Neon-Grün (#39FF14)
- ✅ Smooth Hover-Effekte
- ✅ Glassmorphism-Effekte

---

## 🧪 18+ Logik testen:

1. **Gehe zum Shop**
2. **Füge ein normales Produkt hinzu** (z.B. Grinder - 34,99€)
3. **Gehe zum Warenkorb**
   - Versand: 4,90 €
   - Keine Warnung ✅

4. **Füge ein 18+ Produkt hinzu** (z.B. Bong - 89,99€)
5. **Gehe zum Warenkorb**
   - ⚠️ Rote Warnung erscheint!
   - Versand: 4,90 € + 2,00 € = **6,90 €**
   - Hinweis zu DHL Ident-Check ✅

---

## 🎯 Test-Checkliste:

### Basic Functionality:
- [ ] Age-Gate beim ersten Besuch
- [ ] Age-Gate verschwindet nach Bestätigung
- [ ] Homepage lädt korrekt
- [ ] Navigation funktioniert
- [ ] Produkte werden angezeigt
- [ ] Bilder laden (Unsplash)

### Shop:
- [ ] Filter nach Kategorie funktioniert
- [ ] Filter nach Preis funktioniert
- [ ] 18+ Filter funktioniert
- [ ] Suche funktioniert
- [ ] Produkt-Click öffnet Detailseite

### Produkt-Details:
- [ ] Image-Galerie funktioniert
- [ ] Thumbnails wechseln Bild
- [ ] Quantity +/- funktioniert
- [ ] "In den Warenkorb" funktioniert
- [ ] Success-Animation erscheint
- [ ] 18+ Badge bei Adult-Produkten

### Warenkorb:
- [ ] Produkte erscheinen im Warenkorb
- [ ] Badge in Header zeigt Anzahl
- [ ] Menge ändern funktioniert
- [ ] Produkt entfernen funktioniert
- [ ] 18+ Warnung bei Adult-Produkten
- [ ] Versandkosten korrekt berechnet
- [ ] 2€ Aufschlag bei 18+ Artikeln

### Influencer:
- [ ] Influencer-Grid auf Homepage
- [ ] Influencer-Landingpage lädt
- [ ] Accent-Color korrekt
- [ ] Gefilterte Produkte
- [ ] Social-Links funktionieren

### Mobile:
- [ ] Burger-Menü öffnet/schließt
- [ ] Navigation funktioniert
- [ ] Produkt-Grid responsive
- [ ] Warenkorb responsive
- [ ] Touch-Interaktionen smooth

---

## 🐛 Probleme?

### Age-Gate erscheint nicht mehr?
```javascript
// Browser Console (F12):
localStorage.clear()
// Seite neu laden
```

### Bilder laden nicht?
- Prüfe Internet-Verbindung
- Öffne Dev-Tools → Network Tab
- Schaue nach Fehlern

### Warenkorb leer nach Reload?
- Normal! Warenkorb nutzt LocalStorage
- Produkte bleiben erhalten bei normalen Page-Transitions
- Nur `localStorage.clear()` löscht den Warenkorb

### "Module not found" Error?
```bash
# Lösche node_modules und installiere neu
rm -rf node_modules package-lock.json
npm install
```

---

## ✅ Alles funktioniert?

**Glückwunsch! 🎉** Dein High-End Headshop läuft!

### Nächste Schritte:
1. ✅ Teste alle Features durch
2. ✅ Schaue dir den Code an
3. 🔜 Checkout-Flow implementieren
4. 🔜 Admin-Panel erstellen
5. 🔜 Payment integrieren

---

**Brauchst du Hilfe?** Schau in die `IMPORT-ANLEITUNG.md` oder `README.md`!
