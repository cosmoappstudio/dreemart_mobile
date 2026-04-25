import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './app-text';
import { colors } from '../constants/theme';
import {
  LANGUAGE_ENGLISH_NAMES,
  LANGUAGE_LABELS,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from '../i18n';

type Props = {
  visible: boolean;
  onClose: () => void;
  currentLanguage: SupportedLanguage;
  onSelect: (lng: SupportedLanguage) => void;
  title: string;
  searchPlaceholder: string;
  noResultsText: string;
};

const SORTED_LANGUAGES = [...SUPPORTED_LANGUAGES].sort((a, b) =>
  LANGUAGE_LABELS[a].localeCompare(LANGUAGE_LABELS[b], undefined, {
    sensitivity: 'base',
    numeric: true,
  })
);

function matchesQuery(lng: SupportedLanguage, q: string): boolean {
  if (!q) return true;
  const native = LANGUAGE_LABELS[lng].toLowerCase();
  const english = LANGUAGE_ENGLISH_NAMES[lng].toLowerCase();
  return (
    native.includes(q) ||
    english.includes(q) ||
    lng.includes(q) ||
    english.replace(/\s+/g, ' ').includes(q)
  );
}

export function LanguagePickerModal({
  visible,
  onClose,
  currentLanguage,
  onSelect,
  title,
  searchPlaceholder,
  noResultsText,
}: Props) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!visible) {
      setQuery('');
      Keyboard.dismiss();
    }
  }, [visible]);

  const normalizedQuery = query.trim().toLowerCase();

  const filtered = useMemo(
    () => SORTED_LANGUAGES.filter((lng) => matchesQuery(lng, normalizedQuery)),
    [normalizedQuery]
  );

  const sheetMaxHeight = Math.min(windowHeight * 0.88, 620);

  const handleBackdrop = useCallback(() => {
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  const handlePick = useCallback(
    (lng: SupportedLanguage) => {
      if (Platform.OS !== 'web') {
        void Haptics.selectionAsync();
      }
      Keyboard.dismiss();
      onSelect(lng);
    },
    [onSelect]
  );

  const renderItem = useCallback(
    ({ item: lng }: { item: SupportedLanguage }) => {
      const selected = lng === currentLanguage;
      return (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected }}
          accessibilityLabel={`${LANGUAGE_LABELS[lng]}, ${LANGUAGE_ENGLISH_NAMES[lng]}`}
          onPress={() => handlePick(lng)}
          style={({ pressed }) => [
            styles.row,
            selected && styles.rowSelected,
            pressed && styles.rowPressed,
          ]}
        >
          <View style={styles.rowTextBlock}>
            <AppText style={styles.rowPrimary} numberOfLines={1}>
              {LANGUAGE_LABELS[lng]}
            </AppText>
            <AppText style={styles.rowSecondary} numberOfLines={1}>
              {`${LANGUAGE_ENGLISH_NAMES[lng]} · ${lng.toUpperCase()}`}
            </AppText>
          </View>
          {selected ? (
            <Ionicons name="checkmark-circle" size={24} color={colors.accent} />
          ) : (
            <View style={styles.radioOuter} />
          )}
        </Pressable>
      );
    },
    [currentLanguage, handlePick]
  );

  const keyExtractor = useCallback((lng: SupportedLanguage) => lng, []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleBackdrop}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.root}>
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityLabel="Close"
            accessibilityRole="button"
            onPress={handleBackdrop}
          >
            <View style={styles.backdrop} />
          </Pressable>

          <View style={[styles.sheet, { height: sheetMaxHeight }]}>
            {Platform.OS === 'ios' ? (
              <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
            ) : (
              <View style={styles.sheetBgAndroid} />
            )}

            <View
              style={[
                styles.sheetInner,
                { paddingBottom: Math.max(insets.bottom, 12) },
              ]}
            >
              <View style={styles.handleWrap}>
                <View style={styles.handle} />
              </View>

              <View style={styles.header}>
                <View style={styles.headerTitles}>
                  <AppText style={styles.title}>{title}</AppText>
                </View>
                <Pressable
                  onPress={handleBackdrop}
                  hitSlop={12}
                  style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Ionicons name="close" size={26} color={colors.textMuted} />
                </Pressable>
              </View>

              <View style={styles.searchWrap}>
                <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={searchPlaceholder}
                  placeholderTextColor={colors.textMuted}
                  style={styles.searchInput}
                  autoCorrect={false}
                  autoCapitalize="none"
                  clearButtonMode="while-editing"
                  returnKeyType="search"
                />
                {query.length > 0 && Platform.OS === 'android' ? (
                  <Pressable onPress={() => setQuery('')} hitSlop={8} style={styles.clearBtn}>
                    <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                  </Pressable>
                ) : null}
              </View>

              <FlatList
                style={styles.list}
                data={filtered}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListEmptyComponent={
                  <View style={styles.empty}>
                    <Ionicons name="globe-outline" size={40} color={colors.textMuted} />
                    <AppText style={styles.emptyText}>{noResultsText}</AppText>
                  </View>
                }
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.35)',
    borderBottomWidth: 0,
  },
  sheetBgAndroid: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surface,
  },
  sheetInner: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  headerTitles: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  closeBtn: {
    padding: 4,
    marginTop: -2,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 4,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.28)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: Platform.OS === 'android' ? 10 : 0,
  },
  clearBtn: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    minHeight: 56,
  },
  rowSelected: {
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.35)',
  },
  rowPressed: {
    opacity: 0.92,
  },
  rowTextBlock: {
    flex: 1,
    marginRight: 12,
  },
  rowPrimary: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  rowSecondary: {
    marginTop: 3,
    fontSize: 13,
    color: colors.textMuted,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(196, 181, 253, 0.45)',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    marginLeft: 12,
    marginRight: 12,
  },
  empty: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
