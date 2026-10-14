import { Component, inject, signal } from '@angular/core';
import { DatosService } from '../../core/datos.service';
import { RutinaCompartida, RutinasCompartidasService, diasConContenido } from '../../core/rutinas-compartidas.service';
import { DiaRutina } from '../../core/modelos';
import { UiService } from '../../core/ui.service';
import { esc, fmtFecha } from '../../core/util';
import { Icono } from '../../shared/icono';
import { Modal } from '../../shared/modal';

/** Bandeja del panel: rutinas que otros entrenadores te enviaron. */
@Component({
  selector: 'app-rutinas-recibidas',
  imports: [Icono, Modal],
  template: `
    @if (servicio.recibidas().length) {
      <div class="titulo-seccion"><app-icono nombre="regalo" [tam]="16" /> Rutinas recibidas</div>
      <div class="lista-recibidas">
        @for (r of servicio.recibidas(); track r.id) {
          <div class="recibida">
            <span class="rr-ico"><app-icono nombre="rutina" [tam]="20" /></span>
            <div class="rr-info">
              <div class="rr-nombre">{{ r.nombre }}</div>
              <div class="rr-sub">De <b>{{ r.de_nombre || 'otro entrenador' }}</b>{{ r.de_negocio ? ' · ' + r.de_negocio : '' }} · {{ dias(r).length }} día{{ dias(r).length === 1 ? '' : 's' }} · {{ fecha(r.created_at.slice(0, 10)) }}</div>
            </div>
            <div class="rr-acciones">
              <button class="btn btn-primario btn-mini" (click)="abrir(r)"><app-icono nombre="check" [tam]="14" /> Ver y aplicar</button>
              <button class="btn-x" title="Descartar" (click)="descartar(r)"><app-icono nombre="cerrar" [tam]="16" /></button>
            </div>
          </div>
        }
      </div>
    }

    @if (abierta(); as r) {
      <app-modal [titulo]="r.nombre" (cerrar)="abierta.set(null)">
        <div class="rr-sub" style="margin-bottom:4px;">Enviada por <b>{{ r.de_nombre || 'otro entrenador' }}</b>{{ r.de_negocio ? ' · ' + r.de_negocio : '' }} el {{ fecha(r.created_at.slice(0, 10)) }}</div>
        @if (r.nota) { <div class="aviso aviso-ambar" style="margin-top:4px;"><app-icono nombre="nota" [tam]="15" /> <span>{{ r.nota }}</span></div> }

        <div class="rr-dias">
          @for (d of dias(r); track d) {
            @let dia = diaDe(r, d);
            <div class="rr-dia">
              <div class="rr-dia-t"><b>{{ d }}</b>{{ dia.titulo ? ' · ' + dia.titulo : '' }}</div>
              <ol>
                @for (ej of dia.ejercicios; track $index) {
                  <li>{{ ej.nombre }} <span>{{ ej.series }}{{ ej.peso ? ' · ' + ej.peso : '' }}</span></li>
                }
              </ol>
            </div>
          }
        </div>

        <div class="campo"><label>Aplicar a estos atletas</label>
          @if (datos.atletas().length) {
            <div class="lista-destinos">
              @for (a of datos.atletas(); track a.id) {
                <label class="destino-item">
                  <input type="checkbox" [checked]="destinos().has(a.id)" (change)="alternar(a.id)" />
                  <span>{{ a.nombre }}</span>
                  <span class="chip" [class.chip-verde]="a.activo" [class.chip-gris]="!a.activo" style="margin-left:auto;">{{ a.activo ? 'Activo' : 'Inactivo' }}</span>
                </label>
              }
            </div>
          } @else {
            <p style="color:var(--texto-suave);font-size:13.5px;">Aún no tienes atletas. Crea uno para aplicarle esta rutina.</p>
          }
        </div>
        <div class="nota-info">Se reemplazan <b>{{ dias(r).join(', ') }}</b> en la rutina de cada atleta elegido. Los demás días no se tocan.</div>
        <ng-container pie>
          <button class="btn btn-fantasma" (click)="abierta.set(null)">Cerrar</button>
          <button class="btn btn-primario" (click)="aplicar(r)" [disabled]="aplicando() || !destinos().size">
            <app-icono nombre="check" [tam]="15" /> {{ aplicando() ? 'Aplicando…' : 'Aplicar a ' + destinos().size + ' atleta' + (destinos().size === 1 ? '' : 's') }}
          </button>
        </ng-container>
      </app-modal>
    }
  `,
})
export class RutinasRecibidas {
  protected readonly servicio = inject(RutinasCompartidasService);
  protected readonly datos = inject(DatosService);
  private readonly ui = inject(UiService);
  protected readonly fecha = fmtFecha;
  protected readonly dias = (r: RutinaCompartida) => diasConContenido(r.rutina);
  protected diaDe(r: RutinaCompartida, d: string) { return r.rutina[d] as DiaRutina; }

  protected readonly abierta = signal<RutinaCompartida | null>(null);
  protected readonly destinos = signal<Set<string>>(new Set());
  protected readonly aplicando = signal(false);

  constructor() {
    this.servicio.cargar().catch(() => undefined);
  }

  abrir(r: RutinaCompartida) {
    this.destinos.set(new Set());
    this.abierta.set(r);
  }

  alternar(id: string) {
    const s = new Set(this.destinos());
    s.has(id) ? s.delete(id) : s.add(id);
    this.destinos.set(s);
  }

  async aplicar(r: RutinaCompartida) {
    const ids = [...this.destinos()];
    if (!ids.length) return;
    this.aplicando.set(true);
    try {
      await this.servicio.aplicar(r, ids);
      this.abierta.set(null);
      this.ui.toast(`Rutina aplicada a ${ids.length} atleta${ids.length === 1 ? '' : 's'} ✓`);
    } catch (e) {
      this.ui.error(e);
    } finally {
      this.aplicando.set(false);
    }
  }

  async descartar(r: RutinaCompartida) {
    if (!(await this.ui.confirmar('Descartar rutina', `Se quitará <b>${esc(r.nombre)}</b> de tus rutinas recibidas.`, 'Descartar'))) return;
    try {
      await this.servicio.descartar(r);
      this.ui.toast('Rutina descartada');
    } catch (e) {
      this.ui.error(e);
    }
  }
}
