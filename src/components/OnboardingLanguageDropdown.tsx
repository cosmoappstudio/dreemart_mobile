import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  UIManager,
  View,
} from 'react-native';
import { AppText } from './app-text';
import { colors } from '../constants/theme';
import {
  LANGUAGE_FLAG_EMOJI,
  LANGUAGE_LABELS,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from '../i18n';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SORTED = [...SUPPORTED_LANGUAGES].sort((a, b) =>
  LANGUAGE_LABELS[a].localeCompare(LANGUAGE_LABELS[b], undefined, {
    sensitivity: 'base',
    numeric: true,
  })
);

type Props = {
  selectedLang: SupportedLanguage;
  onSelect: (lng: SupportedLanguage) => void;
};

export function OnboardingLanguageDropdown({ selectedLang, onSelect }: Props) {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  }, []);

  const pick = useCallback(
    (lng: SupportedLanguage) => {
      if (Platform.OS !== 'web') {
        void Haptics.selectionAsync();
      }
      onSelect(lng);
      setOpen(false);
    },
    [onSelect]
  );

  const label = LANGUAGE_LABELS[selectedLang];
  const flag = LANGUAGE_FLAG_EMOJI[selectedLang];

  const rows = useMemo(
    () =>
      SORTED.map((lng) => ({
        lng,
        label: LANGUAGE_LABELS[lng],
        flag: LANGUAGE_FLAG_EMOJI[lng],
        selected: lng === selectedLang,
      })),
    [selectedLang]
  );

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={label}
        onPress={toggle}
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
      >
        <AppText style={styles.triggerFlag}>{flag}</AppText>
        <AppText style={styles.triggerLabel} numberOfLines={1}>
          {label}
        </AppText>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={colors.textMuted}
        />
      </Pressable>

      {open ? (
        <View style={styles.panel}>
          <ScrollView
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
          >
            {rows.map(({ lng, label: rowLabel, flag: rowFlag, selected }) => (
              <Pressable
                key={lng}
                accessibilityRole="menuitem"
                accessibilityState={{ selected }}
                onPress={() => pick(lng)}
                style={({ pressed }) => [
                  styles.row,
                  selected && styles.rowSelected,
                  pressed && styles.rowPressed,
                ]}
              >
                <AppText style={styles.rowFlag}>{rowFlag}</AppText>
                <AppText style={styles.rowLabel} numberOfLines={1}>
                  {rowLabel}
                </AppText>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
                ) : (
                  <View style={styles.radio} />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 20,
    zIndex: 2,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.35)',
  },
  triggerPressed: {
    opacity: 0.92,
  },
  triggerFlag: {
    fontSize: 26,
    lineHeight: 32,
  },
  triggerLabel: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  panel: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
    backgroundColor: 'rgba(13, 10, 20, 0.92)',
    overflow: 'hidden',
    maxHeight: 280,
  },
  scroll: {
    maxHeight: 280,
  },
  scrollContent: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  rowSelected: {
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
  },
  rowPressed: {
    opacity: 0.9,
  },
  rowFlag: {
    fontSize: 22,
    lineHeight: 28,
    width: 36,
    textAlign: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(196, 181, 253, 0.45)',
  },
});
