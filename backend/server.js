require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
// ตั้งค่าพอร์ตเป็น 3020 หรือจาก environment variable
const port = process.env.PORT || 3020; 
const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ตั้งค่าการเชื่อมต่อฐานข้อมูล
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ตรวจสอบการเชื่อมต่อ Database
(async function testMySQL() {
    try {
        const conn = await pool.getConnection();
        console.log('Connected to MySQL:', process.env.DB_NAME);
        conn.release();
    } catch (err) {
        console.error('MySQL Failed:', err.message);
        process.exit(1);
    }
})();

// Middleware สำหรับตรวจสอบ Token
function authToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access Token Required' });
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid Token' });
        req.user = user;
        next();
    });
}

// Middleware สำหรับตรวจสอบสิทธิ์ผู้ดูแลระบบ (Admin Only)
function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ 
            error: 'Forbidden: Admin access required',
            message: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้ เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น'
        });
    }
    next();
}

// ---------------------------------------------------------
// ROUTES (ช่องทางรับส่งข้อมูล API)
// ---------------------------------------------------------

// 1. ลงทะเบียนผู้ใช้ใหม่ (Register) - กำหนด role เป็น 'user' เสมอ
app.post('/api/register', async (req, res) => {
    try {
        const rawUsername = req.body.username;
        const rawEmail = req.body.email;
        const rawPassword = req.body.password;

        if (!rawUsername || !rawEmail || !rawPassword || 
            typeof rawUsername !== 'string' || typeof rawEmail !== 'string' || typeof rawPassword !== 'string') {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }

        const username = rawUsername.trim();
        const email = rawEmail.trim().toLowerCase();
        const password = rawPassword;

        // Validation
        if (username.length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters long' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }

        // ตรวจสอบว่า username หรือ email ซ้ำหรือไม่ (Prepared Statement)
        const [existingUsers] = await pool.query(
            'SELECT id, username, email FROM Tanawuttanun_Hom_users WHERE username = ? OR email = ? LIMIT 1',
            [username, email]
        );

        if (existingUsers.length > 0) {
            const existing = existingUsers[0];
            if (existing.username && existing.username.toLowerCase() === username.toLowerCase()) {
                return res.status(409).json({ error: 'Username is already taken' });
            }
            return res.status(409).json({ error: 'Email is already registered' });
        }

        // เข้ารหัสรหัสผ่านด้วย bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);

        // บันทึกผู้ใช้ใหม่ลงฐานข้อมูล (role = 'user' เสมอ และ is_active = 1)
        const [result] = await pool.query(
            'INSERT INTO Tanawuttanun_Hom_users (username, email, password, role) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, 'user']
        );

        // ส่งกลับเฉพาะข้อมูลที่ปลอดภัย (ห้ามส่ง password/hash)
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: result.insertId,
                username: username,
                email: email,
                role: 'user'
            }
        });
    } catch (e) {
        console.error('Register Error:', e.message);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// 2. เข้าสู่ระบบ (Login) ตรวจสอบจากฐานข้อมูลจริง และส่ง Role จริงกลับไป
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const loginIdentifier = username.trim();
        const loginPassword = password;

        // ค้นหาผู้ใช้จาก username หรือ email ด้วย Prepared Statement
        const [users] = await pool.query(
            'SELECT id, username, email, password, role, is_active FROM Tanawuttanun_Hom_users WHERE username = ? OR email = ? LIMIT 1',
            [loginIdentifier, loginIdentifier.toLowerCase()]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];

        // ตรวจสอบสถานะการเปิดใช้งานบัญชี (is_active = 1)
        if (user.is_active !== 1 && user.is_active !== true && user.is_active !== '1') {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // ตรวจสอบรหัสผ่านด้วย bcrypt
        const isMatch = await bcrypt.compare(loginPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const userRole = user.role || 'user';

        // สร้าง JWT Token พร้อมข้อมูล Role
        const token = jwt.sign(
            { id: user.id, username: user.username, role: userRole },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // ส่งกลับ Token และข้อมูลผู้ใช้ที่ปลอดภัย
        res.json({
            message: 'Login successful',
            token: token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: userRole
            }
        });
    } catch (e) {
        console.error('Login Error:', e.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 3. ดึงข้อมูลสินค้า (ตาราง Tanawuttanun_Hom_products) - ทุกคนที่ล็อกอินเข้าดูได้
app.get('/api/products', authToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Tanawuttanun_Hom_products ORDER BY id ASC');
        res.json(rows);
    } catch (e) {
        console.error('Products Error:', e.message);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// 4. เพิ่มข้อมูลสินค้าใหม่ (Admin Only)
app.post('/api/products', authToken, requireAdmin, async (req, res) => {
    try {
        const { name, model, capacity, price, stock, imageUrl, colors, features } = req.body;
        
        const colorsJson = JSON.stringify(
            Array.isArray(colors) ? colors : (typeof colors === 'string' && colors.startsWith('[') ? JSON.parse(colors) : [])
        );
        const featuresJson = JSON.stringify(
            Array.isArray(features) ? features : (typeof features === 'string' && features.startsWith('[') ? JSON.parse(features) : [])
        );

        const [result] = await pool.query(
            'INSERT INTO Tanawuttanun_Hom_products (name, model, capacity, price, stock, imageUrl, colors, features) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                name || '',
                model || '',
                capacity || '',
                Number(price) || 0,
                Number(stock) || 0,
                imageUrl || '',
                colorsJson,
                featuresJson
            ]
        );
        res.status(201).json({ message: 'Product added successfully', id: result.insertId });
    } catch (e) {
        console.error('Add Product Error:', e.message);
        res.status(500).json({ error: 'Failed to add product' });
    }
});

// 5. แก้ไขข้อมูลสินค้าตาม ID (Admin Only)
app.put('/api/products/:id', authToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, model, capacity, price, stock, imageUrl, colors, features } = req.body;

        const colorsJson = JSON.stringify(
            Array.isArray(colors) ? colors : (typeof colors === 'string' && colors.startsWith('[') ? JSON.parse(colors) : [])
        );
        const featuresJson = JSON.stringify(
            Array.isArray(features) ? features : (typeof features === 'string' && features.startsWith('[') ? JSON.parse(features) : [])
        );

        const [result] = await pool.query(
            'UPDATE Tanawuttanun_Hom_products SET name = ?, model = ?, capacity = ?, price = ?, stock = ?, imageUrl = ?, colors = ?, features = ? WHERE id = ?',
            [
                name || '',
                model || '',
                capacity || '',
                Number(price) || 0,
                Number(stock) || 0,
                imageUrl || '',
                colorsJson,
                featuresJson,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ message: 'Product updated successfully', id: Number(id) });
    } catch (e) {
        console.error('Update Product Error:', e.message);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// 6. ลบข้อมูลสินค้าตาม ID (Admin Only)
app.delete('/api/products/:id', authToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query(
            'DELETE FROM Tanawuttanun_Hom_products WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ message: 'Product deleted successfully', id: Number(id) });
    } catch (e) {
        console.error('Delete Product Error:', e.message);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// 7. สถิติ Dashboard และ Finances จาก MySQL จริง (Admin Only)
app.get('/api/finances', authToken, requireAdmin, async (req, res) => {
    try {
        // ดึงสถิติจำนวนสินค้า, สต็อกรวม, และมูลค่ารวมของสินค้าในคลัง
        const [summaryRows] = await pool.query(`
            SELECT 
                COUNT(*) AS totalProducts,
                COALESCE(SUM(stock), 0) AS totalStock,
                COALESCE(SUM(price * stock), 0) AS totalInventoryValue
            FROM Tanawuttanun_Hom_products
        `);
        
        // ดึงรายการสินค้าที่สต็อกเหลือน้อย (<= 5 ชิ้น)
        const [lowStockRows] = await pool.query(`
            SELECT id, name, model, capacity, price, stock, imageUrl
            FROM Tanawuttanun_Hom_products
            WHERE stock <= 5
            ORDER BY stock ASC
        `);

        const summary = summaryRows[0] || {};

        res.json({
            totalProducts: Number(summary.totalProducts) || 0,
            totalStock: Number(summary.totalStock) || 0,
            totalInventoryValue: Number(summary.totalInventoryValue) || 0,
            lowStockCount: lowStockRows.length,
            lowStockItems: lowStockRows,
            // สถานะระบบธุรกรรมและคำสั่งซื้อ (ยังไม่มีตาราง Order/Transaction ใน MySQL)
            hasTransactionData: false,
            balance: null,
            income: null,
            expense: null,
            transactions: []
        });
    } catch (e) {
        console.error('Finances Error:', e.message);
        res.status(500).json({ error: 'Failed to fetch finances data' });
    }
});

// 8. หน้า Cart
app.get('/api/cart', authToken, (req, res) => {
    res.json({ message: 'Cart endpoint ready', items: [] });
});

// 9. หน้า Favorites
app.get('/api/favorites', authToken, (req, res) => {
    res.json({ message: 'Favorites endpoint ready', items: [] });
});

// 10. ทดสอบ API ทั่วไป
app.get('/api', (req, res) => {
    res.send('API is running on port ' + port);
});

// เปิดเซิร์ฟเวอร์
app.listen(port, '0.0.0.0', () => {
    console.log(`API running on port ${port}`);
});

