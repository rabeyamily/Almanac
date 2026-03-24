// ─── Auth ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
}

// ─── Category ────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  created_at: string;
}

// ─── Task ────────────────────────────────────────────────────────────────────

export type RepeatSchedule = 'daily' | 'weekdays' | 'weekends' | 'custom' | 'none';

export interface Task {
  id: string;
  user_id: string;
  name: string;
  category_id: string | null;
  scheduled_time: string | null; // "HH:MM"
  repeat_schedule: RepeatSchedule;
  custom_days: number[] | null;  // 0=Sun … 6=Sat
  created_at: string;
}

export interface TaskCompletion {
  id: string;
  task_id: string;
  user_id: string;
  completed_date: string; // "YYYY-MM-DD"
  completed_at: string;
}

// Hydrated task with today's completion status
export interface TaskWithStatus extends Task {
  is_completed: boolean;
  category?: Category | null;
}

// ─── Timed Session ───────────────────────────────────────────────────────────

export interface TimedSession {
  id: string;
  user_id: string;
  name: string;
  duration_seconds: number;
  started_at: string;
  ended_at: string | null;
}

// ─── Mood ────────────────────────────────────────────────────────────────────

export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export interface MoodEntry {
  id: string;
  user_id: string;
  entry_date: string; // "YYYY-MM-DD"
  mood_level: MoodLevel;
  journal_text: string | null;
  created_at: string;
  updated_at: string;
}
