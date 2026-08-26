// src/app/finances.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_ENDPOINTS } from '../constants/api';
import { BRAND, COLORS, RADIUS, SPACING } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

interface FinancesData {
  totalProducts: number;
  totalStock: number;
  totalInventoryValue: number;
  lowStockCount: number;
  lowStockItems: Array<{
    id: number;
    name: string;
    model: string;
    capacity: string;
    price: number;
    stock: number;
    imageUrl?: string;
  }>;
  hasTransactionData: boolean;
  balance: number | null;
  income: number | null;
  expense: number | null;
  transactions: any[];
}

export default function FinancesScreen() {
  const router = useRouter();
  const { user, token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<FinancesData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchFinances = async () => {
    if (!token || user?.role !== 'admin') {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await fetch(API_ENDPOINTS.FINANCES, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          setError('คุณไม่มีสิทธิ์เข้าถึงหน้านี้ เฉพาะ Admin เท่านั้น');
        } else {
          setError('ไม่สามารถดึงข้อมูลสถิติและการเงินได้');
        }
        return;
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Finances fetch error:', err);
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFinances();
  }, [token, user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFinances();
  };

  // 🔒 ตรวจสอบสิทธิ์ Admin: หากไม่ใช่ Admin แสดงหน้า Access Denied
  if (user?.role !== 'admin') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.accessDeniedWrap}>
          <View style={styles.accessDeniedIconWrap}>
            <Ionicons name="shield-outline" size={48} color={COLORS.danger} />
          </View>
          <Text style={styles.accessDeniedTitle}>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</Text>
          <Text style={styles.accessDeniedDesc}>
            เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถดูข้อมูลสถิติการเงินและคลังสินค้าได้
          </Text>
          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => router.replace('/')}
          >
            <Ionicons name="home" size={18} color={COLORS.navy} />
            <Text style={styles.homeBtnText}>กลับไปยังหน้าแรก</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finances & Inventory</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color={COLORS.navy} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.gold} />
          <Text style={styles.loadingText}>กำลังโหลดข้อมูลสถิติจาก Database...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchFinances}>
            <Text style={styles.retryBtnText}>ลองใหม่อีกครั้ง</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.gold]} />}
        >
          {/* บัตรสรุปมูลค่าคลังสินค้าจริง (Total Inventory Value Card) */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>มูลค่าสินค้าในคลังรวมทั้งหมด (MySQL)</Text>
            <Text style={styles.balanceAmount}>
              {BRAND.currency}
              {(data?.totalInventoryValue || 0).toLocaleString()}
            </Text>
            <View style={styles.balanceStatsRow}>
              <View style={styles.statBox}>
                <Ionicons name="cube-outline" size={16} color={COLORS.gold} />
                <Text style={styles.statText}>สินค้า: {data?.totalProducts || 0} รายการ</Text>
              </View>
              <View style={styles.statBox}>
                <Ionicons name="layers-outline" size={16} color={COLORS.gold} />
                <Text style={styles.statText}>สต็อกรวม: {(data?.totalStock || 0).toLocaleString()} ชิ้น</Text>
              </View>
            </View>
          </View>

          {/* สินค้าใกล้หมด (Low Stock Warning) */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              สินค้าใกล้หมดสต็อก ({data?.lowStockCount || 0})
            </Text>
            {data && data.lowStockCount > 0 && (
              <View style={styles.warningBadge}>
                <Text style={styles.warningBadgeText}>ต้องเติมสต็อก</Text>
              </View>
            )}
          </View>

          {data && data.lowStockItems && data.lowStockItems.length > 0 ? (
            <View style={styles.listCard}>
              {data.lowStockItems.map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.lowStockRow,
                    index === data.lowStockItems.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <Image
                    source={{
                      uri: item.imageUrl || 'https://via.placeholder.com/80?text=PowerBank',
                    }}
                    style={styles.lowStockImage}
                  />
                  <View style={styles.lowStockInfo}>
                    <Text style={styles.lowStockName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.lowStockModel}>
                      รุ่น {item.model} · {item.capacity}
                    </Text>
                  </View>
                  <View style={styles.lowStockBadge}>
                    <Text style={styles.lowStockCountText}>
                      เหลือ {item.stock} ชิ้น
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="checkmark-circle-outline" size={28} color={COLORS.success} />
              <Text style={styles.emptyCardText}>สต็อกสินค้าทุกรายการอยู่ในเกณฑ์ปกติ</Text>
            </View>
          )}

          {/* ส่วนรายรับ-รายจ่าย & ประวัติธุรกรรม */}
          <View style={[styles.sectionHeaderRow, { marginTop: SPACING.lg }]}>
            <Text style={styles.sectionTitle}>ธุรกรรมและรายรับ-รายจ่าย</Text>
          </View>

          <View style={styles.noticeCard}>
            <View style={styles.noticeIconWrap}>
              <Ionicons name="information-circle" size={24} color={COLORS.gold} />
            </View>
            <View style={styles.noticeInfo}>
              <Text style={styles.noticeTitle}>ยังไม่มีข้อมูลธุรกรรมในระบบ</Text>
              <Text style={styles.noticeDesc}>
                ระบบอยู่ระหว่างเตรียมเชื่อมต่อกับตารางคำสั่งซื้อ (Orders & Transactions)
                ยอดรายรับ-รายจ่ายจะปรากฏเมื่อมีการสั่งซื้อจริงผ่านระบบ
              </Text>
            </View>
          </View>

          {/* สรุปรายรับ-รายจ่าย (ยังไม่มีข้อมูล) */}
          <View style={styles.summaryGrid}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>รายรับรวม</Text>
              <Text style={styles.summaryValueNull}>ยังไม่มีข้อมูล</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>รายจ่ายรวม</Text>
              <Text style={styles.summaryValueNull}>ยังไม่มีข้อมูล</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.offWhite },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 4 },
  refreshBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.navy },
  container: { padding: SPACING.lg, paddingBottom: SPACING.xxl },

  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.grayText,
    marginTop: SPACING.sm,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.danger,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
  },
  retryBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },

  // Balance Card
  balanceCard: {
    backgroundColor: COLORS.navyDark,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 4 },
  balanceAmount: { color: COLORS.gold, fontSize: 32, fontWeight: '800', marginBottom: SPACING.md },
  balanceStatsRow: { flexDirection: 'row', gap: SPACING.md, flexWrap: 'wrap' },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  statText: { color: COLORS.white, fontSize: 12, fontWeight: '600' },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    marginLeft: 4,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.navy },
  warningBadge: {
    backgroundColor: 'rgba(255, 75, 75, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  warningBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.danger },

  // Low Stock List
  listCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.xs,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  lowStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.offWhite,
    gap: 12,
  },
  lowStockImage: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.xs,
    backgroundColor: '#F8FAFC',
  },
  lowStockInfo: { flex: 1 },
  lowStockName: { fontSize: 14, fontWeight: '700', color: COLORS.navy, marginBottom: 2 },
  lowStockModel: { fontSize: 11, color: COLORS.grayText },
  lowStockBadge: {
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFD6D6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  lowStockCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.danger,
  },

  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyCardText: { fontSize: 13, color: COLORS.navy, fontWeight: '600' },

  // Notice & Status
  noticeCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFBF0',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: 10,
  },
  noticeIconWrap: { marginTop: 2 },
  noticeInfo: { flex: 1 },
  noticeTitle: { fontSize: 14, fontWeight: '700', color: COLORS.navy, marginBottom: 2 },
  noticeDesc: { fontSize: 12, color: COLORS.grayText, lineHeight: 17 },

  summaryGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryLabel: { fontSize: 12, color: COLORS.grayText, marginBottom: 4 },
  summaryValueNull: { fontSize: 14, fontWeight: '600', color: COLORS.grayText },

  // Access Denied
  accessDeniedWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  accessDeniedIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 75, 75, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  accessDeniedTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.navy,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  accessDeniedDesc: {
    fontSize: 14,
    color: COLORS.grayText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.gold,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
  },
  homeBtnText: {
    color: COLORS.navy,
    fontWeight: '700',
    fontSize: 14,
  },
});