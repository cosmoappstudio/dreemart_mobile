import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { AppText } from './app-text';
import { colors } from '../constants/theme';

export function GenerationLoader() {
  const { t } = useTranslation();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.75);
  const dot1 = useSharedValue(0.4);
  const dot2 = useSharedValue(0.7);
  const dot3 = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.75, { duration: 1000 })
      ),
      -1,
      true
    );
    const pulse = withSequence(
      withTiming(1, { duration: 300 }),
      withTiming(0.35, { duration: 300 })
    );
    dot1.value = withRepeat(pulse, -1, false);
    dot2.value = withRepeat(withDelay(150, pulse), -1, false);
    dot3.value = withRepeat(withDelay(300, pulse), -1, false);
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const dot1Style = useAnimatedStyle(() => ({ opacity: dot1.value }));
  const dot2Style = useAnimatedStyle(() => ({ opacity: dot2.value }));
  const dot3Style = useAnimatedStyle(() => ({ opacity: dot3.value }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconRing, iconStyle]}>
        <View style={styles.iconWrapper}>
          <Ionicons name="brush" size={44} color={colors.accent} />
          <View style={styles.sparkleWrap}>
            <Ionicons name="sparkles" size={18} color={colors.accent} />
          </View>
        </View>
      </Animated.View>
      <AppText style={styles.text}>{t('generation.loading')}</AppText>
      <AppText style={styles.subtext}>{t('generation.loadingSubtext')}</AppText>
      <View style={styles.dots}>
        <Animated.View style={[styles.dot, dot1Style]} />
        <Animated.View style={[styles.dot, dot2Style]} />
        <Animated.View style={[styles.dot, dot3Style]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  iconRing: {
    padding: 4,
    borderRadius: 58,
    borderWidth: 2,
    borderColor: 'rgba(249, 115, 22, 0.45)',
    marginBottom: 28,
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sparkleWrap: {
    position: 'absolute',
    top: 10,
    right: 14,
  },
  text: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
  },
  dots: {
    flexDirection: 'row',
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
});
