# 📥 Supabase Datenbank Import-Anleitung

## 🎯 Schritt-für-Schritt zum fertigen Shop mit echten Daten!

### Schritt 1: Hauptschema installieren (falls noch nicht geschehen)

1. Öffne dein **Supabase Dashboard**: https://tqjjjnvuuxcqrwxmhgkn.supabase.co
2. Klicke in der linken Sidebar auf **"SQL Editor"**
3. Öffne die Datei **`supabase/schema.sql`** in VS Code
4. Markiere **ALLES** (Strg + A / Cmd + A)
5. Kopiere es (Strg + C / Cmd + C)
6. Gehe zurück zum Supabase SQL Editor
7. Füge den Code ein (Strg + V / Cmd + V)
8. Klicke auf den grünen **"Run"** Button (oder Strg + Enter)
9. ✅ Warte bis "Success" erscheint

**Was wurde erstellt?**
- ✅ Tabellen: `products`, `influencers`, `orders`, `order_items`
- ✅ Row Level Security (RLS) Policies
- ✅ Storage Buckets: `product-images`, `influencer-images`
- ✅ Indizes für Performance
- ✅ Automatische Timestamps

---

### Schritt 2: Test-Daten (Seed) importieren

1. Im gleichen **SQL Editor** (oder klicke "+ New query")
2. Öffne die Datei **`supabase/seed-data.sql`** in VS Code
3. Markiere **ALLES** (Strg + A / Cmd + A)
4. Kopiere es (Strg + C / Cmd + C)
5. Gehe zurück zum Supabase SQL Editor
6. Füge den Code ein (Strg + V / Cmd + V)
7. Klicke auf **"Run"** ▶️
8. ✅ Warte bis "Success" erscheint

**Was wurde erstellt?**
- ✅ **10 Premium-Produkte** mit echten Unsplash Bildern:
  - 4x Standard-Produkte (Bongs, Grinder, Papers, Vaporizer)
  - 6x Influencer-Edition Produkte
  - Mix aus 18+ und freien Produkten
- ✅ **3 Test-Influencer**:
  - Max Grün (Neon-Grün)
  - Lisa High (Gold)
  - Tom Smoke (Orange)

---

### Schritt 3: Daten überprüfen

Im Supabase Dashboard:

1. Klicke auf **"Table Editor"** in der Sidebar
2. Wähle **`products`** Tabelle
   - Du solltest jetzt **10 Produkte** sehen mit echten Bildern! 🎉
3. Wähle **`influencers`** Tabelle
   - Du solltest **3 Influencer** sehen

**Alternative: SQL Query ausführen**
```sql
-- Alle Produkte anzeigen
SELECT name, price, category, stock FROM products;

-- Alle Influencer anzeigen
SELECT name, slug, accent_color FROM influencers;

-- Influencer mit ihren Produkten
SELECT 
  i.name as influencer,
  p.name as product,
  p.price
FROM products p
LEFT JOIN influencers i ON p.influencer_id = i.id
WHERE p.influencer_id IS NOT NULL;
```

---

### Schritt 4: App testen mit echten Daten

Jetzt kannst du deine App mit echten Daten testen!

```bash
# Falls noch nicht gestartet
npm run dev
```

**Teste folgende Seiten:**

1. **Homepage** (http://localhost:3000)
   - ✅ Featured Products zeigen jetzt echte Bilder!
   
2. **Shop** (http://localhost:3000/shop)
   - ✅ Filter nach Kategorien testen
   - ✅ Produkte haben jetzt schöne Unsplash Bilder
   
3. **Produkt-Detailseite** (http://localhost:3000/shop/premium-glasbong-crystal)
   - ✅ Image-Galerie mit mehreren Bildern
   - ✅ 18+ Warnung bei Adult-Produkten
   - ✅ Menge ändern & In den Warenkorb legen
   
4. **Influencer-Pages**
   - http://localhost:3000/influencer/max-gruen
   - http://localhost:3000/influencer/lisa-high
   - http://localhost:3000/influencer/tom-smoke
   - ✅ Individuelle Farben & Banner
   
5. **Warenkorb** (http://localhost:3000/cart)
   - ✅ Füge ein 18+ Produkt hinzu
   - ✅ Schau dir die automatische 2€ Gebühr an

---

## 🎨 Die Test-Produkte im Detail

### Standard-Produkte:
1. **Premium Glasbong "Crystal"** - 89,99€ (18+)
2. **XXL Grinder Gold Edition** - 34,99€
3. **RAW Black King Size Papers** - 4,99€
4. **Mighty+ Vaporizer** - 349,99€ (18+)
5. **Clipper Feuerzeug Set** - 9,99€
6. **Premium Rolling Tray Gold** - 24,99€

### Influencer-Produkte:
7. **Max's Choice Perkolator Bong** - 129,99€ (18+, Max Grün)
8. **Max Grün Signature Grinder** - 44,99€ (Max Grün)
9. **Lisa's Gold Bong Deluxe** - 199,99€ (18+, Lisa High)
10. **Tom's Tech Vape Station** - 279,99€ (18+, Tom Smoke)

---

## 🖼️ Bilder-Quellen

Alle Bilder stammen von **Unsplash** (lizenzfrei):
- Hochauflösende Produktfotos
- Automatisch optimiert (w=800&q=80)
- Funktionieren sofort ohne Upload

**Wichtig für Production:**
- Lade später eigene Produktfotos zu Supabase Storage hoch
- Nutze die gleichen IDs aus der seed-data.sql
- Dann einfach die URLs in der Datenbank updaten

---

## ⚠️ Troubleshooting

**Problem: "relation products already exists"**
- **Lösung:** Schema wurde schon erstellt. Überspringe Schritt 1.

**Problem: "duplicate key value violates unique constraint"**
- **Lösung:** Seed-Daten wurden schon importiert. Alles OK!

**Problem: Bilder laden nicht**
- **Lösung:** Überprüfe deine Internet-Verbindung (Unsplash-Bilder)

**Problem: Keine Produkte auf der Website sichtbar**
- **Lösung:** Die App nutzt aktuell noch Mock-Daten. Das ist OK für Development!
- Später verbinden wir die echten Supabase-Daten

---

## 🚀 Nächste Schritte

Nachdem du die Daten importiert hast:

1. ✅ **Produkt-Detailseiten testen**
2. ✅ **Warenkorb-Logik prüfen** (18+ Gebühr)
3. ✅ **Influencer-Pages ansehen**
4. 🔜 **Checkout-Flow implementieren**
5. 🔜 **Admin-Panel erstellen**
6. 🔜 **Payment-Integration (Stripe/PayPal)**

---

## 📞 Support

Probleme beim Import?
- Überprüfe die Console in Supabase für Fehlermeldungen
- Stelle sicher, dass du die `.env.local` Datei korrekt konfiguriert hast
- Teste die Verbindung: SQL Editor → `SELECT 1;` → Run

**Du bist bereit! Happy Coding! 🎉🌿**
