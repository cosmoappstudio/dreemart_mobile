import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useCredits(userId: string | null) {
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();
    setCredits(data?.credits ?? 0);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    refetch().finally(() => setLoading(false));

    const channel = supabase
      .channel('credits-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const newCredits = (payload.new as { credits?: number }).credits;
          if (typeof newCredits === 'number') setCredits(newCredits);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refetch]);

  return { credits, loading, refetch };
}
