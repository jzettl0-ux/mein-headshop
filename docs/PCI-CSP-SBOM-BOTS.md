# PCI DSS 4.0.1, SBOM & Bot-Mitigation

## 1. E-Skimming-Schutz (PCI DSS 4.0.1 / CSP)

Seit April 2025 ist die **Überwachung aller clientseitigen Skripte** mittels Content Security Policy (CSP) verpflichtend – auch wenn keine Kreditkartendaten im Shop gespeichert werden (Zahlung läuft über Mollie).

### Umgesetzt

- **Content-Security-Policy** in `next.config.js`:
  - `script-src-attr 'none'` – verhindert inline Event-Handler (z. B. `onclick="..."`), reduziert E-Skimming-Fläche.
  - `frame-ancestors 'none'` – kein Einbetten in Fremdseiten (zusätzlich zu X-Frame-Options).
  - **`report-uri /api/csp-report`** – der Browser sendet Verstöße an diesen Endpoint.

- **CSP-Report-Endpoint** `POST /api/csp-report`:
  - Empfängt vom Browser gemeldete CSP-Verletzungen (JSON mit `csp-report`).
  - Schreibt sie ins Server-Log (`console.warn`). In Produktion: Logs an SIEM/Log-Aggregator senden oder in DB schreiben, um bei Auffälligkeiten sofort zu reagieren.

### Optional (Verschärfung)

- **`unsafe-eval` entfernen**: Wenn die Anwendung ohne `eval()` auskommt, in `next.config.js` bei `script-src` `'unsafe-eval'` streichen. Kann bei einigen Next.js-Builds nötig sein – testen.
- **Nonces für Inline-Scripts**: Für strikte Kontrolle aller Skripte können Inline-Scripts mit Nonces erlaubt werden; erfordert Anpassung von Next.js / Webpack.

---

## 2. Software Bill of Materials (SBOM)

Supply-Chain-Angriffe und Zero-Day-Lücken: Ein genaues Inventar aller Bibliotheken und APIs ermöglicht schnelle Reaktion (Patches, temporäre Deaktivierung).

### Umgesetzt

- **SBOM erzeugen (CycloneDX)**:
  ```bash
  npm run sbom
  ```
  Erzeugt `sbom.json` im Projektroot (Standardformat CycloneDX, maschinenlesbar).

- **Einfache Dependency-Liste**:
  ```bash
  npm run sbom:list
  ```
  Erzeugt `npm-deps-list.json` (Rohausgabe von `npm list --all --json`).

- **Quelle der Wahrheit**: `package-lock.json` – enthält exakte Versionen aller (transitiven) Abhängigkeiten.

### Empfohlener Prozess

1. **Regelmäßig** (z. B. bei jedem Release oder monatlich): `npm run sbom` ausführen, `sbom.json` versionieren oder in Artefakt-Speicher legen.
2. **Bei Zero-Day-Meldungen**: SBOM durchsuchen (z. B. nach Paketname/Version), betroffene Komponenten identifizieren, aktualisieren oder Workarounds einplanen.
3. **CI**: Optional `npm audit` (oder `npm audit --production`) in der Pipeline, um bekannte Schwachstellen zu blockieren.

---

## 3. Bot-Mitigation (Inventory Hoarding & Preis-Scraping)

### Inventory Hoarding

Bots können gezielt Warenkorb-Reservierungen auslösen und so Bestand blockieren, ohne zu kaufen.

**Umgesetzt:**

- **Rate-Limiting auf `/api/cart/reserve`** (siehe `app/api/cart/reserve/route.ts`):
  - Pro IP: **30 Anfragen pro Minute** (konfigurierbar in `RESERVE_RATE_LIMIT`).
  - Überschreitung → HTTP 429, keine neue Reservierung.
  - Reduziert Massen-Reservierungen (Inventory Hoarding) durch dieselbe IP.

### Preis-Scraping

Wettbewerber können mit Bots/KI Preise und Verfügbarkeiten auslesen.

**Mögliche Maßnahmen (optional):**

- **Rate-Limiting** auf produkt- oder kategoriebezogene APIs/Seiten (z. B. pro IP pro Minute), um massenhaftes Abrufen zu erschweren.
- **Verhaltensanalyse**: Verdächtige Muster (viele Produktabrufe ohne Klicks, keine Cookie/Session, gleicher User-Agent) können in einem zentralen Dienst (z. B. Bot-Detection-Anbieter) ausgewertet und geblockt werden.
- **Rechtlich**: In AGB/Impressum Hinweis auf automatisiertes Auslesen (Scraping) untersagen.

Die aktuelle Rate-Limit-Logik für Cart-Reserve und Checkout bildet die Basis; erweiterte KI-basierte Analyse wäre über externe Dienste (z. B. Datadome, PerimeterX) oder eine eigene Auswertung von Logs/Verhalten umsetzbar.
