// app/_layout.tsx
// Layout หลักของแอป: ครอบ Provider ทั้งหมด + ตั้งค่า Tab Navigator
// และทำหน้าที่ auth-guard: ถ้ายังไม่ล็อกอิน จะเด้งไปหน้า /login เสมอ

import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { COLORS } from '../constants/theme';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { CartProvider, useCart } from '../context/CartContext';
import { FavoritesProvider } from '../context/FavoritesContext';
import { LanguageProvider, useLanguage } from '../context/LanguageContext';
import { ProductsProvider } from '../context/ProductsContext';

function RootNavigator() {
  const { user, isLoading } = useAuth();
  const { totalItems } = useCart();
  const { t } = useLanguage();
  const router = useRouter();
  const segments = useSegments();

  // --- Auth guard: สลับหน้าอัตโนมัติตามสถานะล็อกอิน และสิทธิ์ผู้ใช้ ---
  useEffect(() => {
    if (isLoading) return;
    const currentScreen = (segments as string[])[segments.length - 1];
    const isAuthScreen = currentScreen === 'login' || currentScreen === 'register';

    if (!user && !isAuthScreen) {
      router.replace('/login');
    } else if (user && isAuthScreen) {
      router.replace('/');
    } else if (user && user.role !== 'admin' && (currentScreen === 'add' || currentScreen === 'finances')) {
      // 🔒 ป้องกันผู้ใช้ทั่วไป (role: user) เข้าถึงเส้นทางของ Admin
      router.replace('/');
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  const isAdmin = user?.role === 'admin';

  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: COLORS.gold,
          tabBarInactiveTintColor: 'rgba(255,255,255,0.55)',
          tabBarStyle: {
            backgroundColor: COLORS.navy,
            borderTopWidth: 0,
            height: 66,
            paddingBottom: 10,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('nav.home'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="brand"
          options={{
            title: t('nav.brand'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="ribbon" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: t('nav.add'),
            // 🔒 แสดงแท็บเพิ่มสินค้าเฉพาะ Admin เท่านั้น
            href: isAdmin ? '/add' : null,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="add-circle" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: t('nav.favorites'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="heart" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            title: t('nav.cart'),
            tabBarBadge: totalItems > 0 ? totalItems : undefined,
            tabBarBadgeStyle: { backgroundColor: COLORS.gold, color: COLORS.navy },
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cart" size={size} color={color} />
            ),
          }}
        />
        {/* หน้าพิเศษที่ซ่อนจาก tab bar */}
        <Tabs.Screen
          name="product/[id]"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="finances"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="categories"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="login"
          options={{
            href: null,
            tabBarStyle: { display: 'none' },
          }}
        />
        <Tabs.Screen
          name="register"
          options={{
            href: null,
            tabBarStyle: { display: 'none' },
          }}
        />
      </Tabs>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <ProductsProvider>
            <CartProvider>
              <FavoritesProvider>
                <RootNavigator />
              </FavoritesProvider>
            </CartProvider>
          </ProductsProvider>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.navy,
  },
});

