-- Editable, persisted platform settings (single row). Safe to run multiple times.
CREATE TABLE IF NOT EXISTS platform_settings (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO platform_settings (id, data)
VALUES ('platform', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;
