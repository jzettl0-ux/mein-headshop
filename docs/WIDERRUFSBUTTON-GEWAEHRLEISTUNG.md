# Widerrufsbutton & Gewährleistungs-Label

Rechtlicher Stand: **20.02.2026**. Quelle: EU-Richtlinie 2023/2673 (Widerrufsbutton), Richtlinie (EU) 2024/825 (Gewährleistung/Garantie).

## Elektronischer Widerrufsbutton (Pflicht **ab** 19.06.2026)

Die Pflicht zum **elektronischen Widerrufsbutton** gilt **ab dem 19. Juni 2026** – nicht vorher. Bis dahin reicht der Link „Widerrufsrecht“ in den rechtlichen Footer-Links.

**Ab 19.06.2026:**
- Ein deutlich sichtbarer Button (z. B. „Widerruf ausüben“ oder „Vertrag widerrufen“) muss direkt in der UI erreichbar sein.
- Der Button führt zur Widerrufsbelehrung bzw. zur Ausübung des Widerrufs (ggf. zweistufig: Vertrag identifizieren → Widerruf bestätigen).
- Barrierefrei, gut lesbar, während der gesamten Widerrufsfrist verfügbar.

**Umsetzung im Projekt:**
- Im **Footer** (`components/layout/footer.tsx`) wird der Button **„Widerruf ausüben“** nur angezeigt, wenn das aktuelle Datum **≥ 19.06.2026** ist.
- Bis dahin: Link „Widerrufsrecht“ in den Legal-Links (wie bisher).
- Die Seite **Widerrufsbelehrung** (`/returns`) und das Widerruf-Formular bleiben jederzeit erreichbar.

## EU-Gewährleistungs- und Garantie-Label (Pflicht **ab** 27.09.2026)

Ab dem **27. September 2026** ist das **EU-einheitliche Gewährleistungs- und Garantielabel** für B2C-Online-Handel Pflicht (Richtlinie (EU) 2024/825). Es informiert Verbraucher einheitlich über:
- Dauer der gesetzlichen Gewährleistung (z. B. 2 Jahre),
- Rechte bei Mängeln,
- Durchsetzung dieser Rechte,
- ggf. freiwillige Garantie darüber hinaus.

**Vorbereitung im Projekt:**
- Auf **Widerrufsrecht / Returns** (`/returns`) gibt es den Abschnitt **„Gewährleistung“** mit Anker `#gewaehrleistung` und Hinweis auf das Label ab 27.09.2026.
- Footer-Link **„Gewährleistung“** → `/returns#gewaehrleistung`.
- Sobald die EU-Kommission das einheitliche Label (Darstellung/Inhalt) festgelegt hat, muss es auf Produktseiten und ggf. auf der Returns-Seite angezeigt werden.
