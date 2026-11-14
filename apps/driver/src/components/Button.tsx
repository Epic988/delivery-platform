import React from 'react';
import { Pressable, StyleSheet, Text, ActivityIndicator, ViewStyle } from 'react-native';
import { colors, radius, spacing, fontSize } from '@delivery/shared';

type Props = { title: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'danger' | 'success'; loading?: boolean; disabled?: boolean; style?: ViewStyle };

export function Button({ title, onPress, variant = 'primary', loading, disabled, style }: Props) {
  const bg = variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : variant === 'success' ? colors.success : colors.backgroundAlt;
  const fg = variant === 'secondary' ? colors.text : colors.textOnPrimary;
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={({ pressed }) => [styles.btn, { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 }, style]}>
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[styles.txt, { color: fg }]}>{title}</Text>}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  btn: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  txt: { fontSize: fontSize.md, fontWeight: '600' },
});
