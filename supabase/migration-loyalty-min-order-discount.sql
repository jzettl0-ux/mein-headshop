-- Mindestbestellwert (€), ab dem Silber-/Gold-Rabatt gilt. 0 = Rabatt immer.
INSERT INTO loyalty_settings (key, value, updated_at) VALUES
  ('min_order_eur_for_discount', '30', NOW())
ON CONFLICT (key) DO NOTHING;
