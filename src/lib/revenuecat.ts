import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

const REVENUECAT_IOS_ENABLED =
  IOS_KEY && IOS_KEY !== '<revenuecat_ios_key>';
const REVENUECAT_ANDROID_ENABLED =
  ANDROID_KEY && ANDROID_KEY !== '<revenuecat_android_key>';

const REVENUECAT_ENABLED =
  (Platform.OS === 'ios' && REVENUECAT_IOS_ENABLED) ||
  (Platform.OS === 'android' && REVENUECAT_ANDROID_ENABLED);

function getApiKey(): string | undefined {
  if (Platform.OS === 'ios') return IOS_KEY;
  if (Platform.OS === 'android') return ANDROID_KEY;
  return IOS_KEY ?? ANDROID_KEY;
}

export function initRevenueCat(userId: string) {
  const apiKey = getApiKey();
  if (!apiKey || !REVENUECAT_ENABLED) return;
  Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
  Purchases.configure({
    apiKey,
    appUserID: userId,
  });
}

export async function getOfferings() {
  if (!REVENUECAT_ENABLED) return [];
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages ?? [];
}

export async function purchasePackage(pkg: Parameters<typeof Purchases.purchasePackage>[0]) {
  if (!REVENUECAT_ENABLED) throw new Error('RevenueCat not configured');
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases() {
  if (!REVENUECAT_ENABLED) return { nonSubscriptionTransactions: {}, entitlements: { active: {} } } as Awaited<ReturnType<typeof Purchases.restorePurchases>>;
  return await Purchases.restorePurchases();
}

export const CREDIT_MAP: Record<string, number> = {
  starter: 5,
  popular: 15,
  pro: 40,
};
