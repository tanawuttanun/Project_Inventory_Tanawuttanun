// src/app/index.tsx
// หน้าแรก: Hero + ค้นหา + กริดสินค้า + Modal สินค้า + Modal เมนู (Navy-Gold)

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ProductCard from '../components/ProductCard';
import { BRAND, COLORS, RADIUS, SPACING } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useLanguage } from '../context/LanguageContext';
import { useProducts } from '../context/ProductsContext';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { addToCart, resetCart } = useCart();
  const { resetFavorites } = useFavorites();
  const { products, deleteProduct } = useProducts();
  const { t } = useLanguage();
  
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  // ระบบค้นหาสินค้า
  const filtered = useMemo(() => {
    if (!query.trim()) return products;
    const q = query.toLowerCase();
    return products.filter(
      (p: any) =>
        p.name.toLowerCase().includes(q) ||
        p.capacity.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q)
    );
  }, [query, products]);

  const openProduct = (product: any) => {
    setSelected(product);
    setSelectedColor(product.colors?.[0] || '');
    setQty(1);
    setJustAdded(false);
  };

  const closeModal = () => setSelected(null);

  const confirmAdd = async () => {
    if (!selected) return;
    if (selected.stock <= 0) {
      Alert.alert(t('common.error'), t('product.cannotAddOutOfStock'));
      return;
    }
    const res = await addToCart(selected, selectedColor, qty);
    if (res.ok) {
      setJustAdded(true);
      setTimeout(() => closeModal(), 800);
    } else {
      const errMsg = res.message || t('product.cannotAddOutOfStock');
      if (Platform.OS === 'web') {
        window.alert(errMsg);
      } else {
        Alert.alert(t('common.error'), errMsg);
      }
    }
  };


  // ✏️ ฟังก์ชันเปิดหน้าแก้ไขสินค้า
  const handleEditProduct = (item: any) => {
    closeModal();
    router.push({
      pathname: '/add',
      params: { id: item.id.toString() }
    });
  };

  // 🔴 ฟังก์ชันลบสินค้า (รองรับทั้ง Web และ Android/iOS พร้อม Alert)
  const handleDeleteProduct = (item: any) => {
    if (Platform.OS === 'web') {
      const confirmDelete = window.confirm(`คุณต้องการลบ "${item.name}" ออกจากระบบใช่หรือไม่?`);
      if (confirmDelete) {
        deleteProduct(item.id).then((success: boolean) => {
          if (success) {
            Alert.alert(t('common.success'), `ลบสินค้า "${item.name}" เรียบร้อยแล้ว`);
          } else {
            Alert.alert(t('common.error'), 'ไม่สามารถลบสินค้าได้ กรุณาลองใหม่อีกครั้ง');
          }
        });
      }
    } else {
      Alert.alert(t('adminProduct.deleteConfirmTitle'), t('adminProduct.deleteConfirmMsg'), [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive', 
          onPress: async () => {
            const success = await deleteProduct(item.id);
            if (success) {
              Alert.alert(t('common.success'), `ลบสินค้า "${item.name}" เรียบร้อยแล้ว`);
            } else {
              Alert.alert(t('common.error'), 'ไม่สามารถลบสินค้าได้ กรุณาลองใหม่อีกครั้ง');
            }
          }
        }
      ]);
    }
  };

  // 🚪 ฟังก์ชันออกจากระบบ
  const handleLogout = async () => {
    setMenuVisible(false);
    setTimeout(async () => {
      resetCart();
      resetFavorites();
      await logout();
      router.replace('/login');
    }, 300);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header / Hero */}
      <LinearGradient colors={[COLORS.navy, COLORS.navyLight]} style={styles.hero}>
        <View style={styles.heroTop}>
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuBtn}>
            <Ionicons name="menu" size={28} color={COLORS.white} />
          </TouchableOpacity>
          
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.heroGreeting}>
              {t('home.greeting', { name: user?.name || 'User' })} 👋
            </Text>
            <Text style={styles.heroBrand}>
              {BRAND.name} · <Text style={{ color: COLORS.gold }}>{BRAND.productLine}</Text>
            </Text>
          </View>
          <View style={styles.heroBadge}>
            <Ionicons name="battery-charging" size={22} color={COLORS.gold} />
          </View>
        </View>
        <Text style={styles.heroTagline}>{t('home.heroSubtitle')}</Text>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={COLORS.grayText} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('home.searchLabel') + '...'}
            placeholderTextColor={COLORS.grayText}
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </LinearGradient>

      {/* Grid สินค้า */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={styles.grid}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>
            {t('home.allProducts')} ({filtered.length})
          </Text>
        }
        renderItem={({ item }) => (
          <ProductCard 
            product={item} 
            onPress={() => openProduct(item)} 
            isAdmin={user?.role === 'admin'}
            onDelete={() => handleDeleteProduct(item)}
            onEdit={() => handleEditProduct(item)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t('home.noProducts')}</Text>
        }
      />

      {/* 🔴 1. Modal รายละเอียดสินค้า (Quick View) */}
      <Modal visible={!!selected} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {selected && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <TouchableOpacity style={styles.closeBtn} onPress={closeModal}>
                  <Ionicons name="close" size={22} color={COLORS.navy} />
                </TouchableOpacity>

                <Image source={{ uri: selected.image || selected.imageUrl }} style={styles.modalImage} resizeMode="contain" />

                <Text style={styles.modalName}>{selected.name}</Text>
                <Text style={styles.modalModel}>
                  {t('product.model')} {selected.model} · {selected.capacity}
                </Text>

                <View style={styles.modalPriceRow}>
                  <Text style={styles.modalPrice}>
                    {BRAND.currency}
                    {Number(selected.price).toLocaleString()}
                  </Text>
                  <Text style={[styles.stockText, selected.stock <= 0 && { color: COLORS.danger }]}>
                    {selected.stock <= 0
                      ? t('common.outOfStock')
                      : t('product.inStockCount', { count: selected.stock })}
                  </Text>
                </View>

                {/* คุณสมบัติ */}
                {Array.isArray(selected.features) && selected.features.length > 0 && (
                  <View style={styles.featureList}>
                    {selected.features.map((f: string, i: number) => (
                      <View key={i} style={styles.featureRow}>
                        <Ionicons name="checkmark-circle" size={16} color={COLORS.gold} />
                        <Text style={styles.featureText}>{f}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* เลือกสี */}
                {Array.isArray(selected.colors) && selected.colors.length > 0 && (
                  <>
                    <Text style={styles.optionLabel}>{t('product.colorSelection')}</Text>
                    <View style={styles.colorRow}>
                      {selected.colors.map((c: string) => (
                        <Pressable
                          key={c}
                          onPress={() => setSelectedColor(c)}
                          style={[
                            styles.colorDot,
                            { backgroundColor: c },
                            selectedColor === c && styles.colorDotActive,
                          ]}
                        />
                      ))}
                    </View>
                  </>
                )}

                {/* จำนวน */}
                {selected.stock > 0 && (
                  <>
                    <Text style={styles.optionLabel}>{t('product.quantity')}</Text>
                    <View style={styles.qtyRow}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => setQty((q) => Math.max(1, q - 1))}
                      >
                        <Ionicons name="remove" size={18} color={COLORS.navy} />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{qty}</Text>
                      <TouchableOpacity
                        style={[styles.qtyBtn, qty >= selected.stock && { opacity: 0.4 }]}
                        onPress={() => setQty((q) => Math.min(selected.stock, q + 1))}
                        disabled={qty >= selected.stock}
                      >
                        <Ionicons name="add" size={18} color={COLORS.navy} />
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {/* ปุ่มเพิ่มลงตะกร้า */}
                <TouchableOpacity
                  style={[
                    styles.addBtn,
                    justAdded && styles.addBtnSuccess,
                    selected.stock <= 0 && styles.addBtnDisabled
                  ]}
                  onPress={confirmAdd}
                  disabled={justAdded || selected.stock <= 0}
                >
                  <Ionicons
                    name={justAdded ? 'checkmark' : 'cart'}
                    size={18}
                    color={selected.stock <= 0 ? COLORS.grayText : COLORS.navy}
                  />
                  <Text style={[styles.addBtnText, selected.stock <= 0 && { color: COLORS.grayText }]}>
                    {justAdded
                      ? t('home.addedSuccess')
                      : selected.stock <= 0
                      ? t('common.outOfStock')
                      : `${t('product.addToCart')} · ${BRAND.currency}${(selected.price * qty).toLocaleString()}`}
                  </Text>
                </TouchableOpacity>

                {/* ปุ่มดูรายละเอียดสินค้าเต็ม */}
                <TouchableOpacity
                  style={styles.viewFullDetailBtn}
                  onPress={() => {
                    const idToView = selected.id;
                    closeModal();
                    router.push({ pathname: '/product/[id]', params: { id: idToView.toString() } });
                  }}
                >
                  <Ionicons name="open-outline" size={16} color={COLORS.navy} />
                  <Text style={styles.viewFullDetailText}>{t('home.viewDetail')}</Text>
                </TouchableOpacity>

                {/* 🔒 ปุ่มแก้ไขสินค้าสำหรับ Admin */}
                {user?.role === 'admin' && (
                  <TouchableOpacity
                    style={styles.editProductBtn}
                    onPress={() => handleEditProduct(selected)}
                  >
                    <Ionicons name="pencil" size={16} color={COLORS.navy} />
                    <Text style={styles.editProductBtnText}>{t('adminProduct.editTitle')}</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* 🔵 2. Modal เมนูนำทาง (Navy-Gold Menu) */}
      <Modal visible={menuVisible} animationType="fade" transparent>
        <View style={styles.menuOverlay}>
          <TouchableOpacity style={styles.closeMenuBtn} onPress={() => setMenuVisible(false)}>
            <Ionicons name="close" size={32} color={COLORS.gold} />
          </TouchableOpacity>
          
          <Text style={styles.menuLogo}>Power<Text style={{color: COLORS.gold}}>Pay</Text></Text>

          <View style={styles.menuLinks}>
            <TouchableOpacity onPress={() => { setMenuVisible(false); router.push('/'); }}>
              <Text style={styles.menuText}>{t('nav.home')}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setMenuVisible(false); router.push('/categories'); }}>
              <Text style={styles.menuText}>{t('nav.categories')}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setMenuVisible(false); router.push('/orders'); }}>
              <Text style={styles.menuText}>{t('nav.orders')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => { setMenuVisible(false); router.push('/brand'); }}>
              <Text style={styles.menuText}>{t('nav.brand')}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setMenuVisible(false); router.push('/clusters'); }}>
              <Text style={styles.menuText}>{t('nav.clusters')}</Text>
            </TouchableOpacity>

            {/* 🔒 โซนพิเศษสำหรับ Admin (Finances & เพิ่มสินค้า) */}
            {user?.role === 'admin' && (
              <>
                <TouchableOpacity onPress={() => { setMenuVisible(false); router.push('/finances'); }}>
                  <Text style={styles.menuText}>{t('nav.finances')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setMenuVisible(false); router.push('/add'); }}>
                  <Text style={styles.menuText}>{t('nav.add')}</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity onPress={() => { setMenuVisible(false); router.push('/settings'); }}>
              <Text style={styles.menuText}>{t('nav.settings')}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>{t('home.logout')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.offWhite },
  hero: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroGreeting: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  heroBrand: { color: COLORS.white, fontSize: 18, fontWeight: '700', marginTop: 2 },
  heroBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(212,175,55,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  heroTagline: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 10 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 14,
    height: 44,
    marginTop: SPACING.md,
    gap: 8,
  },
  searchInput: { flex: 1, color: COLORS.navy, fontSize: 14 },
  grid: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.xl },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: SPACING.sm,
  },
  emptyText: { textAlign: 'center', color: COLORS.grayText, marginTop: SPACING.xl },

  // --- Style สำหรับ Modal รายละเอียดสินค้า ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10,31,68,0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '88%',
  },
  closeBtn: { alignSelf: 'flex-end', marginBottom: 4 },
  modalImage: {
    width: '100%',
    height: 180,
    borderRadius: RADIUS.md,
    resizeMode: 'cover',
    marginBottom: SPACING.md,
  },
  modalName: { fontSize: 19, fontWeight: '800', color: COLORS.navy },
  modalModel: { fontSize: 12, color: COLORS.grayText, marginTop: 2 },
  modalPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: SPACING.sm },
  modalPrice: { fontSize: 20, fontWeight: '800', color: COLORS.goldDark },
  modalOriginalPrice: {
    fontSize: 13,
    color: COLORS.grayText,
    textDecorationLine: 'line-through',
  },
  stockText: { fontSize: 11, color: COLORS.success, marginLeft: 'auto' },
  featureList: { marginTop: SPACING.md, gap: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 13, color: COLORS.navy },
  optionLabel: { fontSize: 13, fontWeight: '700', color: COLORS.navy, marginTop: SPACING.md, marginBottom: 8 },
  colorRow: { flexDirection: 'row', gap: 12 },
  colorDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotActive: { borderColor: COLORS.gold },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qtyText: { fontSize: 16, fontWeight: '700', color: COLORS.navy, width: 24, textAlign: 'center' },
  addBtn: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: COLORS.gold,
    borderRadius: RADIUS.sm,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  addBtnSuccess: { backgroundColor: COLORS.success },
  addBtnDisabled: { backgroundColor: '#E2E8F0', borderColor: '#CBD5E1' },
  addBtnText: { color: COLORS.navy, fontWeight: '800', fontSize: 14 },
  viewFullDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.offWhite,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    height: 44,
    marginBottom: SPACING.sm,
  },
  viewFullDetailText: { color: COLORS.navy, fontWeight: '700', fontSize: 13 },
  editProductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFF8E7',
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: RADIUS.sm,
    height: 44,
    marginBottom: SPACING.sm,
  },
  editProductBtnText: { color: COLORS.navy, fontWeight: '700', fontSize: 13 },

  // --- Style สำหรับ Modal เมนู ---
  menuBtn: { padding: 4 },
  menuOverlay: {
    flex: 1,
    backgroundColor: COLORS.navyDark, 
    paddingTop: 60,
    paddingHorizontal: 30,
  },
  closeMenuBtn: { alignSelf: 'flex-start', marginBottom: 20 },
  menuLogo: { color: COLORS.white, fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 50 },
  menuLinks: { flex: 1, alignItems: 'center', gap: 30 },
  menuText: { color: COLORS.white, fontSize: 20, fontWeight: '600', letterSpacing: 0.5 },
  logoutBtn: { paddingBottom: 50, alignItems: 'center' },
  logoutText: { color: COLORS.grayText, fontSize: 16, fontWeight: 'bold' },
});