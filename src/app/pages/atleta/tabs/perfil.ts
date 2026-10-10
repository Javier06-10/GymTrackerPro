import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { DatosService } from '../../../core/datos.service';
import { diasConRutina, nombreComposicion, nombreEstiloVida, nombreObjetivo, nombreSueno } from '../../../core/dominio';
import { Atleta } from '../../../core/modelos';
import { UiService } from '../../../core/ui.service';
import { esc, fmtDinero, fmtFecha } from '../../../core/util';
import { Icono } from '../../../shared/icono';
import { UnidadesService } from '../../../core/unidades';

@Component({
  selector: 'app-tab-perfil',
  imports: [Icono],
  template: `
    @let a = atleta();
    <div class="grid-metricas">
      <div class="metrica"><div class="etiqueta">Mediciones registradas</div><div class="valor">{{ a.medidas.length }}</div></div>
      <div class="metrica m-acero"><div class="etiqueta">Días con rutina</div><div class="valor">{{ dias() }} / 7</div></div>
      <div class="metrica m-verde"><div class="etiqueta">Total pagado histórico</div><div class="valor">{{ dinero(total()) }}</div></div>
    </div>
    <div class="tarjeta">
      <div class="grafica-cab" style="margin-bottom:12px;">
        <span class="t"><app-icono nombre="persona" [tam]="17" /> Datos generales</span>
        <button class="btn btn-suave btn-mini" (click)="ui.formAtleta.set({ id: a.id })"><app-icono nombre="editar" [tam]="15" /> Editar perfil</button>
      </div>
      <div class="datos-grid">
        @for (d of datosPerfil(); track d.lbl) {
          <div class="dato">
            <span class="d-ico"><app-icono [nombre]="d.ico" [tam]="16" /></span>
            <div><div class="d-lbl">{{ d.lbl }}</div><div class="d-val" [class.d-ambar]="d.destacar">{{ d.val }}</div></div>
          </div>
        }
      </div>
      @if (a.objetivoTexto) {
        <div class="aviso aviso-ambar"><app-icono nombre="diana" [tam]="16" /> <span><b>Meta:</b> {{ a.objetivoTexto }}</span></div>
      }
      @if (a.condiciones.trim()) {
        <div class="aviso aviso-rojo"><app-icono nombre="alerta" [tam]="16" /> <span><b>Condiciones de salud:</b> {{ a.condiciones }}</span></div>
      }
    </div>
    <div class="fila-acciones">
      <button class="btn" [class.btn-fantasma]="a.activo" [class.btn-verde]="!a.activo" (click)="alternarActivo()">
        <app-icono [nombre]="a.activo ? 'prohibido' : 'check'" [tam]="16" /> {{ a.activo ? 'Marcar como inactivo' : 'Reactivar atleta' }}
      </button>
      <button class="btn btn-peligro" (click)="eliminar()"><app-icono nombre="papelera" [tam]="16" /> Eliminar atleta</button>
    </div>
  `,
})
export class TabPerfil {
  readonly atleta = input.required<Atleta>();
  protected readonly ui = inject(UiService);
  private readonly datos = inject(DatosService);
  private readonly router = inject(Router);
  private readonly u = inject(UnidadesService);

  protected readonly dinero = fmtDinero;
  protected readonly fecha = fmtFecha;
  protected readonly comp = nombreComposicion;
  protected readonly obj = nombreObjetivo;
  protected readonly sueno = nombreSueno;
  protected readonly estilo = nombreEstiloVida;
  protected readonly dias = computed(() => diasConRutina(this.atleta()));
  protected readonly total = computed(() => this.atleta().pagos.reduce((s, p) => s + p.monto, 0));

  /** Datos del perfil como cuadrícula (etiqueta, valor e icono). */
  protected readonly datosPerfil = computed(() => {
    const a = this.atleta();
    return [
      { ico: a.genero === 'mujer' ? 'mujer' : 'hombre', lbl: 'Género', val: a.genero === 'mujer' ? 'Mujer' : 'Hombre' },
      { ico: 'cumple', lbl: 'Edad', val: (a.edad ? a.edad + ' años' : '—') + (a.fechaNacimiento ? ' · ' + this.fecha(a.fechaNacimiento) : '') },
      { ico: 'regla', lbl: 'Estatura', val: this.u.metrico() ? this.u.estatura(a.estaturaPies, a.estaturaPulg) : `${a.estaturaPies} pies ${Math.round(Number(a.estaturaPulg))} pulg` },
      { ico: 'cuerpo-atletico', lbl: 'Composición', val: this.comp(a.composicion), destacar: true },
      { ico: 'diana', lbl: 'Objetivo', val: this.obj(a.objetivo), destacar: true },
      { ico: 'cama', lbl: 'Sueño', val: this.sueno(a.horasSueno) },
      { ico: 'actividad', lbl: 'Estilo de vida', val: this.estilo(a.estiloVida) },
      { ico: 'telefono', lbl: 'Teléfono', val: a.telefono || '—' },
      { ico: 'calendario', lbl: 'Cliente desde', val: this.fecha(a.fechaRegistro) },
    ];
  });

  async alternarActivo() {
    const a = this.atleta();
    try {
      await this.datos.actualizarAtleta(a.id, { activo: !a.activo });
      this.ui.toast(!a.activo ? 'Atleta reactivado ✓' : 'Atleta marcado como inactivo');
    } catch (e) {
      this.ui.error(e);
    }
  }

  async eliminar() {
    const a = this.atleta();
    const ok = await this.ui.confirmar(
      'Eliminar atleta',
      `Se borrará <b>${esc(a.nombre)}</b> con todo su historial de medidas, rutinas y pagos. Esta acción no se puede deshacer.`,
    );
    if (!ok) return;
    try {
      await this.datos.eliminarAtleta(a.id);
      this.router.navigateByUrl('/panel');
      this.ui.toast('Atleta eliminado');
    } catch (e) {
      this.ui.error(e);
    }
  }
}
