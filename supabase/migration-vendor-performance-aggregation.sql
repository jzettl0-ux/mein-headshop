-- Phase 1.2: Aggregation für Vendor Performance Metrics (ODR, LSR, VTR, pre_fulfillment)
-- Berechnet Metriken aus fulfillment.order_lines und orders. Cron ruft refresh_vendor_performance_metrics() auf.

CREATE OR REPLACE FUNCTION refresh_vendor_performance_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Upsert Metriken pro Vendor aus order_lines + orders
  INSERT INTO public.vendor_performance_metrics (
    vendor_id,
    calculation_date,
    order_defect_rate,
    pre_fulfillment_cancellation_rate,
    late_shipment_rate,
    valid_tracking_rate,
    is_buybox_eligible,
    updated_at
  )
  SELECT
    v.id AS vendor_id,
    CURRENT_DATE,
    COALESCE(agg.odr, 0)::numeric(5,4),
    COALESCE(agg.pre_fulfillment_rate, 0)::numeric(5,4),
    COALESCE(v.lsr, 0)::numeric(5,4),
    COALESCE(v.vtr, 1)::numeric(5,4),
    (COALESCE(agg.odr, 0) <= 0.01),
    NOW()
  FROM vendor_accounts v
  LEFT JOIN LATERAL (
    SELECT
      ol.vendor_id,
      -- ODR: Anteil bei stornierten Bestellungen (bezahlte Orders)
      CASE WHEN COUNT(*) FILTER (WHERE o.payment_status = 'paid') > 0
        THEN (COUNT(*) FILTER (WHERE o.payment_status = 'paid' AND o.status = 'cancelled'))::numeric
             / NULLIF(COUNT(*) FILTER (WHERE o.payment_status = 'paid'), 0)
        ELSE 0 END AS odr,
      -- Pre-Fulfillment: Storno vor Versand (Order hat keine Sendung)
      CASE WHEN COUNT(*) FILTER (WHERE o.payment_status = 'paid') > 0
        THEN (COUNT(*) FILTER (WHERE o.payment_status = 'paid' AND o.status = 'cancelled'
              AND NOT EXISTS (SELECT 1 FROM order_shipments s WHERE s.order_id = o.id)))::numeric
             / NULLIF(COUNT(*) FILTER (WHERE o.payment_status = 'paid'), 0)
        ELSE 0 END AS pre_fulfillment_rate
    FROM fulfillment.order_lines ol
    JOIN orders o ON o.id = ol.order_id
    WHERE ol.vendor_id = v.id
    GROUP BY ol.vendor_id
  ) agg ON agg.vendor_id = v.id
  WHERE v.kyb_status = 'approved' AND v.is_active = true
  ON CONFLICT (vendor_id) DO UPDATE SET
    calculation_date = EXCLUDED.calculation_date,
    order_defect_rate = EXCLUDED.order_defect_rate,
    pre_fulfillment_cancellation_rate = EXCLUDED.pre_fulfillment_cancellation_rate,
    late_shipment_rate = EXCLUDED.late_shipment_rate,
    valid_tracking_rate = EXCLUDED.valid_tracking_rate,
    is_buybox_eligible = EXCLUDED.is_buybox_eligible,
    updated_at = NOW();

  -- Buy-Box-MV aktualisieren (nutzt vendor_performance_metrics)
  PERFORM refresh_buybox_winners();
END;
$$;

COMMENT ON FUNCTION refresh_vendor_performance_metrics() IS 'Phase 1.2: Aggregiert ODR, LSR, VTR aus order_lines/orders. Cron aufrufen.';
