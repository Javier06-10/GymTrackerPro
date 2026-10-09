/* ============================================================
   IMPORTAR RESPALDO DE LA PLANTILLA VIEJA (gymtracker_pro_5.html)
   Lee el JSON que descargaba "💾 Respaldo", lo valida y lo convierte
   al formato que espera la RPC importar_respaldo. Todo lo que viene
   del archivo se trata como dato no confiable.
   ============================================================ */
import { DIAS, ZONAS, derivarObjetivo, normalizarRutina } from './dominio';
import { edadDesde } from './util';

export interface RespaldoNormalizado {
  fecha: string;
  grupos: { idViejo: string; nombre: string }[];
  atletas: AtletaImportado[];
  ejercicios: { nombre: string; grupo: string; familia: string; musculos: string[] }[];
  logo: string | null;
}

export interface AtletaImportado {
  grupoViejo: string;
  nombre: string;
  activo: boolean;
  medidas: Record<string, unknown>[];
  pagos: { fecha: string; monto: number; metodo: string; concepto: string }[];
  [campo: string]: unknown;
}

const GENEROS = ['hombre', 'mujer'];
const COMPOSICIONES = ['delgado', 'grasa', 'musculo'];
const OBJETIVOS = ['perder', 'ganar', 'recomp', 'mantener'];

function texto(v: unknown, max = 500): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : typeof v === 'number' ? String(v) : '';
}
function fecha(v: unknown): string {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return '';
  return isNaN(new Date(v + 'T00:00:00').getTime()) ? '' : v;
}
function numero(v: unknown, min: number, max: number): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return isFinite(n) && n >= min && n <= max ? Math.round(n * 10) / 10 : null;
}
function entero(v: unknown, min: number, max: number, porDefecto: number): number {
  const n = Math.round(Number(v));
  return isFinite(n) && n >= min && n <= max ? n : porDefecto;
}
function uno<T extends string>(v: unknown, opciones: T[] | string[], porDefecto: T): T {
  return (opciones as string[]).includes(v as string) ? (v as T) : porDefecto;
}

function medida(m: any): Record<string, unknown> | null {
  if (!m || typeof m !== 'object') return null;
  // Migraciones de datos muy viejos de la plantilla
  if (m.brazo != null && m.brazoRelajado == null) m.brazoRelajado = m.brazo;
  if (m.cintura != null && m.abdomenOmbligo == null) m.abdomenOmbligo = m.cintura;
  const f = fecha(m.fecha);
  const peso = numero(m.peso, 30, 1000);
  if (!f || peso === null) return null; // sin fecha o sin peso no se puede guardar
  const out: Record<string, unknown> = { fecha: f, peso };
  ZONAS.forEach(([z]) => (out[z] = numero(m[z], 1, 120)));
  return out;
}

function objetivos(lista: unknown): unknown[] {
  if (!Array.isArray(lista)) return [];
  return lista
    .filter((o) => o && typeof o === 'object' && ['peso', 'zona', 'manual'].includes(o.tipo))
    .slice(0, 50)
    .map((o: any, i) => ({
      id: texto(o.id, 40) || 'imp_' + i,
      titulo: texto(o.titulo, 120) || 'Objetivo',
      tipo: o.tipo,
      ...(o.tipo === 'zona' && ZONAS.some(([z]) => z === o.zona) ? { zona: o.zona } : {}),
      ...(o.tipo === 'manual' ? { unidad: texto(o.unidad, 30), valorActual: numero(o.valorActual, -1e6, 1e6) } : {}),
      valorInicial: numero(o.valorInicial, -1e6, 1e6) ?? 0,
      valorObjetivo: numero(o.valorObjetivo, -1e6, 1e6) ?? 0,
      fecha: fecha(o.fecha),
    }));
}

function asistencia(v: unknown): Record<string, 'E' | 'F'> {
  const out: Record<string, 'E' | 'F'> = {};
  if (v && typeof v === 'object') {
    for (const [k, e] of Object.entries(v as Record<string, unknown>)) {
      if (fecha(k) && (e === 'E' || e === 'F')) out[k] = e;
    }
  }
  return out;
}

/** Valida y convierte el respaldo. Lanza Error con mensaje para el usuario si no es válido. */
export function leerRespaldo(textoArchivo: string): RespaldoNormalizado {
  let paquete: any;
  try {
    paquete = JSON.parse(textoArchivo);
  } catch {
    throw new Error('El archivo no es un respaldo válido (JSON dañado).');
  }
  const db = paquete?.datos;
  if (!paquete || paquete.app !== 'GymTracker Pro' || !db || !Array.isArray(db.clientes)) {
    throw new Error('El archivo no es un respaldo de GymTracker Pro.');
  }

  const grupos = (Array.isArray(db.grupos) ? db.grupos : [])
    .map((g: any) => ({ idViejo: texto(g?.id, 60), nombre: texto(g?.nombre, 60) }))
    .filter((g: { idViejo: string; nombre: string }) => g.idViejo && g.nombre);
  const idsGrupo = new Set(grupos.map((g: { idViejo: string }) => g.idViejo));

  const atletas: AtletaImportado[] = db.clientes
    .filter((c: any) => c && typeof c === 'object' && texto(c.nombre))
    .map((c: any): AtletaImportado => {
      const composicion = uno(c.composicion, COMPOSICIONES, 'musculo');
      const nacimiento = fecha(c.fechaNacimiento);
      const edad = (nacimiento ? edadDesde(nacimiento) : null) ?? (numero(c.edad, 5, 110) !== null ? Math.round(Number(c.edad)) : null);
      const rutina = normalizarRutina(c.rutina);
      // Asegura tipos de texto dentro de la rutina
      DIAS.forEach((d) => {
        rutina[d].titulo = texto(rutina[d].titulo, 80);
        rutina[d].ejercicios = rutina[d].ejercicios.slice(0, 40).map((ej) => ({
          nombre: texto(ej.nombre, 120),
          series: texto(ej.series, 60),
          peso: texto(ej.peso, 40),
          descanso: texto(ej.descanso, 40),
          notas: texto(ej.notas, 300),
          historialPeso: (Array.isArray(ej.historialPeso) ? ej.historialPeso : [])
            .filter((h: any) => fecha(h?.fecha))
            .slice(-200)
            .map((h: any) => ({ fecha: h.fecha, peso: texto(h.peso, 40) })),
        }));
      });
      const pagos = c.pagos && typeof c.pagos === 'object' ? c.pagos : {};
      return {
        grupoViejo: idsGrupo.has(c.grupoId) ? c.grupoId : '',
        nombre: texto(c.nombre, 120),
        telefono: texto(c.telefono, 30),
        genero: uno(c.genero, GENEROS, 'hombre'),
        estaturaPies: entero(c.estaturaPies, 3, 8, 5),
        estaturaPulg: entero(c.estaturaPulg, 0, 11, 8),
        composicion,
        objetivo: uno(c.objetivo, OBJETIVOS, derivarObjetivo(composicion)),
        objetivoTexto: texto(c.objetivoTexto, 200),
        fechaNacimiento: nacimiento,
        edad,
        condiciones: texto(c.condiciones, 1000),
        horasSueno: uno(c.horasSueno, ['menos5', '5a6', '7a8', 'mas8'], '' as string),
        estiloVida: uno(c.estiloVida, ['sedentario', 'ligero', 'activo', 'muyactivo'], '' as string),
        activo: c.activo !== false,
        frecuenciaMedicion: entero(c.frecuenciaMedicion, 5, 120, 30),
        tarifa: numero(pagos.tarifa, 0, 1e7) ?? 0,
        proximoPago: fecha(pagos.proximoPago),
        bitacoraFoco: texto(c.bitacora?.foco, 4000),
        bitacoraMetas: texto(c.bitacora?.metas, 4000),
        rutina,
        asistencia: asistencia(c.asistencia),
        objetivos: objetivos(c.objetivos),
        fechaRegistro: fecha(c.fechaRegistro),
        medidas: (Array.isArray(c.medidas) ? c.medidas : []).map(medida).filter(Boolean) as Record<string, unknown>[],
        pagos: (Array.isArray(pagos.transacciones) ? pagos.transacciones : [])
          .map((t: any) => ({
            fecha: fecha(t?.fecha),
            monto: numero(t?.monto, 0.01, 1e7) ?? 0,
            metodo: texto(t?.metodo, 40) || 'Efectivo',
            concepto: texto(t?.concepto, 60) || 'Mensualidad',
          }))
          .filter((t: { fecha: string; monto: number }) => t.fecha && t.monto > 0),
      };
    });

  const ejercicios = (Array.isArray(db.catalogoExtra) ? db.catalogoExtra : [])
    .map((e: any) => ({
      nombre: texto(e?.nombre, 120),
      grupo: texto(e?.grupo, 40) || 'Otro',
      familia: texto(e?.familia, 60) || 'Personalizado',
      musculos: (Array.isArray(e?.musculos) ? e.musculos : []).map((m: unknown) => texto(m, 40)).filter(Boolean).slice(0, 10),
    }))
    .filter((e: { nombre: string }) => e.nombre);

  const logo = typeof db.logo?.dataUrl === 'string' && db.logo.dataUrl.startsWith('data:image/jpeg;base64,') && db.logo.dataUrl.length < 500_000
    ? db.logo.dataUrl
    : null;

  return { fecha: fecha(paquete.fecha) || fecha(db.ultimoRespaldo), grupos, atletas, ejercicios, logo };
}
