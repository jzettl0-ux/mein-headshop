# 🚀 Setup-Anleitung für Mein Headshop

## 📋 Voraussetzungen

- Node.js 18+ installiert
- Ein Supabase Account (kostenlos)
- Git (optional)

## 🔧 Installation

### 1. Dependencies installieren

```bash
npm install
```

### 2. Supabase konfigurieren

#### 2.1 Supabase Projekt erstellen

1. Gehe zu [supabase.com](https://supabase.com)
2. Erstelle ein neues Projekt
3. Warte bis das Projekt bereit ist (ca. 2 Minuten)

#### 2.2 Datenbank Schema erstellen

1. Gehe zu deinem Supabase Dashboard
2. Klicke auf "SQL Editor"
3. Öffne die Datei `supabase/schema.sql` aus diesem Projekt
4. Kopiere den kompletten Inhalt
5. Füge ihn in den SQL Editor ein
6. Klicke auf "Run" um das Schema zu erstellen

#### 2.3 Storage Buckets konfigurieren

Die Storage Buckets werden automatisch durch das SQL Schema erstellt. Falls nicht:

1. Gehe zu "Storage" im Supabase Dashboard
2. Erstelle zwei Buckets:
   - `product-images` (Public)
   - `influencer-images` (Public)

#### 2.4 Umgebungsvariablen setzen

1. Erstelle eine `.env.local` Datei im Root-Verzeichnis:

```bash
cp .env.local.example .env.local
```

2. Öffne `.env.local` und füge deine Supabase Credentials ein:

```env
NEXT_PUBLIC_SUPABASE_URL=https://dein-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dein-anon-key
```

Du findest diese Werte in deinem Supabase Dashboard unter:
`Settings` → `API` → `Project URL` und `Project API keys`

### 3. Development Server starten

```bash
npm run dev
```

Die App läuft jetzt auf [http://localhost:3000](http://localhost:3000)

## 🎨 Erste Schritte

### Age-Gate testen

1. Öffne die App im Browser
2. Du solltest sofort das Age-Gate sehen
3. Klicke "Ja, ich bin 18 Jahre oder älter"
4. Das Age-Gate wird für 30 Tage nicht mehr angezeigt

Um es erneut zu testen:
- Öffne die Browser Developer Tools (F12)
- Gehe zu "Application" → "Local Storage"
- Lösche die Einträge `age_verified` und `age_verified_date`
- Lade die Seite neu

### Produkte hinzufügen

Aktuell nutzt die App Mock-Daten. Um echte Produkte hinzuzufügen:

1. Gehe zu deinem Supabase Dashboard
2. Öffne "Table Editor"
3. Wähle die `products` Tabelle
4. Klicke "Insert row" und füge ein Produkt hinzu
5. Oder nutze das SQL Schema, das bereits Beispiel-Produkte enthält

### Influencer hinzufügen

Das SQL Schema enthält bereits zwei Beispiel-Influencer:
- Max Grün (`/influencer/max-gruen`)
- Lisa High (`/influencer/lisa-high`)

Um weitere hinzuzufügen:
1. Gehe zu Supabase → Table Editor → `influencers`
2. Füge einen neuen Eintrag hinzu
3. Die Landingpage ist automatisch unter `/influencer/[slug]` verfügbar

## 🛠️ Wichtige Features

### 18+ Versand-Logik

Die App erkennt automatisch, wenn 18+ Produkte im Warenkorb sind:
- Produkte mit `is_adult_only: true` triggern die 18+ Logik
- Im Warenkorb wird ein deutlicher Hinweis angezeigt
- Automatisch werden 2,00 € für DHL Ident-Check aufgeschlagen
- Im Checkout muss die Altersverifizierung bestätigt werden

### Warenkorb

Der Warenkorb wird automatisch in `localStorage` gespeichert:
- Produkte bleiben auch nach Browser-Neustart erhalten
- Mengen können angepasst werden
- Versandkosten werden automatisch berechnet

### Responsive Design

Die App ist vollständig responsive:
- Mobile-First Ansatz
- Touch-optimierte Interaktionen
- Burger-Menü auf Mobile
- Optimiert für Influencer-Traffic (primär Mobile)

## 📦 Build für Production

```bash
npm run build
npm start
```

## 🚀 Deployment

### Vercel (Empfohlen)

1. Pushe deinen Code zu GitHub
2. Gehe zu [vercel.com](https://vercel.com)
3. Importiere dein Repository
4. Füge die Umgebungsvariablen hinzu
5. Deploy!

Vercel erkennt automatisch Next.js und konfiguriert alles.

### Andere Hosting-Optionen

- **Netlify**: Nutze `next export` für Static Export
- **Railway**: Automatische Next.js Erkennung
- **Eigener Server**: Nutze `npm run build && npm start`

## 🔐 Sicherheit

### Wichtig vor dem Go-Live:

1. **Row Level Security (RLS)** ist aktiviert in Supabase
2. Überprüfe die Policies in der `schema.sql`
3. Teste alle Permissions gründlich
4. Setze sichere Umgebungsvariablen
5. Nutze HTTPS (automatisch bei Vercel)

### Admin-Panel

Das Admin-Panel unter `/admin` ist noch nicht implementiert.
Für Admin-Aufgaben nutze vorerst das Supabase Dashboard.

## 🎯 Nächste Schritte

1. **Bilder hinzufügen**: Lade echte Produktbilder zu Supabase Storage hoch
2. **Payment integrieren**: Füge Stripe oder PayPal hinzu
3. **Email-Benachrichtigungen**: Nutze Supabase Edge Functions
4. **Admin-Panel**: Erstelle ein Admin-Interface
5. **Analytics**: Integriere Google Analytics oder Plausible

## 🆘 Hilfe & Support

### Häufige Probleme

**Problem**: Age-Gate erscheint nicht
- **Lösung**: Lösche `localStorage` und lade neu

**Problem**: Supabase Connection Error
- **Lösung**: Überprüfe `.env.local` Credentials

**Problem**: Bilder werden nicht angezeigt
- **Lösung**: Aktuell sind nur Placeholders - lade echte Bilder hoch

### Links

- [Next.js Dokumentation](https://nextjs.org/docs)
- [Supabase Dokumentation](https://supabase.com/docs)
- [Tailwind CSS Dokumentation](https://tailwindcss.com/docs)
- [Framer Motion Dokumentation](https://www.framer.com/motion/)

## ✅ Checkliste vor Go-Live

- [ ] Alle Umgebungsvariablen gesetzt
- [ ] Supabase Datenbank konfiguriert
- [ ] Echte Produkte hinzugefügt
- [ ] Produktbilder hochgeladen
- [ ] Age-Gate getestet
- [ ] 18+ Versand-Logik getestet
- [ ] Responsive Design auf allen Geräten getestet
- [ ] Payment-Integration fertig
- [ ] Impressum & Datenschutz hinzugefügt
- [ ] AGB erstellt
- [ ] Analytics konfiguriert
- [ ] SSL-Zertifikat aktiv
- [ ] Performance getestet
- [ ] SEO optimiert

Viel Erfolg mit deinem High-End Headshop! 🌿✨
