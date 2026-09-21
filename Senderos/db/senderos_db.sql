-- Senderos Spa - Base de datos completa
-- MariaDB / MySQL - puerto de la aplicación: 3307

SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET time_zone = '+00:00';
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS `senderos_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `senderos_db`;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `pedido_items`;
DROP TABLE IF EXISTS `pedidos`;
DROP TABLE IF EXISTS `turnos`;
DROP TABLE IF EXISTS `resenas`;
DROP TABLE IF EXISTS `ofertas`;
DROP TABLE IF EXISTS `productos`;
DROP TABLE IF EXISTS `servicios`;
DROP TABLE IF EXISTS `usuarios`;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `usuarios` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `apellido` VARCHAR(100) NOT NULL,
  `email` VARCHAR(190) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `telefono` VARCHAR(40) NOT NULL,
  `nacimiento` DATE DEFAULT NULL,
  `rol` ENUM('cliente','admin') NOT NULL DEFAULT 'cliente',
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_usuarios_email` (`email`),
  UNIQUE KEY `uq_usuarios_telefono` (`telefono`),
  KEY `idx_usuarios_rol` (`rol`),
  KEY `idx_usuarios_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `productos` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NOT NULL,
  `marca` VARCHAR(120) NOT NULL,
  `categoria` VARCHAR(120) NOT NULL,
  `descripcion` TEXT DEFAULT NULL,
  `precio` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `stock_cantidad` INT NOT NULL DEFAULT 0,
  `badge` VARCHAR(100) DEFAULT NULL,
  `imagen` VARCHAR(500) DEFAULT NULL,
  `creado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_productos_marca` (`marca`),
  KEY `idx_productos_categoria` (`categoria`),
  KEY `idx_productos_stock` (`stock_cantidad`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `servicios` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(190) NOT NULL,
  `categoria` VARCHAR(120) NOT NULL,
  `descripcion` TEXT DEFAULT NULL,
  `duracion` INT NOT NULL DEFAULT 0,
  `precio` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `imagen` VARCHAR(500) DEFAULT NULL,
  `creado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `badge` VARCHAR(100) DEFAULT NULL,
  `badge_texto` VARCHAR(150) DEFAULT NULL,
  `incluye` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_servicios_slug` (`slug`),
  KEY `idx_servicios_categoria` (`categoria`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `resenas` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `servicio_id` INT UNSIGNED DEFAULT NULL,
  `servicio_slug` VARCHAR(190) NOT NULL,
  `usuario_id` INT UNSIGNED NOT NULL,
  `nombre_usuario` VARCHAR(220) DEFAULT NULL,
  `estrellas` TINYINT UNSIGNED NOT NULL,
  `texto` VARCHAR(600) NOT NULL,
  `creado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_resena_usuario_servicio` (`usuario_id`,`servicio_slug`),
  KEY `idx_resenas_servicio_slug` (`servicio_slug`),
  KEY `idx_resenas_servicio_id` (`servicio_id`),
  CONSTRAINT `fk_resenas_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_resenas_servicio` FOREIGN KEY (`servicio_id`) REFERENCES `servicios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ofertas` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NOT NULL,
  `descripcion` TEXT DEFAULT NULL,
  `tipo` ENUM('porcentaje','precio_fijo','2x1','texto') NOT NULL,
  `descuento` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `aplica` ENUM('todos','servicios','productos','especifico') NOT NULL DEFAULT 'todos',
  `especifico` VARCHAR(255) DEFAULT NULL,
  `fecha_inicio` DATE DEFAULT NULL,
  `fecha_fin` DATE DEFAULT NULL,
  `dias` VARCHAR(50) DEFAULT NULL,
  `color` VARCHAR(30) DEFAULT NULL,
  `estado` ENUM('activa','pausada') NOT NULL DEFAULT 'activa',
  `creado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ofertas_estado` (`estado`),
  KEY `idx_ofertas_fechas` (`fecha_inicio`,`fecha_fin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `pedidos` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `usuario_id` INT UNSIGNED NOT NULL,
  `total` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `estado` VARCHAR(40) NOT NULL DEFAULT 'pendiente',
  `metodo_pago` VARCHAR(50) NOT NULL DEFAULT 'efectivo',
  `entrega` VARCHAR(40) NOT NULL DEFAULT 'retiro',
  `direccion_envio` VARCHAR(500) DEFAULT NULL,
  `pago_grupo` VARCHAR(40) NOT NULL DEFAULT 'todo',
  `creado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pedidos_usuario` (`usuario_id`),
  KEY `idx_pedidos_estado` (`estado`),
  CONSTRAINT `fk_pedidos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `pedido_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `pedido_id` INT UNSIGNED NOT NULL,
  `producto_id` INT UNSIGNED DEFAULT NULL,
  `servicio_id` INT UNSIGNED DEFAULT NULL,
  `tipo` ENUM('producto','servicio') NOT NULL DEFAULT 'producto',
  `nombre` VARCHAR(255) NOT NULL,
  `precio` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `cantidad` INT UNSIGNED NOT NULL DEFAULT 1,
  `creado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_items_pedido` (`pedido_id`),
  KEY `idx_items_producto` (`producto_id`),
  KEY `idx_items_servicio` (`servicio_id`),
  CONSTRAINT `fk_items_pedido` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_items_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_items_servicio` FOREIGN KEY (`servicio_id`) REFERENCES `servicios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `turnos` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `usuario_id` INT UNSIGNED NOT NULL,
  `fecha` DATE NOT NULL,
  `horario` TIME NOT NULL,
  `duracion_total` INT NOT NULL DEFAULT 0,
  `precio_total` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `servicios` TEXT NOT NULL,
  `estado` VARCHAR(40) NOT NULL DEFAULT 'pendiente',
  `pedido_id` INT UNSIGNED DEFAULT NULL,
  `metodo_pago` VARCHAR(50) DEFAULT NULL,
  `creado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_turnos_fecha_horario` (`fecha`,`horario`),
  KEY `idx_turnos_usuario` (`usuario_id`),
  KEY `idx_turnos_pedido` (`pedido_id`),
  KEY `idx_turnos_estado` (`estado`),
  CONSTRAINT `fk_turnos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_turnos_pedido` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `usuarios` (`id`, `nombre`, `apellido`, `email`, `password_hash`, `telefono`, `nacimiento`, `rol`, `activo`, `created_at`) VALUES
(1, 'Administrador', 'Senderos', 'admin@senderos.com', '$2y$10$0759MWG5.kdFLlBefO/iCu0FimEuvMf1dACklzp0J31Opg.69Sl7C', '3510000000', NULL, 'admin', 1, '2026-06-19 13:43:10');

INSERT INTO `productos` (`id`, `nombre`, `marca`, `categoria`, `descripcion`, `precio`, `stock_cantidad`, `badge`, `imagen`, `creado_en`) VALUES
(1, 'Platinum crema facial de noche liposomada con multiactivos concentrados', 'Selecta', 'Facial', 'Platinum crema facial de noche liposomada con multiactivos concentrados', 42809.00, 20, NULL, NULL, '2026-09-02 16:04:24'),
(2, 'Crema facial células madre + colágeno y elastina 50 mL.', 'Selecta', 'Facial', 'Crema facial células madre + colágeno y elastina 50 mL.', 29717.00, 29, NULL, NULL, '2026-09-02 16:04:24'),
(3, 'Emulgel Antiage Descongestivo para hombre', 'Selecta', 'Facial', 'Emulgel Antiage Descongestivo para hombre', 28759.00, 15, NULL, NULL, '2026-09-02 16:04:24'),
(4, 'Gel de seda para párpados', 'Selecta', 'Facial', 'Gel de seda para párpados', 16297.00, 21, NULL, NULL, '2026-09-02 16:04:24'),
(5, 'Crema facial hidratante con colágeno y elastina + vit. A y E. 50 mL.', 'Selecta', 'Facial', 'Crema facial hidratante con colágeno y elastina + vit. A y E. 50 mL.', 24924.00, 26, NULL, NULL, '2026-09-02 16:04:24'),
(6, 'Crema corporal con urea', 'Selecta', 'Corporal', 'Crema corporal con urea', 19811.00, 18, NULL, NULL, '2026-09-02 16:04:24'),
(7, 'Gel espuma de limpieza', 'Selecta', 'Corporal', 'Gel espuma de limpieza', 22687.00, 38, NULL, NULL, '2026-09-02 16:04:24'),
(8, 'Crema para masajes relax', 'Selecta', 'Corporal', 'Crema para masajes relax', 24401.00, 40, NULL, NULL, '2026-09-02 16:04:24'),
(9, 'Gel liposomado reductor', 'Selecta', 'Corporal', 'Gel liposomado reductor', 31635.00, 22, NULL, NULL, '2026-09-02 16:04:24'),
(10, 'Crema facial filamentos de ADN', 'Selecta', 'Facial', 'Crema facial filamentos de ADN', 24605.00, 19, NULL, NULL, '2026-09-02 16:04:24'),
(11, 'Crema para pieles delicadas', 'Selecta', 'Facial', 'Crema para pieles delicadas', 23966.00, 23, NULL, NULL, '2026-09-02 16:04:24'),
(12, 'Serum Niacinamida 10% + AC Salicílico y Glicólico 30 ml', 'Jules', 'Facial', 'Serum Niacinamida 10% + AC Salicílico y Glicólico 30 ml', 42000.00, 12, NULL, NULL, '2026-09-02 16:04:24'),
(13, 'Contorno de ojos | Cafeína, Hialurónico + Colágeno 30 ml', 'Jules', 'Facial', 'Contorno de ojos con cafeína, ácido hialurónico y colágeno. 30 ml.', 42800.00, 10, NULL, NULL, '2026-09-02 16:04:24'),
(14, 'Acondicionador de Karité | Todo tipo de cabello', 'Jules', 'Capilar', 'Acondicionador de Karité para todo tipo de cabello.', 16900.00, 20, NULL, NULL, '2026-09-02 16:04:24'),
(15, 'Champú de Bergamota | Normal', 'Jules', 'Capilar', 'Champú de Bergamota para cabello normal.', 17900.00, 20, NULL, NULL, '2026-09-02 16:04:24'),
(16, 'Acondicionador crema con Karité y aceite de oliva 200 ml', 'Jules', 'Capilar', 'Acondicionador crema con Karité y aceite de oliva. 200 ml.', 15900.00, 10, NULL, NULL, '2026-09-02 16:04:24'),
(17, 'Crema para peinar con fragancia frutal 125 ml', 'Jules', 'Capilar', 'Crema para peinar con fragancia frutal. 125 ml.', 16900.00, 12, NULL, NULL, '2026-09-02 16:04:24'),
(18, 'Serum capilar extraordinario 4 en 1. 30 ml', 'Jules', 'Capilar', 'Serum capilar extraordinario 4 en 1. 30 ml.', 25900.00, 15, NULL, NULL, '2026-09-02 16:04:24'),
(19, 'Máscara capilar Argán & Karité 160 ml', 'Jules', 'Capilar', 'Máscara capilar de Argán y Karité. 160 ml.', 21500.00, 11, NULL, NULL, '2026-09-02 16:04:24'),
(20, 'Crema corporal Karité 400 ml', 'Jules', 'Corporal', 'Crema corporal con Karité. 400 ml.', 36890.00, 20, NULL, NULL, '2026-09-02 16:04:24'),
(21, 'Crema para manos reparadora con lavanda y vainilla 75 ml', 'Jules', 'Corporal', 'Crema reparadora para manos con lavanda y vainilla. 75 ml.', 17900.00, 15, NULL, NULL, '2026-09-02 16:04:24'),
(22, 'Bálsamo Labial Nutritivo con Ácido Hialurónico 5 g', 'Jules', 'Corporal', 'Bálsamo labial nutritivo con ácido hialurónico. 5 g.', 17900.00, 10, NULL, NULL, '2026-09-02 16:04:24'),
(23, 'Tinta de labios larga duración – Peony – Nina Tint', 'Natacha Nina', 'Facial', 'Tinta de labios de larga duración. Peony – Nina Tint.', 14100.00, 20, NULL, NULL, '2026-09-02 16:04:24'),
(24, 'Labial líquido larga duración | Toy Mala | Liquidación | Liquid Pouty Lips', 'Natacha Nina', 'Facial', 'Labial líquido de larga duración. Toy Mala – Liquid Pouty Lips.', 19000.00, 32, NULL, NULL, '2026-09-02 16:04:24'),
(25, 'Gloss brillo labial – Berry Plump', 'Natacha Nina', 'Facial', 'Gloss de brillo labial Berry Plump.', 22600.00, 23, NULL, NULL, '2026-09-02 16:04:24'),
(26, 'Labial cremoso larga duración – Mimami – Pouty Lips', 'Natacha Nina', 'Facial', 'Labial cremoso de larga duración. Mimami – Pouty Lips.', 9100.00, 23, NULL, NULL, '2026-09-02 16:04:24'),
(27, 'Contorno oscuro / Paleta Pepper – Polvo Compacto', 'Natacha Nina', 'Facial', 'Paleta Pepper de polvo compacto para contorno oscuro.', 54800.00, 22, NULL, NULL, '2026-09-02 16:04:24'),
(28, 'Polvo volátil translúcido – Tulum – Matte Blur Skin', 'Natacha Nina', 'Facial', 'Polvo volátil translúcido Tulum – Matte Blur Skin.', 42500.00, 14, NULL, NULL, '2026-09-02 16:04:24'),
(29, 'Blushy Cheeks – RO60', 'Natacha Nina', 'Facial', 'Blush Blushy Cheeks tono RO60.', 24200.00, 30, NULL, NULL, '2026-09-02 16:04:24'),
(30, 'Blushy Cheeks – RS10', 'Natacha Nina', 'Facial', 'Blush Blushy Cheeks tono RS10.', 24200.00, 30, NULL, NULL, '2026-09-02 16:04:24'),
(31, 'Bronzer / Golden Sun', 'Natacha Nina', 'Facial', 'Bronzer Golden Sun.', 16000.00, 30, NULL, NULL, '2026-09-02 16:04:24'),
(32, 'Crema iluminadora corporal con color – Stay Bronze', 'Natacha Nina', 'Facial', 'Crema iluminadora corporal con color Stay Bronze.', 30000.00, 30, NULL, NULL, '2026-09-02 16:04:24'),
(33, 'Shimmer Fix Spray – Glitters en aerosol – Gold', 'Natacha Nina', 'Facial', 'Shimmer Fix Spray con glitters en aerosol, tono Gold.', 13900.00, 34, NULL, NULL, '2026-09-02 16:04:24'),
(34, 'Agua termal en spray – Aquatherma', 'Natacha Nina', 'Facial', 'Agua termal en spray Aquatherma.', 18700.00, 22, NULL, NULL, '2026-09-02 16:04:24'),
(35, 'Protector solar – Stay Radiant – Tono claro – Emulsión 50 FPS', 'Natacha Nina', 'Facial', 'Protector solar Stay Radiant, tono claro, emulsión 50 FPS.', 39600.00, 33, NULL, NULL, '2026-09-02 16:04:24'),
(36, 'Tinted Serum Color – Latte – Skin on Skin', 'Natacha Nina', 'Facial', 'Tinted Serum Color tono Latte – Skin on Skin.', 39600.00, 11, NULL, NULL, '2026-09-02 16:04:24'),
(37, 'Set de bases | Ponche Crema + Mamá Juana + Cuba Libre de regalo', 'Natacha Nina', 'Facial', 'Set de bases con Ponche Crema, Mamá Juana y Cuba Libre de regalo.', 83700.00, 32, NULL, NULL, '2026-09-02 16:04:24'),
(38, 'Set Tinted Latte | 2da unidad de regalo', 'Natacha Nina', 'Facial', 'Set Tinted Latte con segunda unidad de regalo.', 39600.00, 32, NULL, NULL, '2026-09-02 16:04:24'),
(39, 'Set de correctores | Vanilla Sundae + Toffee Melt + Cocoa Syrup de regalo', 'Natacha Nina', 'Facial', 'Set de correctores Vanilla Sundae, Toffee Melt y Cocoa Syrup de regalo.', 24000.00, 23, NULL, NULL, '2026-09-02 16:04:24'),
(40, 'Gel Liner Perfect Line – Delineador en gel', 'Natacha Nina', 'Facial', 'Delineador en gel Gel Liner Perfect Line.', 27500.00, 30, NULL, NULL, '2026-09-02 16:04:24'),
(41, 'Delineador líquido larga duración – Fine Line', 'Natacha Nina', 'Facial', 'Delineador líquido de larga duración Fine Line.', 22000.00, 30, NULL, NULL, '2026-09-02 16:04:24'),
(42, 'Pomada de cejas – Crepe 00', 'Natacha Nina', 'Facial', 'Pomada para cejas tono Crepe 00.', 22000.00, 20, NULL, NULL, '2026-09-02 16:04:24'),
(43, 'Kit pinceles inicial', 'Natacha Nina', 'Facial', 'Kit inicial de pinceles para maquillaje.', 97284.00, 20, NULL, NULL, '2026-09-02 16:04:24'),
(44, 'Corner Lashes – Pestañas esquineras', 'Natacha Nina', 'Facial', 'Pestañas esquineras Corner Lashes.', 50200.00, 20, NULL, NULL, '2026-09-02 16:04:24'),
(45, 'Pre Base Mate Minimizadora Ultra HD', 'Mila Marzi', 'Maquillaje', 'Pre base mate minimizadora Ultra HD.', 52000.00, 0, NULL, NULL, '2026-09-02 16:04:24'),
(46, 'Fluidificador de Texturas - Apto HD', 'Mila Marzi', 'Maquillaje', 'Fluidificador de texturas apto HD.', 29000.00, 0, NULL, NULL, '2026-09-02 16:04:24'),
(47, 'Maquillaje Líquido', 'Mila Marzi', 'Maquillaje', 'Maquillaje líquido.', 30000.00, 0, NULL, NULL, '2026-09-02 16:04:24'),
(48, 'Maquillaje Líquido Efecto Polvo - HD', 'Mila Marzi', 'Maquillaje', 'Maquillaje líquido efecto polvo HD.', 48000.00, 0, NULL, NULL, '2026-09-02 16:04:24'),
(49, 'Set de Base Alta Cobertura ULTRA HD', 'Mila Marzi', 'Maquillaje', 'Set de base de alta cobertura ULTRA HD.', 160000.00, 0, NULL, NULL, '2026-09-02 16:04:24'),
(50, 'Corrector Óptico Ultra HD Perfector', 'Mila Marzi', 'Maquillaje', 'Corrector óptico Ultra HD Perfector.', 36000.00, 0, NULL, NULL, '2026-09-02 16:04:24'),
(51, 'Set Rubor Cremoso Duo Universal', 'Mila Marzi', 'Maquillaje', 'Set de rubor cremoso Duo Universal.', 30000.00, 0, NULL, NULL, '2026-09-02 16:04:24'),
(52, 'Rubor Compacto', 'Mila Marzi', 'Maquillaje', 'Rubor compacto.', 12600.00, 0, NULL, NULL, '2026-09-02 16:04:24'),
(53, 'Polvo Compacto Microfinish ULTRA HD', 'Mila Marzi', 'Maquillaje', 'Polvo compacto Microfinish ULTRA HD.', 45000.00, 0, NULL, NULL, '2026-09-02 16:04:24'),
(54, 'Maquillaje compacto al agua mate', 'Mila Marzi', 'Maquillaje', 'Maquillaje compacto al agua con acabado mate.', 38000.00, 0, NULL, NULL, '2026-09-02 16:04:24'),
(55, 'Polvo Compacto Satinado Mix | Duo Bronzer-Pink', 'Mila Marzi', 'Maquillaje', 'Polvo compacto satinado Mix Duo Bronzer-Pink.', 42000.00, 0, NULL, NULL, '2026-09-02 16:04:24'),
(56, 'Fijador Multifunción - Apto HD', 'Mila Marzi', 'Maquillaje', 'Fijador multifunción apto HD.', 32000.00, 0, NULL, NULL, '2026-09-02 16:04:24'),
(57, 'Diluyente para Sombras - Apto HD', 'Mila Marzi', 'Maquillaje', 'Diluyente para sombras apto HD.', 20000.00, 0, NULL, NULL, '2026-09-02 16:04:24'),
(58, 'Delineador Líquido - Tinta', 'Mila Marzi', 'Maquillaje', 'Delineador líquido tipo tinta.', 22000.00, 0, NULL, NULL, '2026-09-02 16:04:24'),
(59, 'Delineador en gel - Apto HD', 'Mila Marzi', 'Maquillaje', 'Delineador en gel apto HD.', 25000.00, 0, NULL, NULL, '2026-09-02 16:04:24'),
(60, 'Base Alta Cobertura Ultra HD | Pasta de Corte', 'Mila Marzi', 'Maquillaje', 'Base de alta cobertura Ultra HD, pasta de corte.', 20000.00, 0, NULL, NULL, '2026-09-02 16:04:24'),
(61, 'Sombra en Polvo Perla Cristal Diamante', 'Mila Marzi', 'Maquillaje', 'Sombra en polvo Perla Cristal Diamante.', 27000.00, 0, NULL, NULL, '2026-09-02 16:04:24'),
(62, 'Sombra en Polvo Diamante - Cristales de Luz', 'Mila Marzi', 'Maquillaje', 'Sombra en polvo Diamante, Cristales de Luz.', 27000.00, 0, NULL, NULL, '2026-09-02 16:04:24'),
(63, 'Sombra en Polvo Pigmento Puro', 'Mila Marzi', 'Maquillaje', 'Sombra en polvo Pigmento Puro.', 15000.00, 0, NULL, NULL, '2026-09-02 16:04:24'),
(64, 'Sombra en Polvo Perla', 'Mila Marzi', 'Maquillaje', 'Sombra en polvo Perla.', 18500.00, 0, NULL, NULL, '2026-09-02 16:04:24'),
(65, 'Paleta Inspiración', 'Mila Marzi', 'Maquillaje', 'Paleta de maquillaje Inspiración.', 150000.00, 0, NULL, NULL, '2026-09-02 16:04:24'),
(66, 'Bálsamo Modelador de Cejas y Pestañas', 'Mila Marzi', 'Maquillaje', 'Bálsamo modelador para cejas y pestañas.', 29500.00, 0, NULL, NULL, '2026-09-02 16:04:24'),
(67, 'Máscara para Pestañas - Resistente al Agua', 'Mila Marzi', 'Maquillaje', 'Máscara para pestañas resistente al agua.', 22000.00, 0, NULL, NULL, '2026-09-02 16:04:24'),
(68, 'Pre Base Para Labios Cristal HD', 'Mila Marzi', 'Maquillaje', 'Pre base para labios Cristal HD.', 27500.00, 0, NULL, NULL, '2026-09-02 16:04:24'),
(69, 'Labial Vitamina Flash Shimmer', 'Mila Marzi', 'Maquillaje', 'Labial Vitamina Flash Shimmer.', 19000.00, 0, NULL, NULL, '2026-09-02 16:04:24'),
(70, 'Labial Vitamina', 'Mila Marzi', 'Maquillaje', 'Labial Vitamina.', 19000.00, 0, NULL, NULL, '2026-09-02 16:04:24'),
(71, 'Mila Lip Oil Balm | Bálsamo Nutritivo para Labios', 'Mila Marzi', 'Maquillaje', 'Mila Lip Oil Balm, bálsamo nutritivo para labios.', 25500.00, 0, NULL, NULL, '2026-09-02 16:04:24');

INSERT INTO `servicios` (`id`, `nombre`, `slug`, `categoria`, `descripcion`, `duracion`, `precio`, `imagen`, `creado_en`, `badge`, `badge_texto`, `incluye`) VALUES
(35, 'Masaje relajante', 'masaje-relajante', 'Masaje corporal', 'Masaje destinado a reducir el estrés y favorecer la relajación.', 60, 18000.00, NULL, '2026-08-18 15:21:37', 'Popular', 'Más elegido', 'Masaje corporal completo'),
(36, 'Masaje descontracturante', 'masaje-descontracturante', 'Masaje corporal', 'Masaje orientado a aliviar tensiones y contracturas musculares.', 60, 22000.00, NULL, '2026-08-18 15:21:37', 'Popular', 'Más elegido', 'Masaje corporal'),
(37, 'Masaje reductor', 'masaje-reductor', 'Masaje corporal', 'Tratamiento corporal enfocado en mejorar el aspecto de determinadas zonas.', 45, 20000.00, NULL, '2026-08-18 15:21:37', NULL, NULL, 'Tratamiento reductor'),
(38, 'Masaje post operatorio', 'masaje-post-operatorio', 'Masaje corporal', 'Tratamiento corporal complementario al proceso postoperatorio.', 60, 25000.00, NULL, '2026-08-18 15:21:37', NULL, NULL, 'Tratamiento especializado'),
(39, 'Soft gel', 'soft-gel', 'Manicura', 'Servicio de manicura con técnica soft gel.', 90, 18000.00, NULL, '2026-08-18 15:21:37', 'Nuevo', 'Tendencia', 'Preparación, colocación y esmaltado'),
(40, 'Spa de manos', 'spa-de-manos', 'Manicura', 'Tratamiento de cuidado y relajación para las manos.', 45, 10000.00, NULL, '2026-08-18 15:21:37', NULL, NULL, 'Exfoliación e hidratación'),
(41, 'Baño de parafina', 'bano-de-parafina', 'Manicura', 'Tratamiento hidratante para manos mediante parafina.', 30, 8000.00, NULL, '2026-08-18 15:21:37', NULL, NULL, 'Hidratación profunda'),
(42, 'Secado rápido', 'secado-rapido', 'Manicura', 'Servicio de secado rápido de uñas.', 15, 5000.00, NULL, '2026-08-18 15:21:37', NULL, NULL, 'Secado de uñas'),
(43, 'Semipermanente', 'semipermanente', 'Manicura', 'Esmaltado semipermanente de uñas.', 60, 12000.00, NULL, '2026-08-18 15:21:37', 'Popular', 'Más elegido', 'Preparación y esmaltado'),
(44, 'Belleza de pies', 'belleza-de-pies', 'Podología', 'Tratamiento estético y cuidado general de los pies.', 60, 15000.00, NULL, '2026-08-18 15:21:37', NULL, NULL, 'Limpieza y cuidado de pies'),
(45, 'Uñas encarnadas', 'unas-encarnadas', 'Podología', 'Atención y cuidado de uñas encarnadas.', 45, 14000.00, NULL, '2026-08-18 15:21:37', NULL, NULL, 'Tratamiento podológico'),
(46, 'Extracción de verrugas y helomas', 'extraccion-verrugas-helomas', 'Podología', 'Tratamiento podológico para verrugas y helomas.', 60, 18000.00, NULL, '2026-08-18 15:21:37', NULL, NULL, 'Tratamiento podológico'),
(47, 'Pie diabético', 'pie-diabetico', 'Podología', 'Cuidado especializado del pie diabético.', 75, 22000.00, NULL, '2026-08-18 15:21:37', 'Especial', 'Atención especial', 'Evaluación y cuidado de pies'),
(48, 'Maquillaje social', 'maquillaje-social', 'Maquillaje', 'Maquillaje profesional para ocasiones sociales.', 60, 18000.00, NULL, '2026-08-18 15:21:37', NULL, NULL, 'Maquillaje completo'),
(49, 'Maquillaje de egreso', 'maquillaje-egreso', 'Maquillaje', 'Maquillaje profesional para fiestas de egreso.', 90, 25000.00, NULL, '2026-08-18 15:21:37', 'Popular', 'Eventos', 'Maquillaje completo'),
(50, 'Maquillaje de quinceañera', 'maquillaje-quinceanera', 'Maquillaje', 'Maquillaje profesional para quinceañeras.', 90, 28000.00, NULL, '2026-08-18 15:21:37', 'Popular', 'Eventos', 'Maquillaje completo'),
(51, 'Maquillaje de novia', 'maquillaje-novia', 'Maquillaje', 'Maquillaje profesional para novias.', 120, 35000.00, NULL, '2026-08-18 15:21:37', 'Especial', 'Novias', 'Maquillaje completo y retoques'),
(52, 'Maquillaje de madrina', 'maquillaje-madrina', 'Maquillaje', 'Maquillaje profesional para madrinas.', 90, 26000.00, NULL, '2026-08-18 15:21:37', NULL, NULL, 'Maquillaje completo'),
(53, 'Glitter Bar', 'glitter-bar', 'Maquillaje', 'Servicio de glitter para eventos.', 30, 9000.00, NULL, '2026-08-18 15:21:37', 'Nuevo', 'Eventos', 'Aplicación de glitter'),
(54, 'Flores de Bach', 'flores-de-bach', 'Terapias alternativas', 'Terapia alternativa basada en Flores de Bach.', 45, 12000.00, NULL, '2026-08-18 15:21:37', NULL, NULL, 'Sesión individual'),
(55, 'Auriculoterapia', 'auriculoterapia', 'Terapias alternativas', 'Terapia alternativa mediante estimulación de puntos de la oreja.', 45, 13000.00, NULL, '2026-08-18 15:21:37', NULL, NULL, 'Sesión individual'),
(56, 'Reflexología podal', 'reflexologia-podal', 'Terapias alternativas', 'Técnica de masaje y estimulación de los pies.', 60, 15000.00, NULL, '2026-08-18 15:21:37', 'Popular', 'Relajación', 'Sesión de reflexología'),
(57, 'Bronceado sin sol', 'bronceado-sin-sol', 'Terapias alternativas', 'Tratamiento estético para lograr un tono bronceado sin exposición solar.', 30, 10000.00, NULL, '2026-08-18 15:21:37', 'Nuevo', 'Belleza', 'Aplicación de producto'),
(58, 'Auto gimnasio cardio', 'auto-gimnasio-cardio', 'Auto gimnasio', 'Actividad de entrenamiento cardiovascular mediante equipamiento de gimnasio.', 60, 12000.00, NULL, '2026-08-18 15:21:37', NULL, NULL, 'Sesión de entrenamiento');


SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
