import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export const supabase = createClient(environment.supabaseUrl, environment.supabaseKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});

/** Traduce errores de Postgres/Supabase a mensajes para el entrenador. */
export function mensajeError(e: unknown): string {
  const err = e as { message?: string; code?: string } | null;
  const msg = err?.message || String(e);
  if (err?.code === '42501' || /row-level security/i.test(msg)) {
    return 'Tu suscripción no está vigente. Renueva tu plan para seguir guardando cambios.';
  }
  if (/Invalid login credentials/i.test(msg)) return 'Correo o contraseña incorrectos.';
  if (/Email not confirmed/i.test(msg)) return 'Confirma tu correo antes de entrar (revisa tu bandeja de entrada).';
  if (/User already registered/i.test(msg)) return 'Ya existe una cuenta con ese correo.';
  if (/Password should be at least/i.test(msg)) return 'La contraseña debe tener al menos 6 caracteres.';
  return msg;
}
