# 👤 Admin-Account erstellen - Schritt-für-Schritt

## 🎯 Ziel
Wir erstellen deinen Admin-Account `jzettl0@gmail.com` in Supabase

---

## 📝 Anleitung

### SCHRITT 1: Supabase Dashboard öffnen

```
🔗 https://tqjjjnvuuxcqrwxmhgkn.supabase.co
```

1. Klicke auf den Link oben
2. Logge dich in Supabase ein
3. Du siehst dein Dashboard

---

### SCHRITT 2: Zu Authentication navigieren

1. In der **linken Sidebar** siehst du verschiedene Menüpunkte
2. Klicke auf **"Authentication"** (🔐 Icon)
3. Dann klicke auf **"Users"** (unter Authentication)

---

### SCHRITT 3: Neuen User erstellen

1. Oben rechts siehst du einen Button **"Add user"**
2. Klicke darauf
3. Es öffnet sich ein Dropdown
4. Wähle **"Create new user"**

---

### SCHRITT 4: Formular ausfüllen

Ein Modal-Fenster öffnet sich mit einem Formular:

```
┌─────────────────────────────────────────┐
│ Create new user                         │
├─────────────────────────────────────────┤
│                                         │
│ Email *                                 │
│ [jzettl0@gmail.com]                    │ ← Hier eingeben!
│                                         │
│ Password *                              │
│ [Dein-Sicheres-Passwort]               │ ← Hier eingeben!
│                                         │
│ ☑ Auto Confirm User                    │ ← WICHTIG: Anhaken!
│                                         │
│ [Cancel]  [Create user]                │
└─────────────────────────────────────────┘
```

**WICHTIG:**
- ✅ Email: `jzettl0@gmail.com` (genau so!)
- ✅ Password: Wähle ein **sicheres Passwort** (mind. 8 Zeichen)
- ✅ **"Auto Confirm User"** MUSS angehakt sein! ☑

**Passwort-Tipp:**
- Nutze einen Password-Manager (z.B. 1Password, Bitwarden)
- Oder merke dir ein starkes Passwort
- Beispiel: `PremiumShop2024!` (nur ein Beispiel, nutze dein eigenes!)

---

### SCHRITT 5: User erstellen

1. Überprüfe nochmal:
   - ✅ Email: jzettl0@gmail.com
   - ✅ Passwort gesetzt
   - ✅ Auto Confirm User: ☑ angehakt
2. Klicke auf **"Create user"** (grüner Button)
3. Warte 2-3 Sekunden

---

### SCHRITT 6: Bestätigung

Du solltest jetzt sehen:

```
✅ User created successfully
```

Und in der User-Liste siehst du:

```
Email: jzettl0@gmail.com
Status: ✅ Confirmed
Created: [gerade eben]
```

**Perfekt! Admin-Account ist erstellt! 🎉**

---

## 🧪 SCHRITT 7: Testen

Jetzt teste ob der Login funktioniert:

1. Öffne: **http://localhost:3000/login**
2. Eingeben:
   ```
   Email: jzettl0@gmail.com
   Passwort: [Dein Passwort von oben]
   ```
3. Klicke **"Anmelden"**
4. ✅ Du solltest zum Admin-Panel weitergeleitet werden!

---

## ❌ Falls es NICHT funktioniert:

### Problem: "Invalid login credentials"

**Lösung 1:** Passwort falsch
- Überprüfe Groß-/Kleinschreibung
- Überprüfe Sonderzeichen
- Kopiere das Passwort aus deinem Password-Manager

**Lösung 2:** User nicht bestätigt
```sql
-- Im Supabase SQL Editor:
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email = 'jzettl0@gmail.com';
```

**Lösung 3:** Passwort zurücksetzen
1. In Supabase → Authentication → Users
2. Klicke auf die drei Punkte neben deinem User
3. Wähle "Send password recovery"
4. Oder setze neues Passwort direkt

---

## ✅ Checkliste

Nach diesem Schritt solltest du haben:

- [x] Supabase Dashboard geöffnet
- [x] Authentication → Users geöffnet
- [x] User erstellt mit:
  - [x] Email: jzettl0@gmail.com
  - [x] Passwort gesetzt
  - [x] Auto Confirm User: ✅
- [x] User erscheint in der Liste
- [x] Status: "Confirmed" ✅

---

## 🎯 Nächster Schritt

Nach erfolgreichem Account-Erstellen:

→ Gehe zurück zur **INSTALLATION.md**
→ Weiter mit **SCHRITT 3: RLS Policies installieren**

---

**Probleme? Schaue in SUPABASE-AUTH-SETUP.md!**
