-- ==============================================================================
-- SQL Migration & User Role Management
-- Table: Tanawuttanun_Hom_users & Tanawuttanun_Hom_products
-- ==============================================================================

-- 1. ตรวจสอบและสร้างตารางผู้ใช้ (หากยังไม่มี)
CREATE TABLE IF NOT EXISTS `Tanawuttanun_Hom_users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(100) NOT NULL UNIQUE,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('user', 'admin') DEFAULT 'user' NOT NULL,
    `is_active` TINYINT(1) DEFAULT 1 NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. กรณีที่มีตาราง Tanawuttanun_Hom_users อยู่แล้วแต่ยังไม่มีคอลัมน์ role
-- ให้รันคำสั่งด้านล่างเพื่อเพิ่มคอลัมน์ role และตั้งค่าเริ่มต้นเป็น 'user'
-- ALTER TABLE `Tanawuttanun_Hom_users` 
-- ADD COLUMN `role` ENUM('user', 'admin') DEFAULT 'user' NOT NULL AFTER `password`;

-- 3. ตรวจสอบรายชื่อผู้ใช้และสถานะ Role ทั้งหมดในระบบ
SELECT `id`, `username`, `email`, `role`, `is_active`, `created_at` 
FROM `Tanawuttanun_Hom_users` 
ORDER BY `id` ASC;

-- 4. คำสั่งแต่งตั้งบัญชีผู้ใช้เป็น "Admin" อย่างปลอดภัย (ระบุ username หรือ email หรือ id)
-- ตัวอย่าง: แต่งตั้งผู้ใช้ชื่อ 'admin' ให้เป็นผู้ดูแลระบบ
UPDATE `Tanawuttanun_Hom_users` 
SET `role` = 'admin' 
WHERE `username` = 'admin';

-- หรือแต่งตั้งผ่าน Email
-- UPDATE `Tanawuttanun_Hom_users` 
-- SET `role` = 'admin' 
-- WHERE `email` = 'admin@example.com';

-- หรือแต่งตั้งผ่าน ID
-- UPDATE `Tanawuttanun_Hom_users` 
-- SET `role` = 'admin' 
-- WHERE `id` = 1;

-- 5. คำสั่งปรับสิทธิ์กลับเป็น "User" ทั่วไป
-- UPDATE `Tanawuttanun_Hom_users` 
-- SET `role` = 'user' 
-- WHERE `username` = 'some_username';

-- ==============================================================================
-- ตารางสินค้า Tanawuttanun_Hom_products
-- ==============================================================================
CREATE TABLE IF NOT EXISTS `Tanawuttanun_Hom_products` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `model` VARCHAR(100) DEFAULT 'Standard',
    `capacity` VARCHAR(50) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `stock` INT NOT NULL DEFAULT 0,
    `imageUrl` TEXT,
    `colors` LONGTEXT,
    `features` LONGTEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==============================================================================
-- 6. ตารางรายการโปรด Tanawuttanun_Hom_favorites (ผูกกับ User และ Product)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS `Tanawuttanun_Hom_favorites` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `product_id` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_user_product` (`user_id`, `product_id`),
    INDEX `idx_favorites_user_id` (`user_id`),
    INDEX `idx_favorites_product_id` (`product_id`),
    CONSTRAINT `fk_fav_user` FOREIGN KEY (`user_id`) REFERENCES `Tanawuttanun_Hom_users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_fav_product` FOREIGN KEY (`product_id`) REFERENCES `Tanawuttanun_Hom_products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==============================================================================
-- 7. ตารางตะกร้าสินค้า Tanawuttanun_Hom_carts (1 ตะกร้าต่อ 1 User)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS `Tanawuttanun_Hom_carts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL UNIQUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_carts_user_id` (`user_id`),
    CONSTRAINT `fk_cart_user` FOREIGN KEY (`user_id`) REFERENCES `Tanawuttanun_Hom_users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==============================================================================
-- 8. ตารางรายการสินค้าในตะกร้า Tanawuttanun_Hom_cart_items
-- ==============================================================================
CREATE TABLE IF NOT EXISTS `Tanawuttanun_Hom_cart_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `cart_id` INT NOT NULL,
    `product_id` INT NOT NULL,
    `color` VARCHAR(50) DEFAULT '',
    `quantity` INT NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_cart_product_color` (`cart_id`, `product_id`, `color`),
    INDEX `idx_cart_items_cart_id` (`cart_id`),
    INDEX `idx_cart_items_product_id` (`product_id`),
    CONSTRAINT `fk_cart_item_cart` FOREIGN KEY (`cart_id`) REFERENCES `Tanawuttanun_Hom_carts`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_cart_item_product` FOREIGN KEY (`product_id`) REFERENCES `Tanawuttanun_Hom_products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==============================================================================
-- 9. ตารางคำสั่งซื้อ Tanawuttanun_Hom_orders
-- ==============================================================================
CREATE TABLE IF NOT EXISTS `Tanawuttanun_Hom_orders` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `order_number` VARCHAR(50) NOT NULL UNIQUE,
    `total_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `shipping_fee` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `total_items` INT NOT NULL DEFAULT 1,
    `status` ENUM('completed', 'pending', 'cancelled') DEFAULT 'completed' NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_orders_user_id` (`user_id`),
    INDEX `idx_orders_order_number` (`order_number`),
    CONSTRAINT `fk_order_user` FOREIGN KEY (`user_id`) REFERENCES `Tanawuttanun_Hom_users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==============================================================================
-- 10. ตารางรายการสินค้าในคำสั่งซื้อ Tanawuttanun_Hom_order_items
-- ==============================================================================
CREATE TABLE IF NOT EXISTS `Tanawuttanun_Hom_order_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `order_id` INT NOT NULL,
    `product_id` INT NOT NULL,
    `product_name` VARCHAR(255) NOT NULL,
    `color` VARCHAR(50) DEFAULT '',
    `price` DECIMAL(10, 2) NOT NULL,
    `quantity` INT NOT NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_order_items_order_id` (`order_id`),
    INDEX `idx_order_items_product_id` (`product_id`),
    CONSTRAINT `fk_order_item_order` FOREIGN KEY (`order_id`) REFERENCES `Tanawuttanun_Hom_orders`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_order_item_product` FOREIGN KEY (`product_id`) REFERENCES `Tanawuttanun_Hom_products`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

