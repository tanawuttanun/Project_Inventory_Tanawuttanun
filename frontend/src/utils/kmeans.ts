// frontend/src/utils/kmeans.ts
// -----------------------------------------------------------------------------
// K-Means clustering แบบ pure TypeScript — ไม่พึ่ง native module หรือไลบรารีภายนอก
// ใช้จัดกลุ่มสินค้าตามคุณลักษณะเชิงตัวเลข (ค่าเริ่มต้น: ราคา + จำนวนสต็อก)
//
// ข้อมูลจะถูก standardize (z-score) ก่อนเข้าโมเดลเสมอ เพราะราคาอยู่หลักพัน
// แต่สต็อกอยู่หลักสิบ ถ้าไม่ทำ ระยะทางจะถูกครอบงำด้วยราคาเพียงอย่างเดียว
//
// สอดคล้องกับสคริปต์ Python ใน analysis/clustering.py (random_state=42, n_init≈6-10)
// ต่างกันแค่ที่นี่รันบนเครื่องผู้ใช้เพื่อให้กราฟอัปเดตสดตามฐานข้อมูล
// -----------------------------------------------------------------------------

export type Vector = number[];

export interface ClusterResult {
  k: number;
  /** ดัชนีคลัสเตอร์ต่อ 1 จุด — เรียงใหม่ตามฟีเจอร์แรก (ราคา) จากน้อยไปมากเสมอ */
  assignments: number[];
  /** จุดศูนย์กลางของแต่ละคลัสเตอร์ในหน่วยจริง (ไม่ใช่ค่าที่ scale แล้ว) */
  centroids: Vector[];
  /** ผลรวมระยะห่างกำลังสองภายในกลุ่ม — ยิ่งน้อยยิ่งเกาะกลุ่ม (ใช้ทำ Elbow) */
  inertia: number;
  /** -1..1 ยิ่งเข้าใกล้ 1 กลุ่มยิ่งแยกกันชัด (NaN เมื่อ k < 2) */
  silhouette: number;
}

export interface KSweepRow {
  k: number;
  inertia: number;
  silhouette: number;
}

// --- ตัวสุ่มแบบกำหนด seed ได้ ทำให้ผลลัพธ์คงที่ทุกครั้งที่รันข้อมูลชุดเดิม ---
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function distSq(a: Vector, b: Vector): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return s;
}

// --- Standardization (z-score ต่อฟีเจอร์ ใช้ population std) ---
export function standardize(rows: Vector[]): { scaled: Vector[]; mean: Vector; std: Vector } {
  const dim = rows[0].length;
  const mean = new Array(dim).fill(0);
  const std = new Array(dim).fill(0);

  for (const r of rows) for (let i = 0; i < dim; i++) mean[i] += r[i];
  for (let i = 0; i < dim; i++) mean[i] /= rows.length;

  for (const r of rows) for (let i = 0; i < dim; i++) std[i] += (r[i] - mean[i]) ** 2;
  for (let i = 0; i < dim; i++) std[i] = Math.sqrt(std[i] / rows.length) || 1; // กันหารด้วยศูนย์

  const scaled = rows.map((r) => r.map((v, i) => (v - mean[i]) / std[i]));
  return { scaled, mean, std };
}

function unscale(v: Vector, mean: Vector, std: Vector): Vector {
  return v.map((x, i) => x * std[i] + mean[i]);
}

// --- k-means++ : เลือกจุดตั้งต้นให้กระจายตัว ลดโอกาสได้ผลลัพธ์แย่ ---
function kppInit(data: Vector[], k: number, rand: () => number): Vector[] {
  const centroids: Vector[] = [data[Math.floor(rand() * data.length)].slice()];
  const nearest = new Array(data.length).fill(Infinity);

  while (centroids.length < k) {
    let total = 0;
    const last = centroids[centroids.length - 1];
    for (let i = 0; i < data.length; i++) {
      const d = distSq(data[i], last);
      if (d < nearest[i]) nearest[i] = d;
      total += nearest[i];
    }
    let target = rand() * total;
    let idx = 0;
    while (idx < data.length - 1 && (target -= nearest[idx]) > 0) idx++;
    centroids.push(data[idx].slice());
  }
  return centroids;
}

function lloyd(
  data: Vector[],
  k: number,
  rand: () => number,
  maxIter = 100,
): { assign: number[]; centroids: Vector[]; inertia: number } {
  const centroids = kppInit(data, k, rand);
  const assign = new Array(data.length).fill(-1);
  const dim = data[0].length;

  for (let iter = 0; iter < maxIter; iter++) {
    let moved = false;

    // ขั้นที่ 1: จับแต่ละจุดเข้าคลัสเตอร์ที่ใกล้ที่สุด
    for (let i = 0; i < data.length; i++) {
      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < k; c++) {
        const d = distSq(data[i], centroids[c]);
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      if (assign[i] !== best) {
        assign[i] = best;
        moved = true;
      }
    }

    // ขั้นที่ 2: เลื่อนจุดศูนย์กลางไปที่ค่าเฉลี่ยของสมาชิก
    const sums = Array.from({ length: k }, () => new Array(dim).fill(0));
    const counts = new Array(k).fill(0);
    for (let i = 0; i < data.length; i++) {
      counts[assign[i]]++;
      const s = sums[assign[i]];
      for (let d = 0; d < dim; d++) s[d] += data[i][d];
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] === 0) {
        // คลัสเตอร์ว่าง → ย้ายไปยังจุดที่ไกลจากศูนย์กลางของตัวเองมากที่สุด
        let far = 0;
        let farD = -1;
        for (let i = 0; i < data.length; i++) {
          const d = distSq(data[i], centroids[assign[i]]);
          if (d > farD) {
            farD = d;
            far = i;
          }
        }
        centroids[c] = data[far].slice();
      } else {
        for (let d = 0; d < dim; d++) centroids[c][d] = sums[c][d] / counts[c];
      }
    }

    if (!moved && iter > 0) break;
  }

  let inertia = 0;
  for (let i = 0; i < data.length; i++) inertia += distSq(data[i], centroids[assign[i]]);
  return { assign, centroids, inertia };
}

// --- Silhouette score เฉลี่ยทั้งชุด (ใช้ยืนยันค่า k) ---
export function silhouette(data: Vector[], assign: number[], k: number): number {
  const n = data.length;
  if (k < 2 || k >= n) return NaN;

  const byCluster: number[][] = Array.from({ length: k }, () => []);
  for (let i = 0; i < n; i++) byCluster[assign[i]].push(i);

  let total = 0;
  for (let i = 0; i < n; i++) {
    const own = byCluster[assign[i]];

    let a = 0;
    if (own.length > 1) {
      for (const j of own) if (j !== i) a += Math.sqrt(distSq(data[i], data[j]));
      a /= own.length - 1;
    }

    let b = Infinity;
    for (let c = 0; c < k; c++) {
      if (c === assign[i] || byCluster[c].length === 0) continue;
      let d = 0;
      for (const j of byCluster[c]) d += Math.sqrt(distSq(data[i], data[j]));
      d /= byCluster[c].length;
      if (d < b) b = d;
    }

    total += own.length <= 1 ? 0 : (b - a) / Math.max(a, b);
  }
  return total / n;
}

// --- รันจริง: standardize → หลาย restart → เลือก inertia ต่ำสุด → เรียงกลุ่มตามราคา ---
export function runKMeans(
  rows: Vector[],
  k: number,
  opts?: { restarts?: number; seed?: number },
): ClusterResult {
  const restarts = opts?.restarts ?? 6;
  const seed = opts?.seed ?? 42;
  const { scaled, mean, std } = standardize(rows);

  let best: { assign: number[]; centroids: Vector[]; inertia: number } | null = null;
  for (let r = 0; r < restarts; r++) {
    const res = lloyd(scaled, k, mulberry32(seed + r * 7919));
    if (!best || res.inertia < best.inertia) best = res;
  }
  const chosen = best!;

  // เรียงหมายเลขคลัสเตอร์ตามฟีเจอร์แรก (ราคา) จากน้อยไปมาก → เลขกลุ่มคงที่ทุกครั้ง
  const order = chosen.centroids
    .map((c, i) => ({ i, key: c[0] }))
    .sort((x, y) => x.key - y.key)
    .map((o) => o.i);
  const remap = new Array(k);
  order.forEach((oldIdx, newIdx) => (remap[oldIdx] = newIdx));

  return {
    k,
    assignments: chosen.assign.map((c) => remap[c]),
    centroids: order.map((oldIdx) => unscale(chosen.centroids[oldIdx], mean, std)),
    inertia: chosen.inertia,
    silhouette: silhouette(scaled, chosen.assign, k),
  };
}

// --- กวาดค่า k ตั้งแต่ 1..kMax เพื่อทำกราฟ Elbow + Silhouette ---
export function sweepK(rows: Vector[], kMax: number, seed = 42): KSweepRow[] {
  const out: KSweepRow[] = [];
  const cap = Math.min(kMax, rows.length - 1);
  const { scaled } = standardize(rows);

  for (let k = 1; k <= cap; k++) {
    if (k === 1) {
      const origin = new Array(scaled[0].length).fill(0); // ค่าเฉลี่ยของข้อมูลที่ scale แล้ว = 0
      let inertia = 0;
      for (const r of scaled) inertia += distSq(r, origin);
      out.push({ k: 1, inertia, silhouette: NaN });
    } else {
      const res = runKMeans(rows, k, { seed });
      out.push({ k, inertia: res.inertia, silhouette: res.silhouette });
    }
  }
  return out;
}

// --- เลือก k อัตโนมัติ: ใช้ silhouette สูงสุด ถ้าไม่มีให้ใช้จุดหักศอก (knee point) ---
export function autoK(sweep: KSweepRow[]): number {
  const withSil = sweep.filter((r) => r.k >= 2 && !Number.isNaN(r.silhouette));
  if (withSil.length) {
    return withSil.reduce((best, r) => (r.silhouette > best.silhouette ? r : best)).k;
  }

  if (sweep.length < 3) return sweep.length ? sweep[sweep.length - 1].k : 2;
  const first = sweep[0];
  const last = sweep[sweep.length - 1];
  const dx = last.k - first.k;
  const dy = last.inertia - first.inertia;
  const norm = Math.hypot(dx, dy) || 1;

  let bestK = first.k;
  let bestDist = -1;
  for (const p of sweep) {
    const dist = Math.abs(dy * (p.k - first.k) - dx * (p.inertia - first.inertia)) / norm;
    if (dist > bestDist) {
      bestDist = dist;
      bestK = p.k;
    }
  }
  return bestK;
}
