-- ============================================================
-- El administrador gestiona el catálogo de planes desde la app
-- (crear, cambiar precio/cupo, destacar, desactivar).
-- Nadie más puede escribir en planes; el código no cambia nunca
-- (lo usan el alta automática y la prueba gratis).
-- ============================================================
alter table public.planes
  add column descripcion text not null default '',
  add column destacado   boolean not null default false;
update public.planes set destacado = true where codigo = 'pro';

alter table public.planes
  add constraint planes_precio_ok check (precio_mensual >= 0),
  add constraint planes_cupo_ok check (max_atletas is null or max_atletas > 0),
  add constraint planes_nombre_ok check (length(btrim(nombre)) between 1 and 40),
  add constraint planes_codigo_ok check (codigo ~ '^[a-z0-9-]{2,30}$'),
  add constraint planes_descripcion_ok check (length(descripcion) <= 200);

-- Solo columnas editables; sin borrar (un plan en uso se desactiva)
revoke insert, update, delete, truncate on public.planes from authenticated, anon;
grant insert (codigo, nombre, precio_mensual, max_atletas, activo, destacado, descripcion) on public.planes to authenticated;
grant update (nombre, precio_mensual, max_atletas, activo, destacado, descripcion) on public.planes to authenticated;

create policy planes_admin_insertar on public.planes for insert to authenticated
  with check (public.es_admin());
create policy planes_admin_editar on public.planes for update to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- La prueba gratis no se puede desactivar: la usa cada registro nuevo
create or replace function public.proteger_plan_prueba()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.codigo = 'prueba' and not new.activo then
    raise exception 'El plan de prueba gratis no se puede desactivar' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger trg_proteger_plan_prueba
  before update on public.planes
  for each row execute function public.proteger_plan_prueba();
revoke execute on function public.proteger_plan_prueba() from public, anon, authenticated;
