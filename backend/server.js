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

// 3. ดึงข้อมูลสินค้าทั้งหมด (ตาราง Tanawuttanun_Hom_products) - Public API ไม่ต้องล็อกอิน
app.get('/api/products', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id, name, model, capacity, price, stock, imageUrl, colors, features
             FROM Tanawuttanun_Hom_products
             ORDER BY id ASC`
        );

        const products = rows.map((row) => {
            let colors = [];
            let features = [];
            try { colors = JSON.parse(row.colors); } catch (e) { colors = []; }
            try { features = JSON.parse(row.features); } catch (e) { features = []; }

            return {
                id: row.id,
                name: row.name,
                brand: row.model || '',      // ใช้คอลัมน์ model เป็น brand
                model: row.model || '',
                capacity: row.capacity || '',
                price: Number(row.price) || 0,
                stock: Number(row.stock) || 0,
                imageUrl: row.imageUrl || '',
                colors: Array.isArray(colors) ? colors : [],
                features: Array.isArray(features) ? features : []
            };
        });

        res.json({
            message: 'Products fetched successfully',
            count: products.length,
            products
        });
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

// 8. Helper function สำหรับค้นหาหรือสร้าง Cart ของ User
async function getOrCreateCart(userId, conn = pool) {
    const [rows] = await conn.query('SELECT id FROM Tanawuttanun_Hom_carts WHERE user_id = ?', [userId]);
    if (rows.length > 0) {
        return rows[0].id;
    }
    const [result] = await conn.query('INSERT INTO Tanawuttanun_Hom_carts (user_id) VALUES (?)', [userId]);
    return result.insertId;
}

// ---------------------------------------------------------
// FAVORITES API (ผูกกับ user_id และ product_id)
// ---------------------------------------------------------

// ดึงรายการโปรดเฉพาะของ User ที่ล็อกอิน
app.get('/api/favorites', authToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT p.*, f.created_at AS favorited_at
            FROM Tanawuttanun_Hom_favorites f
            JOIN Tanawuttanun_Hom_products p ON f.product_id = p.id
            WHERE f.user_id = ?
            ORDER BY f.created_at DESC
        `, [req.user.id]);

        const favoriteIds = rows.map(r => r.id.toString());
        res.json({
            message: 'Favorites fetched successfully',
            favoriteIds,
            products: rows
        });
    } catch (e) {
        console.error('Favorites Error:', e.message);
        res.status(500).json({ error: 'Failed to fetch favorites' });
    }
});

// กดสลับเพิ่ม/ลบ รายการโปรด (Toggle)
app.post('/api/favorites/toggle', authToken, async (req, res) => {
    try {
        const { product_id } = req.body;
        if (!product_id) {
            return res.status(400).json({ error: 'product_id is required' });
        }

        const [prods] = await pool.query('SELECT id, name FROM Tanawuttanun_Hom_products WHERE id = ?', [product_id]);
        if (prods.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const [existing] = await pool.query(
            'SELECT id FROM Tanawuttanun_Hom_favorites WHERE user_id = ? AND product_id = ?',
            [req.user.id, product_id]
        );

        if (existing.length > 0) {
            await pool.query(
                'DELETE FROM Tanawuttanun_Hom_favorites WHERE user_id = ? AND product_id = ?',
                [req.user.id, product_id]
            );
            return res.json({
                favorited: false,
                message: 'Removed from favorites',
                productId: product_id.toString()
            });
        } else {
            await pool.query(
                'INSERT INTO Tanawuttanun_Hom_favorites (user_id, product_id) VALUES (?, ?)',
                [req.user.id, product_id]
            );
            return res.json({
                favorited: true,
                message: 'Added to favorites',
                productId: product_id.toString()
            });
        }
    } catch (e) {
        console.error('Toggle Favorite Error:', e.message);
        res.status(500).json({ error: 'Failed to toggle favorite' });
    }
});

// เพิ่มรายการโปรด
app.post('/api/favorites', authToken, async (req, res) => {
    try {
        const { product_id } = req.body;
        if (!product_id) {
            return res.status(400).json({ error: 'product_id is required' });
        }

        const [prods] = await pool.query('SELECT id FROM Tanawuttanun_Hom_products WHERE id = ?', [product_id]);
        if (prods.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        await pool.query(
            'INSERT IGNORE INTO Tanawuttanun_Hom_favorites (user_id, product_id) VALUES (?, ?)',
            [req.user.id, product_id]
        );

        res.status(201).json({ message: 'Added to favorites', productId: product_id.toString() });
    } catch (e) {
        console.error('Add Favorite Error:', e.message);
        res.status(500).json({ error: 'Failed to add favorite' });
    }
});

// ลบออกจากรายการโปรด
app.delete('/api/favorites/:productId', authToken, async (req, res) => {
    try {
        const { productId } = req.params;
        await pool.query(
            'DELETE FROM Tanawuttanun_Hom_favorites WHERE user_id = ? AND product_id = ?',
            [req.user.id, productId]
        );
        res.json({ message: 'Removed from favorites', productId: productId.toString() });
    } catch (e) {
        console.error('Delete Favorite Error:', e.message);
        res.status(500).json({ error: 'Failed to remove favorite' });
    }
});

// ---------------------------------------------------------
// CART API (ผูกกับ user_id และตรวจสอบ Stock จาก MySQL เสมอ)
// ---------------------------------------------------------

// ดึงรายการในตะกร้าของผู้ใช้ พร้อมข้อมูลสินค้าและสต็อกล่าสุด
app.get('/api/cart', authToken, async (req, res) => {
    try {
        const cartId = await getOrCreateCart(req.user.id);
        const [items] = await pool.query(`
            SELECT 
                ci.id AS itemId,
                ci.cart_id AS cartId,
                ci.product_id AS productId,
                ci.color,
                ci.quantity,
                p.name,
                p.model,
                p.capacity,
                p.price,
                p.stock,
                p.imageUrl,
                p.colors,
                p.features
            FROM Tanawuttanun_Hom_cart_items ci
            JOIN Tanawuttanun_Hom_products p ON ci.product_id = p.id
            WHERE ci.cart_id = ?
            ORDER BY ci.id ASC
        `, [cartId]);

        let totalPrice = 0;
        let totalItems = 0;

        const formattedItems = items.map(item => {
            const itemQty = Number(item.quantity) || 0;
            const itemPrice = Number(item.price) || 0;
            const itemStock = Number(item.stock) || 0;
            totalPrice += itemPrice * itemQty;
            totalItems += itemQty;

            let parsedColors = [];
            try { parsedColors = JSON.parse(item.colors); } catch(e) {}
            let parsedFeatures = [];
            try { parsedFeatures = JSON.parse(item.features); } catch(e) {}

            return {
                id: item.itemId,
                productId: item.productId.toString(),
                color: item.color || '',
                quantity: itemQty,
                exceedsStock: itemQty > itemStock,
                product: {
                    id: item.productId.toString(),
                    name: item.name,
                    model: item.model || 'Standard',
                    capacity: item.capacity || '',
                    price: itemPrice,
                    stock: itemStock,
                    imageUrl: item.imageUrl || '',
                    image: item.imageUrl || '',
                    colors: Array.isArray(parsedColors) && parsedColors.length ? parsedColors : ["#0A1F44", "#D4AF37", "#FFFFFF"],
                    features: Array.isArray(parsedFeatures) && parsedFeatures.length ? parsedFeatures : ["Fast Charging", "Durable"]
                }
            };
        });

        const shipping = totalPrice > 1500 || totalPrice === 0 ? 0 : 50;
        const grandTotal = totalPrice + shipping;

        res.json({
            items: formattedItems,
            totalItems,
            totalPrice,
            shipping,
            grandTotal
        });
    } catch (e) {
        console.error('Get Cart Error:', e.message);
        res.status(500).json({ error: 'Failed to fetch cart' });
    }
});

// เพิ่มสินค้าลงตะกร้า (ตรวจสอบ stock ก่อนเสมอ)
app.post('/api/cart', authToken, async (req, res) => {
    try {
        const { product_id, color = '', quantity = 1 } = req.body;
        const qty = Math.max(1, parseInt(quantity, 10) || 1);

        if (!product_id) {
            return res.status(400).json({ error: 'product_id is required' });
        }

        const [prods] = await pool.query(
            'SELECT id, name, price, stock FROM Tanawuttanun_Hom_products WHERE id = ?',
            [product_id]
        );

        if (prods.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const product = prods[0];

        if (product.stock <= 0) {
            return res.status(400).json({
                error: `สินค้า "${product.name}" สินค้าหมด (Out of stock)`,
                availableStock: 0
            });
        }

        const cartId = await getOrCreateCart(req.user.id);

        const [existing] = await pool.query(
            'SELECT id, quantity FROM Tanawuttanun_Hom_cart_items WHERE cart_id = ? AND product_id = ? AND color = ?',
            [cartId, product_id, color]
        );

        if (existing.length > 0) {
            const newTotalQty = existing[0].quantity + qty;
            if (newTotalQty > product.stock) {
                return res.status(400).json({
                    error: `ไม่สามารถเพิ่มสินค้าได้ สต็อกคงเหลือ ${product.stock} ชิ้น (ในตะกร้ามีแล้ว ${existing[0].quantity} ชิ้น)`,
                    availableStock: product.stock,
                    currentInCart: existing[0].quantity
                });
            }

            await pool.query(
                'UPDATE Tanawuttanun_Hom_cart_items SET quantity = ? WHERE id = ?',
                [newTotalQty, existing[0].id]
            );
            return res.json({ message: 'Cart updated', itemId: existing[0].id, quantity: newTotalQty });
        } else {
            if (qty > product.stock) {
                return res.status(400).json({
                    error: `จำนวนสินค้าเกินสต็อกที่มี (สต็อกคงเหลือ ${product.stock} ชิ้น)`,
                    availableStock: product.stock
                });
            }

            const [result] = await pool.query(
                'INSERT INTO Tanawuttanun_Hom_cart_items (cart_id, product_id, color, quantity) VALUES (?, ?, ?, ?)',
                [cartId, product_id, color, qty]
            );
            return res.status(201).json({ message: 'Item added to cart', itemId: result.insertId, quantity: qty });
        }
    } catch (e) {
        console.error('Add Cart Error:', e.message);
        res.status(500).json({ error: 'Failed to add item to cart' });
    }
});

// อัปเดตจำนวนสินค้าในตะกร้า (ตรวจสอบ stock ก่อนเสมอ)
app.put('/api/cart/items/:id', authToken, async (req, res) => {
    try {
        const itemId = req.params.id;
        const { quantity } = req.body;
        const newQty = parseInt(quantity, 10);

        if (isNaN(newQty)) {
            return res.status(400).json({ error: 'Invalid quantity' });
        }

        const [items] = await pool.query(`
            SELECT ci.id, ci.product_id, ci.cart_id, p.name, p.stock
            FROM Tanawuttanun_Hom_cart_items ci
            JOIN Tanawuttanun_Hom_carts c ON ci.cart_id = c.id
            JOIN Tanawuttanun_Hom_products p ON ci.product_id = p.id
            WHERE ci.id = ? AND c.user_id = ?
        `, [itemId, req.user.id]);

        if (items.length === 0) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        const item = items[0];

        if (newQty <= 0) {
            await pool.query('DELETE FROM Tanawuttanun_Hom_cart_items WHERE id = ?', [itemId]);
            return res.json({ message: 'Item removed from cart', itemId: Number(itemId), quantity: 0 });
        }

        if (newQty > item.stock) {
            return res.status(400).json({
                error: `สินค้า "${item.name}" มีสต็อกคงเหลือเพียง ${item.stock} ชิ้น`,
                availableStock: item.stock
            });
        }

        await pool.query('UPDATE Tanawuttanun_Hom_cart_items SET quantity = ? WHERE id = ?', [newQty, itemId]);
        res.json({ message: 'Cart item updated', itemId: Number(itemId), quantity: newQty });
    } catch (e) {
        console.error('Update Cart Item Error:', e.message);
        res.status(500).json({ error: 'Failed to update cart item' });
    }
});

// ลบสินค้าชิ้นนั้นออกจากตะกร้า
app.delete('/api/cart/items/:id', authToken, async (req, res) => {
    try {
        const itemId = req.params.id;
        const [result] = await pool.query(`
            DELETE ci FROM Tanawuttanun_Hom_cart_items ci
            JOIN Tanawuttanun_Hom_carts c ON ci.cart_id = c.id
            WHERE ci.id = ? AND c.user_id = ?
        `, [itemId, req.user.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Item not found in your cart' });
        }
        res.json({ message: 'Item removed from cart', itemId: Number(itemId) });
    } catch (e) {
        console.error('Delete Cart Item Error:', e.message);
        res.status(500).json({ error: 'Failed to delete cart item' });
    }
});

// ล้างตะกร้าทั้งหมดของผู้ใช้
app.delete('/api/cart', authToken, async (req, res) => {
    try {
        await pool.query(`
            DELETE ci FROM Tanawuttanun_Hom_cart_items ci
            JOIN Tanawuttanun_Hom_carts c ON ci.cart_id = c.id
            WHERE c.user_id = ?
        `, [req.user.id]);
        res.json({ message: 'Cart cleared successfully' });
    } catch (e) {
        console.error('Clear Cart Error:', e.message);
        res.status(500).json({ error: 'Failed to clear cart' });
    }
});

// ---------------------------------------------------------
// CHECKOUT & ORDERS API (Transactional Cut Stock & Orders)
// ---------------------------------------------------------

// ดำเนินการชำระเงิน ตัดสต็อกจริงใน MySQL Transaction เดียวกัน
app.post('/api/checkout', authToken, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. ดึง Cart ID ของ User
        const [cartRows] = await conn.query('SELECT id FROM Tanawuttanun_Hom_carts WHERE user_id = ?', [req.user.id]);
        if (cartRows.length === 0) {
            await conn.rollback();
            return res.status(400).json({ error: 'ไม่มีสินค้าในตะกร้า' });
        }
        const cartId = cartRows[0].id;

        // 2. ล็อกและดึงรายการสินค้าในตะกร้า
        const [cartItems] = await conn.query(
            'SELECT * FROM Tanawuttanun_Hom_cart_items WHERE cart_id = ? FOR UPDATE',
            [cartId]
        );

        if (cartItems.length === 0) {
            await conn.rollback();
            return res.status(400).json({ error: 'ไม่มีสินค้าในตะกร้า' });
        }

        // 3. รวมจำนวนความต้องการต่อสินค้าแต่ละตัว (กรณีมีสีต่างกันแต่เป็น product_id เดียวกัน)
        const productDemand = new Map();
        for (const item of cartItems) {
            const current = productDemand.get(item.product_id) || 0;
            productDemand.set(item.product_id, current + item.quantity);
        }

        const productIds = Array.from(productDemand.keys());

        // 4. ล็อกแถวสินค้าในตาราง Tanawuttanun_Hom_products เพื่อเช็กสต็อกล่าสุดแบบ Real-time
        const [products] = await conn.query(
            'SELECT id, name, price, stock FROM Tanawuttanun_Hom_products WHERE id IN (?) FOR UPDATE',
            [productIds]
        );

        const productMap = new Map(products.map(p => [p.id, p]));

        // 5. ตรวจสอบสต็อกอย่างละเอียดทุกชิ้น
        for (const [productId, neededQty] of productDemand.entries()) {
            const p = productMap.get(productId);
            if (!p) {
                await conn.rollback();
                return res.status(400).json({ error: `ไม่พบสินค้ารหัส ${productId} ในระบบ` });
            }
            if (p.stock < neededQty) {
                await conn.rollback();
                return res.status(400).json({
                    error: `สินค้า "${p.name}" มีสต็อกคงเหลือ ${p.stock} ชิ้น ไม่เพียงพอต่อจำนวนที่คุณต้องการสั่งซื้อ (${neededQty} ชิ้น)`,
                    productId: p.id,
                    availableStock: p.stock,
                    requestedQty: neededQty
                });
            }
        }

        // 6. คำนวณยอดเงินรวมและจำนวนชิ้น
        let subtotal = 0;
        let totalItemsCount = 0;
        for (const item of cartItems) {
            const p = productMap.get(item.product_id);
            subtotal += Number(p.price) * item.quantity;
            totalItemsCount += item.quantity;
        }

        const shippingFee = subtotal > 1500 || subtotal === 0 ? 0 : 50;
        const grandTotal = subtotal + shippingFee;

        // 7. สร้างเลขคำสั่งซื้อและบันทึกตาราง Tanawuttanun_Hom_orders
        const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const [orderResult] = await conn.query(
            'INSERT INTO Tanawuttanun_Hom_orders (user_id, order_number, total_amount, shipping_fee, total_items, status) VALUES (?, ?, ?, ?, ?, "completed")',
            [req.user.id, orderNumber, grandTotal, shippingFee, totalItemsCount]
        );
        const orderId = orderResult.insertId;

        // 8. บันทึก Order Items และหักสต็อกใน Tanawuttanun_Hom_products
        for (const item of cartItems) {
            const p = productMap.get(item.product_id);
            const itemSubtotal = Number(p.price) * item.quantity;

            await conn.query(
                'INSERT INTO Tanawuttanun_Hom_order_items (order_id, product_id, product_name, color, price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [orderId, p.id, p.name, item.color || '', p.price, item.quantity, itemSubtotal]
            );

            // หักสต็อกสินค้าแบบป้องกันสต็อกติดลบ (Concurrency-safe)
            const [updateResult] = await conn.query(
                'UPDATE Tanawuttanun_Hom_products SET stock = stock - ? WHERE id = ? AND stock >= ?',
                [item.quantity, p.id, item.quantity]
            );

            if (updateResult.affectedRows === 0) {
                throw new Error(`สต็อกสินค้า "${p.name}" มีการเปลี่ยนแปลงระหว่างทำรายการ กรุณาลองใหม่อีกครั้ง`);
            }
        }

        // 9. ล้างตะกร้าสินค้าของผู้ใช้
        await conn.query('DELETE FROM Tanawuttanun_Hom_cart_items WHERE cart_id = ?', [cartId]);

        // 10. Commit Transaction
        await conn.commit();

        res.status(201).json({
            message: 'ชำระเงินสำเร็จ (Payment Successful)',
            order: {
                id: orderId,
                orderNumber,
                totalAmount: grandTotal,
                shippingFee,
                totalItems: totalItemsCount,
                status: 'completed',
                createdAt: new Date().toISOString()
            }
        });
    } catch (err) {
        await conn.rollback();
        console.error('Checkout Transaction Error:', err.message);
        res.status(500).json({ error: err.message || 'การชำระเงินล้มเหลว กรุณาลองใหม่อีกครั้ง' });
    } finally {
        conn.release();
    }
});

// ดูประวัติคำสั่งซื้อทั้งหมดของผู้ใช้
app.get('/api/orders', authToken, async (req, res) => {
    try {
        const [orders] = await pool.query(`
            SELECT id, order_number, total_amount, shipping_fee, total_items, status, created_at
            FROM Tanawuttanun_Hom_orders
            WHERE user_id = ?
            ORDER BY created_at DESC
        `, [req.user.id]);

        if (orders.length === 0) {
            return res.json([]);
        }

        const orderIds = orders.map(o => o.id);
        const [items] = await pool.query(`
            SELECT oi.*, p.imageUrl, p.capacity, p.model
            FROM Tanawuttanun_Hom_order_items oi
            LEFT JOIN Tanawuttanun_Hom_products p ON oi.product_id = p.id
            WHERE oi.order_id IN (?)
            ORDER BY oi.id ASC
        `, [orderIds]);

        const ordersWithItems = orders.map(order => ({
            id: order.id,
            orderNumber: order.order_number,
            totalAmount: Number(order.total_amount),
            shippingFee: Number(order.shipping_fee),
            totalItems: Number(order.total_items),
            status: order.status,
            createdAt: order.created_at,
            items: items.filter(it => it.order_id === order.id).map(it => ({
                id: it.id,
                productId: it.product_id,
                productName: it.product_name,
                color: it.color,
                price: Number(it.price),
                quantity: Number(it.quantity),
                subtotal: Number(it.subtotal),
                imageUrl: it.imageUrl || '',
                capacity: it.capacity || '',
                model: it.model || ''
            }))
        }));

        res.json(ordersWithItems);
    } catch (e) {
        console.error('Get Orders Error:', e.message);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// ดูรายละเอียดคำสั่งซื้อตาม ID
app.get('/api/orders/:id', authToken, async (req, res) => {
    try {
        const { id } = req.params;
        const [orders] = await pool.query(`
            SELECT id, order_number, total_amount, shipping_fee, total_items, status, created_at
            FROM Tanawuttanun_Hom_orders
            WHERE id = ? AND user_id = ?
        `, [id, req.user.id]);

        if (orders.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orders[0];
        const [items] = await pool.query(`
            SELECT oi.*, p.imageUrl, p.capacity, p.model
            FROM Tanawuttanun_Hom_order_items oi
            LEFT JOIN Tanawuttanun_Hom_products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
            ORDER BY oi.id ASC
        `, [order.id]);

        res.json({
            id: order.id,
            orderNumber: order.order_number,
            totalAmount: Number(order.total_amount),
            shippingFee: Number(order.shipping_fee),
            totalItems: Number(order.total_items),
            status: order.status,
            createdAt: order.created_at,
            items: items.map(it => ({
                id: it.id,
                productId: it.product_id,
                productName: it.product_name,
                color: it.color,
                price: Number(it.price),
                quantity: Number(it.quantity),
                subtotal: Number(it.subtotal),
                imageUrl: it.imageUrl || '',
                capacity: it.capacity || '',
                model: it.model || ''
            }))
        });
    } catch (e) {
        console.error('Get Order Detail Error:', e.message);
        res.status(500).json({ error: 'Failed to fetch order detail' });
    }
});

// 11. ทดสอบ API ทั่วไป
app.get('/api', (req, res) => {
    res.send('API is running on port ' + port);
});

// เปิดเซิร์ฟเวอร์
app.listen(port, '0.0.0.0', () => {
    console.log(`API running on port ${port}`);
});


