import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DatosService } from '../../core/datos.service';
import { derivarObjetivo } from '../../core/dominio';
import { Atleta, Composicion, Genero, Objetivo } from '../../core/modelos';
import { UiService } from '../../core/ui.service';
import { MESES_ES, edadDesde, hoyISO } from '../../core/util';
import { Modal } from '../../shared/modal';
import { Icono } from '../../shared/icono';
import { UnidadesService, estaturaCm, estaturaDesdeCm } from '../../core/unidades';

/** Modal Nuevo / Editar atleta (portado de abrirModalAtleta). */
@Component({
  selector: 'app-atleta-form',
  imports: [FormsModule, Modal, Icono],
  template: `
    <app-modal [titulo]="atletaId() ? 'Editar Atleta' : 'Nuevo Atleta'" (cerrar)="cerrar.emit()">
      <div class="campo"><label>Nombre completo</label>
        <input type="text" [(ngModel)]="f.nombre" placeholder="Ej. Carlos Martínez" /></div>
      <div class="campo"><label>Teléfono (WhatsApp)</label>
        <input type="tel" [(ngModel)]="f.telefono" placeholder="809-555-1234" /></div>
      <div class="form-grid">
        <div class="campo"><label>Género (modelo visual)</label>
          <select [(ngModel)]="f.genero">
            <option value="hombre">Hombre</option>
            <option value="mujer">Mujer</option>
          </select></div>
        @if (u.metrico()) {
          <div class="campo"><label>Estatura (cm)</label>
            <input type="number" min="100" max="230" placeholder="Ej. 172" [(ngModel)]="f.estaturaCm" /></div>
        } @else {
          <div class="campo"><label>Estatura (pies y pulgadas)</label>
            <div class="fila-doble">
              <input type="number" min="3" max="7" placeholder="Pies" [(ngModel)]="f.estaturaPies" />
              <input type="number" min="0" max="11" placeholder="Pulg" [(ngModel)]="f.estaturaPulg" />
            </div></div>
        }
      </div>
      <div class="form-grid">
        <div class="campo"><label>Fecha de nacimiento</label>
          <!-- Día / mes / año por separado: el calendario nativo cambia de orden según el idioma del equipo (mm/dd) -->
          <div class="fecha-tres">
            <select [(ngModel)]="nac.dia" (ngModelChange)="alCambiarNacimiento()" aria-label="Día de nacimiento">
              <option [ngValue]="null">Día</option>
              @for (d of diasNac(); track d) { <option [ngValue]="d">{{ d }}</option> }
            </select>
            <select [(ngModel)]="nac.mes" (ngModelChange)="alCambiarNacimiento()" aria-label="Mes de nacimiento">
              <option [ngValue]="null">Mes</option>
              @for (m of meses; track $index) { <option [ngValue]="$index + 1">{{ m }}</option> }
            </select>
            <select [(ngModel)]="nac.anio" (ngModelChange)="alCambiarNacimiento()" aria-label="Año de nacimiento">
              <option [ngValue]="null">Año</option>
              @for (y of anios; track y) { <option [ngValue]="y">{{ y }}</option> }
            </select>
          </div>
          @if (nac.dia || nac.mes || nac.anio) {
            <button type="button" class="enlace-mini" (click)="borrarNacimiento()">Quitar fecha</button>
          }
        </div>
        <div class="campo"><label>Edad (años)</label>
          <input type="number" min="10" max="99" placeholder="Auto con la fecha" [(ngModel)]="f.edad" /></div>
        <div class="campo"><label>Objetivo a lograr</label>
          <select [(ngModel)]="f.objetivo">
            <option value="">— Según composición —</option>
            <option value="perder">Perder grasa</option>
            <option value="ganar">Ganar masa muscular</option>
            <option value="recomp">Recomposición corporal</option>
            <option value="mantener">Mantenimiento</option>
          </select></div>
      </div>
      <div class="campo"><label>Grupo (horario o segmentación)</label>
        <select [(ngModel)]="f.grupoId">
          <option value="">— Sin grupo —</option>
          @for (g of datos.grupos(); track g.id) { <option [value]="g.id">{{ g.nombre }}</option> }
          <option value="__nuevo__">+ Crear nuevo grupo...</option>
        </select>
        @if (f.grupoId === '__nuevo__') {
          <input type="text" style="margin-top:8px;" [(ngModel)]="grupoNuevo"
            placeholder='Nombre del grupo. Ej. "Mañana", "Tarde", "Online", "Sábados"' />
        }
      </div>
      <div class="form-grid">
        <div class="campo"><label>¿Cuánto tiempo duerme?</label>
          <select [(ngModel)]="f.horasSueno">
            <option value="">— Seleccionar —</option>
            <option value="menos5">Menos de 5 horas</option>
            <option value="5a6">5 a 6 horas</option>
            <option value="7a8">7 a 8 horas</option>
            <option value="mas8">Más de 8 horas</option>
          </select></div>
        <div class="campo"><label>¿Qué estilo de vida lleva?</label>
          <select [(ngModel)]="f.estiloVida">
            <option value="">— Seleccionar —</option>
            <option value="sedentario">Sedentario (oficina, mucho tiempo sentado)</option>
            <option value="ligero">Ligeramente activo (camina algo a diario)</option>
            <option value="activo">Activo (de pie / camina mucho)</option>
            <option value="muyactivo">Muy activo (trabajo físico)</option>
          </select></div>
      </div>
      <div class="campo"><label>Meta específica a alcanzar</label>
        <input type="text" [(ngModel)]="f.objetivoTexto"
          [placeholder]="u.metrico() ? 'Ej. Bajar a 80 kg, Sumar 5 cm de brazo, Correr 5K sin parar' : 'Ej. Bajar a 180 lb, Sumar 2 pulgadas de brazo, Correr 5K sin parar'" /></div>
      <div class="campo"><label>Discapacidad / enfermedad / lesiones</label>
        <textarea style="min-height:64px;" [(ngModel)]="f.condiciones"
          placeholder="Ej. Hipertensión controlada, lesión de rodilla derecha, diabetes tipo 2... (dejar vacío si no aplica)"></textarea></div>
      <div class="campo"><label>Indicador de composición corporal</label>
        <div class="selector-comp">
          @for (o of composiciones; track o.v) {
            <div class="opcion-comp" [class.activa]="f.composicion === o.v" (click)="f.composicion = o.v">
              <span class="ic"><app-icono [nombre]="o.ic" [tam]="26" /></span><span class="t">{{ o.t }}</span><br /><span class="s">{{ o.s }}</span>
            </div>
          }
        </div>
      </div>
      <ng-container pie>
        <button class="btn btn-fantasma" (click)="cerrar.emit()">Cancelar</button>
        <button class="btn btn-primario" (click)="guardar()" [disabled]="guardando()">
          {{ atletaId() ? 'Guardar cambios' : 'Crear atleta' }}
        </button>
      </ng-container>
    </app-modal>
  `,
})
export class AtletaForm implements OnInit {
  readonly atletaId = input<string | null>(null);
  readonly cerrar = output<void>();
  protected readonly datos = inject(DatosService);
  private readonly ui = inject(UiService);
  protected readonly u = inject(UnidadesService);
  private readonly router = inject(Router);
  protected readonly guardando = signal(false);
  protected grupoNuevo = '';

  protected readonly composiciones: { v: Composicion; ic: string; t: string; s: string }[] = [
    { v: 'delgado', ic: 'cuerpo-delgado', t: 'Delgado / Flaco', s: 'Ectomorfo' },
    { v: 'grasa', ic: 'cuerpo-grueso', t: 'Volumen con Grasa', s: 'Endomorfo' },
    { v: 'musculo', ic: 'cuerpo-atletico', t: 'Volumen Muscular', s: 'Mesomorfo' },
  ];

  protected f = {
    nombre: '', telefono: '', genero: 'hombre' as Genero, estaturaPies: 5, estaturaPulg: 8, estaturaCm: 173 as number | null,
    fechaNacimiento: '', edad: null as number | null, objetivo: '' as Objetivo | '', grupoId: '',
    horasSueno: '', estiloVida: '', objetivoTexto: '', condiciones: '', composicion: 'musculo' as Composicion,
  };

  ngOnInit() {
    const id = this.atletaId();
    const a = id ? this.datos.atleta(id) : undefined;
    if (a) {
      this.f = {
        nombre: a.nombre, telefono: a.telefono, genero: a.genero, estaturaPies: a.estaturaPies,
        estaturaPulg: Math.round(Number(a.estaturaPulg) * 10) / 10, estaturaCm: estaturaCm(a.estaturaPies, a.estaturaPulg), fechaNacimiento: a.fechaNacimiento, edad: a.edad, objetivo: a.objetivo,
        grupoId: a.grupoId, horasSueno: a.horasSueno, estiloVida: a.estiloVida, objetivoTexto: a.objetivoTexto,
        condiciones: a.condiciones, composicion: a.composicion,
      };
      const [y, m, d] = (a.fechaNacimiento || '').split('-').map(Number);
      if (y && m && d) this.nac = { dia: d, mes: m, anio: y };
    }
  }

  /* ---------- Fecha de nacimiento (día / mes / año) ---------- */
  protected readonly meses = MESES_ES;
  protected readonly anios = Array.from({ length: 91 }, (_, i) => new Date().getFullYear() - 5 - i);
  protected nac: { dia: number | null; mes: number | null; anio: number | null } = { dia: null, mes: null, anio: null };

  /** Días del mes elegido (28–31); sin mes o año, 31. */
  protected diasNac() {
    const total = this.nac.mes ? new Date(this.nac.anio ?? 2000, this.nac.mes, 0).getDate() : 31;
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  alCambiarNacimiento() {
    const { dia, mes, anio } = this.nac;
    // Si se cambia a un mes más corto (31 → febrero), el día se ajusta al último válido
    if (dia && mes && anio) {
      const max = new Date(anio, mes, 0).getDate();
      if (dia > max) this.nac.dia = max;
    }
    this.f.fechaNacimiento = this.nac.dia && mes && anio ? `${anio}-${String(mes).padStart(2, '0')}-${String(this.nac.dia).padStart(2, '0')}` : '';
    const e = this.f.fechaNacimiento ? edadDesde(this.f.fechaNacimiento) : null;
    if (e !== null) this.f.edad = e;
  }

  borrarNacimiento() {
    this.nac = { dia: null, mes: null, anio: null };
    this.f.fechaNacimiento = '';
  }

  async guardar() {
    const nombre = this.f.nombre.trim();
    if (!nombre) return this.ui.toast('Escribe el nombre del atleta', 'err');
    this.guardando.set(true);
    try {
      let grupoId = this.f.grupoId;
      if (grupoId === '__nuevo__') {
        const nombreG = this.grupoNuevo.trim();
        if (!nombreG) {
          this.ui.toast('Escribe el nombre del nuevo grupo', 'err');
          return;
        }
        grupoId = (await this.datos.crearGrupo(nombreG)).id;
      }
      const edadAuto = this.f.fechaNacimiento ? edadDesde(this.f.fechaNacimiento) : null;
      const edad = edadAuto ?? (Number(this.f.edad) > 0 ? Number(this.f.edad) : null);
      // En métrico se captura en cm; en la base se guarda en pies + pulgadas
      const est = this.u.metrico() && Number(this.f.estaturaCm) > 0
        ? estaturaDesdeCm(Number(this.f.estaturaCm))
        : { pies: Number(this.f.estaturaPies) || 5, pulg: Number(this.f.estaturaPulg) || 0 };
      const datos: Partial<Atleta> = {
        grupoId,
        nombre,
        genero: this.f.genero,
        estaturaPies: est.pies,
        estaturaPulg: est.pulg,
        composicion: this.f.composicion,
        edad,
        condiciones: this.f.condiciones.trim(),
        objetivo: this.f.objetivo || derivarObjetivo(this.f.composicion),
        objetivoTexto: this.f.objetivoTexto.trim(),
        telefono: this.f.telefono.trim(),
        fechaNacimiento: this.f.fechaNacimiento,
        horasSueno: this.f.horasSueno,
        estiloVida: this.f.estiloVida,
      };
      const id = this.atletaId();
      if (id) {
        await this.datos.actualizarAtleta(id, datos);
        this.ui.toast('Perfil actualizado ✓');
      } else {
        const nuevo = await this.datos.crearAtleta({ ...datos, activo: true, fechaRegistro: hoyISO() });
        this.ui.toast('Atleta creado ✓');
        this.router.navigate(['/atletas', nuevo.id]);
      }
      this.cerrar.emit();
    } catch (e) {
      this.ui.error(e);
    } finally {
      this.guardando.set(false);
    }
  }
}
