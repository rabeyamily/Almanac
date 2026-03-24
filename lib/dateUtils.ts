import { format, isToday, isSameDay, parseISO } from 'date-fns';

/** Returns "MON // 23.03.2026" */
export function formatVintageDate(date: Date): string {
  const day = format(date, 'EEE').toUpperCase();
  const rest = format(date, 'dd.MM.yyyy');
  return `${day} // ${rest}`;
}

/** Returns "HH:MM:SS" */
export function formatClock(date: Date): string {
  return format(date, 'HH:mm:ss');
}

/** Returns "YYYY-MM-DD" — used as the primary date key across tables */
export function toDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** Parse a "YYYY-MM-DD" string to a Date */
export function fromDateKey(key: string): Date {
  return parseISO(key);
}

/** Returns "DD MMM YYYY" — e.g. "23 MAR 2026" */
export function formatShortDate(date: Date): string {
  return format(date, 'dd MMM yyyy').toUpperCase();
}

/** Returns "HH:MM" from a full Date */
export function formatTime(date: Date): string {
  return format(date, 'HH:mm');
}

/** Formats seconds to "MM:SS" */
export function formatDuration(seconds: number): string {
  const safe = Math.max(0, seconds);
  const m = Math.floor(safe / 60).toString().padStart(2, '0');
  const s = (safe % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/** Formats seconds to "HH:MM:SS" */
export function formatDurationHMS(seconds: number): string {
  const safe = Math.max(0, seconds);
  const h = Math.floor(safe / 3600).toString().padStart(2, '0');
  const m = Math.floor((safe % 3600) / 60).toString().padStart(2, '0');
  const s = (safe % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export { isToday, isSameDay };
