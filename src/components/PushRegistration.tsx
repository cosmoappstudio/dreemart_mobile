import { usePushNotifications } from '../hooks/usePushNotifications';

/** Push token'ı app açılışında kaydetmek için - userId ile mount edilmeli */
export function PushRegistration({ userId }: { userId: string | null }) {
  usePushNotifications(userId);
  return null;
}
