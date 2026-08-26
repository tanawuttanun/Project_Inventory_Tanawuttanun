// app/cart.tsx
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BRAND, COLORS, RADIUS, SPACING } from '../constants/theme';
import { CartItem, useCart } from '../context/CartContext';

export default function CartScreen() {
  const { items, updateQuantity, removeFromCart, totalPrice, totalItems, clearCart } =
    useCart();
  const [checkingOut, setCheckingOut] = useState(false);

  const shipping = totalPrice > 1500 || totalPrice === 0 ? 0 : 50;
  const grandTotal = totalPrice + shipping;

  const handleCheckout = () => {
    if (items.length === 0) return;
    Alert.alert(
      'ยืนยันการสั่งซื้อ',
      `ยอดรวมทั้งสิ้น ${BRAND.currency}${grandTotal.toLocaleString()}\nดำเนินการชำระเงินต่อหรือไม่?`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ยืนยัน',
          onPress: () => {
            setCheckingOut(true);
            // --- TODO: เชื่อมต่อ Payment Gateway จริง (เช่น Omise, 2C2P, Stripe) ---
            setTimeout(() => {
              setCheckingOut(false);
              clearCart();
              Alert.alert('สำเร็จ', 'สั่งซื้อสำเร็จ ขอบคุณที่ใช้บริการ PowerPay 🎉');
            }, 1200);
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.itemCard}>
      <Image source={{ uri: item.product.image }} style={styles.itemImage} />
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.product.name}
        </Text>
        <View style={styles.colorDotRow}>
          <View style={[styles.colorDot, { backgroundColor: item.color }]} />
          <Text style={styles.itemMeta}>{item.product.capacity}</Text>
        </View>
        <Text style={styles.itemPrice}>
          {BRAND.currency}
          {item.product.price.toLocaleString()}
        </Text>

        <View style={styles.qtyRow}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() =>
              updateQuantity(item.product.id, item.color, item.quantity - 1)
            }
          >
            <Ionicons name="remove" size={16} color={COLORS.navy} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() =>
              updateQuantity(item.product.id, item.color, item.quantity + 1)
            }
          >
            <Ionicons name="add" size={16} color={COLORS.navy} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => removeFromCart(item.product.id, item.color)}
          >
            <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ตะกร้าของฉัน</Text>
        <Text style={styles.headerCount}>{totalItems} ชิ้น</Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="cart-outline" size={64} color={COLORS.border} />
          <Text style={styles.emptyText}>ตะกร้าของคุณว่างเปล่า</Text>
          <Text style={styles.emptySub}>เลือกชมพาวเวอร์แบงก์ที่หน้าแรกได้เลย</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(it) => it.product.id + it.color}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
          />

          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>ยอดรวมสินค้า</Text>
              <Text style={styles.summaryValue}>
                {BRAND.currency}
                {totalPrice.toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>ค่าจัดส่ง</Text>
              <Text style={styles.summaryValue}>
                {shipping === 0 ? 'ฟรี' : `${BRAND.currency}${shipping}`}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>ยอดชำระทั้งหมด</Text>
              <Text style={styles.totalValue}>
                {BRAND.currency}
                {grandTotal.toLocaleString()}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={handleCheckout}
              disabled={checkingOut}
            >
              <Text style={styles.checkoutText}>
                {checkingOut ? 'กำลังดำเนินการ...' : 'ดำเนินการชำระเงิน'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
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
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.navy },
  headerCount: { fontSize: 13, color: COLORS.grayText },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },
  itemCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  itemImage: { width: 76, height: 76, borderRadius: RADIUS.sm },
  itemName: { fontSize: 14, fontWeight: '700', color: COLORS.navy },
  colorDotRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  colorDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: COLORS.border },
  itemMeta: { fontSize: 11, color: COLORS.grayText },
  itemPrice: { fontSize: 14, fontWeight: '800', color: COLORS.goldDark, marginTop: 4 },
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
  qtyText: { fontSize: 14, fontWeight: '700', color: COLORS.navy, width: 20, textAlign: 'center' },
  removeBtn: { marginLeft: 'auto' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  emptyText: { fontSize: 15, fontWeight: '700', color: COLORS.navy, marginTop: SPACING.sm },
  emptySub: { fontSize: 12, color: COLORS.grayText },
  summary: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    ...({} as any),
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
  totalValue: { fontSize: 18, fontWeight: '800', color: COLORS.goldDark },
  checkoutBtn: {
    backgroundColor: COLORS.navy,
    borderRadius: RADIUS.sm,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  checkoutText: { color: COLORS.gold, fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },
});
