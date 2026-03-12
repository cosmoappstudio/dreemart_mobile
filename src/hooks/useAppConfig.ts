import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type AppConfig = {
  support_url: string;
  terms_url: string;
  eula_url: string;
};

const DEFAULTS: AppConfig = {
  support_url: 'mailto:hello@aspiyas.com',
  terms_url: 'https://dreemart.com/terms',
  eula_url: 'https://dreemart.com/eula',
};

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
        if (row.key in DEFAULTS && row.value) {
          overrides[row.key as keyof AppConfig] = row.value;
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
