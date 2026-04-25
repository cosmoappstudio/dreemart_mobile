-- Genişletilmiş uygulama dilleri: de, es, pt, fr, it, nl, pl, fi, el, ja, ko, ar, hi (+ tr, en, ru)

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_language_check;

UPDATE profiles
SET language = 'en'
WHERE language IS NOT NULL
  AND language NOT IN (
    'tr',
    'en',
    'ru',
    'ar',
    'de',
    'el',
    'es',
    'fi',
    'fr',
    'hi',
    'it',
    'ja',
    'ko',
    'nl',
    'pl',
    'pt'
  );

ALTER TABLE profiles ADD CONSTRAINT profiles_language_check
  CHECK (
    language IS NULL
    OR language IN (
      'tr',
      'en',
      'ru',
      'ar',
      'de',
      'el',
      'es',
      'fi',
      'fr',
      'hi',
      'it',
      'ja',
      'ko',
      'nl',
      'pl',
      'pt'
    )
  );
