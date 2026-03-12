import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Artist } from '../types';

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function isProTier(tier: string | undefined): boolean {
  return tier === 'paid' || tier === 'pro';
}

type UseArtistsOptions = {
  preserveSortOrder?: boolean;
};

export function useArtists(
  userId: string | null,
  tier: string | undefined,
  options?: UseArtistsOptions
) {
  const { preserveSortOrder } = options ?? {};
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Artists fetch error:', error);
      setArtists([]);
      return;
    }

    const list = (data ?? []).map((a) => ({
      ...a,
      is_free: a.is_free ?? false,
      locked: !isProTier(tier) && !(a.is_free ?? false),
    })) as Artist[];

    if (preserveSortOrder) {
      setArtists(list);
    } else if (!isProTier(tier)) {
      const free = list.filter((a) => a.is_free);
      const locked = list.filter((a) => !a.is_free);
      setArtists([...shuffle(free), ...locked]);
    } else {
      setArtists(
        [...list].sort((a, b) =>
          (a.short_id ?? a.slug ?? '').localeCompare(b.short_id ?? b.slug ?? '')
        )
      );
    }
  }, [tier, preserveSortOrder]);

  useEffect(() => {
    refetch().finally(() => setLoading(false));
  }, [refetch]);

  return { artists, loading, refetch };
}
