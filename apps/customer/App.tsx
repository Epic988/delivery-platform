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
import { RegisterScreen } from './src/screens/RegisterScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { StoresScreen } from './src/screens/StoresScreen';
import { StoreDetailsScreen } from './src/screens/StoreDetailsScreen';
import { ProductsScreen } from './src/screens/ProductsScreen';
import { CartScreen } from './src/screens/CartScreen';
import { AddressesScreen } from './src/screens/AddressesScreen';
import { CheckoutScreen } from './src/screens/CheckoutScreen';
import { CourierRequestScreen } from './src/screens/CourierRequestScreen';
import { OrdersScreen } from './src/screens/OrdersScreen';
import { OrderDetailsScreen } from './src/screens/OrderDetailsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

I18nManager.allowRTL(true);
try { I18nManager.forceRTL(true); } catch {}

const Stack = createNativeStackNavigator<RootStackParamList>();

function Root() {
  const { ready, user } = useAuth();
  if (!ready) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.primary }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: '700' } }}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'إنشاء حساب' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'توصيل' }} />
          <Stack.Screen name="Stores" component={StoresScreen} options={{ title: 'المتاجر' }} />
          <Stack.Screen name="StoreDetails" component={StoreDetailsScreen} options={{ title: 'تفاصيل' }} />
          <Stack.Screen name="Products" component={ProductsScreen} options={({ route }) => ({ title: route.params.title })} />
          <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'السلة' }} />
          <Stack.Screen name="Addresses" component={AddressesScreen} options={{ title: 'العناوين' }} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'الدفع' }} />
          <Stack.Screen name="CourierRequest" component={CourierRequestScreen} options={{ title: 'طلب توصيل' }} />
          <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: 'طلباتي' }} />
          <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} options={{ title: 'تفاصيل الطلب' }} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'حسابي' }} />
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
