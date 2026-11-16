import React from 'react';
import { Pressable, StyleSheet, Text, ActivityIndicator, ViewStyle } from 'react-native';
import { colors, radius, spacing, fontSize } from '../design';

type Props = { title: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'danger' | 'outline'; loading?: boolean; disabled?: boolean; style?: ViewStyle; };
export function AppButton({ title, onPress, variant = 'primary', loading, disabled, style }: Props) {
  const bg = variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : variant === 'secondary' ? colors.primaryLight : colors.surface;
  const fg = variant === 'outline' || variant === 'secondary' ? colors.primary : colors.textOnPrimary;
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={({ pressed }) => [styles.btn, { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.8 : 1, borderWidth: variant === 'outline' ? 1 : 0, borderColor: colors.primary }, style]}>
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[styles.txt, { color: fg }]}>{title}</Text>}
    </Pressable>
  );
}
const styles = StyleSheet.create({ btn: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', minHeight: 52 }, txt: { fontSize: fontSize.md, fontWeight: '700' } });
