import { useEffect } from 'react';
import { registerForPushNotifications } from '../lib/push';

export function PushNotificationSetup({ userId }: { userId: string | null }) {
  useEffect(() => {
    if (userId) {
      registerForPushNotifications(userId);
    }
  }, [userId]);

  return null;
}
