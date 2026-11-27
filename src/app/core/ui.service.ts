import { Injectable, signal } from '@angular/core';
import { mensajeError } from './supabase';

export interface Confirmacion {
  titulo: string;
  mensaje: string;
  textoBoton: string;
  resolver: (ok: boolean) => void;
}

/** Toast y diálogo de confirmación globales (equivalen a toast()/confirmar() de la plantilla). */
@Injectable({ providedIn: 'root' })
export class UiService {
  readonly toastMsg = signal<{ texto: string; tipo: 'ok' | 'err' } | null>(null);
  readonly confirmacion = signal<Confirmacion | null>(null);
  /** Formulario de atleta abierto: { id: null } = nuevo, { id } = editar. */
  readonly formAtleta = signal<{ id: string | null } | null>(null);
  private timer: ReturnType<typeof setTimeout> | undefined;

  toast(texto: string, tipo: 'ok' | 'err' = 'ok') {
    this.toastMsg.set({ texto, tipo });
    clearTimeout(this.timer);
    // Los errores se leen con más calma: algunos explican qué hacer
    this.timer = setTimeout(() => this.toastMsg.set(null), tipo === 'err' ? 6000 : 2600);
  }

  error(e: unknown) {
    this.toast(mensajeError(e), 'err');
  }

  confirmar(titulo: string, mensaje: string, textoBoton = 'Sí, continuar'): Promise<boolean> {
    return new Promise((resolver) => this.confirmacion.set({ titulo, mensaje, textoBoton, resolver }));
  }

  responder(ok: boolean) {
    this.confirmacion()?.resolver(ok);
    this.confirmacion.set(null);
  }
}
