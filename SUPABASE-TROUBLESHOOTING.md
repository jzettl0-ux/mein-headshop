# Supabase: „Failed to fetch (api.supabase.com)“

Wenn im Browser oder in der Konsole **Failed to fetch (api.supabase.com)** erscheint, erreicht deine App die Supabase-API nicht. Typische Ursachen und Schritte:

## 1. Projekt pausiert (Free Tier)

Supabase pausiert Projekte nach längerer Inaktivität.

- **Supabase Dashboard** öffnen: https://supabase.com/dashboard  
- Projekt auswählen (z. B. `tqjjjnvuuxcqrwxmhgkn`)  
- Wenn „Project is paused“ angezeigt wird: **Restore project** klicken  
- Einige Sekunden warten, dann die App neu laden  

## 2. Netzwerk / Firewall

- **Internetverbindung** prüfen (andere Seiten laden?)  
- **VPN** kurz deaktivieren (manche blockieren api.supabase.com)  
- **Firmen-Firewall**: Zugriff auf `*.supabase.co` und `api.supabase.com` erlauben  

## 3. Browser / Erweiterungen

- **Adblocker** oder Datenschutz-Erweiterungen vorübergehend deaktivieren  
- **Inkognito-Fenster** testen (ohne Erweiterungen)  
- Anderen Browser testen  

## 4. Umgebungsvariablen (lokal)

In `.env.local` müssen stehen:

- `NEXT_PUBLIC_SUPABASE_URL=https://dein-projekt.supabase.co`  
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...`  
- Für Admin/Backend: `SUPABASE_SERVICE_ROLE_KEY=eyJ...`  

Nach Änderung an `.env.local`: **Dev-Server neu starten** (`npm run dev` neu ausführen).

## 5. Supabase-Status

- Status-Seite prüfen: https://status.supabase.com  
- Bei Ausfällen dort abwarten und später erneut testen  

## Kurz-Checkliste

1. Im Dashboard prüfen, ob das Projekt aktiv ist (nicht pausiert).  
2. Projekt ggf. mit **Restore project** reaktivieren.  
3. `.env.local` prüfen, Dev-Server neu starten.  
4. Ohne VPN / in anderem Browser testen.  

Wenn es dann noch fehlschlägt: In den **Browser-Entwicklertools → Network** die fehlgeschlagene Anfrage auswählen und Statuscode sowie Antwort ansehen – das hilft bei der weiteren Fehlersuche.
