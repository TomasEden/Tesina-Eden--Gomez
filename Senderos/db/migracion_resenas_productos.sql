-- ============================================================
-- Migración: reseñas de productos
-- ============================================================
-- Archivo citado por api/resenas.php. Solo hace falta aplicarlo
-- en bases creadas ANTES de esta versión.
--
--   · Si tu base viene de db/senderos_db_unificado.sql → YA TIENE
--     estas columnas y NO hay que ejecutar nada.
--   · Si la columna producto_id ya existe, MySQL devolverá el
--     error 1060 "Duplicate column name": es esperado y no
--     rompe nada. Verificá el estado con el SELECT del final.
--
-- Uso:  mysql -u root -p senderos_db < migracion_resenas_productos.sql
-- ============================================================

ALTER TABLE `resenas`
    ADD COLUMN `producto_id` INT UNSIGNED DEFAULT NULL
        AFTER `servicio_slug`,
    ADD COLUMN `producto_nombre` VARCHAR(255) DEFAULT NULL
        AFTER `producto_id`,
    ADD KEY `idx_resenas_producto` (`producto_id`),
    ADD CONSTRAINT `fk_resenas_producto`
        FOREIGN KEY (`producto_id`)
        REFERENCES `productos` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE;

-- ------------------------------------------------------------
-- Verificación: debe devolver 2 filas (producto_id, producto_nombre)
-- ------------------------------------------------------------
SHOW COLUMNS FROM `resenas` LIKE 'producto_%';
