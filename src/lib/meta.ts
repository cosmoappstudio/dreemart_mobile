import { AppEventsLogger } from 'react-native-fbsdk-next';

const META_ENABLED =
  !!process.env.EXPO_PUBLIC_META_APP_ID &&
  process.env.EXPO_PUBLIC_META_APP_ID !== '<meta_app_id>';

export function initMeta() {
  if (!META_ENABLED) return;
  // Meta SDK ayarları app.config.js plugin'inde yapılıyor
}

export function logMetaEvent(eventName: string, params?: Record<string, string | number>) {
  if (!META_ENABLED) return;
  try {
    if (params) {
      AppEventsLogger.logEvent(eventName, params);
    } else {
      AppEventsLogger.logEvent(eventName);
    }
  } catch (e) {
    console.warn('Meta log:', e);
  }
}
