# SUPABASE_SERVICE_ROLE_KEY – "Invalid API key" beheben

## 1. Debug-Route ausprobieren

Im **Development** im Browser öffnen:

**http://localhost:3000/api/debug-supabase-admin**

Die Antwort zeigt:
- ob der Key geladen wird und wie lang er ist
- ob Supabase den Key akzeptiert oder einen genauen Fehler zurückgibt

**Hinweis:** Service-Role-Key ist meist **200+ Zeichen** lang. Wenn die Länge deutlich kürzer ist, wurde oft der **anon**-Key eingetragen.

---

## 2. Richtigen Key eintragen

1. **Supabase Dashboard** → dein Projekt
2. **Project Settings** (Zahnrad) → **API**
3. Unter **Project API keys**:
   - **anon** / **public** → nur für Frontend (z. B. `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **service_role** → auf **Reveal** klicken und **diesen** Key kopieren

4. In **`.env.local`** (im **Projektroot**, dort wo `package.json` liegt):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi...
```

- **Keine Anführungszeichen** um den Key
- **Keine Leerzeichen** vor/nach dem `=`
- Key in **einer Zeile** (kein Zeilenumbruch mitten im Key)
- Dateiname exakt: **`.env.local`** (mit Punkt am Anfang)

---

## 3. URL und Key müssen zusammenpassen

`NEXT_PUBLIC_SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY` müssen vom **gleichen** Supabase-Projekt stammen.  
Wenn du die URL von Projekt A und den Key von Projekt B nutzt, kommt „Invalid API key“.

---

## 4. Server neu starten

Nach Änderungen an `.env.local`:

- **Terminal:** `Ctrl+C`, dann `npm run dev`
- Oder Dev-Server in der IDE stoppen und neu starten

---

## 5. "Invalid API key" obwohl Key gesetzt und 200+ Zeichen

Dann passen **URL und Key oft nicht zusammen** oder der Key ist veraltet:

1. **Gleiches Projekt prüfen**
   - Im Debug (/api/debug-supabase-admin) steht **urlProjektId** (z. B. `tqjjjnvuuxcqrwxmhgkn`).
   - Im Browser: Supabase Dashboard öffnen, dein Projekt wählen. In der Adresszeile steht z. B. `.../project/tqjjjnvuuxcqrwxmhgkn/...`.
   - **Projekt-ID muss exakt gleich sein.** Wenn du mehrere Supabase-Projekte hast, URL und Key müssen vom **gleichen** Projekt sein.

2. **Key neu kopieren**
   - Supabase → **Project Settings** → **API** (genau in dem Projekt, das zur URL passt).
   - Bei **service_role** auf **Reveal** klicken, kompletten Key markieren und neu kopieren (Strg+C).
   - In `.env.local` die Zeile `SUPABASE_SERVICE_ROLE_KEY=...` **komplett ersetzen**, speichern, Server neu starten.

3. **URL abgleichen**
   - Auf derselben API-Seite steht **Project URL** (z. B. `https://tqjjjnvuuxcqrwxmhgkn.supabase.co`).
   - In `.env.local` muss `NEXT_PUBLIC_SUPABASE_URL` **genau diese** URL sein (kein Slash am Ende, kein anderes Projekt).

4. **Key-Regenerierung**
   - Falls der Key früher mal geändert oder das Projekt neu angelegt wurde: Alte Keys sind ungültig. Nur der **aktuell** im Dashboard angezeigte **service_role**-Key funktioniert.

---

## 6. Sonst

- In der Antwort von **/api/debug-supabase-admin** steht der genaue Supabase-Fehler.
- Prüfen, ob eine andere `.env` (z. B. `.env`) denselben Variablennamen überschreibt.
- Prüfen, ob der Key beim Kopieren abgeschnitten wurde (ganzen Key erneut kopieren).
