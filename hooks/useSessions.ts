import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { TimedSession } from '@/lib/types';

interface UseSessionsReturn {
  sessions: TimedSession[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createSession: (name: string, durationSeconds: number) => Promise<TimedSession | null>;
  completeSession: (id: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
}

export function useSessions(): UseSessionsReturn {
  const [sessions, setSessions] = useState<TimedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('timed_sessions')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(50);

    if (error) setError(error.message);
    else { setSessions(data ?? []); setError(null); }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();

    const channel = supabase
      .channel('sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'timed_sessions' }, fetch)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetch]);

  const createSession = useCallback(async (
    name: string,
    durationSeconds: number
  ): Promise<TimedSession | null> => {
    const payload = { name, duration_seconds: durationSeconds, started_at: new Date().toISOString() };
    const { data, error } = await supabase
      .from('timed_sessions')
      .insert(payload)
      .select()
      .single();

    if (error) { setError(error.message); return null; }
    setSessions(prev => [data, ...prev]);
    return data;
  }, []);

  const completeSession = useCallback(async (id: string) => {
    const endedAt = new Date().toISOString();
    setSessions(prev => prev.map(s => (s.id === id ? { ...s, ended_at: endedAt } : s)));
    const { error } = await supabase.from('timed_sessions').update({ ended_at: endedAt }).eq('id', id);
    if (error) { setError(error.message); fetch(); }
  }, [fetch]);

  const deleteSession = useCallback(async (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    const { error } = await supabase.from('timed_sessions').delete().eq('id', id);
    if (error) { setError(error.message); fetch(); }
  }, [fetch]);

  return { sessions, loading, error, refresh: fetch, createSession, completeSession, deleteSession };
}
