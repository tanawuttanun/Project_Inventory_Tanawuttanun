-- phpMyAdmin SQL Dump
-- version 5.2.1deb3
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Sep 09, 2026 at 10:53 AM
-- Server version: 8.0.46-0ubuntu0.24.04.4
-- PHP Version: 8.3.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ip_std6730202190`
--

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `capacity_mah` int NOT NULL COMMENT 'ความจุแบตเตอรี่เก็บเป็นตัวเลข',
  `price` decimal(10,2) NOT NULL COMMENT 'ราคาสินค้า',
  `stock` int DEFAULT '0' COMMENT 'จำนวนคงเหลือ',
  `image_url` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `model`, `capacity_mah`, `price`, `stock`, `image_url`, `created_at`, `updated_at`) VALUES
(1, 'Apple MagSafe Battery Pack', 'Standard', 1460, 3890.00, 10, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRYj2BRFvMSZ10HsNfgl5q6GKRvU2DNzrHABksPrt-wPQ&s=10', '2026-08-13 14:55:58', '2026-08-13 14:55:58'),
(2, 'Anker PowerCore', 'Standard', 10000, 990.00, 10, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRnO3_bBoKr0NMYKEkdfPfwr0sG65xJLIejJe382GcFCQ&s', '2026-08-13 14:55:58', '2026-08-13 14:55:58'),
(3, 'Eloop E29', 'Standard', 30000, 1290.00, 10, 'https://img.advice.co.th/cdn-cgi/image/format=auto,width=700,quality=82,fit=contain/images_nas/pic_product4/A0134921/A0134921OK_BIG_2.jpg', '2026-08-13 14:55:58', '2026-08-13 14:55:58'),
(4, 'ZMI Power Bank', 'Standard', 20000, 2490.00, 10, 'https://mercular.s3.ap-southeast-1.amazonaws.com/images/products/2023/12/Product/zmi-qb823-65w-20000mah-power-bank-side-view.jpg', '2026-08-13 14:55:58', '2026-08-13 14:55:58'),
(5, 'Baseus Blade', 'Standard', 20000, 1990.00, 10, 'https://eu.baseus.com/cdn/shop/products/PPBL000301_Baseus_Blade_HD_Laptop_Power_Bank_100W_20000mAh_1.jpg?v=1688625333', '2026-08-13 14:55:58', '2026-08-13 14:55:58'),
(6, 'Aukey Basix Mini', 'Standard', 10000, 890.00, 10, 'https://www.jib.co.th/img_master/product/original/2023032115330258517_1.jpg', '2026-08-13 14:55:58', '2026-08-13 14:55:58'),
(7, 'Samsung Wireless Charger', 'Standard', 10000, 1590.00, 10, 'https://www.425degree.com/media/amasty/webp/wysiwyg/2020/03/Samsung_Wireless_Charger_Stand-4_jpg.webp', '2026-08-13 14:55:58', '2026-08-13 14:55:58'),
(8, 'Remax RPP-167', 'Standard', 30000, 790.00, 10, 'https://down-th.img.susercontent.com/file/b644bb74c22f0bed0e053ef3b9815790', '2026-08-13 14:55:58', '2026-08-13 14:55:58'),
(9, 'Xiaomi Power Bank 3', 'Standard', 20000, 1190.00, 10, 'https://inwfile.com/s-cw/m1r7bx.jpg', '2026-08-13 14:55:58', '2026-08-13 14:55:58'),
(10, 'SANMAX SM200', 'Standard', 20000, 690.00, 10, 'https://th-live-01.slatic.net/p/a0329aecbb3412598dcc1710843c7656.jpg', '2026-08-13 14:55:58', '2026-08-13 14:55:58'),
(11, 'test001', 'Standard', 40000, 9999.00, 10, 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&q=80', '2026-08-13 14:55:58', '2026-08-13 14:55:58');

-- --------------------------------------------------------

--
-- Table structure for table `Tanawuttanun_Hom_carts`
--

CREATE TABLE `Tanawuttanun_Hom_carts` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `Tanawuttanun_Hom_carts`
--

INSERT INTO `Tanawuttanun_Hom_carts` (`id`, `user_id`, `created_at`, `updated_at`) VALUES
(1, 3, '2026-09-02 18:30:02', '2026-09-02 18:30:02'),
(2, 5, '2026-09-02 18:32:13', '2026-09-02 18:32:13');

-- --------------------------------------------------------

--
-- Table structure for table `Tanawuttanun_Hom_cart_items`
--

CREATE TABLE `Tanawuttanun_Hom_cart_items` (
  `id` int NOT NULL,
  `cart_id` int NOT NULL,
  `product_id` int NOT NULL,
  `color` varchar(50) DEFAULT '',
  `quantity` int NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Tanawuttanun_Hom_orders`
--

CREATE TABLE `Tanawuttanun_Hom_orders` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `order_number` varchar(50) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `shipping_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_items` int NOT NULL DEFAULT '1',
  `status` enum('completed','pending','cancelled') NOT NULL DEFAULT 'completed',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `Tanawuttanun_Hom_orders`
--

INSERT INTO `Tanawuttanun_Hom_orders` (`id`, `user_id`, `order_number`, `total_amount`, `shipping_fee`, `total_items`, `status`, `created_at`) VALUES
(1, 3, 'ORD-1788374250217-8512', 42889.00, 0.00, 12, 'completed', '2026-09-02 18:37:30'),
(2, 3, 'ORD-1788374340465-7505', 3989.00, 0.00, 2, 'completed', '2026-09-02 18:39:00'),
(3, 5, 'ORD-1788374392311-2339', 15668.00, 0.00, 5, 'completed', '2026-09-02 18:39:52'),
(4, 3, 'ORD-1788405002298-5106', 27230.00, 0.00, 7, 'completed', '2026-09-03 03:10:02');

-- --------------------------------------------------------

--
-- Table structure for table `Tanawuttanun_Hom_order_items`
--

CREATE TABLE `Tanawuttanun_Hom_order_items` (
  `id` int NOT NULL,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `color` varchar(50) DEFAULT '',
  `price` decimal(10,2) NOT NULL,
  `quantity` int NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `Tanawuttanun_Hom_order_items`
--

INSERT INTO `Tanawuttanun_Hom_order_items` (`id`, `order_id`, `product_id`, `product_name`, `color`, `price`, `quantity`, `subtotal`, `created_at`) VALUES
(1, 1, 1, 'Apple MagSafe Battery Pack', '#0A1F44', 3890.00, 10, 38900.00, '2026-09-02 18:37:30'),
(2, 1, 23, 'test01', '#0A192F', 1990.00, 1, 1990.00, '2026-09-02 18:37:30'),
(3, 1, 25, 'test', '#0A192F', 1999.00, 1, 1999.00, '2026-09-02 18:37:30'),
(4, 2, 23, 'test01', '#0A192F', 1990.00, 1, 1990.00, '2026-09-02 18:39:00'),
(5, 2, 25, 'test', '#0A192F', 1999.00, 1, 1999.00, '2026-09-02 18:39:00'),
(6, 3, 1, 'Apple MagSafe Battery Pack', '#0A1F44', 3890.00, 3, 11670.00, '2026-09-02 18:39:52'),
(7, 3, 25, 'test', '#0A192F', 1999.00, 2, 3998.00, '2026-09-02 18:39:52'),
(8, 4, 1, 'Apple MagSafe Battery Pack', '#0A1F44', 3890.00, 7, 27230.00, '2026-09-03 03:10:02');

-- --------------------------------------------------------

--
-- Table structure for table `Tanawuttanun_Hom_products`
--

CREATE TABLE `Tanawuttanun_Hom_products` (
  `id` int NOT NULL,
  `name` varchar(150) NOT NULL,
  `model` varchar(100) DEFAULT NULL,
  `capacity` varchar(50) NOT NULL,
  `price` int NOT NULL,
  `stock` int UNSIGNED NOT NULL DEFAULT '0',
  `imageUrl` text NOT NULL,
  `colors` json DEFAULT NULL,
  `features` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `Tanawuttanun_Hom_products`
--

INSERT INTO `Tanawuttanun_Hom_products` (`id`, `name`, `model`, `capacity`, `price`, `stock`, `imageUrl`, `colors`, `features`, `created_at`, `updated_at`) VALUES
(1, 'Apple MagSafe Battery Pack', 'Standard', '1460 mAh', 3890, 40, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRYj2BRFvMSZ10HsNfgl5q6GKRvU2DNzrHABksPrt-wPQ&s=10', '[\"#0A1F44\", \"#D4AF37\", \"#FFFFFF\"]', '[\"Fast Charging\", \"Durable\", \"Safe\"]', '2026-08-14 12:42:38', '2026-09-03 03:10:02');

-- --------------------------------------------------------

--
-- Table structure for table `Tanawuttanun_Hom_users`
--

CREATE TABLE `Tanawuttanun_Hom_users` (
  `id` int NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(254) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'เก็บรหัสผ่านที่เข้ารหัสแล้ว',
  `role` enum('admin','user') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Tanawuttanun_Hom_users`
--

INSERT INTO `Tanawuttanun_Hom_users` (`id`, `username`, `email`, `password`, `role`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Sanhansome', 'sanhansome2548dd@gmail.com', '$2b$10$1Ik1yY8udCZUpdTzGS32lOBN.cl3x/rlvehCR.D.HIbhOwhHFNFnO', 'user', 1, '2026-08-14 14:44:19', '2026-08-14 14:44:19'),
(2, 'jayjaypongasKorn', 'nungsan33dd@gmail.com', '$2b$10$p6omEU0z1RFrMvb1kO6ecunYHtP/FnkxeYQKOtUF2062fRo/olPG2', 'user', 1, '2026-08-25 16:46:53', '2026-08-25 16:46:53'),
(3, 'admin01', 'admin01@gmail.com', '$2b$10$ByoTEy8zao2u0n1ST8BNXe6STWlpgGhKrYMxZxw7.TmPhVaqMxz7u', 'admin', 1, '2026-08-26 17:33:30', '2026-08-26 17:34:37'),
(4, 'jayjay01', 'jayjay01za@gmail.com', '$2b$10$P8DqYtHkhag.HCG2HJYnhu0I8HL7B/.XhPld0z5fhHjzO99pOewY2', 'user', 1, '2026-08-26 17:42:23', '2026-08-26 17:42:23'),
(5, 'Jaypongaskorn', 'jay@gmail.com', '$2b$10$rkwaTT4SGBToCDol2Un8y.m6D2hX1BL0Fczd6bM/sxtCRecK7MLE.', 'user', 1, '2026-09-02 16:16:22', '2026-09-02 16:16:22');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `Tanawuttanun_Hom_carts`
--
ALTER TABLE `Tanawuttanun_Hom_carts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `idx_carts_user_id` (`user_id`);

--
-- Indexes for table `Tanawuttanun_Hom_cart_items`
--
ALTER TABLE `Tanawuttanun_Hom_cart_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_cart_product_color` (`cart_id`,`product_id`,`color`),
  ADD KEY `idx_cart_items_cart_id` (`cart_id`),
  ADD KEY `idx_cart_items_product_id` (`product_id`);

--
-- Indexes for table `Tanawuttanun_Hom_orders`
--
ALTER TABLE `Tanawuttanun_Hom_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_number` (`order_number`),
  ADD KEY `idx_orders_user_id` (`user_id`),
  ADD KEY `idx_orders_order_number` (`order_number`);

--
-- Indexes for table `Tanawuttanun_Hom_order_items`
--
ALTER TABLE `Tanawuttanun_Hom_order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_items_order_id` (`order_id`),
  ADD KEY `idx_order_items_product_id` (`product_id`);

--
-- Indexes for table `Tanawuttanun_Hom_products`
--
ALTER TABLE `Tanawuttanun_Hom_products`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `Tanawuttanun_Hom_users`
--
ALTER TABLE `Tanawuttanun_Hom_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `uq_tanawuttanun_hom_users_email` (`email`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_users_username` (`username`),
  ADD UNIQUE KEY `uq_users_email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `Tanawuttanun_Hom_carts`
--
ALTER TABLE `Tanawuttanun_Hom_carts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `Tanawuttanun_Hom_cart_items`
--
ALTER TABLE `Tanawuttanun_Hom_cart_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `Tanawuttanun_Hom_orders`
--
ALTER TABLE `Tanawuttanun_Hom_orders`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `Tanawuttanun_Hom_order_items`
--
ALTER TABLE `Tanawuttanun_Hom_order_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `Tanawuttanun_Hom_products`
--
ALTER TABLE `Tanawuttanun_Hom_products`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `Tanawuttanun_Hom_users`
--
ALTER TABLE `Tanawuttanun_Hom_users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
