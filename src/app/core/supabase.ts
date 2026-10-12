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
  if (/Email not confirmed/i.test(msg)) return 'Tu correo aún no está confirmado. Abre el enlace que te enviamos (revisa también Spam) o pide que te lo reenviemos.';
  if (/email rate limit|over_email_send_rate_limit|For security purposes, you can only request this/i.test(msg)) {
    return 'Se enviaron demasiados correos en poco tiempo. Espera unos minutos e inténtalo de nuevo, o escríbenos por WhatsApp para activar tu cuenta.';
  }
  if (/Unable to validate email address|invalid format/i.test(msg)) return 'Ese correo no es válido. Revísalo e inténtalo de nuevo.';
  if (/Signups not allowed/i.test(msg)) return 'El registro de cuentas nuevas está cerrado por ahora.';
  if (/User already registered/i.test(msg)) return 'Ya existe una cuenta con ese correo.';
  if (/Password should be at least/i.test(msg)) return 'La contraseña debe tener al menos 6 caracteres.';
  return msg;
}
