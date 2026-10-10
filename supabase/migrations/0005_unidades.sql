-- ============================================================
-- 0005 · Unidades de medida por entrenador (lb/in o kg/cm)
-- Los datos se siguen guardando en libras y pulgadas; el cliente
-- convierte al mostrar y al capturar según perfiles.unidades.
-- ============================================================

alter table public.perfiles
  add column unidades text not null default 'imperial'
  check (unidades in ('imperial', 'metrico'));

-- El entrenador puede cambiar su preferencia (igual que nombre/negocio/teléfono/logo)
grant update (unidades) on public.perfiles to authenticated;

-- Más decimales para que kg → lb → kg y cm → in → cm vuelvan al mismo número
alter table public.medidas
  alter column peso            type numeric(8,3),
  alter column pecho           type numeric(7,3),
  alter column brazo_relajado  type numeric(7,3),
  alter column brazo_contraido type numeric(7,3),
  alter column antebrazo       type numeric(7,3),
  alter column abdomen_alto    type numeric(7,3),
  alter column abdomen_ombligo type numeric(7,3),
  alter column cadera          type numeric(7,3),
  alter column pierna          type numeric(7,3),
  alter column pantorrilla     type numeric(7,3);

-- Estatura en centímetros → pies + pulgadas con decimales (171 cm = 5' 7.32")
alter table public.atletas
  alter column estatura_pulg type numeric(5,2);
