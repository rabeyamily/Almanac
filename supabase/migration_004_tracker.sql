-- ─── TRACKER FIELDS (habit selection + short nickname) ──────────────

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS tracker_enabled BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS tracker_nickname TEXT;

