import { Component, computed, inject, input, output } from '@angular/core';
import { CONSEJOS_OBJETIVO, OBJETIVOS, calcularNutricion, lecturaProgreso, nombreComposicion, nombreSueno, ultimaMedida } from '../../../core/dominio';
import { Atleta } from '../../../core/modelos';
import { UiService } from '../../../core/ui.service';

/** Recomendación nutricional según el objetivo (portado de tabNutricion). */
@Component({
  selector: 'app-tab-nutricion',
  template: `
    @let a = atleta();
    @if (a.condiciones.trim()) {
      <div class="tarjeta" style="border-color:rgba(229,96,96,.4);border-left:4px solid var(--rojo);margin-bottom:16px;">
        <div style="font-weight:800;color:var(--rojo);margin-bottom:5px;">⚠️ Condiciones médicas reportadas</div>
        <div style="font-size:13.5px;">{{ a.condiciones }}</div>
        <div style="font-size:12.5px;margin-top:9px;color:var(--texto-suave);">
          Estas recomendaciones son generales. Con una condición médica o discapacidad, el plan debe revisarse y ajustarse con un médico o nutricionista antes de aplicarlo.
        </div>
      </div>
    }

    @if (plan(); as p) {
      @let ult = ultima()!;
      <div class="tarjeta" style="margin-bottom:16px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
        <div style="font-size:30px;">{{ obj().ic }}</div>
        <div style="flex:1;min-width:200px;">
          <div style="font-weight:800;font-size:16px;">Objetivo: {{ obj().t }}</div>
          @if (a.objetivoTexto) { <div style="font-size:13px;color:var(--ambar);margin-top:2px;">🎯 {{ a.objetivoTexto }}</div> }
          <div style="font-size:13px;color:var(--texto-suave);margin-top:2px;">
            {{ a.edad }} años · {{ ult.peso }} lb ({{ p.kg.toFixed(1) }} kg) · {{ a.estaturaPies }}'{{ a.estaturaPulg }}" ·
            Actividad: {{ p.nivelTxt }} · {{ comp(a.composicion) }}
          </div>
        </div>
        <button class="btn btn-suave btn-mini" (click)="ui.formAtleta.set({ id: a.id })">Cambiar objetivo</button>
      </div>

      <div class="grid-metricas">
        <div class="metrica"><div class="etiqueta">Calorías diarias objetivo</div>
          <div class="valor">{{ p.cal.toLocaleString() }} kcal</div>
          <div class="sub">Gasto estimado: {{ redondo(p.tdee).toLocaleString() }} kcal · {{ p.ajusteTxt }}</div></div>
        <div class="metrica m-acero"><div class="etiqueta">Proteína</div>
          <div class="valor">{{ p.protMin }}–{{ p.protMax }} g</div>
          <div class="sub">≈ {{ p.protComida }} g por comida (4 comidas)</div></div>
        <div class="metrica m-verde"><div class="etiqueta">Carbohidratos</div>
          <div class="valor">≈ {{ p.carbG }} g</div><div class="sub">Prioriza alrededor del entrenamiento</div></div>
        <div class="metrica m-rojo"><div class="etiqueta">Grasas</div>
          <div class="valor">≈ {{ p.grasaG }} g</div><div class="sub">~27% de las calorías</div></div>
        <div class="metrica m-acero"><div class="etiqueta">Agua</div>
          <div class="valor">{{ p.aguaL }} L</div><div class="sub">Más en días de entrenamiento intenso</div></div>
      </div>

      @if (a.horasSueno === 'menos5' || a.horasSueno === '5a6') {
        <div class="nota-info" style="margin-bottom:14px;border-left:3px solid var(--rojo);">
          😴 <b>Sueño reportado: {{ sueno(a.horasSueno) }}.</b> Dormir poco frena la recuperación, la fuerza y la pérdida de grasa.
          Antes de exigir más en el gym o recortar más calorías, trabaja con el atleta rutinas de sueño (horario fijo, pantallas fuera, 7–9 h como meta).
        </div>
      }
      @if (a.composicion === 'grasa' && a.objetivo === 'ganar') {
        <div class="nota-info" style="margin-bottom:14px;">💡 El indicador de composición está en <b>volumen con grasa</b> y el objetivo en <b>ganar masa</b>.
          Valora hacer primero una fase corta de pérdida de grasa: el superávit rendirá mejor partiendo más definido.</div>
      }
      @if (a.composicion === 'delgado' && a.objetivo === 'perder') {
        <div class="nota-info" style="margin-bottom:14px;">💡 El indicador de composición está en <b>delgado</b> y el objetivo en <b>perder grasa</b>.
          Revisa si lo que conviene es una recomposición o ganar masa — un déficit sobre un cuerpo delgado sacrifica músculo.</div>
      }
      @if (lectura(); as l) {
        <div class="tarjeta" style="margin-bottom:16px;">
          <div style="font-weight:800;margin-bottom:6px;">📊 Lectura del progreso (primera vs última medición)</div>
          <div style="font-size:13.5px;color:var(--texto-suave);">
            Peso: <b style="color:var(--texto)">{{ l.dPeso > 0 ? '+' : '' }}{{ l.dPeso }} lb</b>
            @if (l.dAbd !== null) { · Abdomen (ombligo): <b style="color:var(--texto)">{{ l.dAbd > 0 ? '+' : '' }}{{ l.dAbd }} in</b> }
            — {{ l.lectura }}
          </div>
        </div>
      }

      <div class="titulo-seccion">🍽️ Recomendaciones para {{ obj().t.toLowerCase() }}</div>
      @for (t of consejos(); track $index) {
        <div class="tarjeta" style="margin-bottom:9px;padding:13px 16px;font-size:13.5px;display:flex;gap:11px;align-items:flex-start;">
          <span style="color:var(--ambar);font-weight:800;">▸</span><span>{{ t }}</span>
        </div>
      }
      <div class="nota-info" style="margin-top:16px;">
        Cálculo orientativo basado en la fórmula Mifflin-St Jeor con el peso, estatura, edad, género y días de rutina del atleta.
        No sustituye la valoración de un médico o nutricionista, especialmente si existen condiciones de salud.
      </div>
    } @else {
      <div class="vacio">
        <span class="ic">🍎</span>
        <h3>Faltan datos para calcular la recomendación</h3>
        <p>
          @if (!a.edad) { La <b>edad</b> del atleta }
          @if (!a.edad && !ultima()) { · }
          @if (!ultima()) { Al menos una <b>medición con peso</b> }
        </p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          @if (!a.edad) { <button class="btn btn-primario" (click)="ui.formAtleta.set({ id: a.id })">✏️ Completar perfil</button> }
          @if (!ultima()) { <button class="btn btn-suave" (click)="irA.emit('medidas')">📏 Ir a Medidas</button> }
        </div>
      </div>
    }
  `,
})
export class TabNutricion {
  readonly atleta = input.required<Atleta>();
  readonly irA = output<string>();
  protected readonly ui = inject(UiService);

  protected readonly comp = nombreComposicion;
  protected readonly sueno = nombreSueno;
  protected readonly redondo = Math.round;
  protected readonly ultima = computed(() => ultimaMedida(this.atleta()));
  protected readonly plan = computed(() => calcularNutricion(this.atleta()));
  protected readonly obj = computed(() => OBJETIVOS[this.atleta().objetivo] || OBJETIVOS.recomp);
  protected readonly consejos = computed(() => CONSEJOS_OBJETIVO[this.atleta().objetivo] || CONSEJOS_OBJETIVO.recomp);
  protected readonly lectura = computed(() => lecturaProgreso(this.atleta()));
}
