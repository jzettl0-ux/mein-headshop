# 🔐 Supabase Auth Setup - Admin-Authentifizierung

## 🎯 Übersicht

Das Admin-Panel ist jetzt mit **Supabase Auth** gesichert. Nur der Account `jzettl0@gmail.com` hat Zugriff.

---

## 🚀 Setup-Schritte

### 1. Admin-Account in Supabase erstellen

#### Option A: Über Supabase Dashboard (Empfohlen)

1. Öffne dein Supabase Dashboard: https://tqjjjnvuuxcqrwxmhgkn.supabase.co
2. Gehe zu **Authentication** → **Users**
3. Klicke auf **"Add user"** → **"Create new user"**
4. Fülle das Formular aus:
   ```
   Email: jzettl0@gmail.com
   Password: [Dein sicheres Passwort]
   Auto Confirm User: ✅ JA (wichtig!)
   ```
5. Klicke **"Create user"**
6. ✅ Fertig! Der Admin-Account ist erstellt.

#### Option B: Per SQL

```sql
-- Im Supabase SQL Editor:
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  role
) VALUES (
  gen_random_uuid(),
  'jzettl0@gmail.com',
  crypt('DEIN_PASSWORT', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  'authenticated'
);
```

**Wichtig:** Ersetze `DEIN_PASSWORT` mit deinem gewünschten Passwort!

---

### 2. Middleware-Paket installieren

Das Middleware-Paket für Supabase Auth ist noch nicht installiert:

```bash
npm install @supabase/auth-helpers-nextjs
```

**Nach der Installation:**
```bash
# Server neu starten
npm run dev
```

---

### 3. Email-Bestätigung deaktivieren (Development)

Für Development solltest du Email-Bestätigung deaktivieren:

1. Gehe zu **Authentication** → **Email Templates**
2. Klicke auf **"Settings"**
3. Finde **"Enable email confirmations"**
4. Deaktiviere es für Development
5. Speichern

**Oder:** Setze `Auto Confirm User: YES` beim User-Erstellen (siehe oben)

---

## 🔐 Wie funktioniert die Sicherheit?

### Middleware (`middleware.ts`)

```typescript
// Prüft ALLE /admin/* Routen
- Kein User eingeloggt? → Redirect zu /login
- User eingeloggt, aber nicht jzettl0@gmail.com? → Redirect zu /login
- User ist jzettl0@gmail.com? → ✅ Zugriff erlauben
```

### Admin-Layout (`app/admin/layout.tsx`)

```typescript
// Zusätzliche Client-Side Überprüfung
- Holt aktuellen User von Supabase
- Hört auf Auth-State Änderungen
- Zeigt User-Email in Header an
- Logout-Funktion
```

### Login-Seite (`app/login/page.tsx`)

```typescript
// Supabase Auth signInWithPassword
- Email & Passwort eingeben
- Supabase validiert Credentials
- Bei Erfolg: Redirect zu /admin
- Bei Fehler: Fehlermeldung anzeigen
```

---

## 🎯 Login-Flow

### 1. User versucht `/admin` zu öffnen

```
Middleware prüft:
├─ Ist User eingeloggt?
│  ├─ NEIN → Redirect zu /login
│  └─ JA → Ist es jzettl0@gmail.com?
│     ├─ NEIN → Redirect zu /login (unauthorized)
│     └─ JA → ✅ Zugriff erlauben
```

### 2. User geht zu `/login`

```
Login-Formular:
├─ Email: jzettl0@gmail.com eingeben
├─ Passwort: [Dein Passwort] eingeben
├─ Klick "Anmelden"
├─ Supabase Auth validiert
│  ├─ Fehler → Fehlermeldung anzeigen
│  └─ Erfolg → Session erstellen
└─ Redirect zu /admin ✅
```

### 3. User ist im Admin-Panel

```
Admin-Layout:
├─ Zeigt User-Email an
├─ Logout-Button verfügbar
├─ Auth-State Listener aktiv
└─ Bei Logout → Session löschen → Redirect zu /login
```

---

## 🧪 Testen

### Test 1: Login

```bash
1. Öffne: http://localhost:3000/login
2. Eingeben:
   Email: jzettl0@gmail.com
   Passwort: [Dein Passwort]
3. Klick "Anmelden"
4. ✅ Sollte zu /admin redirecten
```

### Test 2: Geschützte Route

```bash
1. Öffne: http://localhost:3000/admin (ohne Login)
2. ✅ Sollte automatisch zu /login redirecten
```

### Test 3: Falscher User

```bash
# Erstelle einen zweiten Test-User im Supabase Dashboard
Email: test@example.com

1. Login mit test@example.com
2. Versuche /admin zu öffnen
3. ✅ Sollte zu /login redirecten mit "unauthorized"
```

### Test 4: Logout

```bash
1. Im Admin-Panel
2. Klick "Abmelden" (oben rechts)
3. ✅ Sollte zu /login redirecten
4. Versuche /admin zu öffnen
5. ✅ Sollte wieder zu /login redirecten
```

---

## 🔒 Sicherheits-Features

### ✅ Was ist gesichert:

1. **Route-Protection**
   - Middleware prüft ALLE /admin/* Routen
   - Nur autorisierte User haben Zugriff

2. **Email-Whitelist**
   - Nur `jzettl0@gmail.com` ist Admin
   - Hardcoded in `middleware.ts` und `lib/supabase/auth.ts`

3. **Session-Management**
   - Supabase Auth Tokens
   - Automatische Refresh
   - Sichere Cookie-Verwaltung

4. **Client + Server Schutz**
   - Middleware (Server-Side)
   - Layout-Check (Client-Side)
   - Doppelte Absicherung

### ⚠️ Was noch zu tun ist (Production):

1. **Row Level Security (RLS)**
   ```sql
   -- In Supabase SQL Editor
   -- Produkte nur für Admin bearbeitbar
   CREATE POLICY "Admin can edit products"
     ON products
     FOR ALL
     USING (auth.jwt() ->> 'email' = 'jzettl0@gmail.com');
   ```

2. **API-Schutz**
   - API-Routes auch mit Auth schützen
   - Server-Side Validierung

3. **Audit Logging**
   - Wer hat was geändert?
   - Timestamp tracking

---

## 🐛 Troubleshooting

### Problem: "Module not found: @supabase/auth-helpers-nextjs"

**Lösung:**
```bash
npm install @supabase/auth-helpers-nextjs
```

### Problem: "Invalid login credentials"

**Lösungen:**
1. Passwort falsch → Nochmal eingeben
2. User existiert nicht → Im Supabase Dashboard erstellen
3. Email nicht bestätigt → Auto-Confirm aktivieren

### Problem: "Email not confirmed"

**Lösung:**
```sql
-- Im Supabase SQL Editor:
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email = 'jzettl0@gmail.com';
```

### Problem: Middleware funktioniert nicht

**Lösung:**
```bash
# Middleware-Paket installieren
npm install @supabase/auth-helpers-nextjs

# Server neu starten
npm run dev
```

### Problem: Redirect-Loop

**Lösung:**
- Browser-Cache leeren
- Cookies löschen
- Neu einloggen

---

## 📝 Code-Referenz

### Admin-Email ändern

Wenn du eine andere Admin-Email nutzen willst:

**1. In `middleware.ts`:**
```typescript
const ADMIN_EMAIL = 'deine-neue@email.com'
```

**2. In `lib/supabase/auth.ts`:**
```typescript
export const ADMIN_EMAIL = 'deine-neue@email.com'
```

**3. User in Supabase erstellen mit dieser Email**

---

## ✅ Checkliste

Bevor du loslegst:

- [ ] Middleware-Paket installiert: `@supabase/auth-helpers-nextjs`
- [ ] Admin-User in Supabase erstellt (jzettl0@gmail.com)
- [ ] Email bestätigt (Auto-Confirm oder manuell)
- [ ] Server neu gestartet nach npm install
- [ ] Login getestet
- [ ] /admin-Zugriff getestet
- [ ] Logout getestet

---

## 🚀 Nächste Schritte

Nach erfolgreichem Login:

1. ✅ Login funktioniert
2. ✅ Admin-Panel ist geschützt
3. 🔜 Row Level Security (RLS) einrichten
4. 🔜 API-Routes absichern
5. 🔜 Audit-Logging implementieren

---

**Version:** 1.0.0  
**Status:** ✅ Bereit für Development  
**Production-Ready:** ⚠️ Noch nicht (RLS fehlt)
