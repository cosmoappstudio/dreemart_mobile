import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { DreamBackground } from '../../components/DreamBackground';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { AppText } from '../../components/app-text';
import { useAuth } from '../../contexts/auth-context';
import { useAppConfig } from '../../hooks/useAppConfig';
import { useCredits } from '../../hooks/useCredits';
import { useProfileContext } from '../../contexts/profile-context';
import { useDreams } from '../../hooks/useDreams';
import { useDreemartRevenueCat } from '../../contexts/dreemart-revenuecat-context';
import { useToast } from 'heroui-native';
import { PaywallModal } from '../../components/PaywallModal';
import { colors } from '../../constants/theme';
import { useTranslation } from 'react-i18next';
import {
  setLanguage,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from '../../i18n';
import { supabase } from '../../lib/supabase';

const STORE_URL =
  Platform.OS === 'ios'
    ? 'https://apps.apple.com/app/dreemart/id123456789'
    : 'https://play.google.com/store/apps/details?id=com.rizzapmobile.rizzup';

function getLevelKey(dreamCount: number): 'new' | 'explorer' | 'master' | 'virtuoso' {
  if (dreamCount === 0) return 'new';
  if (dreamCount < 5) return 'explorer';
  if (dreamCount < 15) return 'master';
  return 'virtuoso';
}

function getDreamScore(dreamCount: number): number {
  return dreamCount * 10;
}

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  tr: 'Türkçe',
  en: 'English',
  ru: 'Русский',
};

export default function ProfileScreen() {
  const { t } = useTranslation();
  const [showPaywall, setShowPaywall] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const insets = useSafeAreaInsets();
  const { userId, refreshAuth } = useAuth();
  const { credits, refetch: refetchCredits } = useCredits(userId);
  const { profile, refetch: refetchProfile } = useProfileContext();
  const { dreams } = useDreams(userId);
  const { toast } = useToast();
  const { packages, isInitialized, restorePurchases } = useDreemartRevenueCat();
  const { config: appConfig, refetch: refetchAppConfig } = useAppConfig();

  useFocusEffect(
    useCallback(() => {
      refetchProfile();
      refetchCredits();
      refetchAppConfig();
    }, [refetchProfile, refetchCredits, refetchAppConfig])
  );

  const dreamCount = dreams.length;
  const dreamScore = getDreamScore(dreamCount);
  const levelKey = getLevelKey(dreamCount);
  const tierLabel =
    profile?.tier === 'paid' || profile?.tier === 'pro'
      ? t('profile.proPlan')
      : t('profile.freePlan');

  const handleLanguageChange = useCallback(
    async (lng: SupportedLanguage) => {
      setLanguage(lng);
      setShowLangPicker(false);
      if (userId) {
        try {
          const { error } = await supabase
            .from('profiles')
            .update({ language: lng, updated_at: new Date().toISOString() })
            .eq('id', userId);
          if (error) throw error;
          await refetchProfile();
          toast.show({ label: t('profile.languageUpdated'), variant: 'success' });
        } catch (e) {
          console.error('Language update error:', e);
          toast.show({ label: t('profile.languageUpdateError'), variant: 'danger' });
        }
      }
    },
    [userId, refetchProfile, toast, t]
  );

  const handleRestore = useCallback(async () => {
    try {
      if (userId) {
        await restorePurchases(userId);
        await refetchProfile();
        await refetchCredits();
      }
    } catch (e) {
      console.error('Restore error:', e);
    }
  }, [userId, restorePurchases, refetchProfile, refetchCredits]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      t('profile.deleteAccountConfirmTitle'),
      t('profile.deleteAccountConfirmMessage'),
      [
        { text: t('generation.back'), style: 'cancel' },
        {
          text: t('profile.deleteAccount'),
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              await refreshAuth();
              toast.show({ label: t('profile.deleteAccountSuccess'), variant: 'success' });
            } catch (e) {
              console.error('Delete account error:', e);
              toast.show({ label: t('generation.error'), variant: 'danger' });
            }
          },
        },
      ]
    );
  }, [t, refreshAuth, toast]);

  return (
    <DreamBackground style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="moon" size={20} color={colors.primaryLight} />
          </View>
          <AppText style={styles.title}>{t('profile.title')}</AppText>
        </View>
        <Pressable onPress={handleRestore} style={styles.iconBtn}>
          <Ionicons name="refresh" size={20} color={colors.textMuted} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <AppText style={styles.avatarText}>
                {(profile?.username ?? 'R')[0].toUpperCase()}
              </AppText>
            </View>
          </View>
          <AppText style={styles.username}>
            {profile?.username ?? t('profile.defaultUsername')}
          </AppText>
          <View style={styles.badgeRow}>
            <View style={styles.tierBadge}>
              <AppText style={styles.tierText}>{tierLabel}</AppText>
            </View>
            <View style={styles.levelBadge}>
              <Ionicons name="sparkles" size={12} color={colors.primaryLight} />
              <AppText style={styles.levelText}>{t(`levels.${levelKey}`)}</AppText>
            </View>
          </View>
          {userId && (
            <AppText style={styles.dreamerId} numberOfLines={1}>
              dreamer_{userId.slice(0, 8)}...
            </AppText>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <Pressable
            style={({ pressed }) => [styles.statPill, pressed && { opacity: 0.8 }]}
            onPress={() => setShowPaywall(true)}
          >
            <Ionicons name="flash" size={16} color={colors.accent} />
            <AppText style={styles.statPillValue}>{credits}</AppText>
            <AppText style={styles.statPillLabel}>{t('profile.remainingCredits')}</AppText>
          </Pressable>
          <View style={styles.statPill}>
            <Ionicons name="images" size={16} color={colors.textMuted} />
            <AppText style={styles.statPillValue}>{dreamCount}</AppText>
            <AppText style={styles.statPillLabel}>{t('profile.generated')}</AppText>
          </View>
          <View style={styles.statPill}>
            <Ionicons name="trophy" size={16} color={colors.accent} />
            <AppText style={styles.statPillValue}>{dreamScore}</AppText>
            <AppText style={styles.statPillLabel}>{t('profile.dreamScore')}</AppText>
          </View>
        </View>

        {/* CTA */}
        <Pressable
          style={({ pressed }) => [
            styles.ctaBtn,
            pressed && styles.ctaBtnPressed,
          ]}
          onPress={() => setShowPaywall(true)}
        >
          <LinearGradient
            colors={['#7C3AED', '#A855F7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Ionicons name="flash" size={20} color="#fff" />
            <AppText style={styles.ctaText}>{t('profile.getCredits')}</AppText>
          </LinearGradient>
        </Pressable>

        {/* Menu */}
        <View style={styles.menuSection}>
          <ProfileMenuItem
            icon="language"
            label={t('profile.language')}
            onPress={() => setShowLangPicker(true)}
          />
          <ProfileMenuItem
            icon="notifications"
            label={t('profile.notificationSettings')}
            onPress={() => Linking.openSettings()}
          />
          <ProfileMenuItem
            icon="star"
            label={t('profile.rateUs')}
            onPress={() => Linking.openURL(STORE_URL)}
          />
          <ProfileMenuItem
            icon="mail"
            label={t('profile.support')}
            onPress={() => Linking.openURL(appConfig.support_url)}
          />
          <ProfileMenuItem
            icon="refresh"
            label={t('profile.restorePurchases')}
            onPress={handleRestore}
          />
          <ProfileMenuItem
            icon="reader"
            label={t('profile.termsAndConditions')}
            onPress={() => Linking.openURL(appConfig.terms_url)}
          />
          <ProfileMenuItem
            icon="document-text"
            label={t('profile.eula')}
            onPress={() => Linking.openURL(appConfig.eula_url)}
          />
          <ProfileMenuItem
            icon="trash"
            label={t('profile.deleteAccount')}
            onPress={handleDeleteAccount}
            destructive
          />
        </View>

        <AppText style={styles.version}>
          dreemart.app · v{Constants.expoConfig?.version ?? '1.0.0'}
        </AppText>
      </ScrollView>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        source="profile"
        packages={packages}
        isInitialized={isInitialized}
      />

      <Modal
        visible={showLangPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLangPicker(false)}
      >
        <Pressable
          style={styles.langModalOverlay}
          onPress={() => setShowLangPicker(false)}
        >
          <Pressable style={styles.langPicker} onPress={(e) => e.stopPropagation()}>
            {Platform.OS === 'ios' ? (
              <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
            ) : (
              <View style={styles.langPickerBg} />
            )}
            <View style={styles.langPickerContent}>
              <View style={styles.langPickerHeader}>
                <Ionicons name="language" size={22} color={colors.primaryLight} />
                <AppText style={styles.langPickerTitle}>{t('profile.language')}</AppText>
              </View>
              {SUPPORTED_LANGUAGES.map((lng) => (
                <Pressable
                  key={lng}
                  style={({ pressed }) => [
                    styles.langOption,
                    pressed && styles.langOptionPressed,
                  ]}
                  onPress={() => handleLanguageChange(lng)}
                >
                  <AppText style={styles.langOptionText}>{LANGUAGE_LABELS[lng]}</AppText>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </Pressable>
              ))}
              <Pressable
                style={styles.langCancel}
                onPress={() => setShowLangPicker(false)}
              >
                <AppText style={styles.langCancelText}>{t('generation.back')}</AppText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </DreamBackground>
  );
}

function ProfileMenuItem({
  icon,
  label,
  onPress,
  destructive,
}: {
  icon:
    | 'refresh'
    | 'document-text'
    | 'reader'
    | 'language'
    | 'notifications'
    | 'star'
    | 'mail'
    | 'shield-checkmark'
    | 'trash';
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const iconColor = destructive ? colors.error : colors.primaryLight;
  const textColor = destructive ? colors.error : colors.text;
  const iconBg = destructive ? 'rgba(239,68,68,0.15)' : 'rgba(124,58,237,0.2)';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        pressed && styles.menuItemPressed,
      ]}
      onPress={onPress}
    >
      <View style={[styles.menuIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <AppText style={[styles.menuItemText, { color: textColor }]}>{label}</AppText>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(124, 58, 237, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.3,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 20,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(26, 26, 46, 0.6)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.2)',
  },
  avatarRing: {
    padding: 3,
    borderRadius: 50,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(168, 85, 247, 0.4)',
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(124, 58, 237, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primaryLight,
    letterSpacing: -0.5,
  },
  username: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
    justifyContent: 'center',
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  tierText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(124, 58, 237, 0.25)',
  },
  levelText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryLight,
  },
  dreamerId: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statPill: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(26, 26, 46, 0.5)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.15)',
  },
  statPillValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  statPillLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  ctaBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  ctaBtnPressed: {
    opacity: 0.9,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  menuSection: {
    gap: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(26, 26, 46, 0.5)',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.12)',
  },
  menuItemPressed: {
    opacity: 0.85,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  version: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 20,
    opacity: 0.8,
  },
  langModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  langPicker: {
    borderRadius: 24,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 320,
  },
  langPickerBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surface,
  },
  langPickerContent: {
    padding: 20,
  },
  langPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  langPickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
  },
  langOptionPressed: {
    opacity: 0.8,
  },
  langOptionText: {
    fontSize: 16,
    color: colors.text,
  },
  langCancel: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  langCancelText: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
