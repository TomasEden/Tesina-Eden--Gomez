-- ============================================================
-- Senderos Spa — Migración: verificación en dos pasos (2FA)
-- Compatible con la estructura actual de senderos_db.
-- NO borra ni modifica datos existentes.
-- Ejecutar en phpMyAdmin (Importar) o por CLI:
--   mysql -u root -P 3307 senderos_db < db\migration_2026_verificacion_2fa.sql
-- ============================================================

USE `senderos_db`;

-- ------------------------------------------------------------
-- Desafíos de verificación por correo electrónico.
-- Cada fila es un código de 6 dígitos emitido para una operación
-- concreta (login, cambio de datos, verificación de correo nuevo).
-- Solo se guarda un HMAC del código: nunca el código en claro.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `verificaciones` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `usuario_id` INT UNSIGNED NOT NULL,
  `tipo` ENUM('login','perfil','email_actual','email_nuevo') NOT NULL,
  `codigo_hash` CHAR(64) NOT NULL,
  `email_destino` VARCHAR(190) NOT NULL,
  `datos_pendientes` TEXT DEFAULT NULL,
  `intentos` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `reenvios` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `estado` ENUM('pendiente','usado','vencido','cancelado') NOT NULL DEFAULT 'pendiente',
  `ip` VARCHAR(45) DEFAULT NULL,
  `creado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ultimo_envio` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expira_en` DATETIME NOT NULL,
  `usado_en` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_verif_busqueda` (`usuario_id`, `tipo`, `estado`),
  KEY `idx_verif_expira` (`expira_en`),
  CONSTRAINT `fk_verificaciones_usuario`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Contador de solicitudes por clave (IP o usuario) para limitar
-- abusos: reenvíos excesivos, fuerza bruta sobre el código, etc.
-- Las filas se limpian automáticamente (mecanismo en verificacion_lib.php).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `verificaciones_rate` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `clave` VARCHAR(190) NOT NULL,
  `creado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rate_clave` (`clave`, `creado_en`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
