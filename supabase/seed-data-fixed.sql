-- ============================================
-- SEED DATA für Premium Headshop (FIXED mit UUIDs)
-- ============================================
-- Diese Version verwendet echte UUIDs statt String-IDs
-- ============================================

-- Zuerst alte Daten löschen (optional)
TRUNCATE TABLE order_items, orders, products, influencers RESTART IDENTITY CASCADE;

-- ============================================
-- INFLUENCER SEED DATA
-- ============================================

INSERT INTO influencers (name, slug, bio, avatar_url, banner_url, social_links, accent_color, is_active) VALUES
(
  'Max Grün',
  'max-gruen',
  'Hey! Ich bin Max und teile meine Leidenschaft für Premium Cannabis Zubehör mit euch. Alle Produkte in meinem Shop habe ich persönlich getestet und für gut befunden. Quality over Quantity! 🌿',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&q=80',
  'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=400&fit=crop&q=80',
  '{"instagram": "https://instagram.com/maxgruen", "tiktok": "https://tiktok.com/@maxgruen"}',
  '#39FF14',
  true
),
(
  'Lisa High',
  'lisa-high',
  'High-End Lifestyle & Cannabis Expertin. Ich zeige euch die schönsten und hochwertigsten Pieces für eure Sessions. Luxus trifft Lifestyle! ✨💎',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&q=80',
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=400&fit=crop&q=80',
  '{"instagram": "https://instagram.com/lisahigh", "youtube": "https://youtube.com/@lisahigh"}',
  '#D4AF37',
  true
),
(
  'Tom Smoke',
  'tom-smoke',
  'Vaporizer Spezialist & Tech-Enthusiast. Ich teste und reviewe die neuesten Vapes und High-Tech Gadgets für die moderne Session. Tech meets Trees! 🔥⚡',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&q=80',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=400&fit=crop&q=80',
  '{"instagram": "https://instagram.com/tomsmoke", "twitter": "https://twitter.com/tomsmoke"}',
  '#FF6B35',
  true
);

-- Hole die Influencer-IDs für später
DO $$
DECLARE
  max_gruen_id UUID;
  lisa_high_id UUID;
  tom_smoke_id UUID;
BEGIN
  -- Hole IDs
  SELECT id INTO max_gruen_id FROM influencers WHERE slug = 'max-gruen';
  SELECT id INTO lisa_high_id FROM influencers WHERE slug = 'lisa-high';
  SELECT id INTO tom_smoke_id FROM influencers WHERE slug = 'tom-smoke';

  -- ============================================
  -- PRODUCTS SEED DATA
  -- ============================================

  -- Standard Produkte (ohne Influencer)
  INSERT INTO products (name, slug, description, price, image_url, images, category, stock, is_adult_only, is_featured, influencer_id, tags) VALUES
  (
    'Premium Glasbong "Crystal"',
    'premium-glasbong-crystal',
    'Handgefertigte Premium-Bong aus hochwertigem Borosilikatglas. Mit Perkolator für extra sanften Rauch und Ice-Catcher für kühle Sessions. Höhe: 35cm, Wandstärke: 5mm. Made in Germany.',
    89.99,
    'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80',
    ARRAY[
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80',
      'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&q=80',
      'https://images.unsplash.com/photo-1577705998148-6da4f3d70118?w=800&q=80'
    ],
    'bongs',
    12,
    true,
    true,
    NULL,
    ARRAY['premium', 'glas', 'handgefertigt', 'perkolator']
  ),
  (
    'XXL Grinder Gold Edition',
    'xxl-grinder-gold',
    'Hochwertiger CNC-gefrästes Aluminium Grinder mit 4 Teilen und Kief-Fänger. Diamant-geschliffene Zähne für perfektes Mahlergebnis. Durchmesser: 63mm. Gold-eloxiert für den Luxus-Look.',
    34.99,
    'https://images.unsplash.com/photo-1628024488892-3b7c86a4907c?w=800&q=80',
    ARRAY[
      'https://images.unsplash.com/photo-1628024488892-3b7c86a4907c?w=800&q=80',
      'https://images.unsplash.com/photo-1604537529586-054d1b794c82?w=800&q=80'
    ],
    'grinder',
    28,
    false,
    true,
    NULL,
    ARRAY['grinder', 'gold', 'premium', 'cnc']
  ),
  (
    'RAW Black King Size Papers',
    'raw-black-king-size',
    'Die legendären RAW Black Papers - ultradünn und ungebleicht für den puren Geschmack. 50 Papers pro Heftchen. King Size für großzügige Builds. Das Original aus Spanien.',
    4.99,
    'https://images.unsplash.com/photo-1606506082871-8e1c9c3a9e5a?w=800&q=80',
    ARRAY['https://images.unsplash.com/photo-1606506082871-8e1c9c3a9e5a?w=800&q=80'],
    'papers',
    150,
    false,
    false,
    NULL,
    ARRAY['papers', 'raw', 'king-size']
  ),
  (
    'Mighty+ Vaporizer',
    'mighty-plus-vaporizer',
    'Der neue Mighty+ von Storz & Bickel - der Rolls Royce unter den Vaporizern. Verbesserte Aufheizzeit, USB-C Laden, präzise Temperaturkontrolle 40-210°C. Made in Germany. 2 Jahre Garantie.',
    349.99,
    'https://images.unsplash.com/photo-1581922814484-e2bcd2508e31?w=800&q=80',
    ARRAY[
      'https://images.unsplash.com/photo-1581922814484-e2bcd2508e31?w=800&q=80',
      'https://images.unsplash.com/photo-1593078165509-7f0c9c187043?w=800&q=80'
    ],
    'vaporizer',
    8,
    true,
    true,
    NULL,
    ARRAY['vaporizer', 'premium', 'storz-bickel', 'mighty']
  ),
  (
    'Clipper Feuerzeug Set (5er)',
    'clipper-feuerzeug-set',
    '5er Pack bunte Clipper Feuerzeuge. Nachfüllbar und mit herausnehmbarem Stopfer. Perfekt für unterwegs. Verschiedene Designs.',
    9.99,
    'https://images.unsplash.com/photo-1611329427165-c5e9b1da3ba0?w=800&q=80',
    ARRAY['https://images.unsplash.com/photo-1611329427165-c5e9b1da3ba0?w=800&q=80'],
    'zubehoer',
    50,
    false,
    false,
    NULL,
    ARRAY['clipper', 'feuerzeug', 'set']
  ),
  (
    'Premium Rolling Tray Gold',
    'premium-rolling-tray-gold',
    'Edle Rolling Tray aus Metall mit goldener Beschichtung. Abgerundete Ecken für easy Rolling. Größe: 27x16cm. Magnetischer Grinder-Halter inklusive.',
    24.99,
    'https://images.unsplash.com/photo-1616077167555-51f6bc516dfa?w=800&q=80',
    ARRAY['https://images.unsplash.com/photo-1616077167555-51f6bc516dfa?w=800&q=80'],
    'zubehoer',
    35,
    false,
    false,
    NULL,
    ARRAY['rolling-tray', 'gold', 'premium']
  ),

  -- Influencer Produkte - Max Grün
  (
    'Max''s Choice - Perkolator Bong',
    'max-choice-perkolator-bong',
    'Meine persönliche Lieblingsbong! Triple Perkolator für butterweichen Rauch, Ice-Notches und breite Basis für Stabilität. Höhe: 40cm. Das ist die Bong, die ich täglich benutze!',
    129.99,
    'https://images.unsplash.com/photo-1577705998148-6da4f3d70118?w=800&q=80',
    ARRAY[
      'https://images.unsplash.com/photo-1577705998148-6da4f3d70118?w=800&q=80',
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80'
    ],
    'influencer-drops',
    5,
    true,
    true,
    max_gruen_id,
    ARRAY['influencer', 'max-gruen', 'bong', 'perkolator']
  ),
  (
    'Max Grün Signature Grinder',
    'max-gruen-signature-grinder',
    'Mein Custom Grinder mit meinem Logo lasergraviert! 4-teilig, Kief-Catcher, perfekte Mahlkonsistenz. In meiner Signature-Farbe Neon-Grün. Limited Edition!',
    44.99,
    'https://images.unsplash.com/photo-1628024488892-3b7c86a4907c?w=800&q=80',
    ARRAY['https://images.unsplash.com/photo-1628024488892-3b7c86a4907c?w=800&q=80'],
    'influencer-drops',
    15,
    false,
    true,
    max_gruen_id,
    ARRAY['influencer', 'max-gruen', 'grinder', 'limited']
  ),

  -- Influencer Produkte - Lisa High
  (
    'Lisa''s Gold Bong Deluxe',
    'lisa-gold-bong-deluxe',
    'Luxury at its finest! Meine goldene Premium-Bong mit Swarovski-Kristallen verziert. Nicht nur funktional, sondern auch ein echtes Kunstwerk. Höhe: 30cm. Handgemacht.',
    199.99,
    'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&q=80',
    ARRAY[
      'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&q=80',
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80'
    ],
    'influencer-drops',
    3,
    true,
    true,
    lisa_high_id,
    ARRAY['influencer', 'lisa-high', 'luxury', 'gold', 'limited']
  ),

  -- Influencer Produkte - Tom Smoke
  (
    'Tom''s Tech Vape Station',
    'tom-tech-vape-station',
    'Meine Ultimate Vape Station! Desktop Vaporizer mit präziser Temperaturkontrolle, Digital Display und Whip-System. Perfekt für zuhause. Der beste Desktop-Vape auf dem Markt!',
    279.99,
    'https://images.unsplash.com/photo-1593078165509-7f0c9c187043?w=800&q=80',
    ARRAY[
      'https://images.unsplash.com/photo-1593078165509-7f0c9c187043?w=800&q=80',
      'https://images.unsplash.com/photo-1581922814484-e2bcd2508e31?w=800&q=80'
    ],
    'influencer-drops',
    6,
    true,
    true,
    tom_smoke_id,
    ARRAY['influencer', 'tom-smoke', 'vaporizer', 'desktop']
  );
END $$;

-- ✅ ERFOLGSMELDUNG
SELECT 'Seed-Data erfolgreich importiert!' as status;
SELECT '10 Produkte und 3 Influencer wurden erstellt' as info;

-- Prüfe die Daten
SELECT name, slug, category, price FROM products ORDER BY created_at;
SELECT name, slug, accent_color FROM influencers;
