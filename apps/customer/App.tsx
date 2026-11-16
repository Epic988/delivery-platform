import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
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
  const { ready, user, lang } = useAuth();
  const nav = {
    register: lang === 'ar' ? 'إنشاء حساب' : 'Register',
    stores: lang === 'ar' ? 'المتاجر' : 'Stores',
    storeDetails: lang === 'ar' ? 'تفاصيل المتجر' : 'Store Details',
    products: lang === 'ar' ? 'المنتجات' : 'Products',
    addresses: lang === 'ar' ? 'العناوين' : 'Addresses',
    checkout: lang === 'ar' ? 'الدفع' : 'Checkout',
    courier: lang === 'ar' ? 'طلب توصيل' : 'Courier Request',
    orderDetails: lang === 'ar' ? 'تفاصيل الطلب' : 'Order Details',
  };

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.textOnPrimary,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: nav.register }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Home" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="Stores" component={StoresScreen} options={{ title: nav.stores }} />
          <Stack.Screen name="StoreDetails" component={StoreDetailsScreen} options={{ title: nav.storeDetails }} />
          <Stack.Screen
            name="Products"
            component={ProductsScreen}
            options={({ route }) => ({ title: route.params?.title ?? nav.products })}
          />
          <Stack.Screen name="Addresses" component={AddressesScreen} options={{ title: nav.addresses }} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: nav.checkout }} />
          <Stack.Screen name="CourierRequest" component={CourierRequestScreen} options={{ title: nav.courier }} />
          <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} options={{ title: nav.orderDetails }} />
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
