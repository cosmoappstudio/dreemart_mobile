import { init, setUserId, track } from '@amplitude/analytics-react-native';
import type { PaywallSource } from '../types';

export function initAmplitude() {
  try {
    const key = process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY;
    if (key) {
      init(key, undefined, {
        trackingOptions: { ipAddress: false },
      });
    }
  } catch (e) {
    console.warn('Amplitude init error:', e);
  }
}

export function setAmplitudeUserId(userId: string) {
  try {
    setUserId(userId);
  } catch (e) {
    console.warn('Amplitude setUserId error:', e);
  }
}

function safeTrack(name: string, props?: Record<string, unknown>) {
  try {
    track(name, props);
  } catch {
    /* Amplitude may fail in Expo Go */
  }
}

export const Analytics = {
  appOpened: () => safeTrack('app_opened'),
  onboardingCompleted: () => safeTrack('onboarding_completed'),
  dreamSubmitted: (artistId: string) =>
    safeTrack('dream_submitted', { artist_id: artistId }),
  dreamGenerated: (dreamId: string) =>
    safeTrack('dream_generated', { dream_id: dreamId }),
  dreamSaved: () => safeTrack('dream_saved'),
  paywallViewed: (source: PaywallSource) =>
    safeTrack('paywall_viewed', { source }),
  purchaseInitiated: (packageId: string) =>
    safeTrack('purchase_initiated', { package_id: packageId }),
  purchaseCompleted: (packageId: string, credits: number) =>
    safeTrack('purchase_completed', { package_id: packageId, credits }),
  purchaseRestored: () => safeTrack('purchase_restored'),
};
