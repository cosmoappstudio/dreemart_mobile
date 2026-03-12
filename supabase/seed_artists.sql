-- artists tablosu boşsa bu script'i Supabase SQL Editor'da çalıştırın
-- Önce migration'ı çalıştırın: 20240312000000_dreemart_setup.sql

INSERT INTO artists (id, slug, name, style_description, image_url, is_active, is_free, sort_order)
SELECT gen_random_uuid(), 'van-gogh', 'Vincent van Gogh', 'Post-impressionist, bold brushstrokes, vibrant yellows and blues', 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=200', true, true, 0
WHERE NOT EXISTS (SELECT 1 FROM artists WHERE slug = 'van-gogh');

INSERT INTO artists (id, slug, name, style_description, image_url, is_active, is_free, sort_order)
SELECT gen_random_uuid(), 'monet', 'Claude Monet', 'Impressionist, soft light, water lilies, pastel colors', 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=200', true, true, 1
WHERE NOT EXISTS (SELECT 1 FROM artists WHERE slug = 'monet');

INSERT INTO artists (id, slug, name, style_description, image_url, is_active, is_free, sort_order)
SELECT gen_random_uuid(), 'dali', 'Salvador Dalí', 'Surrealist, melting clocks, dreamlike symbolic imagery', 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=200', true, true, 2
WHERE NOT EXISTS (SELECT 1 FROM artists WHERE slug = 'dali');
