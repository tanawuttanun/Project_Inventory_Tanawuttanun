require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

// ---------------------------------------------------------
// Analytics API (Private API สำหรับสาย K-Means)
// แยกไฟล์ออกจาก server.js เพื่อไม่ให้กระทบ API หลักของแอป
// หน้าที่: ส่งข้อมูลสินค้าในรูปแบบ JSON มาตรฐานเดียวกันทั้งกลุ่ม
//         (price / stock / units_sold ที่คิดจากยอดขายจริงในตาราง order_items)
// ---------------------------------------------------------

const app = express();
const port = process.env.ANALYTICS_PORT || 3021;

// ชื่อแหล่งข้อมูล ใช้บอกว่าแถวนี้มาจากฐานข้อมูลของใคร เวลา Aggregator รวมข้อมูลหลายคน
const SOURCE = process.env.ANALYTICS_SOURCE || 'std6730202190-mysql';

// ถ้าตั้งค่า ANALYTICS_API_KEY ไว้ จะบังคับให้ผู้เรียกส่ง header x-api-key มาด้วย
const API_KEY = process.env.ANALYTICS_API_KEY || '';

// ชื่อตารางในฐานข้อมูลใช้ prefix เดียวกับ server.js (ปรับผ่าน .env ได้)
const PREFIX = process.env.DB_TABLE_PREFIX || 'Tanawuttanun_Hom_';
if (!/^[A-Za-z0-9_]*$/.test(PREFIX)) {
    console.error('DB_TABLE_PREFIX ต้องมีได้เฉพาะตัวอักษร ตัวเลข และ _ เท่านั้น');
    process.exit(1);
}

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
});

(async function testMySQL() {
    try {
        const conn = await pool.getConnection();
        console.log('Analytics API connected to MySQL:', process.env.DB_NAME);
        conn.release();
    } catch (err) {
        console.error('MySQL Failed:', err.message);
        process.exit(1);
    }
})();

// ตรวจ API Key (ข้ามการตรวจถ้าไม่ได้ตั้งค่าไว้ใน .env)
function requireApiKey(req, res, next) {
    if (!API_KEY) return next();
    if (req.headers['x-api-key'] === API_KEY) return next();
    return res.status(401).json({ error: 'Invalid or missing x-api-key' });
}

// แปลงข้อความความจุ เช่น "1460 mAh" หรือ "20,000mAh" ให้เป็นตัวเลข
function parseCapacity(value) {
    if (value === null || value === undefined) return null;
    const match = String(value).replace(/,/g, '').match(/\d+(\.\d+)?/);
    return match ? Number(match[0]) : null;
}

// ---------------------------------------------------------
// GET /api/products
// Query params:
//   days=90  -> นับยอดขายเฉพาะ N วันล่าสุด (ไม่ใส่ = นับยอดขายทั้งหมด)
// ---------------------------------------------------------
app.get('/api/products', requireApiKey, async (req, res) => {
    try {
        // ตัวกรองช่วงเวลาของยอดขาย ค่าที่รับได้คือ 1-3650 วัน
        const days = Number.parseInt(req.query.days, 10);
        const useWindow = Number.isInteger(days) && days > 0 && days <= 3650;

        const salesWhere = useWindow
            ? "WHERE o.status = 'completed' AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)"
            : "WHERE o.status = 'completed'";
        const params = useWindow ? [days] : [];

        const [rows] = await pool.query(`
            SELECT
                p.id,
                p.name,
                p.model,
                p.capacity,
                p.price,
                p.stock,
                COALESCE(s.units_sold, 0) AS units_sold,
                COALESCE(s.revenue, 0)    AS revenue,
                COALESCE(s.order_count, 0) AS order_count
            FROM \`${PREFIX}products\` p
            LEFT JOIN (
                SELECT
                    oi.product_id,
                    SUM(oi.quantity)          AS units_sold,
                    SUM(oi.subtotal)          AS revenue,
                    COUNT(DISTINCT oi.order_id) AS order_count
                FROM \`${PREFIX}order_items\` oi
                JOIN \`${PREFIX}orders\` o ON o.id = oi.order_id
                ${salesWhere}
                GROUP BY oi.product_id
            ) s ON s.product_id = p.id
            ORDER BY p.id ASC
        `, params);

        // JSON กลางที่ทุกคนในกลุ่มต้องส่งออกมาเหมือนกัน (ไม่ว่าเบื้องหลังจะเป็น MySQL/PostgreSQL/MongoDB)
        const products = rows.map(r => {
            const price = Number(r.price) || 0;
            const stock = Number(r.stock) || 0;
            const unitsSold = Number(r.units_sold) || 0;

            return {
                source: SOURCE,
                id: String(r.id),
                name: r.name || '',
                model: r.model || 'Standard',
                capacity_mah: parseCapacity(r.capacity),
                price,
                stock,
                units_sold: unitsSold,
                revenue: Number(r.revenue) || 0,
                order_count: Number(r.order_count) || 0,
                inventory_value: price * stock
            };
        });

        res.json(products);
    } catch (e) {
        console.error('Analytics Products Error:', e.message);
        res.status(500).json({ error: 'Failed to fetch analytics products' });
    }
});

// ตรวจสถานะบริการ ใช้ให้ Aggregator เช็กก่อนดึงข้อมูล
app.get('/api/health', async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM \`${PREFIX}products\``);
        res.json({ status: 'ok', source: SOURCE, database: process.env.DB_NAME, products: rows[0].total });
    } catch (e) {
        res.status(500).json({ status: 'error', source: SOURCE, message: e.message });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Analytics API running on port ${port}`);
    console.log(`  GET http://localhost:${port}/api/products`);
    console.log(`  GET http://localhost:${port}/api/products?days=90`);
    console.log(`  GET http://localhost:${port}/api/health`);
});
