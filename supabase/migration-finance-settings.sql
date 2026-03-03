-- ============================================
-- Finanz-Sicherheitssystem: zentrale Steuerung + Order-Felder
-- ============================================

-- Zentrale Finanz-Parameter (eine Zeile, id = 1)
CREATE TABLE IF NOT EXISTS finance_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 30,
  mollie_fixed DECIMAL(10,2) NOT NULL DEFAULT 0.29,
  mollie_percent DECIMAL(5,2) NOT NULL DEFAULT 0.25,
  revenue_limit DECIMAL(10,2) NOT NULL DEFAULT 22500,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE finance_settings IS 'Zentrale Steuerung: Steuersatz Rücklage, Mollie-Gebühren, Kleinunternehmer-Umsatzgrenze';
COMMENT ON COLUMN finance_settings.tax_rate IS 'Steuerrücklage in % vom Gewinn (z. B. 30)';
COMMENT ON COLUMN finance_settings.mollie_fixed IS 'Mollie Fixgebühr pro Transaktion (€)';
COMMENT ON COLUMN finance_settings.mollie_percent IS 'Mollie Prozentsatz vom Betrag';
COMMENT ON COLUMN finance_settings.revenue_limit IS 'Kleinunternehmer-Umsatzgrenze (€), z. B. 22500';

INSERT INTO finance_settings (id, tax_rate, mollie_fixed, mollie_percent, revenue_limit)
VALUES (1, 30, 0.29, 0.25, 22500)
ON CONFLICT (id) DO NOTHING;

-- Orders: Finanz-Felder pro Bestellung (bei Zahlungseingang befüllt)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS transaction_fee DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_reserve DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS net_profit DECIMAL(10,2);

COMMENT ON COLUMN orders.transaction_fee IS 'Zahlungsgebühr (z. B. Mollie) bei Bezahlung berechnet';
COMMENT ON COLUMN orders.tax_reserve IS 'Steuerrücklage (z. B. 30 % vom Netto-Gewinn)';
COMMENT ON COLUMN orders.net_profit IS 'Netto-Gewinn (Umsatz - Wareneinsatz - transaction_fee)';
