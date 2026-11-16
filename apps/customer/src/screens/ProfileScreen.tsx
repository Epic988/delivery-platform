import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '@delivery/shared';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';

const COPY = {
  en: {
    title: 'Profile',
    subtitle: 'Manage your account and preferences',
    accountSection: 'Account',
    nameLabel: 'Name',
    phoneLabel: 'Phone',
    languageSection: 'Language',
    arabic: 'العربية',
    english: 'English',
    logout: 'Logout',
    logoutConfirmTitle: 'Logout',
    logoutConfirmMsg: 'Are you sure you want to logout?',
    cancel: 'Cancel',
    noUser: '—',
  },
  ar: {
    title: 'حسابي',
    subtitle: 'إدارة الحساب والتفضيلات',
    accountSection: 'الحساب',
    nameLabel: 'الاسم',
    phoneLabel: 'الهاتف',
    languageSection: 'اللغة',
    arabic: 'العربية',
    english: 'English',
    logout: 'تسجيل الخروج',
    logoutConfirmTitle: 'تسجيل الخروج',
    logoutConfirmMsg: 'هل تريد تسجيل الخروج؟',
    cancel: 'إلغاء',
    noUser: '—',
  },
} as const;

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, lang, logout, setLang } = useAuth();
  const t = COPY[lang === 'ar' ? 'ar' : 'en'];
  const [loggingOut, setLoggingOut] = useState(false);

  const onLogoutPress = () => {
    Alert.alert(t.logoutConfirmTitle, t.logoutConfirmMsg, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.logout,
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await logout();
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        padding: spacing.lg,
        paddingBottom: spacing.xxl + insets.bottom,
      }}
    >
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={36} color={colors.primary} />
        </View>
        <Text style={styles.heroTitle}>{t.title}</Text>
        <Text style={styles.heroSub}>{t.subtitle}</Text>
      </View>

      <Text style={styles.sectionLabel}>{t.accountSection}</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t.nameLabel}</Text>
          <Text style={styles.rowValue} numberOfLines={1}>{user?.fullName ?? t.noUser}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t.phoneLabel}</Text>
          <Text style={styles.rowValue} numberOfLines={1}>{user?.phone ?? t.noUser}</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>{t.languageSection}</Text>
      <View style={styles.langRow}>
        <Pressable
          onPress={() => setLang('ar')}
          style={[styles.langBtn, lang === 'ar' && styles.langActive]}
        >
          <Text style={[styles.langTxt, lang === 'ar' && styles.langTxtActive]}>{t.arabic}</Text>
        </Pressable>
        <Pressable
          onPress={() => setLang('en')}
          style={[styles.langBtn, lang === 'en' && styles.langActive]}
        >
          <Text style={[styles.langTxt, lang === 'en' && styles.langTxtActive]}>{t.english}</Text>
        </Pressable>
      </View>

      <Button
        title={t.logout}
        onPress={onLogoutPress}
        loading={loggingOut}
        variant="danger"
        style={{ marginTop: spacing.xl }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heroTitle: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  heroSub: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  sectionLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  rowValue: { fontSize: fontSize.md, color: colors.text, fontWeight: '600', flexShrink: 1, marginLeft: spacing.md },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  langRow: { flexDirection: 'row', gap: spacing.md },
  langBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  langActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  langTxt: { color: colors.text, fontWeight: '600' },
  langTxtActive: { color: colors.primary },
});