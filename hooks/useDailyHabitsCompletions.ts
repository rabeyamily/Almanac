import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Task } from '@/lib/types';
import { toDateKey } from '@/lib/dateUtils';
import { Theme } from '@/constants/theme';
import { vintageMixWithPaper } from '@/lib/colorUtils';

export interface TrackerHabit {
  taskId: string;
  name: string;
  icon: string;
  color: string;
}

interface CategoryMini {
  id: string;
  icon: string;
  color: string;
}

interface SubcategoryMini {
  id: string;
  category_id: string;
  color: string | null;
}

interface UseDailyHabitsCompletionsReturn {
  habits: TrackerHabit[];
  completionByTask: Record<string, Set<string>>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useDailyHabitsCompletions(startDate: Date, endDate: Date): UseDailyHabitsCompletionsReturn {
  const [habits, setHabits] = useState<TrackerHabit[]>([]);
  const [completionByTask, setCompletionByTask] = useState<Record<string, Set<string>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const startKey = toDateKey(startDate);
  const endKey = toDateKey(endDate);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1) Load all categories + subcategories for icon/color mapping.
      const [catRes, subRes] = await Promise.all([
        supabase.from('categories').select('id,icon,color').order('created_at', { ascending: true }),
        supabase.from('subcategories').select('id,category_id,color').order('created_at', { ascending: true }),
      ]);

      const categoryMap: Record<string, CategoryMini> = {};
      (catRes.data ?? []).forEach((c: any) => {
        if (!c?.id) return;
        categoryMap[String(c.id)] = {
          id: String(c.id),
          icon: String(c.icon ?? '★'),
          color: String(c.color ?? Theme.colors.muted),
        };
      });

      const subcategoryMap: Record<string, SubcategoryMini> = {};
      (subRes.data ?? []).forEach((s: any) => {
        if (!s?.id) return;
        subcategoryMap[String(s.id)] = {
          id: String(s.id),
          category_id: String(s.category_id ?? ''),
          color: typeof s.color === 'string' ? s.color : null,
        };
      });

      // 2) Load tasks marked as DAILY recurrence.
      const tasksRes = await supabase
        .from('tasks')
        .select('id,name,tracker_nickname,category_id,subcategory_id,repeat_schedule,tracker_enabled,order_index')
        .eq('repeat_schedule', 'daily')
        .eq('tracker_enabled', true)
        .order('order_index', { ascending: true });

      // If the migration hasn't been applied yet, Supabase will 400 on unknown columns.
      // In that case, fall back to showing all DAILY tasks (nickname defaults to name).
      let tasks: Array<Pick<Task, 'id' | 'name' | 'tracker_nickname' | 'category_id' | 'subcategory_id'>>;
      if (tasksRes.error) {
        const msg = tasksRes.error.message ?? '';
        const missingTrackerCols = msg.toLowerCase().includes('tracker_enabled') || msg.toLowerCase().includes('tracker_nickname');
        if (!missingTrackerCols) throw new Error(msg || 'Failed to load tracker tasks');

        const fallbackRes = await supabase
          .from('tasks')
          .select('id,name,category_id,subcategory_id,repeat_schedule,order_index')
          .eq('repeat_schedule', 'daily')
          .order('order_index', { ascending: true });

        tasks = (fallbackRes.data ?? []) as Array<Pick<Task, 'id' | 'name' | 'tracker_nickname' | 'category_id' | 'subcategory_id'>>;
      } else {
        tasks = (tasksRes.data ?? []) as Array<Pick<Task, 'id' | 'name' | 'tracker_nickname' | 'category_id' | 'subcategory_id'>>;
      }

      const mappedHabits: TrackerHabit[] = tasks.map(t => {
        const cat = t.category_id ? categoryMap[String(t.category_id)] : undefined;
        const sub = t.subcategory_id ? subcategoryMap[String(t.subcategory_id)] : undefined;

        const icon = cat?.icon ?? '◆';
        const baseColor = sub?.color ?? cat?.color ?? Theme.colors.muted;
        // Desaturate slightly so “filled” squares feel vintage.
        const color = vintageMixWithPaper(baseColor, Theme.colors.paper, 0.22);

        return {
          taskId: t.id,
          name: (t.tracker_nickname && t.tracker_nickname.trim()) ? t.tracker_nickname.trim() : t.name,
          icon,
          color,
        };
      });

      setHabits(mappedHabits);

      // 3) Load completion history for the given date span.
      const taskIds = mappedHabits.map(h => h.taskId);
      if (taskIds.length === 0) {
        setCompletionByTask({});
        setLoading(false);
        return;
      }

      const compRes = await supabase
        .from('task_completions')
        .select('task_id,completed_date')
        .in('task_id', taskIds)
        .gte('completed_date', startKey)
        .lte('completed_date', endKey);

      const map: Record<string, Set<string>> = {};
      taskIds.forEach(id => { map[id] = new Set(); });
      (compRes.data ?? []).forEach((row: any) => {
        const taskId = String(row.task_id);
        const date = String(row.completed_date);
        if (!map[taskId]) map[taskId] = new Set();
        map[taskId].add(date);
      });

      setCompletionByTask(map);
      setLoading(false);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load tracker data');
      setLoading(false);
    }
  }, [endKey, startKey]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return useMemo(
    () => ({ habits, completionByTask, loading, error, refresh }),
    [habits, completionByTask, loading, error, refresh]
  );
}

