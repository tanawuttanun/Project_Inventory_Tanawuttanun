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
