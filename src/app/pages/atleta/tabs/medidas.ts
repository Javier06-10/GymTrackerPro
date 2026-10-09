import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { VistaAvatar, dibujarAvatar } from '../../../core/avatar';
import { GraficaLinea } from '../../../shared/graficas/grafica-linea';
import { DatosService } from '../../../core/datos.service';
import { GRUPOS_MEDIDA, ZONAS, ZONAS_INVERTIDAS, delta, deltaPeso, etiquetaZona, medicionPendiente, serieMedida, ultimaMedida } from '../../../core/dominio';
import { Atleta, Medida } from '../../../core/modelos';
import { AuthService } from '../../../core/auth.service';
import { compararProgreso } from '../../../core/pdf';
import { PdfService } from '../../../core/pdf.service';
import { UiService } from '../../../core/ui.service';
import { abrirWhatsApp } from '../../../core/whatsapp';
import { fmtFecha, hoyISO } from '../../../core/util';
import { Modal } from '../../../shared/modal';
import { SvgSeguroPipe } from '../../../shared/svg-seguro.pipe';

/** Medidas + avatar anatómico evolutivo (portado de tabMedidas). */
@Component({
  selector: 'app-tab-medidas',
  imports: [FormsModule, Modal, SvgSeguroPipe, GraficaLinea],
  template: `
    @let a = atleta();
    <div class="layout-avatar">
      <div>
        <div class="marco-avatar">
          <div [innerHTML]="avatar() | svgSeguro"></div>
          <div class="mini-avatar" [title]="'Ver ' + vistaOpuesta()" (click)="vista.set(vistaOpuesta())"
            [innerHTML]="miniAvatar() | svgSeguro"></div>
          <div class="vistas-avatar">
            @for (v of vistas; track v[0]) {
              <div class="btn-vista" [class.activa]="vista() === v[0]" (click)="vista.set(v[0])">{{ v[1] }}</div>
            }
          </div>
          <div class="leyenda-avatar">
            <span><span class="punto" style="background:var(--ambar)"></span>Mayor crecimiento</span>
            <span><span class="punto" style="background:var(--verde)"></span>Reducción de abdomen</span>
          </div>
        </div>
        <div class="nota-info" style="margin-top:12px;">
          El avatar cambia su fisonomía con cada medición y con el indicador de composición corporal. Gíralo con los botones Frente / Lado / Espalda.
        </div>
      </div>
      <div>
        <div class="tarjeta">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:8px;flex-wrap:wrap;">
            <div style="font-weight:800;">📏 Historial de Progreso Corporal</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              @if (a.medidas.length >= 2) {
                <button class="btn btn-suave btn-mini" (click)="resumenWhatsApp()">💬 Resumen</button>
                <button class="btn btn-suave btn-mini" (click)="exportarPDF()">📄 Exportar PDF</button>
              }
              <button class="btn btn-primario btn-mini" (click)="abrirModal()">＋ Nueva medición</button>
            </div>
          </div>
          @if (pendiente(); as mp) {
            @if (mp.vencida) {
              <div style="font-size:12.5px;color:var(--rojo);background:var(--rojo-fondo);border-radius:8px;padding:8px 12px;margin-bottom:12px;">
                📏 <b>Toca medir:</b> la última medición fue hace {{ mp.dias }} días ({{ fecha(mp.ultFecha) }}).
              </div>
            } @else {
              <div style="font-size:12.5px;color:var(--texto-suave);margin-bottom:12px;">
                📏 Próxima medición en <b style="color:var(--verde)">{{ mp.proximaEn }} día{{ mp.proximaEn === 1 ? '' : 's' }}</b> · última: {{ fecha(mp.ultFecha) }}
              </div>
            }
          }
          <div style="font-size:12px;color:var(--tenue);margin-bottom:12px;">Recordar medición cada
            <input class="peso-inline" style="width:44px;text-align:center;" type="number" min="5" max="120"
              [value]="a.frecuenciaMedicion" (change)="guardarFrecuencia($any($event.target).value)" /> días</div>

          @if (!a.medidas.length) {
            <div class="vacio" style="padding:30px;">
              <span class="ic">📐</span>
              <h3>Sin mediciones todavía</h3>
              <p>Registra la primera toma de medidas para activar el avatar evolutivo.</p>
            </div>
          } @else {
            <div class="tabla-scroll"><table>
              <tr><th>Fecha</th><th>Peso (lb)</th>@for (z of zonas; track z[0]) { <th>{{ z[1] }} (in)</th> }<th></th></tr>
              @for (m of medidasDesc(); track m.id; let i = $index) {
                @let ant = anterior(i);
                <tr>
                  <td>{{ fecha(m.fecha) }}</td>
                  <td><b>{{ m.peso }}</b> @if (dp(m.peso, ant?.peso); as x) { <span [class]="x.cls">{{ x.txt }}</span> }</td>
                  @for (z of zonas; track z[0]) {
                    <td>{{ m[z[0]] ?? '—' }} @if (d(m[z[0]], ant?.[z[0]], invertida(z[0])); as x) { <span [class]="x.cls">{{ x.txt }}</span> }</td>
                  }
                  <td><button class="btn-x" title="Eliminar medición" (click)="eliminar(m)">✕</button></td>
                </tr>
              }
            </table></div>

            @if (a.medidas.length > 1) {
              @let prim = a.medidas[0];
              @let ult = ultima()!;
              <div class="titulo-seccion" style="margin-top:18px;">Progreso total (primera vs última)</div>
              <div class="tabla-scroll"><table>
                <tr><th>Zona</th><th>Inicio</th><th>Actual</th><th>Cambio</th></tr>
                <tr><td>Peso</td><td>{{ prim.peso }} lb</td><td>{{ ult.peso }} lb</td>
                  <td>@if (dp(ult.peso, prim.peso); as x) { <span [class]="x.cls" style="font-size:14px;">{{ x.txt }}</span> }</td></tr>
                @for (z of zonas; track z[0]) {
                  <tr><td>{{ z[1] }}</td><td>{{ prim[z[0]] ?? '—' }} in</td><td>{{ ult[z[0]] ?? '—' }} in</td>
                    <td>@if (d(ult[z[0]], prim[z[0]], invertida(z[0])); as x) { <span [class]="x.cls" style="font-size:14px;">{{ x.txt }}</span> }</td></tr>
                }
              </table></div>
            }
          }
        </div>
      </div>
    </div>

    @if (metricasDisponibles().length) {
      <div class="tarjeta" style="margin-top:18px;">
        <div class="grafica-cab">
          <span class="t">📈 Evolución · {{ metricaActiva()[1] }}</span>
          <span class="s">
            {{ serieActiva().length }} mediciones
            @if (cambioTotal(); as c) { · <b [class]="c.cls">{{ c.txt }} {{ metricaActiva()[2] }}</b> desde el inicio }
          </span>
        </div>
        <div class="filtros-grupo" style="margin-bottom:8px;">
          @for (m of metricasDisponibles(); track m[0]) {
            <div class="chip-filtro" [class.activo]="m[0] === metricaActiva()[0]" (click)="metrica.set(m[0])">{{ m[1] }}</div>
          }
        </div>
        <app-grafica-linea [puntos]="serieActiva()" [unidad]="metricaActiva()[2]" [titulo]="'Evolución de ' + metricaActiva()[1]"
          [meta]="metaActiva()" />
        <div style="font-size:12px;color:var(--tenue);margin-top:6px;">
          Pasa el dedo o el mouse por la gráfica para ver cada medición.
          @if (metaActiva() !== null) { La línea punteada es la meta del objetivo. }
        </div>
      </div>
    }

    @if (modal()) {
      <app-modal titulo="Nueva Medición" (cerrar)="modal.set(false)">
        <div class="form-grid">
          <div class="campo"><label>Fecha de medición</label><input type="date" [(ngModel)]="form.fecha" /></div>
          <div class="campo"><label>Peso de báscula (lb)</label><input type="number" step="0.1" placeholder="Ej. 175" [(ngModel)]="form.peso" /></div>
        </div>
        @for (g of gruposMedida; track g[0]) {
          <div class="titulo-seccion" style="margin:6px 0 2px;">{{ g[0] }} — pulgadas</div>
          <div class="form-grid">
            @for (z of g[1]; track z) {
              <div class="campo"><label>{{ etiqueta(z) }} (in)</label>
                <input type="number" step="0.1" placeholder="in" [(ngModel)]="form.zonas[z]" /></div>
            }
          </div>
        }
        <ng-container pie>
          <button class="btn btn-fantasma" (click)="modal.set(false)">Cancelar</button>
          <button class="btn btn-primario" (click)="guardar()" [disabled]="guardando()">Guardar medición</button>
        </ng-container>
      </app-modal>
    }
  `,
})
export class TabMedidas {
  readonly atleta = input.required<Atleta>();
  private readonly datos = inject(DatosService);
  private readonly ui = inject(UiService);
  private readonly pdf = inject(PdfService);
  private readonly auth = inject(AuthService);

  protected readonly zonas = ZONAS;
  protected readonly gruposMedida = GRUPOS_MEDIDA;
  protected readonly etiqueta = etiquetaZona;
  protected readonly fecha = fmtFecha;
  protected readonly d = delta;
  protected dp(actual: unknown, anterior: unknown) { return deltaPeso(this.atleta().objetivo, actual, anterior); }
  protected invertida(z: string) { return ZONAS_INVERTIDAS.has(z); }

  protected readonly vistas: [VistaAvatar, string][] = [['frente', 'Frente'], ['lado', 'Lado'], ['espalda', 'Espalda']];
  protected readonly vista = signal<VistaAvatar>('frente');
  protected readonly vistaOpuesta = computed<VistaAvatar>(() => (this.vista() === 'espalda' ? 'frente' : 'espalda'));
  protected readonly avatar = computed(() => dibujarAvatar(this.atleta(), this.vista()));
  protected readonly miniAvatar = computed(() => dibujarAvatar(this.atleta(), this.vistaOpuesta(), 72));

  protected readonly ultima = computed(() => ultimaMedida(this.atleta()));
  protected readonly pendiente = computed(() => medicionPendiente(this.atleta()));
  protected readonly medidasDesc = computed(() => this.atleta().medidas.slice().reverse());
  /** Medición anterior a la fila i de la lista descendente. */
  protected anterior(i: number): Medida | undefined {
    return this.medidasDesc()[i + 1];
  }

  /* ---------- Gráfica de evolución ---------- */
  protected readonly metrica = signal('peso');
  protected readonly metricasDisponibles = computed(() =>
    ([['peso', 'Peso', 'lb']] as [string, string, string][])
      .concat(ZONAS.map((z) => [z[0], z[1], 'in'] as [string, string, string]))
      .filter((m) => serieMedida(this.atleta(), m[0]).length >= 2),
  );
  protected readonly metricaActiva = computed(() => {
    const disp = this.metricasDisponibles();
    return disp.find((m) => m[0] === this.metrica()) ?? disp[0];
  });
  protected readonly serieActiva = computed(() => serieMedida(this.atleta(), this.metricaActiva()[0]));
  /** Meta del primer objetivo que sigue esta métrica (peso o zona). */
  protected readonly metaActiva = computed(() => {
    const clave = this.metricaActiva()[0];
    const ob = this.atleta().objetivos.find((o) => (clave === 'peso' ? o.tipo === 'peso' : o.tipo === 'zona' && o.zona === clave));
    return ob ? ob.valorObjetivo : null;
  });
  protected readonly cambioTotal = computed(() => {
    const s = this.serieActiva();
    if (s.length < 2) return null;
    const clave = this.metricaActiva()[0];
    return clave === 'peso' ? this.dp(s[s.length - 1].valor, s[0].valor) : delta(s[s.length - 1].valor, s[0].valor, ZONAS_INVERTIDAS.has(clave));
  });

  /* ---------- Alta de medición ---------- */
  protected readonly modal = signal(false);
  protected readonly guardando = signal(false);
  protected form: { fecha: string; peso: number | null; zonas: Record<string, number | null> } = { fecha: '', peso: null, zonas: {} };

  abrirModal() {
    const ult = this.ultima();
    const zonas: Record<string, number | null> = {};
    ZONAS.forEach(([z]) => (zonas[z] = ult ? (ult[z] as number | null) : null));
    this.form = { fecha: hoyISO(), peso: ult?.peso ?? null, zonas };
    this.modal.set(true);
  }

  async guardar() {
    if (!this.form.fecha) return this.ui.toast('Selecciona la fecha', 'err');
    const peso = Number(this.form.peso);
    if (!peso) return this.ui.toast('Registra el peso de báscula', 'err');
    const m: Record<string, unknown> = { fecha: this.form.fecha, peso };
    ZONAS.forEach(([z]) => {
      const v = this.form.zonas[z];
      m[z] = v === null || v === undefined || (v as unknown) === '' ? null : Number(v);
    });
    this.guardando.set(true);
    try {
      await this.datos.agregarMedida(this.atleta().id, m as Omit<Medida, 'id'>);
      this.modal.set(false);
      this.ui.toast('Medición registrada ✓ El avatar se actualizó');
    } catch (e) {
      this.ui.error(e);
    } finally {
      this.guardando.set(false);
    }
  }

  async eliminar(m: Medida) {
    if (!(await this.ui.confirmar('Eliminar medición', 'Se borrará esta toma de medidas del historial.'))) return;
    try {
      await this.datos.eliminarMedida(this.atleta().id, m.id);
      this.ui.toast('Medición eliminada');
    } catch (e) {
      this.ui.error(e);
    }
  }

  /* ---------- Exportar / compartir el progreso ---------- */
  async exportarPDF() {
    if (await this.pdf.progreso(this.atleta())) this.ui.toast('PDF de progreso descargado ✓');
    else this.ui.toast('Las dos últimas mediciones no tienen zonas en común', 'err');
  }

  resumenWhatsApp() {
    const a = this.atleta();
    const cmp = compararProgreso(a);
    if (!cmp) return this.ui.toast('Se necesitan al menos 2 mediciones para comparar', 'err');
    const emoji = { AVANCE: '✅', RETROCESO: '🔻', IGUAL: '➖', CAMBIO: 'ℹ️' };
    let t = `📊 *TU PROGRESO — ${a.nombre.toUpperCase()}*\n`;
    t += `${fmtFecha(cmp.ant.fecha)} → ${fmtFecha(cmp.act.fecha)} (${cmp.dias} días)\n\n`;
    cmp.filas.forEach((f) => {
      t += `${f.zona}: ${f.antes} → ${f.ahora} ${emoji[f.ev.texto]} ${f.delta === 0 ? '' : (f.delta > 0 ? '+' : '') + f.delta}\n`;
    });
    t += `\n*${cmp.avances} zona${cmp.avances === 1 ? '' : 's'} mejoraron · ${cmp.iguales} sin cambio · ${cmp.retros} retroceso${cmp.retros === 1 ? '' : 's'}*\n`;
    t += cmp.frase;
    const firma = this.auth.perfil()?.nombre;
    if (firma) t += '\n— ' + firma;
    if (!abrirWhatsApp(a, t)) this.ui.toast('Este atleta no tiene teléfono. Agrégalo con ✏️ en su Perfil', 'err');
  }

  async guardarFrecuencia(valor: string) {
    const frec = Math.max(5, Math.min(120, Number(valor) || 30));
    try {
      await this.datos.actualizarAtleta(this.atleta().id, { frecuenciaMedicion: frec });
      this.ui.toast('Recordatorio de medición actualizado ✓');
    } catch (e) {
      this.ui.error(e);
    }
  }
}
