-- ============================================================
-- SENDEROS — INSTALACIÓN LIMPIA UNIFICADA
-- ============================================================
-- Archivo único que:
--   1. Crea la base de datos `senderos_db`.
--   2. Crea todas las tablas con su estructura actual.
--   3. Carga productos, servicios y ofertas.
--   4. Deja UN SOLO usuario: el administrador.
--
-- Credenciales del administrador:
--   Email:      admin@senderos.com
--   Contraseña: Senderos-2026!
--
-- IMPORTANTE: este script elimina y vuelve a crear las tablas.
-- No ejecutarlo sobre una base con datos reales que quieras conservar.
--
-- Uso con consola (XAMPP, puerto 3307):
--   mysql -h 127.0.0.1 -P 3307 -uroot < db/senderos_db_unificado.sql
--
-- Uso con phpMyAdmin:
--   Importar > seleccionar este archivo > Continuar.
--
-- Se incluyen 10 clientes de prueba con pedidos, turnos, reseñas y
-- favoritos. password_resets se crea vacía.
-- ============================================================

SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET time_zone = '+00:00';
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS `senderos_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `senderos_db`;

-- Desactivar FKs durante la recreación de tablas
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `pagos`;
DROP TABLE IF EXISTS `password_resets`;
DROP TABLE IF EXISTS `favoritos`;
DROP TABLE IF EXISTS `turnos`;
DROP TABLE IF EXISTS `pedido_items`;
DROP TABLE IF EXISTS `pedidos`;
DROP TABLE IF EXISTS `ofertas`;
DROP TABLE IF EXISTS `resenas`;
DROP TABLE IF EXISTS `servicios`;
DROP TABLE IF EXISTS `productos`;
DROP TABLE IF EXISTS `usuarios`;

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
  `stock_minimo` INT UNSIGNED NOT NULL DEFAULT 0,
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
  `servicio_slug` VARCHAR(190) DEFAULT NULL,
  `producto_id` INT UNSIGNED DEFAULT NULL,
  `producto_nombre` VARCHAR(255) DEFAULT NULL,
  `usuario_id` INT UNSIGNED NOT NULL,
  `nombre_usuario` VARCHAR(220) DEFAULT NULL,
  `estrellas` TINYINT UNSIGNED NOT NULL,
  `texto` VARCHAR(600) NOT NULL,
  `verificada` TINYINT(1) NOT NULL DEFAULT 0,
  `creado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_resena_usuario_servicio` (`usuario_id`,`servicio_slug`),
  KEY `idx_resenas_servicio_slug` (`servicio_slug`),
  KEY `idx_resenas_servicio_id` (`servicio_id`),
  KEY `idx_resenas_producto` (`producto_id`),
  CONSTRAINT `fk_resenas_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_resenas_servicio` FOREIGN KEY (`servicio_id`) REFERENCES `servicios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_resenas_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ofertas` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NOT NULL,
  `descripcion` TEXT DEFAULT NULL,
  `tipo` ENUM('porcentaje','precio_fijo','2x1','texto') NOT NULL,
  `descuento` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `aplica` ENUM('todos','servicios','productos','especifico') NOT NULL DEFAULT 'todos',
  `especifico` TEXT DEFAULT NULL,
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
  `pago_estado` VARCHAR(30) NOT NULL DEFAULT 'pendiente',
  `pago_proveedor` VARCHAR(30) DEFAULT NULL,
  `pago_referencia` VARCHAR(120) DEFAULT NULL,
  `pago_id` VARCHAR(120) DEFAULT NULL,
  `pago_metodo` VARCHAR(60) DEFAULT NULL,
  `pago_actualizado_en` DATETIME DEFAULT NULL,
  `creado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pedidos_usuario` (`usuario_id`),
  KEY `idx_pedidos_estado` (`estado`),
  KEY `idx_pedidos_pago_estado` (`pago_estado`),
  KEY `idx_pedidos_pago_id` (`pago_id`),
  CONSTRAINT `fk_pedidos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `pagos` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `pedido_id` INT UNSIGNED NOT NULL,
  `proveedor` VARCHAR(30) NOT NULL DEFAULT 'mercadopago',
  `preferencia_id` VARCHAR(120) DEFAULT NULL,
  `external_reference` VARCHAR(120) NOT NULL,
  `pago_id` VARCHAR(120) DEFAULT NULL,
  `estado` VARCHAR(30) NOT NULL DEFAULT 'iniciado',
  `estado_detalle` VARCHAR(120) DEFAULT NULL,
  `metodo` VARCHAR(60) DEFAULT NULL,
  `monto` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `moneda` CHAR(3) NOT NULL DEFAULT 'ARS',
  `payload_json` LONGTEXT DEFAULT NULL,
  `creado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pagos_external_reference` (`external_reference`),
  UNIQUE KEY `uq_pagos_pago_id` (`proveedor`,`pago_id`),
  KEY `idx_pagos_pedido` (`pedido_id`),
  KEY `idx_pagos_estado` (`estado`),
  CONSTRAINT `fk_pagos_pedido` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
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

CREATE TABLE `favoritos` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `usuario_id` INT UNSIGNED NOT NULL,
  `tipo` ENUM('producto','servicio') NOT NULL,
  `ref_id` INT UNSIGNED NOT NULL,
  `creado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_favorito` (`usuario_id`,`tipo`,`ref_id`),
  KEY `idx_favoritos_usuario` (`usuario_id`),
  CONSTRAINT `fk_favoritos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `password_resets` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `usuario_id` INT UNSIGNED NOT NULL,
  `token_hash` CHAR(64) NOT NULL,
  `expira_en` DATETIME NOT NULL,
  `usado` TINYINT(1) NOT NULL DEFAULT 0,
  `creado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_password_resets_hash` (`token_hash`),
  KEY `idx_password_resets_usuario` (`usuario_id`),
  KEY `idx_password_resets_expira` (`expira_en`),
  CONSTRAINT `fk_password_resets_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DATOS
-- ============================================================

-- ------------------------------------------------------------
-- Usuario administrador (único usuario)
-- ------------------------------------------------------------
INSERT INTO `usuarios` (`id`, `nombre`, `apellido`, `email`, `password_hash`, `telefono`, `nacimiento`, `rol`, `activo`, `created_at`) VALUES
(1, 'Administrador', 'Senderos', 'admin@senderos.com', '$2y$10$0759MWG5.kdFLlBefO/iCu0FimEuvMf1dACklzp0J31Opg.69Sl7C', '3510000000', NULL, 'admin', 1, '2026-06-19 13:43:10'),
(2, 'Ana', 'Garcia', 'ana.garcia@senderos.com', '$2y$10$0759MWG5.kdFLlBefO/iCu0FimEuvMf1dACklzp0J31Opg.69Sl7C', '3511111111', '1992-04-15', 'cliente', 1, '2026-09-01 10:00:00'),
(3, 'Bruno', 'Lopez', 'bruno.lopez@senderos.com', '$2y$10$0759MWG5.kdFLlBefO/iCu0FimEuvMf1dACklzp0J31Opg.69Sl7C', '3512222222', '1988-07-22', 'cliente', 1, '2026-09-02 11:00:00'),
(4, 'Carla', 'Mendez', 'carla.mendez@senderos.com', '$2y$10$0759MWG5.kdFLlBefO/iCu0FimEuvMf1dACklzp0J31Opg.69Sl7C', '3513333333', '1995-11-03', 'cliente', 1, '2026-09-03 09:30:00'),
(5, 'Diego', 'Fernandez', 'diego.fernandez@senderos.com', '$2y$10$0759MWG5.kdFLlBefO/iCu0FimEuvMf1dACklzp0J31Opg.69Sl7C', '3514444444', '1990-02-18', 'cliente', 1, '2026-09-04 12:00:00'),
(6, 'Elena', 'Ruiz', 'elena.ruiz@senderos.com', '$2y$10$0759MWG5.kdFLlBefO/iCu0FimEuvMf1dACklzp0J31Opg.69Sl7C', '3515555555', '1985-09-27', 'cliente', 1, '2026-09-05 16:00:00'),
(7, 'Federico', 'Torres', 'federico.torres@senderos.com', '$2y$10$0759MWG5.kdFLlBefO/iCu0FimEuvMf1dACklzp0J31Opg.69Sl7C', '3516666666', '1993-01-12', 'cliente', 1, '2026-09-06 14:00:00'),
(8, 'Gabriela', 'Sosa', 'gabriela.sosa@senderos.com', '$2y$10$0759MWG5.kdFLlBefO/iCu0FimEuvMf1dACklzp0J31Opg.69Sl7C', '3517777777', '1997-06-30', 'cliente', 1, '2026-09-07 10:30:00'),
(9, 'Hernan', 'Castro', 'hernan.castro@senderos.com', '$2y$10$0759MWG5.kdFLlBefO/iCu0FimEuvMf1dACklzp0J31Opg.69Sl7C', '3518888888', '1982-12-09', 'cliente', 1, '2026-09-08 17:00:00'),
(10, 'Ines', 'Romero', 'ines.romero@senderos.com', '$2y$10$0759MWG5.kdFLlBefO/iCu0FimEuvMf1dACklzp0J31Opg.69Sl7C', '3519999999', '1994-03-21', 'cliente', 1, '2026-09-09 13:00:00'),
(11, 'Juan', 'Perez', 'juan.perez@senderos.com', '$2y$10$0759MWG5.kdFLlBefO/iCu0FimEuvMf1dACklzp0J31Opg.69Sl7C', '3510000001', '1989-08-14', 'cliente', 1, '2026-09-10 09:00:00');


-- ------------------------------------------------------------
-- Productos
-- ------------------------------------------------------------
INSERT INTO `productos` (`id`, `nombre`, `marca`, `categoria`, `descripcion`, `precio`, `stock_cantidad`, `badge`, `imagen`, `creado_en`) VALUES
(1, 'Platinum crema facial de noche liposomada con multiactivos concentrados', 'Selecta', 'Facial', 'Platinum crema facial de noche liposomada con multiactivos concentrados', '42809.00', 16, NULL, '../img/productos/Platinum-crema-facial-de-noche-liposomada-con-multiactivos-concentrados.jpg', '2026-09-02 16:04:24'),
(2, 'Crema facial células madre + colágeno y elastina 50 mL.', 'Selecta', 'Facial', 'Crema facial células madre + colágeno y elastina 50 mL.', '29717.00', 24, NULL, '../img/productos/Crema-facial-celulas-madre-colageno-y-elastina-50-mL.jpg', '2026-09-02 16:04:24'),
(3, 'Emulgel Antiage Descongestivo para hombre', 'Selecta', 'Facial', 'Emulgel Antiage Descongestivo para hombre', '28759.00', 11, NULL, '../img/productos/Emulgel-Antiage-Descongestivo-para-hombre.jpg', '2026-09-02 16:04:24'),
(4, 'Gel de seda para párpados', 'Selecta', 'Facial', 'Gel de seda para párpados', '16297.00', 19, NULL, '../img/productos/Gel-de-seda-para-parpados.jpg', '2026-09-02 16:04:24'),
(5, 'Crema facial hidratante con colágeno y elastina + vit. A y E. 50 mL.', 'Selecta', 'Facial', 'Crema facial hidratante con colágeno y elastina + vit. A y E. 50 mL.', '24924.00', 26, NULL, '../img/productos/Crema-facial-hidratante-con-colageno-y-elastina-vit-A-y-E-50-mL.jpg', '2026-09-02 16:04:24'),
(6, 'Crema corporal con urea', 'Selecta', 'Corporal', 'Crema corporal con urea', '19811.00', 17, NULL, '../img/productos/Crema-corporal-con-urea.jpg', '2026-09-02 16:04:24'),
(7, 'Gel espuma de limpieza', 'Selecta', 'Corporal', 'Gel espuma de limpieza', '22687.00', 37, NULL, '../img/productos/Gel-espuma-de-limpieza.jpg', '2026-09-02 16:04:24'),
(8, 'Crema para masajes relax', 'Selecta', 'Corporal', 'Crema para masajes relax', '24401.00', 39, NULL, '../img/productos/Crema-para-masajes-relax.jpg', '2026-09-02 16:04:24'),
(9, 'Gel liposomado reductor', 'Selecta', 'Corporal', 'Gel liposomado reductor', '31635.00', 22, NULL, '../img/productos/Gel-liposomado-reductor.jpg', '2026-09-02 16:04:24'),
(10, 'Crema facial filamentos de ADN', 'Selecta', 'Facial', 'Crema facial filamentos de ADN', '24605.00', 19, NULL, '../img/productos/Crema-facial-filamentos-de-ADN.jpg', '2026-09-02 16:04:24'),
(11, 'Crema para pieles delicadas', 'Selecta', 'Facial', 'Crema para pieles delicadas', '23966.00', 23, NULL, '../img/productos/Crema-para-pieles-delicadas.jpg', '2026-09-02 16:04:24'),
(12, 'Serum Niacinamida 10% + AC Salicílico y Glicólico 30 ml', 'Jules', 'Facial', 'Serum Niacinamida 10% + AC Salicílico y Glicólico 30 ml', '42000.00', 12, NULL, '../img/productos/Serum-Niacinamida-10-AC-Salicilico-y-Glicolico-30-ml.jpg', '2026-09-02 16:04:24'),
(13, 'Contorno de ojos | Cafeína, Hialurónico + Colágeno 30 ml', 'Jules', 'Facial', 'Contorno de ojos con cafeína, ácido hialurónico y colágeno. 30 ml.', '42800.00', 10, NULL, '../img/productos/Contorno-de-ojos-Cafeina-Hialuronico-Colageno-30-ml.jpg', '2026-09-02 16:04:24'),
(14, 'Acondicionador de Karité | Todo tipo de cabello', 'Jules', 'Capilar', 'Acondicionador de Karité para todo tipo de cabello.', '16900.00', 20, NULL, '../img/productos/Acondicionador-de-Karite-Todo-tipo-de-cabello.jpg', '2026-09-02 16:04:24'),
(15, 'Champú de Bergamota | Normal', 'Jules', 'Capilar', 'Champú de Bergamota para cabello normal.', '17900.00', 20, NULL, '../img/productos/Champu-de-Bergamota-Normal.jpg', '2026-09-02 16:04:24'),
(16, 'Acondicionador crema con Karité y aceite de oliva 200 ml', 'Jules', 'Capilar', 'Acondicionador crema con Karité y aceite de oliva. 200 ml.', '15900.00', 10, NULL, '../img/productos/Acondicionador-crema-con-Karite-y-aceite-de-oliva-200-ml.jpg', '2026-09-02 16:04:24'),
(17, 'Crema para peinar con fragancia frutal 125 ml', 'Jules', 'Capilar', 'Crema para peinar con fragancia frutal. 125 ml.', '16900.00', 12, NULL, '../img/productos/Crema-para-peinar-con-fragancia-frutal-125-ml.jpg', '2026-09-02 16:04:24'),
(18, 'Serum capilar extraordinario 4 en 1. 30 ml', 'Jules', 'Capilar', 'Serum capilar extraordinario 4 en 1. 30 ml.', '25900.00', 15, NULL, '../img/productos/Serum-capilar-extraordinario-4-en-1-30-ml.jpg', '2026-09-02 16:04:24'),
(19, 'Máscara capilar Argán & Karité 160 ml', 'Jules', 'Capilar', 'Máscara capilar de Argán y Karité. 160 ml.', '21500.00', 11, NULL, '../img/productos/Mascara-capilar-Argan-Karite-160-ml.jpg', '2026-09-02 16:04:24'),
(20, 'Crema corporal Karité 400 ml', 'Jules', 'Corporal', 'Crema corporal con Karité. 400 ml.', '36890.00', 20, NULL, '../img/productos/Crema-corporal-Karite-400-ml.jpg', '2026-09-02 16:04:24'),
(21, 'Crema para manos reparadora con lavanda y vainilla 75 ml', 'Jules', 'Corporal', 'Crema reparadora para manos con lavanda y vainilla. 75 ml.', '17900.00', 15, NULL, '../img/productos/Crema-para-manos-reparadora-con-lavanda-y-vainilla-75-ml.jpg', '2026-09-02 16:04:24'),
(22, 'Bálsamo Labial Nutritivo con Ácido Hialurónico 5 g', 'Jules', 'Corporal', 'Bálsamo labial nutritivo con ácido hialurónico. 5 g.', '17900.00', 10, NULL, '../img/productos/Balsamo-Labial-Nutritivo-con-Acido-Hialuronico-5-g.jpg', '2026-09-02 16:04:24'),
(23, 'Tinta de labios larga duración – Peony – Nina Tint', 'Natacha Nina', 'Facial', 'Tinta de labios de larga duración. Peony – Nina Tint.', '14100.00', 20, NULL, '../img/productos/Tinta-de-labios-larga-duracion-Peony-Nina-Tint.jpg', '2026-09-02 16:04:24'),
(24, 'Labial líquido larga duración | Toy Mala | Liquidación | Liquid Pouty Lips', 'Natacha Nina', 'Facial', 'Labial líquido de larga duración. Toy Mala – Liquid Pouty Lips.', '19000.00', 32, NULL, '../img/productos/Labial-liquido-larga-duracion-Toy-Mala-Liquidacion-Liquid-Pouty-Lips.jpg', '2026-09-02 16:04:24'),
(25, 'Gloss brillo labial – Berry Plump', 'Natacha Nina', 'Facial', 'Gloss de brillo labial Berry Plump.', '22600.00', 23, NULL, '../img/productos/Gloss-brillo-labial-Berry-Plump.jpg', '2026-09-02 16:04:24'),
(26, 'Labial cremoso larga duración – Mimami – Pouty Lips', 'Natacha Nina', 'Facial', 'Labial cremoso de larga duración. Mimami – Pouty Lips.', '9100.00', 23, NULL, '../img/productos/Labial-cremoso-larga-duracion-Mimami-Pouty-Lips.jpg', '2026-09-02 16:04:24'),
(27, 'Contorno oscuro / Paleta Pepper – Polvo Compacto', 'Natacha Nina', 'Facial', 'Paleta Pepper de polvo compacto para contorno oscuro.', '54800.00', 22, NULL, '../img/productos/Contorno-oscuro-Paleta-Pepper-Polvo-Compacto.jpg', '2026-09-02 16:04:24'),
(28, 'Polvo volátil translúcido – Tulum – Matte Blur Skin', 'Natacha Nina', 'Facial', 'Polvo volátil translúcido Tulum – Matte Blur Skin.', '42500.00', 14, NULL, '../img/productos/Polvo-volatil-translucido-Tulum-Matte-Blur-Skin.jpg', '2026-09-02 16:04:24'),
(29, 'Blushy Cheeks – RO60', 'Natacha Nina', 'Facial', 'Blush Blushy Cheeks tono RO60.', '24200.00', 30, NULL, '../img/productos/Blushy-Cheeks-RO60.jpg', '2026-09-02 16:04:24'),
(30, 'Blushy Cheeks – RS10', 'Natacha Nina', 'Facial', 'Blush Blushy Cheeks tono RS10.', '24200.00', 30, NULL, '../img/productos/Blushy-Cheeks-RS10.jpg', '2026-09-02 16:04:24'),
(31, 'Bronzer / Golden Sun', 'Natacha Nina', 'Facial', 'Bronzer Golden Sun.', '16000.00', 30, NULL, '../img/productos/Bronzer-Golden-Sun.jpg', '2026-09-02 16:04:24'),
(32, 'Crema iluminadora corporal con color – Stay Bronze', 'Natacha Nina', 'Facial', 'Crema iluminadora corporal con color Stay Bronze.', '30000.00', 30, NULL, '../img/productos/Crema-iluminadora-corporal-con-color-Stay-Bronze.jpg', '2026-09-02 16:04:24'),
(33, 'Shimmer Fix Spray – Glitters en aerosol – Gold', 'Natacha Nina', 'Facial', 'Shimmer Fix Spray con glitters en aerosol, tono Gold.', '13900.00', 34, NULL, '../img/productos/Shimmer-Fix-Spray-Glitters-en-aerosol-Gold.jpg', '2026-09-02 16:04:24'),
(34, 'Agua termal en spray – Aquatherma', 'Natacha Nina', 'Facial', 'Agua termal en spray Aquatherma.', '18700.00', 22, NULL, '../img/productos/Agua-termal-en-spray-Aquatherma.jpg', '2026-09-02 16:04:24'),
(35, 'Protector solar – Stay Radiant – Tono claro – Emulsión 50 FPS', 'Natacha Nina', 'Facial', 'Protector solar Stay Radiant, tono claro, emulsión 50 FPS.', '39600.00', 33, NULL, '../img/productos/Protector-solar-Stay-Radiant-Tono-claro-Emulsion-50-FPS.jpg', '2026-09-02 16:04:24'),
(36, 'Tinted Serum Color – Latte – Skin on Skin', 'Natacha Nina', 'Facial', 'Tinted Serum Color tono Latte – Skin on Skin.', '39600.00', 11, NULL, '../img/productos/Tinted-Serum-Color-Latte-Skin-on-Skin.jpg', '2026-09-02 16:04:24'),
(37, 'Set de bases | Ponche Crema + Mamá Juana + Cuba Libre de regalo', 'Natacha Nina', 'Facial', 'Set de bases con Ponche Crema, Mamá Juana y Cuba Libre de regalo.', '83700.00', 32, NULL, '../img/productos/Set-de-bases-Ponche-Crema-Mama-Juana-Cuba-Libre-de-regalo.jpg', '2026-09-02 16:04:24'),
(38, 'Set Tinted Latte | 2da unidad de regalo', 'Natacha Nina', 'Facial', 'Set Tinted Latte con segunda unidad de regalo.', '39600.00', 32, NULL, '../img/productos/Set-Tinted-Latte-2da-unidad-de-regalo.jpg', '2026-09-02 16:04:24'),
(39, 'Set de correctores | Vanilla Sundae + Toffee Melt + Cocoa Syrup de regalo', 'Natacha Nina', 'Facial', 'Set de correctores Vanilla Sundae, Toffee Melt y Cocoa Syrup de regalo.', '24000.00', 23, NULL, '../img/productos/Set-de-correctores-Vanilla-Sundae-Toffee-Melt-Cocoa-Syrup-de-regalo.jpg', '2026-09-02 16:04:24'),
(40, 'Gel Liner Perfect Line – Delineador en gel', 'Natacha Nina', 'Facial', 'Delineador en gel Gel Liner Perfect Line.', '27500.00', 30, NULL, '../img/productos/Gel-Liner-Perfect-Line-Delineador-en-gel.jpg', '2026-09-02 16:04:24'),
(41, 'Delineador líquido larga duración – Fine Line', 'Natacha Nina', 'Facial', 'Delineador líquido de larga duración Fine Line.', '22000.00', 30, NULL, '../img/productos/Delineador-liquido-larga-duracion-Fine-Line.jpg', '2026-09-02 16:04:24'),
(42, 'Pomada de cejas – Crepe 00', 'Natacha Nina', 'Facial', 'Pomada para cejas tono Crepe 00.', '22000.00', 20, NULL, '../img/productos/Pomada-de-cejas-Crepe-00.jpg', '2026-09-02 16:04:24'),
(43, 'Kit pinceles inicial', 'Natacha Nina', 'Facial', 'Kit inicial de pinceles para maquillaje.', '97284.00', 20, NULL, '../img/productos/Kit-pinceles-inicial.jpg', '2026-09-02 16:04:24'),
(44, 'Corner Lashes – Pestañas esquineras', 'Natacha Nina', 'Facial', 'Pestañas esquineras Corner Lashes.', '50200.00', 20, NULL, '../img/productos/Corner-Lashes-Pestanas-esquineras.jpg', '2026-09-02 16:04:24'),
(45, 'Pre Base Mate Minimizadora Ultra HD', 'Mila Marzi', 'Maquillaje', 'Pre base mate minimizadora Ultra HD.', '52000.00', 0, NULL, '../img/productos/Pre-Base-Mate-Minimizadora-Ultra-HD.jpg', '2026-09-02 16:04:24'),
(46, 'Fluidificador de Texturas - Apto HD', 'Mila Marzi', 'Maquillaje', 'Fluidificador de texturas apto HD.', '29000.00', 0, NULL, '../img/productos/Fluidificador-de-Texturas-Apto-HD.jpg', '2026-09-02 16:04:24'),
(47, 'Maquillaje Líquido', 'Mila Marzi', 'Maquillaje', 'Maquillaje líquido.', '30000.00', 0, NULL, '../img/productos/Maquillaje-Liquido.jpg', '2026-09-02 16:04:24'),
(48, 'Maquillaje Líquido Efecto Polvo - HD', 'Mila Marzi', 'Maquillaje', 'Maquillaje líquido efecto polvo HD.', '48000.00', 0, NULL, '../img/productos/Maquillaje-Liquido-Efecto-Polvo-HD.jpg', '2026-09-02 16:04:24'),
(49, 'Set de Base Alta Cobertura ULTRA HD', 'Mila Marzi', 'Maquillaje', 'Set de base de alta cobertura ULTRA HD.', '160000.00', 0, NULL, '../img/productos/Set-de-Base-Alta-Cobertura-ULTRA-HD.jpg', '2026-09-02 16:04:24'),
(50, 'Corrector Óptico Ultra HD Perfector', 'Mila Marzi', 'Maquillaje', 'Corrector óptico Ultra HD Perfector.', '36000.00', 0, NULL, '../img/productos/Corrector-Optico-Ultra-HD-Perfector.jpg', '2026-09-02 16:04:24'),
(51, 'Set Rubor Cremoso Duo Universal', 'Mila Marzi', 'Maquillaje', 'Set de rubor cremoso Duo Universal.', '30000.00', 0, NULL, '../img/productos/Set-Rubor-Cremoso-Duo-Universal.jpg', '2026-09-02 16:04:24'),
(52, 'Rubor Compacto', 'Mila Marzi', 'Maquillaje', 'Rubor compacto.', '12600.00', 0, NULL, '../img/productos/Rubor-Compacto.jpg', '2026-09-02 16:04:24'),
(53, 'Polvo Compacto Microfinish ULTRA HD', 'Mila Marzi', 'Maquillaje', 'Polvo compacto Microfinish ULTRA HD.', '45000.00', 0, NULL, '../img/productos/Polvo-Compacto-Microfinish-ULTRA-HD.jpg', '2026-09-02 16:04:24'),
(54, 'Maquillaje compacto al agua mate', 'Mila Marzi', 'Maquillaje', 'Maquillaje compacto al agua con acabado mate.', '38000.00', 0, NULL, '../img/productos/Maquillaje-compacto-al-agua-mate.jpg', '2026-09-02 16:04:24'),
(55, 'Polvo Compacto Satinado Mix | Duo Bronzer-Pink', 'Mila Marzi', 'Maquillaje', 'Polvo compacto satinado Mix Duo Bronzer-Pink.', '42000.00', 0, NULL, '../img/productos/Polvo-Compacto-Satinado-Mix-Duo-Bronzer-Pink.jpg', '2026-09-02 16:04:24'),
(56, 'Fijador Multifunción - Apto HD', 'Mila Marzi', 'Maquillaje', 'Fijador multifunción apto HD.', '32000.00', 0, NULL, '../img/productos/Fijador-Multifuncion-Apto-HD.jpg', '2026-09-02 16:04:24'),
(57, 'Diluyente para Sombras - Apto HD', 'Mila Marzi', 'Maquillaje', 'Diluyente para sombras apto HD.', '20000.00', 0, NULL, '../img/productos/Diluyente-para-Sombras-Apto-HD.jpg', '2026-09-02 16:04:24'),
(58, 'Delineador Líquido - Tinta', 'Mila Marzi', 'Maquillaje', 'Delineador líquido tipo tinta.', '22000.00', 0, NULL, '../img/productos/Delineador-Liquido-Tinta.jpg', '2026-09-02 16:04:24'),
(59, 'Delineador en gel - Apto HD', 'Mila Marzi', 'Maquillaje', 'Delineador en gel apto HD.', '25000.00', 0, NULL, '../img/productos/Delineador-en-gel-Apto-HD.jpg', '2026-09-02 16:04:24'),
(60, 'Base Alta Cobertura Ultra HD | Pasta de Corte', 'Mila Marzi', 'Maquillaje', 'Base de alta cobertura Ultra HD, pasta de corte.', '20000.00', 0, NULL, '../img/productos/Base-Alta-Cobertura-Ultra-HD-Pasta-de-Corte.jpg', '2026-09-02 16:04:24'),
(61, 'Sombra en Polvo Perla Cristal Diamante', 'Mila Marzi', 'Maquillaje', 'Sombra en polvo Perla Cristal Diamante.', '27000.00', 0, NULL, '../img/productos/Sombra-en-Polvo-Perla-Cristal-Diamante.jpg', '2026-09-02 16:04:24'),
(62, 'Sombra en Polvo Diamante - Cristales de Luz', 'Mila Marzi', 'Maquillaje', 'Sombra en polvo Diamante, Cristales de Luz.', '27000.00', 0, NULL, '../img/productos/Sombra-en-Polvo-Diamante-Cristales-de-Luz.jpg', '2026-09-02 16:04:24'),
(63, 'Sombra en Polvo Pigmento Puro', 'Mila Marzi', 'Maquillaje', 'Sombra en polvo Pigmento Puro.', '15000.00', 0, NULL, '../img/productos/Sombra-en-Polvo-Pigmento-Puro.jpg', '2026-09-02 16:04:24'),
(64, 'Sombra en Polvo Perla', 'Mila Marzi', 'Maquillaje', 'Sombra en polvo Perla.', '18500.00', 0, NULL, '../img/productos/Sombra-en-Polvo-Perla.jpg', '2026-09-02 16:04:24'),
(65, 'Paleta Inspiración', 'Mila Marzi', 'Maquillaje', 'Paleta de maquillaje Inspiración.', '150000.00', 0, NULL, '../img/productos/Paleta-Inspiracion.jpg', '2026-09-02 16:04:24'),
(66, 'Bálsamo Modelador de Cejas y Pestañas', 'Mila Marzi', 'Maquillaje', 'Bálsamo modelador para cejas y pestañas.', '29500.00', 0, NULL, '../img/productos/Balsamo-Modelador-de-Cejas-y-Pestanas.jpg', '2026-09-02 16:04:24'),
(67, 'Máscara para Pestañas - Resistente al Agua', 'Mila Marzi', 'Maquillaje', 'Máscara para pestañas resistente al agua.', '22000.00', 0, NULL, '../img/productos/Mascara-para-Pestanas-Resistente-al-Agua.jpg', '2026-09-02 16:04:24'),
(68, 'Pre Base Para Labios Cristal HD', 'Mila Marzi', 'Maquillaje', 'Pre base para labios Cristal HD.', '27500.00', 0, NULL, '../img/productos/Pre-Base-Para-Labios-Cristal-HD.jpg', '2026-09-02 16:04:24'),
(69, 'Labial Vitamina Flash Shimmer', 'Mila Marzi', 'Maquillaje', 'Labial Vitamina Flash Shimmer.', '19000.00', 0, NULL, '../img/productos/Labial-Vitamina-Flash-Shimmer.jpg', '2026-09-02 16:04:24'),
(70, 'Labial Vitamina', 'Mila Marzi', 'Maquillaje', 'Labial Vitamina.', '19000.00', 0, NULL, '../img/productos/Labial-Vitamina.jpg', '2026-09-02 16:04:24'),
(71, 'Mila Lip Oil Balm | Bálsamo Nutritivo para Labios', 'Mila Marzi', 'Maquillaje', 'Mila Lip Oil Balm, bálsamo nutritivo para labios.', '25500.00', 0, NULL, '../img/productos/Mila-Lip-Oil-Balm-Balsamo-Nutritivo-para-Labios.jpg', '2026-09-02 16:04:24');

-- ------------------------------------------------------------
-- Servicios
-- ------------------------------------------------------------
INSERT INTO `servicios` (`id`, `nombre`, `slug`, `categoria`, `descripcion`, `duracion`, `precio`, `imagen`, `creado_en`, `badge`, `badge_texto`, `incluye`) VALUES
(35, 'Masaje relajante', 'masaje-relajante', 'Masaje corporal', 'Masaje destinado a reducir el estrés y favorecer la relajación.', 60, 18000.00, NULL, '2026-08-18 15:21:37', 'Popular', 'Más elegido', 'Masaje corporal completo'),
(36, 'Masaje descontracturante', 'masaje-descontracturante', 'Masaje corporal', 'Masaje orientado a aliviar tensiones y contracturas musculares.', 60, 22000.00, '../img/Servicios/masaje-descontracturante.jpg', '2026-08-18 15:21:37', 'Popular', 'Más elegido', 'Masaje corporal'),
(37, 'Masaje reductor', 'masaje-reductor', 'Masaje corporal', 'Tratamiento corporal enfocado en mejorar el aspecto de determinadas zonas.', 45, 20000.00, '../img/Servicios/masaje-reductor.jpg', '2026-08-18 15:21:37', NULL, NULL, 'Tratamiento reductor'),
(38, 'Masaje post operatorio', 'masaje-post-operatorio', 'Masaje corporal', 'Tratamiento corporal complementario al proceso postoperatorio.', 60, 25000.00, '../img/Servicios/masaje-post-operatorio.jpg', '2026-08-18 15:21:37', NULL, NULL, 'Tratamiento especializado'),
(39, 'Soft gel', 'soft-gel', 'Manicura', 'Servicio de manicura con técnica soft gel.', 90, 18000.00, '../img/Servicios/soft-gel.jpg', '2026-08-18 15:21:37', 'Nuevo', 'Tendencia', 'Preparación, colocación y esmaltado'),
(40, 'Spa de manos', 'spa-de-manos', 'Manicura', 'Tratamiento de cuidado y relajación para las manos.', 45, 10000.00, '../img/Servicios/spa-de-manos.jpg', '2026-08-18 15:21:37', NULL, NULL, 'Exfoliación e hidratación'),
(41, 'Baño de parafina', 'bano-de-parafina', 'Manicura', 'Tratamiento hidratante para manos mediante parafina.', 30, 8000.00, '../img/Servicios/bano-de-parafina.jpg', '2026-08-18 15:21:37', NULL, NULL, 'Hidratación profunda'),
(42, 'Secado rápido', 'secado-rapido', 'Manicura', 'Servicio de secado rápido de uñas.', 15, 5000.00, '../img/Servicios/secado-rapido.jpg', '2026-08-18 15:21:37', NULL, NULL, 'Secado de uñas'),
(43, 'Semipermanente', 'semipermanente', 'Manicura', 'Esmaltado semipermanente de uñas.', 60, 12000.00, '../img/Servicios/semipermanente.jpg', '2026-08-18 15:21:37', 'Popular', 'Más elegido', 'Preparación y esmaltado'),
(44, 'Belleza de pies', 'belleza-de-pies', 'Podología', 'Tratamiento estético y cuidado general de los pies.', 60, 15000.00, '../img/Servicios/belleza-de-pies.jpg', '2026-08-18 15:21:37', NULL, NULL, 'Limpieza y cuidado de pies'),
(45, 'Uñas encarnadas', 'unas-encarnadas', 'Podología', 'Atención y cuidado de uñas encarnadas.', 45, 14000.00, '../img/Servicios/unas-encarnadas.jpg', '2026-08-18 15:21:37', NULL, NULL, 'Tratamiento podológico'),
(46, 'Extracción de verrugas y helomas', 'extraccion-verrugas-helomas', 'Podología', 'Tratamiento podológico para verrugas y helomas.', 60, 18000.00, '../img/Servicios/extraccion-verrugas-helomas.jpg', '2026-08-18 15:21:37', NULL, NULL, 'Tratamiento podológico'),
(47, 'Pie diabético', 'pie-diabetico', 'Podología', 'Cuidado especializado del pie diabético.', 75, 22000.00, '../img/Servicios/pie-diabetico.jpg', '2026-08-18 15:21:37', 'Especial', 'Atención especial', 'Evaluación y cuidado de pies'),
(48, 'Maquillaje social', 'maquillaje-social', 'Maquillaje', 'Maquillaje profesional para ocasiones sociales.', 60, 18000.00, '../img/Servicios/maquillaje-social.jpg', '2026-08-18 15:21:37', NULL, NULL, 'Maquillaje completo'),
(49, 'Maquillaje de egreso', 'maquillaje-egreso', 'Maquillaje', 'Maquillaje profesional para fiestas de egreso.', 90, 25000.00, '../img/Servicios/maquillaje-egreso.jpg', '2026-08-18 15:21:37', 'Popular', 'Eventos', 'Maquillaje completo'),
(50, 'Maquillaje de quinceañera', 'maquillaje-quinceanera', 'Maquillaje', 'Maquillaje profesional para quinceañeras.', 90, 28000.00, '../img/Servicios/maquillaje-quinceanera.jpg', '2026-08-18 15:21:37', 'Popular', 'Eventos', 'Maquillaje completo'),
(51, 'Maquillaje de novia', 'maquillaje-novia', 'Maquillaje', 'Maquillaje profesional para novias.', 120, 35000.00, '../img/Servicios/maquillaje-novia.jpg', '2026-08-18 15:21:37', 'Especial', 'Novias', 'Maquillaje completo y retoques'),
(52, 'Maquillaje de madrina', 'maquillaje-madrina', 'Maquillaje', 'Maquillaje profesional para madrinas.', 90, 26000.00, '../img/Servicios/maquillaje-madrina.jpg', '2026-08-18 15:21:37', NULL, NULL, 'Maquillaje completo'),
(53, 'Glitter Bar', 'glitter-bar', 'Maquillaje', 'Servicio de glitter para eventos.', 30, 9000.00, '../img/Servicios/glitter-bar.jpg', '2026-08-18 15:21:37', 'Nuevo', 'Eventos', 'Aplicación de glitter'),
(54, 'Flores de Bach', 'flores-de-bach', 'Terapias alternativas', 'Terapia alternativa basada en Flores de Bach.', 45, 12000.00, '../img/Servicios/flores-de-bach.jpg', '2026-08-18 15:21:37', NULL, NULL, 'Sesión individual'),
(55, 'Auriculoterapia', 'auriculoterapia', 'Terapias alternativas', 'Terapia alternativa mediante estimulación de puntos de la oreja.', 45, 13000.00, '../img/Servicios/auriculoterapia.jpg', '2026-08-18 15:21:37', NULL, NULL, 'Sesión individual'),
(56, 'Reflexología podal', 'reflexologia-podal', 'Terapias alternativas', 'Técnica de masaje y estimulación de los pies.', 60, 15000.00, '../img/Servicios/reflexologia-podal.jpg', '2026-08-18 15:21:37', 'Popular', 'Relajación', 'Sesión de reflexología'),
(57, 'Bronceado sin sol', 'bronceado-sin-sol', 'Terapias alternativas', 'Tratamiento estético para lograr un tono bronceado sin exposición solar.', 30, 10000.00, '../img/Servicios/bronceado-sin-sol.jpg', '2026-08-18 15:21:37', 'Nuevo', 'Belleza', 'Aplicación de producto'),
(58, 'Auto gimnasio cardio', 'auto-gimnasio-cardio', 'Auto gimnasio', 'Actividad de entrenamiento cardiovascular mediante equipamiento de gimnasio.', 60, 12000.00, '../img/Servicios/auto-gimnasio-cardio.jpg', '2026-08-18 15:21:37', NULL, NULL, 'Sesión de entrenamiento');

-- ------------------------------------------------------------
-- Ofertas
-- ------------------------------------------------------------
INSERT INTO `ofertas` (`id`, `nombre`, `descripcion`, `tipo`, `descuento`, `aplica`, `especifico`, `fecha_inicio`, `fecha_fin`, `dias`, `color`, `estado`, `creado_en`, `actualizado_en`) VALUES
(10, '20% OFF de bienvenida', '20% OFF en todo el catálogo', 'porcentaje', '20.00', 'todos', NULL, '2026-09-21', '2026-09-26', '', '#AD717E', 'activa', '2026-09-21 13:56:21', '2026-09-21 13:56:21');

-- ------------------------------------------------------------
-- Datos de prueba: 10 clientes con pedidos, turnos, reseñas y favoritos
-- Los estados de pedido y de pago se variaron para cubrir todos los casos.
-- ------------------------------------------------------------
INSERT INTO `pedidos` (`id`, `usuario_id`, `total`, `estado`, `metodo_pago`, `entrega`, `direccion_envio`, `pago_grupo`, `pago_estado`, `pago_proveedor`, `pago_referencia`, `pago_metodo`, `pago_actualizado_en`, `creado_en`) VALUES
(1, 2, 65609.00, 'pendiente', 'transferencia', 'envio', 'Av. San Martin 123, Rio Tercero', 'todo', 'pendiente', 'manual', NULL, NULL, '2026-10-10 10:00:00', '2026-10-10 10:00:00'),
(2, 3, 59434.00, 'confirmado', 'tarjeta_online', 'retiro', NULL, 'productos', 'aprobado', 'tarjeta', 'TARJETA-AB12CD34', 'Credito Visa · 3 cuota(s) · ****1111', '2026-10-11 11:00:00', '2026-10-11 11:00:00'),
(3, 4, 20000.00, 'preparado', 'billetera', 'retiro', NULL, 'servicios', 'simulado', 'simulacion', 'SIM-WALLET-EF56GH78', 'PayPal', '2026-10-12 09:30:00', '2026-10-12 09:30:00'),
(4, 5, 54559.00, 'enviado', 'transferencia_qr', 'envio', 'Belgrano 456, Rio Tercero', 'todo', 'en_proceso', 'simulacion_qr', 'QR-ABCD1234EF', 'QR / debito inmediato (demostracion)', '2026-10-13 12:00:00', '2026-10-13 12:00:00'),
(5, 6, 41221.00, 'entregado', 'efectivo', 'retiro', NULL, 'productos', 'aprobado', 'simulacion_efectivo', 'SEND-1234ABCD', 'Cupon Pago Facil / RapiPago (demostracion)', '2026-10-14 16:00:00', '2026-10-14 16:00:00'),
(6, 7, 18000.00, 'cancelado', 'transferencia', 'retiro', NULL, 'servicios', 'cancelado', 'manual', NULL, NULL, '2026-10-15 14:00:00', '2026-10-15 14:00:00'),
(7, 8, 30611.00, 'pendiente', 'tarjeta_online', 'envio', 'San Lorenzo 789, Rio Tercero', 'todo', 'aprobado', 'tarjeta', 'TARJETA-PEND0000', 'Credito Visa · 1 cuota(s) · ****0000', '2026-10-16 10:30:00', '2026-10-16 10:30:00'),
(8, 9, 24401.00, 'confirmado', 'tarjeta_online', 'retiro', NULL, 'productos', 'aprobado', 'tarjeta', 'TARJETA-RECH0002', 'Credito Mastercard · 1 cuota(s) · ****0002', '2026-10-17 17:00:00', '2026-10-17 17:00:00'),
(9, 10, 8000.00, 'preparado', 'billetera', 'retiro', NULL, 'servicios', 'revisar', 'simulacion', 'SIM-WALLET-REVW9999', 'Mercado Pago', '2026-10-18 13:00:00', '2026-10-18 13:00:00'),
(10, 11, 56240.00, 'entregado', 'transferencia', 'retiro', NULL, 'productos', 'aprobado', 'manual', 'TRF-APROB-1010', NULL, '2026-10-19 09:00:00', '2026-10-19 09:00:00'),
(11, 2, 5000.00, 'pendiente', 'billetera', 'retiro', NULL, 'servicios', 'simulado', 'simulacion', 'SIM-WALLET-GOOG1111', 'Google Pay', '2026-10-20 10:00:00', '2026-10-20 10:00:00'),
(12, 3, 23966.00, 'cancelado', 'tarjeta_online', 'retiro', NULL, 'productos', 'cancelado', 'tarjeta', 'TARJETA-CANC3333', 'Debito Visa · 1 cuota(s) · ****3333', '2026-10-21 11:00:00', '2026-10-21 11:00:00');

INSERT INTO `pedido_items` (`pedido_id`, `producto_id`, `servicio_id`, `tipo`, `nombre`, `precio`, `cantidad`) VALUES
(1, 1, NULL, 'producto', 'Platinum crema facial de noche liposomada con multiactivos concentrados', 42809.00, 1),
(1, NULL, 36, 'servicio', 'Masaje descontracturante', 22000.00, 1),
(2, 2, NULL, 'producto', 'Crema facial celulas madre + colageno y elastina 50 mL.', 29717.00, 2),
(3, NULL, 37, 'servicio', 'Masaje reductor', 20000.00, 1),
(4, 3, NULL, 'producto', 'Emulgel Antiage Descongestivo para hombre', 28759.00, 1),
(4, NULL, 38, 'servicio', 'Masaje post operatorio', 25000.00, 1),
(5, 4, NULL, 'producto', 'Gel de seda para parpados', 16297.00, 1),
(5, 5, NULL, 'producto', 'Crema facial hidratante con colageno y elastina + vit. A y E. 50 mL.', 24924.00, 1),
(6, NULL, 39, 'servicio', 'Soft gel', 18000.00, 1),
(7, 6, NULL, 'producto', 'Crema corporal con urea', 19811.00, 1),
(7, NULL, 40, 'servicio', 'Spa de manos', 10000.00, 1),
(8, 8, NULL, 'producto', 'Crema para masajes relax', 24401.00, 1),
(9, NULL, 41, 'servicio', 'Bano de parafina', 8000.00, 1),
(10, 9, NULL, 'producto', 'Gel liposomado reductor', 31635.00, 1),
(10, 10, NULL, 'producto', 'Crema facial filamentos de ADN', 24605.00, 1),
(11, NULL, 42, 'servicio', 'Secado rapido', 5000.00, 1),
(12, 11, NULL, 'producto', 'Crema para pieles delicadas', 23966.00, 1);

INSERT INTO `turnos` (`usuario_id`, `fecha`, `horario`, `duracion_total`, `precio_total`, `servicios`, `estado`, `pedido_id`, `metodo_pago`) VALUES
(2, '2026-11-02', '08:00:00', 60, 22000.00, '[{"id":36,"nombre":"Masaje descontracturante","duracion":60,"precio":22000}]', 'pendiente', 1, 'transferencia'),
(4, '2026-11-03', '09:00:00', 45, 20000.00, '[{"id":37,"nombre":"Masaje reductor","duracion":45,"precio":20000}]', 'pendiente', 3, 'billetera'),
(5, '2026-11-04', '10:00:00', 60, 25000.00, '[{"id":38,"nombre":"Masaje post operatorio","duracion":60,"precio":25000}]', 'pendiente', 4, 'transferencia_qr'),
(7, '2026-11-05', '16:00:00', 90, 18000.00, '[{"id":39,"nombre":"Soft gel","duracion":90,"precio":18000}]', 'cancelado', 6, 'transferencia'),
(8, '2026-11-06', '11:00:00', 45, 10000.00, '[{"id":40,"nombre":"Spa de manos","duracion":45,"precio":10000}]', 'pendiente', 7, 'tarjeta_online'),
(10, '2026-11-07', '17:00:00', 30, 8000.00, '[{"id":41,"nombre":"Bano de parafina","duracion":30,"precio":8000}]', 'pendiente', 9, 'billetera'),
(2, '2026-11-08', '09:30:00', 15, 5000.00, '[{"id":42,"nombre":"Secado rapido","duracion":15,"precio":5000}]', 'pendiente', 11, 'billetera');

INSERT INTO `resenas` (`servicio_id`, `servicio_slug`, `producto_id`, `producto_nombre`, `usuario_id`, `nombre_usuario`, `estrellas`, `texto`, `verificada`, `creado_en`) VALUES
(36, 'masaje-descontracturante', NULL, NULL, 2, 'Ana Garcia', 5, 'Excelente atencion, sali renovada.', 1, '2026-10-22 10:00:00'),
(NULL, NULL, 2, 'Crema facial celulas madre + colageno y elastina 50 mL.', 3, 'Bruno Lopez', 4, 'Buena textura y absorcion rapida.', 1, '2026-10-22 11:00:00'),
(37, 'masaje-reductor', NULL, NULL, 4, 'Carla Mendez', 5, 'Tratamiento muy profesional.', 1, '2026-10-22 12:00:00'),
(NULL, NULL, 3, 'Emulgel Antiage Descongestivo para hombre', 5, 'Diego Fernandez', 4, 'Ligero y sin sensacion grasa.', 1, '2026-10-22 13:00:00'),
(39, 'soft-gel', NULL, NULL, 6, 'Elena Ruiz', 5, 'Duracion perfecta y excelente terminacion.', 1, '2026-10-22 14:00:00'),
(NULL, NULL, 6, 'Crema corporal con urea', 7, 'Federico Torres', 4, 'Hidrata muy bien la piel.', 0, '2026-10-22 15:00:00'),
(40, 'spa-de-manos', NULL, NULL, 8, 'Gabriela Sosa', 5, 'Relajante y muy cuidado.', 1, '2026-10-22 16:00:00'),
(NULL, NULL, 8, 'Crema para masajes relax', 9, 'Hernan Castro', 4, 'Aroma agradable y buena absorcion.', 0, '2026-10-22 17:00:00'),
(48, 'maquillaje-social', NULL, NULL, 10, 'Ines Romero', 5, 'Maquillaje impecable para el evento.', 1, '2026-10-22 18:00:00'),
(NULL, NULL, 9, 'Gel liposomado reductor', 11, 'Juan Perez', 4, 'Resultados visibles con constancia.', 1, '2026-10-22 19:00:00'),
(35, 'masaje-relajante', NULL, NULL, 3, 'Bruno Lopez', 5, 'Muy relajante, recomendable.', 1, '2026-10-23 10:00:00'),
(NULL, NULL, 1, 'Platinum crema facial de noche liposomada con multiactivos concentrados', 2, 'Ana Garcia', 5, 'Noche mas descansada para la piel.', 1, '2026-10-23 11:00:00');

INSERT INTO `favoritos` (`usuario_id`, `tipo`, `ref_id`, `creado_en`) VALUES
(2, 'producto', 1, '2026-10-23 12:00:00'),
(3, 'servicio', 36, '2026-10-23 12:30:00'),
(4, 'producto', 4, '2026-10-23 13:00:00'),
(5, 'servicio', 38, '2026-10-23 13:30:00'),
(6, 'producto', 6, '2026-10-23 14:00:00');

-- Ajustar stock de productos usados en pedidos no cancelados
UPDATE `productos` SET `stock_cantidad` = `stock_cantidad` - 1 WHERE `id` IN (1, 3, 4, 5, 6, 8, 9, 10);
UPDATE `productos` SET `stock_cantidad` = `stock_cantidad` - 2 WHERE `id` = 2;

-- Ajustar contadores AUTO_INCREMENT
ALTER TABLE `usuarios`  AUTO_INCREMENT = 12;
ALTER TABLE `productos` AUTO_INCREMENT = 72;
ALTER TABLE `servicios` AUTO_INCREMENT = 59;
ALTER TABLE `ofertas`   AUTO_INCREMENT = 11;
ALTER TABLE `pedidos`   AUTO_INCREMENT = 13;
ALTER TABLE `turnos`    AUTO_INCREMENT = 8;
ALTER TABLE `resenas`   AUTO_INCREMENT = 13;
ALTER TABLE `favoritos` AUTO_INCREMENT = 6;

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;