-- ============================================
-- Phase 12.1: Domain Events – DB-Trigger als Event-Quellen
-- ============================================
-- order_created, payment_received. Supabase Realtime kann auf domain_events subscriben (12.2).

CREATE SCHEMA IF NOT EXISTS events;

CREATE TABLE IF NOT EXISTS events.domain_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  aggregate_type TEXT NOT NULL DEFAULT 'order',
  aggregate_id UUID,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_domain_events_type ON events.domain_events(event_type);
CREATE INDEX IF NOT EXISTS idx_domain_events_created ON events.domain_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_domain_events_aggregate ON events.domain_events(aggregate_type, aggregate_id);

COMMENT ON TABLE events.domain_events IS 'Phase 12.1: Domain-Events für Event-Driven. Trigger: order_created, payment_received. Realtime-fähig.';
COMMENT ON COLUMN events.domain_events.event_type IS 'order_created | payment_received';
COMMENT ON COLUMN events.domain_events.payload IS 'Event-Daten (order_number, total, etc.)';

ALTER TABLE events.domain_events ENABLE ROW LEVEL SECURITY;

-- Keine RLS-Policies: Admin/Service-Role greift direkt zu. Public/Anon brauchen keinen Zugriff.

-- Trigger: order_created (INSERT auf orders)
CREATE OR REPLACE FUNCTION events.emit_order_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO events.domain_events (event_type, aggregate_type, aggregate_id, payload)
  VALUES (
    'order_created',
    'order',
    NEW.id,
    jsonb_build_object(
      'order_id', NEW.id,
      'order_number', NEW.order_number,
      'customer_email', NEW.customer_email,
      'total', NEW.total,
      'created_at', to_char(NEW.created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_emit_order_created ON orders;
CREATE TRIGGER trg_orders_emit_order_created
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION events.emit_order_created();

-- Trigger: payment_received (UPDATE orders, payment_status -> paid)
CREATE OR REPLACE FUNCTION events.emit_payment_received()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.payment_status IS DISTINCT FROM 'paid' AND NEW.payment_status = 'paid' THEN
    INSERT INTO events.domain_events (event_type, aggregate_type, aggregate_id, payload)
    VALUES (
      'payment_received',
      'order',
      NEW.id,
      jsonb_build_object(
        'order_id', NEW.id,
        'order_number', NEW.order_number,
        'customer_email', NEW.customer_email,
        'total', NEW.total,
        'paid_at', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_emit_payment_received ON orders;
CREATE TRIGGER trg_orders_emit_payment_received
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION events.emit_payment_received();

-- Supabase Realtime: Tabelle zur Publication hinzufügen (falls vorhanden)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE events.domain_events;
EXCEPTION
  WHEN duplicate_object THEN NULL;  -- bereits hinzugefügt
  WHEN undefined_object THEN NULL;  -- Publication existiert nicht (lokale Supabase)
END
$$;
