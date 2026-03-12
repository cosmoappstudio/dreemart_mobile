import { Ionicons } from '@expo/vector-icons';
import { FlatList, StyleSheet, View } from 'react-native';
import { DreamCard } from './DreamCard';
import { AppText } from './app-text';
import { colors } from '../constants/theme';
import type { Dream } from '../types';

type GalleryGridProps = {
  dreams: Dream[];
  onDreamPress: (dream: Dream) => void;
  emptyMessage?: string;
  emptySubtext?: string;
  contentContainerStyle?: object;
};

export function GalleryGrid({
  dreams,
  onDreamPress,
  emptyMessage = 'Henüz rüya görselleştirmen yok ✨',
  emptySubtext,
  contentContainerStyle,
}: GalleryGridProps) {
  if (dreams.length === 0) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="images-outline" size={48} color={colors.textMuted} />
        </View>
        <AppText style={styles.emptyTitle}>{emptyMessage}</AppText>
        {emptySubtext && (
          <AppText style={styles.emptySubtext}>{emptySubtext}</AppText>
        )}
      </View>
    );
  }

  return (
    <FlatList
      data={dreams}
      numColumns={2}
      keyExtractor={(item) => item.id}
      columnWrapperStyle={styles.row}
      contentContainerStyle={[styles.list, contentContainerStyle]}
      renderItem={({ item }) => (
        <View style={styles.cell}>
          <DreamCard dream={item} onPress={() => onDreamPress(item)} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  row: {
    gap: 12,
    marginBottom: 12,
  },
  cell: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
