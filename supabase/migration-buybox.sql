-- ============================================
-- Phase 4: Buy Box (Marktplatz Blueprint)
-- ============================================
-- Landed Price, Buy-Box-Scoring, Materialized View für schnelle Zuordnung

-- vendor_offers: Versandkosten für Landed Price
ALTER TABLE vendor_offers
  ADD COLUMN IF NOT EXISTS shipping_price_eur DECIMAL(10,2) DEFAULT 0;

COMMENT ON COLUMN vendor_offers.shipping_price_eur IS 'Versandkosten für Landed Price = price + shipping_price_eur';

-- vendor_accounts: Metriken für Buy-Box-Scoring (ODR, LSR, VTR)
-- ODR=Order Defect Rate, LSR=Late Shipment Rate, VTR=Valid Tracking Rate
ALTER TABLE vendor_accounts
  ADD COLUMN IF NOT EXISTS odr DECIMAL(5,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lsr DECIMAL(5,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vtr DECIMAL(5,4) DEFAULT 1;

COMMENT ON COLUMN vendor_accounts.odr IS 'Order Defect Rate (0-1), niedriger = besser';
COMMENT ON COLUMN vendor_accounts.lsr IS 'Late Shipment Rate (0-1), niedriger = besser';
COMMENT ON COLUMN vendor_accounts.vtr IS 'Valid Tracking Rate (0-1), höher = besser';

-- View: Alle Kaufoptionen pro Produkt (Shop + Vendoren)
-- Shop-Angebot = products(price, stock), Versand 0
-- Landed Price = price + shipping_price_eur
CREATE OR REPLACE VIEW public.product_offers AS
  -- Shop-Angebot (eigenes Produkt)
  SELECT
    p.id AS product_id,
    NULL::uuid AS vendor_id,
    NULL::uuid AS offer_id,
    'shop'::text AS seller_type,
    'Unser Shop'::text AS seller_name,
    p.price AS unit_price,
    0::decimal AS shipping_price_eur,
    (p.price + 0) AS landed_price,
    p.stock,
    'fbm'::text AS fulfillment_type,
    1 AS sort_rank
  FROM products p
  WHERE p.is_active IS NOT FALSE
    AND p.stock > 0

  UNION ALL

  -- Vendor-Angebote
  SELECT
    vo.product_id,
    vo.vendor_id,
    vo.id AS offer_id,
    'vendor'::text AS seller_type,
    COALESCE(va.company_name, 'Vendor') AS seller_name,
    vo.price AS unit_price,
    COALESCE(vo.shipping_price_eur, 0) AS shipping_price_eur,
    (vo.price + COALESCE(vo.shipping_price_eur, 0)) AS landed_price,
    vo.stock,
    vo.fulfillment_type,
    2 AS sort_rank
  FROM vendor_offers vo
  JOIN vendor_accounts va ON va.id = vo.vendor_id
  WHERE vo.is_active = true
    AND vo.stock > 0
    AND va.kyb_status = 'approved'
    AND va.is_active = true;

COMMENT ON VIEW public.product_offers IS 'Alle Kaufoptionen pro Produkt: Shop + Vendoren mit Landed Price';

-- Materialized View: Buy-Box-Gewinner pro Produkt (niedrigster Landed Price)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_active_buybox_winners AS
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
        ORDER BY landed_price ASC, sort_rank ASC, unit_price ASC
      ) AS rn
    FROM product_offers
  )
  SELECT product_id, vendor_id, offer_id, seller_type, seller_name,
         unit_price, shipping_price_eur, landed_price, stock, fulfillment_type
  FROM ranked
  WHERE rn = 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_buybox_product
  ON public.mv_active_buybox_winners (product_id);

COMMENT ON MATERIALIZED VIEW public.mv_active_buybox_winners IS 'Buy-Box-Gewinner: pro Produkt der Anbieter mit niedrigstem Landed Price';

-- Öffentlicher Lesezugriff für Shop (anon/authenticated)
GRANT SELECT ON public.product_offers TO anon, authenticated;
GRANT SELECT ON public.mv_active_buybox_winners TO anon, authenticated;

-- vendor_offers: Shop-Kunden dürfen aktive Angebote genehmigter Vendoren lesen
CREATE POLICY "Public can view active approved vendor offers"
  ON vendor_offers FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM vendor_accounts va
      WHERE va.id = vendor_offers.vendor_id
        AND va.kyb_status = 'approved'
        AND va.is_active = true
    )
  );

-- Refresh-Funktion (nach Bestellungen/Angebotsänderungen aufrufen)
CREATE OR REPLACE FUNCTION refresh_buybox_winners()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_active_buybox_winners;
END;
$$ LANGUAGE plpgsql;
