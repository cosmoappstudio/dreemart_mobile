import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';
import { setLanguage, SUPPORTED_LANGUAGES } from '../i18n';
import type { SupportedLanguage } from '../i18n';

type ProfileContextType = {
  profile: Profile | null;
  loading: boolean;
  refetch: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId: string | null;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('profiles')
      .select('id, credits, tier, username, language, country_code')
      .eq('id', userId)
      .single();
    setProfile(data as Profile | null);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    refetch().finally(() => setLoading(false));

    const channel = supabase
      .channel('profile-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        () => refetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refetch]);

  useEffect(() => {
    const lang = profile?.language;
    if (lang && SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)) {
      setLanguage(lang as SupportedLanguage);
    }
  }, [profile?.language]);

  return (
    <ProfileContext.Provider value={{ profile, loading, refetch }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfileContext() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfileContext must be used within a ProfileProvider');
  }
  return context;
}
