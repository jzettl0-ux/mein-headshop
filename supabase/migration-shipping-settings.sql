-- Rücksendeadresse, Carrier-Links und API-Credentials im Admin konfigurierbar
-- return_address: JSON mit name, street, house_number, postal_code, city, country (optional: name2, email, phone)
-- carrier_portal_links: JSON mit portal, returns, tracking, qr_return_url, return_print_url, return_prefill_url, api_base_url pro Carrier
-- carrier_credentials: JSON mit API-Keys (z.B. dhl: api_key, api_secret, gkp_username, gkp_password, billing_number, sandbox)

INSERT INTO site_settings (key, value) VALUES ('return_address', '{}') ON CONFLICT (key) DO NOTHING;
INSERT INTO site_settings (key, value) VALUES ('carrier_portal_links', '{}') ON CONFLICT (key) DO NOTHING;
INSERT INTO site_settings (key, value) VALUES ('carrier_credentials', '{}') ON CONFLICT (key) DO NOTHING;
