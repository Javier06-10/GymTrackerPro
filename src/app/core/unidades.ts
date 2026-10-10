import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';

/* ============================================================
   UNIDADES DE MEDIDA
   En la base todo se guarda en libras (peso) y pulgadas (medidas
   y estatura). Cada entrenador elige cómo verlas y capturarlas:
   imperial (lb / in / pies) o métrico (kg / cm).
   ============================================================ */
export type Sistema = 'imperial' | 'metrico';

const KG_POR_LB = 0.45359237;
const CM_POR_IN = 2.54;

/** Redondeo a un decimal (sin "-0"). */
export function r1(n: number): number {
  const v = Math.round(n * 10) / 10;
  return v === 0 ? 0 : v;
}

export function uPeso(s: Sistema) {
  return s === 'metrico' ? 'kg' : 'lb';
}
export function uLargo(s: Sistema) {
  return s === 'metrico' ? 'cm' : 'in';
}

/** Libras guardadas → número a mostrar (1 decimal). */
export function pesoVer(lb: unknown, s: Sistema): number | null {
  if (lb === null || lb === undefined || lb === '' || isNaN(Number(lb))) return null;
  return r1(s === 'metrico' ? Number(lb) * KG_POR_LB : Number(lb));
}
/** Pulgadas guardadas → número a mostrar (1 decimal). */
export function largoVer(pulg: unknown, s: Sistema): number | null {
  if (pulg === null || pulg === undefined || pulg === '' || isNaN(Number(pulg))) return null;
  return r1(s === 'metrico' ? Number(pulg) * CM_POR_IN : Number(pulg));
}

/** Lo que escribió el entrenador → libras para guardar (3 decimales, ida y vuelta exacta a 0.1). */
export function pesoGuardar(valor: unknown, s: Sistema): number | null {
  if (valor === null || valor === undefined || valor === '' || isNaN(Number(valor))) return null;
  const n = Number(valor);
  return Number((s === 'metrico' ? n / KG_POR_LB : n).toFixed(3));
}
/** Lo que escribió el entrenador → pulgadas para guardar. */
export function largoGuardar(valor: unknown, s: Sistema): number | null {
  if (valor === null || valor === undefined || valor === '' || isNaN(Number(valor))) return null;
  const n = Number(valor);
  return Number((s === 'metrico' ? n / CM_POR_IN : n).toFixed(3));
}

export function pesoTxt(lb: unknown, s: Sistema): string {
  const v = pesoVer(lb, s);
  return v === null ? '—' : `${v} ${uPeso(s)}`;
}
export function largoTxt(pulg: unknown, s: Sistema): string {
  const v = largoVer(pulg, s);
  return v === null ? '—' : `${v} ${uLargo(s)}`;
}

/* ---------- Estatura (pies + pulgadas en la base) ---------- */
export function estaturaCm(pies: number, pulg: number): number {
  return Math.round((Number(pies) * 12 + Number(pulg)) * CM_POR_IN);
}
export function estaturaDesdeCm(cm: number): { pies: number; pulg: number } {
  const total = Number(cm) / CM_POR_IN;
  const pies = Math.floor(total / 12);
  return { pies, pulg: Number((total - pies * 12).toFixed(2)) };
}
export function estaturaTxt(pies: number, pulg: number, s: Sistema): string {
  if (s === 'metrico') return `${estaturaCm(pies, pulg)} cm`;
  return `${pies}'${Math.round(Number(pulg))}"`;
}

/** Preferencia del entrenador conectado, para plantillas y servicios. */
@Injectable({ providedIn: 'root' })
export class UnidadesService {
  private readonly auth = inject(AuthService);

  readonly sistema = computed<Sistema>(() => (this.auth.perfil()?.unidades === 'metrico' ? 'metrico' : 'imperial'));
  readonly metrico = computed(() => this.sistema() === 'metrico');
  readonly uPeso = computed(() => uPeso(this.sistema()));
  readonly uLargo = computed(() => uLargo(this.sistema()));

  peso(lb: unknown) { return pesoVer(lb, this.sistema()); }
  largo(pulg: unknown) { return largoVer(pulg, this.sistema()); }
  pesoTxt(lb: unknown) { return pesoTxt(lb, this.sistema()); }
  largoTxt(pulg: unknown) { return largoTxt(pulg, this.sistema()); }
  aLb(valor: unknown) { return pesoGuardar(valor, this.sistema()); }
  aPulg(valor: unknown) { return largoGuardar(valor, this.sistema()); }
  estatura(pies: number, pulg: number) { return estaturaTxt(pies, pulg, this.sistema()); }
  /** Medida guardada (peso o zona) → número a mostrar. */
  valor(clave: string, v: unknown) { return clave === 'peso' ? this.peso(v) : this.largo(v); }
  /** Diferencia entre dos medidas guardadas, restando los valores ya mostrados (cuadra con las tablas). */
  dif(clave: string, actual: unknown, anterior: unknown): number | null {
    const a = this.valor(clave, actual), b = this.valor(clave, anterior);
    return a === null || b === null ? null : r1(a - b);
  }
  /** Diferencia con signo y unidad: "+1.2 kg", "-3 cm". */
  difTxt(clave: string, actual: unknown, anterior: unknown): string {
    const d = this.dif(clave, actual, anterior);
    return d === null ? '—' : `${d > 0 ? '+' : ''}${d} ${this.unidad(clave)}`;
  }
  unidad(clave: string) { return clave === 'peso' ? this.uPeso() : this.uLargo(); }
}
