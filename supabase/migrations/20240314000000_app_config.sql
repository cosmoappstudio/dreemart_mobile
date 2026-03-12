-- App config: Destek, Sözleşmeler ve Koşullar, EULA linklerini Supabase'den yönet
-- Bu tabloyu Supabase Dashboard > Table Editor üzerinden düzenleyebilirsiniz

CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Public read (herkes okuyabilir)
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_config_public_read" ON app_config;
CREATE POLICY "app_config_public_read" ON app_config FOR SELECT USING (true);

-- Sadece service role ile yazılabilir (Dashboard'dan düzenle)
-- INSERT/UPDATE için RLS policy yok = sadece service role veya dashboard

-- Varsayılan değerler (Supabase Dashboard > Table Editor > app_config üzerinden düzenleyebilirsiniz)
INSERT INTO app_config (key, value) VALUES
  ('support_url', 'mailto:hello@aspiyas.com'),
  ('terms_url', 'https://dreemart.com/terms'),
  ('eula_url', 'https://dreemart.com/eula')
ON CONFLICT (key) DO NOTHING;
