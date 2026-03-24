-- ============================================================
-- MIGRATION 003: Timer Presets + Enhanced Session History
-- ============================================================

-- ─── TIMER PRESETS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS timer_presets (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  repeat_count INTEGER NOT NULL DEFAULT 1,
  is_infinite  BOOLEAN NOT NULL DEFAULT FALSE,
  order_index  INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE timer_presets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own timer presets" ON timer_presets;
CREATE POLICY "Users manage own timer presets"
  ON timer_presets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS timer_presets_set_user_id ON timer_presets;
CREATE TRIGGER timer_presets_set_user_id
  BEFORE INSERT ON timer_presets
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- ─── TIMER PRESET INTERVALS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS timer_preset_intervals (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preset_id        UUID NOT NULL REFERENCES timer_presets(id) ON DELETE CASCADE,
  label            TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  color            TEXT NOT NULL DEFAULT '#4A7C59',
  order_index      INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE timer_preset_intervals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own preset intervals" ON timer_preset_intervals;
CREATE POLICY "Users manage own preset intervals"
  ON timer_preset_intervals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS timer_preset_intervals_set_user_id ON timer_preset_intervals;
CREATE TRIGGER timer_preset_intervals_set_user_id
  BEFORE INSERT ON timer_preset_intervals
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- ─── ENHANCED TIMED SESSIONS ─────────────────────────────────
ALTER TABLE timed_sessions
  ADD COLUMN IF NOT EXISTS session_type TEXT NOT NULL DEFAULT 'simple';

ALTER TABLE timed_sessions
  ADD COLUMN IF NOT EXISTS preset_id UUID REFERENCES timer_presets(id) ON DELETE SET NULL;

ALTER TABLE timed_sessions
  ADD COLUMN IF NOT EXISTS completed_seconds INTEGER;

ALTER TABLE timed_sessions
  ADD COLUMN IF NOT EXISTS is_completed BOOLEAN;

ALTER TABLE timed_sessions
  ADD COLUMN IF NOT EXISTS is_stopped_manually BOOLEAN;

ALTER TABLE timed_sessions
  ADD COLUMN IF NOT EXISTS details JSONB;

-- ─── REALTIME PUBLICATION GUARDS ─────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'timer_presets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE timer_presets;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'timer_preset_intervals'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE timer_preset_intervals;
  END IF;
END
$$;
