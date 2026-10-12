-- ============================================================
-- 0008 · Tema "Marca oscuro" (la Marca pasa a ser la versión clara)
-- ============================================================
alter table public.perfiles drop constraint if exists perfiles_tema_check;
alter table public.perfiles add constraint perfiles_tema_check
  check (tema in ('marca', 'marca-oscuro', 'energia', 'fuerza', 'bienestar', 'tech'));
