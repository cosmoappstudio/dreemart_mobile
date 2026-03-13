import { Ionicons } from '@expo/vector-icons';
import { DreamBackground } from './DreamBackground';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { useTranslation } from 'react-i18next';
import { AppText } from './app-text';
import { useAuth } from '../contexts/auth-context';
import { useDreemartRevenueCat } from '../contexts/dreemart-revenuecat-context';
import { Analytics } from '../lib/amplitude';
import { colors } from '../constants/theme';
import type { PaywallSource } from '../types';

type PaywallModalProps = {
  visible: boolean;
  onClose: () => void;
  source: PaywallSource;
  packages: PurchasesPackage[];
  isInitialized: boolean;
};

export function PaywallModal({
  visible,
  onClose,
  source,
  packages,
  isInitialized,
}: PaywallModalProps) {
  const { t } = useTranslation();
  const { userId } = useAuth();
  const { purchasePackage, restorePurchases } = useDreemartRevenueCat();

  const handleOpen = () => {
    Analytics.paywallViewed(source);
  };

  const handlePurchase = async (pkg: PurchasesPackage) => {
    try {
      await purchasePackage(pkg);
      onClose();
    } catch (e: unknown) {
      if ((e as { userCancelled?: boolean })?.userCancelled) return;
      console.error('Purchase error:', e);
    }
  };

  const handleRestore = async () => {
    try {
      if (userId) await restorePurchases(userId);
      onClose();
    } catch (e) {
      console.error('Restore error:', e);
    }
  };

  const getCreditLabel = (identifier: string) => {
    const id = identifier.toLowerCase();
    if (id.includes('starter')) return t('paywall.credits', { count: 5 });
    if (id.includes('popular')) return t('paywall.credits', { count: 15 });
    if (id.includes('pro')) return t('paywall.credits', { count: 40 });
    return '';
  };

  const isPopular = (identifier: string) =>
    identifier.toLowerCase().includes('popular');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onShow={handleOpen}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <DreamBackground style={styles.gradient}>
            <Pressable
              style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
              onPress={onClose}
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            >
              <Ionicons name="close-circle" size={36} color={colors.text} />
            </Pressable>

            <AppText style={styles.title}>{t('paywall.title')}</AppText>
            <AppText style={styles.subtitle}>{t('paywall.subtitle')}</AppText>

            {!isInitialized ? (
              <View style={styles.loading}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : packages.length > 0 ? (
              <ScrollView
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              >
                {packages.map((pkg) => (
                  <Pressable
                    key={pkg.identifier}
                    style={({ pressed }) => [
                      styles.packageCard,
                      isPopular(pkg.identifier) && styles.packageCardPopular,
                      pressed && styles.packageCardPressed,
                    ]}
                    onPress={() => handlePurchase(pkg)}
                  >
                    {isPopular(pkg.identifier) && (
                      <View style={styles.badge}>
                        <AppText style={styles.badgeText}>{t('paywall.mostPopular')}</AppText>
                      </View>
                    )}
                    <View style={styles.packageRow}>
                      <AppText style={styles.packageCredits}>
                        {getCreditLabel(pkg.identifier)}
                      </AppText>
                      <AppText style={styles.packagePrice}>
                        {pkg.product.priceString}
                      </AppText>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyPackages}>
                <AppText style={styles.emptyPackagesText}>
                  {t('paywall.subtitle')}
                </AppText>
                <AppText style={styles.emptyPackagesHint}>
                  {t('paywall.emptyHint')}
                </AppText>
              </View>
            )}

            <Pressable style={styles.restoreBtn} onPress={handleRestore}>
              <AppText style={styles.restoreText}>{t('paywall.restore')}</AppText>
            </Pressable>
          </DreamBackground>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '80%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  gradient: {
    position: 'relative',
    paddingTop: 48,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  closeBtnPressed: {
    opacity: 0.7,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  loading: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyPackages: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  emptyPackagesText: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyPackagesHint: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    opacity: 0.8,
  },
  list: {
    maxHeight: 280,
  },
  listContent: {
    gap: 12,
    paddingBottom: 16,
  },
  packageCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  packageCardPopular: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
  },
  packageCardPressed: {
    opacity: 0.9,
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background,
  },
  packageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packageCredits: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  packagePrice: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.accent,
  },
  restoreBtn: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 12,
  },
  restoreText: {
    fontSize: 15,
    color: colors.textMuted,
  },
});
