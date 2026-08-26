// app/brand.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BRAND, COLORS, RADIUS, SPACING } from '../constants/theme';

const VALUES = [
  {
    icon: 'shield-checkmark' as const,
    title: 'คุณภาพมาตรฐานสากล',
    desc: 'ผ่านการทดสอบความปลอดภัยแบตเตอรี่ตามมาตรฐาน CE / FCC / RoHS',
  },
  {
    icon: 'flash' as const,
    title: 'เทคโนโลยีชาร์จเร็ว',
    desc: 'รองรับ PD และ Quick Charge สูงสุดถึง 100W ในบางรุ่น',
  },
  {
    icon: 'infinite' as const,
    title: 'รับประกันตลอดอายุการใช้งาน',
    desc: 'รับประกันสินค้า 1-2 ปี พร้อมบริการหลังการขายทั่วประเทศ',
  },
  {
    icon: 'leaf' as const,
    title: 'ใส่ใจสิ่งแวดล้อม',
    desc: 'บรรจุภัณฑ์รีไซเคิลได้ และโปรแกรมรับคืนแบตเตอรี่เก่า',
  },
];

export default function BrandScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[COLORS.navyDark, COLORS.navy]} style={styles.hero}>
          <View style={styles.logoCircle}>
            <Ionicons name="battery-charging" size={36} color={COLORS.gold} />
          </View>
          <Text style={styles.brandName}>{BRAND.name}</Text>
          <Text style={styles.productLine}>{BRAND.productLine}</Text>
          <View style={styles.goldLine} />
          <Text style={styles.heroDesc}>
            ผู้ผลิตและจัดจำหน่ายพาวเวอร์แบงก์พรีเมียมสัญชาติไทย
            ก่อตั้งขึ้นเพื่อมอบพลังงานพกพาที่ปลอดภัย ทนทาน และดีไซน์หรูหรา
            ในทุกไลฟ์สไตล์การใช้ชีวิต
          </Text>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ปรัชญาของเรา</Text>
          {VALUES.map((v) => (
            <View key={v.title} style={styles.valueCard}>
              <View style={styles.valueIcon}>
                <Ionicons name={v.icon} size={20} color={COLORS.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.valueTitle}>{v.title}</Text>
                <Text style={styles.valueDesc}>{v.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ติดต่อเรา</Text>
          <View style={styles.contactCard}>
            <ContactRow icon="call" text="02-XXX-XXXX" />
            <ContactRow icon="logo-facebook" text="facebook.com/SanHanSomeIndustry" />
            <ContactRow icon="logo-instagram" text="@sanhansome.powerpay" />
            <ContactRow icon="location" text="กรุงเทพมหานคร ประเทศไทย" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ContactRow({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.contactRow}>
      <Ionicons name={icon} size={18} color={COLORS.navy} />
      <Text style={styles.contactText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.offWhite },
  hero: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  brandName: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
  productLine: { color: COLORS.gold, fontSize: 24, fontWeight: '800', letterSpacing: 2, marginTop: 2 },
  goldLine: { width: 48, height: 2, backgroundColor: COLORS.gold, marginVertical: SPACING.sm, borderRadius: 1 },
  heroDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: SPACING.sm,
  },
  section: { padding: SPACING.lg },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.navy, marginBottom: SPACING.md },
  valueCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    alignItems: 'flex-start',
  },
  valueIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueTitle: { fontSize: 14, fontWeight: '700', color: COLORS.navy },
  valueDesc: { fontSize: 12, color: COLORS.grayText, marginTop: 2, lineHeight: 17 },
  contactCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, gap: 14 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  contactText: { fontSize: 13, color: COLORS.navy },
});
