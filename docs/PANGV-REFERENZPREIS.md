# PAngV – Referenzpreis (Streichpreise)

Die **Preisangabenverordnung (PAngV)** verlangt, dass angegebene **Vergleichs-/Streichpreise** („vorher X €“) den **niedrigsten Preis der letzten 30 Tage** referenzieren. So sollen „Mondpreise“ (künstlich erhöhte Vorpreise) verhindert werden.

## Umsetzung im Shop

- **Datenbank**: Spalte `products.reference_price_30d` (Migration `supabase/migration-products-reference-price-30d.sql`). Nur wenn dieser Wert gesetzt ist **und** ≥ aktueller Verkaufspreis (nach Rabatt), darf ein Streichpreis angezeigt werden.
- **Logik**: `lib/utils.ts` – `getReferencePriceForDisplay(product)`. Gibt den anzuzeigenden Referenzpreis zurück oder `null` (dann kein Streichpreis).
- **Anzeige**: Produktkarten und Produktdetailseite zeigen den Streichpreis nur, wenn `getReferencePriceForDisplay(product)` einen Wert liefert.

## Pflege des Referenzpreises

- **Manuell**: Im Admin kann `reference_price_30d` pro Produkt gepflegt werden (z. B. beim Anlegen von Aktionen).
- **Automatisch (empfohlen)**: Ein Cron-Job oder Trigger kann den niedrigsten Verkaufspreis der letzten 30 Tage aus z. B. `order_items` oder einer Tabelle `product_price_history` berechnen und in `reference_price_30d` schreiben. So bleibt die Anzeige PAngV-konform.

## Wichtig

- Ohne gesetzten `reference_price_30d` wird **kein** Streichpreis angezeigt – auch nicht der reguläre Listenpreis. Das vermeidet Bußgelder.
- Bei neuen Rabattaktionen: Vor Anzeige eines Streichpreises `reference_price_30d` setzen (mindestens = bisheriger niedrigster Preis der letzten 30 Tage).
