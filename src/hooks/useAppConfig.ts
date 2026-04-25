import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type AppConfig = {
  support_url: string;
  terms_url: string;
  eula_url: string;
  /** Onboarding / paywall metinleri; `app_config.initial_free_credits` (tam sayı string) */
  initial_free_credits: number;
};

const DEFAULTS: AppConfig = {
  support_url: 'mailto:hello@aspiyas.com',
  terms_url: 'https://dreemart.com/terms',
  eula_url: 'https://dreemart.com/eula',
  initial_free_credits: 1,
};

const URL_KEYS = new Set(['support_url', 'terms_url', 'eula_url'] as const);

function parseInitialFreeCredits(raw: string | null | undefined): number | undefined {
  if (raw == null || raw === '') return undefined;
  const n = Number.parseInt(String(raw).trim(), 10);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.min(n, 99);
}

export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('app_config')
        .select('key, value');

      if (error) {
        console.warn('App config fetch error:', error);
        return;
      }

      const overrides: Partial<AppConfig> = {};
      for (const row of data ?? []) {
        if (row.key === 'initial_free_credits') {
          const n = parseInitialFreeCredits(row.value);
          if (n !== undefined) {
            overrides.initial_free_credits = n;
          }
          continue;
        }
        if (URL_KEYS.has(row.key as 'support_url' | 'terms_url' | 'eula_url') && row.value) {
          overrides[row.key as 'support_url' | 'terms_url' | 'eula_url'] = row.value;
        }
      }
      setConfig((prev) => ({ ...prev, ...overrides }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return { config, loading, refetch: fetchConfig };
}
