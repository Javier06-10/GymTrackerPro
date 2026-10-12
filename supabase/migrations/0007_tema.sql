-- ============================================================
-- 0007 · Tema visual elegido por cada entrenador
-- ============================================================
alter table public.perfiles
  add column tema text not null default 'marca'
  check (tema in ('marca', 'energia', 'fuerza', 'bienestar', 'tech'));

grant update (tema) on public.perfiles to authenticated;
