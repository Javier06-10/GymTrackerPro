import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { VistaAvatar, dibujarAvatar } from '../../../core/avatar';
import { GraficaLinea } from '../../../shared/graficas/grafica-linea';
import { DatosService } from '../../../core/datos.service';
import { GRUPOS_MEDIDA, ZONAS, bajarEsBueno, delta, deltaPeso, etiquetaZona, medicionPendiente, serieMedida, ultimaMedida } from '../../../core/dominio';
import { Atleta, Medida } from '../../../core/modelos';
import { AuthService } from '../../../core/auth.service';
import { compararProgreso } from '../../../core/pdf';
import { PdfService } from '../../../core/pdf.service';
import { UiService } from '../../../core/ui.service';
import { abrirWhatsApp } from '../../../core/whatsapp';
import { fmtFecha, hoyISO } from '../../../core/util';
import { Modal } from '../../../shared/modal';
import { SvgSeguroPipe } from '../../../shared/svg-seguro.pipe';
import { Icono } from '../../../shared/icono';
import { UnidadesService } from '../../../core/unidades';
import { lecturaGrasa, serieGrasa } from '../../../core/grasa';

/** Medidas + avatar anatómico evolutivo (portado de tabMedidas). */
@Component({
  selector: 'app-tab-medidas',
  imports: [FormsModule, Modal, SvgSeguroPipe, GraficaLinea, Icono],
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
            <div style="font-weight:800;display:flex;align-items:center;gap:8px;"><app-icono nombre="regla" [tam]="18" /> Historial de progreso corporal</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              @if (a.medidas.length >= 2) {
                <button class="btn btn-suave btn-mini" (click)="resumenWhatsApp()"><app-icono nombre="chat" [tam]="15" /> Resumen</button>
                <button class="btn btn-suave btn-mini" (click)="exportarPDF()"><app-icono nombre="documento" [tam]="15" /> Exportar PDF</button>
              }
              <button class="btn btn-primario btn-mini" (click)="abrirModal()"><app-icono nombre="mas" [tam]="15" /> Nueva medición</button>
            </div>
          </div>
          @if (pendiente(); as mp) {
            @if (mp.vencida) {
              <div style="font-size:12.5px;color:var(--rojo);background:var(--rojo-fondo);border-radius:8px;padding:8px 12px;margin-bottom:12px;">
                <app-icono nombre="alerta" [tam]="14" /> <b>Toca medir:</b> la última medición fue hace {{ mp.dias }} días ({{ fecha(mp.ultFecha) }}).
              </div>
            } @else {
              <div style="font-size:12.5px;color:var(--texto-suave);margin-bottom:12px;">
                <app-icono nombre="reloj" [tam]="14" /> Próxima medición en <b style="color:var(--verde)">{{ mp.proximaEn }} día{{ mp.proximaEn === 1 ? '' : 's' }}</b> · última: {{ fecha(mp.ultFecha) }}
              </div>
            }
          }
          @if (a.medidas.length) {
            @if (grasa(); as g) {
              <div class="grasa-res">
                <div class="gr-pct"><span class="gr-num">{{ g.pct }}<small>%</small></span><span class="chip gr-{{ g.cls }}">{{ g.categoria }}</span></div>
                <div class="gr-detalle">
                  <span>Grasa corporal estimada</span>
                  <span>Masa grasa <b>{{ u.pesoTxt(g.grasaLb) }}</b> · Masa magra <b>{{ u.pesoTxt(g.magraLb) }}</b></span>
                  @if (cambioGrasa(); as c) { <span>Desde la medición anterior: <b [class]="c < 0 ? 'delta-pos' : c > 0 ? 'delta-neg' : 'delta-cero'">{{ c > 0 ? '+' : '' }}{{ c }} %</b></span> }
                </div>
              </div>
            } @else {
              <div class="nota-info" style="margin-bottom:12px;">
                <app-icono nombre="info" [tam]="14" /> Para estimar el <b>% de grasa corporal</b>, registra el <b>cuello</b>{{ a.genero === 'mujer' ? ', la cintura y la cadera' : ' y el abdomen a la altura del ombligo' }} en la próxima medición{{ a.estaturaPies ? '' : ', y la estatura en el perfil' }}.
              </div>
            }
          }
          <div style="font-size:12px;color:var(--tenue);margin-bottom:12px;">Recordar medición cada
            <input class="peso-inline" style="width:44px;text-align:center;" type="number" min="5" max="120"
              [value]="a.frecuenciaMedicion" (change)="guardarFrecuencia($any($event.target).value)" /> días</div>

          @if (!a.medidas.length) {
            <div class="vacio" style="padding:30px;">
              <span class="ic"><app-icono nombre="regla" [tam]="40" /></span>
              <h3>Sin mediciones todavía</h3>
              <p>Registra la primera toma de medidas para activar el avatar evolutivo.</p>
            </div>
          } @else {
            <div class="tabla-scroll"><table>
              <tr><th>Fecha</th><th>Peso ({{ u.uPeso() }})</th>@for (z of zonas; track z[0]) { <th>{{ z[1] }} ({{ u.uLargo() }})</th> }<th></th></tr>
              @for (m of medidasDesc(); track m.id; let i = $index) {
                @let ant = anterior(i);
                <tr>
                  <td>{{ fecha(m.fecha) }}</td>
                  <td><b>{{ u.peso(m.peso) }}</b> @if (dp(u.peso(m.peso), u.peso(ant?.peso)); as x) { <span [class]="x.cls">{{ x.txt }}</span> }</td>
                  @for (z of zonas; track z[0]) {
                    <td>{{ u.largo(m[z[0]]) ?? '—' }} @if (d(u.largo(m[z[0]]), u.largo(ant?.[z[0]]), invertida(z[0])); as x) { <span [class]="x.cls">{{ x.txt }}</span> }</td>
                  }
                  <td><button class="btn-x" title="Eliminar medición" (click)="eliminar(m)"><app-icono nombre="cerrar" [tam]="15" /></button></td>
                </tr>
              }
            </table></div>

            @if (a.medidas.length > 1) {
              @let prim = a.medidas[0];
              @let ult = ultima()!;
              <div class="titulo-seccion" style="margin-top:18px;">Progreso total (primera vs última)</div>
              <div class="tabla-scroll"><table>
                <tr><th>Zona</th><th>Inicio</th><th>Actual</th><th>Cambio</th></tr>
                <tr><td>Peso</td><td>{{ u.pesoTxt(prim.peso) }}</td><td>{{ u.pesoTxt(ult.peso) }}</td>
                  <td>@if (dp(u.peso(ult.peso), u.peso(prim.peso)); as x) { <span [class]="x.cls" style="font-size:14px;">{{ x.txt }}</span> }</td></tr>
                @for (z of zonas; track z[0]) {
                  <tr><td>{{ z[1] }}</td><td>{{ u.largoTxt(prim[z[0]]) }}</td><td>{{ u.largoTxt(ult[z[0]]) }}</td>
                    <td>@if (d(u.largo(ult[z[0]]), u.largo(prim[z[0]]), invertida(z[0])); as x) { <span [class]="x.cls" style="font-size:14px;">{{ x.txt }}</span> }</td></tr>
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
          <span class="t"><app-icono nombre="tendencia" [tam]="17" /> Evolución · {{ metricaActiva()[1] }}</span>
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
          <div class="campo"><label>Peso de báscula ({{ u.uPeso() }})</label><input type="number" step="0.1" [placeholder]="u.metrico() ? 'Ej. 79.5' : 'Ej. 175'" [(ngModel)]="form.peso" /></div>
        </div>
        @for (g of gruposMedida; track g[0]) {
          <div class="titulo-seccion" style="margin:6px 0 2px;">{{ g[0] }} — {{ u.metrico() ? 'centímetros' : 'pulgadas' }}</div>
          <div class="form-grid">
            @for (z of g[1]; track z) {
              <div class="campo"><label>{{ etiqueta(z) }} ({{ u.uLargo() }})</label>
                <input type="number" step="0.1" [placeholder]="u.uLargo()" [(ngModel)]="form.zonas[z]" /></div>
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
  protected readonly u = inject(UnidadesService);

  protected readonly zonas = ZONAS;
  protected readonly gruposMedida = GRUPOS_MEDIDA;
  protected readonly etiqueta = etiquetaZona;
  protected readonly fecha = fmtFecha;
  protected readonly d = delta;
  protected dp(actual: unknown, anterior: unknown) { return deltaPeso(this.atleta(), actual, anterior); }
  /** Si el atleta quiere bajar de peso, que baje cualquier medida es avance (verde). */
  protected invertida(z: string) { return bajarEsBueno(this.atleta(), z); }

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

  /* ---------- % de grasa corporal (fórmula de la Marina de EE. UU.) ---------- */
  protected readonly grasa = computed(() => lecturaGrasa(this.atleta(), this.ultima()));
  /** Cambio frente a la medición anterior en la que también se pudo calcular. */
  protected readonly cambioGrasa = computed(() => {
    const s = serieGrasa(this.atleta());
    return s.length >= 2 ? Math.round((s[s.length - 1].valor - s[s.length - 2].valor) * 10) / 10 : null;
  });

  /* ---------- Gráfica de evolución ---------- */
  protected readonly metrica = signal('peso');
  protected readonly metricasDisponibles = computed(() =>
    ([['peso', 'Peso', this.u.uPeso()]] as [string, string, string][])
      .concat([['grasa', '% de grasa', '%']])
      .concat(ZONAS.map((z) => [z[0], z[1], this.u.uLargo()] as [string, string, string]))
      .filter((m) => this.serie(m[0]).length >= 2),
  );
  /** El % de grasa no es una medida guardada: se calcula y no se convierte de unidades. */
  private serie(clave: string) {
    return clave === 'grasa' ? serieGrasa(this.atleta()) : serieMedida(this.atleta(), clave);
  }
  protected readonly metricaActiva = computed(() => {
    const disp = this.metricasDisponibles();
    return disp.find((m) => m[0] === this.metrica()) ?? disp[0];
  });
  protected readonly serieActiva = computed(() => {
    const clave = this.metricaActiva()[0];
    if (clave === 'grasa') return serieGrasa(this.atleta());
    return serieMedida(this.atleta(), clave).map((p) => ({ fecha: p.fecha, valor: this.u.valor(clave, p.valor)! }));
  });
  /** Meta del primer objetivo que sigue esta métrica (peso o zona). */
  protected readonly metaActiva = computed(() => {
    const clave = this.metricaActiva()[0];
    if (clave === 'grasa') return null;
    const ob = this.atleta().objetivos.find((o) => (clave === 'peso' ? o.tipo === 'peso' : o.tipo === 'zona' && o.zona === clave));
    return ob ? this.u.valor(clave, ob.valorObjetivo) : null;
  });
  protected readonly cambioTotal = computed(() => {
    const s = this.serieActiva();
    if (s.length < 2) return null;
    const clave = this.metricaActiva()[0];
    if (clave === 'peso') return this.dp(s[s.length - 1].valor, s[0].valor);
    return delta(s[s.length - 1].valor, s[0].valor, clave === 'grasa' || this.invertida(clave));
  });

  /* ---------- Alta de medición ---------- */
  protected readonly modal = signal(false);
  protected readonly guardando = signal(false);
  protected form: { fecha: string; peso: number | null; zonas: Record<string, number | null> } = { fecha: '', peso: null, zonas: {} };

  abrirModal() {
    const ult = this.ultima();
    const zonas: Record<string, number | null> = {};
    ZONAS.forEach(([z]) => (zonas[z] = ult ? this.u.largo(ult[z]) : null));
    this.form = { fecha: hoyISO(), peso: ult ? this.u.peso(ult.peso) : null, zonas };
    this.modal.set(true);
  }

  async guardar() {
    if (!this.form.fecha) return this.ui.toast('Selecciona la fecha', 'err');
    const peso = this.u.aLb(this.form.peso);
    if (!peso) return this.ui.toast('Registra el peso de báscula', 'err');
    const m: Record<string, unknown> = { fecha: this.form.fecha, peso };
    ZONAS.forEach(([z]) => {
      const v = this.form.zonas[z];
      m[z] = this.u.aPulg(v);
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
    const cmp = compararProgreso(a, this.u.sistema());
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
    if (!abrirWhatsApp(a, t)) this.ui.toast('Este atleta no tiene teléfono. Agrégalo en Editar', 'err');
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
