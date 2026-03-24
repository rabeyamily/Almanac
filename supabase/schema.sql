-- ============================================================
-- ALMANAC — Supabase Database Schema
-- Run this in your Supabase SQL editor to set up all tables.
-- Row Level Security (RLS) is enabled on every table so each
-- user can only access their own data.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── CATEGORIES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  icon        TEXT NOT NULL DEFAULT '★',
  color       TEXT NOT NULL DEFAULT '#4A7C59',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own categories"
  ON categories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-set user_id to the authenticated user on insert
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$;

CREATE TRIGGER categories_set_user_id
  BEFORE INSERT ON categories
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- ─── TASKS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  category_id      UUID REFERENCES categories(id) ON DELETE SET NULL,
  scheduled_time   TEXT,              -- "HH:MM"
  repeat_schedule  TEXT NOT NULL DEFAULT 'daily',
  custom_days      INTEGER[],         -- 0=Sun … 6=Sat
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tasks"
  ON tasks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER tasks_set_user_id
  BEFORE INSERT ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- ─── TASK COMPLETIONS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_completions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id         UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_date  DATE NOT NULL,       -- "YYYY-MM-DD"
  completed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (task_id, completed_date)
);

ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own completions"
  ON task_completions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER task_completions_set_user_id
  BEFORE INSERT ON task_completions
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- ─── TIMED SESSIONS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS timed_sessions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  duration_seconds  INTEGER NOT NULL,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at          TIMESTAMPTZ
);

ALTER TABLE timed_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sessions"
  ON timed_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER timed_sessions_set_user_id
  BEFORE INSERT ON timed_sessions
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- ─── MOOD ENTRIES ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mood_entries (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date    DATE NOT NULL,          -- "YYYY-MM-DD"
  mood_level    SMALLINT NOT NULL CHECK (mood_level BETWEEN 1 AND 5),
  journal_text  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, entry_date)
);

ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own mood entries"
  ON mood_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER mood_entries_set_user_id
  BEFORE INSERT ON mood_entries
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- ─── REALTIME ───────────────────────────────────────────────
-- Enable realtime publications for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE categories;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE task_completions;
ALTER PUBLICATION supabase_realtime ADD TABLE timed_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE mood_entries;
