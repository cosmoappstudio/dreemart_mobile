import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { DreamBackground } from '../../components/DreamBackground';
import { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/app-text';
import { ArtistPicker } from '../../components/ArtistPicker';
import { CreditBadge } from '../../components/CreditBadge';
import { DreamInput } from '../../components/DreamInput';
import { useAuth } from '../../contexts/auth-context';
import { useCredits } from '../../hooks/useCredits';
import { useArtists } from '../../hooks/useArtists';
import { useProfileContext } from '../../contexts/profile-context';
import { useDreemartRevenueCat } from '../../contexts/dreemart-revenuecat-context';
import { PaywallModal } from '../../components/PaywallModal';
import { Analytics } from '../../lib/amplitude';
import { colors } from '../../constants/theme';
import type { Artist } from '../../types';
import { useTranslation } from 'react-i18next';
import { useToast } from 'heroui-native';
import {
  getCurrentLanguage,
  setLanguage,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from '../../i18n';
import { supabase } from '../../lib/supabase';

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  tr: 'Türkçe',
  en: 'English',
  ru: 'Русский',
};

export default function DreamScreen() {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState('');
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [paywallSource, setPaywallSource] = useState<
    'no_credit' | 'locked_artist'
  >('no_credit');

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId } = useAuth();
  const { credits } = useCredits(userId);
  const { profile, refetch: refetchProfile } = useProfileContext();
  const { artists, loading: artistsLoading } = useArtists(userId, profile?.tier ?? 'free');

  useFocusEffect(
    useCallback(() => {
      refetchProfile();
    }, [refetchProfile])
  );
  const { toast } = useToast();
  const { packages, isInitialized } = useDreemartRevenueCat();

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

  const creditCost = 1;
  const handleCreate = useCallback(() => {
    if (credits < creditCost) {
      setPaywallSource('no_credit');
      setShowPaywall(true);
      return;
    }
    if (!selectedArtist) return;
    if (!prompt.trim()) return;

    Analytics.dreamSubmitted(selectedArtist.id);
    router.push({
      pathname: '/generation',
      params: { prompt: prompt.trim(), artist_id: selectedArtist.id },
    });
  }, [credits, selectedArtist, prompt, router]);

  const handleLockedArtistPress = useCallback(() => {
    setPaywallSource('locked_artist');
    setShowPaywall(true);
  }, []);

  const handleCreditPress = useCallback(() => {
    if (credits < 1) {
      setPaywallSource('no_credit');
      setShowPaywall(true);
    }
  }, [credits]);

  return (
    <DreamBackground style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Ionicons name="moon" size={24} color={colors.accent} />
            <AppText style={styles.logo}>DREEMART</AppText>
          </View>
          <Pressable onPress={handleCreditPress}>
            <CreditBadge credits={credits} onPress={handleCreditPress} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="sparkles" size={18} color={colors.accent} />
              <AppText style={styles.sectionTitle}>{t('dream.title')}</AppText>
            </View>
            <DreamInput
              value={prompt}
              onChangeText={setPrompt}
              placeholder={t('dream.placeholder')}
              label={t('tabs.dream')}
            />
          </View>

          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>{t('dream.artistTitle')}</AppText>
            <AppText style={styles.sectionSubtitle}>
              {t('dream.artistSubtitle')}
            </AppText>
            <ArtistPicker
              artists={artists}
              selectedId={selectedArtist?.id ?? null}
              onSelect={setSelectedArtist}
              onLockedPress={handleLockedArtistPress}
              loading={artistsLoading}
            />
          </View>

          <Pressable
            style={styles.langSelector}
            onPress={() => setShowLangPicker(true)}
          >
            <Ionicons name="globe-outline" size={20} color={colors.accent} />
            <AppText style={styles.langSelectorText}>
              {LANGUAGE_LABELS[getCurrentLanguage()]}
            </AppText>
            <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.createBtn,
              pressed && styles.createBtnPressed,
            ]}
            onPress={handleCreate}
          >
            <View style={styles.createBtnInner}>
              <Ionicons name="sparkles" size={22} color="#0A0A1A" />
              <AppText style={styles.createBtnText}>
                {t('dream.createBtn', { count: creditCost })}
              </AppText>
            </View>
          </Pressable>

          <AppText style={styles.hint}>{t('dream.hint')}</AppText>
        </ScrollView>
      </KeyboardAvoidingView>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        source={paywallSource}
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
            <AppText style={styles.langPickerTitle}>{t('profile.language')}</AppText>
            {SUPPORTED_LANGUAGES.map((lng) => (
              <Pressable
                key={lng}
                style={styles.langOption}
                onPress={() => handleLanguageChange(lng)}
              >
                <AppText style={styles.langOptionText}>{LANGUAGE_LABELS[lng]}</AppText>
              </Pressable>
            ))}
            <Pressable
              style={styles.langCancel}
              onPress={() => setShowLangPicker(false)}
            >
              <AppText style={styles.langCancelText}>{t('generation.back')}</AppText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </DreamBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 28,
    height: 28,
  },
  logo: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: -4,
  },
  langSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'center',
  },
  langSelectorText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  createBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    backgroundColor: colors.accent,
  },
  createBtnPressed: {
    opacity: 0.9,
  },
  createBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  createBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0A0A1A',
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: -8,
  },
  langModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  langPicker: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    width: '100%',
    maxWidth: 320,
  },
  langPickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  langOption: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  langOptionText: {
    fontSize: 16,
    color: colors.text,
  },
  langCancel: {
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  langCancelText: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
