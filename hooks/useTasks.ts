import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Task, TaskCompletion, TaskWithStatus, Category, Subcategory } from '@/lib/types';
import { toDateKey } from '@/lib/dateUtils';
import { resyncAllReminderNotifications } from '@/lib/notifications';

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
  reorderTasks: (taskIdsInOrder: string[]) => Promise<void>;
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

    let taskRes = await supabase
      .from('tasks')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });

    if (taskRes.error && taskRes.error.message.toLowerCase().includes('order_index')) {
      taskRes = await supabase.from('tasks').select('*').order('created_at', { ascending: true });
    }

    const [catRes, subRes, compRes] = await Promise.all([
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
        order_index: typeof t.order_index === 'number' ? t.order_index : Number.MAX_SAFE_INTEGER,
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
    const nextOrderIndex = Math.min(
      2147483647,
      Math.max(0, ...tasks.map(t => (typeof t.order_index === 'number' ? t.order_index : 0))) + 1
    );

    const fullPayload: Record<string, unknown> = { ...data, order_index: nextOrderIndex };
    const noHighlightPayload: Record<string, unknown> = { ...fullPayload };
    delete noHighlightPayload.highlighted;
    const noReminderPayload: Record<string, unknown> = { ...noHighlightPayload };
    delete noReminderPayload.reminder_settings;
    const noOrderPayload: Record<string, unknown> = { ...noReminderPayload };
    delete noOrderPayload.order_index;
    const legacyPayload: Record<string, unknown> = { ...noOrderPayload };
    delete legacyPayload.rich_text_name;
    delete legacyPayload.subcategory_id;
    const minimalPayload: Record<string, unknown> = {
      name: data.name,
      repeat_schedule: data.repeat_schedule ?? 'daily',
      custom_days: null,
      scheduled_time: null,
      category_id: null,
    };

    // Try progressively older payloads so insert still works if migration is partial.
    const attempts = [fullPayload, noHighlightPayload, noReminderPayload, noOrderPayload, legacyPayload, minimalPayload];
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
        void resyncAllReminderNotifications();
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
    else if (Object.prototype.hasOwnProperty.call(data, 'reminder_settings')) void resyncAllReminderNotifications();
  }, [fetch]);

  const deleteTask = useCallback(async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) { setError(error.message); fetch(); }
    else void resyncAllReminderNotifications();
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

  const reorderTasks = useCallback(async (taskIdsInOrder: string[]) => {
    if (!taskIdsInOrder.length) return;

    const localOrderMap = new Map(taskIdsInOrder.map((id, idx) => [id, idx]));
    setTasks(prev => {
      const updated = prev.map(t => {
        const idx = localOrderMap.get(t.id);
        return typeof idx === 'number' ? { ...t, order_index: idx } : t;
      });
      return [...updated].sort((a, b) => a.order_index - b.order_index);
    });

    const updates = taskIdsInOrder.map((id, idx) =>
      supabase.from('tasks').update({ order_index: idx }).eq('id', id)
    );
    const results = await Promise.all(updates);
    const firstError = results.find(r => r.error)?.error;
    if (firstError) {
      setError(firstError.message);
      await fetch();
    }
  }, [fetch]);

  return { tasks, loading, error, refresh: fetch, addTask, updateTask, deleteTask, toggleComplete, toggleHighlight, reorderTasks };
}
