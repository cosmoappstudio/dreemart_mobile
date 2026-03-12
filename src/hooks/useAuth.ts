import { useEffect, useState } from 'react';
import { initAnonymousAuth } from '../lib/supabase';

export function useAuth() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    initAnonymousAuth()
      .then((id) => {
        if (mounted) setUserId(id);
      })
      .catch((err) => {
        console.error('Auth init error:', err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { userId, loading };
}
