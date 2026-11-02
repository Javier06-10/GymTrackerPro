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
  { v: 'marca', t: 'Marca Coach Fénix', s: 'Claro · azul pizarra y naranja durazno', muestras: ['#f4f5f7', '#2f3858', '#e2834e', '#ffffff'], barra: '#2f3858' },
  { v: 'marca-oscuro', t: 'Marca oscuro', s: 'Azul medianoche y naranja durazno', muestras: ['#14172a', '#20263f', '#e8935f', '#93a1d4'], barra: '#20263f' },
  { v: 'energia', t: 'Grafito y lima', s: 'Oscuro sobrio con lima suave', muestras: ['#151617', '#202124', '#c3dc72', '#df9068'], barra: '#202124' },
  { v: 'fuerza', t: 'Pizarra y coral', s: 'Claro, gris pizarra con coral', muestras: ['#f6f7f9', '#36424f', '#e2765a', '#ffffff'], barra: '#36424f' },
  { v: 'bienestar', t: 'Salvia y arena', s: 'Claro cálido, verde salvia', muestras: ['#f7f5f1', '#41594e', '#7ba591', '#ffffff'], barra: '#41594e' },
  { v: 'tech', t: 'Medianoche y menta', s: 'Oscuro con turquesa suave', muestras: ['#101216', '#181b21', '#66c2bd', '#8fb0d6'], barra: '#181b21' },
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
