-- Dreemart Supabase Setup
-- Run this in Supabase SQL Editor
-- ÖNEMLİ: Supabase Dashboard > Authentication > Providers > Anonymous Sign-Ins = ON

-- 1. artists tablosuna is_free ekle
ALTER TABLE artists ADD COLUMN IF NOT EXISTS is_free boolean DEFAULT false;
UPDATE artists SET is_free = true WHERE sort_order IN (0, 1, 2);

-- 2. RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE replicate_models ENABLE ROW LEVEL SECURITY;

-- profiles policies
DROP POLICY IF EXISTS "own_profile_select" ON profiles;
CREATE POLICY "own_profile_select" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "own_profile_update" ON profiles;
CREATE POLICY "own_profile_update" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "own_profile_insert" ON profiles;
CREATE POLICY "own_profile_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- dreams policies
DROP POLICY IF EXISTS "own_dreams_select" ON dreams;
CREATE POLICY "own_dreams_select" ON dreams FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own_dreams_insert" ON dreams;
CREATE POLICY "own_dreams_insert" ON dreams FOR INSERT WITH CHECK (auth.uid() = user_id);

-- artists public read
DROP POLICY IF EXISTS "artists_public" ON artists;
CREATE POLICY "artists_public" ON artists FOR SELECT USING (true);

-- replicate_models public read
DROP POLICY IF EXISTS "replicate_models_public" ON replicate_models;
CREATE POLICY "replicate_models_public" ON replicate_models FOR SELECT USING (true);

-- 3. Trigger: auth.users'a yeni kullanıcı eklendiğinde otomatik profile oluştur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, credits, tier, role, language, username, created_at, updated_at)
  VALUES (
    NEW.id,
    1,
    'free',
    'user',
    'tr',
    'rüyacı_' || substr(NEW.id::text, 1, 8),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Storage bucket: Create "dream-images" bucket in Supabase Dashboard > Storage
-- Make it public for read access

-- 5. Realtime: profiles tablosu için replication (tier güncellemeleri anında yansısın)
-- Supabase Dashboard > Database > Replication > profiles tablosunu ekleyin
-- Alternatif: ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
