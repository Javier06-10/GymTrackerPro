// Reglas de negocio del entrenador (portadas de la plantilla).
import { Atleta, Composicion, Medida, Objetivo, ObjetivoMeta } from './modelos';
import { diasDesde, hoyISO, isoDe } from './util';

export const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const ZONAS: [string, string][] = [
  ['pecho', 'Pecho'],
  ['brazoRelajado', 'Brazo relajado'],
  ['brazoContraido', 'Brazo contraído'],
  ['antebrazo', 'Antebrazo'],
  ['abdomenAlto', 'Abdomen alto'],
  ['abdomenOmbligo', 'Abdomen (ombligo)'],
  ['cadera', 'Cadera'],
  ['pierna', 'Pierna'],
  ['pantorrilla', 'Pantorrilla'],
];
/** En estas zonas bajar es progreso. */
export const ZONAS_INVERTIDAS = new Set(['abdomenAlto', 'abdomenOmbligo']);
export const GRUPOS_MEDIDA: [string, string[]][] = [
  ['💪 Brazos', ['brazoRelajado', 'brazoContraido', 'antebrazo']],
  ['🫁 Torso', ['pecho', 'abdomenAlto', 'abdomenOmbligo']],
  ['🦵 Tren inferior', ['cadera', 'pierna', 'pantorrilla']],
];
export function etiquetaZona(id: string): string {
  return ZONAS.find((z) => z[0] === id)?.[1] ?? id;
}

export const OBJETIVOS: Record<Objetivo, { t: string; ic: string; ajuste: number; prot: [number, number] }> = {
  perder: { t: 'Perder grasa', ic: '🔥', ajuste: -0.2, prot: [2.0, 2.2] },
  ganar: { t: 'Ganar masa muscular', ic: '📈', ajuste: +0.12, prot: [1.8, 2.0] },
  recomp: { t: 'Recomposición corporal', ic: '⚖️', ajuste: 0, prot: [2.0, 2.2] },
  mantener: { t: 'Mantenimiento', ic: '🛡️', ajuste: 0, prot: [1.6, 1.8] },
};

export const CONSEJOS_OBJETIVO: Record<Objetivo, string[]> = {
  perder: [
    'Mantén la proteína alta en cada comida para preservar el músculo mientras bajas grasa.',
    'Prioriza verduras, frutas y fibra: dan saciedad con pocas calorías.',
    'Elimina las calorías líquidas (refrescos, jugos azucarados, alcohol) — son las más fáciles de recortar.',
    'Pésalo una vez por semana, el mismo día y a la misma hora, en ayunas. La tendencia importa más que el número diario.',
    'Si el peso se estanca más de 2-3 semanas, revisa porciones antes de recortar más calorías.',
  ],
  ganar: [
    'Superávit controlado: la meta es subir aproximadamente 0.25–0.5% del peso corporal por semana. Más rápido suele ser grasa.',
    'Distribuye la proteína en 4–5 comidas al día para maximizar la síntesis muscular.',
    'Concentra los carbohidratos alrededor del entrenamiento (antes y después) para rendir y recuperar.',
    'Si le cuesta comer tanto, usa licuados con avena, leche, fruta y mantequilla de maní: calorías fáciles de tomar.',
    'El sueño (7–9 horas) es parte del plan: sin descanso no hay crecimiento.',
  ],
  recomp: [
    'Calorías cerca del mantenimiento con proteína alta: el cuerpo usa la grasa como energía mientras construye músculo.',
    'El progreso se mide en las cintas métricas y el avatar, no solo en la báscula — el peso puede quedarse igual y el cuerpo cambiar.',
    'Come un poco más los días de entrenamiento fuerte y un poco menos los días de descanso.',
    'La recomposición es más lenta que un déficit o superávit puro: paciencia y constancia de 8–12 semanas mínimo.',
    'Prioriza alimentos sin procesar en el 80% de las comidas.',
  ],
  mantener: [
    'Mantén los hábitos que ya funcionan: proteína adecuada, comida real y entrenamientos constantes.',
    'Regla 80/20: 80% de alimentos nutritivos, 20% de flexibilidad para que el plan sea sostenible.',
    'Sigue midiendo una vez al mes para detectar cambios a tiempo.',
    'Ajusta las calorías si cambia la frecuencia de entrenamiento.',
  ],
};

export function derivarObjetivo(comp: Composicion): Objetivo {
  return comp === 'grasa' ? 'perder' : comp === 'delgado' ? 'ganar' : 'recomp';
}
export function nombreObjetivo(o: string): string {
  return (OBJETIVOS[o as Objetivo] || OBJETIVOS.recomp).t;
}
export function nombreSueno(v: string): string {
  return ({ menos5: 'Menos de 5 h', '5a6': '5–6 h', '7a8': '7–8 h', mas8: 'Más de 8 h' } as Record<string, string>)[v] || '—';
}
export function nombreEstiloVida(v: string): string {
  return ({ sedentario: 'Sedentario', ligero: 'Ligeramente activo', activo: 'Activo', muyactivo: 'Muy activo' } as Record<string, string>)[v] || '—';
}
export function nombreComposicion(v: string): string {
  return ({ delgado: 'Delgado (Ectomorfo)', grasa: 'Volumen con Grasa (Endomorfo)', musculo: 'Volumen Muscular (Mesomorfo)' } as Record<string, string>)[v] || v;
}

export function ultimaMedida(a: Atleta): Medida | null {
  return a.medidas.length ? a.medidas[a.medidas.length - 1] : null;
}

export function diasConRutina(a: Atleta): number {
  return DIAS.filter((d) => a.rutina[d]?.ejercicios.length).length;
}

export function medicionPendiente(a: Atleta) {
  const ult = ultimaMedida(a);
  if (!ult) return null;
  const dias = diasDesde(ult.fecha) ?? 0;
  const frec = a.frecuenciaMedicion || 30;
  return { dias, frec, vencida: dias >= frec, proximaEn: frec - dias, ultFecha: ult.fecha };
}

export function pagoVencido(a: Atleta): boolean {
  return a.activo && !!a.proximoPago && (diasDesde(a.proximoPago) ?? 0) > 0;
}

/** Días "Entrenado" seguidos hacia atrás desde hoy. Los días sin marcar no rompen la racha; una falta sí. */
export function rachaActual(a: Atleta): number {
  let racha = 0;
  const d = new Date(hoyISO() + 'T00:00:00');
  for (let i = 0; i < 365; i++) {
    const e = a.asistencia[isoDe(d)];
    if (e === 'E') racha++;
    else if (e === 'F') break;
    d.setDate(d.getDate() - 1);
  }
  return racha;
}

export function avanceObjetivo(a: Atleta, ob: ObjetivoMeta): { actual: number | null; pct: number | null } {
  const ult = ultimaMedida(a);
  let actual: number | null | undefined = null;
  if (ob.tipo === 'peso') actual = ult ? ult.peso : null;
  else if (ob.tipo === 'zona') actual = ult && ob.zona && ult[ob.zona] != null ? Number(ult[ob.zona]) : null;
  else actual = ob.valorActual;
  if (actual === null || actual === undefined) return { actual: null, pct: null };
  const rango = ob.valorInicial - ob.valorObjetivo;
  let pct: number;
  if (rango === 0) pct = (ob.tipo === 'manual' ? actual >= ob.valorObjetivo : actual === ob.valorObjetivo) ? 100 : 0;
  else pct = Math.round(((ob.valorInicial - actual) / rango) * 100);
  return { actual, pct: Math.max(0, Math.min(100, pct)) };
}

export function unidadObjetivo(ob: ObjetivoMeta): string {
  return ob.tipo === 'peso' ? 'lb' : ob.tipo === 'zona' ? 'in' : ob.unidad || '';
}

export function serieMedida(a: Atleta, clave: string): { fecha: string; valor: number }[] {
  return a.medidas
    .filter((m) => m[clave] != null && m[clave] !== '')
    .map((m) => ({ fecha: m.fecha, valor: Number(m[clave]) }));
}

/** Delta entre dos valores para las tablas de progreso. */
export function delta(actual: unknown, anterior: unknown, invertido: boolean) {
  if (anterior == null || actual == null) return null;
  const d = Number((Number(actual) - Number(anterior)).toFixed(1));
  if (d === 0) return { txt: '=', cls: 'delta-cero' };
  const bueno = d > 0 === !invertido;
  return { txt: (d > 0 ? '+' : '') + d, cls: bueno ? 'delta-pos' : 'delta-neg' };
}

/* ---------- Nutrición (Mifflin-St Jeor) ---------- */
export interface PlanNutricional {
  kg: number;
  tdee: number;
  cal: number;
  protMin: number;
  protMax: number;
  grasaG: number;
  carbG: number;
  aguaL: string;
  protComida: number;
  ajusteTxt: string;
  nivelTxt: string;
}

export function calcularNutricion(a: Atleta): PlanNutricional | null {
  const ult = ultimaMedida(a);
  if (!a.edad || !ult) return null;
  const o = OBJETIVOS[a.objetivo] || OBJETIVOS.recomp;
  const kg = ult.peso * 0.453592;
  const cm = (a.estaturaPies * 12 + a.estaturaPulg) * 2.54;
  const tmb = 10 * kg + 6.25 * cm - 5 * a.edad + (a.genero === 'mujer' ? -161 : 5);
  const dEntreno = diasConRutina(a);
  let factor: number;
  let nivelTxt: string;
  if (a.estiloVida) {
    const baseEstilo = ({ sedentario: 1.2, ligero: 1.3, activo: 1.45, muyactivo: 1.6 } as Record<string, number>)[a.estiloVida] || 1.3;
    factor = Math.min(1.9, baseEstilo + dEntreno * 0.033);
    nivelTxt = nombreEstiloVida(a.estiloVida).toLowerCase() + ' + ' + dEntreno + ' día' + (dEntreno === 1 ? '' : 's') + ' de gym';
  } else {
    factor = dEntreno <= 1 ? 1.2 : dEntreno <= 3 ? 1.375 : dEntreno <= 5 ? 1.55 : 1.725;
    nivelTxt = dEntreno <= 1 ? 'sedentario' : dEntreno <= 3 ? 'actividad ligera' : dEntreno <= 5 ? 'actividad moderada' : 'actividad alta';
  }
  const tdee = tmb * factor;
  const cal = Math.round((tdee * (1 + o.ajuste)) / 50) * 50;
  const protMin = Math.round((o.prot[0] * kg) / 5) * 5;
  const protMax = Math.round((o.prot[1] * kg) / 5) * 5;
  const grasaG = Math.round((cal * 0.27) / 9 / 5) * 5;
  const carbG = Math.max(50, Math.round((cal - protMax * 4 - grasaG * 9) / 4 / 5) * 5);
  const ajusteTxt =
    o.ajuste < 0 ? `déficit del ${Math.round(Math.abs(o.ajuste) * 100)}%` : o.ajuste > 0 ? `superávit del ${Math.round(o.ajuste * 100)}%` : 'calorías de mantenimiento';
  return {
    kg, tdee, cal, protMin, protMax, grasaG, carbG,
    aguaL: (kg * 0.035).toFixed(1),
    protComida: Math.round(protMax / 4 / 5) * 5,
    ajusteTxt, nivelTxt,
  };
}

/** Lectura del progreso (primera vs última medición) según el objetivo. */
export function lecturaProgreso(a: Atleta): { dPeso: number; dAbd: number | null; lectura: string } | null {
  if (a.medidas.length < 2) return null;
  const prim = a.medidas[0];
  const ult = a.medidas[a.medidas.length - 1];
  const dPeso = Number((ult.peso - prim.peso).toFixed(1));
  const dAbd = ult.abdomenOmbligo != null && prim.abdomenOmbligo != null ? Number((ult.abdomenOmbligo - prim.abdomenOmbligo).toFixed(1)) : null;
  let lectura = '';
  if (a.objetivo === 'perder') lectura = dPeso < 0 || (dAbd != null && dAbd < 0) ? 'La tendencia va en la dirección del objetivo. 👍' : 'La tendencia aún no muestra reducción — revisa la adherencia al plan.';
  if (a.objetivo === 'ganar') lectura = dPeso > 0 ? 'La tendencia va en la dirección del objetivo. 👍' : 'El peso no está subiendo — probablemente falta comer más.';
  if (a.objetivo === 'recomp') lectura = dAbd != null && dAbd < 0 ? 'El abdomen está bajando con el peso estable: recomposición en marcha. 👍' : 'Sigue midiendo: en recomposición las cintas dicen más que la báscula.';
  if (a.objetivo === 'mantener') lectura = Math.abs(dPeso) <= 3 ? 'Peso estable: mantenimiento logrado. 👍' : 'El peso se está moviendo — ajusta calorías si no es intencional.';
  return { dPeso, dAbd, lectura };
}

/** Rutina vacía con los 7 días. */
export function normalizarRutina(r: unknown): Record<string, { titulo: string; ejercicios: any[] }> {
  const base = (r && typeof r === 'object' ? r : {}) as Record<string, any>;
  const out: Record<string, { titulo: string; ejercicios: any[] }> = {};
  DIAS.forEach((d) => {
    const dia = base[d] || {};
    out[d] = {
      titulo: dia.titulo || '',
      ejercicios: (dia.ejercicios || []).map((ej: any) => ({
        nombre: ej.nombre || '',
        series: ej.series || '',
        peso: ej.peso || '',
        descanso: ej.descanso || '',
        notas: ej.notas || '',
        historialPeso: ej.historialPeso || [],
      })),
    };
  });
  return out;
}
