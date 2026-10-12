// Modelo del front en camelCase (misma forma que la plantilla original).
// La conversión desde/hacia las columnas snake_case de Supabase vive en datos.service.ts.

export type Genero = 'hombre' | 'mujer';
export type Composicion = 'delgado' | 'grasa' | 'musculo';
export type Objetivo = 'perder' | 'ganar' | 'recomp' | 'mantener';
export type EstadoAsistencia = 'E' | 'F';

export interface RegistroPeso {
  fecha: string;
  peso: string;
}

export interface EjercicioRutina {
  nombre: string;
  series: string;
  peso: string;
  descanso: string;
  notas: string;
  historialPeso: RegistroPeso[];
}

export interface DiaRutina {
  titulo: string;
  ejercicios: EjercicioRutina[];
}

export type Rutina = Record<string, DiaRutina>;

export interface ObjetivoMeta {
  id: string;
  titulo: string;
  tipo: 'peso' | 'zona' | 'manual';
  zona?: string;
  unidad?: string;
  valorInicial: number;
  valorObjetivo: number;
  valorActual?: number | null;
  fecha: string;
}

export interface Medida {
  id: string;
  fecha: string;
  peso: number;
  pecho: number | null;
  brazoRelajado: number | null;
  brazoContraido: number | null;
  antebrazo: number | null;
  abdomenAlto: number | null;
  abdomenOmbligo: number | null;
  cadera: number | null;
  pierna: number | null;
  pantorrilla: number | null;
  [zona: string]: string | number | null;
}

export interface PagoAtleta {
  id: string;
  fecha: string;
  monto: number;
  metodo: string;
  concepto: string;
}

export interface Atleta {
  id: string;
  grupoId: string;
  nombre: string;
  telefono: string;
  genero: Genero;
  estaturaPies: number;
  estaturaPulg: number;
  composicion: Composicion;
  objetivo: Objetivo;
  objetivoTexto: string;
  fechaNacimiento: string;
  edad: number | null;
  condiciones: string;
  horasSueno: string;
  estiloVida: string;
  activo: boolean;
  frecuenciaMedicion: number;
  tarifa: number;
  proximoPago: string;
  bitacoraFoco: string;
  bitacoraMetas: string;
  rutina: Rutina;
  asistencia: Record<string, EstadoAsistencia>;
  objetivos: ObjetivoMeta[];
  fechaRegistro: string;
  // Relaciones cargadas aparte y ordenadas por fecha ascendente
  medidas: Medida[];
  pagos: PagoAtleta[];
}

export interface Grupo {
  id: string;
  nombre: string;
}

export interface EjercicioCatalogo {
  id: string;
  nombre: string;
  grupo: string;
  familia: string;
  musculos: string[];
}

export interface Plan {
  id: number;
  codigo: string;
  nombre: string;
  precio_mensual: number;
  max_atletas: number | null;
}

export interface Perfil {
  id: string;
  nombre: string;
  negocio: string;
  telefono: string;
  email: string;
  logo_url: string | null;
  rol: 'entrenador' | 'admin';
  /** Cómo ve y captura pesos y medidas (en la base siempre son lb e in). */
  unidades: 'imperial' | 'metrico';
  /** Tema visual elegido (ver core/tema.service.ts). */
  tema: 'marca' | 'marca-oscuro' | 'energia' | 'fuerza' | 'bienestar' | 'tech';
}

export interface Suscripcion {
  trainer_id: string;
  plan_id: number;
  estado: 'prueba' | 'activa' | 'vencida' | 'cancelada';
  vence_el: string;
  planes?: Plan;
}
