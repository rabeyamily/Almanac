-- ============================================================
-- MIGRATION 002: Subcategories + Rich Text Task Names
-- Run this in your Supabase SQL editor AFTER the initial schema.
-- ============================================================

-- ─── SUBCATEGORIES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subcategories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  color       TEXT,  -- NULL = inherit parent category color
  reminder_settings JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own subcategories" ON subcategories;
CREATE POLICY "Users manage own subcategories"
  ON subcategories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS subcategories_set_user_id ON subcategories;
CREATE TRIGGER subcategories_set_user_id
  BEFORE INSERT ON subcategories
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- ─── ADD COLUMNS TO TASKS ───────────────────────────────────
-- subcategory_id: optional link to a subcategory within the parent category
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL;

-- rich_text_name: JSON array of styled text segments for formatted task names
-- Each segment: { "text": "...", "bold": bool, "italic": bool, "underline": bool, "strikethrough": bool, "color": "#hex" | null }
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS rich_text_name JSONB;

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 0;

-- ─── HIGHLIGHTED (pinned) TASKS ─────────────────────────────
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS highlighted BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS reminder_settings JSONB;

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS reminder_settings JSONB;

-- ─── REALTIME ───────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'subcategories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE subcategories;
  END IF;
END
$$;
