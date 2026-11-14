import 'react-native-gesture-handler';
import React from 'react';
import { ActivityIndicator, I18nManager, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@delivery/shared';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import type { RootStackParamList } from './src/types';
import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { AssignmentDetailsScreen } from './src/screens/AssignmentDetailsScreen';
import { ProofScreen } from './src/screens/ProofScreen';

I18nManager.allowRTL(true);
try { I18nManager.forceRTL(true); } catch {}

const Stack = createNativeStackNavigator<RootStackParamList>();

function Root() {
  const { ready, user } = useAuth();
  if (!ready) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.primary }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: '700' } }}>
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'توصيل — السائق' }} />
          <Stack.Screen name="AssignmentDetails" component={AssignmentDetailsScreen} options={{ title: 'التعيين' }} />
          <Stack.Screen name="Proof" component={ProofScreen} options={{ title: 'إثبات التسليم' }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthProvider>
        <NavigationContainer>
          <Root />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
