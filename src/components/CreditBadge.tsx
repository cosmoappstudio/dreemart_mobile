import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './app-text';
import { colors } from '../constants/theme';

type CreditBadgeProps = {
  credits: number;
  onPress?: () => void;
};

export function CreditBadge({ credits, onPress }: CreditBadgeProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.badge, pressed && styles.badgePressed]}
      disabled={!onPress}
    >
      <Ionicons name="flash" size={18} color={colors.accent} />
      <AppText style={styles.text}>{credits}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgePressed: {
    opacity: 0.8,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent,
  },
});
