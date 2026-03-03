# DATEV-Schnittstelle, E-Rechnung & Zahlungsmethoden

## 1. DATEV-Schnittstelle (Buchungsdaten für den Steuerberater)

Für deutsche Unternehmen ist die **automatisierte Übertragung von Buchungsdaten, Belegen und Zahlungsinformationen** an den Steuerberater (z. B. über JTL2DATEV oder DATEV-Import) üblich.

### Im Shop umgesetzt

- **Admin-Export für DATEV**  
  **GET** `/api/admin/datev/export?year=2025`  
  - Nur für eingeloggte Admins.
  - Liefert eine **CSV** mit einer Zeile pro Bestellung (des gewählten Jahres) mit:
    - Belegdatum, Belegnummer, Kunde, E-Mail, Ort
    - Umsatz Brutto, MwSt 19 %, Netto, Versand, Rabatt
    - Zahlungsart, Zahlungsstatus
  - Trennzeichen: Semikolon (`;`), UTF-8 mit BOM – für Excel/DATEV-Import geeignet.

- **Nutzung**
  1. Im Admin eingeloggt: z. B. `https://deine-domain.de/api/admin/datev/export?year=2025` im Browser aufrufen → Datei wird heruntergeladen.
  2. CSV in DATEV oder in ein Tool wie **JTL2DATEV** importieren (je nach Steuerberater-Vorgabe).
  3. Optional: Export in der CI oder per Cron regelmäßig erzeugen und dem Steuerberater bereitstellen.

- **Weiterer Finanz-Export**  
  **GET** `/api/admin/finances/export-csv?year=2025`  
  - Einnahmen/Ausgaben (Umsatz, Zahlungsgebühren, Wareneinsatz, Erstattungen) – ebenfalls für Buchhaltung/Steuerberater nutzbar.

### Optional: Anbindung JTL2DATEV / DATEV direkt

- Die CSV aus `/api/admin/datev/export` kann als Grundlage für JTL2DATEV oder andere DATEV-Schnittstellen dienen.
- Bei Bedarf: Automatisierung (z. B. geplante Jobs), die den Export erzeugen und per E-Mail/SFTP an den Steuerberater senden.

---

## 2. E-Rechnungspflicht (E-Rechnung B2B 2025/2027)

Ab **2025** (Bund/Länder) bzw. **2027** (weitere B2B-Bereiche) wird die **elektronische Rechnung** (XML-basiert, nicht nur PDF) im B2B-Bereich verpflichtend. Professionelle Systeme bereiten den Standard **XRechnung/ZUGFeRD** vor.

### Aktueller Stand im Shop

- **Rechnungen heute**: PDF-Rechnungen (§ 14 UStG) werden erzeugt und an Kunden ausgegeben bzw. im Kundenkonto zum Download bereitgestellt.
- **E-Rechnung (XML)**: Noch **nicht** implementiert. Die Anwendung ist so vorbereitet, dass sie ergänzt werden kann.

### Vorbereitung / Empfehlung

1. **Standard**: XRechnung (Deutschland) bzw. **ZUGFeRD 2.0** (Profile EN16931) – XML-Struktur + optional PDF als Anhang.
2. **Umsetzung** (später):
   - Entweder eine Library nutzen (z. B. [mustangproject](https://github.com/ZUGFeRD/mustangproject) für ZUGFeRD, oder einen XRechnung-/ZUGFeRD-Dienst).
   - Pro bezahlter Bestellung zusätzlich zur PDF eine XML-Datei (XRechnung/ZUGFeRD) erzeugen und:
     - zum Download anbieten (Kundenkonto/Admin) und/oder
     - an ein E-Rechnung-Portal (z. B. OZG-RE) senden, sobald ihr daran angebunden seid.
3. **Datenbasis**: Die bestehende Rechnungslogik (`lib/invoice-pdf.ts`, Bestelldaten aus Supabase) enthält bereits die nötigen Stammdaten (Verkäufer, Kunde, Positionen, Steuer, Zahlungsart) – diese können für die XML-Generierung wiederverwendet werden.
4. **Zeitplan**: Bis zum verpflichtenden Stichtag (2025/2027) die Erstellung von XRechnung/ZUGFeRD für B2B-Transaktionen einplanen und testen.

---

## 3. Zahlungsmethoden-Mix (Deutschland)

In Deutschland sind **PayPal** (ca. 28–57 % Marktanteil) und **Kauf auf Rechnung** (ca. 27–44 %) wichtige Conversion-Treiber. Ein Profi-Shop bietet zudem **SEPA-Lastschrift** und **Kreditkarte** an.

### Technik im Shop

- **Zahlungsabwicklung**: Über **Mollie**. Die angebotenen Zahlungsarten werden im **Mollie Dashboard** aktiviert; der Kunde wählt beim Checkout bei Mollie die Methode.
- **Keine Kreditkartendaten** auf euren Servern – PCI-relevant nur für Mollie; der Shop ist entlastet.

### Empfohlene Einstellung in Mollie

Im Mollie Dashboard unter **Zahlungsmethoden** für den deutschen Markt aktivieren:

| Methode            | Typisch für DE      | Hinweis |
|--------------------|----------------------|--------|
| **PayPal**         | Sehr hohe Nutzung   | Unbedingt aktivieren. |
| **Kauf auf Rechnung** | Klarna, in3 o. ä. | In Mollie z. B. „Klarna Pay later“ / „in3“ aktivieren. |
| **SEPA-Lastschrift**  | Direktabbuchung     | In Mollie „Direct debit“ aktivieren. |
| **Kreditkarte**      | Visa, Mastercard    | In Mollie „Credit card“ aktivieren. |

Weitere Methoden (z. B. Giropay, Sofort) nach Bedarf ergänzen.

### Darstellung im Shop

- Die Seite **Zahlungsmethoden** (`/payment`) listet die für Kunden sichtbaren Zahlungsarten (u. a. PayPal, Kreditkarte, Kauf auf Rechnung, SEPA) und verweist auf sichere Abwicklung über Mollie.
- Welche Methoden der Kunde konkret sieht, steuert ihr ausschließlich über die Aktivierung im Mollie Dashboard.

### Optional: Bevorzugte Methode an Mollie übergeben

Die Mollie API erlaubt, eine **bevorzugte Zahlungsmethode** zu übergeben. Wenn ihr im Checkout eine Auswahl anbieten wollt (z. B. „PayPal“ / „Kreditkarte“ / „Rechnung“), kann beim Aufruf von `createMolliePayment` der Parameter `method` gesetzt werden. Aktuell leitet der Shop ohne feste Methode zu Mollie weiter – der Kunde wählt dort. Das ist konform; die Erweiterung auf eine Vorauswahl ist optional.

---

## Kurzüberblick

| Thema              | Status / Aktion |
|--------------------|------------------|
| **DATEV**          | Export unter `/api/admin/datev/export?year=...` nutzen; CSV für Steuerberater/DATEV/JTL2DATEV. |
| **E-Rechnung**     | PDF-Rechnung vorhanden; XRechnung/ZUGFeRD für 2025/2027 einplanen und Datenbasis aus Rechnungslogik nutzen. |
| **Zahlungsmethoden** | PayPal, Rechnung, SEPA, Kreditkarte im Mollie Dashboard aktivieren; Infoseite unter `/payment` vorhanden. |
