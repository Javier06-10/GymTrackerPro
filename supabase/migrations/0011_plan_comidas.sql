-- Plan de comidas editado por el entrenador para un atleta (Nutrición → lápiz).
-- null = se muestra el plan sugerido automáticamente según el objetivo.
alter table public.atletas
  add column plan_comidas jsonb,
  add constraint atletas_plan_comidas_ok check (
    plan_comidas is null or (jsonb_typeof(plan_comidas) = 'object' and octet_length(plan_comidas::text) <= 20000)
  );
