# 🔐 Admin-Panel Guide - Premium Headshop

## 🚀 Zugriff auf das Admin-Panel

### Login-URL:
```
http://localhost:3000/admin/login
```

### Standard-Credentials:
```
Passwort: admin123
```

⚠️ **WICHTIG:** In Production durch echte Authentifizierung ersetzen!

---

## 📊 Dashboard (`/admin`)

Das Dashboard zeigt dir auf einen Blick:
- ✅ **Anzahl Produkte** (Store + Influencer)
- ✅ **Anzahl Influencer**
- ✅ **Bestellungen** (in Zukunft)
- ✅ **Umsatz** (in Zukunft)

### Schnellzugriff:
- Produkte verwalten → `/admin/products`
- Influencer verwalten → `/admin/influencers`

---

## 📦 Produkt-Verwaltung (`/admin/products`)

### Features:
- ✅ **Alle Produkte anzeigen** (Store + Influencer)
- ✅ **Suche** nach Produktnamen
- ✅ **Unterscheidung** Store-Eigen vs Influencer-Edition
- ✅ **Badges:**
  - Featured / Store-Highlight
  - 18+ (Altersverifizierung erforderlich)
  - Influencer-Edition (mit Influencer-Name)
  - Kategorie (Bongs, Grinder, etc.)

### Aktionen:
- **Ansehen** → Öffnet Produkt-Detailseite im neuen Tab
- **Bearbeiten** → Produkt bearbeiten (UI noch nicht implementiert)
- **Löschen** → Produkt löschen (mit Bestätigung)

### Neues Produkt erstellen:
1. Klicke auf **"Neues Produkt"** Button
2. Formular wird geöffnet (UI in Phase 4)
3. Wähle zwischen:
   - **Store-Eigenes Produkt** (kein Influencer)
   - **Influencer-Edition** (wähle Influencer aus)

### Store vs Influencer Unterscheidung:

#### **Store-Eigene Produkte:**
- `influencer_id`: `NULL`
- Badge: "Store-Highlight" (wenn featured)
- Erscheinen in der Haupt-Shop-Kategorie
- Volle Kontrolle über Branding

#### **Influencer-Editionen:**
- `influencer_id`: `inf-001`, `inf-002`, etc.
- Badge: "Influencer-Edition" (Neon-Grün)
- Zusatz-Badge: "Influencer: Max Grün"
- Erscheinen auf Influencer-Landingpages
- Produkt-Name sollte Influencer enthalten (z.B. "Max's Choice Bong")

---

## 👥 Influencer-Verwaltung (`/admin/influencers`)

### Features:
- ✅ **Grid-Ansicht** aller Influencer
- ✅ **Avatar & Banner** Vorschau
- ✅ **Accent-Color** wird angezeigt
- ✅ **Produkt-Anzahl** pro Influencer
- ✅ **Status** (Aktiv/Inaktiv)

### Influencer-Profil:
Jeder Influencer hat:
- **Name** (z.B. "Max Grün")
- **Slug** (z.B. "max-gruen" → URL)
- **Bio** (Kurzbeschreibung)
- **Avatar** (Profilbild)
- **Banner** (Header-Bild)
- **Accent-Color** (Markenfarbe, z.B. #39FF14)
- **Social-Links** (Instagram, TikTok, etc.)

### Landingpage:
Jeder Influencer bekommt automatisch eine Page:
```
/influencer/[slug]
```

Beispiele:
- `/influencer/max-gruen`
- `/influencer/lisa-high`
- `/influencer/tom-smoke`

### Aktionen:
- **Landingpage ansehen** → Öffnet Influencer-Page
- **Bearbeiten** → Profil bearbeiten
- **Löschen** → Influencer entfernen (Produkte bleiben!)

---

## 🎨 Produkt-Kategorien

### Standard-Kategorien:
1. **`bongs`** - Glasbongs, Acrylbongs
2. **`grinder`** - Metall-Grinder, Holz-Grinder
3. **`papers`** - Rolling Papers, Blunts
4. **`vaporizer`** - Desktop & Portable Vapes
5. **`zubehoer`** - Feuerzeuge, Rolling Trays, etc.
6. **`influencer-drops`** - Exklusive Influencer-Produkte

**Tipp:** Influencer-Produkte können auch in Standard-Kategorien sein!
- Beispiel: "Max's Bong" → Kategorie: `bongs` + `influencer_id: inf-001`

---

## 🔖 18+ Produkt-Logik

### Wann ist ein Produkt 18+?
- Bongs (Wasserpfeifen)
- Vaporizer
- Alle Rauchutensilien

### Was passiert automatisch?
1. **Badge "18+"** wird angezeigt
2. **Warnung** auf Produkt-Detailseite
3. **Im Warenkorb:** +2,00 € DHL Ident-Check Gebühr
4. **Beim Checkout:** Altersverifizierung erforderlich

### Wie setze ich das?
```sql
is_adult_only: true
```

---

## 🛠️ Datenbank-Struktur

### Produkte (`products` Tabelle):
```typescript
{
  id: string                    // prod-001
  name: string                  // "Premium Glasbong"
  slug: string                  // "premium-glasbong"
  description: string           // Produktbeschreibung
  price: number                 // 89.99
  image_url: string             // Hauptbild
  images: string[]              // Galerie
  category: string              // "bongs"
  stock: number                 // 12
  is_adult_only: boolean        // true/false
  is_featured: boolean          // true/false
  influencer_id: string | null  // "inf-001" oder NULL
  tags: string[]                // ["premium", "glas"]
}
```

### Influencer (`influencers` Tabelle):
```typescript
{
  id: string                    // inf-001
  name: string                  // "Max Grün"
  slug: string                  // "max-gruen"
  bio: string                   // Beschreibung
  avatar_url: string            // Profilbild
  banner_url: string            // Header-Bild
  accent_color: string          // "#39FF14"
  social_links: object          // { instagram: "..." }
  is_active: boolean            // true/false
}
```

---

## 🎯 Workflow: Neues Influencer-Produkt anlegen

### Schritt 1: Influencer erstellen (falls noch nicht vorhanden)
1. Gehe zu `/admin/influencers`
2. Klicke "Neuer Influencer"
3. Fülle das Formular aus:
   - Name: "Sarah Style"
   - Slug: "sarah-style"
   - Bio: "Lifestyle & Cannabis"
   - Accent-Color: "#FF1493" (Pink)
4. Speichern

### Schritt 2: Produkt erstellen
1. Gehe zu `/admin/products`
2. Klicke "Neues Produkt"
3. Fülle das Formular aus:
   - Name: "Sarah's Pink Grinder"
   - Kategorie: "grinder"
   - **Wichtig:** Wähle "Influencer: Sarah Style"
   - Preis: 39.99
   - 18+: Nein
4. Speichern

### Schritt 3: Testen
1. Gehe zu `/influencer/sarah-style`
2. Produkt wird angezeigt mit "Influencer-Edition" Badge
3. Accent-Color (Pink) wird verwendet

---

## 📊 Best Practices

### Produkt-Namen für Influencer-Editionen:
✅ **Gut:**
- "Max's Choice - Perkolator Bong"
- "Lisa's Gold Edition Grinder"
- "Tom's Tech Vape Station"

❌ **Schlecht:**
- "Glasbong" (zu generisch)
- "Produkt 123" (nicht aussagekräftig)

### Preisgestaltung:
- **Store-Produkte:** 4,99 € - 349,99 €
- **Influencer-Editionen:** +20-40% Premium

### Stock-Management:
- **Limited Editions:** 5-10 Stück
- **Standard-Produkte:** 20-50 Stück
- **Evergreens:** 100+ Stück

---

## 🔒 Sicherheit

### Aktuell (Development):
- ✅ LocalStorage-basierte Auth
- ✅ Passwort: `admin123`
- ⚠️ **NICHT für Production geeignet!**

### Für Production:
- [ ] Supabase Auth implementieren
- [ ] Row Level Security (RLS)
- [ ] Admin-Rolle in Datenbank
- [ ] Sichere Session-Verwaltung
- [ ] 2-Faktor-Authentifizierung

---

## 🐛 Troubleshooting

### Problem: "Nicht authentifiziert" nach Reload
**Lösung:** Browser-Cache leeren oder erneut einloggen

### Problem: Produkte werden nicht angezeigt
**Lösung:** Seed-Data importieren (siehe `IMPORT-ANLEITUNG.md`)

### Problem: Bilder laden nicht
**Lösung:** Unsplash-URLs prüfen oder Next.js Config kontrollieren

---

## 🚀 Nächste Entwicklungs-Schritte

### Phase 4: Formular-UI
- [ ] Produkt-Erstellen Formular
- [ ] Produkt-Bearbeiten Formular
- [ ] Influencer-Erstellen Formular
- [ ] Image-Upload zu Supabase Storage

### Phase 5: Erweiterte Features
- [ ] Bestellungen-Verwaltung
- [ ] Statistiken & Analytics
- [ ] Export-Funktionen (CSV)
- [ ] Bulk-Operationen

---

**Admin-Panel Version:** 1.0.0  
**Letztes Update:** 13. Februar 2026  
**Status:** ✅ Funktionsfähig (Development)
