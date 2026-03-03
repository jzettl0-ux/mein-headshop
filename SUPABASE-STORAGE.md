# Supabase Storage: Produktbilder & UGC

Damit der **Upload von Produktbildern vom PC** funktioniert, muss in Supabase ein öffentlicher Storage-Bucket angelegt werden.

## Bucket anlegen

### product-images

1. Im **Supabase Dashboard** deines Projekts zu **Storage** wechseln.
2. **New bucket** (Neuer Bucket) klicken.
3. **Name:** `product-images` (exakt so – der Code erwartet diesen Namen).
4. **Public bucket** aktivieren (Haken setzen), damit die Bild-URLs im Shop ohne Auth abrufbar sind.
5. Bucket erstellen.

Nach dem Anlegen liefert die Upload-API automatisch öffentliche URLs (z. B. `https://…supabase.co/storage/v1/object/public/product-images/…`). Diese URLs funktionieren dauerhaft, auch wenn der Shop auf einem eigenen Server läuft – sie zeigen auf deinen Supabase-Storage.

### ugc-images (Rate my Setup)

Für das Feature **Rate my Setup** (UGC-Galerie) wird ein zusätzlicher Bucket benötigt:

1. **New bucket** (Neuer Bucket) klicken.
2. **Name:** `ugc-images` (exakt so).
3. **Public bucket** aktivieren.
4. Bucket erstellen.

Erlaubte Formate: JPEG, PNG, WebP; max. 5 MB pro Datei. Kunden laden Setup-Fotos hoch; diese erscheinen nach Admin-Freigabe in der Community-Galerie unter `/rate-my-setup`.

## Hinweise

- **product-images:** JPEG, PNG, WebP, GIF; max. 5 MB pro Datei.
- **ugc-images:** JPEG, PNG, WebP; max. 5 MB pro Datei.
- Wenn ein Bucket fehlt, erscheint beim Upload eine klare Fehlermeldung mit Hinweis auf den Bucket-Namen.
