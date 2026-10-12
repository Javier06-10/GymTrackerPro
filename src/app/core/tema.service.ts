import { Injectable, effect, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';

export type Tema = 'marca' | 'marca-oscuro' | 'energia' | 'fuerza' | 'bienestar' | 'tech';

export interface OpcionTema {
  v: Tema;
  t: string;
  s: string;
  /** Muestras para la tarjeta del selector: fondo, superficie, acento, secundario. */
  muestras: [string, string, string, string];
  /** Color de la barra del teléfono (encabezado). */
  barra: string;
}

export const TEMAS: OpcionTema[] = [
  { v: 'marca', t: 'Marca GymTracker', s: 'Claro con azul marino y naranja', muestras: ['#f3f5fb', '#2a3582', '#eb670e', '#ffffff'], barra: '#2a3582' },
  { v: 'marca-oscuro', t: 'Marca oscuro', s: 'Todo en azul marino y naranja', muestras: ['#0b0f2e', '#2a3582', '#eb670e', '#ffffff'], barra: '#2a3582' },
  { v: 'energia', t: 'High Energy', s: 'Lima neón sobre negro · estilo Nike', muestras: ['#121212', '#1e1e1e', '#ccff00', '#ff5500'], barra: '#262626' },
  { v: 'fuerza', t: 'Fuerza y rendimiento', s: 'Claro, naranja atlético · estilo Strava', muestras: ['#f8fafc', '#1e3a8a', '#fc5200', '#e2e8f0'], barra: '#1e3a8a' },
  { v: 'bienestar', t: 'Bienestar', s: 'Salvia y terracota · estilo Calm', muestras: ['#fdfbf7', '#4e7c67', '#d97757', '#f3efea'], barra: '#4e7c67' },
  { v: 'tech', t: 'Tech minimalista', s: 'Cian y menta sobre negro · estilo Whoop', muestras: ['#0a0a0c', '#141418', '#00f0ff', '#00e5a3'], barra: '#16161c' },
];

const CLAVE = 'gt-tema';

/** Aplica el tema en <html data-tema> y lo recuerda (perfil + este dispositivo). */
@Injectable({ providedIn: 'root' })
export class TemaService {
  private readonly auth = inject(AuthService);
  readonly tema = signal<Tema>(TemaService.guardado());

  constructor() {
    // El perfil manda: al iniciar sesión en otro equipo se trae su tema
    effect(() => {
      const t = this.auth.perfil()?.tema;
      if (t && t !== this.tema()) this.tema.set(t);
    });
    effect(() => this.aplicar(this.tema()));
  }

  private static guardado(): Tema {
    try {
      const t = localStorage.getItem(CLAVE) as Tema | null;
      return t && TEMAS.some((x) => x.v === t) ? t : 'marca';
    } catch {
      return 'marca';
    }
  }

  private aplicar(t: Tema) {
    document.documentElement.dataset['tema'] = t;
    const barra = TEMAS.find((x) => x.v === t)?.barra;
    if (barra) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', barra);
    try {
      localStorage.setItem(CLAVE, t);
    } catch {
      /* sin almacenamiento: vale para esta sesión */
    }
  }

  /** Cambia el tema al instante y lo guarda en el perfil. */
  async elegir(t: Tema) {
    const anterior = this.tema();
    this.tema.set(t);
    if (!this.auth.perfil()) return;
    try {
      await this.auth.actualizarPerfil({ tema: t });
    } catch (e) {
      this.tema.set(anterior);
      throw e;
    }
  }
}
