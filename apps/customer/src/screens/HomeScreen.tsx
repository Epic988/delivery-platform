import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fontSize, radius, spacing } from '@delivery/shared';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../types';

export function HomeScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, lang, logout } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.hello}>
        {lang === 'ar' ? `مرحباً ${user?.fullName ?? ''}` : `Hello ${user?.fullName ?? ''}`}
      </Text>
      <Text style={styles.sub}>{lang === 'ar' ? 'ماذا تريد أن تفعل؟' : 'What would you like to do?'}</Text>

      <Pressable style={[styles.card, { backgroundColor: colors.primary }]} onPress={() => nav.navigate('Stores')}>
        <Text style={styles.cardTitle}>{lang === 'ar' ? 'تسوق من المتاجر' : 'Shop from stores'}</Text>
        <Text style={styles.cardSub}>{lang === 'ar' ? 'تصفح المنتجات المحلية' : 'Browse local products'}</Text>
      </Pressable>

      <Pressable style={[styles.card, { backgroundColor: colors.accent }]} onPress={() => nav.navigate('CourierRequest')}>
        <Text style={styles.cardTitle}>{lang === 'ar' ? 'أرسل طرداً' : 'Send a package'}</Text>
        <Text style={styles.cardSub}>{lang === 'ar' ? 'بين عنوانين' : 'Between two addresses'}</Text>
      </Pressable>

      <View style={styles.row}>
        <Pressable style={styles.smallBtn} onPress={() => nav.navigate('Orders')}>
          <Text style={styles.smallBtnTxt}>{lang === 'ar' ? 'طلباتي' : 'My Orders'}</Text>
        </Pressable>
        <Pressable style={styles.smallBtn} onPress={() => nav.navigate('Profile')}>
          <Text style={styles.smallBtnTxt}>{lang === 'ar' ? 'حسابي' : 'Profile'}</Text>
        </Pressable>
      </View>

      <Pressable onPress={logout} style={{ marginTop: spacing.xl, alignItems: 'center' }}>
        <Text style={{ color: colors.danger }}>{lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundAlt },
  content: { padding: spacing.lg },
  hello: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.text, marginTop: spacing.lg },
  sub: { fontSize: fontSize.md, color: colors.textMuted, marginBottom: spacing.lg },
  card: { padding: spacing.xl, borderRadius: radius.lg, marginBottom: spacing.md },
  cardTitle: { fontSize: fontSize.xl, fontWeight: '700', color: '#fff' },
  cardSub: { fontSize: fontSize.sm, color: '#fff', marginTop: spacing.xs, opacity: 0.9 },
  row: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  smallBtn: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  smallBtnTxt: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
});
