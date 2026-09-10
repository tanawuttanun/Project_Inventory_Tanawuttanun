// src/app/clusters.tsx
// -----------------------------------------------------------------------------
// หน้า "จัดกลุ่มราคาสินค้า (K-Means)"
// ดึงสินค้าสดจากฐานข้อมูล (ผ่าน ProductsContext → GET /api/products) แล้วจัดกลุ่ม
// ตาม ราคา + จำนวนสต็อก ด้วย K-Means ที่คำนวณบนเครื่อง (src/utils/kmeans.ts)
//
// ปรับค่าได้จากปุ่มเลือกจำนวนกลุ่ม k (อัตโนมัติ / 2 / 3 / 4)
// กราฟทั้งหมดวาดด้วย View ล้วน ๆ ไม่ใช้ไลบรารีกราฟหรือ SVG
// -----------------------------------------------------------------------------

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BRAND, COLORS, RADIUS, SPACING } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { useProducts } from '../context/ProductsContext';
import { autoK, runKMeans, sweepK, type Vector } from '../utils/kmeans';

const CLUSTER_COLORS = ['#12A594', '#3E63DD', '#D4AF37', '#E5484D', '#8E4EC6', '#E5844D'];
const K_MAX = 6;
const MIN_PRODUCTS = 3;

type KMode = 'auto' | number;

const money = (n: number) => `${BRAND.currency}${Math.round(n).toLocaleString()}`;

// ตั้งชื่อกลุ่มตามลำดับราคา (กลุ่ม 0 = ถูกที่สุดเสมอ)
function clusterNames(k: number, isEn: boolean): string[] {
  const th: Record<number, string[]> = {
    1: ['ทั้งหมด'],
    2: ['ราคาประหยัด', 'ราคาสูง'],
    3: ['ราคาประหยัด', 'ราคากลาง', 'ราคาสูง'],
    4: ['ราคาประหยัด', 'ราคากลาง', 'ราคาค่อนข้างสูง', 'ราคาสูง'],
    5: ['ราคาประหยัด', 'ราคาปานกลาง', 'ราคากลาง', 'ราคาค่อนข้างสูง', 'ราคาสูง'],
    6: ['ประหยัดมาก', 'ราคาประหยัด', 'ราคากลาง', 'ค่อนข้างสูง', 'ราคาสูง', 'สูงมาก'],
  };
  const en: Record<number, string[]> = {
    1: ['All products'],
    2: ['Budget', 'Premium'],
    3: ['Budget', 'Mid-range', 'Premium'],
    4: ['Budget', 'Mid-range', 'Upper-mid', 'Premium'],
    5: ['Budget', 'Lower-mid', 'Mid-range', 'Upper-mid', 'Premium'],
    6: ['Entry', 'Budget', 'Mid-range', 'Upper-mid', 'Premium', 'Flagship'],
  };
  const table = isEn ? en : th;
  return table[k] ?? Array.from({ length: k }, (_, i) => (isEn ? `Group ${i}` : `กลุ่ม ${i}`));
}

interface ClusterAgg {
  index: number;
  name: string;
  color: string;
  count: number;
  priceMin: number;
  priceMax: number;
  priceAvg: number;
  stockSum: number;
  stockValue: number;
  items: any[];
}

export default function ClustersScreen() {
  const router = useRouter();
  const { isEn } = useLanguage();
  const { products, isLoading, loadProducts } = useProducts();

  const [kMode, setKMode] = useState<KMode>('auto');
  const [refreshing, setRefreshing] = useState(false);

  const L = isEn
    ? {
        badge: 'AI / ML',
        title: 'Price Clusters (K-Means)',
        kCard: 'Number of clusters (k)',
        kHint: 'Pick "Auto" to let the elbow method / silhouette score choose k.',
        auto: 'Auto',
        totalProducts: (n: number) => `${n} products in total`,
        splitInto: (m: number, auto: boolean) => `Split into ${m} groups${auto ? ' (auto)' : ''}`,
        scatter: 'Cluster scatter',
        scatterAxes: 'Horizontal = price · Vertical = stock on hand',
        xPrice: 'Price',
        yStock: 'Stock',
        perCluster: 'Products per cluster',
        kSelect: 'Choosing k (Elbow / Silhouette)',
        elbow: 'Elbow — inertia',
        elbowHint: 'Where the curve flattens is the "elbow"',
        sil: 'Silhouette — higher is better',
        chosen: (k: number) => `Selected k = ${k}`,
        details: 'Cluster details',
        items: (n: number) => `${n} items`,
        priceRange: 'Price range',
        avgPrice: 'Avg price',
        totalStock: 'Total stock',
        stockValue: 'Stock value',
        units: (n: number) => `${n} units`,
        notEnough: `Need at least ${MIN_PRODUCTS} products with a price to run clustering.`,
        empty: 'No product data yet.',
        loading: 'Loading products from database...',
        centroid: 'centroid',
      }
    : {
        badge: 'AI / ML',
        title: 'จัดกลุ่มราคาสินค้า (K-Means)',
        kCard: 'จำนวนกลุ่ม (k)',
        kHint: 'เลือก "อัตโนมัติ" ให้ระบบหาค่า k ด้วย Elbow Method หรือ Silhouette',
        auto: 'อัตโนมัติ',
        totalProducts: (n: number) => `สินค้าทั้งหมด ${n} รายการ`,
        splitInto: (m: number, auto: boolean) => `แบ่งได้ ${m} กลุ่ม${auto ? ' (อัตโนมัติ)' : ''}`,
        scatter: 'กราฟการจัดกลุ่ม',
        scatterAxes: 'แกนนอน = ราคา · แกนตั้ง = จำนวนสต็อก',
        xPrice: 'ราคา',
        yStock: 'สต็อก',
        perCluster: 'จำนวนสินค้าในแต่ละกลุ่ม',
        kSelect: 'การเลือกจำนวนกลุ่ม (Elbow / Silhouette)',
        elbow: 'Elbow — ค่าความคลาดเคลื่อนรวม (Inertia)',
        elbowHint: 'จุดที่กราฟเริ่มแบนราบ = จุดหักศอก',
        sil: 'Silhouette — ยิ่งสูงยิ่งดี',
        chosen: (k: number) => `ระบบเลือก k = ${k}`,
        details: 'รายละเอียดแต่ละกลุ่ม',
        items: (n: number) => `${n} รายการ`,
        priceRange: 'ช่วงราคา',
        avgPrice: 'ราคาเฉลี่ย',
        totalStock: 'สต็อกรวม',
        stockValue: 'มูลค่าสต็อก',
        units: (n: number) => `${n} ชิ้น`,
        notEnough: `ต้องมีสินค้าที่มีราคาอย่างน้อย ${MIN_PRODUCTS} รายการจึงจะจัดกลุ่มได้`,
        empty: 'ยังไม่มีข้อมูลสินค้า',
        loading: 'กำลังโหลดข้อมูลสินค้าจากฐานข้อมูล...',
        centroid: 'จุดศูนย์กลาง',
      };

  // --- เตรียมข้อมูล: เก็บเฉพาะสินค้าที่มีราคาเป็นตัวเลข ---
  const valid = useMemo(
    () =>
      (products ?? []).filter(
        (p: any) => Number.isFinite(Number(p?.price)) && Number(p.price) >= 0,
      ),
    [products],
  );

  const model = useMemo(() => {
    if (valid.length < MIN_PRODUCTS) return null;

    const rows: Vector[] = valid.map((p: any) => [Number(p.price) || 0, Number(p.stock) || 0]);
    const sweep = sweepK(rows, K_MAX);
    const auto = autoK(sweep);
    const k = kMode === 'auto' ? auto : Math.max(2, Math.min(kMode, valid.length - 1));
    const result = runKMeans(rows, k);

    const aggs: ClusterAgg[] = Array.from({ length: k }, (_, ci) => {
      const items = valid.filter((_: any, i: number) => result.assignments[i] === ci);
      const prices: number[] = items.map((p: any) => Number(p.price) || 0);
      const stockSum = items.reduce((s: number, p: any) => s + (Number(p.stock) || 0), 0);
      const stockValue = items.reduce(
        (s: number, p: any) => s + (Number(p.price) || 0) * (Number(p.stock) || 0),
        0,
      );
      return {
        index: ci,
        name: clusterNames(k, isEn)[ci],
        color: CLUSTER_COLORS[ci % CLUSTER_COLORS.length],
        count: items.length,
        priceMin: prices.length ? Math.min(...prices) : 0,
        priceMax: prices.length ? Math.max(...prices) : 0,
        priceAvg: prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
        stockSum,
        stockValue,
        items: [...items].sort((a: any, b: any) => (Number(a.price) || 0) - (Number(b.price) || 0)),
      };
    });

    return { rows, sweep, auto, k, result, aggs };
  }, [valid, kMode, isEn]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadProducts?.();
    } finally {
      setRefreshing(false);
    }
  };

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerBadge}>
            {BRAND.name} · {L.badge}
          </Text>
          <Text style={styles.headerTitle}>{L.title}</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.iconBtn}>
          <Ionicons name="refresh" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {isLoading && !model ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.gold} />
          <Text style={styles.mutedText}>{L.loading}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.gold]} />
          }
        >
          {/* การ์ดเลือกค่า k */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{L.kCard}</Text>
            <Text style={styles.cardHint}>{L.kHint}</Text>
            <View style={styles.pillRow}>
              {(['auto', 2, 3, 4] as KMode[]).map((opt) => {
                const active = kMode === opt;
                return (
                  <TouchableOpacity
                    key={String(opt)}
                    onPress={() => setKMode(opt)}
                    style={[styles.pill, active && styles.pillActive]}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>
                      {opt === 'auto' ? L.auto : `k = ${opt}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{L.totalProducts(valid.length)}</Text>
              {model && (
                <Text style={styles.metaText}>{L.splitInto(model.k, kMode === 'auto')}</Text>
              )}
            </View>
          </View>

          {!model ? (
            <View style={styles.noticeCard}>
              <Ionicons name="information-circle-outline" size={22} color={COLORS.gold} />
              <Text style={styles.noticeText}>
                {valid.length === 0 ? L.empty : L.notEnough}
              </Text>
            </View>
          ) : (
            <>
              {/* กราฟ scatter */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{L.scatter}</Text>
                <Text style={styles.cardHint}>{L.scatterAxes}</Text>
                <ScatterPlot
                  rows={model.rows}
                  assignments={model.result.assignments}
                  centroids={model.result.centroids}
                  aggs={model.aggs}
                  xLabel={L.xPrice}
                  yLabel={L.yStock}
                />
                <View style={styles.legendRow}>
                  {model.aggs.map((c) => (
                    <View key={c.index} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: c.color }]} />
                      <Text style={styles.legendText}>
                        {c.name} ({c.count})
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* จำนวนสินค้าต่อกลุ่ม */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{L.perCluster}</Text>
                <BarChart aggs={model.aggs} />
              </View>

              {/* การเลือกค่า k */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{L.kSelect}</Text>
                <Text style={styles.miniLabel}>{L.elbow}</Text>
                <MiniBars
                  sweep={model.sweep.map((r) => ({ k: r.k, value: r.inertia }))}
                  chosenK={model.k}
                />
                <Text style={styles.elbowHint}>{L.elbowHint}</Text>

                <Text style={[styles.miniLabel, { marginTop: SPACING.md }]}>{L.sil}</Text>
                <MiniBars
                  sweep={model.sweep
                    .filter((r) => !Number.isNaN(r.silhouette))
                    .map((r) => ({ k: r.k, value: r.silhouette }))}
                  chosenK={model.k}
                  format={(v) => v.toFixed(2)}
                />
                <View style={styles.chosenBadge}>
                  <Ionicons name="checkmark-circle" size={15} color={COLORS.success} />
                  <Text style={styles.chosenText}>{L.chosen(model.k)}</Text>
                </View>
              </View>

              {/* รายละเอียดแต่ละกลุ่ม */}
              <Text style={styles.sectionHeader}>{L.details}</Text>
              {model.aggs.map((c) => (
                <View key={c.index} style={[styles.card, { borderLeftWidth: 4, borderLeftColor: c.color }]}>
                  <View style={styles.clusterHead}>
                    <View style={[styles.clusterBadge, { backgroundColor: c.color + '22' }]}>
                      <Text style={[styles.clusterBadgeText, { color: c.color }]}>
                        {isEn ? 'Group' : 'กลุ่ม'} {c.index}
                      </Text>
                    </View>
                    <Text style={styles.clusterName}>{c.name}</Text>
                    <Text style={styles.clusterCount}>{L.items(c.count)}</Text>
                  </View>

                  <View style={styles.statGrid}>
                    <Stat label={L.priceRange} value={`${money(c.priceMin)} – ${money(c.priceMax)}`} />
                    <Stat label={L.avgPrice} value={money(c.priceAvg)} />
                    <Stat label={L.totalStock} value={L.units(c.stockSum)} />
                    <Stat label={L.stockValue} value={money(c.stockValue)} />
                  </View>

                  <View style={styles.itemList}>
                    {c.items.map((p: any, i: number) => (
                      <View
                        key={p.id ?? i}
                        style={[styles.itemRow, i === c.items.length - 1 && { borderBottomWidth: 0 }]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemName} numberOfLines={1}>
                            {p.name || '-'}
                          </Text>
                          <Text style={styles.itemSub} numberOfLines={1}>
                            {[p.model, p.capacity, `${isEn ? 'stock' : 'สต็อก'} ${Number(p.stock) || 0}`]
                              .filter(Boolean)
                              .join(' · ')}
                          </Text>
                        </View>
                        <Text style={[styles.itemPrice, { color: c.color }]}>
                          {money(Number(p.price) || 0)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// กราฟ scatter — จุดวางแบบ absolute ในกล่องสัดส่วนคงที่
// ---------------------------------------------------------------------------
function ScatterPlot({
  rows,
  assignments,
  centroids,
  aggs,
  xLabel,
  yLabel,
}: {
  rows: Vector[];
  assignments: number[];
  centroids: Vector[];
  aggs: ClusterAgg[];
  xLabel: string;
  yLabel: string;
}) {
  const [w, setW] = useState(0);
  const PLOT_H = 210;
  const DOT = 11;

  const xs = rows.map((r) => r[0]);
  const ys = rows.map((r) => r[1]);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const xSpan = xMax - xMin || 1;
  const ySpan = yMax - yMin || 1;

  const px = (v: number) => ((v - xMin) / xSpan) * Math.max(w - DOT, 1);
  const py = (v: number) => (1 - (v - yMin) / ySpan) * (PLOT_H - DOT);

  return (
    <View style={styles.scatterWrap}>
      {/* คอลัมน์ป้ายแกนตั้ง */}
      <View style={styles.yAxis}>
        <Text style={styles.axisTick}>{Math.round(yMax).toLocaleString()}</Text>
        <Text style={styles.axisTick}>{Math.round((yMax + yMin) / 2).toLocaleString()}</Text>
        <Text style={styles.axisTick}>{Math.round(yMin).toLocaleString()}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <View
          style={[styles.plotBox, { height: PLOT_H }]}
          onLayout={(e) => setW(e.nativeEvent.layout.width)}
        >
          {/* เส้นตารางแนวนอนจาง ๆ */}
          {[0.25, 0.5, 0.75].map((f) => (
            <View key={f} style={[styles.gridLine, { top: f * PLOT_H }]} />
          ))}

          {w > 0 &&
            rows.map((r, i) => (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  left: px(r[0]),
                  top: py(r[1]),
                  width: DOT,
                  height: DOT,
                  borderRadius: DOT / 2,
                  backgroundColor: aggs[assignments[i]]?.color ?? COLORS.grayText,
                  borderWidth: 1,
                  borderColor: COLORS.white,
                }}
              />
            ))}

          {/* จุดศูนย์กลางคลัสเตอร์ */}
          {w > 0 &&
            centroids.map((c, i) => (
              <View
                key={`c${i}`}
                style={{
                  position: 'absolute',
                  left: px(c[0]) - 3,
                  top: py(c[1]) - 3,
                  width: DOT + 6,
                  height: DOT + 6,
                  borderRadius: (DOT + 6) / 2,
                  borderWidth: 2.5,
                  borderColor: aggs[i]?.color ?? COLORS.navy,
                  backgroundColor: 'transparent',
                }}
              />
            ))}
        </View>

        {/* ป้ายแกนนอน */}
        <View style={styles.xAxis}>
          <Text style={styles.axisTick}>{money(xMin)}</Text>
          <Text style={styles.axisTick}>{money((xMin + xMax) / 2)}</Text>
          <Text style={styles.axisTick}>{money(xMax)}</Text>
        </View>
        <View style={styles.axisLabelRow}>
          <Text style={styles.axisLabel}>
            ↕ {yLabel} · ↔ {xLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// กราฟแท่งแนวนอน — จำนวนสินค้าต่อกลุ่ม
// ---------------------------------------------------------------------------
function BarChart({ aggs }: { aggs: ClusterAgg[] }) {
  const max = Math.max(...aggs.map((a) => a.count), 1);
  return (
    <View style={{ gap: 10, marginTop: SPACING.sm }}>
      {aggs.map((a) => (
        <View key={a.index} style={styles.barRow}>
          <Text style={styles.barLabel} numberOfLines={1}>
            {a.name}
          </Text>
          <View style={styles.barTrack}>
            <View
              style={{
                width: `${Math.max((a.count / max) * 100, 4)}%`,
                height: 14,
                borderRadius: 7,
                backgroundColor: a.color,
              }}
            />
          </View>
          <Text style={styles.barValue}>{a.count}</Text>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// กราฟแท่งแนวตั้งเล็ก ๆ — ใช้ทั้ง Elbow และ Silhouette
// ---------------------------------------------------------------------------
function MiniBars({
  sweep,
  chosenK,
  format,
}: {
  sweep: { k: number; value: number }[];
  chosenK: number;
  format?: (v: number) => string;
}) {
  if (!sweep.length) return null;
  const H = 110;
  const max = Math.max(...sweep.map((s) => s.value), 1e-9);
  const min = Math.min(...sweep.map((s) => s.value), 0);
  const span = max - min || 1;

  return (
    <View style={[styles.miniWrap, { height: H + 34 }]}>
      {sweep.map((s) => {
        const h = 8 + ((s.value - min) / span) * (H - 8);
        const active = s.k === chosenK;
        return (
          <View key={s.k} style={styles.miniCol}>
            <Text style={styles.miniValue}>{(format ?? ((v) => Math.round(v).toLocaleString()))(s.value)}</Text>
            <View
              style={{
                width: 22,
                height: h,
                borderRadius: 5,
                backgroundColor: active ? COLORS.gold : 'rgba(10,25,47,0.14)',
              }}
            />
            <Text style={[styles.miniK, active && { color: COLORS.navy, fontWeight: '800' }]}>
              {s.k}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.offWhite },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.navy,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  iconBtn: { padding: 4 },
  headerBadge: {
    color: COLORS.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerTitle: { color: COLORS.white, fontSize: 17, fontWeight: '800', marginTop: 2 },

  container: { padding: SPACING.md, paddingBottom: SPACING.xxl, gap: SPACING.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md, padding: SPACING.xl },
  mutedText: { color: COLORS.grayText, fontSize: 13 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: COLORS.navy },
  cardHint: { fontSize: 11.5, color: COLORS.grayText, marginTop: 3, lineHeight: 16 },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: SPACING.md },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.offWhite,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  pillText: { fontSize: 13, fontWeight: '700', color: COLORS.grayText },
  pillTextActive: { color: COLORS.white },

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: SPACING.md,
  },
  metaText: { fontSize: 12, color: COLORS.navy, fontWeight: '600' },

  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFBF0',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  noticeText: { flex: 1, fontSize: 13, color: COLORS.navy, lineHeight: 18 },

  // scatter
  scatterWrap: { flexDirection: 'row', marginTop: SPACING.md, gap: 6 },
  yAxis: { width: 34, height: 210, justifyContent: 'space-between', alignItems: 'flex-end' },
  plotBox: {
    position: 'relative',
    backgroundColor: '#F7F9FC',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(10,25,47,0.06)',
  },
  xAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  axisTick: { fontSize: 9.5, color: COLORS.grayText },
  axisLabelRow: { alignItems: 'center', marginTop: 4 },
  axisLabel: { fontSize: 10, color: COLORS.grayText, fontWeight: '600' },

  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: SPACING.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: COLORS.navy, fontWeight: '600' },

  // bar chart
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { width: 96, fontSize: 12, color: COLORS.navy, fontWeight: '600' },
  barTrack: {
    flex: 1,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.offWhite,
    overflow: 'hidden',
  },
  barValue: { width: 26, textAlign: 'right', fontSize: 13, fontWeight: '800', color: COLORS.navy },

  // mini bars
  miniLabel: { fontSize: 12, fontWeight: '700', color: COLORS.navy, marginTop: SPACING.sm },
  miniWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    marginTop: 6,
  },
  miniCol: { alignItems: 'center', gap: 4 },
  miniValue: { fontSize: 8.5, color: COLORS.grayText },
  miniK: { fontSize: 11, color: COLORS.grayText },
  elbowHint: { fontSize: 10.5, color: COLORS.grayText, marginTop: 4, textAlign: 'center' },
  chosenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(76,175,80,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.md,
  },
  chosenText: { fontSize: 12, fontWeight: '700', color: COLORS.navy },

  // cluster detail
  sectionHeader: { fontSize: 16, fontWeight: '800', color: COLORS.navy, marginTop: SPACING.sm },
  clusterHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clusterBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.sm },
  clusterBadgeText: { fontSize: 11, fontWeight: '800' },
  clusterName: { fontSize: 15, fontWeight: '800', color: COLORS.navy, flex: 1 },
  clusterCount: { fontSize: 12, color: COLORS.grayText, fontWeight: '600' },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: SPACING.md },
  statTile: {
    flexGrow: 1,
    flexBasis: '46%',
    backgroundColor: COLORS.offWhite,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
  },
  statLabel: { fontSize: 10.5, color: COLORS.grayText, marginBottom: 3 },
  statValue: { fontSize: 13, fontWeight: '800', color: COLORS.navy },

  itemList: { marginTop: SPACING.md },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.offWhite,
  },
  itemName: { fontSize: 13, fontWeight: '700', color: COLORS.navy },
  itemSub: { fontSize: 10.5, color: COLORS.grayText, marginTop: 2 },
  itemPrice: { fontSize: 13, fontWeight: '800' },
});
