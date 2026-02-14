# 🐛 Debug-Guide: Bestellungen

## Problem: "0 Artikel" bei Bestellungen

### Prüfe in Supabase:

```sql
-- 1. Alle Bestellungen anzeigen
SELECT id, order_number, created_at FROM orders;

-- 2. Für eine Bestellung die Items prüfen
-- (Ersetze 'ORDER-ID-HIER' mit einer echten ID aus Schritt 1)
SELECT * FROM order_items WHERE order_id = 'ORDER-ID-HIER';

-- 3. Bestellungen MIT Item-Count
SELECT 
  o.order_number,
  o.total,
  COUNT(oi.id) as items_count
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id, o.order_number, o.total;
```

---

## 🔍 Debugging-Schritte:

### Schritt 1: Prüfe Browser-Console

```bash
1. Öffne: http://localhost:3000/admin/orders
2. Drücke F12 (Dev-Tools)
3. Gehe zu "Console" Tab
4. Schaue nach Fehlern (rot)

Siehst du:
- "Error loading orders:" → Copy den Error
- "Error counting items:" → Copy den Error
- 401/403 → RLS Policy Problem
- 404 → Tabelle existiert nicht
```

### Schritt 2: Prüfe Netzwerk-Requests

```bash
1. Dev-Tools → "Network" Tab
2. Reload Seite
3. Filter auf "fetch" oder "xhr"
4. Schaue nach roten Requests

Bei Fehler:
- Klick auf Request
- Gehe zu "Response" Tab
- Copy Error-Message
```

### Schritt 3: Manueller Test in Supabase

```bash
1. Supabase Dashboard → SQL Editor
2. Führe aus:

-- Bestellungen prüfen
SELECT * FROM orders;

-- Wenn leer:
→ Noch keine Bestellungen aufgegeben
→ Gehe zu /checkout und erstelle Test-Bestellung

-- Wenn Bestellungen da sind:
SELECT 
  o.order_number,
  o.id
FROM orders o
LIMIT 1;

-- Copy eine order.id, dann:
SELECT * FROM order_items WHERE order_id = '[PASTE-ID-HIER]';

-- Wenn leer:
→ order_items wurden nicht erstellt
→ Problem beim Checkout
```

---

## 🔧 LÖSUNGEN:

### Lösung 1: RLS Policy Problem

Wenn du "permission denied" siehst:

```sql
-- Im Supabase SQL Editor:
-- Prüfe ob Admin-Function existiert:
SELECT is_admin();

-- Sollte true zurückgeben wenn du als jzettl0@gmail.com eingeloggt bist

-- Falls Function fehlt, importiere:
-- supabase/admin-rls.sql nochmal
```

### Lösung 2: Order-Items fehlen

Wenn `order_items` Tabelle leer ist:

```sql
-- Prüfe ob Tabelle existiert:
SELECT * FROM order_items LIMIT 1;

-- Falls Error:
→ Importiere schema.sql nochmal
```

### Lösung 3: Test-Bestellung manuell erstellen

```sql
-- Im SQL Editor:

-- 1. Order erstellen
INSERT INTO orders (
  order_number,
  customer_email,
  customer_name,
  shipping_address,
  billing_address,
  subtotal,
  shipping_cost,
  total,
  status,
  has_adult_items
) VALUES (
  'TEST-001',
  'test@example.com',
  'Test User',
  '{"first_name":"Test","last_name":"User","street":"Teststr","house_number":"1","postal_code":"12345","city":"Berlin","country":"Deutschland","phone":"0123456789"}'::jsonb,
  '{}'::jsonb,
  89.99,
  4.90,
  94.89,
  'pending',
  false
) RETURNING id;

-- 2. Copy die zurückgegebene ID

-- 3. Order Items erstellen (ersetze ORDER-ID)
INSERT INTO order_items (
  order_id,
  product_id,
  product_name,
  product_image,
  quantity,
  price,
  total
) VALUES (
  'ORDER-ID-HIER',
  'prod-001',
  'Test Produkt',
  'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&q=80',
  1,
  89.99,
  89.99
);
```

---

## 🧪 VOLLSTÄNDIGER TEST:

### Als Kunde bestellen:

```bash
1. Registriere als Kunde:
   → http://localhost:3000/auth
   → Email: kunde@test.com
   → Passwort: testtest123

2. Füge Produkte hinzu:
   → /shop
   → 2-3 Produkte in Warenkorb

3. Checkout:
   → /cart → "Zur Kasse"
   → Formular ausfüllen
   → "Zahlungspflichtig bestellen"

4. Prüfe in Supabase:
   SELECT * FROM orders ORDER BY created_at DESC LIMIT 1;
   → Sollte deine Bestellung zeigen

   SELECT * FROM order_items WHERE order_id = '[DEINE-ORDER-ID]';
   → Sollte 2-3 Items zeigen

5. Admin prüfen:
   → /admin/orders
   → Sollte Bestellung mit richtiger Artikel-Anzahl zeigen
```

---

## 📊 ERWARTETES VERHALTEN:

### In Admin Orders-Liste:
```
Bestellung #ORD-12345678-123
Status: [Badge]
Datum: 13.02.2026
2 Artikel  ← NICHT mehr "0 Artikel"!
89,99 €
```

### Bei "Details ansehen":
```
→ Neue Seite öffnet sich
→ /admin/orders/[id]
→ Alle Artikel werden angezeigt
→ Lieferadresse sichtbar
→ Status änderbar
```

---

## ⚡ SCHNELL-FIX (Falls alles nicht hilft):

### Browser komplett neu laden:

```bash
1. Strg + Shift + R (Hard-Reload)
2. Oder: Strg + Shift + Delete
   → Cache leeren
   → Cookies behalten
   → "Cached Images" löschen
3. Neu laden
```

### Server neu starten:

```bash
Strg + C
npm run dev
```

---

## 📞 WENN PROBLEM WEITERHIN BESTEHT:

Führe im Supabase SQL Editor aus:

```sql
-- Debug-Query:
SELECT 
  o.order_number,
  o.customer_email,
  o.created_at,
  (
    SELECT COUNT(*) 
    FROM order_items oi 
    WHERE oi.order_id = o.id
  ) as actual_items_count
FROM orders o
ORDER BY o.created_at DESC;
```

Schicke mir das Ergebnis!

---

**Status:** ✅ Alle Fixes angewendet  
**Nächster Schritt:** Server neu starten & testen
