import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { DreamBackground } from '../components/DreamBackground';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { AppText } from '../components/app-text';
import { GenerationLoader } from '../components/GenerationLoader';
import { useAuth } from '../contexts/auth-context';
import { useToast } from 'heroui-native';
import { generateDream } from '../lib/api';
import { InterpretationBody } from '../components/InterpretationBody';
import { Analytics } from '../lib/amplitude';
import { colors } from '../constants/theme';

export default function GenerationScreen() {
  const { t } = useTranslation();
  const { prompt, artist_id, rid } = useLocalSearchParams<{
    prompt: string;
    artist_id: string;
    rid?: string;
  }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [errorType, setErrorType] = useState<
    'insufficient_credits' | 'artist_locked' | 'generic'
  >('generic');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [dreamId, setDreamId] = useState<string | null>(null);

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId } = useAuth();
  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  /** toast/router referansları her render'da değişebildiği için effect'i onlara bağlamıyoruz; aynı isteği iki kez göndermeyi engelliyoruz. */
  const firedForKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId || !prompt || !artist_id) {
      router.back();
      return;
    }

    const dedupeKey = rid ?? `${userId}|${prompt}|${artist_id}`;
    if (firedForKeyRef.current === dedupeKey) {
      return;
    }
    firedForKeyRef.current = dedupeKey;

    let mounted = true;

    generateDream({ userId, prompt, artistId: artist_id })
      .then((data) => {
        if (mounted) {
          setImageUrl(data.image_url);
          setInterpretation(data.interpretation);
          setDreamId(data.dream_id);
          setStatus('success');
          Analytics.dreamGenerated(data.dream_id);
        }
      })
      .catch((err) => {
        if (mounted) {
          setStatus('error');
          setErrorType(
            err.message === 'insufficient_credits'
              ? 'insufficient_credits'
              : err.message === 'artist_locked'
                ? 'artist_locked'
                : 'generic'
          );
          const msg =
            err.message === 'insufficient_credits'
              ? t('errors.insufficientCredits')
              : err.message === 'artist_locked'
                ? t('errors.artistLocked')
                : t('generation.error');
          toastRef.current.show({ label: msg, variant: 'danger' });
        }
      });

    return () => {
      mounted = false;
      firedForKeyRef.current = null;
    };
    // rid: her "Oluştur" tıklamasında benzersiz; toast/router bilinçli olarak dışarıda.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnızca gerçek üretim girdileri yeniden tetiklemeli
  }, [userId, prompt, artist_id, rid]);

  const handleSave = useCallback(async () => {
    if (!imageUrl) return;
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
      await FileSystem.downloadAsync(imageUrl, localUri);
      await MediaLibrary.saveToLibraryAsync(localUri);
      await FileSystem.deleteAsync(localUri, { idempotent: true });
      Analytics.dreamSaved();
      toast.show({ label: t('generation.saved'), variant: 'success' });
    } catch (e) {
      console.error('Save error:', e);
      toast.show({ label: t('generation.saveError'), variant: 'danger' });
    }
  }, [imageUrl, toast]);

  const handleShare = useCallback(async () => {
    if (!imageUrl) return;
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        toast.show({ label: t('generation.shareNotSupported'), variant: 'warning' });
        return;
      }
      await Sharing.shareAsync(imageUrl, {
        mimeType: 'image/png',
      });
    } catch (e) {
      console.error('Share error:', e);
      toast.show({ label: t('generation.shareError'), variant: 'danger' });
    }
  }, [imageUrl, toast]);

  const handleNewDream = useCallback(() => {
    router.replace('/(tabs)/dream');
  }, [router]);

  const handleClose = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/dream');
    }
  }, [router]);

  if (status === 'loading') {
    return (
      <DreamBackground style={[styles.container, { paddingTop: insets.top }]}>
        <GenerationLoader />
      </DreamBackground>
    );
  }

  if (status === 'error') {
    return (
      <DreamBackground style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContent}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
          <AppText style={styles.errorText}>
            {errorType === 'insufficient_credits'
              ? t('errors.insufficientCredits')
              : errorType === 'artist_locked'
                ? t('errors.artistLocked')
                : t('generation.error')}
          </AppText>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <AppText style={styles.backBtnText}>{t('generation.back')}</AppText>
          </Pressable>
        </View>
      </DreamBackground>
    );
  }

  return (
    <DreamBackground style={[styles.container, { paddingTop: insets.top }]}>
      <Pressable
        style={[
          styles.closeBtn,
          { top: insets.top + 8, right: Math.max(insets.right, 12) + 4 },
        ]}
        onPress={handleClose}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={t('generation.close')}
      >
        <View style={styles.closeBtnInner}>
          <Ionicons name="close" size={22} color={colors.text} />
        </View>
      </Pressable>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {imageUrl && (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="contain"
          />
        )}
        {interpretation && (
          <View style={styles.interpretation}>
            <AppText style={styles.interpretationLabel}>{t('generation.interpretation')}</AppText>
            <InterpretationBody
              text={interpretation}
              paragraphStyle={styles.interpretationText}
              gap={14}
            />
          </View>
        )}
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={styles.actionBtn} onPress={handleSave}>
          <Ionicons name="download" size={22} color={colors.text} />
          <AppText style={styles.actionBtnText}>{t('generation.save')}</AppText>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={handleShare}>
          <Ionicons name="share" size={22} color={colors.text} />
          <AppText style={styles.actionBtnText}>{t('generation.share')}</AppText>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={handleNewDream}>
          <Ionicons name="add-circle" size={22} color={colors.primaryLight} />
          <AppText style={[styles.actionBtnText, { color: colors.primaryLight }]}>
            {t('generation.newDream')}
          </AppText>
        </Pressable>
      </View>
    </DreamBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeBtn: {
    position: 'absolute',
    zIndex: 20,
  },
  closeBtnInner: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 24,
  },
  image: {
    width: '100%',
    aspectRatio: 9 / 16,
    borderRadius: 16,
  },
  interpretation: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  interpretationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 8,
  },
  interpretationText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  errorContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    color: colors.text,
  },
  backBtn: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryLight,
  },
});
