-- Precios de lanzamiento (2026-11-10): se bajan para crecer la comunidad.
-- Antes: 9.99 / 19.99 / 34.99. Las suscripciones ya pagadas no cambian.
update public.planes set precio_mensual = 5.00  where codigo = 'basico';
update public.planes set precio_mensual = 10.00 where codigo = 'pro';
update public.planes set precio_mensual = 18.00 where codigo = 'elite';
