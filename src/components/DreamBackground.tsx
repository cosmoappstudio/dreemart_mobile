import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, G, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// 4-pointed sparkle (small, like reference icon)
const SPARKLE_PATH =
  'M 0,-1 L 0.25,-0.25 L 1,0 L 0.25,0.25 L 0,1 L -0.25,0.25 L -1,0 L -0.25,-0.25 Z';

type DreamBackgroundProps = {
  children: ReactNode;
  style?: object;
  /** Sheet/modal gibi sarmalayıcılarda `flex:1` yükseklik çökmesini önlemek için false */
  fill?: boolean;
};

const STARS: { cx: number; cy: number; r: number; baseOpacity: number; phase: number }[] = [
  { cx: 8, cy: 14, r: 0.6, baseOpacity: 0.65, phase: 0 },
  { cx: 92, cy: 10, r: 0.55, baseOpacity: 0.6, phase: 0.8 },
  { cx: 15, cy: 38, r: 0.5, baseOpacity: 0.55, phase: 1.6 },
  { cx: 88, cy: 42, r: 0.6, baseOpacity: 0.6, phase: 2.4 },
  { cx: 6, cy: 68, r: 0.55, baseOpacity: 0.5, phase: 3.2 },
  { cx: 94, cy: 72, r: 0.5, baseOpacity: 0.55, phase: 4 },
  { cx: 42, cy: 18, r: 0.55, baseOpacity: 0.5, phase: 0.4 },
  { cx: 68, cy: 58, r: 0.5, baseOpacity: 0.5, phase: 1.2 },
  { cx: 25, cy: 85, r: 0.6, baseOpacity: 0.55, phase: 2 },
  { cx: 78, cy: 90, r: 0.5, baseOpacity: 0.5, phase: 2.8 },
  { cx: 52, cy: 12, r: 0.45, baseOpacity: 0.45, phase: 3.6 },
  { cx: 35, cy: 62, r: 0.5, baseOpacity: 0.45, phase: 4.4 },
  { cx: 72, cy: 78, r: 0.55, baseOpacity: 0.5, phase: 0.2 },
  { cx: 18, cy: 22, r: 0.45, baseOpacity: 0.4, phase: 1 },
];

function TwinklingStar({
  star,
  progress,
}: {
  star: (typeof STARS)[0];
  progress: SharedValue<number>;
}) {
  const animatedProps = useAnimatedProps(() => {
    'worklet';
    const t = progress.value * 2 * Math.PI + star.phase;
    const twinkle = (1 + Math.sin(t)) / 2;
    const opacity = star.baseOpacity * (0.55 + 0.45 * twinkle);
    return { opacity };
  });

  return (
    <G transform={`translate(${star.cx}, ${star.cy}) scale(${star.r})`}>
      <AnimatedPath
        d={SPARKLE_PATH}
        fill="#FFFFFF"
        animatedProps={animatedProps}
      />
    </G>
  );
}

export function DreamBackground({ children, style, fill = true }: DreamBackgroundProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 4500 }),
      -1,
      false
    );
  }, [progress]);

  return (
    <View style={[fill ? styles.container : styles.containerNoFill, style]}>
      <LinearGradient
        colors={['#0D0A14', '#150D20', '#1A0F28', '#120A1A', '#0D0A14']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Svg
        style={StyleSheet.absoluteFill}
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <Defs>
          <RadialGradient
            id="moonGlow"
            cx="0.85"
            cy="0.15"
            r="0.4"
            gradientUnits="objectBoundingBox"
          >
            <Stop offset="0" stopColor="#F97316" stopOpacity="0.08" />
            <Stop offset="1" stopColor="#F97316" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient
            id="orbGlow"
            cx="0.15"
            cy="0.88"
            r="0.35"
            gradientUnits="objectBoundingBox"
          >
            <Stop offset="0" stopColor="#A855F7" stopOpacity="0.12" />
            <Stop offset="1" stopColor="#A855F7" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#moonGlow)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#orbGlow)" />
        {STARS.map((star, i) => (
          <TwinklingStar key={i} star={star} progress={progress} />
        ))}
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerNoFill: {
    width: '100%',
  },
});
