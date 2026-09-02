// app/cart.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_ENDPOINTS } from '../constants/api';
import { BRAND, COLORS, RADIUS, SPACING } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { CartItem, useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useProducts } from '../context/ProductsContext';

interface CheckoutSuccessData {
  orderNumber: string;
  totalAmount: number;
  totalItems: number;
  shippingFee: number;
}

export default function CartScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { items, updateQuantity, removeFromCart, totalPrice, totalItems, clearCart, loadCart } = useCart();
  const { loadProducts } = useProducts();
  const { t } = useLanguage();

  const [checkingOut, setCheckingOut] = useState(false);
  const [successData, setSuccessData] = useState<CheckoutSuccessData | null>(null);

  const shipping = totalPrice > 1500 || totalPrice === 0 ? 0 : 50;
  const grandTotal = totalPrice + shipping;

  const executeCheckout = async () => {
    setCheckingOut(true);
    try {
      const response = await fetch(API_ENDPOINTS.CHECKOUT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }
      setCheckingOut(false);

      if (response.ok && data.order) {
        // 1. Refresh global product catalog & stock in real-time
        await loadProducts();

        // 2. Clear user cart
        clearCart();

        // 3. Display Success Modal with complete order info
        setSuccessData({
          orderNumber: data.order.orderNumber,
          totalAmount: Number(data.order.totalAmount),
          totalItems: Number(data.order.totalItems),
          shippingFee: Number(data.order.shippingFee || 0)
        });
      } else {
        // Stock insufficient or other transaction error
        await loadProducts(); // sync products
        await loadCart();     // sync cart items
        const errMsg = data.error || 'การชำระเงินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.alert(errMsg);
        } else {
          Alert.alert(t('common.error'), errMsg);
        }
      }
    } catch (error: any) {
      setCheckingOut(false);
      const connErrMsg = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(connErrMsg);
      } else {
        Alert.alert(t('common.error'), connErrMsg);
      }
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      const emptyMsg = t('cart.cannotCheckoutEmpty');
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(emptyMsg);
      } else {
        Alert.alert(t('common.error'), emptyMsg);
      }
      return;
    }

    const confirmTitle = t('cart.confirmTitle');
    const confirmMessage = t('cart.confirmMsg', { total: `${BRAND.currency}${grandTotal.toLocaleString()}` });

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const fullPrompt = `${confirmTitle}\n${confirmMessage}`;
      const confirmed = window.confirm(fullPrompt);
      if (confirmed) {
        executeCheckout();
      }
    } else {
      Alert.alert(
        confirmTitle,
        confirmMessage,
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.confirm'),
            onPress: () => {
              executeCheckout();
            },
          },
        ]
      );
    }
  };


  const renderItem = ({ item }: { item: CartItem }) => {
    const productStock = Number(item.product?.stock) || 0;
    const isExceeded = item.quantity > productStock;
    const displayImg = item.product?.imageUrl || item.product?.image || 'https://via.placeholder.com/100?text=PowerBank';

    return (
      <View style={[styles.itemCard, isExceeded && styles.itemCardExceeded]}>
        <Image source={{ uri: displayImg }} style={styles.itemImage} resizeMode="contain" />
        <View style={{ flex: 1 }}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.product?.name}
          </Text>
          <View style={styles.colorDotRow}>
            {item.color ? (
              <View style={[styles.colorDot, { backgroundColor: item.color }]} />
            ) : null}
            <Text style={styles.itemMeta}>{item.product?.capacity}</Text>
          </View>
          <Text style={styles.itemPrice}>
            {BRAND.currency}
            {Number(item.product?.price || 0).toLocaleString()}
          </Text>

          {isExceeded && (
            <Text style={styles.stockWarnText}>
              ⚠️ {t('common.stockRemaining', { count: productStock })}
            </Text>
          )}

          <View style={styles.qtyRow}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => updateQuantity(item.product.id, item.color, item.quantity - 1)}
            >
              <Ionicons name="remove" size={16} color={COLORS.navy} />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{item.quantity}</Text>
            <TouchableOpacity
              style={[styles.qtyBtn, item.quantity >= productStock && styles.qtyBtnDisabled]}
              onPress={() => {
                if (item.quantity < productStock) {
                  updateQuantity(item.product.id, item.color, item.quantity + 1);
                } else {
                  Alert.alert(t('common.error'), t('product.stockLimitExceeded', { count: productStock }));
                }
              }}
              disabled={item.quantity >= productStock}
            >
              <Ionicons name="add" size={16} color={COLORS.navy} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => removeFromCart(item.product.id, item.color)}
            >
              <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('cart.title')}</Text>
        <Text style={styles.headerCount}>{totalItems} {t('cart.countSuffix')}</Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="cart-outline" size={68} color={COLORS.border} />
          <Text style={styles.emptyText}>{t('cart.emptyTitle')}</Text>
          <Text style={styles.emptySub}>{t('cart.emptySub')}</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.replace('/')}>
            <Text style={styles.browseBtnText}>{t('cart.viewCatalog')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(it) => (it.id?.toString() || it.product?.id?.toString() || '') + it.color}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
          />

          {/* Checkout Summary Box */}
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('cart.itemsSubtotal')}</Text>
              <Text style={styles.summaryValue}>
                {BRAND.currency}
                {totalPrice.toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('cart.shippingFee')}</Text>
              <Text style={styles.summaryValue}>
                {shipping === 0 ? t('cart.shippingFree') : `${BRAND.currency}${shipping}`}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>{t('cart.totalPayment')}</Text>
              <Text style={styles.totalValue}>
                {BRAND.currency}
                {grandTotal.toLocaleString()}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.checkoutBtn, checkingOut && styles.checkoutBtnDisabled]}
              onPress={handleCheckout}
              disabled={checkingOut}
            >
              {checkingOut ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={COLORS.gold} />
                  <Text style={styles.checkoutText}>{t('cart.processing')}</Text>
                </View>
              ) : (
                <Text style={styles.checkoutText}>{t('cart.checkoutBtn')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Payment Success Modal */}
      <Modal
        visible={!!successData}
        transparent
        animationType="fade"
        onRequestClose={() => setSuccessData(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark" size={48} color={COLORS.navy} />
            </View>

            <Text style={styles.successTitle}>{t('checkout.successTitle')}</Text>
            <Text style={styles.successSub}>{t('checkout.successSub')}</Text>

            {successData && (
              <View style={styles.orderDetailCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('checkout.orderNumber')}:</Text>
                  <Text style={styles.detailValueOrder}>{successData.orderNumber}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('checkout.totalItems')}:</Text>
                  <Text style={styles.detailValue}>{successData.totalItems} {t('common.piece')}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('checkout.totalPaid')}:</Text>
                  <Text style={styles.detailValueTotal}>
                    {BRAND.currency}{successData.totalAmount.toLocaleString()}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.viewOrdersBtn}
                onPress={() => {
                  setSuccessData(null);
                  router.push('/orders');
                }}
              >
                <Ionicons name="receipt-outline" size={18} color={COLORS.navy} />
                <Text style={styles.viewOrdersText}>{t('checkout.viewOrders')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backHomeModalBtn}
                onPress={() => {
                  setSuccessData(null);
                  router.replace('/');
                }}
              >
                <Ionicons name="home-outline" size={18} color={COLORS.gold} />
                <Text style={styles.backHomeModalText}>{t('checkout.backToHome')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.offWhite },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.navy },
  headerCount: { fontSize: 13, color: COLORS.grayText },
  list: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  itemCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  itemCardExceeded: {
    borderColor: COLORS.danger,
    backgroundColor: '#FFF5F5',
  },
  itemImage: { width: 76, height: 76, borderRadius: RADIUS.sm, backgroundColor: '#F8FAFC' },
  itemName: { fontSize: 14, fontWeight: '700', color: COLORS.navy },
  colorDotRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  colorDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: COLORS.border },
  itemMeta: { fontSize: 11, color: COLORS.grayText },
  itemPrice: { fontSize: 15, fontWeight: '800', color: COLORS.goldDark, marginTop: 4 },
  stockWarnText: { fontSize: 11, color: COLORS.danger, fontWeight: '700', marginTop: 3 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qtyBtnDisabled: { opacity: 0.4 },
  qtyText: { fontSize: 14, fontWeight: '700', color: COLORS.navy, width: 22, textAlign: 'center' },
  removeBtn: { marginLeft: 'auto', padding: 4 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: SPACING.xl },
  emptyText: { fontSize: 17, fontWeight: '800', color: COLORS.navy, marginTop: SPACING.sm },
  emptySub: { fontSize: 13, color: COLORS.grayText, textAlign: 'center' },
  browseBtn: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  browseBtnText: { color: COLORS.gold, fontWeight: '700', fontSize: 14 },
  summary: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 6,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 13, color: COLORS.grayText },
  summaryValue: { fontSize: 13, color: COLORS.navy, fontWeight: '600' },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
    marginTop: 4,
  },
  totalLabel: { fontSize: 15, fontWeight: '800', color: COLORS.navy },
  totalValue: { fontSize: 20, fontWeight: '800', color: COLORS.goldDark },
  checkoutBtn: {
    backgroundColor: COLORS.navy,
    borderRadius: RADIUS.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  checkoutBtnDisabled: { opacity: 0.7 },
  checkoutText: { color: COLORS.gold, fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 31, 68, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  successTitle: { fontSize: 22, fontWeight: '800', color: COLORS.navy, textAlign: 'center' },
  successSub: { fontSize: 13, color: COLORS.grayText, textAlign: 'center', marginTop: 4, lineHeight: 18 },
  orderDetailCard: {
    width: '100%',
    backgroundColor: COLORS.offWhite,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginVertical: SPACING.lg,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 12, color: COLORS.grayText, fontWeight: '600' },
  detailValue: { fontSize: 13, color: COLORS.navy, fontWeight: '700' },
  detailValueOrder: { fontSize: 12, color: COLORS.navy, fontWeight: '800' },
  detailValueTotal: { fontSize: 16, color: COLORS.goldDark, fontWeight: '800' },
  modalButtons: { width: '100%', gap: 10 },
  viewOrdersBtn: {
    width: '100%',
    height: 48,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.offWhite,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  viewOrdersText: { color: COLORS.navy, fontSize: 14, fontWeight: '700' },
  backHomeModalBtn: {
    width: '100%',
    height: 48,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  backHomeModalText: { color: COLORS.gold, fontSize: 14, fontWeight: '800' },
});

