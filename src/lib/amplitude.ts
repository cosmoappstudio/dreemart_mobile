import { init, track } from '@amplitude/analytics-react-native';
import type { PaywallSource } from '../types';

export function initAmplitude() {
  const key = process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY;
  if (key) {
    init(key, undefined, {
      trackingOptions: { ipAddress: false },
    });
  }
}

export const Analytics = {
  appOpened: () => track('app_opened'),
  onboardingCompleted: () => track('onboarding_completed'),
  dreamSubmitted: (artistId: string) =>
    track('dream_submitted', { artist_id: artistId }),
  dreamGenerated: (dreamId: string) =>
    track('dream_generated', { dream_id: dreamId }),
  dreamSaved: () => track('dream_saved'),
  paywallViewed: (source: PaywallSource) =>
    track('paywall_viewed', { source }),
  purchaseInitiated: (packageId: string) =>
    track('purchase_initiated', { package_id: packageId }),
  purchaseCompleted: (packageId: string, credits: number) =>
    track('purchase_completed', { package_id: packageId, credits }),
  purchaseRestored: () => track('purchase_restored'),
};
