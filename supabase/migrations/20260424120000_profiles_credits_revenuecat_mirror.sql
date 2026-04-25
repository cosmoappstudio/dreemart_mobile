-- profiles.credits = RevenueCat virtual currency aynası (webhook: revenuecat-webhook)
-- Oyun içi otorite: RevenueCat. Bu sütun raporlama / SQL / Dashboard listeleri içindir.
-- Manuel toplu düzeltme: SQL editör (postgres) veya RevenueCat Customer üzerinden.

COMMENT ON COLUMN public.profiles.credits IS
  'Ayna: RevenueCat virtual currency. Güncellemeyi yalnızca service role (revenuecat-webhook) yapar; uygulama satın almayı sadece RC üzerinden yönetir.';

-- Giriş yapan uygulama istemcileri credits sütununu değiştiremesin
CREATE OR REPLACE FUNCTION public.profiles_credits_no_client_updates()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  jwt_role text;
BEGIN
  IF TG_OP <> 'UPDATE' OR NEW.credits IS NOT DISTINCT FROM OLD.credits THEN
    RETURN NEW;
  END IF;
  BEGIN
    jwt_role := current_setting('request.jwt.claims', true)::json->>'role';
  EXCEPTION
    WHEN OTHERS THEN
      jwt_role := NULL;
  END;
  IF jwt_role IN ('authenticated', 'anon') THEN
    RAISE EXCEPTION 'profiles.credits yalnızca sunucu (RevenueCat senkronu) ile güncellenir; kredi yönetimi RevenueCat'
      USING errcode = 'check_violation',
            hint = 'Bakiyeyi app.revenuecat.com üzerinden veya VIRTUAL_CURRENCY_TRANSACTION webhook senkronu ile güncelleyin';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_credits_revenuecat_guard ON public.profiles;
CREATE TRIGGER profiles_credits_revenuecat_guard
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_credits_no_client_updates();

-- Yeni kullanıcılarda başlangıç 0; ücretsiz kredi RevenueCat (tanıtım) veya ilk IAP ile gelir
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, credits, tier, role, language, username, created_at, updated_at)
  VALUES (
    NEW.id,
    0,
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
$$;
