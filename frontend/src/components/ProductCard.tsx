// src/components/ProductCard.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BRAND, COLORS, RADIUS, SPACING } from '../constants/theme';
import { useFavorites } from '../context/FavoritesContext';
import { useLanguage } from '../context/LanguageContext';

export default function ProductCard({
  product, onPress, isAdmin, onDelete, onEdit
}: {
  product: any; onPress: () => void; isAdmin?: boolean; onDelete?: () => void; onEdit?: () => void;
}) {
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { t } = useLanguage();
  const isFav = favoriteIds?.includes(product.id?.toString());
  const isOutOfStock = product.stock !== undefined && product.stock !== null && Number(product.stock) <= 0;

  // 📌 ตรวจสอบและดึงลิงก์รูปภาพให้ครอบคลุม พร้อมใส่รูปสำรองกรณีที่ใน Database ไม่มีลิงก์
  const displayImage = product.imageUrl || product.image || 'https://via.placeholder.com/200?text=No+Image';

  return (
    <TouchableOpacity style={[styles.card, isOutOfStock && styles.cardOutOfStock]} onPress={onPress} activeOpacity={0.85}>
      {/* ปุ่มลบและปุ่มแก้ไขสินค้า (โชว์เฉพาะ Admin) */}
      {isAdmin && (
        <View style={styles.adminActions}>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={(e) => {
              e.stopPropagation();
              if (onDelete) onDelete();
            }}
          >
            <Ionicons name="trash" size={15} color={COLORS.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={(e) => {
              e.stopPropagation();
              if (onEdit) onEdit();
            }}
          >
            <Ionicons name="pencil" size={15} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      )}

      {/* ปุ่มกดหัวใจ */}
      <TouchableOpacity
        style={styles.favBtn}
        onPress={(e) => {
          e.stopPropagation();
          toggleFavorite(product.id);
        }}
      >
        <Ionicons
          name={isFav ? 'heart' : 'heart-outline'}
          size={20}
          color={isFav ? '#FF4B4B' : COLORS.grayText}
        />
      </TouchableOpacity>

      <View style={styles.imageContainer}>
        <Image
          source={{ uri: displayImage }}
          style={styles.image}
          resizeMode="contain"
        />
        {isOutOfStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>{t('common.outOfStock')}</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.capacity}>{product.capacity}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{BRAND.currency}{Number(product.price).toLocaleString()}</Text>
          {isOutOfStock && (
            <View style={styles.soldOutBadge}>
              <Text style={styles.soldOutText}>0 {t('common.piece')}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%', backgroundColor: COLORS.white, borderRadius: RADIUS.md,
    padding: SPACING.sm, marginBottom: SPACING.md, borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)', shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06,
    shadowRadius: 10, elevation: 3,
  },
  cardOutOfStock: {
    borderColor: '#E2E8F0',
    backgroundColor: '#FAFAFA',
  },
  adminActions: {
    position: 'absolute', top: 8, left: 8, zIndex: 10,
    flexDirection: 'row', gap: 6,
  },
  deleteBtn: {
    backgroundColor: COLORS.danger, borderRadius: 16, width: 30, height: 30,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 2,
  },
  editBtn: {
    backgroundColor: COLORS.navy, borderRadius: 16, width: 30, height: 30,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  favBtn: {
    position: 'absolute', top: 8, right: 8, zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 16,
    width: 32, height: 32,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
    marginBottom: SPACING.sm,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  outOfStockOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(220, 38, 38, 0.85)',
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  info: { gap: 2 },
  name: { fontSize: 14, fontWeight: '700', color: COLORS.navy },
  capacity: { fontSize: 11, color: COLORS.grayText },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  price: { fontSize: 16, fontWeight: '800', color: '#D4AF37' },
  soldOutBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  soldOutText: { color: COLORS.danger, fontSize: 10, fontWeight: '700' },
});