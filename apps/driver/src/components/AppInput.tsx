import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, radius, spacing, fontSize } from '@delivery/shared';
type Props = TextInputProps & { label?: string; error?: string; };
export function AppInput({ label, error, style, ...rest }: Props) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput style={[styles.input, error ? { borderColor: colors.danger } : null, style]} placeholderTextColor={colors.textMuted} {...rest} />
      {error ? <Text style={styles.err}>{error}</Text> : null}
    </View>
  );
}
const styles = StyleSheet.create({ label: { fontSize: fontSize.sm, color: colors.text, marginBottom: spacing.xs, fontWeight: '600' }, input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: fontSize.md, color: colors.text, backgroundColor: colors.surface }, err: { color: colors.danger, fontSize: fontSize.xs, marginTop: spacing.xs } });
