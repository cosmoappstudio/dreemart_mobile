-- profiles.language sütununu tr, en, ru destekleyecek şekilde güncelle
-- Uygulama: Türkçe, İngilizce, Rusça

-- 1. Mevcut constraint'leri kaldır
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_language_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_language_fkey;

-- 2. Sütunu text yap (enum ise ru ekleyebilmek için)
ALTER TABLE profiles ALTER COLUMN language TYPE text USING language::text;

-- 3. Geçersiz değerleri (es, de vb.) tr'ye çevir
UPDATE profiles SET language = 'tr' WHERE language IS NOT NULL AND language NOT IN ('tr', 'en', 'ru');

-- 4. Geçerli değerler için check constraint ekle
ALTER TABLE profiles ADD CONSTRAINT profiles_language_check
  CHECK (language IS NULL OR language IN ('tr', 'en', 'ru'));
