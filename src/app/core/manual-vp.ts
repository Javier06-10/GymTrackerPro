// @ts-nocheck
/* ============================================================
   📖 MANUAL DEL ENTRENADOR PERSONAL — VP FITNESS
   Anatomía funcional, biomecánica y catálogo de ejercicios.
   Contenido aportado por el equipo de formación de VP Fitness
   (HTML estático propio, sin datos del usuario).
   ============================================================ */

import { iconoSvg } from './iconos';
import { CapituloManual, calloutPr, calloutSg, tablaM } from './manual';

/** Ficha de ejercicio del catálogo: número, nombre y filas [etiqueta, texto]; nota opcional al pie. */
function ej(n: number, nombre: string, filas: [string, string][], nota = '') {
  return `<div class="ficha-ej ficha-vp">
    <div class="ficha-cab"><span class="ficha-nombre">${n}. ${nombre}</span></div>
    <dl class="ficha-vp-datos">${filas.map(([e, t]) => `<dt>${e}</dt><dd>${t}</dd>`).join('')}</dl>
    ${nota ? `<p class="ficha-vp-nota">${nota}</p>` : ''}
  </div>`;
}
const lista = (items: string[]) => `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
const listaN = (items: string[]) => `<ol>${items.map((i) => `<li>${i}</li>`).join('')}</ol>`;
const P = 'Principales', P1 = 'Principal', S = 'Secundarios', S1 = 'Secundario', E = 'Estabilizadores', B = 'Biomecánica', T = 'Técnica';

export function construirManualVP(): CapituloManual[] {
return [
{id:"vp-intro", t:"Introducción", h:`
<h2>Manual del Entrenador Personal</h2>
<p><b>Anatomía funcional, biomecánica y catálogo de ejercicios de musculación</b><br>
<span style="color:var(--texto-suave);font-size:13px;">Coach Fénix · VP Fitness — Autor: Equipo de formación VP Fitness</span></p>

<h3>Índice general</h3>
${lista(['Introducción', 'Capítulo 1. Fundamentos de anatomía y biomecánica', 'Capítulo 2. Entrenamiento del pecho', 'Capítulo 3. Entrenamiento de piernas y glúteos', 'Capítulo 4. Entrenamiento de espalda', 'Capítulo 5. Entrenamiento de bíceps', 'Capítulo 6. Entrenamiento de tríceps', 'Capítulo 7. Selección de ejercicios y programación', 'Capítulo 8. Técnica, seguridad y evaluación del cliente', 'Glosario de términos técnicos', 'Conclusión y referencias'])}

<h3>Introducción</h3>
<p>El entrenamiento personal requiere mucho más que conocer los nombres de los ejercicios o aprender a utilizar las máquinas de un gimnasio. Un buen entrenador debe comprender cómo funciona el cuerpo humano, qué músculos participan en cada movimiento, cómo se aplica la resistencia y de qué manera se puede adaptar un ejercicio a las necesidades de cada cliente.</p>
<p>Este manual ha sido diseñado para servir como material de consulta y formación para entrenadores personales, especialmente aquellos que desean mejorar sus conocimientos de anatomía, biomecánica y programación del entrenamiento de fuerza.</p>
<p>A lo largo de sus capítulos se estudian los principales ejercicios de pecho, piernas, glúteos, espalda, bíceps y tríceps. Cada ejercicio se describe mediante su patrón de movimiento, músculos principales, músculos secundarios, estabilizadores y recomendaciones técnicas.</p>
<p>El contenido puede utilizarse para diseñar rutinas, explicar ejercicios a los clientes y construir una biblioteca de ejercicios dentro de una aplicación de entrenamiento como Coach Fénix.</p>

<h3>Objetivos del manual</h3>
${listaN(['Comprender la función de los principales grupos musculares.', 'Identificar los músculos que producen y ayudan a producir cada movimiento.', 'Analizar la biomecánica básica de los ejercicios.', 'Seleccionar ejercicios según los objetivos del cliente.', 'Mejorar la técnica y reducir errores frecuentes.', 'Aplicar principios de progresión, recuperación y seguimiento.', 'Reconocer cuándo un ejercicio debe modificarse por molestias o limitaciones individuales.'])}
${calloutPr('<b>Principio fundamental:</b> ningún ejercicio debe seleccionarse únicamente por su nombre o por la sensación de quemazón muscular. La decisión debe considerar la función muscular, la resistencia, la técnica, el objetivo y la capacidad de la persona.')}
`},
{id:"vp-fundamentos", t:"Anatomía y biomecánica", h:`
<h2>Capítulo 1 · Fundamentos de anatomía y biomecánica</h2>

<h3>1.1 ¿Qué es la anatomía muscular?</h3>
<p>La anatomía muscular estudia la ubicación, estructura y función de los músculos del cuerpo. Para el entrenador personal, conocerla permite comprender qué músculos participan en un movimiento y cómo diseñar ejercicios que los desarrollen.</p>
<p>Los músculos esqueléticos producen movimiento mediante su capacidad de generar tensión y transmitir fuerza a través de los tendones.</p>

<h3>1.2 ¿Qué es la biomecánica?</h3>
<p>La biomecánica estudia las fuerzas que actúan sobre el cuerpo y cómo estas producen o controlan el movimiento. En el gimnasio permite analizar:</p>
${lista(['La dirección de la resistencia.', 'El movimiento de las articulaciones.', 'La posición del cuerpo.', 'La longitud muscular durante el ejercicio.', 'Los brazos de momento y las demandas de fuerza.', 'La estabilidad y el control del movimiento.'])}
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
  ["Extensión", "Aumento del ángulo articular", "Extensión de tríceps"],
  ["Abducción", "Alejamiento de la línea media", "Abducción de cadera"],
  ["Aducción", "Acercamiento a la línea media", "Aducción de cadera"],
  ["Aducción horizontal", "Brazo hacia el centro del cuerpo", "Apertura inversa en sentido contrario, press de pecho"],
  ["Extensión de cadera", "Muslo hacia atrás respecto a la pelvis", "Hip thrust"],
  ["Flexión de rodilla", "Talón hacia la parte posterior del muslo", "Curl femoral"],
  ["Extensión de rodilla", "Enderezamiento de la rodilla", "Extensión de cuádriceps"],
  ["Flexión plantar", "Pie hacia abajo", "Elevación de talones"],
  ["Supinación", "Palma gira hacia arriba o hacia delante, según la posición", "Curl supino"],
  ["Pronación", "Palma gira hacia abajo o hacia atrás, según la posición", "Curl inverso"],
  ["Retracción escapular", "Escápulas se aproximan", "Fase de retracción de un remo"],
])}

<h3>1.5 Principios básicos para desarrollar músculo</h3>
<p>La hipertrofia muscular depende de varios factores:</p>
${lista(['Volumen de entrenamiento adecuado.', 'Esfuerzo suficiente y proximidad razonable al fallo.', 'Sobrecarga progresiva.', 'Técnica controlada.', 'Alimentación y recuperación suficientes.', 'Consistencia a lo largo del tiempo.'])}
<div class="callout callout-ev">${iconoSvg('microscopio', 15)} La activación electromiográfica puede ayudar a estudiar la participación muscular, pero no permite determinar por sí sola qué ejercicio produce mayor hipertrofia a largo plazo.</div>
`},
{id:"vp-pecho", t:"Pecho", h:`
<h2>Capítulo 2 · Entrenamiento del pecho</h2>

<h3>2.1 Anatomía del pecho</h3>
<p>El <b>pectoral mayor</b> es el músculo principal del pecho y participa en la aducción horizontal, aducción, rotación interna y determinados movimientos de flexión y extensión del hombro. Se estudian principalmente tres regiones funcionales:</p>
${lista(['<b>Porción clavicular:</b> región superior.', '<b>Porción esternocostal:</b> gran parte de la región media.', '<b>Fibras abdominales:</b> región inferior del pectoral mayor.'])}
<p>El <b>pectoral menor</b> participa principalmente en el movimiento y control de la escápula. El <b>serrato anterior</b> ayuda a estabilizarla y a producir su protracción y rotación superior.</p>

<h3>2.2 Presses de pecho</h3>
${ej(1, 'Press de banca plano con barra', [[B, 'Aducción horizontal del hombro y extensión del codo.'], [P, 'Pectoral mayor.'], [S, 'Tríceps y deltoides anterior.'], [E, 'Manguito rotador, musculatura escapular y tronco.'], [T, 'Controla el descenso, conserva las muñecas alineadas y evita abrir excesivamente los codos.']])}
${ej(2, 'Press plano con mancuernas', [[B, 'Empuje horizontal con control independiente de cada brazo.'], [P, 'Pectoral mayor.'], [S, 'Tríceps y deltoides anterior.'], [E, 'Manguito rotador y musculatura escapular.']], 'Permite ajustar la trayectoria de cada brazo, pero exige mayor control individual de las cargas.')}
${ej(3, 'Press de pecho en máquina', [[B, 'Empuje horizontal mediante una trayectoria guiada.'], [P, 'Pectoral mayor.'], [S, 'Tríceps y deltoides anterior.'], [E, 'Musculatura del hombro y tronco.']], 'Es útil para controlar la trayectoria y reducir la demanda de equilibrio.')}
${ej(4, 'Press de pecho en poleas de pie', [[B, 'Empuje hacia delante contra la resistencia del cable.'], [P, 'Pectoral mayor.'], [S, 'Tríceps y deltoides anterior.'], [E, 'Abdominales, glúteos y musculatura escapular.']])}
${ej(5, 'Flexiones de brazos', [[B, 'Empuje horizontal con movimiento del hombro y extensión del codo.'], [P, 'Pectoral mayor.'], [S, 'Tríceps y deltoides anterior.'], [E, 'Serrato anterior, abdominales y glúteos.']], 'La dificultad puede ajustarse elevando las manos, usando el suelo o incorporando lastre.')}
${ej(6, 'Press inclinado con barra', [[B, 'Empuje diagonal que aumenta la demanda relativa de las fibras claviculares del pectoral.'], [P, 'Pectoral mayor, con énfasis relativo en la porción clavicular.'], [S, 'Deltoides anterior y tríceps.'], [E, 'Manguito rotador y musculatura escapular.']], 'Una inclinación moderada, por ejemplo de 15–30 grados, es un punto de partida práctico.')}
${ej(7, 'Press inclinado con mancuernas', [[B, 'Empuje diagonal con control independiente de los brazos.'], [P, 'Pectoral mayor, región clavicular.'], [S, 'Deltoides anterior y tríceps.'], [E, 'Manguito rotador y musculatura escapular.']])}
${ej(8, 'Press inclinado en máquina', [[B, 'Empuje guiado hacia arriba y delante.'], [P, 'Pectoral mayor.'], [S, 'Deltoides anterior y tríceps.'], [E, 'Musculatura del hombro.']])}
${ej(9, 'Press inclinado con mancuernas juntas', [[B, 'Empuje combinado con compresión de las mancuernas entre sí.'], [P, 'Pectoral mayor.'], [S, 'Tríceps y deltoides anterior.'], [E, 'Muñecas y hombros.']], 'La compresión adicional no garantiza mayor crecimiento muscular que un press convencional.')}
${ej(10, 'Press declinado con barra', [[B, 'Empuje descendente que puede aumentar la participación relativa de las fibras esternocostales inferiores.'], [P, 'Pectoral mayor.'], [S, 'Tríceps y deltoides anterior.'], [E, 'Musculatura del hombro.']])}
${ej(11, 'Press declinado con mancuernas', [[B, 'Empuje descendente con control independiente de cada brazo.'], [P, 'Pectoral mayor.'], [S, 'Tríceps y deltoides anterior.'], [E, 'Manguito rotador y musculatura escapular.']])}
${ej(12, 'Press declinado en máquina', [[B, 'Empuje guiado con una trayectoria descendente.'], [P, 'Pectoral mayor.'], [S, 'Tríceps y deltoides anterior.'], [E, 'Musculatura del hombro y tronco.']])}

<h3>2.3 Aperturas de pecho</h3>
${ej(13, 'Aperturas planas con mancuernas', [[B, 'Aducción horizontal del hombro con flexión relativamente constante del codo.'], [P1, 'Pectoral mayor.'], [S1, 'Deltoides anterior.'], [E, 'Manguito rotador y musculatura escapular.']])}
${ej(14, 'Aperturas inclinadas con mancuernas', [[B, 'Apertura y cierre en banco inclinado.'], [P1, 'Pectoral mayor, con énfasis relativo en la región clavicular.'], [S1, 'Deltoides anterior.'], [E, 'Musculatura del hombro.']])}
${ej(15, 'Aperturas en poleas a la altura del pecho', [[B, 'Aducción horizontal contra resistencia de cables.'], [P1, 'Pectoral mayor.'], [S1, 'Deltoides anterior.'], [E, 'Tronco y musculatura escapular.']])}
${ej(16, 'Cruce de poleas altas hacia abajo', [[B, 'Aducción del brazo en dirección hacia delante y abajo.'], [P1, 'Pectoral mayor.'], [S1, 'Deltoides anterior.'], [E, 'Tronco y hombros.']], 'Puede favorecer relativamente la participación de las fibras inferiores según la trayectoria.')}
${ej(17, 'Cruce de poleas bajas hacia arriba', [[B, 'Aducción horizontal combinada con flexión del hombro.'], [P1, 'Pectoral mayor, con énfasis relativo en la región clavicular.'], [S1, 'Deltoides anterior.'], [E, 'Musculatura escapular.']])}
${ej(18, 'Pec deck o contractor', [[B, 'Aducción horizontal mediante una máquina.'], [P1, 'Pectoral mayor.'], [S1, 'Deltoides anterior.'], [E, 'Manguito rotador.']])}

<h3>2.4 Otros ejercicios de pecho</h3>
${ej(19, 'Fondos en paralelas con inclinación del torso', [[P, 'Pectoral mayor y tríceps.'], [S1, 'Deltoides anterior.'], [E, 'Manguito rotador y tronco.']], 'La inclinación del torso puede modificar la contribución relativa del pecho. No debe forzarse una profundidad que produzca dolor en el hombro.')}
${ej(20, 'Flexiones con manos más separadas', [[P1, 'Pectoral mayor.'], [S, 'Tríceps y deltoides anterior.'], [E, 'Serrato anterior y tronco.']], 'Una separación cómoda suele ser preferible a exagerar la apertura de los brazos.')}
${ej(21, 'Flexiones con lastre', [[P1, 'Pectoral mayor.'], [S, 'Tríceps y deltoides anterior.'], [E, 'Abdominales, glúteos y serrato anterior.']])}
${ej(22, 'Pullover con mancuerna', [[B, 'Movimiento del brazo desde una posición elevada mediante extensión del hombro.'], [P, 'Dorsal ancho y otros extensores del hombro, según la técnica.'], [S, 'Pectoral mayor, redondo mayor y cabeza larga del tríceps.'], [E, 'Tronco y hombros.']], 'El pullover no debe clasificarse como ejercicio exclusivo de pecho.')}

<h3>2.5 Variantes técnicas del press</h3>
${tablaM(["Variante", "Principales", "Característica"], [
  ["Press con agarre neutro", "Pectoral y tríceps", "Palmas enfrentadas"],
  ["Press con agarre cerrado", "Tríceps y pectoral", "Mayor demanda relativa del codo"],
  ["Press en máquina Smith", "Pectoral y tríceps", "Trayectoria guiada"],
  ["Press unilateral en polea", "Pectoral y tríceps", "Mayor demanda de control rotacional"],
  ["Flexiones con pies elevados", "Pectoral y deltoides anterior", "Mayor carga relativa sobre los brazos"],
  ["Flexiones inclinadas", "Pectoral y tríceps", "Menor carga relativa"],
  ["Press con bandas", "Pectoral y tríceps", "Resistencia variable"],
  ["Press con pausa", "Pectoral y tríceps", "Mayor control de la transición"],
])}
${calloutPr('<b>Aplicación práctica:</b> para desarrollar el pecho se pueden combinar un press principal, otro press con un ángulo diferente y un ejercicio de apertura. No es obligatorio utilizar todas las variantes en una sola sesión.')}
`},
{id:"vp-piernas", t:"Piernas y glúteos", h:`
<h2>Capítulo 3 · Entrenamiento de piernas y glúteos</h2>

<h3>3.1 Anatomía de las piernas</h3>
<h4>Cuádriceps</h4>
<p>Está compuesto por recto femoral, vasto lateral, vasto medial y vasto intermedio. <b>Función principal:</b> extensión de rodilla. El recto femoral también participa en la flexión de cadera.</p>
<h4>Isquiotibiales</h4>
<p>Incluyen bíceps femoral, semitendinoso y semimembranoso. <b>Funciones:</b> flexión de rodilla y extensión de cadera, con contribuciones distintas según el músculo.</p>
<h4>Glúteos</h4>
${lista(['<b>Glúteo mayor:</b> extensión y rotación externa de cadera; participa en la producción de fuerza en sentadillas, bisagras e hip thrust.', '<b>Glúteo medio:</b> abducción y control de la pelvis.', '<b>Glúteo menor:</b> abducción, control de cadera y participación en la rotación según la posición.'])}
<h4>Aductores</h4>
<p>Acercan el muslo a la línea media. Algunos, como el aductor mayor, contribuyen también a la extensión de cadera.</p>
<h4>Pantorrillas</h4>
<p>El gastrocnemio y el sóleo participan en la flexión plantar del tobillo. La posición de la rodilla modifica su contribución relativa.</p>

<h3>3.2 Sentadillas</h3>
${ej(1, 'Sentadilla con barra', [[P, 'Cuádriceps y glúteo mayor.'], [S, 'Aductor mayor.'], [E, 'Abdominales, erectores espinales y musculatura de la cadera.'], [B, 'Flexión combinada de rodilla y cadera durante el descenso; extensión durante el ascenso.']])}
${ej(2, 'Sentadilla frontal', [[P, 'Cuádriceps y glúteo mayor.'], [S, 'Aductor mayor.'], [E, 'Abdominales, espalda superior y musculatura del tronco.']], 'La posición frontal de la barra suele exigir un torso más vertical.')}
${ej(3, 'Sentadilla goblet', [[P, 'Cuádriceps y glúteo mayor.'], [S, 'Aductor mayor.'], [E, 'Abdominales y espalda.']], 'Es útil para enseñar el patrón de sentadilla.')}
${ej(4, 'Sentadilla en máquina Smith', [[P, 'Cuádriceps y glúteo mayor.'], [S1, 'Aductor mayor.'], [E, 'Tronco y musculatura de la cadera.']], 'La posición de los pies debe adaptarse a la máquina y al cuerpo del cliente.')}
${ej(5, 'Sentadilla sumo con mancuerna', [[P, 'Cuádriceps, glúteo mayor y aductores.'], [S, 'Otros extensores de cadera.'], [E, 'Glúteo medio y tronco.']], 'Una postura amplia no garantiza por sí sola mayor hipertrofia de glúteos.')}

<h3>3.3 Prensas y extensiones de rodilla</h3>
${ej(6, 'Prensa a 45 grados', [[P, 'Cuádriceps y glúteo mayor.'], [S1, 'Aductor mayor.'], [E, 'Musculatura de cadera y tronco.']], 'La profundidad debe permitir mantener la pelvis apoyada y controlada.')}
${ej(7, 'Prensa horizontal', [[P, 'Cuádriceps y glúteo mayor.'], [S1, 'Aductores.'], [E, 'Musculatura de cadera y tronco.']])}
${ej(8, 'Extensión de rodilla en máquina', [[P, 'Los cuatro componentes del cuádriceps.'], ['Sinergistas dinámicos', 'No requiere un sinergista importante para la extensión.'], [E, 'Musculatura de cadera y tronco.']], 'Es un ejercicio directo para el cuádriceps.')}
${ej(9, 'Extensión de rodilla unilateral', [[P1, 'Cuádriceps de la pierna trabajada.'], [E, 'Musculatura de cadera y tronco.']], 'Permite observar diferencias de fuerza y control entre las piernas.')}

<h3>3.4 Zancadas y movimientos unilaterales</h3>
${ej(10, 'Zancada hacia delante', [[P, 'Cuádriceps y glúteo mayor.'], [S1, 'Aductores.'], [E, 'Glúteo medio, tobillo y tronco.']])}
${ej(11, 'Zancada hacia atrás', [[P, 'Cuádriceps y glúteo mayor.'], [S1, 'Aductores.'], [E, 'Glúteo medio y musculatura del tronco.']], 'Puede resultar más cómoda para algunas personas.')}
${ej(12, 'Sentadilla búlgara', [[P, 'Cuádriceps y glúteo mayor.'], [S1, 'Aductor mayor.'], [E, 'Glúteo medio, tobillo y tronco.']], 'Una zancada más larga y una inclinación moderada del torso pueden aumentar la demanda de extensión de cadera.')}
${ej(13, 'Step-up o subida al cajón', [[P, 'Cuádriceps y glúteo mayor.'], [S1, 'Aductores.'], [E, 'Glúteo medio, tobillo y tronco.']], 'La altura debe permitir controlar el ascenso sin impulsarse excesivamente con la pierna inferior.')}

<h3>3.5 Ejercicios específicos de glúteos</h3>
${ej(14, 'Hip thrust con barra', [[P1, 'Glúteo mayor.'], [S, 'Isquiotibiales y aductor mayor.'], [E, 'Abdominales y tronco.'], [B, 'Extensión de cadera contra resistencia, con los hombros apoyados en un banco.']])}
${ej(15, 'Puente de glúteos', [[P1, 'Glúteo mayor.'], [S, 'Isquiotibiales y aductor mayor.'], [E, 'Abdominales y pelvis.']], 'El recorrido suele ser menor que en el hip thrust con banco.')}
${ej(16, 'Hip thrust en máquina', [[P1, 'Glúteo mayor.'], [S, 'Isquiotibiales y aductor mayor.'], [E, 'Tronco y pelvis.']], 'Permite ajustar la carga de forma práctica.')}
${ej(17, 'Patada de glúteo en polea', [[P1, 'Glúteo mayor.'], [S, 'Isquiotibiales y aductor mayor.'], [E, 'Glúteo medio y tronco.']], 'El movimiento debe producirse en la cadera, no mediante hiperextensión lumbar.')}
${ej(18, 'Patada de glúteo en cuadrupedia', [[P1, 'Glúteo mayor.'], [S1, 'Isquiotibiales, según el movimiento de la rodilla.'], [E, 'Abdominales, glúteo medio y espalda.']])}
${ej(19, 'Extensión de cadera en banco de 45 grados', [[P, 'Glúteo mayor y erectores espinales, según la técnica.'], [S, 'Isquiotibiales y aductor mayor.'], [E, 'Abdominales y pelvis.']], 'La técnica determina si el ejercicio enfatiza más la extensión de cadera o de columna.')}

<h3>3.6 Abducción de cadera</h3>
${ej(20, 'Abducción en máquina', [[P, 'Glúteo medio y menor.'], [S1, 'Tensor de la fascia lata.'], [E, 'Pelvis y tronco.']])}
${ej(21, 'Abducción en polea', [[P, 'Glúteo medio y menor.'], [S, 'Tensor de la fascia lata y participación variable del glúteo mayor.'], [E, 'Pelvis y musculatura del tronco.']])}
${ej(22, 'Elevación lateral de pierna tumbado', [[P, 'Glúteo medio y menor.'], [S1, 'Tensor de la fascia lata.'], [E, 'Pelvis y tronco.']])}

<h3>3.7 Ejercicios de femorales</h3>
${ej(23, 'Curl femoral sentado', [[P, 'Isquiotibiales.'], [S1, 'Gastrocnemio.'], [E, 'Pelvis y tronco.']], 'La flexión de cadera coloca los isquiotibiales biarticulares a mayor longitud.')}
${ej(24, 'Curl femoral tumbado', [[P, 'Isquiotibiales.'], [S1, 'Gastrocnemio.'], [E, 'Pelvis y tronco.']])}
${ej(25, 'Curl femoral de pie', [[P1, 'Isquiotibiales de la pierna trabajada.'], [S1, 'Gastrocnemio.'], [E, 'Pelvis y tronco.']])}

<h3>3.8 Peso muerto y bisagra de cadera</h3>
${ej(26, 'Peso muerto rumano con barra', [[P, 'Glúteo mayor e isquiotibiales.'], [S1, 'Aductor mayor.'], [E, 'Erectores espinales, abdominales y dorsales.'], [B, 'La cadera se desplaza hacia atrás mientras el tronco se inclina y las rodillas permanecen ligeramente flexionadas.']])}
${ej(27, 'Peso muerto rumano con mancuernas', [[P, 'Glúteo mayor e isquiotibiales.'], [S1, 'Aductor mayor.'], [E, 'Abdominales y espalda.']])}
${ej(28, 'Peso muerto convencional', [[P, 'Glúteo mayor, cuádriceps y extensores de cadera.'], [S, 'Isquiotibiales y aductor mayor.'], [E, 'Erectores espinales, abdominales, dorsales y agarre.']])}
${ej(29, 'Peso muerto rumano a una pierna', [[P, 'Glúteo mayor e isquiotibiales.'], [S1, 'Aductor mayor.'], [E, 'Glúteo medio, tobillo y tronco.']])}
${ej(30, 'Pull-through en polea', [[P, 'Glúteo mayor e isquiotibiales.'], [S1, 'Aductor mayor.'], [E, 'Abdominales y tronco.']])}

<h3>3.9 Aductores y pantorrillas</h3>
${ej(31, 'Aducción de cadera en máquina', [[P, 'Aductores mayor, largo y corto, junto con otros aductores.'], [S, 'Pectíneo y músculos relacionados, según la posición.'], [E, 'Pelvis y tronco.']])}
${ej(32, 'Plancha Copenhagen', [[P1, 'Aductores de la pierna que sostiene la carga.'], [S, 'Oblicuos y otros músculos del tronco.'], [E, 'Hombro, pelvis y tronco.']])}
${ej(33, 'Elevación de talones de pie', [[P, 'Gastrocnemio y sóleo.'], [S, 'Otros flexores plantares.'], [E, 'Musculatura del pie y tobillo.']])}
${ej(34, 'Elevación de talones sentado', [[P1, 'Sóleo, con participación del gastrocnemio.'], [S, 'Otros flexores plantares.'], [E, 'Pie y tobillo.']])}
${ej(35, 'Elevación unilateral de talón', [[P, 'Gastrocnemio y sóleo.'], [S, 'Otros flexores plantares.'], [E, 'Pie, tobillo y cadera.']])}

<h3>3.10 Selección de ejercicios según el objetivo</h3>
${tablaM(["Objetivo", "Ejercicios recomendados"], [
  ["Desarrollar cuádriceps", "Sentadilla, prensa, extensión de rodilla"],
  ["Desarrollar glúteo mayor", "Hip thrust, sentadilla, peso muerto rumano"],
  ["Desarrollar glúteo medio", "Abducción de cadera y trabajo unilateral"],
  ["Desarrollar isquiotibiales", "Curl femoral sentado y peso muerto rumano"],
  ["Desarrollar aductores", "Aducción en máquina y ejercicios seleccionados de piernas"],
  ["Desarrollar pantorrillas", "Elevaciones de talones de pie y sentado"],
])}
<p>La selección final depende del nivel, la recuperación, el volumen semanal y las limitaciones del cliente.</p>
`},
{id:"vp-espalda", t:"Espalda", h:`
<h2>Capítulo 4 · Entrenamiento de espalda</h2>

<h3>4.1 Anatomía funcional de la espalda</h3>
${tablaM(["Músculo", "Función"], [
  ["<b>Dorsal ancho</b>", "Participa en extensión, aducción y rotación interna del hombro."],
  ["<b>Trapecio</b>", "Sus fibras superiores, medias e inferiores intervienen de manera diferente en la elevación, retracción, depresión y rotación de las escápulas."],
  ["<b>Romboides</b>", "Contribuyen a retraer y estabilizar las escápulas."],
  ["<b>Deltoides posterior</b>", "Participa en la extensión horizontal del hombro y otros movimientos del brazo hacia atrás."],
  ["<b>Redondo mayor</b>", "Participa en extensión, aducción y rotación interna del hombro."],
  ["<b>Erectores espinales</b>", "Ayudan a extender y estabilizar la columna."],
])}

<h3>4.2 Jalones y dominadas</h3>
${ej(1, 'Jalón al pecho pronado', [[P, 'Dorsal ancho y redondo mayor.'], [S, 'Bíceps, braquial y braquiorradial.'], [E, 'Musculatura escapular y manguito rotador.']])}
${ej(2, 'Jalón neutro o cerrado', [[P, 'Dorsal ancho y redondo mayor.'], [S, 'Flexores del codo.'], [E, 'Trapecio, romboides y manguito rotador.']])}
${ej(3, 'Dominadas pronadas', [[P, 'Dorsal ancho y redondo mayor.'], [S, 'Bíceps, braquial y braquiorradial.'], [E, 'Musculatura escapular y tronco.']])}
${ej(4, 'Dominadas supinas', [[P, 'Dorsal ancho y redondo mayor.'], [S, 'Bíceps y otros flexores del codo.'], [E, 'Escápulas y tronco.']])}
${ej(5, 'Dominadas asistidas', [[P, 'Dorsal ancho y redondo mayor.'], [S, 'Flexores del codo.'], [E, 'Musculatura escapular y tronco.']], 'La asistencia permite ajustar la dificultad y practicar el movimiento con control.')}

<h3>4.3 Remos</h3>
${ej(6, 'Remo con barra inclinado', [[P, 'Dorsal ancho, trapecio medio, romboides y deltoides posterior, según la trayectoria.'], [S, 'Bíceps y otros flexores del codo.'], [E, 'Erectores espinales, abdominales y glúteos.']])}
${ej(7, 'Remo unilateral con mancuerna', [[P, 'Dorsal ancho y musculatura escapular.'], [S, 'Bíceps, braquial y deltoides posterior.'], [E, 'Manguito rotador y tronco.']])}
${ej(8, 'Remo sentado en polea', [[P, 'Dorsal ancho, romboides y trapecio medio.'], [S, 'Flexores del codo y deltoides posterior.'], [E, 'Erectores espinales y abdominales.']])}
${ej(9, 'Remo con pecho apoyado', [[P, 'Dorsal ancho, trapecio medio y romboides.'], [S, 'Bíceps y deltoides posterior.'], [E, 'Musculatura del hombro.']], 'El apoyo reduce la demanda postural de la zona lumbar.')}
${ej(10, 'Remo T-bar', [[P, 'Dorsal ancho, trapecio medio y romboides.'], [S, 'Bíceps y deltoides posterior.'], [E, 'Erectores espinales y abdominales cuando el torso no está apoyado.']])}
${ej(11, 'Remo invertido', [[P, 'Dorsal ancho, trapecio medio y romboides.'], [S, 'Bíceps, braquial y deltoides posterior.'], [E, 'Abdominales y glúteos.']])}

<h3>4.4 Trapecio y espalda alta</h3>
${ej(12, 'Encogimientos con mancuernas', [[P1, 'Trapecio superior.'], [S1, 'Elevador de la escápula.'], [E, 'Agarre, muñecas y tronco.']])}
${ej(13, 'Face pull', [[P, 'Deltoides posterior, trapecio medio e inferior y romboides.'], [S, 'Infraespinoso y redondo menor durante la rotación externa.'], [E, 'Manguito rotador y tronco.']])}
${ej(14, 'Aperturas inversas en pec deck', [[P1, 'Deltoides posterior.'], [S, 'Trapecio medio y romboides.'], [E, 'Manguito rotador.']])}
${ej(15, 'Aperturas inversas con mancuernas', [[P1, 'Deltoides posterior.'], [S, 'Trapecio medio y romboides.'], [E, 'Erectores espinales y abdominales.']])}

<h3>4.5 Zona lumbar y control del tronco</h3>
${ej(16, 'Extensión de espalda en banco de 45 grados', [[P, 'Erectores espinales y, si el movimiento se realiza desde la cadera, glúteo mayor e isquiotibiales.'], [S1, 'Aductor mayor.'], [E, 'Abdominales y pelvis.']])}
${ej(17, 'Bird dog', [[P, 'Musculatura estabilizadora del tronco y extensores de cadera.'], [S, 'Musculatura de hombros y espalda.'], [E, 'Abdominales, multífidos y pelvis.']], 'El bird dog se utiliza principalmente para mejorar el control motor y la estabilidad, no como sustituto de todo el entrenamiento de fuerza de espalda.')}
`},
{id:"vp-biceps", t:"Bíceps", h:`
<h2>Capítulo 5 · Entrenamiento de bíceps</h2>

<h3>5.1 Anatomía funcional</h3>
<p>El <b>bíceps braquial</b> tiene una cabeza larga y una cabeza corta. Participa en la flexión del codo y la supinación del antebrazo.</p>
<p>El <b>braquial</b> se encuentra debajo del bíceps y es un potente flexor del codo.</p>
<p>El <b>braquiorradial</b> participa en la flexión del codo, especialmente con el antebrazo en posición neutra.</p>

<h3>5.2 Catálogo de ejercicios</h3>
${ej(1, 'Curl con barra recta', [[P, 'Bíceps braquial y braquial.'], [S1, 'Braquiorradial.'], [E, 'Muñecas, hombros y tronco.'], [B, 'Flexión del codo con el antebrazo supinado.']])}
${ej(2, 'Curl con barra EZ', [[P, 'Bíceps y braquial.'], [S1, 'Braquiorradial.'], [E, 'Muñecas y tronco.']], 'El agarre semisupinado puede resultar más cómodo para algunas personas.')}
${ej(3, 'Curl alterno con mancuernas', [[P, 'Bíceps y braquial.'], [S1, 'Braquiorradial.'], [E, 'Hombro, antebrazo y tronco.']], 'Puede combinarse con supinación controlada.')}
${ej(4, 'Curl inclinado con mancuernas', [[P, 'Bíceps y braquial.'], [S1, 'Braquiorradial.'], [E, 'Hombros y antebrazos.']], 'La extensión del hombro coloca la cabeza larga del bíceps a mayor longitud.')}
${ej(5, 'Curl predicador o Scott', [[P, 'Bíceps y braquial.'], [S1, 'Braquiorradial.'], [E, 'Antebrazo y muñeca.']], 'El apoyo limita el balanceo y facilita controlar la ejecución.')}
${ej(6, 'Curl de concentración', [[P, 'Bíceps y braquial.'], [S1, 'Braquiorradial.'], [E, 'Antebrazo y muñeca.']], 'Permite trabajar un brazo a la vez, pero no aísla completamente una cabeza del bíceps.')}
${ej(7, 'Curl en polea baja', [[P, 'Bíceps y braquial.'], [S1, 'Braquiorradial.'], [E, 'Muñeca, hombro y tronco.']], 'La tensión depende de la dirección del cable y de la posición del brazo.')}
${ej(8, 'Curl martillo', [[P, 'Braquial y bíceps.'], [S1, 'Braquiorradial, con participación importante.'], [E, 'Muñeca y tronco.']], 'Se realiza con las palmas enfrentadas.')}
${ej(9, 'Curl inverso con barra EZ', [[P, 'Braquial y braquiorradial.'], [S1, 'Bíceps.'], [E, 'Muñeca y musculatura del antebrazo.']], 'La pronación reduce la capacidad del bíceps para producir fuerza en comparación con la supinación.')}

<h3>5.3 Selección de ejercicios de bíceps</h3>
<p>Una sesión puede combinar:</p>
${lista(['Un curl con agarre supino.', 'Un curl martillo o variante neutra.', 'Un curl inclinado, predicador o en polea, según el objetivo.'])}
${calloutPr('No es necesario incluir todos los ejercicios en la misma sesión. La progresión y la recuperación son más importantes que acumular variantes.')}
`},
{id:"vp-triceps", t:"Tríceps", h:`
<h2>Capítulo 6 · Entrenamiento de tríceps</h2>

<h3>6.1 Anatomía funcional</h3>
<p>El <b>tríceps braquial</b> tiene tres cabezas:</p>
${lista(['<b>Cabeza larga:</b> cruza el hombro y el codo; extiende el codo y ayuda a extender y aducir el hombro.', '<b>Cabeza lateral:</b> participa en la extensión del codo y contribuye al contorno externo del brazo.', '<b>Cabeza medial:</b> contribuye a la extensión del codo en distintos niveles de esfuerzo.'])}
<p>El <b>ancóneo</b> también ayuda a la extensión y al control de la articulación del codo.</p>

<h3>6.2 Catálogo de ejercicios</h3>
${ej(1, 'Extensión de tríceps en polea con barra', [[P, 'Tríceps braquial, con participación de sus tres cabezas.'], [S1, 'Ancóneo.'], [E, 'Hombros, muñecas y tronco.'], [B, 'Extensión del codo contra la resistencia del cable, con los brazos relativamente estables.']])}
${ej(2, 'Extensión con cuerda en polea', [[P, 'Tríceps braquial.'], [S1, 'Ancóneo.'], [E, 'Hombros y tronco.']], 'Permite ajustar la posición de las manos al final del recorrido sin que eso garantice mayor hipertrofia.')}
${ej(3, 'Extensión de tríceps por encima de la cabeza con cuerda', [[P1, 'Tríceps braquial, con énfasis potencial en la cabeza larga debido a la posición del hombro.'], [S1, 'Ancóneo.'], [E, 'Hombro, escápulas y tronco.'], [B, 'Extensión del codo con el hombro flexionado, lo que coloca la cabeza larga del tríceps a mayor longitud.']])}
${ej(4, 'Extensión por encima de la cabeza con mancuerna', [[P1, 'Tríceps braquial.'], [S1, 'Ancóneo.'], [E, 'Hombro, muñeca y tronco.']], 'Puede ejecutarse con uno o dos brazos, siempre que el rango sea cómodo y controlado.')}
${ej(5, 'Press francés con barra EZ', [[P1, 'Tríceps braquial.'], [S1, 'Ancóneo.'], [E, 'Hombros y musculatura del antebrazo.'], [B, 'Extensión del codo con el brazo elevado o situado aproximadamente vertical respecto al suelo, según la variante.']], 'Evita forzar la posición del codo si aparece dolor.')}
${ej(6, 'Extensión de tríceps tumbado con mancuernas', [[P1, 'Tríceps braquial.'], [S1, 'Ancóneo.'], [E, 'Hombros y muñecas.']], 'Permite trabajar ambos brazos de forma independiente.')}
${ej(7, 'Press de banca con agarre cerrado', [[P, 'Tríceps y pectoral mayor.'], [S1, 'Deltoides anterior.'], [E, 'Musculatura del hombro y tronco.'], [B, 'Empuje que combina extensión del codo y movimiento del hombro.']], 'Un agarre moderadamente cerrado suele ser suficiente; no es necesario juntar excesivamente las manos.')}
${ej(8, 'Fondos en paralelas con énfasis en tríceps', [[P, 'Tríceps y pectoral mayor.'], [S1, 'Deltoides anterior.'], [E, 'Manguito rotador y tronco.']], 'El torso más vertical puede aumentar la demanda relativa del tríceps, pero la anatomía y la profundidad también influyen.')}
${ej(9, 'Fondos en banco', [[P, 'Tríceps, con participación del pectoral y deltoides anterior.'], [S, 'Musculatura del hombro.'], [E, 'Tronco y escápulas.']], 'La extensión profunda del hombro puede resultar incómoda para algunas personas. No es una variante obligatoria para desarrollar el tríceps.')}
${ej(10, 'Extensión unilateral en polea', [[P1, 'Tríceps braquial.'], [S1, 'Ancóneo.'], [E, 'Muñeca, hombro y tronco.']], 'Permite ajustar la trayectoria individualmente y detectar diferencias de control entre brazos.')}

<h3>6.3 Cómo seleccionar ejercicios de tríceps</h3>
<p>Una combinación práctica puede incluir:</p>
${lista(['Una extensión en polea con los brazos al costado.', 'Una extensión por encima de la cabeza.', 'Un ejercicio de empuje compuesto, si resulta apropiado para el cliente.'])}
<p>La posición por encima de la cabeza puede ser útil para entrenar la cabeza larga a mayor longitud muscular. La tolerancia del codo y del hombro debe guiar la selección.</p>
`},
{id:"vp-programacion", t:"Selección y programación", h:`
<h2>Capítulo 7 · Selección de ejercicios y programación</h2>

<h3>7.1 Cómo diseñar una rutina</h3>
<p>Antes de elegir ejercicios, el entrenador debe evaluar:</p>
${lista(['<b>Objetivo principal:</b> hipertrofia, fuerza, pérdida de grasa o acondicionamiento.', 'Experiencia y nivel técnico.', 'Frecuencia semanal disponible.', 'Tiempo por sesión.', 'Equipo disponible.', 'Historial de molestias, cirugías y restricciones médicas.', 'Capacidad de recuperación y volumen que tolera el cliente.'])}

<h3>7.2 Series, repeticiones y descansos</h3>
<p>Los siguientes rangos son puntos de partida generales para adultos sanos; deben adaptarse a la persona y al ejercicio.</p>
${tablaM(["Objetivo práctico", "Series por ejercicio", "Repeticiones", "Descanso aproximado"], [
  ["Fuerza", "3–5", "3–6", "2–5 minutos"],
  ["Hipertrofia", "2–4", "6–15", "1–3 minutos"],
  ["Aislamientos", "2–4", "10–20", "1–2 minutos"],
  ["Aprendizaje técnico", "2–3", "8–12 controladas", "Según necesidad"],
])}
<p>La hipertrofia puede lograrse con distintos rangos de repeticiones si el esfuerzo es suficiente. Las cargas altas suelen ser especialmente útiles para desarrollar fuerza máxima.</p>

<h3>7.3 Progresión doble</h3>
<p>Un método sencillo consiste en fijar un rango de repeticiones. <b>Ejemplo:</b> 3 series de 8–12 repeticiones.</p>
${listaN(['Semana inicial: 10, 9 y 8 repeticiones.', 'Próxima sesión: intentar mejorar alguna repetición manteniendo la técnica.', 'Cuando se alcanzan 12 repeticiones en todas las series con buena ejecución, se aumenta moderadamente la carga.', 'Se vuelve a progresar dentro del rango.'])}
${calloutSg('No se debe aumentar la carga si la técnica se deteriora o aparece dolor.')}

<h3>7.4 Volumen semanal</h3>
<p>El volumen debe contabilizarse por grupo muscular, considerando que los ejercicios compuestos estimulan varios músculos al mismo tiempo.</p>
<p>No todas las series de un ejercicio compuesto cuentan como una serie completa para cada músculo secundario. El efecto depende del esfuerzo, la técnica y el músculo que limita el ejercicio.</p>
<p>Comienza con un volumen que el cliente pueda recuperar y aumenta gradualmente cuando el progreso se estanque y la recuperación sea adecuada.</p>

<h3>7.5 Frecuencia de entrenamiento</h3>
<p>Trabajar un grupo muscular dos veces por semana puede ayudar a distribuir el volumen y mantener la calidad de las series.</p>
<p>La frecuencia debe adaptarse al número de días disponibles, la recuperación y las preferencias del cliente. No existe una frecuencia única que sea óptima para todas las personas.</p>

<h3>7.6 Ejemplo de distribución semanal</h3>
${tablaM(["Día", "Grupos musculares"], [
  ["Lunes", "Pecho, hombros y tríceps"],
  ["Martes", "Espalda y bíceps"],
  ["Miércoles", "Piernas y glúteos"],
  ["Jueves", "Pecho, espalda y brazos"],
  ["Viernes", "Piernas y glúteos"],
  ["Sábado", "Actividad complementaria o recuperación"],
  ["Domingo", "Descanso o actividad ligera"],
])}
<p>Esta es solo una distribución de ejemplo. El volumen de pecho, espalda, brazos y piernas debe ajustarse para evitar que la fatiga interfiera con las siguientes sesiones.</p>
`},
{id:"vp-seguridad", t:"Técnica, seguridad y evaluación", h:`
<h2>Capítulo 8 · Técnica, seguridad y evaluación del cliente</h2>

<h3>8.1 Evaluación inicial</h3>
<p>Antes de comenzar un programa, registra:</p>
${lista(['Datos básicos y objetivo del cliente.', 'Experiencia de entrenamiento.', 'Medidas corporales, cuando sean relevantes.', 'Ejercicios que domina.', 'Historial de molestias o lesiones.', 'Restricciones médicas y recomendaciones profesionales.', 'Disponibilidad semanal y hábitos de recuperación.'])}
<p>Las medidas y fotografías son herramientas de seguimiento, no diagnósticos médicos.</p>

<h3>8.2 Técnica correcta</h3>
<p>El entrenador debe enseñar al cliente a:</p>
${lista(['Ajustar correctamente el equipo.', 'Controlar la fase de subida y bajada.', 'Mantener una posición estable.', 'Utilizar un rango de movimiento tolerable.', 'Evitar impulsos innecesarios.', 'Respirar sin perder el control del tronco.', 'Reconocer la diferencia entre esfuerzo muscular y dolor.'])}

<h3>8.3 Entrenamiento con molestias o antecedentes médicos</h3>
<p>Si un cliente presenta dolor persistente, cirugía reciente o una restricción médica, no se debe asumir que una variante es segura solo porque utiliza poco peso.</p>
<p>El entrenador debe respetar las indicaciones del profesional sanitario y solicitar aclaraciones cuando no estén definidas las actividades permitidas.</p>
${calloutSg('Debe detenerse el ejercicio que provoque dolor agudo, pérdida repentina de fuerza, entumecimiento u otros síntomas preocupantes.')}

<h3>8.4 Seguimiento del progreso</h3>
<p>Registra de forma consistente:</p>
${lista(['Carga utilizada.', 'Repeticiones realizadas.', 'Series completadas.', 'Técnica y rango de movimiento.', 'Esfuerzo percibido.', 'Molestias y recuperación.', 'Medidas corporales según un protocolo estable.', 'Adherencia al programa.'])}
<p>Un aumento de peso en la barra no siempre significa que el músculo objetivo esté recibiendo un mejor estímulo. La técnica y el contexto deben evaluarse junto con la carga.</p>
`},
{id:"vp-glosario", t:"Glosario", h:`
<h2>Glosario de términos técnicos</h2>
<dl class="glosario-vp">
  <dt>Abducción</dt><dd>Movimiento que aleja una extremidad de la línea media.</dd>
  <dt>Aducción</dt><dd>Movimiento que acerca una extremidad a la línea media.</dd>
  <dt>Agonista</dt><dd>Músculo que produce una parte importante del movimiento.</dd>
  <dt>Antagonista</dt><dd>Músculo que produce una acción opuesta o controla el movimiento en determinadas fases.</dd>
  <dt>Estabilizador</dt><dd>Músculo que ayuda a mantener una posición articular o corporal.</dd>
  <dt>Hipertrofia</dt><dd>Aumento del tamaño de las fibras musculares y del tejido muscular.</dd>
  <dt>Supinación</dt><dd>Rotación del antebrazo que orienta la palma hacia arriba en la posición anatómica funcional correspondiente.</dd>
  <dt>Pronación</dt><dd>Rotación del antebrazo que orienta la palma hacia abajo.</dd>
  <dt>Flexión</dt><dd>Movimiento que reduce el ángulo de una articulación.</dd>
  <dt>Extensión</dt><dd>Movimiento que aumenta el ángulo de una articulación.</dd>
  <dt>Aducción horizontal</dt><dd>Movimiento del brazo hacia el centro del cuerpo en el plano horizontal.</dd>
  <dt>Bisagra de cadera</dt><dd>Patrón de movimiento en el que la cadera se desplaza hacia atrás y el tronco se inclina manteniendo controlada la columna.</dd>
  <dt>Rango de movimiento</dt><dd>Amplitud que recorre una articulación durante un ejercicio.</dd>
  <dt>RIR</dt><dd>Repeticiones en reserva; estimación de cuántas repeticiones adicionales podrían realizarse antes del fallo.</dd>
  <dt>RPE</dt><dd>Escala de esfuerzo percibido; expresa cuán exigente resulta una serie.</dd>
  <dt>Sobrecarga progresiva</dt><dd>Aumento gradual y planificado de la demanda del entrenamiento.</dd>
  <dt>Volumen de entrenamiento</dt><dd>Cantidad de trabajo realizado, registrada habitualmente mediante series, repeticiones y cargas.</dd>
</dl>
`},
{id:"vp-conclusion", t:"Conclusión y referencias", h:`
<h2>Conclusión</h2>
<p>Un entrenador personal competente no se limita a conocer ejercicios: comprende el movimiento, identifica qué músculos participan, selecciona variantes adecuadas y adapta el programa a las características del cliente.</p>
<p>La anatomía y la biomecánica son herramientas para tomar mejores decisiones, no fórmulas rígidas que sustituyen la observación y el criterio profesional.</p>
<p>Este manual constituye una base para continuar estudiando, mejorar la práctica diaria y desarrollar una metodología de trabajo consistente en VP Fitness y Coach Fénix.</p>
${calloutPr('<b>Principio final del entrenador:</b> evaluar antes de prescribir, enseñar antes de aumentar la carga, progresar sin sacrificar la técnica y medir para tomar mejores decisiones.')}

<h3>Referencias para ampliar el estudio</h3>
${lista(['American College of Sports Medicine (ACSM). Recursos y recomendaciones para la prescripción del ejercicio.', 'National Strength and Conditioning Association (NSCA). Principios de entrenamiento de fuerza y acondicionamiento.', 'Schoenfeld, B. J. Investigaciones sobre mecanismos de hipertrofia muscular y variables del entrenamiento.', 'Contreras, B. y colaboradores. Literatura sobre biomecánica y entrenamiento de glúteos.', 'OpenStax. <i>Anatomy and Physiology</i>. Material de referencia sobre anatomía y fisiología humana.'])}
<p style="margin-top:22px;color:var(--tenue);font-size:12.5px;">— Fin del manual · Equipo de formación VP Fitness. Material formativo de carácter general: no sustituye la formación certificada del entrenador ni la valoración de profesionales sanitarios. —</p>
`},
];
}
