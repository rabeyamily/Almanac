import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Category } from '@/lib/types';
import { resyncAllReminderNotifications } from '@/lib/notifications';

interface UseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addCategory: (data: Omit<Category, 'id' | 'user_id' | 'created_at'>) => Promise<Category | null>;
  updateCategory: (id: string, data: Partial<Pick<Category, 'name' | 'icon' | 'color' | 'reminder_settings'>>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

let categoryChannelCounter = 0;

export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelId = useRef(`categories-${++categoryChannelCounter}-${Date.now()}`);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setCategories(data ?? []);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();

    // Real-time subscription
    const channel = supabase
      .channel(channelId.current)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, fetch)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetch]);

  const addCategory = useCallback(async (
    data: Omit<Category, 'id' | 'user_id' | 'created_at'>
  ): Promise<Category | null> => {
    // Optimistic insert
    const tempId = `temp-${Date.now()}`;
    const tempItem: Category = {
      id: tempId,
      user_id: '',
      created_at: new Date().toISOString(),
      ...data,
    };
    setCategories(prev => [...prev, tempItem]);

    const { data: inserted, error } = await supabase
      .from('categories')
      .insert(data)
      .select()
      .single();

    if (error) {
      setCategories(prev => prev.filter(c => c.id !== tempId));
      setError(error.message);
      return null;
    }
    setCategories(prev => prev.map(c => (c.id === tempId ? inserted : c)));
    void resyncAllReminderNotifications();
    return inserted;
  }, []);

  const updateCategory = useCallback(async (
    id: string,
    data: Partial<Pick<Category, 'name' | 'icon' | 'color' | 'reminder_settings'>>
  ) => {
    // Optimistic update
    setCategories(prev => prev.map(c => (c.id === id ? { ...c, ...data } : c)));

    const { error } = await supabase.from('categories').update(data).eq('id', id);
    if (error) {
      setError(error.message);
      fetch();
    } else if (Object.prototype.hasOwnProperty.call(data, 'reminder_settings')) {
      void resyncAllReminderNotifications();
    }
  }, [fetch]);

  const deleteCategory = useCallback(async (id: string) => {
    // Optimistic delete
    setCategories(prev => prev.filter(c => c.id !== id));

    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
      setError(error.message);
      fetch();
    } else {
      void resyncAllReminderNotifications();
    }
  }, [fetch]);

  return { categories, loading, error, refresh: fetch, addCategory, updateCategory, deleteCategory };
}
