import { Component, inject, input } from '@angular/core';
import { DatosService } from '../../../core/datos.service';
import { Atleta } from '../../../core/modelos';
import { UiService } from '../../../core/ui.service';
import { Icono } from '../../../shared/icono';

@Component({
  selector: 'app-tab-bitacora',
  imports: [Icono],
  template: `
    <div class="tarjeta" style="margin-bottom:16px;">
      <div class="campo">
        <label style="display:flex;align-items:center;gap:6px;"><app-icono nombre="diana" [tam]="14" /> Foco actual (técnica / dieta)</label>
        <textarea placeholder="Puntos a mejorar en la técnica o en la dieta. Ej. Corregir retracción escapular en press, subir proteína a 160g/día..."
          [value]="atleta().bitacoraFoco" (change)="guardar('bitacoraFoco', $any($event.target).value)"></textarea>
      </div>
    </div>
    <div class="tarjeta">
      <div class="campo">
        <label style="display:flex;align-items:center;gap:6px;"><app-icono nombre="bandera" [tam]="14" /> Metas a corto plazo</label>
        <textarea placeholder='Objetivos para la próxima revisión física. Ej. "Subir 10 % la carga del peso muerto para el próximo mes"...'
          [value]="atleta().bitacoraMetas" (change)="guardar('bitacoraMetas', $any($event.target).value)"></textarea>
      </div>
    </div>
    <div class="nota-info" style="margin-top:14px;">Los cambios se guardan automáticamente al salir del campo.</div>
  `,
})
export class TabBitacora {
  readonly atleta = input.required<Atleta>();
  private readonly datos = inject(DatosService);
  private readonly ui = inject(UiService);

  async guardar(campo: 'bitacoraFoco' | 'bitacoraMetas', valor: string) {
    try {
      await this.datos.actualizarAtleta(this.atleta().id, { [campo]: valor });
      this.ui.toast('Bitácora guardada ✓');
    } catch (e) {
      this.ui.error(e);
    }
  }
}
