import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatosService } from '../../../core/datos.service';
import { ZONAS, avanceObjetivo, ultimaMedida, unidadObjetivo } from '../../../core/dominio';
import { Atleta, ObjetivoMeta } from '../../../core/modelos';
import { UiService } from '../../../core/ui.service';
import { fmtFecha, hoyISO, uid } from '../../../core/util';
import { Modal } from '../../../shared/modal';

/** Metas con porcentaje de avance (portado de tabObjetivos). */
@Component({
  selector: 'app-tab-objetivos',
  imports: [FormsModule, Modal],
  template: `
    @let a = atleta();
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
      <div class="nota-info" style="flex:1;min-width:240px;">Los objetivos de <b>peso</b> y <b>medidas</b> se actualizan solos con cada medición.
        Los <b>manuales</b> (ej. dominadas) se actualizan tocando el valor actual.</div>
      <button class="btn btn-primario" (click)="abrir()">＋ Nuevo objetivo</button>
    </div>

    @for (ob of a.objetivos; track ob.id; let i = $index) {
      @let av = avance(ob);
      @let u = unidad(ob);
      <div class="tarjeta" style="margin-bottom:12px;" [style.border-color]="av.pct === 100 ? 'rgba(76,195,138,.5)' : null">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <div style="font-weight:800;font-size:15px;flex:1;min-width:180px;">{{ av.pct === 100 ? '✅' : '🎯' }} {{ ob.titulo }}</div>
          @if (av.pct === 100) { <span class="chip chip-verde">Logrado</span> }
          @else if (av.pct !== null) { <span class="chip chip-ambar">{{ av.pct }}% de avance</span> }
          @else { <span class="chip chip-gris">Sin datos</span> }
          <button class="btn-x" title="Eliminar objetivo" (click)="eliminar(i)">✕</button>
        </div>
        <div style="font-size:13px;color:var(--texto-suave);margin:8px 0 9px;">
          {{ ob.valorObjetivo < ob.valorInicial ? '↓' : '↑' }} De <b style="color:var(--texto)">{{ ob.valorInicial }} {{ u }}</b>
          a <b style="color:var(--ambar)">{{ ob.valorObjetivo }} {{ u }}</b> · Actual:
          @if (ob.tipo === 'manual') {
            <input class="peso-inline" style="width:64px;" type="number" step="0.1" [value]="ob.valorActual ?? ''"
              (change)="actualizarManual(i, $any($event.target).value)" /> {{ u }}
          } @else if (av.actual !== null) { <b style="color:var(--texto)">{{ av.actual }} {{ u }}</b> }
          @else { <i>registra una medición</i> }
          @if (ob.fecha) { · desde {{ fecha(ob.fecha) }} }
        </div>
        <div class="barra-prog"><div [style.width.%]="av.pct ?? 0"></div></div>
      </div>
    } @empty {
      <div class="vacio">
        <span class="ic">🎯</span>
        <h3>Sin objetivos definidos</h3>
        <p>Crea metas medibles: "Bajar 20 lb", "Reducir 3 in de cintura", "Lograr 10 dominadas"... y el avance se calculará automáticamente.</p>
        <button class="btn btn-primario" (click)="abrir()">＋ Crear primer objetivo</button>
      </div>
    }

    @if (modal()) {
      <app-modal titulo="Nuevo Objetivo" (cerrar)="modal.set(false)">
        <div class="campo"><label>Nombre del objetivo</label>
          <input type="text" [(ngModel)]="f.titulo" placeholder='Ej. "Bajar 20 lb", "Reducir cintura", "10 dominadas"' /></div>
        <div class="campo"><label>Tipo de seguimiento</label>
          <select [(ngModel)]="f.tipo" (ngModelChange)="alCambiarTipo()">
            <option value="peso">⚖️ Peso corporal (automático con las mediciones)</option>
            <option value="zona">📏 Medida corporal (automático con las mediciones)</option>
            <option value="manual">✍️ Manual (ej. dominadas, repeticiones, tiempo)</option>
          </select></div>
        @if (f.tipo === 'zona') {
          <div class="campo"><label>Zona corporal</label>
            <select [(ngModel)]="f.zona" (ngModelChange)="alCambiarTipo()">
              @for (z of zonas; track z[0]) { <option [value]="z[0]">{{ z[1] }}</option> }
            </select></div>
        }
        @if (f.tipo === 'manual') {
          <div class="campo"><label>Unidad</label><input type="text" [(ngModel)]="f.unidad" placeholder="Ej. dominadas, reps, min, km" /></div>
        }
        <div class="fila-doble">
          <div class="campo"><label>Valor inicial {{ sufijo() }}</label><input type="number" step="0.1" [(ngModel)]="f.inicial" /></div>
          <div class="campo"><label>Valor objetivo {{ sufijo() }}</label><input type="number" step="0.1" [(ngModel)]="f.objetivo" /></div>
        </div>
        <ng-container pie>
          <button class="btn btn-fantasma" (click)="modal.set(false)">Cancelar</button>
          <button class="btn btn-primario" (click)="guardar()">Crear objetivo</button>
        </ng-container>
      </app-modal>
    }
  `,
})
export class TabObjetivos {
  readonly atleta = input.required<Atleta>();
  private readonly datos = inject(DatosService);
  private readonly ui = inject(UiService);

  protected readonly zonas = ZONAS;
  protected readonly fecha = fmtFecha;
  protected readonly unidad = unidadObjetivo;
  protected avance(ob: ObjetivoMeta) { return avanceObjetivo(this.atleta(), ob); }

  protected readonly modal = signal(false);
  protected f = { titulo: '', tipo: 'peso' as ObjetivoMeta['tipo'], zona: 'pecho', unidad: '', inicial: null as number | null, objetivo: null as number | null };

  protected sufijo() {
    return this.f.tipo === 'peso' ? '(lb)' : this.f.tipo === 'zona' ? '(in)' : '';
  }

  abrir() {
    this.f = { titulo: '', tipo: 'peso', zona: 'pecho', unidad: '', inicial: null, objetivo: null };
    this.alCambiarTipo();
    this.modal.set(true);
  }

  /** Precarga el valor inicial con la última medición. */
  alCambiarTipo() {
    const ult = ultimaMedida(this.atleta());
    if (this.f.tipo === 'peso') this.f.inicial = ult?.peso ?? null;
    else if (this.f.tipo === 'zona') this.f.inicial = ult && ult[this.f.zona] != null ? Number(ult[this.f.zona]) : null;
    else this.f.inicial = 0;
  }

  private async guardarObjetivos(objetivos: ObjetivoMeta[], msg: string) {
    try {
      await this.datos.actualizarAtleta(this.atleta().id, { objetivos });
      this.ui.toast(msg);
      return true;
    } catch (e) {
      this.ui.error(e);
      return false;
    }
  }

  async guardar() {
    const titulo = this.f.titulo.trim();
    if (!titulo) return this.ui.toast('Ponle nombre al objetivo', 'err');
    if (this.f.objetivo === null || (this.f.objetivo as unknown) === '') return this.ui.toast('Define el valor objetivo', 'err');
    const inicial = Number(this.f.inicial) || 0;
    const ob: ObjetivoMeta = { id: uid(), titulo, tipo: this.f.tipo, valorInicial: inicial, valorObjetivo: Number(this.f.objetivo), fecha: hoyISO() };
    if (ob.tipo === 'zona') ob.zona = this.f.zona;
    if (ob.tipo === 'manual') {
      ob.unidad = this.f.unidad.trim();
      ob.valorActual = inicial;
    }
    if (await this.guardarObjetivos([...this.atleta().objetivos, ob], 'Objetivo creado ✓')) this.modal.set(false);
  }

  async actualizarManual(i: number, valor: string) {
    const objetivos = structuredClone(this.atleta().objetivos);
    objetivos[i].valorActual = valor === '' ? null : Number(valor);
    const { pct } = avanceObjetivo(this.atleta(), objetivos[i]);
    await this.guardarObjetivos(objetivos, pct === 100 ? '🎉 ¡Objetivo logrado!' : 'Avance actualizado ✓');
  }

  async eliminar(i: number) {
    if (!(await this.ui.confirmar('Eliminar objetivo', 'Se borrará este objetivo y su seguimiento.'))) return;
    const objetivos = this.atleta().objetivos.filter((_, j) => j !== i);
    await this.guardarObjetivos(objetivos, 'Objetivo eliminado');
  }
}
