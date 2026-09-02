// frontend/src/app/orders.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_ENDPOINTS } from '../constants/api';
import { BRAND, COLORS, RADIUS, SPACING } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  color: string;
  price: number;
  quantity: number;
  subtotal: number;
  imageUrl?: string;
  capacity?: string;
  model?: string;
}

interface Order {
  id: number;
  orderNumber: string;
  totalAmount: number;
  shippingFee: number;
  totalItems: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

export default function OrdersScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { t } = useLanguage();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchOrders = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.ORDERS, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Fetch orders error:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchOrders();
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const formattedDate = new Date(item.createdAt).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View style={styles.orderCard}>
        {/* Order Card Header */}
        <View style={styles.orderHeader}>
          <View style={{ flex: 1 }}>
            <View style={styles.orderNoRow}>
              <Ionicons name="receipt-outline" size={16} color={COLORS.gold} />
              <Text style={styles.orderNumber}>{item.orderNumber}</Text>
            </View>
            <Text style={styles.orderDate}>{formattedDate}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#059669" />
            <Text style={styles.statusText}>{t('orders.statusCompleted')}</Text>
          </View>
        </View>

        {/* Order Items List */}
        <View style={styles.itemsDivider} />
        {item.items && item.items.map((it, idx) => (
          <View key={idx} style={styles.itemRow}>
            <Image
              source={{ uri: it.imageUrl || 'https://via.placeholder.com/100?text=PowerBank' }}
              style={styles.itemThumb}
              resizeMode="contain"
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName} numberOfLines={1}>{it.productName}</Text>
              <View style={styles.itemMetaRow}>
                {it.color ? (
                  <View style={styles.colorDotRow}>
                    <View style={[styles.colorDot, { backgroundColor: it.color }]} />
                  </View>
                ) : null}
                <Text style={styles.itemMeta}>
                  {t('orders.qty', { qty: it.quantity })} {it.capacity ? `• ${it.capacity}` : ''}
                </Text>
              </View>
            </View>
            <Text style={styles.itemPrice}>
              {BRAND.currency}{Number(it.subtotal).toLocaleString()}
            </Text>
          </View>
        ))}

        {/* Order Card Footer */}
        <View style={styles.orderFooter}>
          <Text style={styles.footerLabel}>
            {t('orders.itemsList', { count: item.totalItems })}
          </Text>
          <View style={styles.totalWrap}>
            <Text style={styles.totalLabel}>{t('orders.totalAmount')}:</Text>
            <Text style={styles.totalValue}>
              {BRAND.currency}{Number(item.totalAmount).toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('orders.title')}</Text>
        <View style={{ width: 32 }} />
      </View>

      {isLoading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={COLORS.gold} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="bag-check-outline" size={68} color={COLORS.border} />
          <Text style={styles.emptyTitle}>{t('orders.emptyTitle')}</Text>
          <Text style={styles.emptySub}>{t('orders.emptySub')}</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => router.replace('/')}>
            <Text style={styles.shopBtnText}>{t('orders.startShopping')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.gold}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.offWhite },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.navy },
  list: { padding: SPACING.lg, paddingBottom: SPACING.xl },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: SPACING.sm,
  },
  orderNoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orderNumber: { fontSize: 14, fontWeight: '700', color: COLORS.navy },
  orderDate: { fontSize: 12, color: COLORS.grayText, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusText: { fontSize: 11, fontWeight: '700', color: '#059669' },
  itemsDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 8 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  itemThumb: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemName: { fontSize: 13, fontWeight: '700', color: COLORS.navy },
  itemMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  colorDotRow: { flexDirection: 'row', alignItems: 'center' },
  colorDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: COLORS.border },
  itemMeta: { fontSize: 11, color: COLORS.grayText },
  itemPrice: { fontSize: 13, fontWeight: '800', color: COLORS.navy },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
    marginTop: 8,
  },
  footerLabel: { fontSize: 12, color: COLORS.grayText },
  totalWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  totalLabel: { fontSize: 13, fontWeight: '600', color: COLORS.navy },
  totalValue: { fontSize: 16, fontWeight: '800', color: COLORS.goldDark },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText: { color: COLORS.grayText, fontSize: 13 },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: 8,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: COLORS.navy, marginTop: SPACING.sm },
  emptySub: { fontSize: 13, color: COLORS.grayText, textAlign: 'center', lineHeight: 18 },
  shopBtn: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  shopBtnText: { color: COLORS.gold, fontWeight: '800', fontSize: 14 },
});
