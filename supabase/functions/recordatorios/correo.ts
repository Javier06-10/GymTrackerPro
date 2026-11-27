// Arma el correo de recordatorios del entrenador (HTML + texto plano).
// Sin dependencias: lo usan la función Edge (Deno) y los tests (Node).

export interface FilaRecordatorio {
  trainer_id: string;
  email: string;
  nombre: string;
  negocio: string;
  semanal: boolean;
  plan: { dias: number; vence_el: string; plan: string; estado: string } | null;
  vencidos: { nombre: string; desde: string; dias: number; tarifa: number }[];
  mediciones: { nombre: string; ultima: string; dias: number }[];
  cumples: { nombre: string; dias: number; edad: number }[];
}

export interface Correo {
  asunto: string;
  html: string;
  texto: string;
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const APP = 'https://coachfenix.com';

export function esc(t: unknown): string {
  return String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function fecha(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number);
  return `${d} ${MESES[m - 1]} ${a}`;
}

function dinero(n: number): string {
  return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function plural(n: number, uno: string, varios = uno + 's'): string {
  return `${n} ${n === 1 ? uno : varios}`;
}

function textoPlan(p: NonNullable<FilaRecordatorio['plan']>): { titulo: string; detalle: string } {
  if (p.dias < 0) return { titulo: 'Tu plan venció', detalle: `Tu plan ${p.plan} venció el ${fecha(p.vence_el)}. Puedes ver tus datos, pero no guardar cambios hasta renovarlo.` };
  if (p.dias === 0) return { titulo: 'Tu plan vence hoy', detalle: `Tu plan ${p.plan} vence hoy. Renuévalo para seguir guardando cambios sin interrupciones.` };
  return { titulo: `Tu plan vence en ${plural(p.dias, 'día')}`, detalle: `Tu plan ${p.plan} vence el ${fecha(p.vence_el)}. Renuévalo a tiempo para no perder acceso a guardar cambios.` };
}

function cuando(dias: number): string {
  return dias === 0 ? '¡Hoy!' : dias === 1 ? 'Mañana' : `En ${dias} días`;
}

/** Asunto: lo más urgente primero. */
export function asunto(f: FilaRecordatorio): string {
  if (f.plan) return `${textoPlan(f.plan).titulo} · Coach Fénix`;
  const partes: string[] = [];
  if (f.vencidos.length) partes.push(plural(f.vencidos.length, 'cobro vencido', 'cobros vencidos'));
  if (f.mediciones.length) partes.push(plural(f.mediciones.length, 'medición pendiente', 'mediciones pendientes'));
  const hoy = f.cumples.filter((c) => c.dias === 0).length;
  if (hoy) partes.push(plural(hoy, 'cumpleaños hoy', 'cumpleaños hoy'));
  else if (f.cumples.length) partes.push(plural(f.cumples.length, 'cumpleaños esta semana', 'cumpleaños esta semana'));
  const base = partes.length ? partes.join(' · ') : 'Tu resumen';
  return `${f.semanal ? 'Resumen semanal: ' : ''}${base} · Coach Fénix`;
}

function seccion(titulo: string, color: string, filas: string[]): string {
  if (!filas.length) return '';
  return `<tr><td style="padding:8px 28px 4px;">
      <div style="font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${color};margin:12px 0 6px;">${esc(titulo)}</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${filas.join('')}</table>
    </td></tr>`;
}

function fila(izq: string, der: string): string {
  return `<tr><td style="padding:9px 0;border-bottom:1px solid #e8eaf3;font-size:14px;color:#141a44;">${izq}</td>
    <td style="padding:9px 0;border-bottom:1px solid #e8eaf3;font-size:13px;color:#4a5072;text-align:right;white-space:nowrap;">${der}</td></tr>`;
}

export function armarCorreo(f: FilaRecordatorio): Correo {
  const saludo = f.nombre ? `Hola, ${esc(f.nombre.split(' ')[0])}` : 'Hola';
  const plan = f.plan ? textoPlan(f.plan) : null;

  const vencidos = f.vencidos.map((v) => fila(`<b>${esc(v.nombre)}</b>`, `${dinero(v.tarifa)} · vencido hace ${plural(v.dias, 'día')}`));
  const mediciones = f.mediciones.map((m) => fila(`<b>${esc(m.nombre)}</b>`, `última hace ${plural(m.dias, 'día')}`));
  const cumples = f.cumples.map((c) => fila(`<b>${esc(c.nombre)}</b> cumple ${c.edad}`, cuando(c.dias)));
  const porCobrar = f.vencidos.reduce((s, v) => s + Number(v.tarifa || 0), 0);

  const avisoPlan = plan
    ? `<tr><td style="padding:16px 28px 0;"><div style="background:#fff4e8;border:1px solid #ffd3a6;border-radius:12px;padding:14px 16px;">
        <div style="font-size:15px;font-weight:700;color:#b84800;margin-bottom:4px;">${esc(plan.titulo)}</div>
        <div style="font-size:14px;line-height:1.55;color:#4a5072;">${esc(plan.detalle)}</div></div></td></tr>`
    : '';

  const intro = f.semanal
    ? 'Este es tu resumen de la semana: lo que necesita tu atención con tus atletas.'
    : 'Esto es lo que necesita tu atención hoy con tus atletas.';
  const hayAtletas = vencidos.length || mediciones.length || cumples.length;

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(asunto(f))}</title></head>
<body style="margin:0;padding:0;background:#f5f6fa;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6fa;padding:32px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;font-family:Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <tr><td style="background:#161c52;padding:22px 28px;"><table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td><img src="${APP}/icons/icon-192x192.png" width="44" height="44" alt="Coach Fénix" style="display:block;border:0;border-radius:10px;"></td>
    <td style="padding-left:12px;font-size:18px;font-weight:700;letter-spacing:2px;color:#ffffff;">COACH <span style="color:#ff9a3d;">FÉNIX</span></td>
  </tr></table></td></tr>
  <tr><td style="height:4px;background:#ff7e00;background-image:linear-gradient(90deg,#ffc61e,#ff7e00 45%,#e8260c);font-size:0;line-height:0;">&nbsp;</td></tr>
  <tr><td style="padding:28px 28px 4px;">
    <h1 style="margin:0 0 8px;font-size:22px;line-height:1.25;color:#141a44;">${saludo}</h1>
    ${hayAtletas ? `<p style="margin:0;font-size:15px;line-height:1.6;color:#4a5072;">${intro}</p>` : ''}
  </td></tr>
  ${avisoPlan}
  ${seccion(`Cobros vencidos · ${dinero(porCobrar)} por cobrar`, '#c21f0b', vencidos)}
  ${seccion('Mediciones pendientes', '#2e3a8c', mediciones)}
  ${seccion('Cumpleaños', '#b84800', cumples)}
  <tr><td align="center" style="padding:24px 28px 28px;">
    <a href="${APP}/${plan ? 'cuenta' : 'panel'}" style="display:inline-block;background:#ff7e00;color:#141a44;text-decoration:none;font-size:16px;font-weight:700;padding:14px 32px;border-radius:10px;">${plan ? 'Ver mi plan' : 'Abrir mi panel'}</a>
  </td></tr>
  <tr><td style="padding:18px 28px;background:#eef0f7;font-size:12px;line-height:1.6;color:#5f6585;">
    Recibes este correo porque tienes activados los recordatorios. Puedes desactivarlos en
    <a href="${APP}/cuenta" style="color:#b84800;">Mi cuenta</a>.<br>
    Coach Fénix · Software para entrenadores · <a href="mailto:hola@coachfenix.com" style="color:#b84800;">hola@coachfenix.com</a>
  </td></tr>
</table></td></tr></table></body></html>`;

  const lineas: string[] = [`${saludo.replace(/&#39;/g, "'")}`, ''];
  if (plan) lineas.push(plan.titulo.toUpperCase(), plan.detalle, '');
  if (f.vencidos.length) lineas.push(`COBROS VENCIDOS (${dinero(porCobrar)} por cobrar)`, ...f.vencidos.map((v) => `- ${v.nombre}: ${dinero(v.tarifa)}, vencido hace ${plural(v.dias, 'día')}`), '');
  if (f.mediciones.length) lineas.push('MEDICIONES PENDIENTES', ...f.mediciones.map((m) => `- ${m.nombre}: última hace ${plural(m.dias, 'día')}`), '');
  if (f.cumples.length) lineas.push('CUMPLEAÑOS', ...f.cumples.map((c) => `- ${c.nombre} cumple ${c.edad}: ${cuando(c.dias)}`), '');
  lineas.push(`Abrir: ${APP}/${plan ? 'cuenta' : 'panel'}`, '', `Desactiva estos correos en ${APP}/cuenta`);

  return { asunto: asunto(f), html, texto: lineas.join('\n') };
}
