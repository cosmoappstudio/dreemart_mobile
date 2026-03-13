import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as Notifications from 'expo-notifications';
import { DreamBackground } from '../../components/DreamBackground';
import { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
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
import { useArtists } from '../../hooks/useArtists';
import { useProfileContext } from '../../contexts/profile-context';
import { Analytics } from '../../lib/amplitude';
import { colors, gradients } from '../../constants/theme';
import { PaywallModal } from '../../components/PaywallModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_WIDTH = SCREEN_WIDTH - 56;

const STEPS = [
  {
    icon: 'moon' as const,
    titleKey: 'onboarding.step1Title' as const,
    descKey: 'onboarding.step1Desc' as const,
    image: require('../../../assets/images/onboarding/onboarding-frida.png'),
  },
  {
    icon: 'color-palette' as const,
    titleKey: 'onboarding.step2Title' as const,
    descKey: 'onboarding.step2Desc' as const,
    image: null,
    showArtists: true,
  },
  {
    icon: 'notifications' as const,
    titleKey: 'onboarding.step3Title' as const,
    descKey: 'onboarding.step3Desc' as const,
    image: null,
    isNotification: true,
  },
  {
    icon: 'sparkles' as const,
    titleKey: 'onboarding.step4Title' as const,
    descKey: 'onboarding.step4Desc' as const,
    image: null,
  },
];

const ARTIST_GAP = 12;
const ARTIST_GRID_COLS = 4;
const ARTIST_CARD_SIZE = (SCREEN_WIDTH - 56 - (ARTIST_GRID_COLS - 1) * ARTIST_GAP) / ARTIST_GRID_COLS;

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId } = useAuth();
  const { profile } = useProfileContext();
  const { setOnboardingDone } = useOnboarding();
  const { packages, isInitialized } = useDreemartRevenueCat();
  const { artists } = useArtists(userId, profile?.tier ?? 'free', {
    preserveSortOrder: true,
  });

  const isLastStep = step === STEPS.length - 1;
  const current = STEPS[step];
  const isNotificationStep = (current as { isNotification?: boolean }).isNotification === true;
  const hasImage = !!current.image;
  const showArtists = (current as { showArtists?: boolean }).showArtists === true;
  const displayArtists = artists.slice(0, 12);

  const floatY = useSharedValue(0);
  const imageScale = useSharedValue(1);

  useEffect(() => {
    if (!hasImage && !showArtists) return;
    if (showArtists) return; // no float animation for artist grid
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
  }, [step, hasImage, showArtists]);

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value },
      { scale: imageScale.value },
    ],
  }));

  const handleNext = useCallback(async () => {
    if (isLastStep) {
      Analytics.onboardingCompleted();
      setShowPaywall(true);
    } else {
      setStep((s) => s + 1);
    }
  }, [isLastStep]);

  const handleEnableNotifications = useCallback(async () => {
    try {
      await Notifications.requestPermissionsAsync();
    } catch (e) {
      console.warn('Notification permission error:', e);
    }
    setStep((s) => s + 1);
  }, []);

  const handleSkipNotifications = useCallback(() => {
    setStep((s) => s + 1);
  }, []);

  const handlePaywallClose = useCallback(async () => {
    setShowPaywall(false);
    await setOnboardingDone(true);
    router.replace('/(tabs)/dream');
  }, [router, setOnboardingDone]);

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
            <View
              key={i}
              style={[
                styles.dot,
                i <= step && styles.dotActive,
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {showArtists && displayArtists.length > 0 ? (
          <Animated.View
            key={step}
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(200)}
            style={styles.artistGridWrap}
          >
            <View style={styles.artistGrid}>
              {displayArtists.map((artist) => (
                <View key={artist.id} style={styles.artistGridCard}>
                  <View style={styles.artistGridImageWrap}>
                    <Image
                      source={{ uri: artist.image_url }}
                      style={styles.artistGridImage}
                      contentFit="cover"
                    />
                  </View>
                  <AppText style={styles.artistGridName} numberOfLines={1}>
                    {artist.name}
                  </AppText>
                </View>
              ))}
            </View>
          </Animated.View>
        ) : hasImage ? (
          <Animated.View
            key={step}
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
        ) : (
          <Animated.View
            key={step}
            entering={FadeIn.duration(400)}
            style={styles.iconRing}
          >
            <View style={styles.iconWrapper}>
              <Ionicons
                name={current.icon}
                size={isNotificationStep ? 64 : 56}
                color={colors.accent}
              />
            </View>
          </Animated.View>
        )}
        <Animated.View key={`text-${step}`} entering={FadeIn.delay(150).duration(350)}>
          <AppText style={styles.title}>{t(current.titleKey)}</AppText>
          <AppText style={styles.description}>{t(current.descKey)}</AppText>
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {isNotificationStep ? (
          <View style={styles.notificationFooter}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
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
              style={({ pressed }) => [
                styles.skipBtn,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleSkipNotifications}
            >
              <AppText style={styles.skipBtnText}>{t('onboarding.skip')}</AppText>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
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
              {!isLastStep && (
                <Ionicons name="chevron-forward" size={20} color={colors.text} />
              )}
            </LinearGradient>
          </Pressable>
        )}
      </View>

      <PaywallModal
        visible={showPaywall}
        onClose={handlePaywallClose}
        source="onboarding"
        packages={packages}
        isInitialized={isInitialized}
      />
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
    paddingTop: 24,
    alignItems: 'center',
  },
  imageWrap: {
    width: IMAGE_WIDTH,
    height: IMAGE_WIDTH * 1.1,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 28,
    borderWidth: 2,
    borderColor: 'rgba(249, 115, 22, 0.35)',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  artistGridWrap: {
    width: IMAGE_WIDTH,
    marginBottom: 28,
  },
  artistGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ARTIST_GAP,
  },
  artistGridCard: {
    width: ARTIST_CARD_SIZE,
    alignItems: 'center',
  },
  artistGridImageWrap: {
    width: ARTIST_CARD_SIZE,
    height: ARTIST_CARD_SIZE,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(249, 115, 22, 0.4)',
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
  },
  artistGridImage: {
    width: '100%',
    height: '100%',
  },
  artistGridName: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
    textAlign: 'center',
    maxWidth: ARTIST_CARD_SIZE,
  },
  iconRing: {
    padding: 4,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(249, 115, 22, 0.4)',
    marginBottom: 28,
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
    marginBottom: 16,
    lineHeight: 34,
  },
  description: {
    fontSize: 17,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 26,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
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
  notificationFooter: {
    width: '100%',
    gap: 12,
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
