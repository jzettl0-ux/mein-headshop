-- ============================================
-- Vertragsvorlagen (mehrere Typen: Mitarbeiter, Verkäufer, Lieferant, …)
-- + Elektronische Bestätigungen
-- ============================================

CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  template_text TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE contract_templates IS 'Vertragstypen: Mitarbeiter, Verkäufer/Vendor, Lieferant etc. – Vorlagentext mit Platzhaltern';

CREATE TABLE IF NOT EXISTS contract_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_slug TEXT NOT NULL,
  accepted_by_name TEXT,
  accepted_by_email TEXT NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  reference_type TEXT,
  reference_id TEXT,
  template_snapshot TEXT,
  CONSTRAINT fk_contract_slug FOREIGN KEY (contract_slug) REFERENCES contract_templates(slug) ON DELETE CASCADE
);

COMMENT ON TABLE contract_acceptances IS 'Elektronische Bestätigungen: wer hat welchen Vertrag wann akzeptiert';

CREATE INDEX IF NOT EXISTS idx_contract_acceptances_slug ON contract_acceptances(contract_slug);
CREATE INDEX IF NOT EXISTS idx_contract_acceptances_email ON contract_acceptances(accepted_by_email);
CREATE INDEX IF NOT EXISTS idx_contract_acceptances_accepted_at ON contract_acceptances(accepted_at);

ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_acceptances ENABLE ROW LEVEL SECURITY;

-- Lesen: alle (für öffentliche Vertragsanzeige / Bestätigungsseite lesbar über Service Role oder anon mit slug)
CREATE POLICY "Contract templates readable by all"
  ON contract_templates FOR SELECT USING (true);

-- Schreiben: nur über Service Role (Admin-API)
CREATE POLICY "Contract templates admin only"
  ON contract_templates FOR ALL
  USING (false)
  WITH CHECK (false);

-- Acceptances: nur über Service Role (API) lesen/schreiben
CREATE POLICY "Contract acceptances service role only"
  ON contract_acceptances FOR ALL USING (false) WITH CHECK (false);

-- Service Role umgeht RLS; Anon kann nur INSERT in acceptances
-- Admin-API nutzt createSupabaseAdmin() für contract_templates CRUD

-- Trigger: updated_at
CREATE OR REPLACE FUNCTION set_contract_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contract_templates_updated_at ON contract_templates;
CREATE TRIGGER contract_templates_updated_at
  BEFORE UPDATE ON contract_templates
  FOR EACH ROW EXECUTE FUNCTION set_contract_templates_updated_at();

-- Default-Vorlagen (wenn noch keine existieren)
INSERT INTO contract_templates (slug, label, template_text)
VALUES (
  'mitarbeiter',
  'Mitarbeitervertrag',
  E'ARBEITSVERTRAG (Muster – bitte anpassen und rechtlich prüfen lassen)\n\nZwischen\n\n{{company_name}}\n{{company_address}}\n{{company_postal_code}} {{company_city}}\nvertreten durch {{represented_by}}\n\n– nachfolgend „Arbeitgeber“ –\n\nund\n\nName: ___________________________\nAdresse: ___________________________\n– nachfolgend „Arbeitnehmer/in“ –\n\nwird folgender Arbeitsvertrag geschlossen.\n\n§ 1 Beginn und Probezeit\nDer Arbeitsvertrag beginnt am {{start_date}}. Es gilt eine Probezeit von _____ Monaten.\n\n§ 2 Tätigkeit\nDer/die Arbeitnehmer/in wird als ___________________________ beschäftigt.\n\n§ 3 Arbeitszeit\nDie regelmäßige wöchentliche Arbeitszeit beträgt _____ Stunden.\n\n§ 4 Vergütung\nDie monatliche Bruttovergütung beträgt _____ €.\n\n§ 5 Urlaub\nAnspruch auf den gesetzlichen Erholungsurlaub (mind. 20 Werktage bei 5-Tage-Woche).\n\n§ 6 Verschwiegenheit und Datenschutz\nVerschwiegenheit über betriebliche Angelegenheiten; Verarbeitung im Einklang mit der DSGVO.\n\n§ 7 Kündigung\nEs gelten die gesetzlichen Kündigungsfristen.\n\n§ 8 Schlussbestimmungen\nÄnderungen bedürfen der Schriftform.\n\n___________________________ (Ort, Datum)    ___________________________ (Arbeitgeber)\n___________________________ (Arbeitnehmer/in)'
),
(
  'verkaeufer-vendor',
  'Vertrag für Verkäufer / Anbieter',
  E'VERTRAG FÜR VERKÄUFER / ANBIETER (Muster – bitte anpassen und rechtlich prüfen lassen)\n\nZwischen\n\n{{company_name}}\n{{company_address}}\n{{company_postal_code}} {{company_city}}\nvertreten durch {{represented_by}}\n\n– nachfolgend „Betreiber“ –\n\nund\n\nName / Firma: ___________________________\nAdresse: ___________________________\n\n– nachfolgend „Verkäufer/Anbieter“ –\n\nwird folgende Vereinbarung getroffen.\n\n§ 1 Gegenstand\nDer Verkäufer/Anbieter bietet über die Plattform des Betreibers Waren/Dienstleistungen an. Einzelheiten zu Produkten, Preisen und Provisionen werden gesondert vereinbart.\n\n§ 2 Pflichten des Verkäufers\nEinhaltung der AGB des Shops, korrekte Produktbeschreibungen, Einhaltung von Gesetzen (z. B. Jugendschutz, Kennzeichnungspflichten).\n\n§ 3 Vergütung und Abrechnung\nVergütung und Abrechnung erfolgen nach den jeweils gültigen Provisions- und Abrechnungsregeln des Betreibers.\n\n§ 4 Haftung\nDer Verkäufer haftet für die Richtigkeit seiner Angaben und die Einhaltung seiner Verpflichtungen.\n\n§ 5 Vertragslaufzeit und Kündigung\nDer Vertrag wird auf unbestimmte Zeit geschlossen. Kündigung unter Einhaltung der vereinbarten Fristen.\n\n§ 6 Schlussbestimmungen\nÄnderungen bedürfen der Schriftform. Gerichtsstand: ___________________________.\n\n___________________________ (Ort, Datum)    ___________________________ (Betreiber)\n___________________________ (Verkäufer/Anbieter)'
)
ON CONFLICT (slug) DO NOTHING;
