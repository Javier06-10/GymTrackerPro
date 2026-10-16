// @ts-nocheck
/* ============================================================
   📖 MANUAL DEL ENTRENADOR PERSONAL — VP FITNESS
   Anatomía funcional, biomecánica y catálogo de ejercicios.
   Contenido aportado por el equipo de formación de VP Fitness
   (HTML estático propio, sin datos del usuario).
   ============================================================ */

import { CapituloManual, calloutPr, tablaM } from './manual';

/** Capítulos previstos; los que aún no tienen contenido se listan como "en preparación". */
const INDICE: [string, boolean][] = [
  ['Capítulo 1. Fundamentos de anatomía y biomecánica', true],
  ['Capítulo 2. Entrenamiento del pecho', false],
  ['Capítulo 3. Entrenamiento de piernas y glúteos', false],
  ['Capítulo 4. Entrenamiento de espalda', false],
  ['Capítulo 5. Entrenamiento de bíceps', false],
  ['Capítulo 6. Entrenamiento de tríceps', false],
  ['Capítulo 7. Selección de ejercicios y programación', false],
  ['Capítulo 8. Técnica, seguridad y evaluación del cliente', false],
  ['Glosario de términos técnicos', false],
];

export function construirManualVP(): CapituloManual[] {
return [
{id:"vp-intro", t:"Introducción", h:`
<h2>Manual del Entrenador Personal</h2>
<p><b>Anatomía funcional, biomecánica y catálogo de ejercicios de musculación</b><br>
<span style="color:var(--texto-suave);font-size:13px;">GymTracker Pro · VP Fitness — Autor: Equipo de formación VP Fitness</span></p>

<h3>Índice general</h3>
<ul>
  <li>Introducción</li>
  ${INDICE.map(([t, listo]) => `<li>${t}${listo ? '' : ' <span style="color:var(--tenue);font-size:12px;">· en preparación</span>'}</li>`).join('')}
</ul>

<h3>Introducción</h3>
<p>El entrenamiento personal requiere mucho más que conocer los nombres de los ejercicios o aprender a utilizar las máquinas de un gimnasio. Un buen entrenador debe comprender cómo funciona el cuerpo humano, qué músculos participan en cada movimiento, cómo se aplica la resistencia y de qué manera se puede adaptar un ejercicio a las necesidades de cada cliente.</p>
<p>Este manual ha sido diseñado para servir como material de consulta y formación para entrenadores personales, especialmente aquellos que desean mejorar sus conocimientos de anatomía, biomecánica y programación del entrenamiento de fuerza.</p>
<p>A lo largo de sus capítulos se estudian los principales ejercicios de pecho, piernas, glúteos, espalda, bíceps y tríceps. Cada ejercicio se describe mediante su patrón de movimiento, músculos principales, músculos secundarios, estabilizadores y recomendaciones técnicas.</p>
<p>El contenido puede utilizarse para diseñar rutinas, explicar ejercicios a los clientes y construir una biblioteca de ejercicios dentro de una aplicación de entrenamiento como GymTracker Pro.</p>

<h3>Objetivos del manual</h3>
<ol>
  <li>Comprender la función de los principales grupos musculares.</li>
  <li>Identificar los músculos que producen y ayudan a producir cada movimiento.</li>
  <li>Analizar la biomecánica básica de los ejercicios.</li>
  <li>Seleccionar ejercicios según los objetivos del cliente.</li>
  <li>Mejorar la técnica y reducir errores frecuentes.</li>
  <li>Aplicar principios de progresión, recuperación y seguimiento.</li>
  <li>Reconocer cuándo un ejercicio debe modificarse por molestias o limitaciones individuales.</li>
</ol>
${calloutPr('<b>Principio fundamental:</b> ningún ejercicio debe seleccionarse únicamente por su nombre o por la sensación de quemazón muscular. La decisión debe considerar la función muscular, la resistencia, la técnica, el objetivo y la capacidad de la persona.')}
`},
{id:"vp-fundamentos", t:"Anatomía y biomecánica", h:`
<h2>Capítulo 1 · Fundamentos de anatomía y biomecánica</h2>

<h3>1.1 ¿Qué es la anatomía muscular?</h3>
<p>La anatomía muscular estudia la ubicación, estructura y función de los músculos del cuerpo. Para el entrenador personal, conocerla permite comprender qué músculos participan en un movimiento y cómo diseñar ejercicios que los desarrollen.</p>
<p>Los músculos esqueléticos producen movimiento mediante su capacidad de generar tensión y transmitir fuerza a través de los tendones.</p>

<h3>1.2 ¿Qué es la biomecánica?</h3>
<p>La biomecánica estudia las fuerzas que actúan sobre el cuerpo y cómo estas producen o controlan el movimiento. En el gimnasio permite analizar:</p>
<ul>
  <li>La dirección de la resistencia.</li>
  <li>El movimiento de las articulaciones.</li>
  <li>La posición del cuerpo.</li>
  <li>La longitud muscular durante el ejercicio.</li>
  <li>Los brazos de momento y las demandas de fuerza.</li>
  <li>La estabilidad y el control del movimiento.</li>
</ul>
<p>Por ejemplo, en un press de banca, el pectoral mayor participa en el movimiento del hombro, mientras que el tríceps extiende el codo.</p>

<h3>1.3 Clasificación de la participación muscular</h3>
${tablaM(["Función", "Qué hace"], [
  ["<b>Músculo principal o agonista</b>", "Produce una parte importante de la fuerza necesaria para ejecutar el movimiento."],
  ["<b>Sinergista</b>", "Ayuda al músculo principal a producir el movimiento."],
  ["<b>Estabilizador</b>", "Contribuye a controlar una articulación o mantener una posición corporal."],
])}
<p>La función de un músculo puede cambiar según el ejercicio, la postura, el agarre y la dirección de la resistencia.</p>

<h3>1.4 Movimientos articulares fundamentales</h3>
${tablaM(["Movimiento", "Descripción", "Ejemplo"], [
  ["Flexión", "Disminución del ángulo articular", "Curl de bíceps"],
  ["Extensión", "Aumento del ángulo articular", "Extensión de tríceps en polea"],
  ["Abducción", "El segmento se aleja de la línea media del cuerpo", "Elevación lateral"],
  ["Aducción", "El segmento se acerca a la línea media del cuerpo", "Jalón al pecho"],
  ["Abducción horizontal", "Con el brazo a la altura del hombro, se lleva hacia atrás", "Pájaros / aperturas invertidas"],
  ["Aducción horizontal", "Con el brazo a la altura del hombro, se lleva hacia delante", "Aperturas con mancuernas"],
  ["Rotación interna", "Giro del segmento hacia la línea media", "Rotación interna en polea"],
  ["Rotación externa", "Giro del segmento hacia fuera", "Face pull"],
])}
`},
];
}
