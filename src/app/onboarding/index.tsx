import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as Notifications from 'expo-notifications';
import { DreamBackground } from '../../components/DreamBackground';
import { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../components/app-text';
import { useAuth } from '../../contexts/auth-context';
import { useOnboarding } from '../../contexts/onboarding-context';
import { useDreemartRevenueCat } from '../../contexts/dreemart-revenuecat-context';
import { useProfileContext } from '../../contexts/profile-context';
import { useAppConfig } from '../../hooks/useAppConfig';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { Analytics } from '../../lib/amplitude';
import {
  declineAppTrackingForMeta,
  requestAppTrackingThenSyncMeta,
} from '../../lib/requestAppTracking';
import { supabase } from '../../lib/supabase';
import {
  getCurrentLanguage,
  isSupportedLanguage,
  setLanguage,
  type SupportedLanguage,
} from '../../i18n';
import { colors, gradients } from '../../constants/theme';
import { OnboardingLanguageDropdown } from '../../components/OnboardingLanguageDropdown';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_WIDTH = SCREEN_WIDTH - 56;

type Step =
  | {
      kind: 'welcome';
      titleKey: 'onboarding.welcomeTitle';
      descKey: 'onboarding.welcomeDesc';
      image: number;
    }
  | { kind: 'language' }
  | { kind: 'tracking' }
  | { kind: 'push' }
  | {
      kind: 'ready';
      titleKey: 'onboarding.readyTitle';
      descKey: 'onboarding.readyDesc';
    };

const STEPS: Step[] = [
  {
    kind: 'welcome',
    titleKey: 'onboarding.welcomeTitle',
    descKey: 'onboarding.welcomeDesc',
    image: require('../../../assets/images/onboarding/onboarding-frida.png'),
  },
  { kind: 'language' },
  { kind: 'tracking' },
  { kind: 'push' },
  {
    kind: 'ready',
    titleKey: 'onboarding.readyTitle',
    descKey: 'onboarding.readyDesc',
  },
];

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(() =>
    getCurrentLanguage()
  );
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId } = useAuth();
  const { profile, refetch: refetchProfile } = useProfileContext();
  const { setOnboardingDone } = useOnboarding();
  const { presentRevenueCatPaywall } = useDreemartRevenueCat();
  const { registerAndSave: registerPush } = usePushNotifications(userId);
  const { config: appConfig } = useAppConfig();

  const current = STEPS[step];
  const isLastStep = step === STEPS.length - 1;
  const isPushStep = current.kind === 'push';
  const isTrackingStep = current.kind === 'tracking';
  const isLanguageStep = current.kind === 'language';
  const isWelcomeStep = current.kind === 'welcome';

  const floatY = useSharedValue(0);
  const imageScale = useSharedValue(1);

  useEffect(() => {
    const lang = profile?.language;
    if (lang && isSupportedLanguage(lang)) {
      setSelectedLang(lang);
      setLanguage(lang);
    }
  }, [profile?.language]);

  useEffect(() => {
    if (!isWelcomeStep) return;
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2000 }),
        withTiming(8, { duration: 2000 })
      ),
      -1,
      true
    );
    imageScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 2500 }),
        withTiming(1, { duration: 2500 })
      ),
      -1,
      true
    );
  }, [step, isWelcomeStep, floatY, imageScale]);

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value },
      { scale: imageScale.value },
    ],
  }));

  const persistLanguage = useCallback(
    async (lng: SupportedLanguage) => {
      setLanguage(lng);
      setSelectedLang(lng);
      if (!userId) return;
      try {
        await supabase
          .from('profiles')
          .update({ language: lng, updated_at: new Date().toISOString() })
          .eq('id', userId);
        await refetchProfile();
      } catch (e) {
        console.warn('Onboarding language save:', e);
      }
    },
    [userId, refetchProfile]
  );

  const handleNext = useCallback(() => {
    if (isLastStep) {
      void (async () => {
        await presentRevenueCatPaywall('onboarding');
        Analytics.onboardingCompleted();
        await setOnboardingDone(true);
        router.replace('/(tabs)/dream');
      })();
      return;
    }
    setStep((s) => s + 1);
  }, [isLastStep, presentRevenueCatPaywall, router, setOnboardingDone]);

  const handleEnableNotifications = useCallback(async () => {
    try {
      await Notifications.requestPermissionsAsync();
      await registerPush();
    } catch (e) {
      console.warn('Notification permission error:', e);
    }
    setStep((s) => s + 1);
  }, [registerPush]);

  const handleSkipNotifications = useCallback(() => {
    setStep((s) => s + 1);
  }, []);

  const handleTrackingAllow = useCallback(async () => {
    await requestAppTrackingThenSyncMeta();
    setStep((s) => s + 1);
  }, []);

  const handleTrackingSkip = useCallback(async () => {
    await declineAppTrackingForMeta();
    setStep((s) => s + 1);
  }, []);

  const title =
    current.kind === 'welcome' || current.kind === 'ready'
      ? t(current.titleKey)
      : current.kind === 'language'
        ? t('onboarding.languageTitle')
        : current.kind === 'tracking'
          ? t('onboarding.trackingTitle')
          : t('onboarding.pushTitle');

  const description =
    current.kind === 'welcome'
      ? t(current.descKey)
      : current.kind === 'ready'
        ? t('onboarding.readyDesc', { count: appConfig.initial_free_credits })
        : current.kind === 'language'
          ? t('onboarding.languageDesc')
          : current.kind === 'tracking'
            ? t('onboarding.trackingDesc')
            : t('onboarding.pushDesc');

  return (
    <DreamBackground style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="moon" size={20} color={colors.accent} />
          </View>
          <AppText style={styles.headerTitle}>Dreemart</AppText>
        </View>
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i <= step && styles.dotActive]} />
          ))}
        </View>
      </View>

      <ScrollView
        nestedScrollEnabled
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isWelcomeStep && (
          <Animated.View
            key="welcome-img"
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(200)}
            style={[styles.imageWrap, imageAnimatedStyle]}
          >
            <Image
              source={current.image}
              style={styles.previewImage}
              contentFit="cover"
            />
          </Animated.View>
        )}

        {isLanguageStep && (
          <Animated.View key="lang-block" entering={FadeIn.duration(400)} style={styles.langBlock}>
            <AppText style={styles.title}>{title}</AppText>
            <AppText style={styles.description}>{description}</AppText>
            <OnboardingLanguageDropdown
              selectedLang={selectedLang}
              onSelect={persistLanguage}
            />
          </Animated.View>
        )}

        {!isWelcomeStep && !isLanguageStep && (
          <Animated.View
            key={`icon-${step}`}
            entering={FadeIn.duration(400)}
            style={styles.iconRing}
          >
            <View style={styles.iconWrapper}>
              <Ionicons
                name={
                  isTrackingStep
                    ? 'shield-checkmark'
                    : isPushStep
                      ? 'notifications'
                      : 'sparkles'
                }
                size={isPushStep ? 64 : 56}
                color={colors.accent}
              />
            </View>
          </Animated.View>
        )}

        {!isLanguageStep ? (
          <Animated.View key={`text-${step}`} entering={FadeIn.delay(120).duration(350)}>
            <AppText style={styles.title}>{title}</AppText>
            <AppText style={styles.description}>{description}</AppText>
          </Animated.View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {isPushStep ? (
          <View style={styles.dualFooter}>
            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              onPress={handleEnableNotifications}
            >
              <LinearGradient
                colors={gradients.primaryAccent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Ionicons name="notifications" size={20} color={colors.text} />
                <AppText style={styles.buttonText}>
                  {t('onboarding.enableNotifications')}
                </AppText>
              </LinearGradient>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.skipBtn, pressed && styles.buttonPressed]}
              onPress={handleSkipNotifications}
            >
              <AppText style={styles.skipBtnText}>{t('onboarding.skip')}</AppText>
            </Pressable>
          </View>
        ) : isTrackingStep ? (
          <View style={styles.dualFooter}>
            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              onPress={handleTrackingAllow}
            >
              <LinearGradient
                colors={gradients.primaryAccent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <AppText style={styles.buttonText}>{t('onboarding.trackingAllow')}</AppText>
                {Platform.OS === 'ios' ? (
                  <Ionicons name="chevron-forward" size={20} color={colors.text} />
                ) : null}
              </LinearGradient>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.skipBtn, pressed && styles.buttonPressed]}
              onPress={handleTrackingSkip}
            >
              <AppText style={styles.skipBtnText}>{t('onboarding.trackingSkip')}</AppText>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={handleNext}
          >
            <LinearGradient
              colors={gradients.primaryAccent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <AppText style={styles.buttonText}>
                {isLastStep ? t('onboarding.start') : t('onboarding.next')}
              </AppText>
              {!isLastStep ? (
                <Ionicons name="chevron-forward" size={20} color={colors.text} />
              ) : null}
            </LinearGradient>
          </Pressable>
        )}
      </View>

    </DreamBackground>
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
    backgroundColor: 'rgba(249, 115, 22, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: {
    backgroundColor: colors.accent,
    width: 24,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 20,
    alignItems: 'center',
  },
  imageWrap: {
    width: IMAGE_WIDTH,
    height: IMAGE_WIDTH * 1.05,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(249, 115, 22, 0.35)',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  langBlock: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    marginBottom: 8,
  },
  iconRing: {
    padding: 4,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(249, 115, 22, 0.4)',
    marginBottom: 24,
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 34,
  },
  description: {
    fontSize: 17,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 360,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  dualFooter: {
    width: '100%',
    gap: 12,
  },
  button: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  skipBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipBtnText: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: '500',
  },
});
