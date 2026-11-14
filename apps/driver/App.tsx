import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, I18nManager, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors, fontSize, spacing } from '@delivery/shared';
import { loadToken } from './src/lib/api';

I18nManager.allowRTL(true);
try { I18nManager.forceRTL(true); } catch {}

export default function App() {
  const [boot, setBoot] = useState<'loading' | 'ready'>('loading');
  useEffect(() => { loadToken().finally(() => setBoot('ready')); }, []);

  if (boot === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.text}>جاري التحميل...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View style={styles.center}>
        <Text style={styles.title}>توصيل — السائق</Text>
        <Text style={styles.text}>Phase 5 scaffold · جاهز للشاشات</Text>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: spacing.lg },
  title: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.text, marginBottom: spacing.sm, textAlign: 'center' },
  text: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center' },
});
