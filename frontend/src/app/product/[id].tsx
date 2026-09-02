// frontend/src/app/product/[id].tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { BRAND, COLORS, RADIUS, SPACING } from '../../constants/theme';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useLanguage } from '../../context/LanguageContext';
import { useProducts } from '../../context/ProductsContext';

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { products, isLoading: productsLoading } = useProducts();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();
  const { t } = useLanguage();

  const product = useMemo(() => {
    return products.find((p: any) => p.id?.toString() === id?.toString());
  }, [products, id]);

  const [selectedColor, setSelectedColor] = useState<string>('');
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const activeColor = selectedColor || (product?.colors?.[0] ?? '');

  const isFav = product ? favoriteIds.includes(product.id?.toString()) : false;
  const isOutOfStock = !product || Number(product.stock) <= 0;
  const availableStock = product ? Number(product.stock) : 0;

  const handleToggleFav = async () => {
    if (!product) return;
    await toggleFavorite(product.id);
  };

  const handleAddToCart = async () => {
    if (!product || isOutOfStock) return;
    if (qty > availableStock) {
      Alert.alert(t('common.error'), t('product.stockLimitExceeded', { count: availableStock }));
      return;
    }

    setIsAdding(true);
    const result = await addToCart(product, activeColor, qty);
    setIsAdding(false);

    if (result.ok) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    } else {
      const errMsg = result.message || t('product.cannotAddOutOfStock');
      if (Platform.OS === 'web') {
        window.alert(errMsg);
      } else {
        Alert.alert(t('common.error'), errMsg);
      }
    }
  };


  if (!product) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.navy} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('product.detailTitle')}</Text>
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={56} color={COLORS.grayText} />
          <Text style={styles.emptyText}>
            {productsLoading ? t('common.loading') : t('home.noProducts')}
          </Text>
          <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.replace('/')}>
            <Text style={styles.backHomeText}>{t('checkout.backToHome')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const displayImage = product.imageUrl || product.image || 'https://via.placeholder.com/400?text=No+Image';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Top Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{product.name}</Text>
        <TouchableOpacity onPress={handleToggleFav} style={styles.favBtn}>
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={24}
            color={isFav ? '#FF4B4B' : COLORS.navy}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Product Image Card */}
        <View style={styles.imageCard}>
          <Image source={{ uri: displayImage }} style={styles.productImage} resizeMode="contain" />
          {isOutOfStock && (
            <View style={styles.outOfStockBanner}>
              <Ionicons name="warning" size={16} color={COLORS.white} />
              <Text style={styles.outOfStockBannerText}>{t('common.outOfStock')}</Text>
            </View>
          )}
        </View>

        {/* Product Basic Info */}
        <View style={styles.infoCard}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.productName}>{product.name}</Text>
              <View style={styles.badgesRow}>
                <View style={styles.modelBadge}>
                  <Text style={styles.modelText}>{product.model || 'Standard'}</Text>
                </View>
                <View style={styles.capacityBadge}>
                  <Ionicons name="battery-charging" size={14} color={COLORS.gold} />
                  <Text style={styles.capacityText}>{product.capacity}</Text>
                </View>
              </View>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>{t('product.price')}</Text>
              <Text style={styles.priceValue}>
                {BRAND.currency}{Number(product.price).toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Stock Status */}
          <View style={styles.stockRow}>
            <View style={[styles.stockDot, { backgroundColor: isOutOfStock ? COLORS.danger : '#10B981' }]} />
            <Text style={[styles.stockText, { color: isOutOfStock ? COLORS.danger : '#059669' }]}>
              {isOutOfStock ? t('common.outOfStock') : t('product.inStockCount', { count: availableStock })}
            </Text>
          </View>

          {/* Color Selector */}
          {Array.isArray(product.colors) && product.colors.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('product.colorSelection')}</Text>
              <View style={styles.colorsRow}>
                {product.colors.map((c: string, idx: number) => {
                  const isSelected = activeColor === c;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: c },
                        isSelected && styles.colorCircleSelected,
                      ]}
                      onPress={() => setSelectedColor(c)}
                    >
                      {isSelected && (
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={c.toLowerCase() === '#ffffff' || c.toLowerCase() === 'white' ? COLORS.navy : COLORS.white}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Quantity Stepper */}
          {!isOutOfStock && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('product.quantity')}</Text>
              <View style={styles.qtyContainer}>
                <TouchableOpacity
                  style={[styles.qtyBtn, qty <= 1 && styles.qtyBtnDisabled]}
                  onPress={() => setQty(prev => Math.max(1, prev - 1))}
                  disabled={qty <= 1}
                >
                  <Ionicons name="remove" size={18} color={COLORS.navy} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{qty}</Text>
                <TouchableOpacity
                  style={[styles.qtyBtn, qty >= availableStock && styles.qtyBtnDisabled]}
                  onPress={() => setQty(prev => Math.min(availableStock, prev + 1))}
                  disabled={qty >= availableStock}
                >
                  <Ionicons name="add" size={18} color={COLORS.navy} />
                </TouchableOpacity>
                <Text style={styles.maxQtySub}>
                  ({t('product.inStockCount', { count: availableStock })})
                </Text>
              </View>
            </View>
          )}

          {/* Features */}
          {Array.isArray(product.features) && product.features.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('product.features')}</Text>
              <View style={styles.featuresList}>
                {product.features.map((feat: string, idx: number) => (
                  <View key={idx} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.gold} />
                    <Text style={styles.featureText}>{feat}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.addBtn, (isOutOfStock || isAdding) && styles.addBtnDisabled]}
          onPress={handleAddToCart}
          disabled={isOutOfStock || isAdding}
        >
          <Ionicons
            name={justAdded ? 'checkmark-circle' : 'cart'}
            size={20}
            color={isOutOfStock ? COLORS.grayText : COLORS.gold}
          />
          <Text style={[styles.addBtnText, isOutOfStock && styles.addBtnTextDisabled]}>
            {justAdded
              ? t('product.addedToCartMsg')
              : isOutOfStock
              ? t('common.outOfStock')
              : isAdding
              ? t('common.loading')
              : t('product.addToCart')}
          </Text>
        </TouchableOpacity>
      </View>
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
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.navy,
    marginHorizontal: SPACING.md,
    textAlign: 'center',
  },
  favBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { padding: SPACING.lg, paddingBottom: 100 },
  imageCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1.1,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    position: 'relative',
    overflow: 'hidden',
  },
  productImage: { width: '90%', height: '90%' },
  outOfStockBanner: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: COLORS.danger,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  outOfStockBannerText: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  productName: { fontSize: 20, fontWeight: '800', color: COLORS.navy, marginBottom: 8 },
  badgesRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  modelBadge: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  modelText: { color: COLORS.gold, fontSize: 12, fontWeight: '700' },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  capacityText: { color: COLORS.navy, fontSize: 12, fontWeight: '700' },
  priceContainer: { alignItems: 'flex-end', marginLeft: 12 },
  priceLabel: { fontSize: 11, color: COLORS.grayText },
  priceValue: { fontSize: 22, fontWeight: '800', color: COLORS.goldDark, marginTop: 2 },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, marginBottom: 12 },
  stockDot: { width: 8, height: 8, borderRadius: 4 },
  stockText: { fontSize: 13, fontWeight: '700' },
  section: { marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.navy, marginBottom: 10 },
  colorsRow: { flexDirection: 'row', gap: 12 },
  colorCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: COLORS.gold,
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qtyBtnDisabled: { opacity: 0.4 },
  qtyText: { fontSize: 16, fontWeight: '800', color: COLORS.navy, width: 30, textAlign: 'center' },
  maxQtySub: { fontSize: 12, color: COLORS.grayText },
  featuresList: { gap: 8 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 13, color: COLORS.navy, flex: 1 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  addBtn: {
    backgroundColor: COLORS.navy,
    borderRadius: RADIUS.md,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  addBtnDisabled: { backgroundColor: '#E2E8F0', borderColor: '#CBD5E1' },
  addBtnText: { color: COLORS.gold, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  addBtnTextDisabled: { color: COLORS.grayText },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: SPACING.xl },
  emptyText: { fontSize: 16, color: COLORS.grayText, fontWeight: '600' },
  backHomeBtn: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    marginTop: 8,
  },
  backHomeText: { color: COLORS.gold, fontWeight: '700' },
});
