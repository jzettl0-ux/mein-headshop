-- ============================================
-- Phase 1.2: Vendor Performance Metrics (Blueprint 3.3)
-- ============================================
-- ODR, LSR, VTR für Buy-Box-Scoring. Wird per Cron oder bei Bestelländerungen aktualisiert.

CREATE SCHEMA IF NOT EXISTS analytics;

-- Aggregation der Vendor-Metriken (Aktualisierung via Cron/Trigger)
-- Tabelle in public, damit Supabase Client ohne Schema-Expose zugreifen kann
CREATE TABLE IF NOT EXISTS public.vendor_performance_metrics (
  vendor_id UUID PRIMARY KEY REFERENCES vendor_accounts(id) ON DELETE CASCADE,
  calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  order_defect_rate NUMERIC(5,4) DEFAULT 0.0000,      -- ODR: Entzug Buy Box bei > 1%
  late_shipment_rate NUMERIC(5,4) DEFAULT 0.0000,     -- LSR: Penalty bei > 4%
  pre_fulfillment_cancellation_rate NUMERIC(5,4) DEFAULT 0.0000,  -- Stornierungen vor Versand
  valid_tracking_rate NUMERIC(5,4) DEFAULT 1.0000,    -- VTR: Penalty bei < 95%
  response_time_avg_hours NUMERIC(5,2),               -- Durchschn. Antwortzeit (Support)
  is_buybox_eligible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.vendor_performance_metrics IS 'Vendor-Metriken für Buy-Box-Scoring. Aktualisierung via Cron/API.';
COMMENT ON COLUMN public.vendor_performance_metrics.order_defect_rate IS 'ODR: Negative Bewertungen + A-Z + Rückbuchungen. Schwelle 1% = Buy Box Entzug';
COMMENT ON COLUMN public.vendor_performance_metrics.late_shipment_rate IS 'LSR: Verspätete Lieferungen. Schwelle 4% = Penalty';
COMMENT ON COLUMN public.vendor_performance_metrics.valid_tracking_rate IS 'VTR: Lieferungen mit gültigem Tracking. Schwelle 95%';

CREATE INDEX IF NOT EXISTS idx_vendor_perf_date ON public.vendor_performance_metrics(calculation_date);

-- Trigger für updated_at
CREATE TRIGGER update_vendor_performance_metrics_updated_at
  BEFORE UPDATE ON public.vendor_performance_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Initiale Zeilen für alle genehmigten Vendoren (Default-Werte)
INSERT INTO public.vendor_performance_metrics (vendor_id, is_buybox_eligible)
SELECT id, true
FROM vendor_accounts
WHERE kyb_status = 'approved' AND is_active = true
ON CONFLICT (vendor_id) DO NOTHING;

-- View: product_offers mit Metriken (für Buy-Box-Scoring)
-- Nutzt vendor_accounts.odr/lsr/vtr als Fallback, wenn analytics leer
CREATE OR REPLACE VIEW public.product_offers_with_score AS
  -- Shop-Angebote (immer berechtigt, hoher Basis-Score)
  SELECT
    po.product_id,
    po.vendor_id,
    po.offer_id,
    po.seller_type,
    po.seller_name,
    po.unit_price,
    po.shipping_price_eur,
    po.landed_price,
    po.stock,
    po.fulfillment_type,
    po.sort_rank,
    -- Shop: fester Score (gewinnt bei gleichem Preis)
    1000.0::numeric AS buybox_score
  FROM public.product_offers po
  WHERE po.seller_type = 'shop'

  UNION ALL

  -- Vendor-Angebote mit Scoring
  SELECT
    po.product_id,
    po.vendor_id,
    po.offer_id,
    po.seller_type,
    po.seller_name,
    po.unit_price,
    po.shipping_price_eur,
    po.landed_price,
    po.stock,
    po.fulfillment_type,
    po.sort_rank,
    (
      (CASE WHEN po.fulfillment_type = 'fba' THEN 30.0 ELSE 0.0 END)
      + (100.0 / NULLIF(po.landed_price, 0))
      - (COALESCE(vpm.order_defect_rate, va.odr, 0) * 1000.0)
      - (COALESCE(vpm.late_shipment_rate, va.lsr, 0) * 100.0)
      + (COALESCE(vpm.valid_tracking_rate, va.vtr, 1) * 10.0)
    ) AS buybox_score
  FROM public.product_offers po
  JOIN vendor_accounts va ON va.id = po.vendor_id
  LEFT JOIN public.vendor_performance_metrics vpm
    ON vpm.vendor_id = po.vendor_id
    AND (vpm.is_buybox_eligible IS NULL OR vpm.is_buybox_eligible = true)
  WHERE po.seller_type = 'vendor'
    AND (vpm.is_buybox_eligible IS NULL OR vpm.is_buybox_eligible = true);

-- MV aktualisieren: Scoring statt nur Landed Price
DROP MATERIALIZED VIEW IF EXISTS public.mv_active_buybox_winners;

CREATE MATERIALIZED VIEW public.mv_active_buybox_winners AS
  WITH ranked AS (
    SELECT
      product_id,
      vendor_id,
      offer_id,
      seller_type,
      seller_name,
      unit_price,
      shipping_price_eur,
      landed_price,
      stock,
      fulfillment_type,
      ROW_NUMBER() OVER (
        PARTITION BY product_id
        ORDER BY buybox_score DESC, landed_price ASC, sort_rank ASC
      ) AS rn
    FROM public.product_offers_with_score
  )
  SELECT product_id, vendor_id, offer_id, seller_type, seller_name,
         unit_price, shipping_price_eur, landed_price, stock, fulfillment_type
  FROM ranked
  WHERE rn = 1;

CREATE UNIQUE INDEX idx_mv_buybox_product ON public.mv_active_buybox_winners (product_id);

COMMENT ON MATERIALIZED VIEW public.mv_active_buybox_winners IS 'Buy-Box-Gewinner: pro Produkt der Anbieter mit höchstem buybox_score (FBA, Preis, ODR, LSR, VTR)';

GRANT SELECT ON public.product_offers_with_score TO anon, authenticated;

-- Refresh-Funktion anpassen (nutzt product_offers_with_score)
CREATE OR REPLACE FUNCTION refresh_buybox_winners()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_active_buybox_winners;
END;
$$ LANGUAGE plpgsql;

-- RLS (Admin über Service-Role)
ALTER TABLE public.vendor_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Admin liest/schreibt über Service-Role; keine public Policies nötig
