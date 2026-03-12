import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCallback } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from './app-text';
import { colors } from '../constants/theme';
import type { Artist } from '../types';

export type ArtistPickerProps = {
  artists: Artist[];
  selectedId: string | null;
  onSelect: (artist: Artist) => void;
  onLockedPress?: () => void;
  loading?: boolean;
};

const CARD_SIZE = 100;
const { width } = Dimensions.get('window');

export function ArtistPicker({
  artists,
  selectedId,
  onSelect,
  onLockedPress,
  loading,
}: ArtistPickerProps) {
  const { t } = useTranslation();
  const handlePress = useCallback(
    (artist: Artist) => {
      if (artist.locked) {
        onLockedPress?.();
      } else {
        onSelect(artist);
      }
    },
    [onSelect, onLockedPress]
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <AppText style={styles.loadingText}>{t('artists.loading')}</AppText>
      </View>
    );
  }

  if (artists.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <AppText style={styles.emptyText}>{t('artists.empty')}</AppText>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      {artists.map((artist) => {
        const isSelected = selectedId === artist.id;
        const isLocked = artist.locked;

        return (
          <Pressable
            key={artist.id}
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
            onPress={() => handlePress(artist)}
          >
            <View
              style={[
                styles.imageWrapper,
                isSelected && styles.imageWrapperSelected,
              ]}
            >
              <Image
                source={{ uri: artist.image_url }}
                style={styles.image}
                contentFit="cover"
              />
              {isLocked && (
                <View style={styles.lockOverlay}>
                  <Ionicons name="lock-closed" size={24} color="#fff" />
                </View>
              )}
            </View>
            <AppText style={styles.name} numberOfLines={1}>
              {artist.name}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: 12,
    paddingVertical: 8,
  },
  card: {
    width: CARD_SIZE,
    alignItems: 'center',
  },
  cardPressed: {
    opacity: 0.8,
  },
  imageWrapper: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  imageWrapperSelected: {
    borderColor: colors.accent,
    borderWidth: 3,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
    textAlign: 'center',
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    color: colors.textMuted,
  },
  emptyContainer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
