-- Phase 8cx.3: A-bis-z-Garantie – Admin-Notizen und Abschlussgrund
ALTER TABLE cx.a_to_z_claims
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS resolution_reason TEXT;

COMMENT ON COLUMN cx.a_to_z_claims.admin_notes IS 'Interne Notizen für Admin (nicht für Kunden sichtbar)';
COMMENT ON COLUMN cx.a_to_z_claims.resolution_reason IS 'Begründung bei GRANTED/DENIED/WITHDRAWN';
