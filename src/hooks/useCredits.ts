import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { REVENUECAT_ENABLED, fetchVirtualCurrencyBalance } from '../lib/revenuecat';
import { useDreemartRevenueCat } from '../contexts/dreemart-revenuecat-context';

/**
 * Kredi bakiyesi: RevenueCat açıksa virtual currency (CRD), değilse Supabase `profiles.credits`
 */
export function useCredits(userId: string | null) {
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const { virtualCurrencyVersion, isInitialized } = useDreemartRevenueCat();

  const refetch = useCallback(async () => {
    if (!userId) return;
    if (REVENUECAT_ENABLED) {
      const b = await fetchVirtualCurrencyBalance();
      setCredits(b);
      return;
    }
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
    if (REVENUECAT_ENABLED && !isInitialized) {
      return;
    }

    refetch().finally(() => setLoading(false));
  }, [userId, virtualCurrencyVersion, isInitialized, refetch]);

  useEffect(() => {
    if (!userId || REVENUECAT_ENABLED) return;

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
  }, [userId]);

  return { credits, loading, refetch };
}
