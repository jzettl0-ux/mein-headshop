-- Phase 7.2: Hilfsfunktion für sequenzielle Self-Billing Gutschriften-Nummern (§14 UStG)

CREATE OR REPLACE FUNCTION get_next_self_billing_number()
RETURNS INTEGER
LANGUAGE sql
AS $$
  SELECT nextval('financials.self_billing_credit_note_seq')::integer;
$$;

COMMENT ON FUNCTION get_next_self_billing_number() IS 'Gibt die nächste sequenzielle Nummer für Self-Billing Gutschriften zurück (financials.self_billing_credit_note_seq)';
