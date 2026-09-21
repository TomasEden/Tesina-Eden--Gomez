-- Senderos — crea (o repara) el usuario administrador.
-- Ejecutalo en phpMyAdmin > senderos_db > pestaña SQL.
--
--   Email:      admin@senderos.com
--   Contraseña: Senderos-2026!      (provisoria: cambiala apenas entres)
--
-- Si el email ya existe (como en el dump original), le pisa la contraseña,
-- lo deja con rol admin y lo activa. Si no existe, lo crea.

INSERT INTO `usuarios`
  (`nombre`, `apellido`, `email`, `password_hash`, `telefono`, `nacimiento`, `rol`, `activo`)
VALUES
  ('Administrador', 'Senderos', 'admin@senderos.com',
   '$2y$10$0759MWG5.kdFLlBefO/iCu0FimEuvMf1dACklzp0J31Opg.69Sl7C',
   '3510000000', NULL, 'admin', 1)
ON DUPLICATE KEY UPDATE
  `password_hash` = VALUES(`password_hash`),
  `rol` = 'admin',
  `activo` = 1;
