-- Onboarding "hazır" adımındaki ücretsiz kredi sayısı (tam sayı, string olarak saklanır)
INSERT INTO app_config (key, value) VALUES
  ('initial_free_credits', '1')
ON CONFLICT (key) DO NOTHING;
