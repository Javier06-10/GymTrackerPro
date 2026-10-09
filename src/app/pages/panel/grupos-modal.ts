import { Component, inject, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatosService } from '../../core/datos.service';
import { UiService } from '../../core/ui.service';
import { esc, normalizar } from '../../core/util';
import { Modal } from '../../shared/modal';

/** Administración de grupos (portado de abrirModalGrupos). */
@Component({
  selector: 'app-grupos-modal',
  imports: [FormsModule, Modal],
  template: `
    <app-modal titulo="👥 Grupos de Atletas" (cerrar)="cerrar.emit()">
      @for (g of datos.grupos(); track g.id) {
        <div class="grupo-fila">
          <input type="text" [value]="g.nombre" (change)="renombrar(g.id, $any($event.target).value)" />
          <span class="chip chip-gris" style="flex-shrink:0;">{{ contar(g.id) }} atleta{{ contar(g.id) === 1 ? '' : 's' }}</span>
          <button class="btn-x" title="Eliminar grupo" (click)="eliminar(g.id, g.nombre)">✕</button>
        </div>
      } @empty {
        <p style="color:var(--texto-suave);font-size:13.5px;">
          Aún no hay grupos. Crea el primero abajo — por ejemplo "Mañana" y "Tarde" para separar horarios, o la segmentación que prefieras.
        </p>
      }
      <div class="grupo-fila" style="margin-top:6px;">
        <input type="text" [(ngModel)]="nuevo" placeholder='Nuevo grupo. Ej. "Mañana", "Tarde"...' (keyup.enter)="crear()" />
        <button class="btn btn-primario btn-mini" (click)="crear()">＋ Crear</button>
      </div>
      <div class="nota-info">Renombra un grupo editando su nombre directamente. Al eliminar un grupo, sus atletas quedan "sin grupo" (no se borran).</div>
      <ng-container pie><button class="btn btn-fantasma" (click)="cerrar.emit()">Cerrar</button></ng-container>
    </app-modal>
  `,
})
export class GruposModal {
  readonly cerrar = output<void>();
  readonly eliminado = output<string>();
  protected readonly datos = inject(DatosService);
  private readonly ui = inject(UiService);
  protected nuevo = '';

  contar(id: string) {
    return this.datos.atletas().filter((a) => a.grupoId === id).length;
  }

  async crear() {
    const nombre = this.nuevo.trim();
    if (!nombre) return this.ui.toast('Escribe el nombre del grupo', 'err');
    if (this.datos.grupos().some((g) => normalizar(g.nombre) === normalizar(nombre))) {
      return this.ui.toast('Ya existe un grupo con ese nombre', 'err');
    }
    try {
      await this.datos.crearGrupo(nombre);
      this.nuevo = '';
      this.ui.toast(`Grupo "${nombre}" creado ✓`);
    } catch (e) {
      this.ui.error(e);
    }
  }

  async renombrar(id: string, nombre: string) {
    const limpio = nombre.trim();
    if (!limpio) return this.ui.toast('El nombre no puede quedar vacío', 'err');
    try {
      await this.datos.renombrarGrupo(id, limpio);
      this.ui.toast('Grupo renombrado ✓');
    } catch (e) {
      this.ui.error(e);
    }
  }

  async eliminar(id: string, nombre: string) {
    const n = this.contar(id);
    const ok = await this.ui.confirmar(
      'Eliminar grupo',
      `Se eliminará el grupo <b>${esc(nombre)}</b>. ${n ? `Sus ${n} atleta${n === 1 ? '' : 's'} quedará${n === 1 ? '' : 'n'} sin grupo (no se borran).` : 'No tiene atletas asignados.'}`,
    );
    if (!ok) return;
    try {
      await this.datos.eliminarGrupo(id);
      this.eliminado.emit(id);
      this.ui.toast('Grupo eliminado');
    } catch (e) {
      this.ui.error(e);
    }
  }
}
