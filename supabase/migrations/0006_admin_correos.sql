-- ============================================================
-- 0006 · El administrador ve qué cuentas no han confirmado su
-- correo y puede confirmarlas a mano (útil mientras el envío de
-- correos de Supabase esté limitado o sin SMTP propio).
-- ============================================================

-- Estado del correo de cada entrenador (solo para el admin; los demás reciben 0 filas)
create or replace function public.admin_estado_correos()
returns table (trainer_id uuid, confirmado boolean, ultimo_acceso timestamptz)
language sql stable security definer set search_path = '' as $$
  select u.id, u.email_confirmed_at is not null, u.last_sign_in_at
  from auth.users u
  where public.es_admin();
$$;

-- Confirma el correo de una cuenta para que pueda entrar sin el enlace del correo
create or replace function public.admin_confirmar_correo(p_trainer_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.es_admin() then
    raise exception 'Solo el administrador puede confirmar correos' using errcode = '42501';
  end if;
  update auth.users
     set email_confirmed_at = coalesce(email_confirmed_at, now())
   where id = p_trainer_id;
  if not found then raise exception 'La cuenta no existe'; end if;
end;
$$;

revoke execute on function public.admin_estado_correos() from public, anon;
revoke execute on function public.admin_confirmar_correo(uuid) from public, anon;
grant execute on function public.admin_estado_correos() to authenticated;
grant execute on function public.admin_confirmar_correo(uuid) to authenticated;
