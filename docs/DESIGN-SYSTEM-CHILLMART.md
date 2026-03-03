# CHILLMART – Design-System: Fresh Tech & Verdant Clean

**Gültig für alle neuen UI-Elemente.** Modern, technologisch, frisch, vertrauenswürdig, energiegeladen.

---

## 1. Farbpalette

| Verwendung        | Token / Klasse              | Wert (Beispiel) | Verwendung in UI                    |
|-------------------|-----------------------------|------------------|-------------------------------------|
| Hintergrund       | `bg-white`, `bg-chill-bg`   | `#FFFFFF`, `#F9FAFB` | Seitenhintergrund, Hauptflächen     |
| Text (primär)     | `text-chill-dark`           | `#1F2937`        | Überschriften, Fließtext            |
| Text (sekundär)   | `text-chill-dark-muted`     | `#6B7280`        | Beschreibungen, Labels              |
| Akzent / Primär   | `bg-chill-green`, `text-chill-green` | `#10B981`  | Buttons, Links, Badges, Highlights  |
| Hover (Primär)    | `chill-green-hover`         | `#059669`        | Button-Hover                        |
| Rahmen            | `border-gray-100`, `border-chill-border` | `#F3F4F6` | Karten, Inputs                      |

- **Tailwind:** `chill.bg`, `chill.bg-alt`, `chill.dark`, `chill.dark-muted`, `chill.green`, `chill.green-hover`, `chill.border`
- **CSS-Variablen:** `--chill-bg`, `--chill-bg-alt`, `--chill-dark`, `--chill-dark-muted`, `--chill-green`, `--chill-green-hover`, `--chill-border`

---

## 2. Komponenten-Stil

### Buttons (Primär)
- **Klasse:** `btn-chillmart` oder `bg-chill-green text-white rounded-lg hover:bg-chill-green-hover`
- Leuchtend grün, weißer Text, `rounded-lg`, Hover: etwas dunklerer Grünton.

### Cards / Container
- **Klasse:** `card-chillmart` oder `bg-white border border-gray-100 shadow-sm rounded-lg`
- Weißer Hintergrund, sehr subtile hellgraue Ränder (`border-gray-100`), minimaler Schatten (`shadow-sm`). Sauber, aufgeräumt (Amazon-Stil).

### Badges (NEU, SALE)
- **Klasse:** `badge-chillmart` oder `bg-chill-green text-white text-xs font-semibold rounded-md px-2 py-0.5`
- Leuchtendes Grün für maximale Aufmerksamkeit.

### Inputs / Formulare
- Heller Hintergrund, `border-gray-100` oder `border-chill-border`, `rounded-lg`, Text `text-chill-dark`.

---

## 3. Vibe & Don’ts

- **Vibe:** Modern, technologisch, frisch, vertrauenswürdig, energiegeladen.
- **Nicht verwenden:** Dunkle Hintergründe für Hauptinhalte; Gold; klischeehafte Hanf-Muster.
- **Stattdessen:** Cleane Geometrie, viel Weißraum, klare Hierarchie.

---

## 4. Theme aktivieren

Am Layout oder Body die Klasse **`theme-chillmart`** setzen, um das Storefront-Design auf Fresh Tech & Verdant Clean umzustellen:

```tsx
<body className="theme-chillmart">
```

Farben und Hilfsklassen (`btn-chillmart`, `card-chillmart`, `badge-chillmart`) sind in `app/globals.css` und `tailwind.config.ts` definiert.
