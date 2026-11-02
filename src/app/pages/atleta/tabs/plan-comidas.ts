import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth.service';
import { DatosService } from '../../../core/datos.service';
import { PdfService } from '../../../core/pdf.service';
import { Atleta, PlanComidasPersonal } from '../../../core/modelos';
import { EQUIVALENCIAS, TipoPlan, armarPlan, planDesdePersonal, planEditable, planRecomendado, planTexto } from '../../../core/planes-comida';
import { UiService } from '../../../core/ui.service';
import { fmtFecha, hoyISO } from '../../../core/util';
import { abrirWhatsApp } from '../../../core/whatsapp';
import { Icono } from '../../../shared/icono';

const EMOJIS = ['🍳', '🥞', '🥣', '🍗', '🍛', '🥗', '🍏', '🍌', '🥤', '🐟', '🍠', '🥩', '🍽️'];

/**
 * Plan de comidas: el sugerido según el objetivo (porciones ajustadas al atleta)
 * o el que el entrenador editó con el lápiz, que queda guardado en el atleta.
 */
@Component({
  selector: 'app-plan-comidas',
  imports: [FormsModule, Icono],
  template: `
    @let p = plan();
    <div class="titulo-seccion"><app-icono nombre="cubiertos" [tam]="16" /> {{ p.personal ? 'Plan de comidas del atleta' : 'Plan de comidas sugerido' }}</div>

    @if (!borrador()) {
      <div class="segmentado segmentado-ancho pc-tipos" role="tablist" aria-label="Tipo de plan">
        @for (t of tipos; track t.v) {
          <button role="tab" [class.activo]="tipo() === t.v" (click)="elegido.set(t.v)">
            {{ t.t }}@if (t.v === recomendado()) { <span class="pc-reco" title="Recomendado por el objetivo del atleta">★</span> }
            @if (personal()?.tipo === t.v) { <span class="pc-reco" title="Plan editado por ti"><app-icono nombre="editar" [tam]="12" /></span> }
          </button>
        }
      </div>

      <div class="tarjeta pc-cab">
        <div class="pc-cab-texto">
          <div class="pc-titulo">Plan de alimentación · {{ p.titulo }}</div>
          <span class="chip chip-verde">Objetivo: {{ p.objetivo.toLowerCase() }}</span>
          @if (p.personal) { <span class="chip chip-acero" style="margin-left:6px;"><app-icono nombre="editar" [tam]="11" /> Personalizado{{ p.editado ? ' · ' + fecha(p.editado) : '' }}</span> }
          @else if (tipo() !== recomendado()) { <span class="chip chip-gris" style="margin-left:6px;">No es el recomendado para su objetivo</span> }
        </div>
        <div class="pc-totales">
          <div><b>≈ {{ redondo10(p.kcal).toLocaleString() }}</b> kcal@if (p.meta) { <small> / meta {{ p.meta.toLocaleString() }}</small> }</div>
          <div><b>{{ redondo(p.prot) }} g</b> proteína@if (p.protMeta) { <small> / meta {{ p.protMeta[0] }}–{{ p.protMeta[1] }} g</small> }</div>
        </div>
        <div class="pc-editar-acciones">
          <button class="btn btn-suave btn-mini" (click)="editar()" [disabled]="!auth.vigente()" title="Modificar este plan para el atleta">
            <app-icono nombre="editar" [tam]="15" /> Editar
          </button>
          @if (p.personal) {
            <button class="btn btn-fantasma btn-mini" (click)="restaurar()" [disabled]="!auth.vigente() || guardando()" title="Borrar tus cambios y volver al plan sugerido">
              <app-icono nombre="recargar" [tam]="14" /> Volver al sugerido
            </button>
          }
        </div>
      </div>

      <div class="pc-comidas">
        @for (c of p.comidas; track $index; let i = $index) {
          <div class="pc-comida">
            <div class="pc-emoji" aria-hidden="true">{{ c.emoji }}</div>
            <div class="pc-cuerpo">
              <div class="pc-nombre">{{ i + 1 }}. {{ c.nombre }}@if (c.hora) { <span> ({{ c.hora }})</span> }</div>
              <ul>@for (it of c.items; track $index) { <li>{{ it.texto }}</li> }</ul>
              @if (c.prot || c.kcal) { <div class="pc-macros">Proteína aproximada: <b>{{ redondo(c.prot) }} g</b> · ≈ {{ redondo10(c.kcal) }} kcal</div> }
            </div>
          </div>
        }
      </div>

      <div class="pc-acciones">
        <button class="btn btn-primario" (click)="compartirPdf()" [disabled]="generando()" title="En el teléfono abre el menú para mandarlo por WhatsApp; en la computadora lo descarga">
          <app-icono nombre="compartir" [tam]="16" /> {{ generando() ? 'Generando…' : 'Compartir PDF' }}
        </button>
        <button class="btn btn-suave" (click)="descargarPdf()" [disabled]="generando()"><app-icono nombre="descargar" [tam]="16" /> Descargar PDF</button>
        <button class="btn btn-suave" (click)="enviar()" [disabled]="!atleta().telefono"><app-icono nombre="chat" [tam]="16" /> Enviar texto por WhatsApp</button>
        <button class="btn btn-fantasma" (click)="copiar()"><app-icono nombre="documento" [tam]="16" /> Copiar texto</button>
      </div>
      @if (!atleta().telefono) { <div class="pc-sin-tel">Agrega el teléfono del atleta para enviarle el texto directo a su WhatsApp.</div> }

      <details class="pc-equiv">
        <summary><app-icono nombre="recargar" [tam]="15" /> Equivalencias para variar el menú</summary>
        @for (e of equivalencias; track e[0]) { <div class="pc-eq"><b>{{ e[0] }}:</b> {{ e[1] }}</div> }
      </details>

      <div class="nota-info" style="margin-top:12px;">
        @if (p.personal) {
          Plan ajustado por ti. Las calorías y la proteína son las que escribiste en cada comida; la meta del atleta se muestra para comparar.
        } @else if (p.meta) {
          Las porciones de gramos y unidades se ajustaron a las calorías estimadas del atleta ({{ p.meta.toLocaleString() }} kcal). Los valores son aproximados.
          Usa <b>Editar</b> para cambiar alimentos, cantidades u horarios.
        } @else {
          Plantilla base sin ajustar: completa la <b>edad</b> y una <b>medición con peso</b> para adaptar las porciones al atleta.
        }
        Es un plan orientativo y no sustituye la valoración de un nutricionista, sobre todo si hay condiciones médicas o alergias.
      </div>
    } @else {
      @let b = borrador()!;
      <!-- Modo edición (lápiz) -->
      <div class="tarjeta pc-edicion">
        <div class="pc-ed-aviso"><app-icono nombre="editar" [tam]="16" /> <span>Estás editando el plan de <b>{{ atleta().nombre }}</b>. Al guardar, este será su plan en la app, el PDF y WhatsApp.</span></div>
        <div class="form-grid">
          <div class="campo"><label>Título del plan</label><input [(ngModel)]="b.titulo" maxlength="60" /></div>
          <div class="campo"><label>Objetivo</label><input [(ngModel)]="b.objetivo" maxlength="80" /></div>
        </div>

        @for (c of b.comidas; track $index; let i = $index) {
          <div class="pc-ed-comida">
            <div class="pc-ed-cab">
              <select class="pc-ed-emoji" [(ngModel)]="c.emoji" aria-label="Ícono de la comida">
                @for (e of emojis; track e) { <option [value]="e">{{ e }}</option> }
              </select>
              <input class="pc-ed-nombre" [(ngModel)]="c.nombre" maxlength="40" placeholder="Nombre (Desayuno, Almuerzo…)" aria-label="Nombre de la comida" />
              <input class="pc-ed-hora" [(ngModel)]="c.hora" maxlength="20" placeholder="Hora (7:00 a. m.)" aria-label="Hora" />
              <div class="pc-ed-orden">
                <button class="btn-x" type="button" (click)="mover(i, -1)" [disabled]="i === 0" title="Subir"><app-icono nombre="chevron" [tam]="14" style="transform:rotate(-90deg)" /></button>
                <button class="btn-x" type="button" (click)="mover(i, 1)" [disabled]="i === b.comidas.length - 1" title="Bajar"><app-icono nombre="chevron" [tam]="14" style="transform:rotate(90deg)" /></button>
                <button class="btn-x" type="button" (click)="b.comidas.splice(i, 1)" title="Quitar comida"><app-icono nombre="papelera" [tam]="15" /></button>
              </div>
            </div>
            <div class="pc-ed-items">
              @for (it of c.items; track $index; let j = $index) {
                <div class="pc-ed-item">
                  <span class="pc-ed-punto">•</span>
                  <input [ngModel]="it" (ngModelChange)="c.items[j] = $event" maxlength="90" placeholder="Ej. 150 g de pechuga de pollo" aria-label="Alimento" />
                  <button class="btn-x" type="button" (click)="c.items.splice(j, 1)" title="Quitar alimento"><app-icono nombre="cerrar" [tam]="14" /></button>
                </div>
              }
              <button class="btn btn-fantasma btn-mini" type="button" (click)="c.items.push('')"><app-icono nombre="mas" [tam]="14" /> Agregar alimento</button>
            </div>
            <div class="pc-ed-macros">
              <label>Proteína (g) <input type="number" min="0" max="400" [(ngModel)]="c.prot" /></label>
              <label>Calorías (kcal) <input type="number" min="0" max="5000" step="10" [(ngModel)]="c.kcal" /></label>
            </div>
          </div>
        }
        <button class="btn btn-suave" type="button" (click)="agregarComida()" [disabled]="b.comidas.length >= 8"><app-icono nombre="mas" [tam]="15" /> Agregar comida</button>

        <div class="pc-ed-pie">
          <span class="pc-ed-total">Total: ≈ {{ totalBorrador().kcal.toLocaleString() }} kcal · {{ totalBorrador().prot }} g de proteína</span>
          <button class="btn btn-fantasma" (click)="borrador.set(null)" [disabled]="guardando()">Cancelar</button>
          <button class="btn btn-primario" (click)="guardar()" [disabled]="guardando()"><app-icono nombre="guardar" [tam]="15" /> {{ guardando() ? 'Guardando…' : 'Guardar plan' }}</button>
        </div>
      </div>
    }
  `,
})
export class PlanComidas {
  readonly atleta = input.required<Atleta>();
  private readonly ui = inject(UiService);
  protected readonly auth = inject(AuthService);
  private readonly datos = inject(DatosService);
  private readonly pdf = inject(PdfService);
  protected readonly generando = signal(false);
  protected readonly guardando = signal(false);

  protected readonly tipos: { v: TipoPlan; t: string }[] = [
    { v: 'deficit', t: 'Déficit' }, { v: 'mantenimiento', t: 'Mantenimiento' }, { v: 'superavit', t: 'Superávit' },
  ];
  protected readonly emojis = EMOJIS;
  protected readonly equivalencias = EQUIVALENCIAS;
  protected readonly redondo = Math.round;
  protected readonly fecha = fmtFecha;
  protected redondo10(v: number) { return Math.round(v / 10) * 10; }

  /** Plan editado guardado en el atleta (si lo hay). */
  protected readonly personal = computed(() => this.atleta().planComidas ?? null);
  /** Elección manual del entrenador; si no eligió: su plan editado, o el recomendado. */
  protected readonly elegido = signal<TipoPlan | null>(null);
  protected readonly recomendado = computed(() => planRecomendado(this.atleta()));
  protected readonly tipo = computed(() => this.elegido() ?? this.personal()?.tipo ?? this.recomendado());
  protected readonly plan = computed(() => {
    const per = this.personal();
    return per && per.tipo === this.tipo() ? planDesdePersonal(this.atleta(), per) : armarPlan(this.atleta(), this.tipo());
  });

  /* ---------- Edición (lápiz) ---------- */
  protected readonly borrador = signal<PlanComidasPersonal | null>(null);

  /** Se recalcula en cada detección de cambios porque el borrador se edita en el sitio. */
  protected totalBorrador() {
    const b = this.borrador();
    const kcal = b ? b.comidas.reduce((s, c) => s + (Number(c.kcal) || 0), 0) : 0;
    const prot = b ? b.comidas.reduce((s, c) => s + (Number(c.prot) || 0), 0) : 0;
    return { kcal: Math.round(kcal), prot: Math.round(prot) };
  }

  editar() {
    this.borrador.set(planEditable(this.plan()));
  }

  mover(i: number, d: number) {
    const b = this.borrador()!;
    const [c] = b.comidas.splice(i, 1);
    b.comidas.splice(i + d, 0, c);
  }

  agregarComida() {
    this.borrador()!.comidas.push({ nombre: 'Nueva comida', hora: '', emoji: '🍽️', items: [''], kcal: 0, prot: 0 });
  }

  async guardar() {
    const b = this.borrador()!;
    const comidas = b.comidas
      .map((c) => ({
        ...c,
        nombre: c.nombre.trim() || 'Comida',
        hora: c.hora.trim(),
        items: c.items.map((t) => t.trim()).filter(Boolean),
        kcal: Math.max(0, Math.round(Number(c.kcal) || 0)),
        prot: Math.max(0, Math.round(Number(c.prot) || 0)),
      }))
      .filter((c) => c.items.length);
    if (!comidas.length) return this.ui.toast('Agrega al menos una comida con alimentos', 'err');
    const plan: PlanComidasPersonal = {
      tipo: b.tipo, titulo: b.titulo.trim() || 'Plan personalizado', objetivo: b.objetivo.trim() || 'Plan del entrenador',
      comidas, editado: hoyISO(),
    };
    this.guardando.set(true);
    try {
      await this.datos.actualizarAtleta(this.atleta().id, { planComidas: plan });
      this.elegido.set(plan.tipo);
      this.borrador.set(null);
      this.ui.toast('Plan guardado ✓');
    } catch (e) {
      this.ui.error(e);
    } finally {
      this.guardando.set(false);
    }
  }

  async restaurar() {
    const ok = await this.ui.confirmar('Volver al plan sugerido', 'Se borrarán tus cambios y el atleta verá otra vez el plan sugerido automáticamente.', 'Volver al sugerido');
    if (!ok) return;
    this.guardando.set(true);
    try {
      await this.datos.actualizarAtleta(this.atleta().id, { planComidas: null });
      this.elegido.set(null);
      this.ui.toast('Plan sugerido restaurado');
    } catch (e) {
      this.ui.error(e);
    } finally {
      this.guardando.set(false);
    }
  }

  /* ---------- Exportar ---------- */
  private texto() {
    const per = this.auth.perfil();
    return planTexto(this.plan(), this.atleta().nombre, per?.nombre || per?.negocio || '');
  }

  enviar() {
    if (!abrirWhatsApp(this.atleta(), this.texto())) this.ui.toast('El teléfono del atleta no es válido para WhatsApp', 'err');
  }

  async descargarPdf() {
    this.generando.set(true);
    try {
      await this.pdf.planComidas(this.atleta(), this.plan());
    } catch (e) {
      this.ui.error(e);
    } finally {
      this.generando.set(false);
    }
  }

  /** En el teléfono abre el menú de compartir con el PDF adjunto (WhatsApp, correo…); si no se puede, lo descarga. */
  async compartirPdf() {
    this.generando.set(true);
    try {
      const nombre = this.atleta().nombre.split(' ')[0];
      const r = await this.pdf.compartirPlanComidas(this.atleta(), this.plan(), `Hola ${nombre} 👋 Te comparto tu plan de alimentación.`);
      if (r === 'descargado') this.ui.toast('PDF descargado. Adjúntalo en el chat de WhatsApp del atleta.');
    } catch (e) {
      this.ui.error(e);
    } finally {
      this.generando.set(false);
    }
  }

  async copiar() {
    try {
      await navigator.clipboard.writeText(this.texto());
      this.ui.toast('Plan copiado ✓');
    } catch {
      this.ui.toast('No se pudo copiar en este navegador', 'err');
    }
  }
}
