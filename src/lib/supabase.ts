import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export async function initAnonymousAuth(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user?.id) return session.user.id;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;

  const userId = data.user!.id;

  const { data: existing, error: selectError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (selectError) {
    console.warn('Profile select error:', selectError);
  }

  if (!existing) {
    const now = new Date().toISOString();
    const { error: insertError } = await supabase.from('profiles').insert({
      id: userId,
      credits: 1,
      tier: 'free',
      role: 'user',
      language: 'tr',
      username: `rüyacı_${userId.slice(0, 8)}`,
      created_at: now,
      updated_at: now,
    });

    if (insertError) {
      console.error('Profile insert error:', insertError);
      throw insertError;
    }
  }

  return userId;
}
