-- Push bildirim token'ı için profiles sütunu
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token text;
