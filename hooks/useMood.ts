import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { MoodEntry, MoodLevel } from '@/lib/types';
import { toDateKey } from '@/lib/dateUtils';

interface UseMoodReturn {
  entries: MoodEntry[];
  todayEntry: MoodEntry | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  saveEntry: (date: Date, mood: MoodLevel, journalText: string) => Promise<void>;
}

export function useMood(): UseMoodReturn {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .order('entry_date', { ascending: false })
      .limit(90);

    if (error) setError(error.message);
    else { setEntries(data ?? []); setError(null); }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();

    const channel = supabase
      .channel('mood')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mood_entries' }, fetch)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetch]);

  const todayEntry = entries.find(e => e.entry_date === toDateKey(new Date())) ?? null;

  const saveEntry = useCallback(async (date: Date, mood: MoodLevel, journalText: string) => {
    const dateKey = toDateKey(date);
    const existing = entries.find(e => e.entry_date === dateKey);

    const payload = {
      entry_date: dateKey,
      mood_level: mood,
      journal_text: journalText || null,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      // Optimistic update
      setEntries(prev =>
        prev.map(e => (e.id === existing.id ? { ...e, ...payload } : e))
      );
      const { error } = await supabase.from('mood_entries').update(payload).eq('id', existing.id);
      if (error) { setError(error.message); fetch(); }
    } else {
      // Optimistic insert
      const tempEntry: MoodEntry = {
        id: `temp-${Date.now()}`,
        user_id: '',
        created_at: new Date().toISOString(),
        ...payload,
      };
      setEntries(prev => [tempEntry, ...prev]);

      const { data, error } = await supabase
        .from('mood_entries')
        .insert(payload)
        .select()
        .single();

      if (error) {
        setEntries(prev => prev.filter(e => e.id !== tempEntry.id));
        setError(error.message);
      } else {
        setEntries(prev => prev.map(e => (e.id === tempEntry.id ? data : e)));
      }
    }
  }, [entries, fetch]);

  return { entries, todayEntry, loading, error, refresh: fetch, saveEntry };
}
