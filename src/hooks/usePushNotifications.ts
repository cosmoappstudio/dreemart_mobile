import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync(): Promise<string | null> {
  /** Şimdilik yalnızca iOS: token + izin yalnızca iPhone/iPad’de */
  if (Platform.OS !== 'ios') return null;
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
    if (finalStatus !== 'granted') return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    process.env.EAS_PROJECT_ID;
  if (!projectId) return null;

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId,
  });
  return tokenData.data ?? null;
}

export function usePushNotifications(userId: string | null) {
  const [token, setToken] = useState<string | null>(null);

  const registerAndSave = useCallback(async (): Promise<boolean> => {
    const pushToken = await registerForPushNotificationsAsync();
    if (!pushToken || !userId) return !!pushToken;
    setToken(pushToken);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ push_token: pushToken, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('Push token save error:', e);
      return false;
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    registerForPushNotificationsAsync().then((t) => t && setToken(t));
  }, [userId]);

  useEffect(() => {
    if (!token || !userId) return;
    supabase
      .from('profiles')
      .update({ push_token: token, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .then(({ error }) => error && console.warn('Push token auto-save error:', error));
  }, [token, userId]);

  return { token, registerAndSave };
}
