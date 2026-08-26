// src/app/categories.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

const CATEGORIES = [
  { id: '1', title: 'Fast Charging', icon: 'flash', desc: 'ชาร์จเร็วทันใจ รองรับ PD' },
  { id: '2', title: 'High Capacity', icon: 'battery-full', desc: 'ความจุสูง 20,000mAh ขึ้นไป' },
  { id: '3', title: 'Wireless & MagSafe', icon: 'wifi', desc: 'ชาร์จไร้สาย ไม่ต้องพกสาย' },
  { id: '4', title: 'Ultra Slim', icon: 'phone-portrait', desc: 'บางเฉียบ พกพาสะดวก' },
];

export default function CategoriesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categories</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity 
            key={cat.id} 
            style={styles.card}
            onPress={() => {
              // อนาคตสามารถส่งพารามิเตอร์เพื่อกรองสินค้าได้
              router.push('/');
            }}
          >
            <View style={styles.iconWrap}>
              <Ionicons name={cat.icon as any} size={28} color={COLORS.gold} />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.title}>{cat.title}</Text>
              <Text style={styles.desc}>{cat.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.grayText} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.offWhite },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { marginRight: SPACING.md },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.navy },
  container: { padding: SPACING.lg, gap: SPACING.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
  },
  iconWrap: {
    width: 50, height: 50,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.navy,
    alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.md,
  },
  textWrap: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.navy, marginBottom: 4 },
  desc: { fontSize: 12, color: COLORS.grayText },
});