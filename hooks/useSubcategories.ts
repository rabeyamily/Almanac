import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Subcategory } from '@/lib/types';

interface UseSubcategoriesReturn {
  subcategories: Subcategory[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addSubcategory: (data: { category_id: string; name: string; color?: string | null }) => Promise<Subcategory | null>;
  updateSubcategory: (id: string, data: Partial<Pick<Subcategory, 'name' | 'color'>>) => Promise<void>;
  deleteSubcategory: (id: string) => Promise<void>;
  getForCategory: (categoryId: string) => Subcategory[];
}

let channelCounter = 0;

export function useSubcategories(): UseSubcategoriesReturn {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelId = useRef(`subcategories-${++channelCounter}-${Date.now()}`);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('subcategories')
      .select('*')
      .order('created_at', { ascending: true });

    if (err) setError(err.message);
    else { setSubcategories(data ?? []); setError(null); }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel(channelId.current)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const addSubcategory = useCallback(async (
    data: { category_id: string; name: string; color?: string | null }
  ): Promise<Subcategory | null> => {
    const { data: inserted, error: err } = await supabase
      .from('subcategories')
      .insert(data)
      .select()
      .single();
    if (err) { setError(err.message); return null; }
    setSubcategories(prev => [...prev, inserted]);
    return inserted;
  }, []);

  const updateSubcategory = useCallback(async (
    id: string, data: Partial<Pick<Subcategory, 'name' | 'color'>>
  ) => {
    setSubcategories(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    const { error: err } = await supabase.from('subcategories').update(data).eq('id', id);
    if (err) { setError(err.message); fetchData(); }
  }, [fetchData]);

  const deleteSubcategory = useCallback(async (id: string) => {
    setSubcategories(prev => prev.filter(s => s.id !== id));
    const { error: err } = await supabase.from('subcategories').delete().eq('id', id);
    if (err) { setError(err.message); fetchData(); }
  }, [fetchData]);

  const getForCategory = useCallback(
    (categoryId: string) => subcategories.filter(s => s.category_id === categoryId),
    [subcategories]
  );

  return { subcategories, loading, error, refresh: fetchData, addSubcategory, updateSubcategory, deleteSubcategory, getForCategory };
}
