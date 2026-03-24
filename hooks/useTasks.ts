import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Task, TaskCompletion, TaskWithStatus, Category } from '@/lib/types';
import { toDateKey } from '@/lib/dateUtils';

interface UseTasksReturn {
  tasks: TaskWithStatus[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addTask: (data: Omit<Task, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateTask: (id: string, data: Partial<Omit<Task, 'id' | 'user_id' | 'created_at'>>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleComplete: (taskId: string, isCompleted: boolean) => Promise<void>;
}

export function useTasks(date: Date = new Date()): UseTasksReturn {
  const [tasks, setTasks] = useState<TaskWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dateKey = toDateKey(date);

  const fetch = useCallback(async () => {
    setLoading(true);

    // Fetch tasks and categories in parallel
    const [taskRes, catRes, compRes] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at', { ascending: true }),
      supabase.from('categories').select('*'),
      supabase.from('task_completions').select('*').eq('completed_date', dateKey),
    ]);

    if (taskRes.error) { setError(taskRes.error.message); setLoading(false); return; }

    const categoryMap: Record<string, Category> = {};
    (catRes.data ?? []).forEach((c: Category) => { categoryMap[c.id] = c; });

    const completedIds = new Set((compRes.data ?? []).map((c: TaskCompletion) => c.task_id));

    // Filter tasks that apply to this day
    const dayOfWeek = date.getDay();
    const hydrated: TaskWithStatus[] = (taskRes.data ?? [])
      .filter((t: Task) => {
        if (t.repeat_schedule === 'none') return true; // always show
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
      }));

    setTasks(hydrated);
    setError(null);
    setLoading(false);
  }, [dateKey, date]);

  useEffect(() => {
    fetch();

    const channel = supabase
      .channel('tasks-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_completions' }, fetch)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetch]);

  const addTask = useCallback(async (data: Omit<Task, 'id' | 'user_id' | 'created_at'>) => {
    const { error } = await supabase.from('tasks').insert(data);
    if (error) setError(error.message);
    else fetch();
  }, [fetch]);

  const updateTask = useCallback(async (
    id: string,
    data: Partial<Omit<Task, 'id' | 'user_id' | 'created_at'>>
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
    // Optimistic toggle
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

  return { tasks, loading, error, refresh: fetch, addTask, updateTask, deleteTask, toggleComplete };
}
