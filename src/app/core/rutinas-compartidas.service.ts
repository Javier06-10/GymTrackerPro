import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { DatosService } from './datos.service';
import { DIAS } from './dominio';
import { DiaRutina, Rutina } from './modelos';
import { supabase } from './supabase';
import { hoyISO } from './util';

/** Rutina que un entrenador le envió a otro. */
export interface RutinaCompartida {
  id: string;
  de_trainer_id: string;
  para_trainer_id: string;
  de_nombre: string;
  de_negocio: string;
  para_email: string;
  para_nombre: string;
  nombre: string;
  nota: string;
  rutina: Partial<Rutina>;
  estado: 'pendiente' | 'aplicada' | 'descartada';
  created_at: string;
}

/** Copia de los días elegidos, limpia: sin historial de cargas y con o sin pesos de trabajo. */
export function prepararDias(origen: Rutina, dias: string[], conPesos: boolean): Partial<Rutina> {
  const out: Partial<Rutina> = {};
  dias.forEach((d) => {
    const r = origen[d];
    if (!r) return;
    out[d] = {
      titulo: r.titulo,
      ejercicios: r.ejercicios.map((ej) => ({
        nombre: ej.nombre,
        series: ej.series,
        peso: conPesos ? ej.peso : '',
        descanso: ej.descanso,
        notas: ej.notas,
        historialPeso: conPesos && ej.peso ? [{ fecha: hoyISO(), peso: ej.peso }] : [],
      })),
    };
  });
  return out;
}

/** Días de una rutina compartida que traen ejercicios, en orden de la semana. */
export function diasConContenido(r: Partial<Rutina>): string[] {
  return DIAS.filter((d) => (r[d] as DiaRutina | undefined)?.ejercicios?.length);
}

/** Compartir rutinas entre entrenadores (bandeja "Rutinas recibidas"). */
@Injectable({ providedIn: 'root' })
export class RutinasCompartidasService {
  private readonly auth = inject(AuthService);
  private readonly datos = inject(DatosService);

  readonly todas = signal<RutinaCompartida[]>([]);
  readonly recibidas = computed(() => {
    const yo = this.auth.perfil()?.id;
    return this.todas().filter((r) => r.para_trainer_id === yo && r.estado === 'pendiente');
  });

  async cargar() {
    const { data, error } = await supabase.from('rutinas_compartidas').select('*').order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    this.todas.set((data as RutinaCompartida[]) ?? []);
  }

  /** Envía la rutina al entrenador con ese correo; devuelve su nombre. */
  async enviar(email: string, nombre: string, nota: string, rutina: Partial<Rutina>): Promise<string> {
    const { data, error } = await supabase.rpc('enviar_rutina', { p_email: email.trim(), p_nombre: nombre.trim(), p_nota: nota.trim(), p_rutina: rutina });
    if (error) throw error;
    await this.cargar().catch(() => undefined);
    return data as string;
  }

  /** Copia los días de la rutina recibida a cada atleta elegido (sobrescribe esos días). */
  async aplicar(rc: RutinaCompartida, atletas: string[]) {
    const dias = diasConContenido(rc.rutina);
    for (const id of atletas) {
      const a = this.datos.atleta(id);
      if (!a) continue;
      const rutina = structuredClone(a.rutina);
      dias.forEach((d) => (rutina[d] = structuredClone(rc.rutina[d] as DiaRutina)));
      await this.datos.actualizarAtleta(id, { rutina });
    }
    await this.cambiarEstado(rc.id, 'aplicada');
  }

  async descartar(rc: RutinaCompartida) {
    await this.cambiarEstado(rc.id, 'descartada');
  }

  private async cambiarEstado(id: string, estado: RutinaCompartida['estado']) {
    const { error } = await supabase.from('rutinas_compartidas').update({ estado, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    this.todas.update((l) => l.map((r) => (r.id === id ? { ...r, estado } : r)));
  }
}
