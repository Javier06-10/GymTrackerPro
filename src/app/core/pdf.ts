/* ============================================================
   PDFs SIN LIBRERÍAS (portado de la plantilla)
   Genera PDF 1.4 a mano: Helvetica WinAnsi, carta (612x792),
   coordenadas con y hacia abajo y logo JPEG opcional.
   ============================================================ */
import { ZONAS, avanceObjetivo, bajarEsBueno, quiereBajar, medicionPendiente, pagoVencido, serieMedida, unidadObjetivo, verValorObjetivo } from './dominio';
import { Sistema, largoTxt, largoVer, pesoTxt, pesoVer, uLargo, uPeso } from './unidades';
import { Atleta, Medida, PagoAtleta } from './modelos';
import { MESES_ES, diasDesde, fmtDinero, fmtFecha, hoyISO, normalizar } from './util';
import { EQUIVALENCIAS, PlanComidas } from './planes-comida';

type Color = [number, number, number];
type Op =
  | { tipo: 'texto'; x: number; y: number; texto: string; tam: number; negrita?: boolean; color?: Color }
  | { tipo: 'linea'; x1: number; y1: number; x2: number; y2: number; color?: Color; grosor?: number }
  | { tipo: 'rect'; x: number; y: number; w: number; h: number; color: Color }
  | { tipo: 'rectBorde'; x: number; y: number; w: number; h: number; color: Color; grosor?: number }
  | { tipo: 'imagen'; x: number; y: number; w: number; h: number };

export interface LogoPDF { datos: string; w: number; h: number }
/** Datos del entrenador que firma los documentos. */
export interface Membrete { nombre: string; negocio: string; logo: LogoPDF | null; sistema?: Sistema }

const OSCURO: Color = [0.13, 0.16, 0.2];
const GRIS: Color = [0.42, 0.46, 0.52];
const LINEA: Color = [0.85, 0.87, 0.9];
const VERDE: Color = [0.16, 0.6, 0.4];
const ROJO: Color = [0.8, 0.28, 0.28];
const AMBAR: Color = [0.88, 0.53, 0.14];
const GRISMED: Color = [0.55, 0.58, 0.63];

/* ---------- Motor ---------- */
function pdfTxt(t: string): string {
  const mapa: Record<string, number> = {
    á: 225, é: 233, í: 237, ó: 243, ú: 250, ñ: 241, Á: 193, É: 201, Í: 205, Ó: 211, Ú: 218, Ñ: 209, ü: 252, Ü: 220,
    '°': 176, '·': 183, '¡': 161, '¿': 191, '–': 150, '—': 151, '“': 147, '”': 148, '’': 146, '•': 149,
  };
  let s = '';
  for (const ch of String(t)) {
    if (ch === '→') { s += '->'; continue; }
    if (ch === '≈') { s += '~'; continue; }
    let c = ch.charCodeAt(0);
    if (mapa[ch] !== undefined) c = mapa[ch];
    if (c > 255) c = 63;
    if (c === 40 || c === 41 || c === 92) s += '\\';
    s += String.fromCharCode(c);
  }
  return s;
}

function construirPDF(paginas: Op[][], imagen: LogoPDF | null): string {
  const col = (c: Color) => c.map((v) => v.toFixed(3)).join(' ');
  const pintar = (ops: Op[]) =>
    ops
      .map((o) => {
        switch (o.tipo) {
          case 'texto':
            return `BT /${o.negrita ? 'F2' : 'F1'} ${o.tam} Tf ${col(o.color || OSCURO)} rg ${o.x} ${792 - o.y} Td (${pdfTxt(o.texto)}) Tj ET\n`;
          case 'linea':
            return `${col(o.color || LINEA)} RG ${o.grosor || 1} w ${o.x1} ${792 - o.y1} m ${o.x2} ${792 - o.y2} l S\n`;
          case 'rect':
            return `${col(o.color)} rg ${o.x} ${792 - o.y - o.h} ${o.w} ${o.h} re f\n`;
          case 'rectBorde':
            return `${col(o.color)} RG ${o.grosor || 1} w ${o.x} ${792 - o.y - o.h} ${o.w} ${o.h} re S\n`;
          case 'imagen':
            return `q ${o.w} 0 0 ${o.h} ${o.x} ${792 - o.y - o.h} cm /Im1 Do Q\n`;
        }
      })
      .join('');
  const N = paginas.length;
  const idxF1 = 3 + N, idxF2 = 4 + N, idxCont0 = 5 + N, idxImg = 5 + 2 * N;
  const recursos = `<< /Font << /F1 ${idxF1} 0 R /F2 ${idxF2} 0 R >>${imagen ? ` /XObject << /Im1 ${idxImg} 0 R >>` : ''} >>`;
  const objetos = ['<< /Type /Catalog /Pages 2 0 R >>', `<< /Type /Pages /Kids [${paginas.map((_, i) => `${3 + i} 0 R`).join(' ')}] /Count ${N} >>`];
  paginas.forEach((_, i) => objetos.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources ${recursos} /Contents ${idxCont0 + i} 0 R >>`));
  objetos.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  objetos.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  paginas.forEach((ops) => {
    const cont = pintar(ops);
    objetos.push(`<< /Length ${cont.length} >>\nstream\n${cont}endstream`);
  });
  if (imagen) {
    objetos.push(`<< /Type /XObject /Subtype /Image /Width ${imagen.w} /Height ${imagen.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imagen.datos.length} >>\nstream\n${imagen.datos}\nendstream`);
  }
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objetos.forEach((o, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xrefPos = pdf.length;
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((off) => (pdf += String(off).padStart(10, '0') + ' 00000 n \n'));
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  return pdf;
}

function descargarPDF(nombreArchivo: string, pdf: string) {
  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 400);
}

/** Convierte el logo (data URL JPEG del perfil) al formato que embebe el PDF. */
export function cargarLogoPDF(dataUrl: string | null | undefined): Promise<LogoPDF | null> {
  if (!dataUrl || !dataUrl.startsWith('data:image/jpeg')) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        resolve({ datos: atob(dataUrl.split(',')[1]), w: img.naturalWidth, h: img.naturalHeight });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

/** Ancho aproximado de un texto en Helvetica (para alinear a la derecha). */
function ancho(texto: string, tam: number, negrita = false) {
  return texto.length * tam * (negrita ? 0.56 : 0.52);
}

function slug(t: string) {
  return normalizar(t).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

/** Herramientas de dibujo comunes: texto, línea, membrete y pie. */
function lienzo(m: Membrete) {
  const ops: Op[] = [];
  const T = (x: number, y: number, texto: string, tam: number, negrita = false, color: Color = OSCURO) =>
    ops.push({ tipo: 'texto', x, y, texto, tam, negrita, color });
  const TD = (xDerecha: number, y: number, texto: string, tam: number, negrita = false, color: Color = OSCURO) =>
    T(xDerecha - ancho(texto, tam, negrita), y, texto, tam, negrita, color);
  const L = (y: number) => ops.push({ tipo: 'linea', x1: 64, y1: y, x2: 548, y2: y });
  const firma = (m.nombre || 'Entrenador') + ' · Entrenador';

  const encabezado = () => {
    if (m.logo) {
      const caja = 42;
      const e = Math.min(caja / m.logo.w, caja / m.logo.h);
      ops.push({ tipo: 'imagen', x: 548 - m.logo.w * e, y: 30, w: m.logo.w * e, h: m.logo.h * e });
    }
    const titular = [m.nombre, m.negocio || 'Entrenador personal'].filter(Boolean).join('  ·  ').toUpperCase();
    T(64, 58, titular, 9, true, GRIS);
    if (!m.logo) TD(548, 58, 'Coach Fénix', 9, false, GRIS);
    L(78);
  };
  const pie = (texto: string, conFirma = true) => {
    L(742);
    T(64, 758, texto, 9, false, GRIS);
    if (conFirma) TD(548, 758, firma, 9, true, GRIS);
  };
  return { ops, T, TD, L, encabezado, pie, firma };
}

/* ---------- Comparación de las dos últimas mediciones ---------- */
export interface FilaComparacion { zona: string; antes: string; ahora: string; delta: number; ev: { texto: 'AVANCE' | 'RETROCESO' | 'IGUAL' | 'CAMBIO'; color: Color } }
export interface Comparacion { ant: Medida; act: Medida; dias: number; filas: FilaComparacion[]; avances: number; retros: number; iguales: number; frase: string }

export function compararProgreso(a: Atleta, s: Sistema = 'imperial'): Comparacion | null {
  if (a.medidas.length < 2) return null;
  const ant = a.medidas[a.medidas.length - 2];
  const act = a.medidas[a.medidas.length - 1];
  const dias = Math.round((new Date(act.fecha + 'T00:00:00').getTime() - new Date(ant.fecha + 'T00:00:00').getTime()) / 86400000);
  const evaluar = (delta: number, bajarEsBueno: boolean, neutral: boolean): FilaComparacion['ev'] => {
    if (delta === 0) return { texto: 'IGUAL', color: GRISMED };
    if (neutral) return { texto: 'CAMBIO', color: GRISMED };
    return (bajarEsBueno ? delta < 0 : delta > 0) ? { texto: 'AVANCE', color: VERDE } : { texto: 'RETROCESO', color: ROJO };
  };
  const filas: FilaComparacion[] = [];
  if (ant.peso != null && act.peso != null) {
    const d = Number((pesoVer(act.peso, s)! - pesoVer(ant.peso, s)!).toFixed(1));
    const bajar = quiereBajar(a);
    const neutral = !(bajar || a.objetivo === 'ganar');
    filas.push({ zona: 'Peso corporal', antes: pesoTxt(ant.peso, s), ahora: pesoTxt(act.peso, s), delta: d, ev: evaluar(d, bajar, neutral) });
  }
  ZONAS.forEach(([z, nombre]) => {
    if (ant[z] != null && act[z] != null) {
      const d = Number((largoVer(act[z], s)! - largoVer(ant[z], s)!).toFixed(1));
      filas.push({ zona: nombre, antes: largoTxt(ant[z], s), ahora: largoTxt(act[z], s), delta: d, ev: evaluar(d, bajarEsBueno(a, z), false) });
    }
  });
  if (!filas.length) return null;
  const avances = filas.filter((f) => f.ev.texto === 'AVANCE').length;
  const retros = filas.filter((f) => f.ev.texto === 'RETROCESO').length;
  const iguales = filas.length - avances - retros;
  let frase: string;
  if (retros === 0 && avances > 0) frase = '¡Excelente trabajo! Los resultados están a la vista. Sigamos con el plan.';
  else if (avances >= retros) frase = 'Buen progreso general. Vamos a ajustar los puntos pendientes en el próximo bloque.';
  else frase = 'Los números de este período nos dicen exactamente dónde ajustar. ¡Vamos con todo al próximo mes!';
  return { ant, act, dias, filas, avances, retros, iguales, frase };
}

/* ---------- Gráfica de línea dentro del PDF ---------- */
function graficaPDF(ops: Op[], cfg: { x: number; y: number; w: number; h: number; puntos: { fecha: string; valor: number }[]; titulo: string; unidad: string }) {
  const { x, y, w, h, puntos, titulo, unidad } = cfg;
  ops.push({ tipo: 'texto', x, y: y - 6, texto: titulo, tam: 9.5, negrita: true, color: OSCURO });
  ops.push({ tipo: 'rectBorde', x, y, w, h, color: LINEA });
  const vals = puntos.map((p) => p.valor);
  let min = Math.min(...vals), max = Math.max(...vals);
  if (min === max) { min -= 1; max += 1; }
  const pad = (max - min) * 0.14;
  min -= pad;
  max += pad;
  ops.push({ tipo: 'linea', x1: x, y1: y + h * 0.5, x2: x + w, y2: y + h * 0.5, color: LINEA, grosor: 0.6 });
  const PX = (i: number) => x + 6 + (w - 12) * (puntos.length === 1 ? 0 : i / (puntos.length - 1));
  const PY = (v: number) => y + 6 + (h - 12) * (1 - (v - min) / (max - min));
  for (let i = 0; i < puntos.length - 1; i++) {
    ops.push({ tipo: 'linea', x1: PX(i), y1: PY(puntos[i].valor), x2: PX(i + 1), y2: PY(puntos[i + 1].valor), color: AMBAR, grosor: 1.6 });
  }
  puntos.forEach((p, i) => ops.push({ tipo: 'rect', x: PX(i) - 1.6, y: PY(p.valor) - 1.6, w: 3.2, h: 3.2, color: AMBAR }));
  const ult = puntos[puntos.length - 1], pri = puntos[0];
  const rango = `${pri.valor} -> ${ult.valor} ${unidad}`;
  ops.push({ tipo: 'texto', x: x + w - ancho(rango, 8.5, true), y: y - 6, texto: rango, tam: 8.5, negrita: true, color: AMBAR });
  ops.push({ tipo: 'texto', x, y: y + h + 11, texto: fmtFecha(pri.fecha), tam: 7.5, color: GRISMED });
  ops.push({ tipo: 'texto', x: x + w - 52, y: y + h + 11, texto: fmtFecha(ult.fecha), tam: 7.5, color: GRISMED });
}

/* ============================================================
   📄 REPORTE DE PROGRESO FÍSICO (2 páginas)
   ============================================================ */
export function exportarProgresoPDF(a: Atleta, m: Membrete): string | null {
  const s = m.sistema ?? 'imperial';
  const cmp = compararProgreso(a, s);
  if (!cmp) return null;
  const { ant, act, dias, filas, avances, retros, iguales, frase } = cmp;
  const { ops, T, TD, L, encabezado, pie } = lienzo(m);

  encabezado();
  T(64, 110, 'REPORTE DE PROGRESO FÍSICO', 21, true);
  T(64, 136, 'Atleta: ' + a.nombre, 13, true);
  T(64, 154, `Período comparado: ${fmtFecha(ant.fecha)} -> ${fmtFecha(act.fecha)}  (${dias} días)`, 11, false, GRIS);
  if (a.objetivoTexto) T(64, 171, 'Meta: ' + a.objetivoTexto, 11, false, GRIS);

  let y = a.objetivoTexto ? 198 : 188;
  T(64, y, 'MEDIDAS COMPARADAS', 10, true, GRIS);
  y += 8; L(y); y += 18;
  T(64, y, 'Zona', 9, true, GRIS); T(272, y, 'Antes', 9, true, GRIS); T(348, y, 'Ahora', 9, true, GRIS);
  T(424, y, 'Cambio', 9, true, GRIS); T(487, y, 'Resultado', 9, true, GRIS);
  y += 6;
  filas.forEach((f) => {
    y += 19;
    T(64, y, f.zona, 11);
    T(272, y, f.antes, 11, false, GRIS);
    T(348, y, f.ahora, 11, true);
    T(424, y, f.delta === 0 ? '0.0' : (f.delta > 0 ? '+' : '') + f.delta, 11, true, f.delta === 0 ? GRISMED : f.ev.color);
    T(487, y, f.ev.texto, 10, true, f.ev.color);
  });
  y += 14; L(y);

  // Resumen
  y += 16;
  const malo = retros > avances;
  const borde = malo ? ROJO : VERDE;
  ops.push({ tipo: 'rect', x: 64, y, w: 484, h: 52, color: malo ? [0.99, 0.95, 0.94] : [0.93, 0.98, 0.95] });
  ops.push({ tipo: 'rectBorde', x: 64, y, w: 484, h: 52, color: borde, grosor: 1.2 });
  T(80, y + 21, `RESUMEN:  ${avances} zona${avances === 1 ? '' : 's'} mejoraron  ·  ${iguales} sin cambio  ·  ${retros} retroceso${retros === 1 ? '' : 's'}`, 12, true, borde);
  T(80, y + 40, frase, 10.5);
  y += 52;

  // Objetivos con barra de avance
  const conDatos = a.objetivos.map((ob) => ({ ob, av: avanceObjetivo(a, ob) })).filter((x) => x.av.pct !== null).slice(0, 3);
  if (conDatos.length) {
    y += 28;
    T(64, y, 'AVANCE DE OBJETIVOS', 10, true, GRIS);
    y += 8; L(y);
    conDatos.forEach(({ ob, av }) => {
      const pct = av.pct!;
      y += 20;
      T(64, y, `${ob.titulo}  (${verValorObjetivo(ob, ob.valorInicial, s)} -> ${verValorObjetivo(ob, ob.valorObjetivo, s)} ${unidadObjetivo(ob, s)})`, 11, true);
      TD(548, y, pct + '%', 12, true, pct === 100 ? VERDE : AMBAR);
      y += 10;
      ops.push({ tipo: 'rectBorde', x: 64, y, w: 400, h: 9, color: LINEA });
      if (pct > 0) ops.push({ tipo: 'rect', x: 64, y, w: Math.max(6, (400 * pct) / 100), h: 9, color: pct === 100 ? VERDE : AMBAR });
      y += 9;
    });
  }
  pie(`Generado el ${fmtFecha(hoyISO())}  ·  Reporte de seguimiento — Coach Fénix`);

  // Página 2: gráficas de evolución
  const metricas: [string, string, string][] = [['peso', 'Peso corporal', uPeso(s)], ...ZONAS.map(([z, n]) => [z, n, uLargo(s)] as [string, string, string])];
  const conv = (clave: string, v: number) => (clave === 'peso' ? pesoVer(v, s) : largoVer(v, s))!;
  const series = metricas
    .map((mm) => ({ mm, s: serieMedida(a, mm[0]).map((p) => ({ fecha: p.fecha, valor: conv(mm[0], p.valor) })) }))
    .filter((x) => x.s.length >= 2);
  const paginas = [ops];
  if (series.length) {
    const p2 = lienzo(m);
    p2.encabezado();
    p2.T(64, 108, 'EVOLUCIÓN DE MEDIDAS — ' + a.nombre.toUpperCase(), 14, true);
    p2.T(64, 126, `Todas las mediciones registradas (${a.medidas.length})`, 10, false, GRIS);
    let yG = 158;
    graficaPDF(p2.ops, { x: 64, y: yG, w: 484, h: 110, puntos: series[0].s, titulo: series[0].mm[1], unidad: series[0].mm[2] });
    yG += 158;
    series.slice(1, 9).forEach((sp, i) => {
      graficaPDF(p2.ops, { x: 64 + (i % 2) * 252, y: yG + Math.floor(i / 2) * 128, w: 232, h: 82, puntos: sp.s, titulo: sp.mm[1], unidad: sp.mm[2] });
    });
    p2.pie(`Generado el ${fmtFecha(hoyISO())}  ·  Coach Fénix`);
    p2.TD(548, 726, 'pág. 2/2', 8, false, GRISMED);
    paginas.push(p2.ops);
  }
  const pdf = construirPDF(paginas, m.logo);
  descargarPDF(`Progreso_${slug(a.nombre)}_${act.fecha}.pdf`, pdf);
  return pdf;
}

/* ============================================================
   🧾 RECIBO DE PAGO
   ============================================================ */
export function reciboPagoPDF(a: Atleta, pago: PagoAtleta, m: Membrete): string {
  const num = String(a.pagos.findIndex((p) => p.id === pago.id) + 1).padStart(4, '0');
  const { ops, T, TD, encabezado, pie, firma } = lienzo(m);
  encabezado();
  T(64, 116, 'RECIBO DE PAGO', 21, true);
  TD(548, 116, 'No. ' + num, 14, true, AMBAR);
  T(64, 150, 'Fecha del pago:', 11, false, GRIS); T(200, 150, fmtFecha(pago.fecha), 11.5, true);
  T(64, 172, 'Recibido de:', 11, false, GRIS); T(200, 172, a.nombre, 11.5, true);
  T(64, 194, 'Concepto:', 11, false, GRIS); T(200, 194, pago.concepto || 'Mensualidad de entrenamiento', 11.5);
  T(64, 216, 'Método de pago:', 11, false, GRIS); T(200, 216, pago.metodo || '—', 11.5);
  ops.push({ tipo: 'rect', x: 64, y: 246, w: 484, h: 74, color: [0.93, 0.98, 0.95] });
  ops.push({ tipo: 'rectBorde', x: 64, y: 246, w: 484, h: 74, color: VERDE, grosor: 1.4 });
  T(84, 278, 'MONTO RECIBIDO', 9, true, GRIS);
  T(84, 306, fmtDinero(pago.monto), 26, true, VERDE);
  if (a.proximoPago) T(64, 352, 'Próximo vencimiento: ' + fmtFecha(a.proximoPago), 10.5, false, GRISMED);
  ops.push({ tipo: 'linea', x1: 340, y1: 436, x2: 548, y2: 436, color: GRISMED, grosor: 1 });
  T(444 - ancho(firma, 10, true) / 2, 452, firma, 10, true, GRIS);
  pie(`Generado el ${fmtFecha(hoyISO())} con Coach Fénix  ·  coachfenix.com`, false);
  const pdf = construirPDF([ops], m.logo);
  descargarPDF(`Recibo_${num}_${slug(a.nombre)}.pdf`, pdf);
  return pdf;
}

/* ============================================================
   📊 REPORTE MENSUAL DEL NEGOCIO
   ============================================================ */
function datosMes(atletas: Atleta[], anio: number, mes: number) {
  const pref = anio + '-' + String(mes + 1).padStart(2, '0');
  const enMes = (f: string) => typeof f === 'string' && f.startsWith(pref);
  let ingresos = 0, numPagos = 0, totE = 0, totF = 0;
  const porAtleta: { a: Atleta; e: number; f: number }[] = [];
  atletas.forEach((a) => {
    a.pagos.forEach((p) => { if (enMes(p.fecha)) { ingresos += p.monto; numPagos++; } });
    let e = 0, f = 0;
    Object.entries(a.asistencia).forEach(([iso, v]) => {
      if (enMes(iso)) { if (v === 'E') e++; else if (v === 'F') f++; }
    });
    totE += e;
    totF += f;
    porAtleta.push({ a, e, f });
  });
  const mediciones = atletas.reduce((s, a) => s + a.medidas.filter((x) => enMes(x.fecha)).length, 0);
  const nuevos = atletas.filter((a) => enMes(a.fechaRegistro)).length;
  return { ingresos, numPagos, totE, totF, porAtleta, mediciones, nuevos };
}

/** Meses ofrecidos en el selector: el actual y los 5 anteriores ("YYYY-MM"). */
export function mesesReporte(): { valor: string; etiqueta: string }[] {
  const hoy = new Date(hoyISO() + 'T00:00:00');
  return Array.from({ length: 6 }, (_, i) => {
    const f = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    return {
      valor: f.getFullYear() + '-' + String(f.getMonth() + 1).padStart(2, '0'),
      etiqueta: `${MESES_ES[f.getMonth()]} ${f.getFullYear()}${i === 0 ? ' (mes actual)' : ''}`,
    };
  });
}

export function reporteMensualPDF(atletas: Atleta[], valorMes: string, m: Membrete): string {
  const [anio, mesN] = valorMes.split('-').map(Number);
  const mes = mesN - 1;
  const d = datosMes(atletas, anio, mes);
  const fAnt = new Date(anio, mes - 1, 1);
  const dAnt = datosMes(atletas, fAnt.getFullYear(), fAnt.getMonth());
  const nombreMes = MESES_ES[mes] + ' ' + anio;
  const nombreMesAnt = MESES_ES[fAnt.getMonth()] + ' ' + fAnt.getFullYear();

  const activos = atletas.filter((a) => a.activo).length;
  const inactivos = atletas.length - activos;
  const vencidos = atletas.filter(pagoVencido).sort((x, y) => (diasDesde(y.proximoPago) ?? 0) - (diasDesde(x.proximoPago) ?? 0));
  const porCobrar = vencidos.reduce((s, a) => s + a.tarifa, 0);
  const pendMed = atletas.filter((a) => a.activo && medicionPendiente(a)?.vencida).length;
  const primer = (a: Atleta) => a.nombre.split(' ')[0];

  const { ops, T, L, encabezado, pie } = lienzo(m);
  const Seccion = (y: number, titulo: string) => { T(64, y, titulo, 10, true, GRIS); L(y + 8); return y + 30; };

  encabezado();
  T(64, 110, 'REPORTE MENSUAL DEL NEGOCIO', 21, true);
  T(64, 134, nombreMes, 14, true, AMBAR);

  // FINANZAS
  let y = Seccion(168, 'FINANZAS');
  T(64, y, `Ingresos cobrados en ${nombreMes}:`, 11, false, GRIS);
  T(300, y, `${fmtDinero(d.ingresos)}  (${d.numPagos} pago${d.numPagos === 1 ? '' : 's'})`, 12, true, VERDE);
  y += 19;
  T(64, y, `Mes anterior (${nombreMesAnt}):`, 11, false, GRIS);
  let varTxt = '—';
  let varColor = GRISMED;
  if (dAnt.ingresos > 0) {
    const pct = Math.round(((d.ingresos - dAnt.ingresos) / dAnt.ingresos) * 100);
    varTxt = (pct >= 0 ? '+' : '') + pct + '%';
    varColor = pct >= 0 ? VERDE : ROJO;
  } else if (d.ingresos > 0) { varTxt = '+100%'; varColor = VERDE; }
  T(300, y, fmtDinero(dAnt.ingresos) + '   variación: ', 11, false, GRIS);
  T(452, y, varTxt, 12, true, varColor);
  y += 19;
  T(64, y, 'Cuentas por cobrar hoy:', 11, false, GRIS);
  T(300, y, `${fmtDinero(porCobrar)}  (${vencidos.length} atleta${vencidos.length === 1 ? '' : 's'})`, 12, true, porCobrar > 0 ? ROJO : VERDE);
  vencidos.slice(0, 5).forEach((a) => {
    y += 17;
    T(84, y, `· ${a.nombre} — ${fmtDinero(a.tarifa)} — vencido hace ${diasDesde(a.proximoPago)} días`, 10, false, ROJO);
  });
  if (vencidos.length > 5) { y += 17; T(84, y, `· ... y ${vencidos.length - 5} más`, 10, false, GRISMED); }

  // ATLETAS
  y = Seccion(y + 30, 'ATLETAS');
  T(64, y, `Total: ${atletas.length}    Activos: ${activos}    Inactivos: ${inactivos}    Nuevos en el mes: ${d.nuevos}`, 11.5, true);

  // ASISTENCIA
  y = Seccion(y + 30, 'ASISTENCIA DEL MES');
  const totalMarcas = d.totE + d.totF;
  const pctAsist = totalMarcas ? Math.round((d.totE / totalMarcas) * 100) : null;
  T(64, y, `Entrenamientos: ${d.totE}    Faltas: ${d.totF}    Asistencia global: ${pctAsist === null ? 'sin registros' : pctAsist + '%'}`, 11.5, true,
    pctAsist === null ? GRISMED : pctAsist >= 75 ? VERDE : pctAsist >= 50 ? AMBAR : ROJO);
  const constantes = d.porAtleta.filter((x) => x.e > 0).sort((p, q) => q.e - p.e).slice(0, 3);
  if (constantes.length) {
    y += 19;
    T(64, y, 'Más constantes: ' + constantes.map((x) => `${primer(x.a)} (${x.e})`).join('  ·  '), 10.5, false, GRIS);
  }
  const sinEntrenar = d.porAtleta.filter((x) => x.a.activo && x.e === 0);
  if (sinEntrenar.length && totalMarcas) {
    y += 17;
    T(64, y, `Activos sin entrenos registrados este mes: ${sinEntrenar.length} (${sinEntrenar.slice(0, 4).map((x) => primer(x.a)).join(', ')}${sinEntrenar.length > 4 ? '...' : ''})`, 10.5, false, ROJO);
  }

  // SEGUIMIENTO
  y = Seccion(y + 30, 'SEGUIMIENTO');
  T(64, y, `Mediciones registradas en el mes: ${d.mediciones}    Atletas con medición pendiente hoy: ${pendMed}`, 11.5, true);

  // LECTURA DEL MES
  y = Seccion(y + 30, 'LECTURA DEL MES');
  const lineas: string[] = [];
  if (dAnt.ingresos > 0 && d.ingresos >= dAnt.ingresos) lineas.push(`El negocio creció ${varTxt} respecto a ${nombreMesAnt}. ¡Buen ritmo!`);
  else if (dAnt.ingresos > 0) lineas.push(`Los ingresos bajaron ${varTxt} vs ${nombreMesAnt}: revisa renovaciones y cobros.`);
  if (porCobrar > 0) lineas.push(`Prioridad inmediata: cobrar ${fmtDinero(porCobrar)} en mensualidades vencidas.`);
  if (sinEntrenar.length && totalMarcas) {
    lineas.push(`${sinEntrenar.length} atleta${sinEntrenar.length === 1 ? ' activo no registra' : 's activos no registran'} entrenos: contactar antes de que se pierdan.`);
  }
  if (pendMed > 0) lineas.push(`${pendMed} atleta${pendMed === 1 ? '' : 's'} con medición pendiente: agenda las cintas esta semana.`);
  if (!lineas.length) lineas.push('Mes en orden: cobros al día y seguimiento completo. A seguir creciendo.');
  lineas.slice(0, 4).forEach((l) => { T(64, y, '· ' + l, 10.5); y += 17; });

  pie(`Generado el ${fmtFecha(hoyISO())}  ·  Coach Fénix`);
  const pdf = construirPDF([ops], m.logo);
  descargarPDF(`Reporte_Mensual_${MESES_ES[mes]}_${anio}.pdf`, pdf);
  return pdf;
}

/* ============================================================
   🍽️ PLAN DE ALIMENTACIÓN SUGERIDO
   ============================================================ */
/** Convierte el PDF (cadena binaria) en Blob para compartirlo o descargarlo. */
export function pdfABlob(pdf: string): Blob {
  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
  return new Blob([bytes], { type: 'application/pdf' });
}

/** Parte un texto en líneas que caben en `max` puntos de ancho. */
function envolver(texto: string, tam: number, max: number, negrita = false): string[] {
  const lineas: string[] = [];
  let actual = '';
  for (const p of texto.split(' ')) {
    const prueba = actual ? actual + ' ' + p : p;
    if (actual && ancho(prueba, tam, negrita) > max) {
      lineas.push(actual);
      actual = p;
    } else actual = prueba;
  }
  if (actual) lineas.push(actual);
  return lineas;
}

/** Arma el PDF del plan de comidas (no lo descarga): devuelve nombre de archivo y contenido. */
export function planComidasPDF(a: Atleta, p: PlanComidas, m: Membrete): { archivo: string; pdf: string } {
  const { ops, T, TD, encabezado, pie } = lienzo(m);
  encabezado();
  T(64, 112, 'PLAN DE ALIMENTACIÓN', 20, true);
  T(64, 134, 'Atleta: ' + a.nombre, 12, true);
  T(64, 152, `${p.titulo}  ·  Objetivo: ${p.objetivo.toLowerCase()}`, 10.5, false, GRIS);

  // Resumen del día
  ops.push({ tipo: 'rect', x: 64, y: 166, w: 484, h: 46, color: [0.97, 0.95, 0.92] });
  ops.push({ tipo: 'rectBorde', x: 64, y: 166, w: 484, h: 46, color: AMBAR, grosor: 1.1 });
  T(80, 184, 'CALORÍAS DEL DÍA', 8, true, GRIS);
  T(80, 202, `≈ ${(Math.round(p.kcal / 10) * 10).toLocaleString('en-US')} kcal`, 14, true);
  T(250, 184, 'PROTEÍNA', 8, true, GRIS);
  T(250, 202, `${Math.round(p.prot)} g`, 14, true);
  T(380, 184, 'DISTRIBUCIÓN', 8, true, GRIS);
  T(380, 202, `${p.comidas.length} comidas al día`, 12, true);

  // Comidas en dos columnas
  const colW = 236, gap = 12, x0 = 64;
  let y = 230;
  for (let i = 0; i < p.comidas.length; i += 2) {
    const fila = p.comidas.slice(i, i + 2);
    const altos = fila.map((c) => 56 + c.items.reduce((s, it) => s + envolver(it.texto, 10, colW - 40).length * 14, 0) + 16);
    const alto = Math.max(...altos);
    fila.forEach((c, j) => {
      const x = x0 + j * (colW + gap);
      ops.push({ tipo: 'rectBorde', x, y, w: colW, h: alto, color: LINEA, grosor: 1 });
      ops.push({ tipo: 'rect', x, y, w: 4, h: alto, color: AMBAR });
      // Número de la comida en un círculo (cuadro) de color
      ops.push({ tipo: 'rect', x: x + 14, y: y + 12, w: 20, h: 20, color: AMBAR });
      T(x + 21 - (i + j >= 9 ? 3 : 0), y + 26, String(i + j + 1), 11, true, [1, 1, 1]);
      T(x + 42, y + 22, c.nombre, 12, true);
      T(x + 42, y + 36, c.hora, 9, false, GRIS);
      let yy = y + 56;
      c.items.forEach((it) => {
        envolver(it.texto, 10, colW - 40).forEach((l, k) => {
          T(x + 18, yy, k === 0 ? '•' : '', 10, true, AMBAR);
          T(x + 28, yy, l, 10);
          yy += 14;
        });
      });
      if (c.prot || c.kcal) T(x + 18, y + alto - 12, `Proteína aprox.: ${Math.round(c.prot)} g  ·  ≈ ${Math.round(c.kcal / 10) * 10} kcal`, 8.5, false, GRIS);
    });
    y += alto + 12;
  }

  // Equivalencias
  y += 6;
  T(64, y, 'EQUIVALENCIAS PARA VARIAR EL MENÚ', 9, true, GRIS);
  y += 16;
  for (const [t, d] of EQUIVALENCIAS) {
    const lineas = envolver(d.replace(/↔/g, '/'), 9, 484 - 90);
    T(64, y, t + ':', 9, true);
    lineas.forEach((l, k) => T(154, y + k * 12, l, 9, false, OSCURO));
    y += lineas.length * 12 + 4;
  }
  y += 8;
  envolver('Bebe agua durante el día. Plan orientativo: no sustituye la valoración de un nutricionista, sobre todo si hay condiciones médicas o alergias. Avísale a tu entrenador si algún alimento no te cae bien para cambiarlo.', 8.5, 484)
    .forEach((l, k) => T(64, y + k * 11, l, 8.5, false, GRISMED));

  pie(`Generado el ${fmtFecha(hoyISO())} con Coach Fénix  ·  coachfenix.com`);
  return { archivo: `Plan_alimentacion_${slug(a.nombre)}.pdf`, pdf: construirPDF([ops], m.logo) };
}

/** Descarga un PDF ya armado. */
export function descargarPlanPDF(archivo: string, pdf: string) {
  descargarPDF(archivo, pdf);
}
