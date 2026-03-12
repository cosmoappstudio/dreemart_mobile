import { supabase } from './supabase';

export async function generateDream(params: {
  userId: string;
  prompt: string;
  artistId: string;
}) {
  const { data, error } = await supabase.functions.invoke('generate-dream', {
    body: {
      user_id: params.userId,
      prompt: params.prompt,
      artist_id: params.artistId,
    },
  });

  if (error) throw error;
  if (data?.error === 'insufficient_credits')
    throw new Error('insufficient_credits');
  if (data?.error === 'artist_not_available_for_free_users')
    throw new Error('artist_locked');

  return data as { image_url: string; interpretation: string; dream_id: string };
}
