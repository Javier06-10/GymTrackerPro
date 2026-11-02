/* ============================================================
   Planes de comida sugeridos según el objetivo del atleta.
   Tres plantillas (déficit, mantenimiento, superávit) con alimentos
   comunes en RD; las porciones se escalan a las calorías del atleta.
   Valores nutricionales aproximados (USDA, alimentos cocidos).
   ============================================================ */
import { Atleta } from './modelos';
import { calcularNutricion, quiereBajar } from './dominio';

export type TipoPlan = 'deficit' | 'mantenimiento' | 'superavit';

/** Alimento: kcal y proteína por unidad de medida ('g'/'ml' = por 100; 'u' = por unidad; 'porcion' = no se escala). */
interface Alimento {
  kcal: number;
  prot: number;
  medida: 'g' | 'ml' | 'u' | 'porcion';
  /** Singular / plural cuando la medida es por unidad o porción. */
  nombre: [string, string];
}

const A: Record<string, Alimento> = {
  huevo: { kcal: 72, prot: 6.3, medida: 'u', nombre: ['huevo entero', 'huevos enteros'] },
  clara: { kcal: 17, prot: 3.6, medida: 'u', nombre: ['clara de huevo', 'claras de huevo'] },
  avena: { kcal: 380, prot: 13, medida: 'g', nombre: ['avena', 'avena'] },
  guineoP: { kcal: 80, prot: 1, medida: 'u', nombre: ['guineo pequeño', 'guineos pequeños'] },
  guineo: { kcal: 105, prot: 1.3, medida: 'u', nombre: ['guineo', 'guineos'] },
  pollo: { kcal: 165, prot: 31, medida: 'g', nombre: ['pechuga de pollo', 'pechuga de pollo'] },
  arroz: { kcal: 130, prot: 2.7, medida: 'g', nombre: ['arroz cocido', 'arroz cocido'] },
  aguacate: { kcal: 160, prot: 2, medida: 'g', nombre: ['aguacate', 'aguacate'] },
  ensalada: { kcal: 30, prot: 1.5, medida: 'porcion', nombre: ['Ensalada verde', 'Ensalada verde'] },
  yogur: { kcal: 73, prot: 10, medida: 'g', nombre: ['yogur griego natural', 'yogur griego natural'] },
  manzana: { kcal: 95, prot: 0.5, medida: 'u', nombre: ['manzana', 'manzanas'] },
  almendras: { kcal: 580, prot: 21, medida: 'g', nombre: ['almendras', 'almendras'] },
  atun: { kcal: 116, prot: 26, medida: 'g', nombre: ['atún al natural', 'atún al natural'] },
  batata: { kcal: 76, prot: 1.4, medida: 'g', nombre: ['batata hervida', 'batata hervida'] },
  vegetales: { kcal: 50, prot: 2, medida: 'porcion', nombre: ['Vegetales salteados o hervidos', 'Vegetales salteados o hervidos'] },
  mani: { kcal: 95, prot: 4, medida: 'u', nombre: ['cucharada de mantequilla de maní', 'cucharadas de mantequilla de maní'] },
  leche: { kcal: 61, prot: 3.2, medida: 'ml', nombre: ['leche', 'leche'] },
  habichuelas: { kcal: 127, prot: 8.7, medida: 'g', nombre: ['habichuelas cocidas', 'habichuelas cocidas'] },
  pan: { kcal: 75, prot: 3.5, medida: 'u', nombre: ['rebanada de pan integral', 'rebanadas de pan integral'] },
  cafe: { kcal: 2, prot: 0, medida: 'porcion', nombre: ['Café o té sin azúcar', 'Café o té sin azúcar'] },
  fruta: { kcal: 70, prot: 0.7, medida: 'u', nombre: ['fruta de temporada', 'frutas de temporada'] },
  pescado: { kcal: 128, prot: 26, medida: 'g', nombre: ['pescado', 'pescado'] },
  aceite: { kcal: 40, prot: 0, medida: 'u', nombre: ['cucharadita de aceite de oliva', 'cucharaditas de aceite de oliva'] },
};

/** Alimentos que aportan la proteína del plan: se escalan según la meta de proteína, no de calorías. */
const FUENTES_PROTEINA = new Set<string>(['huevo', 'clara', 'pollo', 'atun', 'pescado', 'yogur']);

interface ComidaBase { nombre: string; hora: string; emoji: string; items: [keyof typeof A, number][] }
interface PlanBase { tipo: TipoPlan; titulo: string; objetivo: string; ajuste: number; comidas: ComidaBase[] }

export const PLANES_BASE: Record<TipoPlan, PlanBase> = {
  deficit: {
    tipo: 'deficit', titulo: 'Déficit calórico', objetivo: 'Pérdida de grasa y conservación muscular', ajuste: -0.2,
    comidas: [
      { nombre: 'Desayuno', hora: '7:00 a. m.', emoji: '🍳', items: [['huevo', 2], ['clara', 3], ['avena', 40], ['guineoP', 1]] },
      { nombre: 'Almuerzo', hora: '12:30 p. m.', emoji: '🍗', items: [['pollo', 150], ['arroz', 100], ['aguacate', 50], ['ensalada', 1]] },
      { nombre: 'Merienda', hora: '4:00 p. m.', emoji: '🍏', items: [['yogur', 170], ['manzana', 1], ['almendras', 10]] },
      { nombre: 'Cena', hora: '7:30 p. m.', emoji: '🐟', items: [['atun', 150], ['batata', 150], ['vegetales', 1]] },
    ],
  },
  mantenimiento: {
    tipo: 'mantenimiento', titulo: 'Mantenimiento calórico', objetivo: 'Conservar masa muscular y peso corporal', ajuste: 0,
    comidas: [
      { nombre: 'Desayuno', hora: '7:00 a. m.', emoji: '🍳', items: [['huevo', 3], ['pan', 2], ['guineo', 1], ['cafe', 1]] },
      { nombre: 'Almuerzo', hora: '12:30 p. m.', emoji: '🍛', items: [['pollo', 150], ['arroz', 150], ['habichuelas', 100], ['aguacate', 50], ['ensalada', 1]] },
      { nombre: 'Merienda', hora: '4:00 p. m.', emoji: '🥣', items: [['yogur', 170], ['avena', 30], ['fruta', 1]] },
      { nombre: 'Cena', hora: '7:30 p. m.', emoji: '🐟', items: [['pescado', 150], ['batata', 180], ['vegetales', 1], ['aceite', 1]] },
    ],
  },
  superavit: {
    tipo: 'superavit', titulo: 'Superávit calórico', objetivo: 'Hipertrofia muscular', ajuste: 0.12,
    comidas: [
      { nombre: 'Desayuno', hora: '7:00 a. m.', emoji: '🍳', items: [['huevo', 4], ['avena', 80], ['guineo', 1], ['mani', 1]] },
      { nombre: 'Almuerzo', hora: '12:00 p. m.', emoji: '🍗', items: [['pollo', 180], ['arroz', 200], ['aguacate', 70], ['ensalada', 1]] },
      { nombre: 'Merienda', hora: '4:00 p. m.', emoji: '🥤', items: [['leche', 250], ['guineo', 1], ['avena', 40], ['yogur', 170]] },
      { nombre: 'Cena', hora: '8:00 p. m.', emoji: '🍠', items: [['pollo', 150], ['batata', 250], ['habichuelas', 100], ['vegetales', 1]] },
    ],
  },
};

/** Intercambios equivalentes para variar el menú sin romper el plan. */
export const EQUIVALENCIAS: [string, string][] = [
  ['Proteínas', 'Pechuga de pollo ↔ pescado ↔ atún ↔ pavo ↔ carne de res magra (mismo peso)'],
  ['Carbohidratos', '100 g de arroz cocido ↔ 170 g de batata ↔ 130 g de yuca ↔ 100 g de plátano hervido ↔ 2 rebanadas de pan integral'],
  ['Grasas', '50 g de aguacate ↔ 1 cucharada de mantequilla de maní ↔ 15 g de almendras ↔ 2 cucharaditas de aceite de oliva'],
  ['Lácteos', '170 g de yogur griego ↔ 250 ml de leche ↔ 1 medida de proteína en polvo'],
];

export interface ItemPlan { texto: string; kcal: number; prot: number }
export interface ComidaPlan { nombre: string; hora: string; emoji: string; items: ItemPlan[]; kcal: number; prot: number }
export interface PlanComidas {
  tipo: TipoPlan; titulo: string; objetivo: string;
  comidas: ComidaPlan[]; kcal: number; prot: number;
  /** Calorías objetivo del atleta (null si faltan datos: se muestra la plantilla sin ajustar). */
  meta: number | null; protMeta: [number, number] | null; factor: number;
}

/** Plan que corresponde al objetivo del atleta. */
export function planRecomendado(a: Atleta): TipoPlan {
  if (a.objetivo === 'ganar') return 'superavit';
  if (a.objetivo === 'perder' || quiereBajar(a)) return 'deficit';
  return 'mantenimiento';
}

const redondeo = (v: number, paso: number) => Math.max(paso, Math.round(v / paso) * paso);

function itemEscalado(clave: keyof typeof A, base: number, f: number): ItemPlan {
  const al = A[clave];
  let cant = base;
  if (al.medida === 'g' || al.medida === 'ml') cant = redondeo(base * f, base * f < 60 ? 5 : 10);
  else if (al.medida === 'u') cant = Math.max(1, Math.round(base * f));
  const kcal = al.medida === 'porcion' ? al.kcal : al.medida === 'u' ? al.kcal * cant : (al.kcal * cant) / 100;
  const prot = al.medida === 'porcion' ? al.prot : al.medida === 'u' ? al.prot * cant : (al.prot * cant) / 100;
  const texto =
    al.medida === 'porcion' ? al.nombre[0]
    : al.medida === 'u' ? `${cant} ${cant === 1 ? al.nombre[0] : al.nombre[1]}`
    : `${cant} ${al.medida} de ${al.nombre[0]}`;
  return { texto, kcal, prot };
}

const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Arma el plan del tipo pedido. Si se puede calcular el gasto del atleta:
 * 1) las fuentes de proteína se escalan hacia el centro de su meta de proteína;
 * 2) el resto (carbohidratos y grasas) completa sus calorías objetivo.
 * Los factores se limitan para que las porciones sigan siendo razonables.
 */
export function armarPlan(a: Atleta, tipo: TipoPlan): PlanComidas {
  const base = PLANES_BASE[tipo];
  const nut = calcularNutricion(a);
  const meta = nut ? Math.round((nut.tdee * (1 + base.ajuste)) / 50) * 50 : null;
  // Proteína objetivo según el tipo de plan (g por kg)
  const pk = tipo === 'superavit' ? [1.8, 2.0] : tipo === 'deficit' ? [2.0, 2.2] : [1.6, 1.8];
  const protMeta: [number, number] | null = nut ? [Math.round((pk[0] * nut.kg) / 5) * 5, Math.round((pk[1] * nut.kg) / 5) * 5] : null;

  // Totales de la plantilla separando fuentes de proteína del resto
  let protP = 0, kcalP = 0, protR = 0, kcalR = 0;
  base.comidas.forEach((c) => c.items.forEach(([k, n]) => {
    const it = itemEscalado(k, n, 1);
    if (FUENTES_PROTEINA.has(k)) { protP += it.prot; kcalP += it.kcal; } else { protR += it.prot; kcalR += it.kcal; }
  }));
  let fProt = 1, fResto = 1;
  if (meta && protMeta) {
    const protObjetivo = (protMeta[0] + protMeta[1]) / 2;
    // Dos pasadas: el resto también aporta proteína (avena, habichuelas, leche) y crece con las calorías
    for (let i = 0; i < 3; i++) {
      fProt = limitar((protObjetivo - protR * fResto) / protP, 0.85, 1.6);
      fResto = limitar((meta - kcalP * fProt) / kcalR, 0.6, 1.8);
    }
  }
  const factor = fResto;

  const comidas = base.comidas.map((c) => {
    const items = c.items.map(([k, n]) => itemEscalado(k, n, FUENTES_PROTEINA.has(k) ? fProt : fResto));
    return { nombre: c.nombre, hora: c.hora, emoji: c.emoji, items, kcal: items.reduce((s, i) => s + i.kcal, 0), prot: items.reduce((s, i) => s + i.prot, 0) };
  });
  return {
    tipo, titulo: base.titulo, objetivo: base.objetivo, comidas,
    kcal: comidas.reduce((s, c) => s + c.kcal, 0), prot: comidas.reduce((s, c) => s + c.prot, 0),
    meta, protMeta, factor,
  };
}

/** Texto del plan para enviarlo por WhatsApp. */
export function planTexto(p: PlanComidas, nombreAtleta: string, entrenador: string): string {
  const lineas = [
    `Hola ${nombreAtleta.split(' ')[0]} 👋 Este es tu plan de alimentación sugerido:`,
    '',
    `*${p.titulo}* — ${p.objetivo}`,
    `≈ ${Math.round(p.kcal / 10) * 10} kcal · ${Math.round(p.prot)} g de proteína al día`,
  ];
  p.comidas.forEach((c, i) => {
    lineas.push('', `${c.emoji} *${i + 1}. ${c.nombre} (${c.hora})*`);
    c.items.forEach((it) => lineas.push(`• ${it.texto}`));
  });
  lineas.push('', 'Bebe agua durante el día y avísame si algo no te cae bien o no te gusta para cambiarlo.', entrenador ? `— ${entrenador}` : '');
  return lineas.join('\n').trim();
}
