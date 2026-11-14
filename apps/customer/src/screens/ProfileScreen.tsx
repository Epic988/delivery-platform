import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '@delivery/shared';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';

export function ProfileScreen() {
  const { user, lang, logout, setLang } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={styles.card}>
        <Text style={styles.name}>{user?.fullName ?? '—'}</Text>
        <Text style={styles.phone}>{user?.phone ?? '—'}</Text>
      </View>

      <Text style={styles.h}>{lang === 'ar' ? 'اللغة' : 'Language'}</Text>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Pressable onPress={() => setLang('ar')} style={[styles.langBtn, lang === 'ar' && styles.langActive]}>
          <Text style={[styles.langTxt, lang === 'ar' && styles.langTxtActive]}>العربية</Text>
        </Pressable>
        <Pressable onPress={() => setLang('en')} style={[styles.langBtn, lang === 'en' && styles.langActive]}>
          <Text style={[styles.langTxt, lang === 'en' && styles.langTxtActive]}>English</Text>
        </Pressable>
      </View>

      <Button title={lang === 'ar' ? 'تسجيل الخروج' : 'Logout'} onPress={logout} variant="danger" style={{ marginTop: spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundAlt },
  card: { backgroundColor: colors.background, padding: spacing.xl, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg },
  name: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  phone: { fontSize: fontSize.md, color: colors.textMuted, marginTop: spacing.xs },
  h: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  langBtn: { flex: 1, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.background },
  langActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  langTxt: { color: colors.text, fontWeight: '600' },
  langTxtActive: { color: colors.primary },
});
