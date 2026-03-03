# BFSG – Barrierefreiheit (ab 28.06.2025)

Ab dem **28. Juni 2025** ist Barrierefreiheit für Online-Shops gesetzliche Pflicht (Barrierefreiheitsstärkungsgesetz, BFSG). Ein professioneller Shop gewährleistet u. a.:

- **Tastaturbedienung**: Alle Funktionen per Tastatur erreichbar, sichtbare Fokus-Indikatoren
- **Screenreader**: Semantisches HTML, ARIA-Labels wo nötig, lesbare Reihenfolge
- **Kontraste**: Ausreichende Kontraste (WCAG 2.1 Level AA: mind. 4,5:1 für Normaltext, 3:1 für Großtext)

## Im Projekt umgesetzt

- **Skip-Link**: „Zum Inhalt springen“ im Main-Layout (`app/(main)/layout.tsx`), verlinkt auf `#main-content`; nur bei Fokus sichtbar.
- **Hauptinhalt**: `<main id="main-content" role="main" tabIndex={-1}>` für Fokus-Ziel und Screenreader.
- **Fokus-Ring**: In `app/globals.css` für `:focus-visible` ein deutlicher Ring (z. B. `outline: 2px solid var(--luxe-primary)`), damit Tastaturnutzer den Fokus sehen.
- **ARIA**: Buttons und interaktive Elemente (Menge +/- , Wunschliste, Modals, Pagination) haben `aria-label` wo sinnvoll (z. B. Cart, Shop-Produktseite, Kontakt).
- **Semantik**: Überschriften-Hierarchie, `role="main"`, `aria-modal`/`aria-label` bei Modals.

## Phase 6 – Umgesetzt ✅

- **6.1** Integritäts-Check prüft: Alt-Texte (Produktbilder), `compliance.vendor_legal_flags`
- **6.2** Produktbilder: `alt={product.name}`; Kategorie-Bilder: `alt={category.name}`; Warenkorb/Wunschliste: `aria-label`
- **6.3** Modals: `aria-modal`/`role="dialog"` (Shop, Consent); keine aggressive Checkout-Zeitbegrenzung
- **6.4** BFSG Kleinstunternehmen-Ausnahme: Abfrage im Partner-Anfrage-Formular; `vendor_legal_flags.bfsg_micro_enterprise_exemption` in Admin bearbeitbar

## Checkliste vor Go-Live

- [ ] **Kontraste**: Text auf Hintergrund (z. B. `luxe-silver` auf `luxe-charcoal`) mit Tool prüfen (z. B. WebAIM Contrast Checker); bei Bedarf Farben anpassen.
- [ ] **Tastatur**: Kompletten Checkout und alle wichtigen Seiten nur mit Tab/Enter durchgehen; Fokus nirgends verloren, Reihenfolge logisch.
- [ ] **Screenreader**: Kurztest mit NVDA/JAWS oder VoiceOver; Überschriften, Links und Buttons sinnvoll benannt.
- [ ] **Formulare**: Labels mit `htmlFor`/`id` verknüpft, Fehlermeldungen mit `aria-live` oder `aria-describedby` wo sinnvoll.

## Referenzen

- BFSG: Barrierefreiheitsstärkungsgesetz (EU-Richtlinie 2019/882)
- WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/
