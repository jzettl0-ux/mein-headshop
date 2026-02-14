# 📝 CRUD-Formulare Guide - Premium Headshop Admin

## 🎉 Vollständige Verwaltungs-Features!

Dein Admin-Panel hat jetzt **vollständige CRUD-Funktionen** (Create, Read, Update, Delete) für Produkte und Influencer!

---

## 📦 PRODUKT-VERWALTUNG

### ✅ Produkt erstellen (`/admin/products/new`)

**Features:**
- ✨ **Basis-Informationen**
  - Name (automatische Slug-Generierung)
  - Beschreibung (Textarea)
  - Preis & Lagerbestand
  
- 🖼️ **Bilder**
  - Bild-URL Eingabe
  - Live-Vorschau
  - Unsplash-Integration
  
- 🏷️ **Kategorisierung**
  - Kategorie-Dropdown (Bongs, Grinder, etc.)
  - **Influencer-Auswahl** (Store-Eigen oder Influencer-Edition)
  - Tags (komma-getrennt)
  
- ⚙️ **Einstellungen**
  - ☑ 18+ Produkt (Checkbox)
  - ☑ Featured (Checkbox)
  
- 👁️ **Live-Vorschau**
  - Badges werden angezeigt
  - Preis-Format
  - Kategorie

**Workflow:**
```
1. Klick "Neues Produkt" in /admin/products
2. Formular öffnet sich
3. Name eingeben (Slug wird auto-generiert)
4. Beschreibung, Preis, Stock
5. Bild-URL von Unsplash einfügen
6. Kategorie wählen
7. Optional: Influencer wählen
8. 18+ & Featured setzen
9. Tags hinzufügen
10. "Produkt erstellen" klicken
11. ✅ Gespeichert in Supabase!
12. → Redirect zu /admin/products
```

---

### ✏️ Produkt bearbeiten (`/admin/products/[id]/edit`)

**Features:**
- ✅ Lädt existierende Daten
- ✅ Alle Felder editierbar
- ✅ Live-Vorschau
- ✅ "Änderungen speichern" Button
- 🗑️ "Löschen" Button (mit Bestätigung)

**Workflow:**
```
1. In /admin/products auf "Bearbeiten" klicken
2. Formular öffnet sich mit vorausgefüllten Daten
3. Felder ändern
4. "Änderungen speichern"
5. ✅ Update in Supabase!
```

---

### 🗑️ Produkt löschen

**2 Möglichkeiten:**

**A) In der Liste:**
```
/admin/products → "Löschen" klicken → Bestätigen
```

**B) Beim Bearbeiten:**
```
/admin/products/[id]/edit → "Löschen" Button oben rechts
```

**Was passiert:**
- ✅ Produkt wird aus Datenbank gelöscht
- ✅ Bestätigungs-Dialog
- ✅ Toast-Benachrichtigung
- ✅ Liste wird aktualisiert

---

## 👥 INFLUENCER-VERWALTUNG

### ✅ Influencer erstellen (`/admin/influencers/new`)

**Features:**
- 👤 **Basis-Informationen**
  - Name (z.B. "Sarah Style")
  - Slug (automatisch oder manuell)
  - Bio/Beschreibung
  
- 🖼️ **Bilder**
  - Avatar-URL (quadratisch, 400x400px)
  - Banner-URL (Landscape, 1200x400px)
  - Live-Vorschau für beide
  
- 🎨 **Branding**
  - Accent-Color Picker
  - 6 Preset-Farben
  - Custom-Color möglich
  - Vorschau-Circle
  
- 📱 **Social Media**
  - Instagram-Link
  - TikTok-Link
  - YouTube-Link
  
- ⚙️ **Status**
  - ☑ Aktiv (öffentlich sichtbar)

**Workflow:**
```
1. Klick "Neuer Influencer" in /admin/influencers
2. Name eingeben
3. Bio schreiben
4. Avatar & Banner URLs (Unsplash)
5. Accent-Color wählen (Preset oder Custom)
6. Social-Links einfügen
7. "Aktiv" anhaken
8. "Influencer erstellen"
9. ✅ Gespeichert!
10. → Landingpage unter /influencer/[slug] sofort verfügbar!
```

---

### ✏️ Influencer bearbeiten (`/admin/influencers/[id]/edit`)

**Features:**
- ✅ Vorausgefüllte Daten
- ✅ Alle Felder editierbar
- ✅ Image-Vorschau
- ✅ Color-Picker
- 🗑️ Löschen-Button

**Wichtig:**
Beim Löschen eines Influencers:
- ⚠️ Produkte bleiben erhalten
- ⚠️ `influencer_id` wird auf NULL gesetzt
- ✅ Produkte werden zu "Store-Eigenen" Produkten

---

## 🎨 UI-Features

### Auto-Slug-Generation:
```typescript
Name: "Max Grün"
→ Slug: "max-gruen"
→ URL: /influencer/max-gruen
```

### Live-Vorschauen:
- **Produkte:** Badges, Preis, Kategorie
- **Influencer:** Avatar, Name, Accent-Color

### Image-Handling:
```typescript
// Unsplash URLs nutzen:
Avatar:  https://images.unsplash.com/photo-XXX?w=400&h=400&fit=crop&q=80
Banner:  https://images.unsplash.com/photo-YYY?w=1200&h=400&fit=crop&q=80
Produkt: https://images.unsplash.com/photo-ZZZ?w=800&q=80
```

### Color-Picker:
- 6 Preset-Farben (Neon, Gold, Orange, Pink, Cyan, Lila)
- Custom-Color mit Native HTML5 Color-Picker
- Hex-Anzeige

---

## 🔄 Datenbank-Operationen

### Produkt erstellen:
```sql
INSERT INTO products (
  name, slug, description, price,
  image_url, images, category, stock,
  is_adult_only, is_featured,
  influencer_id, tags
) VALUES (...)
```

### Produkt aktualisieren:
```sql
UPDATE products
SET name = ?, slug = ?, ...
WHERE id = ?
```

### Produkt löschen:
```sql
DELETE FROM products
WHERE id = ?
```

### Influencer erstellen:
```sql
INSERT INTO influencers (
  name, slug, bio,
  avatar_url, banner_url,
  accent_color, social_links,
  is_active
) VALUES (...)
```

---

## 🧪 Test-Szenarien

### Test 1: Store-Produkt erstellen

```bash
1. /admin/products → "Neues Produkt"
2. Fülle aus:
   Name: "Premium Rolling Tray"
   Preis: 24.99
   Stock: 20
   Kategorie: "zubehoer"
   Influencer: "Store-Eigenes Produkt" (kein Influencer)
   18+: Nein
   Featured: Ja
3. Bild: https://images.unsplash.com/photo-1616077167555-51f6bc516dfa?w=800&q=80
4. Tags: rolling-tray, premium, gold
5. "Produkt erstellen"
6. ✅ Erscheint in /admin/products
7. ✅ Sichtbar auf /shop mit "Store-Highlight" Badge
```

### Test 2: Influencer-Produkt erstellen

```bash
1. /admin/products → "Neues Produkt"
2. Fülle aus:
   Name: "Sarah's Pink Grinder"
   Preis: 39.99
   Kategorie: "grinder"
   Influencer: "Max Grün Edition" (wähle einen aus)
   18+: Nein
3. "Produkt erstellen"
4. ✅ Badge: "Influencer-Edition" (Neon-Grün)
5. ✅ Erscheint auf /influencer/max-gruen
```

### Test 3: Neuen Influencer erstellen

```bash
1. /admin/influencers → "Neuer Influencer"
2. Fülle aus:
   Name: "Sarah Style"
   Bio: "Lifestyle & Cannabis Queen"
   Avatar: https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop
   Banner: https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=400&fit=crop
   Color: Pink (#FF1493)
   Instagram: https://instagram.com/sarahstyle
3. "Influencer erstellen"
4. ✅ Erscheint in /admin/influencers
5. ✅ Landingpage: /influencer/sarah-style
6. ✅ Pink Accent-Color überall!
```

### Test 4: Produkt bearbeiten

```bash
1. /admin/products → Produkt auswählen → "Bearbeiten"
2. Ändere Preis: 89.99 → 79.99
3. Ändere Stock: 12 → 15
4. "Änderungen speichern"
5. ✅ Update in Datenbank
6. ✅ Neuer Preis auf /shop sichtbar
```

### Test 5: Produkt löschen

```bash
1. /admin/products → "Löschen" klicken
2. Bestätigung: "Ja"
3. ✅ Produkt verschwindet aus Liste
4. ✅ Nicht mehr auf /shop sichtbar
```

---

## 🎯 Validierung & Error-Handling

### Required Fields:
- ✅ Name (Produkt/Influencer)
- ✅ Beschreibung/Bio
- ✅ Preis (nur Produkte)
- ✅ Stock (nur Produkte)
- ✅ Kategorie (nur Produkte)
- ✅ Bild-URL(s)

### Client-Side Validation:
- ✅ HTML5 `required` Attribute
- ✅ Type-Checking (number, url, email)
- ✅ Min/Max Values (Preis ≥ 0, Stock ≥ 0)

### Server-Side (Supabase):
- ✅ Unique Constraints (slug)
- ✅ Foreign Key Checks (influencer_id)
- ✅ Type Validation

### Error-Messages:
- ✅ Toast-Benachrichtigungen
- ✅ Destructive Variant für Fehler
- ✅ Success-Feedback

---

## 🎨 Design-Details

### Formular-Layout:
```
┌─────────────────────────────────────────────────┐
│ [Zurück] Neues Produkt                [Löschen] │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────────┐  ┌──────────────────┐    │
│  │  Basis-Info       │  │  Einstellungen   │    │
│  │  - Name           │  │  - Kategorie     │    │
│  │  - Slug           │  │  - Influencer    │    │
│  │  - Beschreibung   │  │  - 18+ ☑         │    │
│  │  - Preis/Stock    │  │  - Featured ☑    │    │
│  └──────────────────┘  │                   │    │
│                         │  ┌──────────────┐ │    │
│  ┌──────────────────┐  │  │  Vorschau    │ │    │
│  │  Bilder           │  │  │  [Badges]    │ │    │
│  │  - URL            │  │  │  Name        │ │    │
│  │  - Preview        │  │  │  Preis       │ │    │
│  └──────────────────┘  │  └──────────────┘ │    │
│                         │                   │    │
│  ┌──────────────────┐  │  [Speichern]     │    │
│  │  Tags             │  │  [Abbrechen]     │    │
│  └──────────────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────┘
```

### Farb-Kodierung:
- 🟢 Influencer-Edition → Neon-Grün
- 🟡 Store-Highlight → Gold
- 🔴 18+ → Rot
- ⚪ Kategorie → Grau

---

## 🔄 Workflow-Beispiele

### Szenario 1: Neue Influencer-Kollektion launchen

```bash
Schritt 1: Influencer erstellen
─────────────────────────────
→ /admin/influencers → "Neuer Influencer"
→ Name: "Kim Kush"
→ Bio: "Luxury Cannabis Lifestyle"
→ Avatar: [Unsplash URL]
→ Banner: [Unsplash URL]
→ Accent-Color: Pink (#FF1493)
→ Instagram: [Link]
→ "Influencer erstellen"
✅ Landingpage: /influencer/kim-kush

Schritt 2: Produkte erstellen
──────────────────────────────
→ /admin/products → "Neues Produkt"
→ Name: "Kim's Luxury Bong"
→ Kategorie: "bongs"
→ Influencer: "Kim Kush Edition" ← wählen!
→ Preis: 159.99
→ 18+: Ja
→ "Produkt erstellen"
✅ Erscheint auf /influencer/kim-kush
✅ Hat "Influencer-Edition" Badge

Schritt 3: Testen
─────────────────
→ Gehe zu /influencer/kim-kush
→ ✅ Pink Accent-Color überall
→ ✅ Produkt wird angezeigt
→ ✅ Social-Links funktionieren
```

---

### Szenario 2: Preis-Update für Sale

```bash
→ /admin/products
→ Wähle "Premium Glasbong"
→ Klick "Bearbeiten"
→ Preis: 89.99 → 69.99
→ Featured: ☑ anhaken
→ "Änderungen speichern"
✅ Neuer Preis auf Website
✅ "Store-Highlight" Badge
```

---

### Szenario 3: Influencer deaktivieren

```bash
→ /admin/influencers
→ Wähle Influencer
→ Klick "Bearbeiten"
→ Aktiv: ☐ abhaken
→ "Änderungen speichern"
✅ Nicht mehr öffentlich sichtbar
✅ Produkte bleiben, aber ohne Influencer-Zuordnung
```

---

## 📋 Feld-Referenz

### Produkte:

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `name` | text | ✅ | Produktname |
| `slug` | text | Auto | URL-freundlich (auto-generiert) |
| `description` | text | ✅ | Detaillierte Beschreibung |
| `price` | decimal | ✅ | Preis in EUR |
| `image_url` | url | ✅ | Haupt-Produktbild |
| `category` | select | ✅ | bongs, grinder, papers, vaporizer, zubehoer, influencer-drops |
| `stock` | number | ✅ | Lagerbestand |
| `is_adult_only` | boolean | - | 18+ Kennzeichnung |
| `is_featured` | boolean | - | Homepage Featured |
| `influencer_id` | select | - | NULL = Store-Eigen, UUID = Influencer |
| `tags` | text[] | - | Komma-getrennt |

### Influencer:

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `name` | text | ✅ | Influencer-Name |
| `slug` | text | Auto | URL (auto-generiert) |
| `bio` | text | ✅ | Kurzbeschreibung |
| `avatar_url` | url | ✅ | Profilbild (quadratisch) |
| `banner_url` | url | ✅ | Header-Bild (landscape) |
| `accent_color` | color | ✅ | Markenfarbe (Hex) |
| `social_links.instagram` | url | - | Instagram-Profil |
| `social_links.tiktok` | url | - | TikTok-Profil |
| `social_links.youtube` | url | - | YouTube-Kanal |
| `is_active` | boolean | - | Öffentlich sichtbar |

---

## 🖼️ Bild-Quellen (Unsplash)

### Für Produkte:
```
Cannabis/Glas:
https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80
https://images.unsplash.com/photo-1577705998148-6da4f3d70118?w=800&q=80

Grinder:
https://images.unsplash.com/photo-1628024488892-3b7c86a4907c?w=800&q=80

Papers:
https://images.unsplash.com/photo-1606506082871-8e1c9c3a9e5a?w=800&q=80

Vaporizer:
https://images.unsplash.com/photo-1581922814484-e2bcd2508e31?w=800&q=80
https://images.unsplash.com/photo-1593078165509-7f0c9c187043?w=800&q=80
```

### Für Influencer:

**Avatars (Porträts):**
```
Male:
https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&q=80
https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&q=80

Female:
https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&q=80
https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&q=80
```

**Banners (Landscape):**
```
Abstract/Tech:
https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=400&fit=crop&q=80
https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=400&fit=crop&q=80

Nature/Lifestyle:
https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=400&fit=crop&q=80
```

---

## 🐛 Troubleshooting

### Problem: "Slug already exists"
**Lösung:** 
- Ändere den Slug manuell
- Oder ändere den Namen leicht

### Problem: Bild lädt nicht
**Lösung:**
- Prüfe URL (muss https sein)
- Teste URL im Browser
- Nutze Unsplash-Links

### Problem: "Foreign key violation"
**Lösung:**
- Influencer-ID existiert nicht
- Wähle einen existierenden Influencer
- Oder wähle "Store-Eigenes Produkt"

### Problem: Änderungen werden nicht gespeichert
**Lösung:**
- Check Browser Console für Fehler
- Prüfe RLS Policies (admin-rls.sql ausgeführt?)
- Bist du als Admin eingeloggt?

---

## 📁 Neue Dateien

```
mein-headshop/
└── app/admin/
    ├── products/
    │   ├── page.tsx              ← Aktualisiert (Load & Delete)
    │   ├── new/
    │   │   └── page.tsx          ← NEU! Erstellen-Formular
    │   └── [id]/edit/
    │       └── page.tsx          ← NEU! Bearbeiten-Formular
    └── influencers/
        ├── page.tsx              ← Aktualisiert (Load & Delete)
        ├── new/
        │   └── page.tsx          ← NEU! Erstellen-Formular
        └── [id]/edit/
            └── page.tsx          ← NEU! Bearbeiten-Formular
```

---

## ✅ Vollständige CRUD-Features

### Produkte:
- [x] **Create** - Neues Produkt erstellen
- [x] **Read** - Alle Produkte anzeigen
- [x] **Update** - Produkt bearbeiten
- [x] **Delete** - Produkt löschen

### Influencer:
- [x] **Create** - Neuen Influencer erstellen
- [x] **Read** - Alle Influencer anzeigen
- [x] **Update** - Influencer bearbeiten
- [x] **Delete** - Influencer löschen

### Bonus:
- [x] Live-Vorschau
- [x] Auto-Slug-Generation
- [x] Image-Preview
- [x] Color-Picker
- [x] Toast-Benachrichtigungen
- [x] Bestätigungs-Dialoge
- [x] Loading-States
- [x] Error-Handling

---

## 🎉 Du bist fertig!

Dein Admin-Panel hat jetzt **vollständige Verwaltungs-Features**!

**Was funktioniert:**
- ✅ Produkte erstellen/bearbeiten/löschen
- ✅ Influencer erstellen/bearbeiten/löschen
- ✅ Store vs Influencer Unterscheidung
- ✅ Live-Datenbank-Integration
- ✅ Alle Changes sofort sichtbar

**Test es jetzt:**
```bash
http://localhost:3000/admin/products/new
```

**Viel Erfolg! 🚀**
