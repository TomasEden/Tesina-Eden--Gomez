-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1:3307
-- Tiempo de generación: 15-09-2026 a las 17:13:45
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `senderos_db`
--

--
-- Volcado de datos para la tabla `productos`
--

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
(23, 'Tinta de labios larga duración – Peony – Nina Tint', 'Nathacha Nina', 'Facial', 'Tinta de labios de larga duración. Peony – Nina Tint.', 14100.00, 20, NULL, NULL, '2026-09-02 16:04:24'),
(24, 'Labial líquido larga duración | Toy Mala | Liquidación | Liquid Pouty Lips', 'Nathacha Nina', 'Facial', 'Labial líquido de larga duración. Toy Mala – Liquid Pouty Lips.', 19000.00, 32, NULL, NULL, '2026-09-02 16:04:24'),
(25, 'Gloss brillo labial – Berry Plump', 'Nathacha Nina', 'Facial', 'Gloss de brillo labial Berry Plump.', 22600.00, 23, NULL, NULL, '2026-09-02 16:04:24'),
(26, 'Labial cremoso larga duración – Mimami – Pouty Lips', 'Nathacha Nina', 'Facial', 'Labial cremoso de larga duración. Mimami – Pouty Lips.', 9100.00, 23, NULL, NULL, '2026-09-02 16:04:24'),
(27, 'Contorno oscuro / Paleta Pepper – Polvo Compacto', 'Nathacha Nina', 'Facial', 'Paleta Pepper de polvo compacto para contorno oscuro.', 54800.00, 22, NULL, NULL, '2026-09-02 16:04:24'),
(28, 'Polvo volátil translúcido – Tulum – Matte Blur Skin', 'Nathacha Nina', 'Facial', 'Polvo volátil translúcido Tulum – Matte Blur Skin.', 42500.00, 14, NULL, NULL, '2026-09-02 16:04:24'),
(29, 'Blushy Cheeks – RO60', 'Nathacha Nina', 'Facial', 'Blush Blushy Cheeks tono RO60.', 24200.00, 30, NULL, NULL, '2026-09-02 16:04:24'),
(30, 'Blushy Cheeks – RS10', 'Nathacha Nina', 'Facial', 'Blush Blushy Cheeks tono RS10.', 24200.00, 30, NULL, NULL, '2026-09-02 16:04:24'),
(31, 'Bronzer / Golden Sun', 'Nathacha Nina', 'Facial', 'Bronzer Golden Sun.', 16000.00, 30, NULL, NULL, '2026-09-02 16:04:24'),
(32, 'Crema iluminadora corporal con color – Stay Bronze', 'Nathacha Nina', 'Facial', 'Crema iluminadora corporal con color Stay Bronze.', 30000.00, 30, NULL, NULL, '2026-09-02 16:04:24'),
(33, 'Shimmer Fix Spray – Glitters en aerosol – Gold', 'Nathacha Nina', 'Facial', 'Shimmer Fix Spray con glitters en aerosol, tono Gold.', 13900.00, 34, NULL, NULL, '2026-09-02 16:04:24'),
(34, 'Agua termal en spray – Aquatherma', 'Nathacha Nina', 'Facial', 'Agua termal en spray Aquatherma.', 18700.00, 22, NULL, NULL, '2026-09-02 16:04:24'),
(35, 'Protector solar – Stay Radiant – Tono claro – Emulsión 50 FPS', 'Nathacha Nina', 'Facial', 'Protector solar Stay Radiant, tono claro, emulsión 50 FPS.', 39600.00, 33, NULL, NULL, '2026-09-02 16:04:24'),
(36, 'Tinted Serum Color – Latte – Skin on Skin', 'Nathacha Nina', 'Facial', 'Tinted Serum Color tono Latte – Skin on Skin.', 39600.00, 11, NULL, NULL, '2026-09-02 16:04:24'),
(37, 'Set de bases | Ponche Crema + Mamá Juana + Cuba Libre de regalo', 'Nathacha Nina', 'Facial', 'Set de bases con Ponche Crema, Mamá Juana y Cuba Libre de regalo.', 83700.00, 32, NULL, NULL, '2026-09-02 16:04:24'),
(38, 'Set Tinted Latte | 2da unidad de regalo', 'Nathacha Nina', 'Facial', 'Set Tinted Latte con segunda unidad de regalo.', 39600.00, 32, NULL, NULL, '2026-09-02 16:04:24'),
(39, 'Set de correctores | Vanilla Sundae + Toffee Melt + Cocoa Syrup de regalo', 'Nathacha Nina', 'Facial', 'Set de correctores Vanilla Sundae, Toffee Melt y Cocoa Syrup de regalo.', 24000.00, 23, NULL, NULL, '2026-09-02 16:04:24'),
(40, 'Gel Liner Perfect Line – Delineador en gel', 'Nathacha Nina', 'Facial', 'Delineador en gel Gel Liner Perfect Line.', 27500.00, 30, NULL, NULL, '2026-09-02 16:04:24'),
(41, 'Delineador líquido larga duración – Fine Line', 'Nathacha Nina', 'Facial', 'Delineador líquido de larga duración Fine Line.', 22000.00, 30, NULL, NULL, '2026-09-02 16:04:24'),
(42, 'Pomada de cejas – Crepe 00', 'Nathacha Nina', 'Facial', 'Pomada para cejas tono Crepe 00.', 22000.00, 20, NULL, NULL, '2026-09-02 16:04:24'),
(43, 'Kit pinceles inicial', 'Nathacha Nina', 'Facial', 'Kit inicial de pinceles para maquillaje.', 97284.00, 20, NULL, NULL, '2026-09-02 16:04:24'),
(44, 'Corner Lashes – Pestañas esquineras', 'Nathacha Nina', 'Facial', 'Pestañas esquineras Corner Lashes.', 50200.00, 20, NULL, NULL, '2026-09-02 16:04:24'),
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

--
-- Volcado de datos para la tabla `resenas`
--

INSERT INTO `resenas` (`id`, `servicio_id`, `servicio_slug`, `usuario_id`, `estrellas`, `texto`, `creado_en`) VALUES
(1, NULL, 'reflexologia-podal', 14, 5, 'muy bueno, me gustó mucho la experiencia', '2026-08-24 14:50:57');

--
-- Volcado de datos para la tabla `servicios`
--

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

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `apellido`, `email`, `password_hash`, `telefono`, `nacimiento`, `rol`, `activo`, `created_at`) VALUES
(1, 'Administrador', 'Senderos', 'admin@senderos.com', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '3510000000', NULL, 'admin', 1, '2026-06-19 13:43:10'),
(4, 'malena', 'gomez', 'may@escuelasproa.edu.ar', '$2y$10$XpJmq6qBg.4Lsw8MX6/xbOkG4TPDOUFM.OZx2SDotGuoULepsxbqa', 'may@escuelasproa.edu', '2025-12-03', 'cliente', 1, '2026-06-22 08:54:11'),
(8, 'Tomás', 'Eden', 'taeden@escuelasproa.edu.ar', '$2y$10$4H89Ntt7VtBe6AY2hw7d7e8NYR81JgCOGNlYbEzwdpPKzJM68n1Ai', 'taeden@escuelasproa.', '2023-02-01', 'cliente', 1, '2026-06-24 12:16:40'),
(11, 'evelyn', 'monteagudo', 'male@gmail.com', '$2y$10$Ao9fTZMGCpO8qKIYlwUN5uPH2QSXtaLm7wFpafJkLFzkWarKDOVA6', 'ijiejcolk@doiw', '2009-12-18', 'cliente', 1, '2026-06-30 12:54:07'),
(12, 'gianna', 'colmenares', 'gjcolmenares@escuelasproa.edu.ar', '$2y$10$ZypqLZp3SAFz/s9rwYXsleCLRTcFWzkvJMX0HVcXm.EDmXy2oIyvu', '3571601179', '2008-08-13', 'cliente', 1, '2026-07-22 11:04:14'),
(13, 'Kamari', 'Accesorios_Rio3', 'kamariaccesorios.11@gmail.com', '$2y$10$KGgKYKuhx5MBRq71qOH0uuLYUBrcdUYl7GerYy1ww9NyU83V9whtW', '3571552599', '2026-03-03', 'cliente', 1, '2026-08-10 11:46:20'),
(14, 'Marysol', 'Tello', 'tellomarysolariadna@gmail.com', '$2y$10$JGFAMmi/.U3ASJqB3JKcdufxwCRYeeEbePi2l5g9JiY4wnhN23U9y', '3571576935', '2001-08-14', 'cliente', 1, '2026-08-24 11:49:18'),
(15, 'Leandro', 'Nuñez', 'lenunez@escuelasproa.edu.ar', '$2y$10$wRQXDiQ6GrSOUYq8EsaSeOyr3qxdBeigpubiUC5GfqFuzNQzuUTF.', '3571552299', '2008-09-22', 'cliente', 1, '2026-09-14 09:16:25');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
