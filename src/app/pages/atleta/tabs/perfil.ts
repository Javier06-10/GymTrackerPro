import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { DatosService } from '../../../core/datos.service';
import { diasConRutina, nombreComposicion, nombreEstiloVida, nombreObjetivo, nombreSueno } from '../../../core/dominio';
import { Atleta } from '../../../core/modelos';
import { UiService } from '../../../core/ui.service';
import { esc, fmtDinero, fmtFecha } from '../../../core/util';

@Component({
  selector: 'app-tab-perfil',
  template: `
    @let a = atleta();
    <div class="grid-metricas">
      <div class="metrica"><div class="etiqueta">Mediciones registradas</div><div class="valor">{{ a.medidas.length }}</div></div>
      <div class="metrica m-acero"><div class="etiqueta">Días con rutina</div><div class="valor">{{ dias() }} / 7</div></div>
      <div class="metrica m-verde"><div class="etiqueta">Total pagado histórico</div><div class="valor">{{ dinero(total()) }}</div></div>
    </div>
    <div class="tarjeta">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
        <div>
          <div style="font-weight:800;font-size:15px;">Datos generales</div>
          <div style="font-size:13px;color:var(--texto-suave);margin-top:4px;">
            Género: <b style="color:var(--texto)">{{ a.genero === 'mujer' ? 'Mujer' : 'Hombre' }}</b> ·
            Edad: <b style="color:var(--texto)">{{ a.edad ? a.edad + ' años' : '—' }}</b>
            @if (a.fechaNacimiento) { · 🎂 <b style="color:var(--texto)">{{ fecha(a.fechaNacimiento) }}</b> } ·
            Estatura: <b style="color:var(--texto)">{{ a.estaturaPies }} pies {{ a.estaturaPulg }} pulg</b> ·
            Composición: <b style="color:var(--ambar)">{{ comp(a.composicion) }}</b> ·
            Objetivo: <b style="color:var(--ambar)">{{ obj(a.objetivo) }}</b> ·
            Sueño: <b style="color:var(--texto)">{{ sueno(a.horasSueno) }}</b> ·
            Estilo de vida: <b style="color:var(--texto)">{{ estilo(a.estiloVida) }}</b>
            @if (a.telefono) { · 📱 <b style="color:var(--texto)">{{ a.telefono }}</b> }
          </div>
          @if (a.objetivoTexto) {
            <div style="font-size:13px;margin-top:9px;color:var(--ambar);background:var(--ambar-fondo);border-radius:8px;padding:8px 12px;">🎯 <b>Meta:</b> {{ a.objetivoTexto }}</div>
          }
          @if (a.condiciones.trim()) {
            <div style="font-size:12.5px;margin-top:9px;color:var(--rojo);background:var(--rojo-fondo);border-radius:8px;padding:8px 12px;">⚠️ <b>Condiciones:</b> {{ a.condiciones }}</div>
          }
        </div>
        <button class="btn btn-suave" (click)="ui.formAtleta.set({ id: a.id })">✏️ Editar perfil</button>
      </div>
    </div>
    <div class="fila-acciones">
      <button class="btn" [class.btn-fantasma]="a.activo" [class.btn-verde]="!a.activo" (click)="alternarActivo()">
        {{ a.activo ? '⏸ Marcar como inactivo' : '▶ Reactivar atleta' }}
      </button>
      <button class="btn btn-peligro" (click)="eliminar()">🗑 Eliminar atleta</button>
    </div>
  `,
})
export class TabPerfil {
  readonly atleta = input.required<Atleta>();
  protected readonly ui = inject(UiService);
  private readonly datos = inject(DatosService);
  private readonly router = inject(Router);

  protected readonly dinero = fmtDinero;
  protected readonly fecha = fmtFecha;
  protected readonly comp = nombreComposicion;
  protected readonly obj = nombreObjetivo;
  protected readonly sueno = nombreSueno;
  protected readonly estilo = nombreEstiloVida;
  protected readonly dias = computed(() => diasConRutina(this.atleta()));
  protected readonly total = computed(() => this.atleta().pagos.reduce((s, p) => s + p.monto, 0));

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
