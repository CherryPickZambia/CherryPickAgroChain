-- Landing page CMS — run on your Supabase project
CREATE TABLE IF NOT EXISTS landing_page_content (
  id TEXT PRIMARY KEY DEFAULT 'main',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO landing_page_content (id, content)
VALUES ('main', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE landing_page_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS allow_all_landing_page_content ON landing_page_content;
CREATE POLICY allow_all_landing_page_content ON landing_page_content
  FOR ALL USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS trg_landing_page_content_updated_at ON landing_page_content;
CREATE TRIGGER trg_landing_page_content_updated_at
  BEFORE UPDATE ON landing_page_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
