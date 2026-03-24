import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Task, TaskCompletion, TaskWithStatus, Category, Subcategory } from '@/lib/types';
import { toDateKey } from '@/lib/dateUtils';

let taskChannelCounter = 0;

interface UseTasksReturn {
  tasks: TaskWithStatus[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addTask: (data: Omit<Task, 'id' | 'user_id' | 'created_at'>) => Promise<boolean>;
  updateTask: (id: string, data: Partial<Omit<Task, 'id' | 'user_id' | 'created_at'>>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleComplete: (taskId: string, isCompleted: boolean) => Promise<void>;
  toggleHighlight: (taskId: string, highlighted: boolean) => Promise<void>;
}

export function useTasks(date?: Date): UseTasksReturn {
  const [tasks, setTasks] = useState<TaskWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelId = useRef(`tasks-${++taskChannelCounter}-${Date.now()}`);

  const activeDate = date ?? new Date();
  const dateKey = toDateKey(activeDate);
  const dayOfWeek = activeDate.getDay();

  const fetch = useCallback(async () => {
    setLoading(true);

    const [taskRes, catRes, subRes, compRes] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at', { ascending: true }),
      supabase.from('categories').select('*'),
      supabase.from('subcategories').select('*'),
      supabase.from('task_completions').select('*').eq('completed_date', dateKey),
    ]);

    if (taskRes.error) { setError(taskRes.error.message); setLoading(false); return; }

    const categoryMap: Record<string, Category> = {};
    (catRes.data ?? []).forEach((c: Category) => { categoryMap[c.id] = c; });

    const subMap: Record<string, Subcategory> = {};
    (subRes.data ?? []).forEach((s: Subcategory) => { subMap[s.id] = s; });

    const completedIds = new Set((compRes.data ?? []).map((c: TaskCompletion) => c.task_id));

    const hydrated: TaskWithStatus[] = (taskRes.data ?? [])
      .filter((t: Task) => {
        if (t.repeat_schedule === 'none') return true;
        if (t.repeat_schedule === 'daily') return true;
        if (t.repeat_schedule === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
        if (t.repeat_schedule === 'weekends') return dayOfWeek === 0 || dayOfWeek === 6;
        if (t.repeat_schedule === 'custom') return t.custom_days?.includes(dayOfWeek) ?? false;
        return true;
      })
      .map((t: Task) => ({
        ...t,
        is_completed: completedIds.has(t.id),
        category: t.category_id ? categoryMap[t.category_id] ?? null : null,
        subcategory: t.subcategory_id ? subMap[t.subcategory_id] ?? null : null,
      }));

    setTasks(hydrated);
    setError(null);
    setLoading(false);
  }, [dateKey, dayOfWeek]);

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel(channelId.current)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_completions' }, fetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories' }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch]);

  const addTask = useCallback(async (data: Omit<Task, 'id' | 'user_id' | 'created_at'>): Promise<boolean> => {
    const fullPayload: Record<string, unknown> = { ...data };
    const noHighlightPayload: Record<string, unknown> = { ...fullPayload };
    delete noHighlightPayload.highlighted;
    const legacyPayload: Record<string, unknown> = { ...noHighlightPayload };
    delete legacyPayload.rich_text_name;
    delete legacyPayload.subcategory_id;

    // Try progressively older payloads so insert still works if migration is partial.
    const attempts = [fullPayload, noHighlightPayload, legacyPayload];
    let lastError: string | null = null;

    for (let i = 0; i < attempts.length; i += 1) {
      const { error } = await supabase.from('tasks').insert(attempts[i]);
      if (!error) {
        if (i > 0) {
          setError('Saved task using legacy schema. Run migration_002 to enable subcategories, rich text, and pinning.');
        } else {
          setError(null);
        }
        await fetch();
        return true;
      }
      lastError = error.message;
    }

    setError(lastError ?? 'Failed to save task');
    return false;
  }, [fetch]);

  const updateTask = useCallback(async (
    id: string, data: Partial<Omit<Task, 'id' | 'user_id' | 'created_at'>>
  ) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...data } : t)));
    const { error } = await supabase.from('tasks').update(data).eq('id', id);
    if (error) { setError(error.message); fetch(); }
  }, [fetch]);

  const deleteTask = useCallback(async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) { setError(error.message); fetch(); }
  }, [fetch]);

  const toggleComplete = useCallback(async (taskId: string, isCompleted: boolean) => {
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, is_completed: isCompleted } : t)));

    if (isCompleted) {
      const { error } = await supabase.from('task_completions').insert({
        task_id: taskId,
        completed_date: dateKey,
      });
      if (error) {
        setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, is_completed: false } : t)));
        setError(error.message);
      }
    } else {
      const { error } = await supabase
        .from('task_completions')
        .delete()
        .eq('task_id', taskId)
        .eq('completed_date', dateKey);
      if (error) {
        setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, is_completed: true } : t)));
        setError(error.message);
      }
    }
  }, [dateKey]);

  const toggleHighlight = useCallback(async (taskId: string, highlighted: boolean) => {
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, highlighted } : t)));
    const { error } = await supabase.from('tasks').update({ highlighted }).eq('id', taskId);
    if (error) {
      setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, highlighted: !highlighted } : t)));
      setError(error.message);
    }
  }, []);

  return { tasks, loading, error, refresh: fetch, addTask, updateTask, deleteTask, toggleComplete, toggleHighlight };
}
