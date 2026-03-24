import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { TimedSession, TimerPreset, TimerPresetInterval } from '@/lib/types';

interface UseSessionsReturn {
  sessions: TimedSession[];
  presets: TimerPreset[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createSessionStart: (input: {
    name: string;
    durationSeconds: number;
    sessionType?: 'simple' | 'preset';
    presetId?: string | null;
    details?: Record<string, unknown> | null;
  }) => Promise<TimedSession | null>;
  finishSession: (id: string, input: {
    completedSeconds: number;
    isCompleted: boolean;
    isStoppedManually?: boolean;
    details?: Record<string, unknown> | null;
  }) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  createPreset: (input: {
    name: string;
    repeatCount: number;
    isInfinite: boolean;
    intervals: Array<{ label: string; duration_seconds: number; color: string }>;
  }) => Promise<TimerPreset | null>;
  updatePreset: (id: string, input: {
    name: string;
    repeatCount: number;
    isInfinite: boolean;
    intervals: Array<{ label: string; duration_seconds: number; color: string }>;
  }) => Promise<void>;
  deletePreset: (id: string) => Promise<void>;
  reorderPresets: (presetIdsInOrder: string[]) => Promise<void>;
}

let sessionChannelCounter = 0;

export function useSessions(): UseSessionsReturn {
  const [sessions, setSessions] = useState<TimedSession[]>([]);
  const [presets, setPresets] = useState<TimerPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelId = useRef(`sessions-${++sessionChannelCounter}-${Date.now()}`);

  const fetch = useCallback(async () => {
    setLoading(true);
    const [sessionRes, presetRes, intervalRes] = await Promise.all([
      supabase
        .from('timed_sessions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(100),
      supabase
        .from('timer_presets')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true }),
      supabase
        .from('timer_preset_intervals')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true }),
    ]);

    if (sessionRes.error) {
      setError(sessionRes.error.message);
    } else {
      setSessions(sessionRes.data ?? []);
      setError(null);
    }

    if (!presetRes.error && !intervalRes.error) {
      const intervalMap = new Map<string, TimerPresetInterval[]>();
      (intervalRes.data ?? []).forEach((i: TimerPresetInterval) => {
        if (!intervalMap.has(i.preset_id)) intervalMap.set(i.preset_id, []);
        intervalMap.get(i.preset_id)!.push(i);
      });
      const hydrated = (presetRes.data ?? []).map((p: Omit<TimerPreset, 'intervals'>) => ({
        ...p,
        intervals: intervalMap.get(p.id) ?? [],
      }));
      setPresets(hydrated);
    } else {
      // If preset tables are not migrated yet, keep app usable.
      setPresets([]);
      if (presetRes.error && !sessionRes.error) setError(presetRes.error.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();

    const channel = supabase
      .channel(channelId.current)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'timed_sessions' }, fetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'timer_presets' }, fetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'timer_preset_intervals' }, fetch)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetch]);

  const createSessionStart = useCallback(async (
    input: {
      name: string;
      durationSeconds: number;
      sessionType?: 'simple' | 'preset';
      presetId?: string | null;
      details?: Record<string, unknown> | null;
    }
  ): Promise<TimedSession | null> => {
    const payload = {
      name: input.name,
      duration_seconds: input.durationSeconds,
      session_type: input.sessionType ?? 'simple',
      preset_id: input.presetId ?? null,
      details: input.details ?? null,
      started_at: new Date().toISOString(),
    };
    let { data, error } = await supabase
      .from('timed_sessions')
      .insert(payload)
      .select()
      .single();

    if (error) {
      // Backward-compat for old schema
      const fallback = await supabase
        .from('timed_sessions')
        .insert({
          name: input.name,
          duration_seconds: input.durationSeconds,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();
      data = fallback.data;
      error = fallback.error;
    }

    if (error) { setError(error.message); return null; }
    setSessions(prev => [data, ...prev]);
    return data;
  }, []);

  const finishSession = useCallback(async (
    id: string,
    input: {
      completedSeconds: number;
      isCompleted: boolean;
      isStoppedManually?: boolean;
      details?: Record<string, unknown> | null;
    }
  ) => {
    const endedAt = new Date().toISOString();
    setSessions(prev => prev.map(s => (
      s.id === id
        ? {
            ...s,
            ended_at: endedAt,
            completed_seconds: input.completedSeconds,
            is_completed: input.isCompleted,
            is_stopped_manually: !!input.isStoppedManually,
            details: input.details ?? s.details ?? null,
          }
        : s
    )));

    let { error } = await supabase.from('timed_sessions').update({
      ended_at: endedAt,
      completed_seconds: input.completedSeconds,
      is_completed: input.isCompleted,
      is_stopped_manually: !!input.isStoppedManually,
      details: input.details ?? null,
    }).eq('id', id);

    if (error) {
      // Backward-compat for old schema
      const fallback = await supabase.from('timed_sessions').update({ ended_at: endedAt }).eq('id', id);
      error = fallback.error;
    }

    if (error) { setError(error.message); fetch(); }
  }, [fetch]);

  const deleteSession = useCallback(async (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    const { error } = await supabase.from('timed_sessions').delete().eq('id', id);
    if (error) { setError(error.message); fetch(); }
  }, [fetch]);

  const createPreset = useCallback(async (input: {
    name: string;
    repeatCount: number;
    isInfinite: boolean;
    intervals: Array<{ label: string; duration_seconds: number; color: string }>;
  }): Promise<TimerPreset | null> => {
    const orderIndex = presets.length;
    const { data: preset, error: presetErr } = await supabase
      .from('timer_presets')
      .insert({
        name: input.name,
        repeat_count: input.repeatCount,
        is_infinite: input.isInfinite,
        order_index: orderIndex,
      })
      .select()
      .single();
    if (presetErr || !preset) {
      setError(presetErr?.message ?? 'Failed to create preset');
      return null;
    }

    const intervalRows = input.intervals.map((it, idx) => ({
      preset_id: preset.id,
      label: it.label,
      duration_seconds: it.duration_seconds,
      color: it.color,
      order_index: idx,
    }));
    if (intervalRows.length) {
      const { error: intervalErr } = await supabase.from('timer_preset_intervals').insert(intervalRows);
      if (intervalErr) setError(intervalErr.message);
    }
    await fetch();
    return {
      ...preset,
      intervals: [],
    } as TimerPreset;
  }, [fetch, presets.length]);

  const updatePreset = useCallback(async (id: string, input: {
    name: string;
    repeatCount: number;
    isInfinite: boolean;
    intervals: Array<{ label: string; duration_seconds: number; color: string }>;
  }) => {
    const { error: presetErr } = await supabase
      .from('timer_presets')
      .update({
        name: input.name,
        repeat_count: input.repeatCount,
        is_infinite: input.isInfinite,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (presetErr) {
      setError(presetErr.message);
      return;
    }

    const { error: delErr } = await supabase.from('timer_preset_intervals').delete().eq('preset_id', id);
    if (delErr) {
      setError(delErr.message);
      return;
    }

    const rows = input.intervals.map((it, idx) => ({
      preset_id: id,
      label: it.label,
      duration_seconds: it.duration_seconds,
      color: it.color,
      order_index: idx,
    }));
    if (rows.length) {
      const { error: insertErr } = await supabase.from('timer_preset_intervals').insert(rows);
      if (insertErr) setError(insertErr.message);
    }
    await fetch();
  }, [fetch]);

  const deletePreset = useCallback(async (id: string) => {
    const { error } = await supabase.from('timer_presets').delete().eq('id', id);
    if (error) setError(error.message);
    else await fetch();
  }, [fetch]);

  const reorderPresets = useCallback(async (presetIdsInOrder: string[]) => {
    if (!presetIdsInOrder.length) return;
    const updates = presetIdsInOrder.map((id, idx) =>
      supabase.from('timer_presets').update({ order_index: idx }).eq('id', id)
    );
    const results = await Promise.all(updates);
    const firstError = results.find(r => r.error)?.error;
    if (firstError) setError(firstError.message);
    await fetch();
  }, [fetch]);

  return {
    sessions,
    presets,
    loading,
    error,
    refresh: fetch,
    createSessionStart,
    finishSession,
    deleteSession,
    createPreset,
    updatePreset,
    deletePreset,
    reorderPresets,
  };
}
