-- OTP bei Zustellung (Friction/OTP – Phase 11 optional)
-- Nutzung: Wenn fraud_prevention.buyer_health_scores.requires_otp_on_delivery = true,
-- wird ein Code erzeugt; Zusteller/Kunde gibt ihn bei Abholung/Zustellung ein.
CREATE SCHEMA IF NOT EXISTS fulfillment;
CREATE TABLE IF NOT EXISTS fulfillment.delivery_otp (
  order_id UUID PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE fulfillment.delivery_otp IS 'Einmal-Codes für OTP bei Zustellung (High-Risk-Kunden). Code wird gehasht gespeichert.';
