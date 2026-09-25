-- Migración 2026-09-22 — Selector múltiple de ítems en ofertas (admin)
-- La columna `especifico` pasa de VARCHAR(255) a TEXT para poder guardar
-- la selección múltiple de servicios/productos ("servicio:1,producto:5,...").
-- Ejecutar una sola vez sobre una base ya importada.

ALTER TABLE `ofertas`
  MODIFY `especifico` text DEFAULT NULL;
