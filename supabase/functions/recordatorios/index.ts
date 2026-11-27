// Edge Function `recordatorios`: una vez al día manda a cada entrenador el
// correo de recordatorios (cobros vencidos, mediciones pendientes, cumpleaños
// y aviso de vencimiento del plan). Solo al entrenador, nunca a los atletas.
//
// La llama pg_cron (ver supabase/correos/recordatorios.md) con la cabecera
// `x-cron-secret`. Secretos necesarios: RESEND_API_KEY y CRON_SECRET.
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los pone Supabase.
//
// Pruebas: POST con {"solo": "<trainer_id>", "forzar": true} manda el correo
// de ese entrenador aunque hoy no toque y sin dejar registro.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { armarCorreo, type FilaRecordatorio } from './correo.ts';

const REMITENTE = 'Coach Fénix <no-reply@coachfenix.com>';
const RESPONDER_A = 'hola@coachfenix.com';

function json(cuerpo: unknown, status = 200) {
  return new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  const secreto = Deno.env.get('CRON_SECRET');
  if (!secreto || req.headers.get('x-cron-secret') !== secreto) return json({ error: 'no autorizado' }, 401);

  const claveResend = Deno.env.get('RESEND_API_KEY');
  if (!claveResend) return json({ error: 'falta RESEND_API_KEY' }, 500);

  let opciones: { solo?: string; forzar?: boolean } = {};
  try {
    opciones = await req.json();
  } catch {
    /* cuerpo vacío: envío normal */
  }
  const forzar = !!opciones.forzar;

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

  const { data, error } = await db.rpc('recordatorios_del_dia', { p_solo: opciones.solo ?? null, p_forzar: forzar });
  if (error) return json({ error: error.message }, 500);
  const filas = (data ?? []) as FilaRecordatorio[];
  const hoy = new Date(Date.now() - 4 * 3600_000).toISOString().slice(0, 10); // hora de RD (UTC-4, sin horario de verano)

  const resultado = { candidatos: filas.length, enviados: 0, omitidos: 0, errores: [] as string[] };

  for (const f of filas) {
    // Reserva el día ANTES de enviar: si el programador repite la llamada, no se manda dos veces.
    if (!forzar) {
      const { data: reservado, error: e } = await db
        .from('recordatorios_envios')
        .insert({ trainer_id: f.trainer_id, fecha: hoy })
        .select('trainer_id');
      if (e || !reservado?.length) {
        resultado.omitidos++;
        continue;
      }
    }

    const correo = armarCorreo(f);
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${claveResend}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: REMITENTE, to: [f.email], reply_to: RESPONDER_A, subject: correo.asunto, html: correo.html, text: correo.texto }),
    });
    const cuerpo = await r.json().catch(() => ({}));

    if (r.ok) {
      resultado.enviados++;
      if (!forzar) await db.from('recordatorios_envios').update({ resend_id: cuerpo.id ?? null }).match({ trainer_id: f.trainer_id, fecha: hoy });
    } else {
      // Resend pone el motivo real en `message`: se guarda en el registro para revisarlo.
      // El día queda reservado a propósito: un fallo no debe convertirse en reintentos cada pocos minutos.
      const motivo = `${r.status} ${cuerpo.message ?? cuerpo.name ?? 'error'}`;
      resultado.errores.push(`${f.trainer_id}: ${motivo}`);
      if (!forzar) await db.from('recordatorios_envios').update({ error: motivo }).match({ trainer_id: f.trainer_id, fecha: hoy });
    }
  }

  return json(resultado);
});
