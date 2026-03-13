/** Turuncu / Mor / Beyaz uyumlu palet */
export const colors = {
  background: '#0D0A14',
  surface: '#15101F',
  surfaceLight: '#1E1528',
  primary: '#7C3AED',
  primaryLight: '#A855F7',
  accent: '#F97316',
  accentLight: '#FB923C',
  text: '#FFFFFF',
  textMuted: '#C4B5FD',
  border: '#2E1F3D',
  error: '#EF4444',
  success: '#10B981',
  locked: '#374151',
};

export const gradients = {
  background: ['#0D0A14', '#1A0F28', '#0D0A14'] as const,
  primary: ['#7C3AED', '#A855F7'] as const,
  accent: ['#F97316', '#FB923C'] as const,
  primaryAccent: ['#7C3AED', '#F97316'] as const,
  card: ['#15101F', '#1E1528'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
