// src/components/ProductCard.tsx
import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { useFavorites } from '../context/FavoritesContext';

export default function ProductCard({
  product, onPress, isAdmin, onDelete, onEdit
}: {
  product: any; onPress: () => void; isAdmin?: boolean; onDelete?: () => void; onEdit?: () => void;
}) {
  const { favoriteIds, toggleFavorite } = useFavorites();
  const isFav = favoriteIds?.includes(product.id);

  // 📌 ตรวจสอบและดึงลิงก์รูปภาพให้ครอบคลุม พร้อมใส่รูปสำรองกรณีที่ใน Database ไม่มีลิงก์
  const displayImage = product.imageUrl || product.image || 'https://via.placeholder.com/200?text=No+Image';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
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
        <Ionicons name={isFav ? 'heart' : 'heart-outline'}
          size={20} color={isFav ? '#FF4B4B' : COLORS.grayText} />
      </TouchableOpacity>

      <View style={styles.imageContainer}>
        <Image
          source={{ uri: displayImage }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.capacity}>{product.capacity}</Text>
        {/* แปลงตัวเลขราคาให้มีคอมม่า และปรับรหัสสีให้ถูกต้อง */}
        <Text style={styles.price}>฿{Number(product.price).toLocaleString()}</Text>
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
  },
  image: {
    width: '100%',
    height: '100%',
  },
  info: { gap: 2 },
  name: { fontSize: 14, fontWeight: '700', color: COLORS.navy },
  capacity: { fontSize: 11, color: COLORS.grayText },
  price: { fontSize: 16, fontWeight: '800', color: '#D4AF37', marginTop: 4 }, // ปรับสีเป็นสีทอง (Gold)
});