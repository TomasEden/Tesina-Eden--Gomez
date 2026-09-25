-- Senderos — exportación de la base `senderos_db`
-- Generado: 2026-09-21 19:21:55 (America/Argentina/Cordoba)
-- Servidor: localhost:3307 — 10.4.32-MariaDB
-- Contiene estructura Y datos, incluida la fila del administrador
-- (email + password_hash + rol), así se conserva la contraseña.
-- Restaurar: mysql -h 127.0.0.1 -P 3307 -uroot senderos_db < este_archivo.sql

SET NAMES utf8mb4;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;

-- --------------------------------------------------------
-- Estructura de la tabla `ofertas`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `ofertas`;
CREATE TABLE `ofertas` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `tipo` enum('porcentaje','precio_fijo','2x1','texto') NOT NULL,
  `descuento` decimal(12,2) NOT NULL DEFAULT 0.00,
  `aplica` enum('todos','servicios','productos','especifico') NOT NULL DEFAULT 'todos',
  `especifico` text DEFAULT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `dias` varchar(50) DEFAULT NULL,
  `color` varchar(30) DEFAULT NULL,
  `estado` enum('activa','pausada') NOT NULL DEFAULT 'activa',
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_ofertas_estado` (`estado`),
  KEY `idx_ofertas_fechas` (`fecha_inicio`,`fecha_fin`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos de la tabla `ofertas`
-- --------------------------------------------------------
INSERT INTO `ofertas` (`id`, `nombre`, `descripcion`, `tipo`, `descuento`, `aplica`, `especifico`, `fecha_inicio`, `fecha_fin`, `dias`, `color`, `estado`, `creado_en`, `actualizado_en`) VALUES
(10, '20% OFF de bienvenida', '20% OFF en todo el catálogo', 'porcentaje', '20.00', 'todos', NULL, '2026-09-21', '2026-09-26', '', '#AD717E', 'activa', '2026-09-21 13:56:21', '2026-09-21 13:56:21');

-- --------------------------------------------------------
-- Estructura de la tabla `pedidos`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `pedidos`;
CREATE TABLE `pedidos` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` int(10) unsigned NOT NULL,
  `total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `estado` varchar(40) NOT NULL DEFAULT 'pendiente',
  `metodo_pago` varchar(50) NOT NULL DEFAULT 'efectivo',
  `entrega` varchar(40) NOT NULL DEFAULT 'retiro',
  `direccion_envio` varchar(500) DEFAULT NULL,
  `pago_grupo` varchar(40) NOT NULL DEFAULT 'todo',
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_pedidos_usuario` (`usuario_id`),
  KEY `idx_pedidos_estado` (`estado`),
  CONSTRAINT `fk_pedidos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos de la tabla `pedidos`
-- --------------------------------------------------------
INSERT INTO `pedidos` (`id`, `usuario_id`, `total`, `estado`, `metodo_pago`, `entrega`, `direccion_envio`, `pago_grupo`, `creado_en`, `actualizado_en`) VALUES
(7, 4, '278516.80', 'pendiente', 'debito', 'envio', 'fbcfbcvb', 'todo', '2026-09-21 15:00:20', '2026-09-21 15:00:20'),
(9, 4, '119750.40', 'pendiente', 'transferencia', 'retiro', NULL, 'servicios', '2026-09-21 15:37:08', '2026-09-21 15:37:08'),
(10, 4, '115818.40', 'pendiente', 'debito', 'retiro', NULL, 'todo', '2026-09-21 16:17:58', '2026-09-21 16:17:58'),
(11, 4, '53600.00', 'pendiente', 'transferencia', 'retiro', NULL, 'todo', '2026-09-21 16:18:38', '2026-09-21 16:18:38'),
(12, 4, '80044.80', 'pendiente', 'transferencia', 'retiro', NULL, 'servicios', '2026-09-21 17:18:34', '2026-09-21 17:18:34');

-- --------------------------------------------------------
-- Estructura de la tabla `pedido_items`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `pedido_items`;
CREATE TABLE `pedido_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `pedido_id` int(10) unsigned NOT NULL,
  `producto_id` int(10) unsigned DEFAULT NULL,
  `servicio_id` int(10) unsigned DEFAULT NULL,
  `tipo` enum('producto','servicio') NOT NULL DEFAULT 'producto',
  `nombre` varchar(255) NOT NULL,
  `precio` decimal(12,2) NOT NULL DEFAULT 0.00,
  `cantidad` int(10) unsigned NOT NULL DEFAULT 1,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_items_pedido` (`pedido_id`),
  KEY `idx_items_producto` (`producto_id`),
  KEY `idx_items_servicio` (`servicio_id`),
  CONSTRAINT `fk_items_pedido` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_items_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_items_servicio` FOREIGN KEY (`servicio_id`) REFERENCES `servicios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos de la tabla `pedido_items`
-- --------------------------------------------------------
INSERT INTO `pedido_items` (`id`, `pedido_id`, `producto_id`, `servicio_id`, `tipo`, `nombre`, `precio`, `cantidad`, `creado_en`) VALUES
(11, 7, 3, NULL, 'producto', 'Emulgel Antiage Descongestivo para hombre', '23007.20', 1, '2026-09-21 15:00:20'),
(12, 7, 2, NULL, 'producto', 'Crema facial células madre + colágeno y elastina 50 mL.', '23773.60', 3, '2026-09-21 15:00:20'),
(13, 7, 1, NULL, 'producto', 'Platinum crema facial de noche liposomada con multiactivos concentrados', '34247.20', 4, '2026-09-21 15:00:20'),
(14, 7, NULL, 36, 'servicio', 'Masaje descontracturante', '17600.00', 1, '2026-09-21 15:00:20'),
(15, 7, NULL, NULL, 'servicio', 'Masaje relajante', '14400.00', 1, '2026-09-21 15:00:20'),
(16, 7, NULL, 39, 'servicio', 'Soft gel', '14400.00', 1, '2026-09-21 15:00:20'),
(19, 9, 3, NULL, 'producto', 'Emulgel Antiage Descongestivo para hombre', '23007.20', 1, '2026-09-21 15:37:08'),
(20, 9, 2, NULL, 'producto', 'Crema facial células madre + colágeno y elastina 50 mL.', '23773.60', 1, '2026-09-21 15:37:08'),
(21, 9, 8, NULL, 'producto', 'Crema para masajes relax', '19520.80', 1, '2026-09-21 15:37:08'),
(22, 9, 6, NULL, 'producto', 'Crema corporal con urea', '15848.80', 1, '2026-09-21 15:37:08'),
(23, 9, NULL, 45, 'servicio', 'Uñas encarnadas', '11200.00', 1, '2026-09-21 15:37:08'),
(24, 9, NULL, 44, 'servicio', 'Belleza de pies', '12000.00', 1, '2026-09-21 15:37:08'),
(25, 9, NULL, 46, 'servicio', 'Extracción de verrugas y helomas', '14400.00', 1, '2026-09-21 15:37:08'),
(26, 10, 4, NULL, 'producto', 'Gel de seda para párpados', '13037.60', 1, '2026-09-21 16:17:58'),
(27, 10, 2, NULL, 'producto', 'Crema facial células madre + colágeno y elastina 50 mL.', '23773.60', 1, '2026-09-21 16:17:58'),
(28, 10, 3, NULL, 'producto', 'Emulgel Antiage Descongestivo para hombre', '23007.20', 1, '2026-09-21 16:17:58'),
(29, 10, NULL, 37, 'servicio', 'Masaje reductor', '16000.00', 1, '2026-09-21 16:17:58'),
(30, 10, NULL, 36, 'servicio', 'Masaje descontracturante', '17600.00', 1, '2026-09-21 16:17:58'),
(31, 10, NULL, 40, 'servicio', 'Spa de manos', '8000.00', 1, '2026-09-21 16:17:58'),
(32, 10, NULL, 39, 'servicio', 'Soft gel', '14400.00', 1, '2026-09-21 16:17:58'),
(33, 11, NULL, 37, 'servicio', 'Masaje reductor', '16000.00', 1, '2026-09-21 16:18:38'),
(34, 11, NULL, 36, 'servicio', 'Masaje descontracturante', '17600.00', 1, '2026-09-21 16:18:38'),
(35, 11, NULL, 38, 'servicio', 'Masaje post operatorio', '20000.00', 1, '2026-09-21 16:18:38'),
(36, 12, 3, NULL, 'producto', 'Emulgel Antiage Descongestivo para hombre', '23007.20', 1, '2026-09-21 17:18:34'),
(37, 12, 4, NULL, 'producto', 'Gel de seda para párpados', '13037.60', 1, '2026-09-21 17:18:34'),
(38, 12, NULL, 37, 'servicio', 'Masaje reductor', '16000.00', 1, '2026-09-21 17:18:34'),
(39, 12, NULL, 38, 'servicio', 'Masaje post operatorio', '20000.00', 1, '2026-09-21 17:18:34'),
(40, 12, NULL, 40, 'servicio', 'Spa de manos', '8000.00', 1, '2026-09-21 17:18:34');

-- --------------------------------------------------------
-- Estructura de la tabla `productos`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `productos`;
CREATE TABLE `productos` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `marca` varchar(120) NOT NULL,
  `categoria` varchar(120) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `precio` decimal(12,2) NOT NULL DEFAULT 0.00,
  `stock_cantidad` int(11) NOT NULL DEFAULT 0,
  `badge` varchar(100) DEFAULT NULL,
  `imagen` varchar(500) DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_productos_marca` (`marca`),
  KEY `idx_productos_categoria` (`categoria`),
  KEY `idx_productos_stock` (`stock_cantidad`)
) ENGINE=InnoDB AUTO_INCREMENT=72 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos de la tabla `productos`
-- --------------------------------------------------------
INSERT INTO `productos` (`id`, `nombre`, `marca`, `categoria`, `descripcion`, `precio`, `stock_cantidad`, `badge`, `imagen`, `creado_en`) VALUES
(1, 'Platinum crema facial de noche liposomada con multiactivos concentrados', 'Selecta', 'Facial', 'Platinum crema facial de noche liposomada con multiactivos concentrados', '42809.00', 16, NULL, NULL, '2026-09-02 16:04:24'),
(2, 'Crema facial células madre + colágeno y elastina 50 mL.', 'Selecta', 'Facial', 'Crema facial células madre + colágeno y elastina 50 mL.', '29717.00', 24, NULL, NULL, '2026-09-02 16:04:24'),
(3, 'Emulgel Antiage Descongestivo para hombre', 'Selecta', 'Facial', 'Emulgel Antiage Descongestivo para hombre', '28759.00', 11, NULL, NULL, '2026-09-02 16:04:24'),
(4, 'Gel de seda para párpados', 'Selecta', 'Facial', 'Gel de seda para párpados', '16297.00', 19, NULL, NULL, '2026-09-02 16:04:24'),
(5, 'Crema facial hidratante con colágeno y elastina + vit. A y E. 50 mL.', 'Selecta', 'Facial', 'Crema facial hidratante con colágeno y elastina + vit. A y E. 50 mL.', '24924.00', 26, NULL, NULL, '2026-09-02 16:04:24'),
(6, 'Crema corporal con urea', 'Selecta', 'Corporal', 'Crema corporal con urea', '19811.00', 17, NULL, NULL, '2026-09-02 16:04:24'),
(7, 'Gel espuma de limpieza', 'Selecta', 'Corporal', 'Gel espuma de limpieza', '22687.00', 37, NULL, NULL, '2026-09-02 16:04:24'),
(8, 'Crema para masajes relax', 'Selecta', 'Corporal', 'Crema para masajes relax', '24401.00', 39, NULL, NULL, '2026-09-02 16:04:24'),
(9, 'Gel liposomado reductor', 'Selecta', 'Corporal', 'Gel liposomado reductor', '31635.00', 22, NULL, NULL, '2026-09-02 16:04:24'),
(10, 'Crema facial filamentos de ADN', 'Selecta', 'Facial', 'Crema facial filamentos de ADN', '24605.00', 19, NULL, NULL, '2026-09-02 16:04:24'),
(11, 'Crema para pieles delicadas', 'Selecta', 'Facial', 'Crema para pieles delicadas', '23966.00', 23, NULL, NULL, '2026-09-02 16:04:24'),
(12, 'Serum Niacinamida 10% + AC Salicílico y Glicólico 30 ml', 'Jules', 'Facial', 'Serum Niacinamida 10% + AC Salicílico y Glicólico 30 ml', '42000.00', 12, NULL, NULL, '2026-09-02 16:04:24'),
(13, 'Contorno de ojos | Cafeína, Hialurónico + Colágeno 30 ml', 'Jules', 'Facial', 'Contorno de ojos con cafeína, ácido hialurónico y colágeno. 30 ml.', '42800.00', 10, NULL, NULL, '2026-09-02 16:04:24'),
(14, 'Acondicionador de Karité | Todo tipo de cabello', 'Jules', 'Capilar', 'Acondicionador de Karité para todo tipo de cabello.', '16900.00', 20, NULL, NULL, '2026-09-02 16:04:24'),
(15, 'Champú de Bergamota | Normal', 'Jules', 'Capilar', 'Champú de Bergamota para cabello normal.', '17900.00', 20, NULL, NULL, '2026-09-02 16:04:24'),
(16, 'Acondicionador crema con Karité y aceite de oliva 200 ml', 'Jules', 'Capilar', 'Acondicionador crema con Karité y aceite de oliva. 200 ml.', '15900.00', 10, NULL, NULL, '2026-09-02 16:04:24'),
(17, 'Crema para peinar con fragancia frutal 125 ml', 'Jules', 'Capilar', 'Crema para peinar con fragancia frutal. 125 ml.', '16900.00', 12, NULL, NULL, '2026-09-02 16:04:24'),
(18, 'Serum capilar extraordinario 4 en 1. 30 ml', 'Jules', 'Capilar', 'Serum capilar extraordinario 4 en 1. 30 ml.', '25900.00', 15, NULL, NULL, '2026-09-02 16:04:24'),
(19, 'Máscara capilar Argán & Karité 160 ml', 'Jules', 'Capilar', 'Máscara capilar de Argán y Karité. 160 ml.', '21500.00', 11, NULL, NULL, '2026-09-02 16:04:24'),
(20, 'Crema corporal Karité 400 ml', 'Jules', 'Corporal', 'Crema corporal con Karité. 400 ml.', '36890.00', 20, NULL, NULL, '2026-09-02 16:04:24'),
(21, 'Crema para manos reparadora con lavanda y vainilla 75 ml', 'Jules', 'Corporal', 'Crema reparadora para manos con lavanda y vainilla. 75 ml.', '17900.00', 15, NULL, NULL, '2026-09-02 16:04:24'),
(22, 'Bálsamo Labial Nutritivo con Ácido Hialurónico 5 g', 'Jules', 'Corporal', 'Bálsamo labial nutritivo con ácido hialurónico. 5 g.', '17900.00', 10, NULL, NULL, '2026-09-02 16:04:24'),
(23, 'Tinta de labios larga duración – Peony – Nina Tint', 'Natacha Nina', 'Facial', 'Tinta de labios de larga duración. Peony – Nina Tint.', '14100.00', 20, NULL, NULL, '2026-09-02 16:04:24'),
(24, 'Labial líquido larga duración | Toy Mala | Liquidación | Liquid Pouty Lips', 'Natacha Nina', 'Facial', 'Labial líquido de larga duración. Toy Mala – Liquid Pouty Lips.', '19000.00', 32, NULL, NULL, '2026-09-02 16:04:24'),
(25, 'Gloss brillo labial – Berry Plump', 'Natacha Nina', 'Facial', 'Gloss de brillo labial Berry Plump.', '22600.00', 23, NULL, NULL, '2026-09-02 16:04:24'),
(26, 'Labial cremoso larga duración – Mimami – Pouty Lips', 'Natacha Nina', 'Facial', 'Labial cremoso de larga duración. Mimami – Pouty Lips.', '9100.00', 23, NULL, NULL, '2026-09-02 16:04:24'),
(27, 'Contorno oscuro / Paleta Pepper – Polvo Compacto', 'Natacha Nina', 'Facial', 'Paleta Pepper de polvo compacto para contorno oscuro.', '54800.00', 22, NULL, NULL, '2026-09-02 16:04:24'),
(28, 'Polvo volátil translúcido – Tulum – Matte Blur Skin', 'Natacha Nina', 'Facial', 'Polvo volátil translúcido Tulum – Matte Blur Skin.', '42500.00', 14, NULL, NULL, '2026-09-02 16:04:24'),
(29, 'Blushy Cheeks – RO60', 'Natacha Nina', 'Facial', 'Blush Blushy Cheeks tono RO60.', '24200.00', 30, NULL, NULL, '2026-09-02 16:04:24'),
(30, 'Blushy Cheeks – RS10', 'Natacha Nina', 'Facial', 'Blush Blushy Cheeks tono RS10.', '24200.00', 30, NULL, NULL, '2026-09-02 16:04:24'),
(31, 'Bronzer / Golden Sun', 'Natacha Nina', 'Facial', 'Bronzer Golden Sun.', '16000.00', 30, NULL, NULL, '2026-09-02 16:04:24'),
(32, 'Crema iluminadora corporal con color – Stay Bronze', 'Natacha Nina', 'Facial', 'Crema iluminadora corporal con color Stay Bronze.', '30000.00', 30, NULL, NULL, '2026-09-02 16:04:24'),
(33, 'Shimmer Fix Spray – Glitters en aerosol – Gold', 'Natacha Nina', 'Facial', 'Shimmer Fix Spray con glitters en aerosol, tono Gold.', '13900.00', 34, NULL, NULL, '2026-09-02 16:04:24'),
(34, 'Agua termal en spray – Aquatherma', 'Natacha Nina', 'Facial', 'Agua termal en spray Aquatherma.', '18700.00', 22, NULL, NULL, '2026-09-02 16:04:24'),
(35, 'Protector solar – Stay Radiant – Tono claro – Emulsión 50 FPS', 'Natacha Nina', 'Facial', 'Protector solar Stay Radiant, tono claro, emulsión 50 FPS.', '39600.00', 33, NULL, NULL, '2026-09-02 16:04:24'),
(36, 'Tinted Serum Color – Latte – Skin on Skin', 'Natacha Nina', 'Facial', 'Tinted Serum Color tono Latte – Skin on Skin.', '39600.00', 11, NULL, NULL, '2026-09-02 16:04:24'),
(37, 'Set de bases | Ponche Crema + Mamá Juana + Cuba Libre de regalo', 'Natacha Nina', 'Facial', 'Set de bases con Ponche Crema, Mamá Juana y Cuba Libre de regalo.', '83700.00', 32, NULL, NULL, '2026-09-02 16:04:24'),
(38, 'Set Tinted Latte | 2da unidad de regalo', 'Natacha Nina', 'Facial', 'Set Tinted Latte con segunda unidad de regalo.', '39600.00', 32, NULL, NULL, '2026-09-02 16:04:24'),
(39, 'Set de correctores | Vanilla Sundae + Toffee Melt + Cocoa Syrup de regalo', 'Natacha Nina', 'Facial', 'Set de correctores Vanilla Sundae, Toffee Melt y Cocoa Syrup de regalo.', '24000.00', 23, NULL, NULL, '2026-09-02 16:04:24'),
(40, 'Gel Liner Perfect Line – Delineador en gel', 'Natacha Nina', 'Facial', 'Delineador en gel Gel Liner Perfect Line.', '27500.00', 30, NULL, NULL, '2026-09-02 16:04:24'),
(41, 'Delineador líquido larga duración – Fine Line', 'Natacha Nina', 'Facial', 'Delineador líquido de larga duración Fine Line.', '22000.00', 30, NULL, NULL, '2026-09-02 16:04:24'),
(42, 'Pomada de cejas – Crepe 00', 'Natacha Nina', 'Facial', 'Pomada para cejas tono Crepe 00.', '22000.00', 20, NULL, NULL, '2026-09-02 16:04:24'),
(43, 'Kit pinceles inicial', 'Natacha Nina', 'Facial', 'Kit inicial de pinceles para maquillaje.', '97284.00', 20, NULL, NULL, '2026-09-02 16:04:24'),
(44, 'Corner Lashes – Pestañas esquineras', 'Natacha Nina', 'Facial', 'Pestañas esquineras Corner Lashes.', '50200.00', 20, NULL, NULL, '2026-09-02 16:04:24'),
(45, 'Pre Base Mate Minimizadora Ultra HD', 'Mila Marzi', 'Maquillaje', 'Pre base mate minimizadora Ultra HD.', '52000.00', 0, NULL, NULL, '2026-09-02 16:04:24'),
(46, 'Fluidificador de Texturas - Apto HD', 'Mila Marzi', 'Maquillaje', 'Fluidificador de texturas apto HD.', '29000.00', 0, NULL, NULL, '2026-09-02 16:04:24'),
(47, 'Maquillaje Líquido', 'Mila Marzi', 'Maquillaje', 'Maquillaje líquido.', '30000.00', 0, NULL, NULL, '2026-09-02 16:04:24'),
(48, 'Maquillaje Líquido Efecto Polvo - HD', 'Mila Marzi', 'Maquillaje', 'Maquillaje líquido efecto polvo HD.', '48000.00', 0, NULL, NULL, '2026-09-02 16:04:24'),
(49, 'Set de Base Alta Cobertura ULTRA HD', 'Mila Marzi', 'Maquillaje', 'Set de base de alta cobertura ULTRA HD.', '160000.00', 0, NULL, NULL, '2026-09-02 16:04:24'),
(50, 'Corrector Óptico Ultra HD Perfector', 'Mila Marzi', 'Maquillaje', 'Corrector óptico Ultra HD Perfector.', '36000.00', 0, NULL, NULL, '2026-09-02 16:04:24'),
(51, 'Set Rubor Cremoso Duo Universal', 'Mila Marzi', 'Maquillaje', 'Set de rubor cremoso Duo Universal.', '30000.00', 0, NULL, NULL, '2026-09-02 16:04:24'),
(52, 'Rubor Compacto', 'Mila Marzi', 'Maquillaje', 'Rubor compacto.', '12600.00', 0, NULL, NULL, '2026-09-02 16:04:24'),
(53, 'Polvo Compacto Microfinish ULTRA HD', 'Mila Marzi', 'Maquillaje', 'Polvo compacto Microfinish ULTRA HD.', '45000.00', 0, NULL, NULL, '2026-09-02 16:04:24'),
(54, 'Maquillaje compacto al agua mate', 'Mila Marzi', 'Maquillaje', 'Maquillaje compacto al agua con acabado mate.', '38000.00', 0, NULL, NULL, '2026-09-02 16:04:24'),
(55, 'Polvo Compacto Satinado Mix | Duo Bronzer-Pink', 'Mila Marzi', 'Maquillaje', 'Polvo compacto satinado Mix Duo Bronzer-Pink.', '42000.00', 0, NULL, NULL, '2026-09-02 16:04:24'),
(56, 'Fijador Multifunción - Apto HD', 'Mila Marzi', 'Maquillaje', 'Fijador multifunción apto HD.', '32000.00', 0, NULL, NULL, '2026-09-02 16:04:24'),
(57, 'Diluyente para Sombras - Apto HD', 'Mila Marzi', 'Maquillaje', 'Diluyente para sombras apto HD.', '20000.00', 0, NULL, NULL, '2026-09-02 16:04:24'),
(58, 'Delineador Líquido - Tinta', 'Mila Marzi', 'Maquillaje', 'Delineador líquido tipo tinta.', '22000.00', 0, NULL, NULL, '2026-09-02 16:04:24'),
(59, 'Delineador en gel - Apto HD', 'Mila Marzi', 'Maquillaje', 'Delineador en gel apto HD.', '25000.00', 0, NULL, NULL, '2026-09-02 16:04:24'),
(60, 'Base Alta Cobertura Ultra HD | Pasta de Corte', 'Mila Marzi', 'Maquillaje', 'Base de alta cobertura Ultra HD, pasta de corte.', '20000.00', 0, NULL, NULL, '2026-09-02 16:04:24'),
(61, 'Sombra en Polvo Perla Cristal Diamante', 'Mila Marzi', 'Maquillaje', 'Sombra en polvo Perla Cristal Diamante.', '27000.00', 0, NULL, NULL, '2026-09-02 16:04:24'),
(62, 'Sombra en Polvo Diamante - Cristales de Luz', 'Mila Marzi', 'Maquillaje', 'Sombra en polvo Diamante, Cristales de Luz.', '27000.00', 0, NULL, NULL, '2026-09-02 16:04:24'),
(63, 'Sombra en Polvo Pigmento Puro', 'Mila Marzi', 'Maquillaje', 'Sombra en polvo Pigmento Puro.', '15000.00', 0, NULL, NULL, '2026-09-02 16:04:24'),
(64, 'Sombra en Polvo Perla', 'Mila Marzi', 'Maquillaje', 'Sombra en polvo Perla.', '18500.00', 0, NULL, NULL, '2026-09-02 16:04:24'),
(65, 'Paleta Inspiración', 'Mila Marzi', 'Maquillaje', 'Paleta de maquillaje Inspiración.', '150000.00', 0, NULL, NULL, '2026-09-02 16:04:24'),
(66, 'Bálsamo Modelador de Cejas y Pestañas', 'Mila Marzi', 'Maquillaje', 'Bálsamo modelador para cejas y pestañas.', '29500.00', 0, NULL, NULL, '2026-09-02 16:04:24'),
(67, 'Máscara para Pestañas - Resistente al Agua', 'Mila Marzi', 'Maquillaje', 'Máscara para pestañas resistente al agua.', '22000.00', 0, NULL, NULL, '2026-09-02 16:04:24'),
(68, 'Pre Base Para Labios Cristal HD', 'Mila Marzi', 'Maquillaje', 'Pre base para labios Cristal HD.', '27500.00', 0, NULL, NULL, '2026-09-02 16:04:24'),
(69, 'Labial Vitamina Flash Shimmer', 'Mila Marzi', 'Maquillaje', 'Labial Vitamina Flash Shimmer.', '19000.00', 0, NULL, NULL, '2026-09-02 16:04:24'),
(70, 'Labial Vitamina', 'Mila Marzi', 'Maquillaje', 'Labial Vitamina.', '19000.00', 0, NULL, NULL, '2026-09-02 16:04:24'),
(71, 'Mila Lip Oil Balm | Bálsamo Nutritivo para Labios', 'Mila Marzi', 'Maquillaje', 'Mila Lip Oil Balm, bálsamo nutritivo para labios.', '25500.00', 0, NULL, NULL, '2026-09-02 16:04:24');

-- --------------------------------------------------------
-- Estructura de la tabla `resenas`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `resenas`;
CREATE TABLE `resenas` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `servicio_id` int(10) unsigned DEFAULT NULL,
  `servicio_slug` varchar(190) DEFAULT NULL,
  `producto_id` int(10) unsigned DEFAULT NULL,
  `producto_nombre` varchar(255) DEFAULT NULL,
  `usuario_id` int(10) unsigned NOT NULL,
  `nombre_usuario` varchar(220) DEFAULT NULL,
  `estrellas` tinyint(3) unsigned NOT NULL,
  `texto` varchar(600) NOT NULL,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_resena_usuario_servicio` (`usuario_id`,`servicio_slug`),
  KEY `idx_resenas_servicio_slug` (`servicio_slug`),
  KEY `idx_resenas_servicio_id` (`servicio_id`),
  KEY `idx_resenas_producto` (`producto_id`),
  CONSTRAINT `fk_resenas_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_resenas_servicio` FOREIGN KEY (`servicio_id`) REFERENCES `servicios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_resenas_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos de la tabla `resenas`
-- --------------------------------------------------------
INSERT INTO `resenas` (`id`, `servicio_id`, `servicio_slug`, `producto_id`, `producto_nombre`, `usuario_id`, `nombre_usuario`, `estrellas`, `texto`, `creado_en`) VALUES
(1, NULL, 'masaje-reductor', NULL, NULL, 2, 'Administrador 2 S.', 5, 'dfhgdfghfdg', '2026-09-21 15:45:12');

-- --------------------------------------------------------
-- Estructura de la tabla `servicios`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `servicios`;
CREATE TABLE `servicios` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `slug` varchar(190) NOT NULL,
  `categoria` varchar(120) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `duracion` int(11) NOT NULL DEFAULT 0,
  `precio` decimal(12,2) NOT NULL DEFAULT 0.00,
  `imagen` varchar(500) DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  `badge` varchar(100) DEFAULT NULL,
  `badge_texto` varchar(150) DEFAULT NULL,
  `incluye` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_servicios_slug` (`slug`),
  KEY `idx_servicios_categoria` (`categoria`)
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos de la tabla `servicios`
-- --------------------------------------------------------
INSERT INTO `servicios` (`id`, `nombre`, `slug`, `categoria`, `descripcion`, `duracion`, `precio`, `imagen`, `creado_en`, `badge`, `badge_texto`, `incluye`) VALUES
(36, 'Masaje descontracturante', 'masaje-descontracturante', 'Masaje corporal', 'Masaje orientado a aliviar tensiones y contracturas musculares.', 60, '22000.00', NULL, '2026-08-18 15:21:37', 'Popular', 'Más elegido', 'Masaje corporal'),
(37, 'Masaje reductor', 'masaje-reductor', 'Masaje corporal', 'Tratamiento corporal enfocado en mejorar el aspecto de determinadas zonas.', 45, '20000.00', NULL, '2026-08-18 15:21:37', NULL, NULL, 'Tratamiento reductor'),
(38, 'Masaje post operatorio', 'masaje-post-operatorio', 'Masaje corporal', 'Tratamiento corporal complementario al proceso postoperatorio.', 60, '25000.00', NULL, '2026-08-18 15:21:37', NULL, NULL, 'Tratamiento especializado'),
(39, 'Soft gel', 'soft-gel', 'Manicura', 'Servicio de manicura con técnica soft gel.', 90, '18000.00', NULL, '2026-08-18 15:21:37', 'Nuevo', 'Tendencia', 'Preparación, colocación y esmaltado'),
(40, 'Spa de manos', 'spa-de-manos', 'Manicura', 'Tratamiento de cuidado y relajación para las manos.', 45, '10000.00', NULL, '2026-08-18 15:21:37', NULL, NULL, 'Exfoliación e hidratación'),
(41, 'Baño de parafina', 'bano-de-parafina', 'Manicura', 'Tratamiento hidratante para manos mediante parafina.', 30, '8000.00', NULL, '2026-08-18 15:21:37', NULL, NULL, 'Hidratación profunda'),
(42, 'Secado rápido', 'secado-rapido', 'Manicura', 'Servicio de secado rápido de uñas.', 15, '5000.00', NULL, '2026-08-18 15:21:37', NULL, NULL, 'Secado de uñas'),
(43, 'Semipermanente', 'semipermanente', 'Manicura', 'Esmaltado semipermanente de uñas.', 60, '12000.00', NULL, '2026-08-18 15:21:37', 'Popular', 'Más elegido', 'Preparación y esmaltado'),
(44, 'Belleza de pies', 'belleza-de-pies', 'Podología', 'Tratamiento estético y cuidado general de los pies.', 60, '15000.00', NULL, '2026-08-18 15:21:37', NULL, NULL, 'Limpieza y cuidado de pies'),
(45, 'Uñas encarnadas', 'unas-encarnadas', 'Podología', 'Atención y cuidado de uñas encarnadas.', 45, '14000.00', NULL, '2026-08-18 15:21:37', NULL, NULL, 'Tratamiento podológico'),
(46, 'Extracción de verrugas y helomas', 'extraccion-verrugas-helomas', 'Podología', 'Tratamiento podológico para verrugas y helomas.', 60, '18000.00', NULL, '2026-08-18 15:21:37', NULL, NULL, 'Tratamiento podológico'),
(47, 'Pie diabético', 'pie-diabetico', 'Podología', 'Cuidado especializado del pie diabético.', 75, '22000.00', NULL, '2026-08-18 15:21:37', 'Especial', 'Atención especial', 'Evaluación y cuidado de pies'),
(48, 'Maquillaje social', 'maquillaje-social', 'Maquillaje', 'Maquillaje profesional para ocasiones sociales.', 60, '18000.00', NULL, '2026-08-18 15:21:37', NULL, NULL, 'Maquillaje completo'),
(49, 'Maquillaje de egreso', 'maquillaje-egreso', 'Maquillaje', 'Maquillaje profesional para fiestas de egreso.', 90, '25000.00', NULL, '2026-08-18 15:21:37', 'Popular', 'Eventos', 'Maquillaje completo'),
(50, 'Maquillaje de quinceañera', 'maquillaje-quinceanera', 'Maquillaje', 'Maquillaje profesional para quinceañeras.', 90, '28000.00', NULL, '2026-08-18 15:21:37', 'Popular', 'Eventos', 'Maquillaje completo'),
(51, 'Maquillaje de novia', 'maquillaje-novia', 'Maquillaje', 'Maquillaje profesional para novias.', 120, '35000.00', NULL, '2026-08-18 15:21:37', 'Especial', 'Novias', 'Maquillaje completo y retoques'),
(52, 'Maquillaje de madrina', 'maquillaje-madrina', 'Maquillaje', 'Maquillaje profesional para madrinas.', 90, '26000.00', NULL, '2026-08-18 15:21:37', NULL, NULL, 'Maquillaje completo'),
(53, 'Glitter Bar', 'glitter-bar', 'Maquillaje', 'Servicio de glitter para eventos.', 30, '9000.00', NULL, '2026-08-18 15:21:37', 'Nuevo', 'Eventos', 'Aplicación de glitter'),
(54, 'Flores de Bach', 'flores-de-bach', 'Terapias alternativas', 'Terapia alternativa basada en Flores de Bach.', 45, '12000.00', NULL, '2026-08-18 15:21:37', NULL, NULL, 'Sesión individual'),
(55, 'Auriculoterapia', 'auriculoterapia', 'Terapias alternativas', 'Terapia alternativa mediante estimulación de puntos de la oreja.', 45, '13000.00', NULL, '2026-08-18 15:21:37', NULL, NULL, 'Sesión individual'),
(56, 'Reflexología podal', 'reflexologia-podal', 'Terapias alternativas', 'Técnica de masaje y estimulación de los pies.', 60, '15000.00', NULL, '2026-08-18 15:21:37', 'Popular', 'Relajación', 'Sesión de reflexología'),
(57, 'Bronceado sin sol', 'bronceado-sin-sol', 'Terapias alternativas', 'Tratamiento estético para lograr un tono bronceado sin exposición solar.', 30, '10000.00', NULL, '2026-08-18 15:21:37', 'Nuevo', 'Belleza', 'Aplicación de producto'),
(58, 'Auto gimnasio cardio', 'auto-gimnasio-cardio', 'Auto gimnasio', 'Actividad de entrenamiento cardiovascular mediante equipamiento de gimnasio.', 60, '12000.00', NULL, '2026-08-18 15:21:37', NULL, NULL, 'Sesión de entrenamiento');

-- --------------------------------------------------------
-- Estructura de la tabla `turnos`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `turnos`;
CREATE TABLE `turnos` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` int(10) unsigned NOT NULL,
  `fecha` date NOT NULL,
  `horario` time NOT NULL,
  `duracion_total` int(11) NOT NULL DEFAULT 0,
  `precio_total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `servicios` text NOT NULL,
  `estado` varchar(40) NOT NULL DEFAULT 'pendiente',
  `pedido_id` int(10) unsigned DEFAULT NULL,
  `metodo_pago` varchar(50) DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_turnos_fecha_horario` (`fecha`,`horario`),
  KEY `idx_turnos_usuario` (`usuario_id`),
  KEY `idx_turnos_pedido` (`pedido_id`),
  KEY `idx_turnos_estado` (`estado`),
  CONSTRAINT `fk_turnos_pedido` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_turnos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos de la tabla `turnos`
-- --------------------------------------------------------
INSERT INTO `turnos` (`id`, `usuario_id`, `fecha`, `horario`, `duracion_total`, `precio_total`, `servicios`, `estado`, `pedido_id`, `metodo_pago`, `creado_en`, `actualizado_en`) VALUES
(6, 4, '2026-09-23', '09:30:00', 90, '46400.00', '[{\"id\":36,\"nombre\":\"Masaje descontracturante\",\"duracion\":60,\"precio\":17600},{\"id\":35,\"nombre\":\"Masaje relajante\",\"duracion\":60,\"precio\":14400},{\"id\":39,\"nombre\":\"Soft gel\",\"duracion\":90,\"precio\":14400}]', 'pendiente', 7, 'debito', '2026-09-21 15:00:20', '2026-09-21 15:00:20'),
(8, 4, '2026-09-24', '09:00:00', 60, '37600.00', '[{\"id\":45,\"nombre\":\"Uñas encarnadas\",\"duracion\":45,\"precio\":11200},{\"id\":44,\"nombre\":\"Belleza de pies\",\"duracion\":60,\"precio\":12000},{\"id\":46,\"nombre\":\"Extracción de verrugas y helomas\",\"duracion\":60,\"precio\":14400}]', 'pendiente', 9, 'transferencia', '2026-09-21 15:37:08', '2026-09-21 15:37:08'),
(9, 4, '2026-10-24', '09:30:00', 90, '48000.00', '[{\"id\":37,\"nombre\":\"Masaje reductor\",\"duracion\":45,\"precio\":16000},{\"id\":36,\"nombre\":\"Masaje descontracturante\",\"duracion\":60,\"precio\":17600},{\"id\":39,\"nombre\":\"Soft gel\",\"duracion\":90,\"precio\":14400}]', 'pendiente', 10, 'debito', '2026-09-21 16:17:58', '2026-09-21 16:17:58'),
(10, 4, '2026-10-02', '09:30:00', 45, '8000.00', '[{\"id\":40,\"nombre\":\"Spa de manos\",\"duracion\":45,\"precio\":8000}]', 'pendiente', 10, 'debito', '2026-09-21 16:17:58', '2026-09-21 16:17:58'),
(11, 4, '2026-09-23', '11:00:00', 60, '53600.00', '[{\"id\":37,\"nombre\":\"Masaje reductor\",\"duracion\":45,\"precio\":16000},{\"id\":36,\"nombre\":\"Masaje descontracturante\",\"duracion\":60,\"precio\":17600},{\"id\":38,\"nombre\":\"Masaje post operatorio\",\"duracion\":60,\"precio\":20000}]', 'pendiente', 11, 'transferencia', '2026-09-21 16:18:38', '2026-09-21 16:18:38'),
(12, 4, '2026-09-24', '11:00:00', 60, '44000.00', '[{\"id\":37,\"nombre\":\"Masaje reductor\",\"duracion\":45,\"precio\":16000},{\"id\":38,\"nombre\":\"Masaje post operatorio\",\"duracion\":60,\"precio\":20000},{\"id\":40,\"nombre\":\"Spa de manos\",\"duracion\":45,\"precio\":8000}]', 'pendiente', 12, 'transferencia', '2026-09-21 17:18:34', '2026-09-21 17:18:34');

-- --------------------------------------------------------
-- Estructura de la tabla `usuarios`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `email` varchar(190) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `telefono` varchar(40) NOT NULL,
  `nacimiento` date DEFAULT NULL,
  `rol` enum('cliente','admin') NOT NULL DEFAULT 'cliente',
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_usuarios_email` (`email`),
  UNIQUE KEY `uq_usuarios_telefono` (`telefono`),
  KEY `idx_usuarios_rol` (`rol`),
  KEY `idx_usuarios_activo` (`activo`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos de la tabla `usuarios`
-- --------------------------------------------------------
INSERT INTO `usuarios` (`id`, `nombre`, `apellido`, `email`, `password_hash`, `telefono`, `nacimiento`, `rol`, `activo`, `created_at`) VALUES
(2, 'Administrador 2', 'Senderos', 'admin@senderos.com', '$2y$10$0759MWG5.kdFLlBefO/iCu0FimEuvMf1dACklzp0J31Opg.69Sl7C', '3510000001', NULL, 'admin', 1, '2026-09-20 20:04:09'),
(4, 'Tomy', 'Eden', 'taeden@escuelasproa.edu.ar', '$2y$10$WaTG/WsKF0OSgkpVAWSmjOZSEFlD1NsHKBQRrw6WRffi4f3tL/rbW', '3571552599', '2009-03-03', 'cliente', 1, '2026-09-21 00:56:00');

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
