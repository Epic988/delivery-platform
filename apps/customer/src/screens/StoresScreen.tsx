import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Store, colors, fontSize, radius, spacing } from '@delivery/shared';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../types';

export function StoresScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { lang } = useAuth();
  const [data, setData] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.stores({ pageSize: 50 }).then((r) => setData(r.data)).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  if (err) return <View style={styles.center}><Text style={{ color: colors.danger }}>{err}</Text></View>;

  return (
    <FlatList
      style={{ backgroundColor: colors.backgroundAlt }}
      contentContainerStyle={{ padding: spacing.lg }}
      data={data}
      keyExtractor={(s) => s.id}
      ListEmptyComponent={<Text style={styles.empty}>{lang === 'ar' ? 'لا توجد متاجر' : 'No stores'}</Text>}
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => nav.navigate('StoreDetails', { slug: item.slug })}>
          <Text style={styles.name}>{lang === 'ar' ? item.nameAr : item.nameEn ?? item.nameAr}</Text>
          <Text style={styles.addr}>{item.addressText}</Text>
          <Text style={[styles.status, { color: item.isOpen ? colors.success : colors.danger }]}>
            {item.isOpen ? (lang === 'ar' ? 'مفتوح' : 'Open') : (lang === 'ar' ? 'مغلق' : 'Closed')}
          </Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundAlt },
  card: { backgroundColor: colors.background, padding: spacing.lg, borderRadius: radius.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  name: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  addr: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
  status: { fontSize: fontSize.sm, fontWeight: '600', marginTop: spacing.xs },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xxl },
});
