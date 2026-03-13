-- profiles tablosuna push_token ekle (Expo push notifications için)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;
