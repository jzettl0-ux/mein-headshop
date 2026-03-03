# Paketinhalt (Sendung ↔ Artikel) – Supabase einrichten

**Verknüpfung:** Jede Sendung hat eine `tracking_number` (Sendungsnummer). Welche Artikel in welcher Sendung stecken, steht in der Tabelle `order_shipment_items` (Spalte `shipment_id` = Sendungs-ID). Ohne die Migrationen siehst du die Sendungsnummern, aber der „Inhalt dieses Pakets“ wird nicht gespeichert bzw. nach Reload nicht angezeigt.

Damit „Inhalt bearbeiten“ im Admin dauerhaft speichert und nach Reload sichtbar bleibt:

## 1. Eine SQL-Datei ausführen

1. **Supabase Dashboard** öffnen → dein Projekt.
2. Links **SQL Editor** wählen.
3. Neue Abfrage → **Inhalt von `supabase/migration-order-shipment-items-complete.sql`** komplett reinkopieren.
4. **Run** (oder F5) ausführen.
5. Es sollte „Success“ erscheinen, keine Fehlermeldung.

Die Datei erstellt (falls noch nicht da):

- Tabelle `order_shipment_items`
- RLS-Policies
- RPC-Funktion `save_order_shipment_items`
- Rechte für `service_role`

## 2. .env.local prüfen

- `NEXT_PUBLIC_SUPABASE_URL` = deine Projekt-URL (z. B. `https://xxxx.supabase.co`)
- `SUPABASE_SERVICE_ROLE_KEY` = der **service_role**-Key (unter Project Settings → API → Project API keys → **service_role**), **nicht** der anon key.

Ohne gültigen Service-Role-Key kann die API nicht in `order_shipment_items` schreiben.

## 3. Testen

1. Admin → eine Bestellung mit Sendung öffnen.
2. Bei einer Sendung auf **„Inhalt bearbeiten“** klicken.
3. Mindestens einen Artikel mit + hinzufügen → **Speichern**.
4. Seite **neu laden** (F5).
5. Der zugeordnete Inhalt sollte unter der Sendung wieder sichtbar sein.

## 4. Wenn es nicht funktioniert

- **Fehlermeldung beim Speichern?**  
  Text der Meldung und ggf. Hinweis aus der API (z. B. „migration-order-shipment-items-complete.sql ausführen“) beachten.

- **Speichern zeigt Erfolg, nach Reload ist der Inhalt weg?**  
  Im Supabase SQL Editor prüfen:
  - `SELECT * FROM order_shipment_items ORDER BY created_at DESC LIMIT 10;`
  - Wenn hier **keine** Zeilen nach dem Speichern erscheinen: Schreiben kommt nicht an (z. B. falscher Key, anderes Projekt).
  - Wenn hier **Zeilen** erscheinen: Lesen könnte an anderer Stelle hängen (z. B. falsche Bestellungs-/Sendungs-ID).

- **RPC-Funktion vorhanden?**  
  Im SQL Editor:  
  `SELECT routine_name FROM information_schema.routines WHERE routine_name = 'save_order_shipment_items';`  
  Es sollte eine Zeile zurückkommen.

- **Gleiches Supabase-Projekt?**  
  URL und Key in `.env.local` müssen zum Projekt passen, in dem du im Dashboard die Tabelle/RPC prüfst.
