// ─── Auth ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
}

// ─── Rich Text ───────────────────────────────────────────────────────────────

export interface RichTextSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  color?: string | null;
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

export interface Subcategory {
  id: string;
  user_id: string;
  category_id: string;
  name: string;
  color: string | null; // NULL = inherit parent color
  created_at: string;
}

// Category with nested subcategories (for display)
export interface CategoryWithSubs extends Category {
  subcategories: Subcategory[];
}

// ─── Task ────────────────────────────────────────────────────────────────────

export type RepeatSchedule = 'daily' | 'weekdays' | 'weekends' | 'custom' | 'none';

export interface Task {
  id: string;
  user_id: string;
  name: string;
  rich_text_name: RichTextSegment[] | null;
  category_id: string | null;
  subcategory_id: string | null;
  scheduled_time: string | null;
  repeat_schedule: RepeatSchedule;
  custom_days: number[] | null;
  highlighted: boolean;
  created_at: string;
}

export interface TaskCompletion {
  id: string;
  task_id: string;
  user_id: string;
  completed_date: string;
  completed_at: string;
}

export interface TaskWithStatus extends Task {
  is_completed: boolean;
  category?: Category | null;
  subcategory?: Subcategory | null;
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
  entry_date: string;
  mood_level: MoodLevel;
  journal_text: string | null;
  created_at: string;
  updated_at: string;
}
