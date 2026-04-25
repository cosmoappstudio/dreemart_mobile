import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

/** RevenueCat dashboard’daki virtual currency code (örn. CRD) */
export const VIRTUAL_CURRENCY_CODE =
  process.env.EXPO_PUBLIC_REVENUECAT_VIRTUAL_CURRENCY_CODE || 'CRD';

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
const PLACEHOLDER = '<revenuecat';

export const REVENUECAT_ENABLED =
  (Platform.OS === 'ios' && IOS_KEY && !IOS_KEY.startsWith(PLACEHOLDER)) ||
  (Platform.OS === 'android' && ANDROID_KEY && !ANDROID_KEY.startsWith(PLACEHOLDER));

function getApiKey(): string {
  if (Platform.OS === 'ios') return IOS_KEY || '';
  return ANDROID_KEY || IOS_KEY || '';
}

let purchasesSdkConfigured = false;

/**
 * SDK bir kez configure; aynı oturumda kullanıcı değişince `Purchases.logIn` (initRef/tek sefer hatasını önler).
 */
export async function ensurePurchasesForUser(userId: string) {
  if (!REVENUECAT_ENABLED) return;
  Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
  if (!purchasesSdkConfigured) {
    Purchases.configure({
      apiKey: getApiKey(),
      appUserID: userId,
    });
    purchasesSdkConfigured = true;
    return;
  }
  try {
    await Purchases.logIn(userId);
  } catch (e) {
    console.warn('RevenueCat logIn:', e);
  }
}

/** Oturum kapandığında (anon) — sonraki kullanıcı için `logIn` temiz çalışsın. */
export async function logOutRevenueCatIfReady() {
  if (!REVENUECAT_ENABLED || !purchasesSdkConfigured) return;
  try {
    await Purchases.logOut();
  } catch (e) {
    console.warn('RevenueCat logOut:', e);
  }
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

/** App Store / RevenueCat ürün id’leri ile eşleşme (dreemart_*_credit_pack) */
const IAP_CREDIT_RULES: { match: string; credits: number }[] = [
  { match: 'mega', credits: 100 },
  { match: 'diamond', credits: 50 },
  { match: 'dreamer', credits: 15 },
  { match: 'mini', credits: 5 },
];

/**
 * `identifier` = RevenueCat package id veya `product_identifier` (Store product id)
 */
export function creditsForIapProductId(
  ...identifiers: (string | undefined)[]
): number {
  for (const raw of identifiers) {
    if (!raw) continue;
    const id = raw.toLowerCase();
    for (const { match, credits } of IAP_CREDIT_RULES) {
      if (id.includes(match)) return credits;
    }
  }
  return 0;
}

/** Paywall’da bakiye: RevenueCat virtual currency (satın alma kredileri burada) */
export async function fetchVirtualCurrencyBalance(): Promise<number> {
  if (!REVENUECAT_ENABLED) return 0;
  try {
    const vc = await Purchases.getVirtualCurrencies();
    return vc.all[VIRTUAL_CURRENCY_CODE]?.balance ?? 0;
  } catch (e) {
    console.warn('Virtual currency okunamadı:', e);
    return 0;
  }
}
