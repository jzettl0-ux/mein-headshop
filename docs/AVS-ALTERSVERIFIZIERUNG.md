# Altersverifizierungssystem (AVS)

Rechtssicheres zweistufiges Altersverifizierungssystem für den Verkauf von 18+ Produkten.

## Übersicht

1. **Stufe 1 (Digital):** Prüfung vor der Zahlungsautorisation im Checkout
2. **Stufe 2 (Physisch):** DHL Alterssichtprüfung ab 18 Jahren bei der Zustellung

## Ablauf

- Warenkorb enthält Produkte mit `is_adult_only=true` und nicht `exempt_from_adult_fee`
- Checkout leitet auf `/checkout/age-verification` um
- Nutzer bestätigt Alter (Provider: IDnow, PostIdent, Schufa QBIT oder Simulation)
- Nach erfolgreicher Prüfung: Token wird gesetzt, Nutzer kehrt zum Checkout zurück
- Checkout-API prüft Token bei Bestellungen mit `has_adult_items`
- Bestellungen werden mit `has_adult_items=true` gespeichert
- Versand: Bei DHL-Versand „Alterssichtprüfung ab 18 Jahren“ aktivieren

## Datenbank (Migration)

```bash
# Supabase SQL Editor oder Migration
psql -f supabase/migration-age-verification.sql
```

Tabellen:
- `age_verification_logs` – Nur Ergebnis (APPROVED/REJECTED), keine Ausweisdaten
- `age_verification_profiles` – Persistente Verifizierung für angemeldete Nutzer
- `age_verification_tokens` – Einmal-Tokens für Checkout (15 Min Gültigkeit)

## Konfiguration (.env.local)

| Variable | Beschreibung | Standard |
|----------|--------------|----------|
| `AGE_VERIFICATION_PROVIDER` | `simulation`, `idnow`, `postident`, `qbit` | `simulation` |
| `IDNOW_API_KEY` | Für IDnow-Integration | – |
| `POSTIDENT_API_KEY` | Für PostIdent (Deutsche Post) | – |
| `SCHUFA_QBIT_API_KEY` | Für Schufa QBIT | – |

## Datenschutz

- **Datensparsamkeit:** Es werden keine Ausweiskopien gespeichert
- Es wird ausschließlich das Prüfungsergebnis (APPROVED/REJECTED) in `age_verification_logs` gespeichert
- Angemeldete Nutzer: `is_age_verified` in `age_verification_profiles` (keine erneute Prüfung bei Folgekäufen)

## DHL-Versand

Bestellungen mit `has_adult_items=true`:
- Im Admin-Bereich wird „🔞 Alterssichtprüfung ab 18 Jahren (DHL)“ angezeigt
- Beim Erstellen des Versandetiketts den DHL-Service „Alterssichtprüfung ab 18 Jahren“ wählen
- Der Zusteller prüft den Ausweis des Empfängers
