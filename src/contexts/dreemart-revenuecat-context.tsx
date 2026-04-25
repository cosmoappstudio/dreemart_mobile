import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import Purchases from 'react-native-purchases';
import type { PurchasesPackage } from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import {
  REVENUECAT_ENABLED,
  ensurePurchasesForUser,
  getOfferings,
  logOutRevenueCatIfReady,
  purchasePackage as rcPurchasePackage,
  restorePurchases as rcRestorePurchases,
  creditsForIapProductId,
} from '../lib/revenuecat';
import { Analytics } from '../lib/amplitude';
import type { PaywallSource } from '../types';

type DreemartRevenueCatContextType = {
  packages: PurchasesPackage[];
  isInitialized: boolean;
  /** Virtual currency ekranları yenilensin diye sürüm (satın alma/restore sonrası artar) */
  virtualCurrencyVersion: number;
  /** RC Dashboard’da tasarlanan paywall (Paywalls) — `presentPaywall` */
  presentRevenueCatPaywall: (source: PaywallSource) => Promise<void>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<void>;
  restorePurchases: (userId: string) => Promise<void>;
};

const Context = createContext<DreemartRevenueCatContextType | undefined>(
  undefined
);

export function DreemartRevenueCatProvider({
  children,
  userId,
}: {
  children: ReactNode;
  userId: string | null;
}) {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [virtualCurrencyVersion, setVirtualCurrencyVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!userId) {
        setPackages([]);
        await logOutRevenueCatIfReady();
        if (!cancelled) setIsInitialized(true);
        return;
      }

      setIsInitialized(false);
      try {
        await ensurePurchasesForUser(userId);
        if (cancelled) return;
        const pkgs = await getOfferings();
        if (cancelled) return;
        setPackages(pkgs);
      } catch (e) {
        console.error('RevenueCat init error:', e);
      } finally {
        if (!cancelled) setIsInitialized(true);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const purchasePackage = async (pkg: PurchasesPackage) => {
    if (!userId) return;
    Analytics.purchaseInitiated(pkg.identifier);
    await rcPurchasePackage(pkg);
    try {
      await Purchases.invalidateVirtualCurrenciesCache();
    } catch (e) {
      console.warn('invalidateVirtualCurrenciesCache:', e);
    }
    setVirtualCurrencyVersion((v: number) => v + 1);
    const estGranted = creditsForIapProductId(
      pkg.identifier,
      pkg.product.identifier
    );
    if (estGranted === 0) {
      console.warn(
        'Bilinmeyen IAP id (görünen etiket); RevenueCat panelinde ürün-virtual currency eşleşmesini kontrol et:',
        pkg.identifier,
        pkg.product.identifier
      );
    }
    Analytics.purchaseCompleted(pkg.identifier, estGranted);
  };

  const restorePurchases = async (_userId: string) => {
    await rcRestorePurchases();
    try {
      await Purchases.invalidateVirtualCurrenciesCache();
    } catch (e) {
      console.warn('invalidateVirtualCurrenciesCache:', e);
    }
    setVirtualCurrencyVersion((v: number) => v + 1);
    Analytics.purchaseRestored();
  };

  const presentRevenueCatPaywall = useCallback(
    async (source: PaywallSource) => {
      if (!REVENUECAT_ENABLED || !userId) return;
      Analytics.paywallViewed(source);
      try {
        const offerings = await Purchases.getOfferings();
        const current = offerings.current;
        await RevenueCatUI.presentPaywall(current ? { offering: current } : {});
      } catch (e) {
        console.error('RevenueCat presentPaywall:', e);
      } finally {
        try {
          await Purchases.invalidateVirtualCurrenciesCache();
        } catch (e) {
          console.warn('invalidateVirtualCurrenciesCache:', e);
        }
        setVirtualCurrencyVersion((v: number) => v + 1);
      }
    },
    [userId]
  );

  return (
    <Context.Provider
      value={{
        packages,
        isInitialized,
        virtualCurrencyVersion,
        presentRevenueCatPaywall,
        purchasePackage,
        restorePurchases,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useDreemartRevenueCat() {
  const ctx = useContext(Context);
  if (ctx === undefined) {
    throw new Error('useDreemartRevenueCat must be used within DreemartRevenueCatProvider');
  }
  return ctx;
}
