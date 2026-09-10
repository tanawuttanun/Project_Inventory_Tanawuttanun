# K-Means: จัดกลุ่มสินค้าในคลัง + กราฟผลลัพธ์

ทำตามโจทย์ในสไลด์ *React Native (Apply AI/ML K-means for Grouping Stock Data)*
โดยดึงข้อมูลสดจากฐานข้อมูล MySQL ของโปรเจกต์นี้ทุกครั้งที่รัน

```
.env → Private API → Aggregator → Combined Dataset → Clustering → Cluster Results
```

## ไฟล์ทั้งหมดที่เกี่ยวข้อง

```text
Inventory news/
├── backend/
│   └── analytics-api.js          # Private API ของเรา: ส่ง price / stock / ยอดขายจริง เป็น JSON
├── group-aggregator/
│   ├── aggregator.py             # Central API: รวมข้อมูลของสมาชิกทุกคนในกลุ่ม
│   ├── requirements.txt
│   └── .env.example              # ใส่ URL ของเพื่อนแต่ละคนที่นี่
└── analysis/
    ├── clustering.py             # K-Means + กราฟผลลัพธ์ 4 ใบ  ← ไฟล์หลัก
    ├── elbow_method.py           # หาค่า k ที่เหมาะสมก่อนรันจริง
    ├── data_source.py            # ตัวดึง/ทำความสะอาดข้อมูล (ใช้ร่วมกันสองไฟล์บน)
    ├── chart_style.py            # สี/ฟอนต์/เส้นตารางของกราฟ
    ├── sample_products.json      # ข้อมูลตัวอย่าง ไว้ทดสอบตอนยังไม่ได้ต่อ DB
    ├── requirements.txt
    └── output/                   # ผลลัพธ์ที่สคริปต์เขียนออกมา (กราฟ + CSV)
```

## ขั้นตอนการรัน

### 1. เปิด Private API (ดึงข้อมูลจาก MySQL)

```bash
cd backend
npm install
npm run analytics          # ทำงานที่พอร์ต 3021 ไม่ชนกับ server.js (3020)
```

ตั้งค่าเพิ่มใน `backend/.env` (ดูตัวอย่างใน `.env.example`)

```env
ANALYTICS_PORT=3021
ANALYTICS_SOURCE=std6730202190-mysql
ANALYTICS_API_KEY=            # เว้นว่าง = ไม่ต้องส่ง x-api-key
DB_TABLE_PREFIX=Tanawuttanun_Hom_
```

ทดสอบ: <http://localhost:3021/api/products> จะได้ JSON หน้าตาแบบนี้

```json
{
  "source": "std6730202190-mysql",
  "id": "1",
  "name": "Apple MagSafe Battery Pack",
  "price": 3890,
  "stock": 40,
  "units_sold": 20,
  "revenue": 77800,
  "inventory_value": 155600
}
```

`units_sold` และ `revenue` คำนวณจากตาราง `..._order_items` ที่ join กับ `..._orders`
เฉพาะออร์เดอร์ที่ `status = 'completed'` — เป็นยอดขายจริง ไม่ใช่ตัวเลขสมมติ
ถ้าอยากดูเฉพาะช่วงล่าสุดใช้ `?days=90`

### 2. เปิด Aggregation API (รวมข้อมูลทั้งกลุ่ม)

```bash
cd group-aggregator
python -m venv .venv && .venv\Scripts\activate     # Windows
pip install -r requirements.txt
copy .env.example .env                             # แล้วแก้ MEMBER_APIS ให้เป็น URL จริงของเพื่อน
python aggregator.py                               # ทำงานที่พอร์ต 6000
```

ทดสอบ: <http://localhost:6000/api/combined-products> และ `/api/health`
(หน้า health บอกว่า API ของใครออนไลน์อยู่บ้าง — ถ้าเพื่อนคนไหนปิดเครื่อง ตัวรวมจะข้ามให้เอง ไม่พัง)

Aggregator แปลงชื่อคีย์ที่ต่างกันให้เป็นชุดเดียวกันอัตโนมัติ เช่น `unit_price` / `Price` → `price`,
`qty` / `quantity` → `stock`, `sold` / `sales` → `units_sold` ดังนั้นเพื่อนที่ใช้ MongoDB หรือ
PostgreSQL ก็ส่งข้อมูลเข้ามาได้เลย

### 3. หาค่า k ที่เหมาะสม

```bash
cd analysis
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
python elbow_method.py
```

ได้กราฟ `output/elbow_method.png` และข้อความสรุปว่าควรใช้ k เท่าไร

### 4. รัน K-Means จริง + ได้กราฟผลลัพธ์

```bash
python clustering.py                  # เลือก k อัตโนมัติจากคะแนน Silhouette
python clustering.py --k 3            # กำหนดเอง
```

## ปรับค่าได้ทั้งหมด (ทุกอย่างอิงข้อมูลใน DB ตอนที่รัน)

| คำสั่ง | ผล |
|---|---|
| `python clustering.py --k 4` | กำหนดจำนวนกลุ่มเอง |
| `python clustering.py --days 90` | นับยอดขายเฉพาะ 90 วันล่าสุด |
| `python clustering.py --features price stock` | เปลี่ยนฟีเจอร์ที่ใช้จัดกลุ่ม |
| `python clustering.py --features price units_sold revenue` | เพิ่มรายได้เข้าไปด้วย |
| `python clustering.py --url http://localhost:3021/api/products` | ข้าม Aggregator ยิงตรงเข้า API ตัวเอง |
| `python clustering.py --file sample_products.json` | ใช้ข้อมูลตัวอย่าง ไม่ต้องต่อ DB |
| `python clustering.py --kmin 2 --kmax 10` | ช่วง k ที่ให้ระบบทดลอง |
| `python clustering.py --no-show` | บันทึกรูปอย่างเดียว ไม่เปิดหน้าต่าง |

ฟีเจอร์ที่ใช้ได้: `price`, `stock`, `units_sold`, `revenue`, `inventory_value`,
`order_count`, `capacity_mah` — ค่าเริ่มต้นคือ **price + stock + units_sold**

## ผลลัพธ์ที่ได้

ทุกครั้งที่รัน `clustering.py` จะเขียนไฟล์ลงโฟลเดอร์ `output/`

| ไฟล์ | เนื้อหา |
|---|---|
| `kmeans_clusters.png` | กราฟ 4 ใบ (เอาไปแปะสไลด์หน้า Cluster Results ได้เลย) |
| `clusters.csv` | สินค้าทุกชิ้นพร้อมเลขกลุ่มที่ถูกจัด |
| `cluster_summary.csv` | ตารางสรุปคุณลักษณะของแต่ละกลุ่ม |
| `k_selection.csv` | ค่า Inertia และ Silhouette ของทุก k ที่ทดลอง |

### อ่านกราฟทั้ง 4 ใบยังไง

1. **Cluster results** — แกน X ราคา แกน Y ยอดขาย จุดกากบาทคือจุดศูนย์กลางของกลุ่ม
   (ถ้าเลือกฟีเจอร์เดียวจะเปลี่ยนเป็นแบบเรียงแถวละกลุ่มให้อัตโนมัติ)
2. **PCA view** — ยุบทุกฟีเจอร์ลงเหลือ 2 มิติ ใช้ดูว่ากลุ่มแยกออกจากกันจริงหรือทับกัน
3. **Elbow method** — เส้นเริ่มหักศอกที่ k เท่าไร แปลว่าเพิ่มกลุ่มต่อไปก็ไม่ค่อยได้อะไรแล้ว
4. **Silhouette score** — ยิ่งเข้าใกล้ 1 ยิ่งดี ใช้ยืนยันค่า k ที่เลือก

แต่ละกลุ่มจะถูกตั้งชื่อตามคุณลักษณะจริงของมัน เช่น `Budget`, `Mid-range · high sales`,
`Premium` โดยเรียงหมายเลขกลุ่มตามราคาเฉลี่ยจากน้อยไปมากเสมอ — รันกี่ครั้งเลขกลุ่มก็ไม่สลับ

### ตัวอย่างผลลัพธ์ (จาก `sample_products.json`)

| cluster | profile | จำนวน | ราคาเฉลี่ย | สต็อกเฉลี่ย | ขายเฉลี่ย |
|---|---|---|---|---|---|
| 0 | Budget | 5 | 301 | 171 | 89 |
| 1 | Mid-range · high sales | 4 | 412 | 71 | 163 |
| 2 | Mid-range · low sales | 10 | 1,692 | 54 | 47 |
| 3 | Premium | 6 | 6,346 | 15 | 10 |

อ่านได้ว่า: กลุ่ม 1 ของถูกแต่หมุนเร็วมาก ควรเติมสต็อกบ่อย ๆ ส่วนกลุ่ม 3 ของแพง
ขายได้น้อย แต่กินมูลค่าสต็อกสูง — ไม่ควรสั่งเข้าทีละเยอะ

## ข้อควรระวัง

- **อย่า commit ไฟล์ `.env`** ทั้งสองโฟลเดอร์มี `.gitignore` กัน `.env`, `output/` และ `.venv/` ไว้แล้ว
- ต้องมีสินค้าอย่างน้อย 3 รายการถึงจะจัดกลุ่มได้ และ k ต้องน้อยกว่าจำนวนสินค้า
- ข้อมูลถูก **Standardize** ก่อนเข้าโมเดลเสมอ เพราะราคาอยู่หลักพันแต่ยอดขายอยู่หลักสิบ
  ถ้าไม่ทำ ผลจะถูกครอบงำด้วยราคาเพียงอย่างเดียว
- `random_state=42` และ `n_init=10` ถูกตั้งไว้แล้ว ผลจึงออกมาเหมือนเดิมทุกครั้งที่รันข้อมูลชุดเดิม
