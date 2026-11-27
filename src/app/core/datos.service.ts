import { Injectable, computed, signal } from '@angular/core';
import { CATALOGO_BASE } from './catalogo';
import { normalizarRutina } from './dominio';
import { leerTodo } from './leer-todo';
import { Atleta, EjercicioCatalogo, EstadoAsistencia, Grupo, Medida, ObjetivoMeta, PagoAtleta, Rutina } from './modelos';
import { RespaldoNormalizado } from './respaldo';
import { supabase } from './supabase';
import { normalizar } from './util';

/** Otro dispositivo cambió este bloque antes de guardar: ya se cargó su versión. */
export class ConflictoVersion extends Error {
  constructor(readonly campo: 'rutina' | 'objetivos') {
    super(
      `${campo === 'rutina' ? 'La rutina de este atleta se cambió' : 'Los objetivos de este atleta se cambiaron'} desde otro dispositivo. ` +
        'Cargamos la versión más reciente: revísala y repite tu último cambio.',
    );
    this.name = 'ConflictoVersion';
  }
}

/* ---------- Mapeo fila (snake_case) ⇄ modelo (camelCase) ---------- */
const COLUMNAS_ATLETA: Record<string, string> = {
  grupoId: 'grupo_id', nombre: 'nombre', telefono: 'telefono', genero: 'genero',
  estaturaPies: 'estatura_pies', estaturaPulg: 'estatura_pulg', composicion: 'composicion',
  objetivo: 'objetivo', objetivoTexto: 'objetivo_texto', fechaNacimiento: 'fecha_nacimiento',
  edad: 'edad', condiciones: 'condiciones', horasSueno: 'horas_sueno', estiloVida: 'estilo_vida',
  activo: 'activo', frecuenciaMedicion: 'frecuencia_medicion', tarifa: 'tarifa',
  proximoPago: 'proximo_pago', bitacoraFoco: 'bitacora_foco', bitacoraMetas: 'bitacora_metas',
  rutina: 'rutina', asistencia: 'asistencia', objetivos: 'objetivos', fechaRegistro: 'fecha_registro',
  planComidas: 'plan_comidas',
};
const COLUMNAS_MEDIDA: Record<string, string> = {
  fecha: 'fecha', peso: 'peso', pecho: 'pecho', brazoRelajado: 'brazo_relajado',
  brazoContraido: 'brazo_contraido', antebrazo: 'antebrazo', abdomenAlto: 'abdomen_alto',
  abdomenOmbligo: 'abdomen_ombligo', cadera: 'cadera', pierna: 'pierna', pantorrilla: 'pantorrilla',
};
const FECHAS_NULABLES = new Set(['grupo_id', 'fecha_nacimiento', 'proximo_pago']);

function aFila(cambios: Record<string, unknown>, columnas: Record<string, string>) {
  const fila: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(cambios)) {
    const col = columnas[k];
    if (!col) continue;
    fila[col] = FECHAS_NULABLES.has(col) && v === '' ? null : v;
  }
  return fila;
}

function num(v: unknown): number | null {
  return v === null || v === undefined ? null : Number(v);
}

function medidaDeFila(f: any): Medida {
  const m: any = { id: f.id };
  for (const [k, col] of Object.entries(COLUMNAS_MEDIDA)) m[k] = k === 'fecha' ? f[col] : num(f[col]);
  return m as Medida;
}

function pagoDeFila(f: any): PagoAtleta {
  return { id: f.id, fecha: f.fecha, monto: Number(f.monto), metodo: f.metodo, concepto: f.concepto };
}

function atletaDeFila(f: any, medidas: Medida[], pagos: PagoAtleta[]): Atleta {
  return {
    id: f.id,
    grupoId: f.grupo_id ?? '',
    nombre: f.nombre,
    telefono: f.telefono,
    genero: f.genero,
    estaturaPies: f.estatura_pies,
    estaturaPulg: f.estatura_pulg,
    composicion: f.composicion,
    objetivo: f.objetivo,
    objetivoTexto: f.objetivo_texto,
    fechaNacimiento: f.fecha_nacimiento ?? '',
    edad: f.edad,
    condiciones: f.condiciones,
    horasSueno: f.horas_sueno,
    estiloVida: f.estilo_vida,
    activo: f.activo,
    frecuenciaMedicion: f.frecuencia_medicion,
    tarifa: Number(f.tarifa),
    proximoPago: f.proximo_pago ?? '',
    bitacoraFoco: f.bitacora_foco,
    bitacoraMetas: f.bitacora_metas,
    rutina: normalizarRutina(f.rutina),
    asistencia: f.asistencia ?? {},
    objetivos: f.objetivos ?? [],
    planComidas: f.plan_comidas ?? null,
    rutinaRev: f.rutina_rev ?? 0,
    objetivosRev: f.objetivos_rev ?? 0,
    fechaRegistro: f.fecha_registro,
    medidas,
    pagos,
  };
}

const porFecha = (a: { fecha: string }, b: { fecha: string }) => a.fecha.localeCompare(b.fecha);

/**
 * Almacén en memoria de los datos del entrenador logueado.
 * Se carga todo al entrar (el volumen por entrenador es pequeño) y cada
 * escritura va a Supabase primero; si falla, el estado local no cambia.
 */
@Injectable({ providedIn: 'root' })
export class DatosService {
  readonly atletas = signal<Atleta[]>([]);
  readonly grupos = signal<Grupo[]>([]);
  readonly ejerciciosExtra = signal<EjercicioCatalogo[]>([]);
  readonly cargado = signal(false);

  readonly catalogo = computed(() => CATALOGO_BASE.concat(this.ejerciciosExtra()));

  async cargar() {
    // Todas paginadas: Supabase corta en 1.000 filas sin avisar (ver leer-todo.ts).
    // El `id` como segundo orden hace la paginación estable.
    const [a, g, m, p, e] = await Promise.all([
      leerTodo<any>((d, h) => supabase.from('atletas').select('*').order('nombre').order('id').range(d, h)),
      leerTodo<any>((d, h) => supabase.from('grupos').select('id, nombre').order('nombre').order('id').range(d, h)),
      leerTodo<any>((d, h) => supabase.from('medidas').select('*').order('fecha').order('id').range(d, h)),
      leerTodo<any>((d, h) => supabase.from('pagos').select('*').order('fecha').order('id').range(d, h)),
      leerTodo<any>((d, h) => supabase.from('ejercicios_extra').select('*').order('nombre').order('id').range(d, h)),
    ]);

    const medidasPor = new Map<string, Medida[]>();
    m.forEach((f: any) => {
      const lista = medidasPor.get(f.atleta_id) ?? [];
      lista.push(medidaDeFila(f));
      medidasPor.set(f.atleta_id, lista);
    });
    const pagosPor = new Map<string, PagoAtleta[]>();
    p.forEach((f: any) => {
      const lista = pagosPor.get(f.atleta_id) ?? [];
      lista.push(pagoDeFila(f));
      pagosPor.set(f.atleta_id, lista);
    });

    this.atletas.set(a.map((f: any) => atletaDeFila(f, medidasPor.get(f.id) ?? [], pagosPor.get(f.id) ?? [])));
    this.grupos.set(g as Grupo[]);
    this.ejerciciosExtra.set(
      e.map((f: any) => ({ id: f.id, nombre: f.nombre, grupo: f.grupo, familia: f.familia, musculos: f.musculos })),
    );
    this.cargado.set(true);
  }

  limpiar() {
    this.atletas.set([]);
    this.grupos.set([]);
    this.ejerciciosExtra.set([]);
    this.cargado.set(false);
  }

  atleta(id: string): Atleta | undefined {
    return this.atletas().find((a) => a.id === id);
  }

  nombreGrupo(id: string): string {
    return this.grupos().find((g) => g.id === id)?.nombre ?? '';
  }

  private reemplazar(id: string, fn: (a: Atleta) => Atleta) {
    this.atletas.update((lista) => lista.map((a) => (a.id === id ? fn(a) : a)));
  }

  /* ---------- Atletas ---------- */
  async crearAtleta(datos: Partial<Atleta>): Promise<Atleta> {
    const { data, error } = await supabase.from('atletas').insert(aFila(datos, COLUMNAS_ATLETA)).select().single();
    if (error) throw error;
    const nuevo = atletaDeFila(data, [], []);
    this.atletas.update((l) => [...l, nuevo].sort((x, y) => x.nombre.localeCompare(y.nombre)));
    return nuevo;
  }

  /**
   * Campos sueltos del atleta (perfil, bitácora, tarifa…). Rutina, objetivos y
   * asistencia NO van por aquí: son bloques jsonb y tienen su propio guardado
   * seguro ante dos dispositivos (guardarRutina, guardarObjetivos, marcarAsistencia).
   */
  async actualizarAtleta(id: string, cambios: Partial<Atleta>) {
    if ('rutina' in cambios || 'objetivos' in cambios || 'asistencia' in cambios) {
      throw new Error('actualizarAtleta: usa guardarRutina, guardarObjetivos o marcarAsistencia');
    }
    const { error } = await supabase.from('atletas').update(aFila(cambios, COLUMNAS_ATLETA)).eq('id', id);
    if (error) throw error;
    this.reemplazar(id, (a) => ({ ...a, ...cambios }));
  }

  /** Guarda la rutina solo si nadie la cambió desde otro dispositivo; si la cambiaron, recarga y avisa. */
  guardarRutina(id: string, rutina: Rutina) {
    return this.guardarVersionado(id, 'rutina', rutina);
  }

  /** Igual que guardarRutina, para los objetivos. */
  guardarObjetivos(id: string, objetivos: ObjetivoMeta[]) {
    return this.guardarVersionado(id, 'objetivos', objetivos);
  }

  private async guardarVersionado(id: string, campo: 'rutina' | 'objetivos', valor: Rutina | ObjetivoMeta[]) {
    const actual = this.atleta(id);
    const revCol = campo === 'rutina' ? 'rutina_rev' : 'objetivos_rev';
    const revKey = campo === 'rutina' ? 'rutinaRev' : 'objetivosRev';
    const { data, error } = await supabase
      .from('atletas')
      .update({ [campo]: valor })
      .eq('id', id)
      .eq(revCol, actual?.[revKey] ?? 0)
      .select(revCol);
    if (error) throw error;
    if (!data?.length) {
      // Otro dispositivo guardó antes: traemos su versión en vez de pisarla.
      await this.recargarCampo(id, campo);
      throw new ConflictoVersion(campo);
    }
    const rev = (data[0] as Record<string, number>)[revCol];
    this.reemplazar(id, (a) => ({ ...a, [campo]: valor, [revKey]: rev }));
  }

  private async recargarCampo(id: string, campo: 'rutina' | 'objetivos') {
    const revCol = campo === 'rutina' ? 'rutina_rev' : 'objetivos_rev';
    const { data, error } = await supabase.from('atletas').select(`${campo}, ${revCol}`).eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) {
      this.atletas.update((l) => l.filter((a) => a.id !== id));
      throw new Error('Este atleta ya no existe: se eliminó desde otro dispositivo.');
    }
    const f = data as Record<string, any>;
    this.reemplazar(id, (a) =>
      campo === 'rutina'
        ? { ...a, rutina: normalizarRutina(f['rutina']), rutinaRev: f['rutina_rev'] }
        : { ...a, objetivos: f['objetivos'] ?? [], objetivosRev: f['objetivos_rev'] },
    );
  }

  /**
   * Marca (E/F) o borra (null) un día de asistencia. Se fusiona en el servidor,
   * así que marcar desde dos dispositivos a la vez no se pisa; la respuesta trae
   * la asistencia completa, incluidas las marcas del otro dispositivo.
   */
  async marcarAsistencia(id: string, fecha: string, estado: EstadoAsistencia | null) {
    const { data, error } = await supabase.rpc('marcar_asistencia', { p_atleta: id, p_fecha: fecha, p_estado: estado });
    if (error) throw error;
    this.reemplazar(id, (a) => ({ ...a, asistencia: (data as Record<string, EstadoAsistencia>) ?? {} }));
  }

  async eliminarAtleta(id: string) {
    const { error } = await supabase.from('atletas').delete().eq('id', id);
    if (error) throw error;
    this.atletas.update((l) => l.filter((a) => a.id !== id));
  }

  /* ---------- Medidas ---------- */
  async agregarMedida(atletaId: string, m: Omit<Medida, 'id'>) {
    const fila = { atleta_id: atletaId, ...aFila(m as Record<string, unknown>, COLUMNAS_MEDIDA) };
    const { data, error } = await supabase.from('medidas').insert(fila).select().single();
    if (error) throw error;
    const nueva = medidaDeFila(data);
    this.reemplazar(atletaId, (a) => ({ ...a, medidas: [...a.medidas, nueva].sort(porFecha) }));
  }

  async eliminarMedida(atletaId: string, medidaId: string) {
    const { error } = await supabase.from('medidas').delete().eq('id', medidaId);
    if (error) throw error;
    this.reemplazar(atletaId, (a) => ({ ...a, medidas: a.medidas.filter((m) => m.id !== medidaId) }));
  }

  /* ---------- Pagos de atletas ---------- */
  async registrarPago(atletaId: string, p: Omit<PagoAtleta, 'id'>, nuevoProximoPago?: string) {
    const { data, error } = await supabase.from('pagos').insert({ atleta_id: atletaId, ...p }).select().single();
    if (error) throw error;
    const pago = pagoDeFila(data);
    this.reemplazar(atletaId, (a) => ({ ...a, pagos: [...a.pagos, pago].sort(porFecha) }));
    if (nuevoProximoPago) await this.actualizarAtleta(atletaId, { proximoPago: nuevoProximoPago });
  }

  async eliminarPago(atletaId: string, pagoId: string) {
    const { error } = await supabase.from('pagos').delete().eq('id', pagoId);
    if (error) throw error;
    this.reemplazar(atletaId, (a) => ({ ...a, pagos: a.pagos.filter((p) => p.id !== pagoId) }));
  }

  /* ---------- Grupos ---------- */
  async crearGrupo(nombre: string): Promise<Grupo> {
    const existente = this.grupos().find((g) => normalizar(g.nombre) === normalizar(nombre));
    if (existente) return existente;
    const { data, error } = await supabase.from('grupos').insert({ nombre }).select('id, nombre').single();
    if (error) throw error;
    this.grupos.update((l) => [...l, data as Grupo].sort((x, y) => x.nombre.localeCompare(y.nombre)));
    return data as Grupo;
  }

  async renombrarGrupo(id: string, nombre: string) {
    const { error } = await supabase.from('grupos').update({ nombre }).eq('id', id);
    if (error) throw error;
    this.grupos.update((l) => l.map((g) => (g.id === id ? { ...g, nombre } : g)));
  }

  async eliminarGrupo(id: string) {
    const { error } = await supabase.from('grupos').delete().eq('id', id);
    if (error) throw error;
    this.grupos.update((l) => l.filter((g) => g.id !== id));
    this.atletas.update((l) => l.map((a) => (a.grupoId === id ? { ...a, grupoId: '' } : a)));
  }

  /* ---------- Catálogo personalizado ---------- */
  async crearEjercicio(nombre: string, grupo: string) {
    const { data, error } = await supabase
      .from('ejercicios_extra')
      .insert({ nombre, grupo, familia: 'Personalizado', musculos: [normalizar(grupo)] })
      .select()
      .single();
    if (error) throw error;
    this.ejerciciosExtra.update((l) => [...l, { id: data.id, nombre, grupo, familia: 'Personalizado', musculos: data.musculos }]);
  }

  /** Importa un respaldo de la plantilla vieja en una sola transacción y recarga los datos. */
  async importarRespaldo(r: Pick<RespaldoNormalizado, 'grupos' | 'atletas' | 'ejercicios'>) {
    const { data, error } = await supabase.rpc('importar_respaldo', {
      p_grupos: r.grupos,
      p_atletas: r.atletas,
      p_ejercicios: r.ejercicios,
    });
    if (error) throw error;
    await this.cargar();
    return data as { atletas: number; medidas: number; pagos: number; grupos: number; ejercicios: number };
  }

  buscarEjercicios(consulta: string): EjercicioCatalogo[] {
    const q = normalizar(consulta.trim());
    if (!q) return [];
    return this.catalogo().filter(
      (ej) =>
        normalizar(ej.nombre).includes(q) ||
        normalizar(ej.grupo).includes(q) ||
        normalizar(ej.familia).includes(q) ||
        (ej.musculos || []).some((m) => normalizar(m).includes(q)),
    );
  }
}
