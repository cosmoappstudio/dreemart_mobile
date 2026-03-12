import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, TextInput, View } from 'react-native';
import { AppText } from './app-text';
import { colors } from '../constants/theme';

const MAX_LENGTH = 2000;

type DreamInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  editable?: boolean;
};

export function DreamInput({
  value,
  onChangeText,
  placeholder = 'Dün gece sonsuz bir merdivene tırmanıyordum...',
  label,
  editable = true,
}: DreamInputProps) {
  const handleChange = (text: string) => {
    if (text.length <= MAX_LENGTH) onChangeText(text);
  };

  const progress = value.length / MAX_LENGTH;

  return (
    <View style={styles.wrapper}>
      <View style={styles.accentBar} />
      <View style={styles.container}>
        {Platform.OS === 'ios' ? (
          <>
            <BlurView intensity={40} tint="dark" style={styles.blur} />
            <View style={styles.glassOverlay} />
          </>
        ) : (
          <View style={styles.androidFallback} />
        )}
        <View style={styles.content}>
          {label && (
            <View style={styles.inputHeader}>
              <Ionicons name="moon" size={14} color={colors.textMuted} />
              <AppText style={styles.inputLabel}>{label}</AppText>
            </View>
          )}
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={handleChange}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            editable={editable}
            textAlignVertical="top"
          />
          <View style={styles.footer}>
            <View style={[styles.progressTrack, editable && styles.progressTrackActive]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(progress * 100, 100)}%` },
                ]}
              />
            </View>
            <AppText style={styles.counterText}>
              {value.length}
              <AppText style={styles.counterMax}> / {MAX_LENGTH}</AppText>
            </AppText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    minHeight: 160,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
    opacity: 0.6,
  },
  container: {
    marginLeft: 8,
    minHeight: 160,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 26, 0.2)',
  },
  androidFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 18, 42, 0.85)',
  },
  content: {
    padding: 16,
    paddingTop: 12,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  input: {
    paddingHorizontal: 0,
    paddingTop: 4,
    paddingBottom: 12,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    minHeight: 100,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 0,
    paddingTop: 4,
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressTrackActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  counterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  counterMax: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textMuted,
  },
});
