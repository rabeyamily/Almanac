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

export type ReminderFrequency = 'once' | 'daily' | 'weekdays' | 'custom';

export interface ReminderSettings {
  enabled: boolean;
  frequency: ReminderFrequency;
  date: string | null; // YYYY-MM-DD for one-time reminders
  time: string | null; // HH:MM
  custom_days: number[] | null; // 0=Sun … 6=Sat
  message: string | null;
  notification_ids?: string[] | null;
}

// ─── Category ────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  reminder_settings: ReminderSettings | null;
  created_at: string;
}

export interface Subcategory {
  id: string;
  user_id: string;
  category_id: string;
  name: string;
  color: string | null; // NULL = inherit parent color
  reminder_settings: ReminderSettings | null;
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
  order_index: number;
  highlighted: boolean;
  tracker_enabled?: boolean | null;
  tracker_nickname?: string | null;
  reminder_settings: ReminderSettings | null;
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
  completed_seconds?: number | null;
  session_type?: 'simple' | 'preset' | null;
  preset_id?: string | null;
  is_completed?: boolean | null;
  is_stopped_manually?: boolean | null;
  details?: Record<string, unknown> | null;
  started_at: string;
  ended_at: string | null;
}

export interface TimerPresetInterval {
  id: string;
  user_id: string;
  preset_id: string;
  label: string;
  duration_seconds: number;
  color: string;
  order_index: number;
  created_at: string;
}

export interface TimerPreset {
  id: string;
  user_id: string;
  name: string;
  repeat_count: number; // ignored when is_infinite = true
  is_infinite: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
  intervals: TimerPresetInterval[];
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
