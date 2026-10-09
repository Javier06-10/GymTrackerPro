-- Guarda el correo del entrenador en su perfil (para el panel de administración).
alter table public.perfiles add column email text not null default '';

create or replace function public.al_crear_usuario()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.perfiles (id, nombre, negocio, email)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'nombre', ''),
          coalesce(new.raw_user_meta_data->>'negocio', ''),
          coalesce(new.email, ''));
  insert into public.suscripciones (trainer_id, plan_id, estado, vence_el)
  values (new.id, (select id from public.planes where codigo = 'prueba'), 'prueba', current_date + 14);
  return new;
end;
$$;
revoke execute on function public.al_crear_usuario() from public, anon, authenticated;
