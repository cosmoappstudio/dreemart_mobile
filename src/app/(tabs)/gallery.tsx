import { Ionicons } from '@expo/vector-icons';
import { DreamBackground } from '../../components/DreamBackground';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../components/app-text';
import { DreamDetailSwipe } from '../../components/DreamDetailSwipe';
import { GalleryGrid } from '../../components/GalleryGrid';
import { useAuth } from '../../contexts/auth-context';
import { useDreams } from '../../hooks/useDreams';
import { colors } from '../../constants/theme';
import type { Dream } from '../../types';

export default function GalleryScreen() {
  const { t } = useTranslation();
  const [selectedDream, setSelectedDream] = useState<Dream | null>(null);
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const { dreams, loading } = useDreams(userId);

  const handleDreamPress = useCallback((dream: Dream) => {
    setSelectedDream(dream);
  }, []);

  return (
    <DreamBackground style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="images" size={20} color={colors.accent} />
          </View>
          <AppText style={styles.title}>{t('gallery.title')}</AppText>
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.accent} />
          <AppText style={styles.loadingText}>{t('gallery.loading')}</AppText>
        </View>
      ) : (
        <GalleryGrid
          dreams={dreams}
          onDreamPress={handleDreamPress}
          emptyMessage={t('gallery.empty')}
          emptySubtext={t('gallery.emptySubtext')}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        />
      )}

      <Modal
        visible={!!selectedDream}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedDream(null)}
      >
        <View style={[styles.modalOverlay, { paddingTop: insets.top }]}>
          {selectedDream && (
            <DreamDetailSwipe
              dream={selectedDream}
              onClose={() => setSelectedDream(null)}
              artistName={selectedDream.artists?.name}
            />
          )}
        </View>
      </Modal>
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
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.3,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
  },
});
