import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { DatosService } from '../../core/datos.service';
import { RespaldoNormalizado, leerRespaldo } from '../../core/respaldo';
import { UiService } from '../../core/ui.service';
import { fmtFecha } from '../../core/util';
import { Modal } from '../../shared/modal';
import { Icono } from '../../shared/icono';

/** Sube a la nube el respaldo JSON que descargaba la versión anterior (HTML con localStorage). */
@Component({
  selector: 'app-importar-respaldo',
  imports: [Modal, Icono],
  template: `
    <div class="tarjeta" style="display:flex;flex-direction:column;gap:12px;">
      <div style="font-size:13.5px;color:var(--texto-suave);">
        ¿Usabas la versión anterior de la app (GymTracker Pro, el archivo HTML)? Sube aquí el respaldo que descargabas con el botón de guardar
        (<b>GymTracker_Respaldo_….json</b>) y pasamos tus atletas, medidas, rutinas, asistencia, objetivos y pagos a tu cuenta.
      </div>
      <label class="zona-archivo" [class.deshabilitada]="!auth.vigente()">
        <app-icono nombre="subir" [tam]="22" />
        <span><b>Elegir archivo de respaldo</b><small>Archivo .json de la versión anterior</small></span>
        <input type="file" accept=".json,application/json" hidden (change)="leer($event)" [disabled]="!auth.vigente()" />
      </label>
      <div class="nota-info">Los atletas se <b>agregan</b> a los que ya tienes (no se borra nada). Si importas el mismo archivo dos veces, quedarán duplicados.</div>
    </div>

    @if (respaldo(); as r) {
      <app-modal titulo="Importar respaldo" (cerrar)="respaldo.set(null)">
        <div style="font-size:13.5px;color:var(--texto-suave);">
          Respaldo{{ r.fecha ? ' del ' + fecha(r.fecha) : '' }} con:
          <ul style="margin:8px 0 0 18px;display:flex;flex-direction:column;gap:3px;">
            <li><b style="color:var(--texto)">{{ r.atletas.length }}</b> atleta{{ r.atletas.length === 1 ? '' : 's' }}
              ({{ activosArchivo() }} activo{{ activosArchivo() === 1 ? '' : 's' }})</li>
            <li><b style="color:var(--texto)">{{ totalMedidas() }}</b> mediciones · <b style="color:var(--texto)">{{ totalPagos() }}</b> pagos</li>
            <li><b style="color:var(--texto)">{{ r.grupos.length }}</b> grupo{{ r.grupos.length === 1 ? '' : 's' }} ·
              <b style="color:var(--texto)">{{ r.ejercicios.length }}</b> ejercicio{{ r.ejercicios.length === 1 ? '' : 's' }} personalizado{{ r.ejercicios.length === 1 ? '' : 's' }}</li>
            @if (r.logo && !auth.perfil()?.logo_url) { <li>El logo del negocio</li> }
          </ul>
        </div>
        @if (seImportan() < r.atletas.length) {
          <div class="error-form">
            Tu plan <b>{{ auth.plan()?.nombre }}</b> permite {{ auth.plan()?.max_atletas }} atletas y ya tienes {{ datos.atletas().length }}.
            Se importarán <b>{{ seImportan() }}</b> (primero los activos). Mejora tu plan para traerlos todos.
          </div>
        }
        <ng-container pie>
          <button class="btn btn-fantasma" (click)="respaldo.set(null)">Cancelar</button>
          <button class="btn btn-primario" (click)="importar(r)" [disabled]="importando() || seImportan() === 0">
            {{ importando() ? 'Importando…' : 'Importar ' + seImportan() + ' atleta' + (seImportan() === 1 ? '' : 's') }}
          </button>
        </ng-container>
      </app-modal>
    }
  `,
})
export class ImportarRespaldo {
  protected readonly auth = inject(AuthService);
  protected readonly datos = inject(DatosService);
  private readonly ui = inject(UiService);
  private readonly router = inject(Router);
  protected readonly fecha = fmtFecha;

  protected readonly respaldo = signal<RespaldoNormalizado | null>(null);
  protected readonly importando = signal(false);

  protected readonly activosArchivo = computed(() => this.respaldo()?.atletas.filter((a) => a.activo).length ?? 0);
  protected readonly totalMedidas = computed(() => this.respaldo()?.atletas.reduce((s, a) => s + a.medidas.length, 0) ?? 0);
  protected readonly totalPagos = computed(() => this.respaldo()?.atletas.reduce((s, a) => s + a.pagos.length, 0) ?? 0);

  /** Cupos libres según el plan (null = ilimitado). */
  private readonly cupos = computed(() => {
    const max = this.auth.plan()?.max_atletas;
    return max == null ? null : Math.max(0, max - this.datos.atletas().length);
  });
  protected readonly seImportan = computed(() => {
    const total = this.respaldo()?.atletas.length ?? 0;
    const c = this.cupos();
    return c === null ? total : Math.min(total, c);
  });

  leer(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = ''; // permite volver a elegir el mismo archivo
    if (!archivo) return;
    if (archivo.size > 20 * 1024 * 1024) return this.ui.toast('El archivo es demasiado grande', 'err');
    const lector = new FileReader();
    lector.onload = () => {
      try {
        const r = leerRespaldo(String(lector.result));
        if (!r.atletas.length) return this.ui.toast('El respaldo no tiene atletas para importar', 'err');
        this.respaldo.set(r);
      } catch (e) {
        this.ui.toast((e as Error).message, 'err');
      }
    };
    lector.onerror = () => this.ui.toast('No se pudo leer el archivo', 'err');
    lector.readAsText(archivo);
  }

  async importar(r: RespaldoNormalizado) {
    // Si no caben todos, primero los activos
    const atletas = [...r.atletas].sort((a, b) => Number(b.activo) - Number(a.activo)).slice(0, this.seImportan());
    this.importando.set(true);
    try {
      const res = await this.datos.importarRespaldo({ grupos: r.grupos, atletas, ejercicios: r.ejercicios });
      if (r.logo && !this.auth.perfil()?.logo_url) {
        await this.auth.actualizarPerfil({ logo_url: r.logo }).catch(() => undefined);
      }
      this.respaldo.set(null);
      this.ui.toast(`Importados ${res.atletas} atletas, ${res.medidas} mediciones y ${res.pagos} pagos ✓`);
      this.router.navigateByUrl('/panel');
    } catch (e) {
      this.ui.error(e);
    } finally {
      this.importando.set(false);
    }
  }
}
