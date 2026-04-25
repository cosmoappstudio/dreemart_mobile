import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useToast } from 'heroui-native';
import { useTranslation } from 'react-i18next';
import { AppText } from './app-text';
import { InterpretationBody } from './InterpretationBody';
import { Analytics } from '../lib/amplitude';
import { colors } from '../constants/theme';
import type { Dream } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const FOOTER_HEIGHT = 140;
const PAGE_HEIGHT = SCREEN_HEIGHT - FOOTER_HEIGHT;

type DreamDetailSwipeProps = {
  dream: Dream;
  onClose: () => void;
  artistName?: string;
};

export function DreamDetailSwipe({
  dream,
  onClose,
  artistName,
}: DreamDetailSwipeProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const { toast } = useToast();

  const handleSave = useCallback(async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('common.permissionRequired'),
          t('common.photoLibraryPermission')
        );
        return;
      }
      const localUri = `${FileSystem.cacheDirectory ?? ''}dream_${Date.now()}.png`;
      await FileSystem.downloadAsync(dream.image_url, localUri);
      await MediaLibrary.saveToLibraryAsync(localUri);
      await FileSystem.deleteAsync(localUri, { idempotent: true });
      Analytics.dreamSaved();
      toast.show({ label: t('generation.saved'), variant: 'success' });
    } catch (e) {
      console.error('Save error:', e);
      toast.show({ label: t('generation.saveError'), variant: 'danger' });
    }
  }, [dream.image_url, toast, t]);

  const handleShare = useCallback(async () => {
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        toast.show({ label: t('generation.shareNotSupported'), variant: 'warning' });
        return;
      }
      await Sharing.shareAsync(dream.image_url, { mimeType: 'image/png' });
    } catch (e) {
      console.error('Share error:', e);
      toast.show({ label: t('generation.shareError'), variant: 'danger' });
    }
  }, [dream.image_url, toast, t]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = e.nativeEvent.contentOffset.x;
      const index = Math.round(offset / SCREEN_WIDTH);
      setActiveIndex(index);
    },
    []
  );

  return (
    <View style={styles.container}>
      <Pressable
        style={[
          styles.closeBtn,
          { top: insets.top + 8, right: Math.max(insets.right, 12) + 4 },
        ]}
        onPress={onClose}
      >
        <View style={styles.closeBtnInner}>
          <Ionicons name="close" size={22} color={colors.text} />
        </View>
      </Pressable>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        directionalLockEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        bounces={false}
        style={styles.scrollView}
        contentContainerStyle={styles.horizontalContent}
      >
        <View style={styles.page}>
          <Image
            source={{ uri: dream.image_url }}
            style={styles.image}
            contentFit="contain"
          />
        </View>

        <View style={[styles.page, styles.interpretationPage]}>
          <ScrollView
            style={styles.interpretationScroll}
            contentContainerStyle={styles.interpretationContent}
            showsVerticalScrollIndicator={true}
            bounces={true}
            alwaysBounceVertical={true}
          >
            <View style={styles.interpretationHeader}>
              <Ionicons name="sparkles" size={18} color={colors.accent} />
              <AppText style={styles.interpretationLabel}>{t('dreamDetail.interpretation')}</AppText>
            </View>
            <InterpretationBody
              text={dream.interpretation}
              paragraphStyle={styles.interpretationText}
              gap={16}
            />
          </ScrollView>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        {artistName && (
          <View style={styles.footerMeta}>
            <View style={styles.artistBadge}>
                <Ionicons name="brush" size={14} color={colors.accent} />
              <AppText style={styles.artistName}>{artistName}</AppText>
            </View>
            <AppText style={styles.date}>
              {new Date(dream.created_at).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'short',
              })}
            </AppText>
          </View>
        )}
        <View style={styles.footerActions}>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
          onPress={handleSave}
        >
          <View style={styles.actionIconWrap}>
            <Ionicons name="download" size={18} color={colors.accent} />
          </View>
          <AppText style={styles.actionBtnText}>{t('dreamDetail.download')}</AppText>
        </Pressable>
        <View style={styles.pagination}>
          <View style={[styles.dot, activeIndex === 0 && styles.dotActive]} />
          <View style={[styles.dot, activeIndex === 1 && styles.dotActive]} />
        </View>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
          onPress={handleShare}
        >
          <View style={styles.actionIconWrap}>
            <Ionicons name="share" size={18} color={colors.accent} />
          </View>
          <AppText style={styles.actionBtnText}>{t('dreamDetail.share')}</AppText>
        </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  horizontalContent: {
    flexGrow: 1,
  },
  closeBtn: {
    position: 'absolute',
    zIndex: 10,
  },
  closeBtnInner: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  page: {
    width: SCREEN_WIDTH,
    height: PAGE_HEIGHT,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 60,
  },
  image: {
    width: '100%',
    flex: 1,
    borderRadius: 18,
  },
  footerMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  artistBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(124, 58, 237, 0.25)',
  },
  artistName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  date: {
    fontSize: 14,
    color: colors.textMuted,
  },
  interpretationPage: {
    justifyContent: 'flex-start',
  },
  interpretationScroll: {
    flex: 1,
    minHeight: 0,
  },
  interpretationContent: {
    flexGrow: 1,
    backgroundColor: 'rgba(26, 26, 46, 0.6)',
    borderRadius: 18,
    padding: 20,
    paddingBottom: 100,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.2)',
  },
  interpretationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  interpretationLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  interpretationText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 26,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.25)',
  },
  actionBtnPressed: {
    opacity: 0.85,
  },
  actionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(124, 58, 237, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: colors.accent,
    width: 24,
  },
});
