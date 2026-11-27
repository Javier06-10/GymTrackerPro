-- ============================================================
-- 0016 · Medida del cuello
-- La necesita la estimación del % de grasa corporal (fórmula de la
-- Marina de EE. UU.: cintura/cadera, cuello y estatura). Igual que el
-- resto de perímetros: en pulgadas, 3 decimales para que cm ⇄ in vuelva
-- al mismo número. Opcional: las mediciones viejas quedan sin cuello.
-- ============================================================
alter table public.medidas add column if not exists cuello numeric(7,3);
