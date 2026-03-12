export type Artist = {
  id: string;
  slug: string;
  short_id?: string;
  name: string;
  style_description: string;
  image_url: string;
  is_active: boolean;
  is_free: boolean;
  sort_order: number;
  locked?: boolean;
};

export type Dream = {
  id: string;
  user_id: string;
  prompt: string;
  artist_id: string;
  image_url: string;
  interpretation: string;
  moderation_status: string;
  created_at: string;
  artists?: { name: string } | null;
};

export type Profile = {
  id: string;
  credits: number;
  tier: 'free' | 'paid' | 'pro';
  username: string;
  language: string;
  country_code: string | null;
};

export type PaywallSource =
  | 'onboarding'
  | 'profile'
  | 'no_credit'
  | 'locked_artist';
