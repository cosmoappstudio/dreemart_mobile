import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Dream } from '../types';

export function useDreams(userId: string | null) {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('dreams')
      .select(`
        *,
        artists (name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      const { data: fallback } = await supabase
        .from('dreams')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      setDreams((fallback ?? []) as Dream[]);
      return;
    }
    setDreams((data ?? []) as Dream[]);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    refetch().finally(() => setLoading(false));

    const channel = supabase
      .channel('dreams-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dreams',
          filter: `user_id=eq.${userId}`,
        },
        () => refetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refetch]);

  return { dreams, loading, refetch };
}
