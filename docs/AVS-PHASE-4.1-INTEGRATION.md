# Phase 4.1: Identitätsprüfung – Provider-Integration

Die Infrastruktur für echte Identitätsprüfungen (IDnow, PostIdent, Schufa Q-Bit) ist vorbereitet. Für den Betrieb mit einem echten Provider sind API-Zugänge und die Implementierung der Provider-spezifischen API-Aufrufe nötig.

## Ablauf

1. **Init** – Nutzer klickt „Alter bestätigen“
2. Provider-`init()` wird aufgerufen mit `callbackUrl` = `{SITE_URL}/api/age-verification/callback`
3. Provider gibt `redirectUrl` + `sessionId` zurück
4. `sessionId`, `return_url`, `user_id` werden in `age_verification_pending` gespeichert
5. Frontend leitet zur `redirectUrl` (Provider-Seite) weiter
6. Nutzer führt Identitätsprüfung beim Provider durch
7. Provider leitet zurück zu `callbackUrl` mit Query-Param für Session (z.B. `?transactionId=xxx`)
8. Callback prüft Status via `provider.checkStatus(sessionId)`
9. Bei Erfolg: Token erzeugen, zu `/checkout/age-verification/done?token=...&returnTo=...` weiterleiten
10. Done-Seite speichert Token in sessionStorage und leitet zum Checkout weiter

## Provider-Parameter

Der Callback akzeptiert folgende Query-Parameter für die Session-ID:
- `session_id`, `sessionId`, `transactionId`, `identificationId`, `transaction_id`

## Migration

```bash
# Pending-Sessions für Redirect-Flow
psql -f supabase/migration-age-verification-pending.sql
```

## IDnow VideoIdent

- API-Doku: https://docs-videoident.idnow.io/
- Beim Erstellen der Identifikation: `successUrl` = `{SITE_URL}/api/age-verification/callback`
- Callback empfängt typisch: `?transactionId=...`

## PostIdent (Deutsche Post)

- Geschäftskunden-Portal: https://www.deutschepost.de/postident
- CaseID erstellen, callback/success-URL angeben

## Schufa Q-Bit / finAPI GiroIdent

- Altersprüfung per Online-Banking
- finAPI GiroIdent: https://documentation.finapi.io/
- KJM-positiv bewertet für JuSchG-konforme Altersverifizierung
