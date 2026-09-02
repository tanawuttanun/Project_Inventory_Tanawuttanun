// src/app/categories.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';

export default function CategoriesScreen() {
  const router = useRouter();
  const { t, isEn } = useLanguage();

  const categories = [
    {
      id: '1',
      title: isEn ? 'Fast Charging' : 'ชาร์จเร็วพิเศษ',
      icon: 'flash',
      desc: isEn ? 'High-speed PD & QC power banks' : 'ชาร์จเร็วทันใจ รองรับ PD & Quick Charge',
    },
    {
      id: '2',
      title: isEn ? 'High Capacity' : 'ความจุสูงพิเศษ',
      icon: 'battery-full',
      desc: isEn ? '20,000mAh and above for multi-day usage' : 'ความจุสูง 20,000mAh ขึ้นไป ใช้งานได้หลายวัน',
    },
    {
      id: '3',
      title: isEn ? 'Wireless & MagSafe' : 'ไร้สาย & แม็กเซฟ',
      icon: 'wifi',
      desc: isEn ? 'Effortless magnetic snap & charging' : 'ชาร์จไร้สาย แปะติดแน่น ไม่ต้องพกสาย',
    },
    {
      id: '4',
      title: isEn ? 'Ultra Slim & Compact' : 'บางเฉียบ พกพาสะดวก',
      icon: 'phone-portrait',
      desc: isEn ? 'Lightweight and pocket-friendly form factor' : 'บางเบา พกพาสะดวก ใส่กระเป๋าเสื้อได้',
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('nav.categories')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {categories.map((cat) => (
          <TouchableOpacity 
            key={cat.id} 
            style={styles.card}
            onPress={() => {
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