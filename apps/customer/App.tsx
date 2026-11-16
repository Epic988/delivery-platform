import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
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

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { paddingBottom: 8, paddingTop: 8, height: 64, borderTopWidth: 1, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => {
          let iconName: any = 'home';
          if (route.name === 'HomeTab') iconName = 'home';
          else if (route.name === 'OrdersTab') iconName = 'receipt';
          else if (route.name === 'CartTab') iconName = 'cart';
          else if (route.name === 'ProfileTab') iconName = 'person';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'الرئيسية' }} />
      <Tab.Screen name="OrdersTab" component={OrdersScreen} options={{ title: 'طلباتي' }} />
      <Tab.Screen name="CartTab" component={CartScreen} options={{ title: 'السلة' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'حسابي' }} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { ready, user } = useAuth();

  if (!ready) {
    return <></>; // Splash screen placeholder
  }

  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.primary }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: '700' } }}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'إنشاء حساب' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Home" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="Stores" component={StoresScreen} options={{ title: 'المتاجر' }} />
          <Stack.Screen name="StoreDetails" component={StoreDetailsScreen} options={{ title: 'تفاصيل المتجر' }} />
          <Stack.Screen name="Products" component={ProductsScreen} options={({ route }) => ({ title: route.params?.title ?? 'المنتجات' })} />
          <Stack.Screen name="Addresses" component={AddressesScreen} options={{ title: 'العناوين' }} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'الدفع' }} />
          <Stack.Screen name="CourierRequest" component={CourierRequestScreen} options={{ title: 'طلب توصيل' }} />
          <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} options={{ title: 'تفاصيل الطلب' }} />
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
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
