import Purchases, { LOG_LEVEL } from 'react-native-purchases';

const REVENUECAT_ENABLED =
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY &&
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY !== '<revenuecat_ios_key>';

export function initRevenueCat(userId: string) {
  if (!REVENUECAT_ENABLED) return;
  Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
  Purchases.configure({
    apiKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY!,
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
