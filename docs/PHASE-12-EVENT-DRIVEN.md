# Phase 12: Event-Driven & Microservices

## 12.1 DB-Trigger als Event-Quellen ✅

- **Migration:** `supabase/migration-domain-events.sql`
- **Tabelle:** `events.domain_events` (event_type, aggregate_type, aggregate_id, payload)
- **Trigger:**
  - `order_created` – bei INSERT in `orders`
  - `payment_received` – bei UPDATE von `orders.payment_status` auf `paid`

## 12.2 Supabase Realtime (Pub/Sub) ✅

**Realtime aktivieren:**

1. Supabase Dashboard → **Database** → **Replication**
2. Tabelle `events.domain_events` zur Publication hinzufügen (bzw. Schema `events` freigeben)
3. Alternativ: Neue Publication mit `events.domain_events` erstellen

**Client-Subscription (Beispiel):**

```ts
const channel = supabase
  .channel('domain_events')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'events',
    table: 'domain_events',
  }, (payload) => {
    const e = payload.new
    if (e.event_type === 'payment_received') {
      // Reagieren auf Zahlungseingang
    }
  })
  .subscribe()
```

**Admin-API:** `GET /api/admin/domain-events?limit=50&event_type=payment_received`

---

## 12.3 Order/Inventory/Payment auslagern (geplant)

- Eigene Microservices für Order, Inventory, Payment
- Kommunikation per Events (Kafka/SQS oder Supabase Realtime)
- Saga-Pattern für verteilte Transaktionen
- **Aufwand:** 4+ Wochen

---

## 12.4 API Gateway (geplant)

- Kong oder AWS API Gateway vor der Anwendung
- Rate Limiting, Auth, Request-Routing
- **Aufwand:** 2–3 Wochen

---

*Für MVP reicht der Monolith. Event-Driven lohnt sich bei starkem Traffic-Wachstum.*
