/**
 * % de grasa corporal estimado con la fórmula de la Marina de EE. UU. (Hodgdon y
 * Beckett, 1984). Solo necesita cinta métrica; todas las medidas en pulgadas, que es
 * como se guardan en la base.
 *
 *   Hombres: 86.010·log10(cintura − cuello) − 70.041·log10(estatura) + 36.76
 *   Mujeres: 163.205·log10(cintura + cadera − cuello) − 97.684·log10(estatura) − 78.387
 *
 * Cintura: en hombres a la altura del ombligo (abdomenOmbligo); en mujeres en la
 * parte más estrecha (abdomenAlto; si falta, la del ombligo).
 * Es una ESTIMACIÓN (±3–4 % frente a métodos de laboratorio): sirve sobre todo para
 * seguir la tendencia de un mismo atleta medido siempre igual.
 */
import { Atleta, Genero, Medida } from './modelos';

export interface LecturaGrasa {
  pct: number;
  categoria: string;
  cls: 'verde' | 'ambar' | 'rojo' | 'neutro';
  /** Masa grasa y magra en libras (la UI las convierte). */
  grasaLb: number;
  magraLb: number;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

export function estaturaPulgadas(a: Pick<Atleta, 'estaturaPies' | 'estaturaPulg'>): number {
  return (Number(a.estaturaPies) || 0) * 12 + (Number(a.estaturaPulg) || 0);
}

/** % de grasa o null si faltan medidas o el resultado no es creíble (2–60 %). */
export function porcentajeGrasa(genero: Genero, estaturaIn: number, m: Partial<Medida>): number | null {
  const cuello = Number(m.cuello);
  if (!(estaturaIn > 48) || !(cuello > 0)) return null;
  let pct: number;
  if (genero === 'mujer') {
    const cintura = Number(m.abdomenAlto ?? m.abdomenOmbligo);
    const cadera = Number(m.cadera);
    if (!(cintura > 0) || !(cadera > 0) || cintura + cadera - cuello <= 0) return null;
    pct = 163.205 * Math.log10(cintura + cadera - cuello) - 97.684 * Math.log10(estaturaIn) - 78.387;
  } else {
    const cintura = Number(m.abdomenOmbligo);
    if (!(cintura > 0) || cintura - cuello <= 0) return null;
    pct = 86.01 * Math.log10(cintura - cuello) - 70.041 * Math.log10(estaturaIn) + 36.76;
  }
  return pct >= 2 && pct <= 60 ? r1(pct) : null;
}

/** Rangos del American Council on Exercise (ACE). */
export function categoriaGrasa(genero: Genero, pct: number): Pick<LecturaGrasa, 'categoria' | 'cls'> {
  const [esencial, atleta, fitness, promedio] = genero === 'mujer' ? [14, 21, 25, 32] : [6, 14, 18, 25];
  if (pct < esencial) return { categoria: 'Grasa esencial', cls: 'ambar' };
  if (pct < atleta) return { categoria: 'Atlético', cls: 'verde' };
  if (pct < fitness) return { categoria: 'Fitness', cls: 'verde' };
  if (pct < promedio) return { categoria: 'Promedio', cls: 'neutro' };
  return { categoria: 'Alto', cls: 'rojo' };
}

export function lecturaGrasa(a: Atleta, m: Medida | null | undefined): LecturaGrasa | null {
  if (!m) return null;
  const pct = porcentajeGrasa(a.genero, estaturaPulgadas(a), m);
  if (pct === null) return null;
  const grasaLb = r1((Number(m.peso) * pct) / 100);
  return { pct, ...categoriaGrasa(a.genero, pct), grasaLb, magraLb: r1(Number(m.peso) - grasaLb) };
}

/** Serie del % de grasa en el tiempo (solo las mediciones donde se puede calcular). */
export function serieGrasa(a: Atleta): { fecha: string; valor: number }[] {
  const est = estaturaPulgadas(a);
  return a.medidas
    .map((m) => ({ fecha: m.fecha, valor: porcentajeGrasa(a.genero, est, m) }))
    .filter((p): p is { fecha: string; valor: number } => p.valor !== null);
}
