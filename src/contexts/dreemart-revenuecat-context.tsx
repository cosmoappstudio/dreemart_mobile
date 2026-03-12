import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { PurchasesPackage } from 'react-native-purchases';
import Purchases from 'react-native-purchases';
import { supabase } from '../lib/supabase';
import {
  initRevenueCat,
  getOfferings,
  purchasePackage as rcPurchasePackage,
  restorePurchases as rcRestorePurchases,
  CREDIT_MAP,
} from '../lib/revenuecat';
import { Analytics } from '../lib/amplitude';

type DreemartRevenueCatContextType = {
  packages: PurchasesPackage[];
  isInitialized: boolean;
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
  children: React.ReactNode;
  userId: string | null;
}) {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    if (!userId) {
      setIsInitialized(true);
      return;
    }
    initRef.current = true;

    const init = async () => {
      try {
        initRevenueCat(userId);
        const pkgs = await getOfferings();
        setPackages(pkgs);
      } catch (e) {
        console.error('RevenueCat init error:', e);
      } finally {
        setIsInitialized(true);
      }
    };

    init();
  }, [userId]);

  const purchasePackage = async (pkg: PurchasesPackage) => {
    if (!userId) return;
    Analytics.purchaseInitiated(pkg.identifier);
    const customerInfo = await rcPurchasePackage(pkg);
    const identifier = pkg.identifier.toLowerCase();
    const creditAmount =
      Object.entries(CREDIT_MAP).find(([k]) => identifier.includes(k))?.[1] ??
      5;

    const { data: current } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    await supabase
      .from('profiles')
      .update({
        credits: (current?.credits ?? 0) + creditAmount,
        tier: 'paid',
        last_purchased_pack_id: pkg.identifier,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    Analytics.purchaseCompleted(pkg.identifier, creditAmount);
  };

  const restorePurchases = async (uid: string) => {
    const customerInfo = await rcRestorePurchases();
    const hasPurchase = Object.keys(customerInfo.nonSubscriptionTransactions ?? {}).length > 0 ||
      Object.keys(customerInfo.entitlements.active).length > 0;
    if (hasPurchase) {
      await supabase
        .from('profiles')
        .update({ tier: 'paid', updated_at: new Date().toISOString() })
        .eq('id', uid);
    }
    Analytics.purchaseRestored();
  };

  return (
    <Context.Provider
      value={{
        packages,
        isInitialized,
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
