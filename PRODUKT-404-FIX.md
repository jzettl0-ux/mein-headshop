# 🔧 Fix: Produkt 404 - Nicht gefunden

## ❗ Problem: Beim Klick auf Produkt kommt 404

---

## ✅ LÖSUNG (2 Schritte):

### **SCHRITT 1: Datenbank-Reset ausführen**

⚠️ **WICHTIG:** Hast du das gemacht?

```bash
1. Supabase Dashboard öffnen
2. SQL Editor
3. Datei öffnen: supabase/KOMPLETTES-RESET.sql
4. ALLES kopieren (Strg + A, dann Strg + C)
5. In SQL Editor einfügen (Strg + V)
6. "Run" klicken
7. Warten bis "Success"
✅ 10 Produkte & 3 Influencer erstellt!
```

**Prüfe ob es geklappt hat:**
```sql
-- Im SQL Editor ausführen:
SELECT name, slug FROM products;

-- Sollte 10 Produkte zeigen!
```

---

### **SCHRITT 2: Browser komplett neu laden**

```bash
1. Drücke: Strg + Shift + R (Hard-Reload)
2. Oder: F5 mehrmals
3. Oder: Browser schließen & neu öffnen
```

---

## 🧪 DANN TESTE:

```bash
1. http://localhost:3000/shop
✅ Siehst du 10 Produkte?

2. Klicke auf ein Produkt
✅ Öffnet sich die Detailseite?

3. Falls JA:
✅ Problem gelöst!

4. Falls NEIN:
→ Siehe "Debug-Schritte" unten
```

---

## 🔍 DEBUG-SCHRITTE:

### Check 1: Sind Produkte in der Datenbank?

```sql
-- In Supabase SQL Editor:
SELECT COUNT(*) as anzahl FROM products;

Falls 0:
→ KOMPLETTES-RESET.sql wurde nicht ausgeführt
→ Oder Import hatte Fehler
→ Nochmal ausführen!

Falls > 0:
→ Produkte sind da, weiter zu Check 2
```

### Check 2: Browser-Console prüfen

```bash
1. Öffne: http://localhost:3000/shop
2. Drücke F12 (DevTools)
3. Gehe zu "Console" Tab
4. Klicke auf ein Produkt
5. Schaue nach Errors (rot)

Siehst du:
- "Error loading product:" → Copy Error-Message
- 404 oder 403 → RLS-Problem
- Network Error → Supabase-Verbindung
```

### Check 3: Produkt-Slug prüfen

```bash
1. Hover über Produkt
2. Unten links im Browser siehst du URL
3. Steht da: /shop/premium-glasbong-crystal ?
✅ Slug ist korrekt

4. Klick auf Produkt
5. Schaue URL-Bar
6. Steht da: /shop/[slug] ?
→ Routing-Problem
```

---

## 🔧 LÖSUNGEN:

### Lösung 1: Datenbank ist leer

```sql
-- KOMPLETTES-RESET.sql nochmal ausführen
-- Sollte 10 Produkte erstellen
```

### Lösung 2: RLS-Problem

```sql
-- In Supabase SQL Editor:
-- Prüfe RLS Policies
SELECT * FROM products LIMIT 1;

-- Falls Error:
-- RLS Policies fehlen
-- KOMPLETTES-RESET.sql hat auch Policies!
```

### Lösung 3: Server-Problem

```bash
# Server neu starten
Strg + C
npm run dev

# Browser neu laden
Strg + Shift + R
```

---

## 💡 FALLBACK-MODUS:

Ich habe Mock-Daten als Fallback eingebaut!

**Auch OHNE Datenbank** sollten diese Produkte funktionieren:
- `/shop/premium-glasbong-crystal` ✅
- `/shop/max-choice-perkolator-bong` ✅
- `/shop/xxl-grinder-gold` ✅
- `/shop/raw-black-king-size` ✅
- `/shop/mighty-plus-vaporizer` ✅

**Teste diese URLs direkt!**

---

## 🎯 SCHNELL-TEST:

Öffne direkt:
```
http://localhost:3000/shop/premium-glasbong-crystal
```

**Wenn das funktioniert:**
→ Datenbank ist leer
→ Führe KOMPLETTES-RESET.sql aus

**Wenn das NICHT funktioniert:**
→ Routing-Problem
→ Schaue in Browser-Console

---

## 📊 ERWARTETES VERHALTEN:

### Mit Datenbank (nach KOMPLETTES-RESET.sql):
```
/shop → 10 Produkte sichtbar
Klick → /shop/[slug] → Produkt-Details mit echten DB-Daten
✅ Checkout funktioniert (echte UUIDs)
```

### Ohne Datenbank (Fallback):
```
/shop → Mock-Produkte sichtbar
Klick → /shop/[slug] → Produkt-Details mit Mock-Daten
⚠️ Checkout funktioniert NICHT (String-IDs)
```

---

## 🚀 FINALE CHECKLISTE:

```
[ ] KOMPLETTES-RESET.sql ausgeführt
[ ] Browser Hard-Reload (Strg + Shift + R)
[ ] /shop öffnen
[ ] Produkte sichtbar?
[ ] Produkt anklicken
[ ] Detailseite öffnet sich?
[ ] ✅ Problem gelöst!
```

---

## 📞 WENN NICHTS HILFT:

Führe in Supabase aus:
```sql
-- Debug-Query:
SELECT slug, name FROM products;

-- Sollte zeigen:
-- premium-glasbong-crystal | Premium Glasbong...
-- xxl-grinder-gold | XXL Grinder...
-- etc.
```

Schick mir das Ergebnis!

---

**Führe KOMPLETTES-RESET.sql aus, dann sollte alles funktionieren!** 🚀
