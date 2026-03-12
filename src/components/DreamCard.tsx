import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './app-text';
import { colors } from '../constants/theme';
import type { Dream } from '../types';

type DreamCardProps = {
  dream: Dream;
  onPress: () => void;
};

export function DreamCard({ dream, onPress }: DreamCardProps) {
  const date = new Date(dream.created_at).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
  });
  const artistName = dream.artists?.name ?? '';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: dream.image_url }}
          style={styles.image}
          contentFit="cover"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.85)']}
          style={styles.gradient}
        />
        <View style={styles.footer}>
          <AppText style={styles.artistName} numberOfLines={1}>
            {artistName}
          </AppText>
          <AppText style={styles.date} numberOfLines={1}>
            {date}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    aspectRatio: 0.72,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.2)',
  },
  cardPressed: {
    opacity: 0.9,
  },
  imageWrap: {
    flex: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  artistName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  date: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
});
