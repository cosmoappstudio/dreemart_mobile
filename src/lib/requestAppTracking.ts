import * as TrackingTransparency from 'expo-tracking-transparency';
import { Platform } from 'react-native';

const FB_CONFIGURED = !!process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;

async function metaSettings() {
  const { Settings } = await import('react-native-fbsdk-next');
  return Settings;
}

/**
 * iOS: ATT diyaloğu + Meta (Facebook) SDK ile reklam takibi senkronu.
 * Android: ATT yok; bu çağrı yalnızca true döner (Meta ayarı onboarding ekranından yapılmaz).
 */
export async function requestAppTrackingThenSyncMeta(): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    return true;
  }

  try {
    const { status } =
      await TrackingTransparency.requestTrackingPermissionsAsync();
    const granted = status === 'granted';
    if (FB_CONFIGURED) {
      try {
        const Settings = await metaSettings();
        await Settings.setAdvertiserTrackingEnabled(granted);
      } catch (e) {
        console.warn('Meta setAdvertiserTrackingEnabled:', e);
      }
    }
    return granted;
  } catch (e) {
    console.warn('ATT request error:', e);
    return false;
  }
}

/** Kullanıcı izin diyaloğunu göstermeden reddeder (yalnızca iOS + Meta). */
export async function declineAppTrackingForMeta(): Promise<void> {
  if (Platform.OS !== 'ios' || !FB_CONFIGURED) return;
  try {
    const Settings = await metaSettings();
    await Settings.setAdvertiserTrackingEnabled(false);
  } catch (e) {
    console.warn('Meta decline tracking:', e);
  }
}
