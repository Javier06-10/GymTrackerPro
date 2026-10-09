-- Las funciones de apoyo de RLS solo las necesita el rol authenticated.
revoke execute on function public.es_admin() from public, anon;
revoke execute on function public.suscripcion_vigente() from public, anon;
grant execute on function public.es_admin() to authenticated;
grant execute on function public.suscripcion_vigente() to authenticated;
