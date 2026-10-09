// Utilidades de fechas, dinero y texto (portadas de la plantilla).

/** Fecha local de hoy en ISO (YYYY-MM-DD). La plantilla usaba toISOString (UTC) y de noche saltaba al día siguiente. */
export function hoyISO(): string {
  return isoDe(new Date());
}

export function isoDe(d: Date): string {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function sumarDias(iso: string, dias: number): string {
  const f = new Date(iso + 'T00:00:00');
  f.setDate(f.getDate() + dias);
  return isoDe(f);
}

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const MESES_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export function fmtFecha(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d} ${MESES_CORTOS[m - 1]} ${a}`;
}

export function fmtDinero(n: number | string | null | undefined): string {
  return '$' + Number(n || 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Días transcurridos desde la fecha (negativo si es futura). */
export function diasDesde(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const hoy = new Date(hoyISO() + 'T00:00:00');
  const f = new Date(iso + 'T00:00:00');
  return Math.round((hoy.getTime() - f.getTime()) / 86400000);
}

export function edadDesde(fechaISO: string): number | null {
  const n = new Date(fechaISO + 'T00:00:00');
  if (isNaN(n.getTime())) return null;
  const hoy = new Date(hoyISO() + 'T00:00:00');
  let e = hoy.getFullYear() - n.getFullYear();
  const m = hoy.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < n.getDate())) e--;
  return e >= 0 && e < 120 ? e : null;
}

export function proximoCumple(fechaNacimiento: string): { dias: number; edadCumple: number; fecha: string } | null {
  if (!fechaNacimiento) return null;
  const n = new Date(fechaNacimiento + 'T00:00:00');
  if (isNaN(n.getTime())) return null;
  const hoy = new Date(hoyISO() + 'T00:00:00');
  let cumple = new Date(hoy.getFullYear(), n.getMonth(), n.getDate());
  if (cumple < hoy) cumple = new Date(hoy.getFullYear() + 1, n.getMonth(), n.getDate());
  const dias = Math.round((cumple.getTime() - hoy.getTime()) / 86400000);
  return { dias, edadCumple: cumple.getFullYear() - n.getFullYear(), fecha: isoDe(cumple) };
}

export function normalizar(t: string | null | undefined): string {
  return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function iniciales(nombre: string): string {
  return nombre.trim().split(/\s+/).slice(0, 2).map((p) => p[0] || '').join('').toUpperCase();
}

export function plural(n: number, singular: string, pluralTxt = singular + 's'): string {
  return n === 1 ? singular : pluralTxt;
}

export function uid(): string {
  return 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Escapa texto del usuario antes de meterlo en HTML (mensajes de confirmación). */
export function esc(t: unknown): string {
  return String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
