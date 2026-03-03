-- Commission Rules von admin-Schema nach public verschieben
-- Behebt "Invalid schema: admin" (Schema wird von Supabase API nicht exponiert)

-- Tabelle in public erstellen (falls noch nicht vorhanden)
CREATE TABLE IF NOT EXISTS public.commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name VARCHAR(255) NOT NULL,
  category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES vendor_accounts(id) ON DELETE SET NULL,
  percentage_fee NUMERIC(5, 2) NOT NULL,
  fixed_fee NUMERIC(10, 2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  priority INT DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daten aus admin.commission_rules kopieren (falls Tabelle existiert)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'admin' AND table_name = 'commission_rules') THEN
    INSERT INTO public.commission_rules (id, rule_name, category_id, vendor_id, percentage_fee, fixed_fee, is_active, priority, created_at)
    SELECT id, rule_name, category_id, vendor_id, percentage_fee, fixed_fee, is_active, priority, created_at
    FROM admin.commission_rules
    ON CONFLICT (id) DO NOTHING;
    DROP TABLE admin.commission_rules;
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL; -- admin.commission_rules existiert nicht
  WHEN OTHERS THEN RAISE;
END
$$;

CREATE INDEX IF NOT EXISTS idx_commission_rules_category ON public.commission_rules(category_id);
CREATE INDEX IF NOT EXISTS idx_commission_rules_vendor ON public.commission_rules(vendor_id);
CREATE INDEX IF NOT EXISTS idx_commission_rules_active ON public.commission_rules(is_active) WHERE is_active = true;

ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;
