// app/favorites.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ProductCard from '../components/ProductCard';
import { COLORS, SPACING } from '../constants/theme';
import { useFavorites } from '../context/FavoritesContext';
import { useProducts } from '../context/ProductsContext';

export default function FavoritesScreen() {
  const { favoriteIds } = useFavorites();
  const { products } = useProducts();
  const router = useRouter();

  const favProducts = products.filter((p: any) => favoriteIds.includes(p.id));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>รายการโปรด</Text>
        <Text style={styles.headerCount}>{favProducts.length} รายการ</Text>
      </View>

      {favProducts.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="heart-outline" size={64} color={COLORS.border} />
          <Text style={styles.emptyText}>ยังไม่มีสินค้าที่ถูกใจ</Text>
          <Text style={styles.emptySub}>
            กดไอคอนรูปหัวใจที่การ์ดสินค้าเพื่อบันทึกไว้ที่นี่
          </Text>
        </View>
      ) : (
        <FlatList
          data={favProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => router.push('/')}
            />
          )}
        />
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
  grid: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: SPACING.xl },
  emptyText: { fontSize: 15, fontWeight: '700', color: COLORS.navy, marginTop: SPACING.sm },
  emptySub: { fontSize: 12, color: COLORS.grayText, textAlign: 'center' },
});
