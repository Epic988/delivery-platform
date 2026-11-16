import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, fontSize } from '../design';

export function StatusBadge({ status, label }: { status: string; label: string }) {
  let bg = colors.primaryLight; let fg = colors.primary;
  if (status === 'DELIVERED' || status === 'COMPLETED') { bg = '#D1FAE5'; fg = '#059669'; }
  if (status === 'CANCELLED' || status === 'FAILED') { bg = '#FEE2E2'; fg = '#DC2626'; }
  if (status === 'IN_TRANSIT' || status === 'PICKED_UP') { bg = '#FEF3C7'; fg = '#D97706'; }
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}
const styles = StyleSheet.create({ badge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' }, text: { fontSize: fontSize.xs, fontWeight: '700' } });
