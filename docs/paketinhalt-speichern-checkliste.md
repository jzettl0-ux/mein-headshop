# Paketinhalt speichern – Checkliste & Ablauf

## Hinweis: Browser-Fehler „message channel closed“

Die Meldung **„A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received“** kommt von einer **Browser-Erweiterung** (z. B. Passwort-Manager, Adblocker, Übersetzer), nicht von deiner App. Du kannst sie ignorieren oder Erweiterungen im Inkognito-Modus deaktivieren.

## SQL-Fehler behoben

**Fehler:** `cannot change return type of existing function`  
**Lösung:** In der Migration wird die Funktion zuerst gelöscht, dann neu angelegt.

In **`supabase/migration-order-shipment-items-rpc.sql`** steht jetzt:
```sql
DROP FUNCTION IF EXISTS public.save_order_shipment_items(UUID, JSONB);
CREATE OR REPLACE FUNCTION public.save_order_shipment_items(...)
```

→ **In Supabase SQL Editor die komplette Datei ausführen** (mit DROP am Anfang).

---

## Beteiligte Ordner & Dateien (Ablauf)

### 1. Datenbank (Supabase)

| Datei | Zweck |
|-------|--------|
| `supabase/migration-order-shipment-items.sql` | Tabelle `order_shipment_items` + RLS (muss einmal gelaufen sein) |
| `supabase/migration-order-shipment-items-rpc.sql` | RPC `save_order_shipment_items` (DROP + CREATE, Rückgabe INTEGER) |
| `supabase/migration-order-shipment-items-allow-insert.sql` | Zusätzliche INSERT-Policy für Backend |

**Prüfen:** Im Supabase **Table Editor** existiert `order_shipment_items`. Im **SQL Editor** z. B. `SELECT * FROM save_order_shipment_items('00000000-0000-0000-0000-000000000000'::uuid, '[]'::jsonb);` → sollte eine Zahl zurückgeben (0 wenn keine Zeilen).

### 2. API – Schreiben (PUT)

| Datei | Zweck |
|-------|--------|
| `app/api/admin/orders/[id]/shipments/[shipmentId]/items/route.ts` | PUT: RPC `save_order_shipment_items`, bei Fehler Fallback DELETE + INSERT mit `createSupabaseAdmin()` |

**Ablauf:** Body `{ items: [{ order_item_id, quantity }] }` → Validierung → RPC; bei RPC-Fehler Fallback mit Admin-Client. Rückgabe: `savedCount`, `itemsForShipment`, ggf. Fehler wenn RPC 0 Zeilen meldet.

**Prüfen:** `.env.local` enthält `SUPABASE_SERVICE_ROLE_KEY` und `NEXT_PUBLIC_SUPABASE_URL`.

### 3. API – Lesen (GET)

| Datei | Zweck |
|-------|--------|
| `app/api/admin/orders/[id]/shipment-items/route.ts` | GET: Sendungen + `order_shipment_items` lesen, `itemsByShipment` bauen |

**Ablauf:** `order_shipments` für `order_id` → `order_shipment_items` für diese Sendungen → Produktnamen aus `order_items` → JSON `{ shipments, itemsByShipment }`. Bei Fehler beim Lesen von `order_shipment_items` wird jetzt geloggt: `[shipment-items] GET order_shipment_items error:`.

**Prüfen:** Im Terminal (npm run dev) erscheint bei Lade-Problemen eine Fehlermeldung.

### 4. Admin-Frontend

| Datei | Zweck |
|-------|--------|
| `app/admin/orders/[id]/page.tsx` | Bestelldetail: `loadOrder` lädt u. a. `shipment-items`, Dialog „Inhalt bearbeiten“, Speichern ruft PUT auf, setzt `itemsByShipment` aus Response |

**Ablauf:**  
- `loadOrder`: `orderId` aus URL → Order, Order-Items (API), Sendungen (Supabase Client), dann GET `shipment-items` → `setItemsByShipment(loaded)`.  
- Speichern: `merged` aus Ref + State → PUT mit `items` → bei Erfolg `setItemsByShipment(prev => ({ ...prev, [shipmentId]: data.itemsForShipment }))`.

**Prüfen:** Gleiche Bestell-ID in URL wie in den API-Aufrufen (UUID, nicht Bestellnummer).

### 5. Sonstige Stellen

| Datei | Zweck |
|-------|--------|
| `app/api/admin/orders/[id]/tracking/route.ts` | Beim Hinzufügen einer Sendung optional `body.items` in `order_shipment_items` einfügen (mit gleichem `client`: Admin oder Server-Supabase) |
| `lib/supabase-admin.ts` | `createSupabaseAdmin()` nutzt `SUPABASE_SERVICE_ROLE_KEY` (RLS wird umgangen) |

---

## Typische Ursachen, wenn es „nicht speichert“

1. **RPC nicht ausgeführt / veraltet**  
   → `migration-order-shipment-items-rpc.sql` **komplett** im Supabase SQL Editor ausführen (mit DROP am Anfang).

2. **Tabelle fehlt**  
   → `migration-order-shipment-items.sql` ausführen.

3. **Service-Role-Key fehlt**  
   → In Supabase: Project Settings → API → `service_role` (geheim) in `.env.local` als `SUPABASE_SERVICE_ROLE_KEY`.

4. **Lesefehler**  
   → Nach Speichern und Reload: Terminal auf `[shipment-items] GET order_shipment_items error:` prüfen. Wenn Meldung erscheint: Fehlercode/Text notieren (Tabelle/RLS/Rechte).

5. **Falsche ID**  
   → Bestellung über Link mit `order.id` (UUID) öffnen, nicht mit Bestellnummer; gleiche ID wird für PUT und GET verwendet.

---

## Schnelltest nach Migration

1. Supabase SQL Editor: komplette `migration-order-shipment-items-rpc.sql` ausführen.
2. Admin: Bestellung öffnen → Sendung vorhanden → „Inhalt bearbeiten“ → Artikel mit + hinzufügen → Speichern.
3. Seite mit F5 neu laden → „In diesem Paket“ sollte die gespeicherten Artikel anzeigen.
4. Optional: Supabase Table Editor → `order_shipment_items` → neue Zeilen für die Sendung sichtbar.
