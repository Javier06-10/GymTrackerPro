// @ts-nocheck
/* ============================================================
   📖 MANUAL DEL ENTRENADOR — ENTRENAMIENTO FEMENINO
   Contenido portado tal cual de la plantilla (HTML estático propio,
   sin datos del usuario). Lo muestra pages/manual con [innerHTML].
   ============================================================ */

export interface CapituloManual { id: string; t: string; h: string }

// Mismo acabado que el avatar: fondo radial y volumen en las piezas.
const DEFS_FIG = `<defs>
  <linearGradient id="figCuerpo" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#d9deea"/><stop offset=".35" stop-color="#fbfcfe"/><stop offset="1" stop-color="#d3d9e6"/>
  </linearGradient>
  <radialGradient id="figFondo" cx=".5" cy=".4" r=".8">
    <stop offset="0" stop-color="#eaedf4"/><stop offset="1" stop-color="#d0d6e3"/>
  </radialGradient>
</defs>`;
function figManual(svg, pie){
  const conDefs = svg.replace(/<svg([^>]*)>/, '<svg$1>' + DEFS_FIG).replace('fill="#e7ebf3"', 'fill="url(#figFondo)"')
    // Las leyendas largas al pie del dibujo se salían del recuadro: se parten en dos líneas
    .replace(/<text x="(\d+)" y="(\d+)" ([^>]*)>([^<]{44,})<\/text>/g, (_m, x, y, attrs, txt) => {
      const medio = txt.lastIndexOf(' ', Math.ceil(txt.length / 2) + 4);
      const a = txt.slice(0, medio), b = txt.slice(medio + 1);
      const at = attrs.replace(/font-size="[\d.]+"/, 'font-size="10"');
      return `<text x="${x}" y="${+y - 7}" ${at}>${a}</text><text x="${x}" y="${+y + 6}" ${at}>${b}</text>`;
    });
  return `<figure class="fig-manual">${conDefs}<figcaption>${pie}</figcaption></figure>`;
}
const _FM = 'fill="url(#figCuerpo)" stroke="#2e3558" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"';
const _FL = 'fill="none" stroke="#2e3558" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"';
const _FT = 'fill="#2e3558" font-family="system-ui" font-size="11" font-weight="700"';

function svgGluteosAnatomia(){
  return `<svg viewBox="0 0 300 210" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="296" height="206" rx="14" fill="#e7ebf3"/>
    <path d="M 115 22 C 112 60, 112 80, 118 96 L 182 96 C 188 80, 188 60, 185 22" ${_FL}/>
    <line x1="150" y1="26" x2="150" y2="94" stroke="#3d4468" stroke-width="2" opacity=".5"/>
    <path d="M 148 96 C 96 90, 82 128, 96 158 C 106 176, 134 178, 148 158 C 152 146, 152 116, 148 96 Z" ${_FM}/>
    <path d="M 152 96 C 204 90, 218 128, 204 158 C 194 176, 166 178, 152 158 C 148 146, 148 116, 152 96 Z" ${_FM}/>
    <path d="M 196 96 C 204 84, 196 70, 180 68 C 166 67, 156 76, 154 88" ${_FL}/>
    <path d="M 116 86 C 112 78, 118 70, 128 70" fill="none" stroke="#3d4468" stroke-width="2" stroke-dasharray="4 4" opacity=".8"/>
    <text x="14" y="70" ${_FT}>Glúteo</text><text x="14" y="82" ${_FT}>medio</text>
    <line x1="46" y1="76" x2="106" y2="80" stroke="#3d4468" stroke-width="1.4" opacity=".6"/>
    <text x="216" y="56" ${_FT}>Glúteo menor</text>
    <line x1="238" y1="60" x2="186" y2="76" stroke="#3d4468" stroke-width="1.4" opacity=".6"/>
    <text x="230" y="148" ${_FT}>Glúteo</text><text x="230" y="160" ${_FT}>mayor</text>
    <line x1="228" y1="150" x2="200" y2="140" stroke="#3d4468" stroke-width="1.4" opacity=".6"/>
    <text x="92" y="198" ${_FT}>Vista posterior de la pelvis</text>
  </svg>`;
}
/* ---------- Deportista ilustrada para las figuras de ejercicios ----------
   Cada pieza del cuerpo es una forma orgánica (se afina hacia muñecas y tobillos
   y tiene el vientre del músculo: cuádriceps, isquios, gemelo, bíceps, pecho…).
   Se pinta en capas: silueta de contorno → color del material → degradado
   perpendicular a la pieza (sombra-luz-sombra, como un cilindro iluminado).
   Ropa: top deportivo, leggings y tenis. El lado lejano va en sombra.
   Coordenadas en el viewBox 300×190. */
const TINTA = '#23283f';
const MATERIAL = {
  piel:     { base: '#d9a07f', luz: '#f2c9ad', sombra: '#a8704f' },
  top:      { base: '#e07f2e', luz: '#f7a560', sombra: '#a9561a' },
  legging:  { base: '#3a4262', luz: '#606a92', sombra: '#232842' },
  zapato:   { base: '#eef1f6', luz: '#ffffff', sombra: '#aab2c4' },
  pelo:     { base: '#3b2a22', luz: '#6a4c3e', sombra: '#21160f' },
  topH:     { base: '#4a8bd8', luz: '#7fb2ec', sombra: '#2c5f9f' },
  short:    { base: '#323a57', luz: '#565f83', sombra: '#1f2439' },
};
let _idFig = 0;
/** Género de las figuras ('mujer' | 'hombre'); lo fija construirManual(). */
let _GEN = 'mujer';
const MOV = '#d0731f'; // flechas de movimiento: ámbar validado para lectura

/** Línea interior de una pieza (definición muscular). pts: [t, s] a lo largo y a lo ancho (s=1 posterior, -1 anterior). */
function _musculo(f, pts, color, w = 1.15, op = .55){
  const [a, b, c] = pts.map(([t, sd]) => f.P(t, sd, 0).map(_r));
  return `<path d="M ${a[0]} ${a[1]} Q ${b[0]} ${b[1]} ${c[0]} ${c[1]}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`;
}

/** Flecha de movimiento (simple o doble). */
function _flecha(d, doble = false){
  const id = 'mv' + (++_idFig);
  return `<defs><marker id="${id}" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="${MOV}"/></marker></defs>
    <path d="${d}" fill="none" stroke="${MOV}" stroke-width="2.6" stroke-linecap="round" marker-end="url(#${id})" ${doble ? `marker-start="url(#${id})"` : ''}/>`;
}

const _v = (a, b) => [b[0] - a[0], b[1] - a[1]];
const _r = (n) => Math.round(n * 10) / 10;

/** Forma de una pieza entre A y B: anchos wa→wb, vientres "post" (lado posterior) y "ant" en t. */
function _pieza(A, B, wa, wb, post = 0, ant = 0, tPost = 0.4, tAnt = 0.45, lado = 1){
  const d = _v(A, B), L = Math.hypot(d[0], d[1]) || 1;
  const u = [d[0] / L, d[1] / L], n = [-u[1] * lado, u[0] * lado];
  const ha = wa / 2, hb = wb / 2;
  const P = (t, s, extra) => { const h = ha + (hb - ha) * t + extra; return [A[0] + d[0] * t + n[0] * h * s, A[1] + d[1] * t + n[1] * h * s]; };
  const ctrl = (t, s, bulto) => { const m = P(t, s, bulto * 2); return m; };
  const a1 = P(0, 1, 0), b1 = P(1, 1, 0), b2 = P(1, -1, 0), a2 = P(0, -1, 0);
  const c1 = ctrl(tPost, 1, post), c2 = ctrl(tAnt, -1, ant);
  const k = 1.33;
  return {
    d: `M ${_r(a1[0])} ${_r(a1[1])} Q ${_r(c1[0])} ${_r(c1[1])} ${_r(b1[0])} ${_r(b1[1])} `
     + `C ${_r(b1[0] + u[0] * hb * k)} ${_r(b1[1] + u[1] * hb * k)} ${_r(b2[0] + u[0] * hb * k)} ${_r(b2[1] + u[1] * hb * k)} ${_r(b2[0])} ${_r(b2[1])} `
     + `Q ${_r(c2[0])} ${_r(c2[1])} ${_r(a2[0])} ${_r(a2[1])} `
     + `C ${_r(a2[0] - u[0] * ha * k)} ${_r(a2[1] - u[1] * ha * k)} ${_r(a1[0] - u[0] * ha * k)} ${_r(a1[1] - u[1] * ha * k)} ${_r(a1[0])} ${_r(a1[1])} Z`,
    // Eje para el degradado: de un borde al otro por la mitad de la pieza
    g1: P(0.5, 1, Math.max(post, 0)), g2: P(0.5, -1, Math.max(ant, 0)),
    P,
  };
}

/** Pinta un grupo de piezas como una sola silueta (sin líneas internas) con su sombreado. */
function _grupo(piezas, fid, oscuro = false){
  let contorno = '', color = '', luz = '', defs = '';
  piezas.forEach((p) => {
    const id = `${fid}-${++_idFig}`;
    const m = MATERIAL[p.mat];
    contorno += `<path d="${p.forma.d}" fill="${TINTA}" stroke="${TINTA}" stroke-width="3.2" stroke-linejoin="round"/>`;
    color += `<path d="${p.forma.d}" fill="${m.base}"/>`;
    defs += `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${_r(p.forma.g1[0])}" y1="${_r(p.forma.g1[1])}" x2="${_r(p.forma.g2[0])}" y2="${_r(p.forma.g2[1])}">
      <stop offset="0" stop-color="${m.sombra}"/><stop offset=".32" stop-color="${m.luz}"/><stop offset=".62" stop-color="${m.base}"/><stop offset="1" stop-color="${m.sombra}"/></linearGradient>`;
    luz += `<path d="${p.forma.d}" fill="url(#${id})"/>`;
    if(p.extra) luz += p.extra;
  });
  const sombra = oscuro ? piezas.map((p) => `<path d="${p.forma.d}" fill="#141829" opacity=".32"/>`).join('') : '';
  return `<defs>${defs}</defs>${contorno}${color}${luz}${sombra}`;
}

/** Cabeza de perfil con nariz, mandíbula, oreja y cola de caballo. mira = 1 derecha / -1 izquierda. */
function _cabeza(c, mira, fid){
  const [x, y] = c, m = mira;
  const id = `${fid}-cab`;
  const X = (dx) => _r(x + dx * m);
  const cara = `M ${X(-10)} ${y - 4} C ${X(-11)} ${y - 15}, ${X(4)} ${y - 17}, ${X(9)} ${y - 8} `
    + `C ${X(10)} ${y - 5}, ${X(10)} ${y - 3}, ${X(12.5)} ${y + 1} L ${X(10)} ${y + 2.5} `
    + `C ${X(10.5)} ${y + 6}, ${X(8)} ${y + 9}, ${X(4)} ${y + 11} C ${X(-1)} ${y + 12}, ${X(-6)} ${y + 10}, ${X(-8)} ${y + 6} `
    + `C ${X(-11)} ${y + 3}, ${X(-11)} ${y}, ${X(-10)} ${y - 4} Z`;
  const pelo = `M ${X(-10.5)} ${y + 1} C ${X(-12)} ${y - 14}, ${X(3)} ${y - 18}, ${X(9.5)} ${y - 8} `
    + `C ${X(3)} ${y - 11}, ${X(-3)} ${y - 9}, ${X(-5)} ${y - 1} Z`;
  const hombre = _GEN === 'hombre';
  const peloH = `M ${X(-10.5)} ${y - 1} C ${X(-12)} ${y - 14}, ${X(3)} ${y - 17}, ${X(9.5)} ${y - 8} `
    + `C ${X(4)} ${y - 10.5}, ${X(-2)} ${y - 10}, ${X(-6)} ${y - 4} Z`;
  const cola = `M ${X(-9)} ${y - 8} C ${X(-20)} ${y - 9}, ${X(-24)} ${y + 2}, ${X(-21)} ${y + 13} `
    + `C ${X(-18)} ${y + 6}, ${X(-14)} ${y - 1}, ${X(-8)} ${y - 3} Z`;
  return `<defs><radialGradient id="${id}" cx="${m > 0 ? .62 : .38}" cy=".38" r=".7">
      <stop offset="0" stop-color="${MATERIAL.piel.luz}"/><stop offset=".6" stop-color="${MATERIAL.piel.base}"/><stop offset="1" stop-color="${MATERIAL.piel.sombra}"/></radialGradient></defs>
    ${hombre ? '' : `<path d="${cola}" fill="${MATERIAL.pelo.base}" stroke="${TINTA}" stroke-width="1.6" stroke-linejoin="round"/>`}
    <path d="${cara}" fill="url(#${id})" stroke="${TINTA}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="${hombre ? peloH : pelo}" fill="${MATERIAL.pelo.base}" stroke="${TINTA}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M ${X(-9)} ${y - 6} C ${X(-4)} ${y - 13}, ${X(3)} ${y - 14}, ${X(7)} ${y - 9}" fill="none" stroke="${MATERIAL.pelo.luz}" stroke-width="1.4" stroke-linecap="round"/>
    <ellipse cx="${X(-3)}" cy="${y + 1}" rx="2.4" ry="3.2" fill="${MATERIAL.piel.sombra}" stroke="${TINTA}" stroke-width="1.1"/>
    <path d="M ${X(5)} ${y - 2} q ${2 * m} -1 ${3.5 * m} 0" fill="none" stroke="${TINTA}" stroke-width="1.3" stroke-linecap="round"/>
    <path d="M ${X(7)} ${y + 6.5} q ${1.5 * m} 0.3 ${2.6 * m} -0.6" fill="none" stroke="#8a4b3a" stroke-width="1.2" stroke-linecap="round"/>`
    + (hombre ? `<path d="M ${X(-7)} ${y + 4} C ${X(-4)} ${y + 11}, ${X(3)} ${y + 12}, ${X(8)} ${y + 9}" fill="none" stroke="${MATERIAL.piel.sombra}" stroke-width="1.4" opacity=".55"/>` : '');
}

/** Tenis: del tobillo a la punta, con suela. */
function _zapato(tobillo, punta){
  const d = _v(tobillo, punta), L = Math.hypot(d[0], d[1]) || 1, u = [d[0] / L, d[1] / L];
  const talon = [tobillo[0] - u[0] * 6, tobillo[1] + 4];
  const forma = _pieza(talon, punta, 10, 8.5, 0, 0, .4, .45, 1);
  const suela = `M ${_r(talon[0] - u[0] * 2)} ${_r(talon[1] + 5)} L ${_r(punta[0] + u[0] * 4)} ${_r(punta[1] + 4.5)}`;
  return { forma, extra: `<path d="${suela}" stroke="${TINTA}" stroke-width="3.4" stroke-linecap="round"/>`
    + `<path d="M ${_r(talon[0] + u[0] * 6)} ${_r(talon[1] - 2)} l ${_r(u[0] * 9)} ${_r(u[1] * 9 - 1)}" stroke="#9aa2b8" stroke-width="1.2" stroke-linecap="round"/>` };
}

/**
 * p: cabeza [x,y], hombro, codo, muneca, cadera, rodilla, tobillo, punta (del pie),
 *    mira (1 = derecha, -1 = izquierda), lejos: desplazamiento del brazo y pierna del fondo,
 *    brazoLejos / piernaLejos: articulaciones propias del lado lejano (opcional).
 */
function maniqui(p){
  const fid = 'dep' + (++_idFig);
  const m = p.mira;
  const off = (pt) => [pt[0] + p.lejos[0], pt[1] + p.lejos[1]];
  const pl = p.piernaLejos || [p.cadera, p.rodilla, p.tobillo, p.punta].map(off);
  const bl = p.brazoLejos || [p.hombro, p.codo, p.muneca].map(off);

  const H = _GEN === 'hombre';
  const matMuslo = H ? 'short' : 'legging', matPierna = H ? 'piel' : 'legging', matTop = H ? 'topH' : 'top';
  const sombraDe = (mat) => MATERIAL[mat].sombra, luzDe = (mat) => MATERIAL[mat].luz;
  const pierna = (c, r, t, pt) => {
    const z = _zapato(t, pt);
    const muslo = _pieza(c, r, 19, H ? 13 : 12.5, H ? 2.2 : 2.6, H ? 3.4 : 3, .42, .45, m);
    const gemelo = _pieza(r, t, H ? 12.5 : 12, H ? 8 : 7.5, H ? 4 : 3.6, 0.6, .28, .4, m);
    return [
      { mat: matMuslo, forma: muslo, extra:                                     // cuádriceps, rótula y pliegue del glúteo
          _musculo(muslo, [[.2, -.15], [.55, -.6], [.9, -.35]], sombraDe(matMuslo))
        + _musculo(muslo, [[.84, -.92], [.97, -.75], [.95, -.3]], luzDe(matMuslo), 1.3, .7)
        + _musculo(muslo, [[.06, .95], [.16, .5], [.12, .05]], sombraDe(matMuslo), 1.1, .5) },
      { mat: matPierna, forma: gemelo, extra:                                   // gemelo y canto de la tibia
          _musculo(gemelo, [[.1, .25], [.3, .8], [.62, .5]], sombraDe(matPierna))
        + _musculo(gemelo, [[.15, -.6], [.5, -.72], [.85, -.6]], luzDe(matPierna), 1.2, .65) },
      { mat: 'zapato', forma: z.forma, extra: z.extra },
    ];
  };
  const brazo = (h, c, w) => {
    const sup = _pieza(h, c, H ? 13 : 11.5, H ? 9.4 : 8.2, H ? 1.8 : 1.4, H ? 2.4 : 1.8, .45, .4, m);
    const ante = _pieza(c, w, H ? 9.6 : 8.4, H ? 6.4 : 5.6, 1, 1.4, .3, .3, m);
    return [
      { mat: 'piel', forma: sup, extra:                                         // deltoides y surco bíceps/tríceps
          _musculo(sup, [[.14, -1], [.36, 0], [.14, 1]], MATERIAL.piel.sombra, 1.1, .5)
        + _musculo(sup, [[.32, .05], [.62, .2], [.9, 0]], MATERIAL.piel.sombra, 1.1, .5)
        + _musculo(sup, [[.4, -.55], [.62, -.75], [.85, -.5]], MATERIAL.piel.luz, 1.2, .7) },
      { mat: 'piel', forma: ante, extra: _musculo(ante, [[.1, -.2], [.42, -.45], [.85, -.1]], MATERIAL.piel.sombra, 1, .45) },
      { mat: 'piel', forma: _pieza(w, [w[0] + (w[0] - c[0]) * .22, w[1] + (w[1] - c[1]) * .22], 6.8, 5.6, .8, .8, .5, .5, m) }, // mano
    ];
  };
  const hombroBrazo = (h) => ({ mat: matTop, forma: _pieza(h, [h[0], h[1] + 1], H ? 15 : 14, H ? 15 : 14, 0, 0, .5, .5, m) }); // tirante sobre el deltoides

  let s = '';
  // 1) Lado lejano en sombra
  s += _grupo([...pierna(...pl), ...brazo(...bl)], fid, true);
  // 2) Cuerpo: torso (top + abdomen), glúteo, pierna cercana y cuello
  const T = (t) => [p.hombro[0] + (p.cadera[0] - p.hombro[0]) * t, p.hombro[1] + (p.cadera[1] - p.hombro[1]) * t];
  const dT = _v(p.hombro, p.cadera), LT = Math.hypot(dT[0], dT[1]) || 1;
  const nT = [-dT[1] / LT * m, dT[0] / LT * m]; // lado posterior del torso
  const gluteo = [p.cadera[0] + nT[0] * 4, p.cadera[1] + nT[1] * 4];
  const abdomen = _pieza(T(.45), T(.7), H ? 26 : 24, H ? 25 : 23, 0.5, 1, .5, .5, m);
  const cadera = _pieza(T(.62), gluteo, 24, H ? 23 : 25, H ? 2.6 : 4, 1, .55, .5, m);
  const pecho = _pieza(p.hombro, T(.5), H ? 31 : 27, H ? 26 : 24, H ? 2 : 1.6, H ? 3.6 : 3.2, .3, .3, m);
  const ombligo = abdomen.P(.55, -.72, 0);
  s += _grupo([
    ...pierna(p.cadera, p.rodilla, p.tobillo, p.punta),
    { mat: matMuslo, forma: cadera,                                             // cadera y glúteo
      extra: _musculo(cadera, [[.5, .2], [.85, .7], [1, .2]], sombraDe(matMuslo), 1.1, .45) },
    { mat: H ? matTop : 'piel', forma: abdomen,                                 // abdomen (descubierto en mujer)
      extra: H ? '' : _musculo(abdomen, [[.15, -.55], [.5, -.68], [.85, -.55]], MATERIAL.piel.sombra, 1.1, .45)
        + `<circle cx="${_r(ombligo[0])}" cy="${_r(ombligo[1])}" r="1" fill="${MATERIAL.piel.sombra}"/>` },
    { mat: matTop, forma: pecho,                                                // espalda / pecho
      extra: _musculo(pecho, [[.12, -.75], [.55, -.95], [.9, -.6]], sombraDe(matTop), 1.1, .45)
        + _musculo(pecho, [[.1, .3], [.45, .55], [.85, .4]], luzDe(matTop), 1.2, .55) },
    { mat: 'piel', forma: _pieza([p.cabeza[0] - 2 * m, p.cabeza[1] + 8], p.hombro, H ? 10 : 8.5, H ? 11.5 : 10, 0, 0, .5, .5, m) }, // cuello
  ], fid);
  s += _cabeza(p.cabeza, m, fid);
  // 3) Brazo cercano delante del cuerpo
  s += _grupo([hombroBrazo(p.hombro), ...brazo(p.hombro, p.codo, p.muneca)], fid);
  return s;
}

/* Equipo */
function _disco(x, y, r){
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="#3b4366" stroke="${TINTA}" stroke-width="2"/>
    <circle cx="${x}" cy="${y}" r="${r * 0.62}" fill="none" stroke="#6b7392" stroke-width="1.4"/>
    <circle cx="${x}" cy="${y}" r="${r * 0.18}" fill="#c9cfdd" stroke="${TINTA}" stroke-width="1.2"/>`;
}
function _banco(x, y, w, alto){
  return `<rect x="${x}" y="${y}" width="${w}" height="12" rx="5" fill="#4a5275" stroke="${TINTA}" stroke-width="2"/>
    <rect x="${x + 4}" y="${y + 2}" width="${w - 8}" height="3" rx="1.5" fill="#6d769b"/>
    <rect x="${x + 8}" y="${y + 12}" width="7" height="${alto}" fill="#9aa2b8" stroke="${TINTA}" stroke-width="1.6"/>
    <rect x="${x + w - 15}" y="${y + 12}" width="7" height="${alto}" fill="#9aa2b8" stroke="${TINTA}" stroke-width="1.6"/>`;
}
function _mancuerna(x, y){
  return `<rect x="${x - 9}" y="${y - 2}" width="18" height="4" rx="2" fill="#6b7392" stroke="${TINTA}" stroke-width="1.2"/>
    <rect x="${x - 12}" y="${y - 6}" width="6" height="12" rx="2" fill="#3b4366" stroke="${TINTA}" stroke-width="1.4"/>
    <rect x="${x + 6}" y="${y - 6}" width="6" height="12" rx="2" fill="#3b4366" stroke="${TINTA}" stroke-width="1.4"/>`;
}
const _suelo = (y) => {
  let juntas = '';
  for(let x = 42; x < 290; x += 48) juntas += `<line x1="${x}" y1="${y + 1}" x2="${x - 10}" y2="188" stroke="${TINTA}" stroke-width="1" opacity=".1"/>`;
  return `<rect x="2" y="${y - 34}" width="296" height="3" fill="${TINTA}" opacity=".05"/>
  <path d="M 2 ${y} H 298 V 174 Q 298 188 284 188 H 16 Q 2 188 2 174 Z" fill="#c5ccda" opacity=".55"/>
  ${juntas}
  <line x1="2" y1="${y}" x2="298" y2="${y}" stroke="${TINTA}" stroke-width="1.8" opacity=".38"/>
  <ellipse cx="150" cy="${y + 1}" rx="120" ry="3" fill="${TINTA}" opacity=".08"/>`;
};

function svgHipThrust(){
  return `<svg viewBox="0 0 300 190" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="296" height="186" rx="14" fill="#e7ebf3"/>
    ${_suelo(152)}
    ${_banco(26, 90, 78, 50)}
    ${maniqui({ cabeza:[82,68], hombro:[98,84], codo:[118,100], muneca:[146,84], cadera:[166,84],
      rodilla:[208,82], tobillo:[210,146], punta:[228,150], mira:1, lejos:[-4,-3] })}
    ${_disco(152, 70, 17)}
    ${_flecha('M 186 132 L 186 102')}
    <text x="168" y="58" ${_FT}>Cadera extendida</text>
    <text x="222" y="112" ${_FT}>Tibia</text><text x="222" y="124" ${_FT}>vertical</text>
    <text x="24" y="176" ${_FT}>Hip thrust: hombros en el banco, mirada al frente, cadera arriba</text>
  </svg>`;
}
function svgSentadilla(){
  return `<svg viewBox="0 0 300 190" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="296" height="186" rx="14" fill="#e7ebf3"/>
    ${_suelo(152)}
    <line x1="70" y1="108" x2="196" y2="108" stroke="${TINTA}" stroke-width="1.4" stroke-dasharray="5 4" opacity=".55"/>
    ${maniqui({ cabeza:[150,44], hombro:[140,64], codo:[122,76], muneca:[128,58], cadera:[118,108],
      rodilla:[168,106], tobillo:[156,146], punta:[176,150], mira:1, lejos:[5,-2] })}
    ${_disco(130, 62, 14)}
    ${_flecha('M 84 78 L 84 134', true)}
    <text x="202" y="112" ${_FT}>Muslo paralelo</text>
    <text x="40" y="42" ${_FT}>Espalda</text><text x="40" y="54" ${_FT}>neutra</text>
    <line x1="80" y1="50" x2="120" y2="66" stroke="${TINTA}" stroke-width="1.4" opacity=".6"/>
    <text x="24" y="176" ${_FT}>Sentadilla: pecho arriba, rodillas siguen la punta del pie, talón apoyado</text>
  </svg>`;
}
function svgRDL(){
  return `<svg viewBox="0 0 300 190" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="296" height="186" rx="14" fill="#e7ebf3"/>
    ${_suelo(150)}
    ${maniqui({ cabeza:[106,64], hombro:[126,78], codo:[132,102], muneca:[138,124], cadera:[176,84],
      rodilla:[174,116], tobillo:[178,146], punta:[160,150], mira:-1, lejos:[-4,-2] })}
    ${_disco(140, 126, 14)}
    ${_flecha('M 190 70 C 199 62, 208 63, 213 70')}
    <text x="218" y="74" ${_FT}>Cadera atrás</text>
    <text x="30" y="108" ${_FT}>Barra pegada</text><text x="30" y="120" ${_FT}>a las piernas</text>
    <line x1="96" y1="116" x2="124" y2="122" stroke="${TINTA}" stroke-width="1.4" opacity=".6"/>
    <text x="24" y="176" ${_FT}>Peso muerto rumano: bisagra de cadera, rodillas semiflexionadas</text>
  </svg>`;
}
function svgBulgarian(){
  return `<svg viewBox="0 0 300 190" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="296" height="186" rx="14" fill="#e7ebf3"/>
    ${_suelo(152)}
    ${_banco(186, 100, 76, 40)}
    ${maniqui({ cabeza:[110,38], hombro:[112,56], codo:[114,80], muneca:[115,100], cadera:[118,104],
      rodilla:[78,104], tobillo:[80,146], punta:[62,150], mira:-1, lejos:[3,-2],
      piernaLejos:[[120,103],[150,138],[196,104],[214,98]],
      brazoLejos:[[115,55],[118,79],[120,99]] })}
    ${_mancuerna(115, 104)}
    ${_flecha('M 46 98 L 46 138', true)}
    <text x="24" y="84" ${_FT}>Rodilla ~90°</text>
    <text x="158" y="66" ${_FT}>Pie trasero elevado</text>
    <line x1="196" y1="70" x2="206" y2="96" stroke="${TINTA}" stroke-width="1.4" opacity=".6"/>
    <text x="24" y="176" ${_FT}>Bulgarian split squat: el peso queda en la pierna delantera</text>
  </svg>`;
}
function svgOrdenSesion(){
  return `<svg viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="296" height="146" rx="14" fill="#e7ebf3"/>
    <rect x="16" y="24" width="80" height="38" rx="8" ${_FM}/>
    <text x="26" y="40" ${_FT}>1. Pesado</text><text x="26" y="53" ${_FT}>compuesto</text>
    <rect x="110" y="24" width="80" height="38" rx="8" ${_FM}/>
    <text x="118" y="40" ${_FT}>2. Compuesto</text><text x="118" y="53" ${_FT}>secundario</text>
    <rect x="204" y="24" width="80" height="38" rx="8" ${_FM}/>
    <text x="214" y="40" ${_FT}>3. Accesorio /</text><text x="214" y="53" ${_FT}>unilateral</text>
    <rect x="110" y="86" width="80" height="38" rx="8" ${_FM}/>
    <text x="120" y="102" ${_FT}>4. Aislado /</text><text x="120" y="115" ${_FT}>bombeo</text>
    <path d="M 96 43 L 108 43" ${_FL}/>
    <path d="M 190 43 L 202 43" ${_FL}/>
    <path d="M 244 62 C 244 78, 200 78, 192 86" ${_FL}/>
    <text x="16" y="140" ${_FT}>Orden dentro de la sesión: de lo más demandante a lo más simple</text>
  </svg>`;
}

function fichaEj(o){
  return `<div class="ficha-ej">
    <div class="ficha-cab"><span class="ficha-nombre">${o.nombre}</span>
      <span class="ficha-dosis">${o.series} · descanso ${o.descanso}</span></div>
    <div class="ficha-musc"><b>Principal:</b> ${o.principal} &nbsp;·&nbsp; <b>Secundarios:</b> ${o.secundarios}</div>
    <div class="ficha-sec"><div class="ficha-t">✅ Ejecución paso a paso</div><ol>${o.pasos.map(p=>"<li>"+p+"</li>").join("")}</ol></div>
    <div class="ficha-sec"><div class="ficha-t">❌ Errores comunes</div><ul>${o.errores.map(p=>"<li>"+p+"</li>").join("")}</ul></div>
    <div class="ficha-sec"><div class="ficha-t">🛡️ Seguridad</div><ul>${o.seguridad.map(p=>"<li>"+p+"</li>").join("")}</ul></div>
    <div class="ficha-sec"><div class="ficha-t">📈 Cómo progresar</div><p>${o.progresion}</p></div>
  </div>`;
}
function tablaM(cabeceras, filas){
  return `<div class="tabla-scroll"><table class="tabla-manual">
    <tr>${cabeceras.map(h=>"<th>"+h+"</th>").join("")}</tr>
    ${filas.map(f=>"<tr>"+f.map(c=>"<td>"+c+"</td>").join("")+"</tr>").join("")}
  </table></div>`;
}
const calloutEv = t => `<div class="callout callout-ev">🔬 <b>Evidencia:</b> ${t}</div>`;
const calloutPr = t => `<div class="callout callout-pr">🛠️ <b>Recomendación práctica:</b> ${t}</div>`;
const calloutSg = t => `<div class="callout callout-sg">⚠️ <b>Seguridad:</b> ${t}</div>`;
export function construirManual(genero: 'mujer' | 'hombre' = 'mujer'): CapituloManual[] {
_GEN = genero;
return [
{id:"intro", t:"Introducción", h:`
<h2>Manual del Entrenador · Entrenamiento Femenino</h2>
<p>Este manual está pensado para el entrenador personal de gimnasio que trabaja con clientas y quiere un método claro: <b>evaluar → definir objetivo → diseñar la rutina → aplicarla con buena técnica → progresar y medir</b>. Está escrito en lenguaje directo, con tablas y fichas listas para usar en el piso del gimnasio.</p>
<p>Un principio transversal: <b>las mujeres no necesitan un entrenamiento "especial" por ser mujeres</b>. Los principios de fuerza e hipertrofia son los mismos para ambos sexos. Lo que sí cambia en la práctica son los objetivos más frecuentes (glúteos y tren inferior, tono general, pérdida de grasa), el punto de partida promedio de fuerza absoluta y algunas consideraciones de adaptación que verás en los capítulos finales.</p>
${calloutEv("Los estudios comparativos muestran que hombres y mujeres responden al entrenamiento de fuerza con ganancias relativas similares de fuerza y masa muscular; las diferencias absolutas se explican principalmente por la masa muscular y los niveles hormonales de partida.")}
${calloutPr("Cuando algo proviene de investigación se marca con 🔬 y cuando es criterio profesional de campo se marca con 🛠️. Sé igual de honesto con tu clienta: diferencia siempre qué es ciencia y qué es experiencia.")}
<p><b>Cómo usar el manual:</b> léelo completo una vez y luego úsalo como referencia: el capítulo de Glúteos para corregir técnica, las rutinas como plantillas de partida (nunca recetas rígidas) y las fichas de registro junto con GymTracker Pro para el seguimiento diario.</p>
`},
{id:"principios", t:"Principios del entrenamiento", h:`
<h2>Capítulo 1 · Principios básicos del entrenamiento</h2>
<h3>1.1 Los tres objetivos madre</h3>
<p><b>Hipertrofia</b>: aumento del tamaño muscular; se consigue acumulando series efectivas (cercanas al fallo) con sobrecarga progresiva. <b>Fuerza</b>: capacidad de producir tensión; mejora con cargas altas y práctica del gesto. <b>Pérdida de grasa</b>: depende del déficit calórico sostenido; el entrenamiento de fuerza durante el déficit protege el músculo (Capítulo 7). Casi toda clienta combina dos de estos objetivos.</p>
<h3>1.2 Volumen, intensidad y frecuencia</h3>
<p><b>Volumen</b> = series efectivas por grupo muscular por semana. <b>Intensidad</b> = qué tan pesada es la carga respecto al máximo, o qué tan cerca del fallo termina la serie. <b>Frecuencia</b> = cuántas veces por semana se entrena cada grupo.</p>
${calloutEv("La evidencia sugiere una relación dosis-respuesta entre volumen e hipertrofia hasta cierto punto: como referencia general, ~10–20 series semanales por grupo funcionan bien para la mayoría. La hipertrofia ocurre en un rango amplio de repeticiones (aprox. 5–30) siempre que las series terminen cerca del fallo. Frecuencias de 2 veces/semana por grupo facilitan acumular volumen con buena calidad.")}
${calloutPr("Principiantes: empieza por lo bajo del rango (8–12 series/grupo/semana) y sube solo cuando el progreso se frene. Más volumen no es mejor si la técnica y la recuperación no acompañan.")}
<h3>1.3 RIR y RPE: medir el esfuerzo</h3>
<p><b>RIR</b> (repeticiones en reserva) = cuántas repeticiones quedaron "en el tanque" al terminar la serie. <b>RPE</b> = escala de esfuerzo del 1 al 10 (RPE 8 ≈ RIR 2). Enséñale la escala a tu clienta desde la primera semana: es el idioma común del esfuerzo.</p>
${tablaM(["RIR","RPE","Sensación","Uso típico"],[
["4+","≤6","Cómodo, técnica perfecta","Calentamiento, aprendizaje técnico"],
["3","7","Esfuerzo moderado","Primeras semanas, compuestos pesados"],
["2","8","Duro pero controlado","Zona principal de hipertrofia"],
["1","9","Muy duro, la velocidad cae","Últimas series de accesorios"],
["0","10","Fallo muscular","Ocasional, en máquinas/aislados seguros"]])}
<h3>1.4 Series, repeticiones y descansos por objetivo</h3>
${tablaM(["Objetivo","Reps por serie","Series por ejercicio","Descanso","Esfuerzo"],[
["Fuerza","3–6","3–5","2–4 min","RIR 1–3"],
["Hipertrofia","6–15 (hasta 20–30 en aislados)","2–4","1–2.5 min","RIR 0–3"],
["Resistencia muscular","15–25+","2–3","30–60 seg","RIR 1–2"],
["Pérdida de grasa","Igual que hipertrofia","Mantener volumen","1–2 min","RIR 1–3"]])}
${calloutPr("En pérdida de grasa NO conviertas la sesión de pesas en circuito cardio: la sesión de fuerza mantiene su estructura; el déficit lo pone la dieta y, si hace falta, cardio aparte.")}
<h3>1.5 Sobrecarga progresiva</h3>
<p>El músculo se adapta a lo que ya puede hacer. Para seguir mejorando hay que aumentar con el tiempo alguna variable: carga, repeticiones, series, rango de recorrido o control técnico. El Capítulo 6 detalla el sistema.</p>
`},
{id:"anatomia", t:"Anatomía aplicada", h:`
<h2>Capítulo 2 · Anatomía aplicada al entrenamiento</h2>
<p>No necesitas ser anatomista: necesitas saber <b>qué hace cada músculo</b> para elegir el ejercicio correcto y detectar cuándo la clienta "saca" el trabajo del músculo objetivo.</p>
${figManual(svgGluteosAnatomia(),"Fig. 2.1 — Los tres glúteos. El mayor domina la extensión de cadera; medio y menor estabilizan y abducen.")}
${tablaM(["Músculo","Función principal","Ejercicios clave","Detalle práctico"],[
["Glúteo mayor","Extensión de cadera (llevar el muslo atrás) y rotación externa","Hip thrust, peso muerto rumano, sentadilla, zancadas","El motor del tren inferior; trabaja más al extender la cadera contra resistencia"],
["Glúteo medio","Abducción y estabilización lateral de la pelvis","Abducciones, pasos laterales con banda, unilaterales","Si la rodilla colapsa hacia dentro en sentadilla, suele estar débil"],
["Glúteo menor","Estabilización profunda de la cadera","Se activa junto al medio","No se entrena de forma aislada"],
["Cuádriceps","Extensión de rodilla","Sentadilla, prensa, extensión, zancadas","Domina cuando la rodilla viaja hacia delante"],
["Isquiotibiales","Flexión de rodilla y extensión de cadera","RDL, curl femoral, buenos días","Actúan como extensores de cadera con rodilla casi recta"],
["Aductores","Cierran el muslo a la línea media","Sentadilla sumo, máquina de aducción","Muy implicados en posturas anchas"],
["Abductores","Abren el muslo (medio/menor + tensor)","Abducción en máquina y banda","Complemento, no base del glúteo"],
["Pantorrillas","Gastrocnemio (rodilla recta) y sóleo (flexionada)","Elevación de talones de pie y sentado","Rangos completos y pausa abajo"],
["Espalda","Dorsal, trapecio, erectores","Jalones, remos, peso muerto","Los erectores sostienen la columna neutra en bisagras"],
["Pecho","Aducción horizontal del brazo","Press banca/mancuernas, aperturas, flexiones","Se entrena igual en mujeres; no 'reduce' grasa localizada"],
["Hombros","Porción frontal, lateral y posterior","Press, elevación lateral, pájaros/face pull","La porción lateral da la 'anchura' visual"],
["Bíceps","Flexión de codo","Curls","Ya trabaja en jalones y remos"],
["Tríceps","Extensión de codo","Extensiones, press cerrado, fondos","Ya trabaja en los presses"]])}
${calloutPr("Regla de campo: si la clienta 'siente' el ejercicio de glúteo en el cuádriceps o la lumbar, revisa técnica (pies, rango, pelvis) antes de cambiar de ejercicio.")}
`},
{id:"gluteos", t:"★ Glúteos (capítulo principal)", h:`
<h2>Capítulo 3 · Glúteos: el capítulo principal</h2>
<p>El desarrollo de glúteo es el objetivo estético número uno en la mayoría de clientas. La receta tiene tres ingredientes: <b>extensión de cadera con carga progresiva</b> (hip thrust, bisagras, sentadillas profundas, unilaterales), <b>volumen suficiente repartido en la semana</b> y <b>técnica que haga trabajar al glúteo y no a la lumbar</b>.</p>
${calloutEv("Estudios de electromiografía (EMG) muestran alta activación del glúteo mayor en el hip thrust, especialmente cerca de la extensión completa. Pero EMG no equivale a crecimiento: los estudios que comparan hipertrofia glútea a largo plazo entre hip thrust y sentadilla muestran resultados mixtos, con ambos produciendo crecimiento significativo. Conclusión razonable: combina ambos patrones.")}
${calloutPr("Estructura semanal tipo para énfasis de glúteo: 2–3 sesiones de tren inferior, 12–20 series semanales directas de glúteo, combinando 1 empuje de cadera (hip thrust/puente), 1 bisagra (RDL), 1 rodilla-dominante profundo (sentadilla/prensa) y 1–2 unilaterales o abducciones.")}
${figManual(svgHipThrust(),"Fig. 3.1 — Hip thrust: la referencia del empuje de cadera.")}
${fichaEj({nombre:"Hip thrust con barra", series:"3–4 × 6–12", descanso:"1.5–2.5 min",
principal:"Glúteo mayor", secundarios:"Isquiotibiales, cuádriceps, core",
pasos:["Espalda apoyada en el banco justo bajo los omóplatos; barra acolchada sobre la cadera.","Pies al ancho de cadera, colocados de forma que al subir la tibia quede vertical.","Mentón ligeramente recogido, mirada al frente (no al techo).","Empuja con los talones y extiende la cadera hasta que el torso quede paralelo al suelo.","Aprieta el glúteo 1 segundo arriba sin hiperextender la lumbar y baja con control."],
errores:["Hiperextender la lumbar arriba en vez de terminar con el glúteo.","Pies demasiado lejos (se va a isquios) o demasiado cerca (cuádriceps).","Subir de golpe, rebotando y sin pausa arriba.","Mirar al techo, lo que arquea cuello y lumbar."],
seguridad:["Usa siempre protector para la barra.","Con molestia lumbar, reduce el rango final y revisa mentón/pelvis.","La carga sube solo cuando la pausa arriba se mantiene limpia."],
progresion:"Doble progresión: al completar el tope de repeticiones en todas las series con RIR 1–2, sube 2.5–5 kg y vuelve al rango bajo. Avances alternativos: pausas de 2–3 seg arriba o una serie extra semanal."})}
${fichaEj({nombre:"Puente de glúteo (en el suelo)", series:"3 × 10–20", descanso:"60–90 seg",
principal:"Glúteo mayor", secundarios:"Isquiotibiales, core",
pasos:["Boca arriba, rodillas flexionadas, pies cerca del glúteo.","Pelvis en ligera retroversión (aplanar la lumbar contra el suelo).","Empujar con talones y subir la cadera hasta alinear rodilla-cadera-hombro.","Apretar arriba 1–2 segundos y bajar sin apoyar del todo entre repeticiones."],
errores:["Empujar con la punta del pie.","Arquear la lumbar para 'subir más'.","Hacerlo tan rápido que se vuelve rebote."],
seguridad:["Puerta de entrada ideal antes del hip thrust con barra.","Apto para casi cualquier nivel; con molestia lumbar, revisar la retroversión pélvica."],
progresion:"Peso corporal → mancuerna/disco sobre la cadera → a una pierna → pasar al hip thrust con barra."})}
${figManual(svgSentadilla(),"Fig. 3.2 — Sentadilla: profundidad con columna neutra.")}
${fichaEj({nombre:"Sentadilla (libre o goblet)", series:"3–4 × 6–12", descanso:"2–3 min",
principal:"Cuádriceps y glúteo mayor", secundarios:"Aductores, erectores, core",
pasos:["Pies al ancho de hombros, puntas ligeramente hacia fuera.","Pecho arriba y core firme; iniciar bajando cadera y rodillas a la vez.","Bajar al menos a muslos paralelos si la movilidad lo permite, con las rodillas siguiendo la punta del pie.","Subir empujando el suelo con todo el pie, sin despegar talones."],
errores:["Rodillas colapsando hacia dentro (valgo).","Talones que se levantan por falta de movilidad de tobillo.","Inclinar tanto el torso que se convierte en 'buenos días'.","Cortar profundidad con una carga que no controla abajo."],
seguridad:["Enseña primero sentadilla al cajón y goblet antes de barra libre.","Con valgo marcado: banda sobre las rodillas, trabajo de glúteo medio y menos carga.","Dolor agudo en rodilla o ingle = parar y evaluar, no 'aguantar'."],
progresion:"Goblet → barra alta → carga con doble progresión. Para más glúteo: más profundidad controlada y postura algo más ancha."})}
${figManual(svgRDL(),"Fig. 3.3 — Peso muerto rumano: bisagra de cadera con espalda neutra.")}
${fichaEj({nombre:"Peso muerto rumano (RDL)", series:"3–4 × 8–12", descanso:"2–3 min",
principal:"Isquiotibiales y glúteo mayor", secundarios:"Erectores espinales, agarre",
pasos:["De pie, barra o mancuernas pegadas a los muslos, rodillas semiflexionadas.","Llevar la cadera hacia atrás manteniendo la espalda neutra y la barra rozando las piernas.","Bajar hasta sentir estiramiento de isquios (media espinilla aprox.) sin redondear la espalda.","Subir empujando la cadera hacia delante y apretando el glúteo al final."],
errores:["Convertirlo en sentadilla flexionando mucho las rodillas.","Redondear la lumbar buscando profundidad.","Alejar la barra del cuerpo (multiplica el estrés lumbar).","Hiperextensión exagerada arriba."],
seguridad:["El rango lo marca la flexibilidad de isquios con espalda neutra, no el suelo.","Enséñalo con palo o mancuernas ligeras primero.","Molestia lumbar persistente = revisar técnica y bajar carga antes que nada."],
progresion:"Carga con doble progresión solo si la espalda se mantiene neutra (obsérvala o grábala). Variante de avance: RDL a una pierna."})}
${fichaEj({nombre:"Zancadas (caminando o estáticas)", series:"3 × 8–12 por pierna", descanso:"90 seg–2 min",
principal:"Glúteo mayor y cuádriceps", secundarios:"Glúteo medio (estabilidad), aductores",
pasos:["Paso amplio al frente; torso ligeramente inclinado adelante para más glúteo.","Bajar vertical hasta que la rodilla trasera casi toque el suelo.","La rodilla delantera sigue la punta del pie.","Empujar con el talón delantero para volver o continuar el paso."],
errores:["Paso demasiado corto (todo va a cuádriceps y rodilla).","Empujar con la pierna trasera.","Tambaleo lateral por exceso de carga."],
seguridad:["Con dolor de rodilla prueba la zancada inversa: suele ser mucho más amable.","Domina el peso corporal antes de añadir mancuernas."],
progresion:"Peso corporal → mancuernas → más rango subiendo el pie delantero a un step bajo."})}
${figManual(svgBulgarian(),"Fig. 3.4 — Bulgarian split squat: la unilateral estrella para glúteo.")}
${fichaEj({nombre:"Bulgarian split squat", series:"3 × 8–12 por pierna", descanso:"90 seg–2 min",
principal:"Glúteo mayor y cuádriceps", secundarios:"Glúteo medio, aductores, core",
pasos:["Empeine trasero sobre el banco; pie delantero adelantado (la tibia queda vertical abajo).","Torso ligeramente inclinado al frente para acentuar el glúteo.","Bajar vertical con control hasta que la rodilla trasera quede cerca del suelo.","Subir empujando con el talón delantero."],
errores:["Pie delantero demasiado cerca del banco (la rodilla sufre).","Rebotar abajo.","Mirar al suelo y perder el equilibrio: mirada al frente."],
seguridad:["Exigente en equilibrio: introdúcelo tras dominar las zancadas.","Una mano en soporte las primeras sesiones si hace falta."],
progresion:"Peso corporal → mancuerna en la mano contraria → dos mancuernas. Aquí funciona muy bien subir repeticiones antes que carga."})}
${fichaEj({nombre:"Step-up al banco", series:"3 × 8–12 por pierna", descanso:"90 seg",
principal:"Glúteo mayor y cuádriceps", secundarios:"Glúteo medio",
pasos:["Banco a la altura de la rodilla (o menos para empezar).","Subir empujando SOLO con la pierna del banco, sin impulso de la de abajo.","Extender la cadera por completo arriba.","Bajar despacio controlando la fase excéntrica."],
errores:["Impulsarse con la pierna del suelo (el error nº1).","Banco demasiado alto para su control.","Dejarse caer en la bajada."],
seguridad:["Empieza con step bajo y sin peso: el control importa más que la altura."],
progresion:"Subir la altura del banco → añadir mancuernas → bajada de 3 segundos."})}
${fichaEj({nombre:"Patada de glúteo en polea", series:"3 × 10–15 por pierna", descanso:"60–90 seg",
principal:"Glúteo mayor", secundarios:"Isquiotibiales",
pasos:["Tobillera en la polea baja; torso inclinado, apoyado en la máquina.","Llevar la pierna atrás y arriba con la rodilla casi extendida.","Apretar el glúteo al final SIN arquear la lumbar.","Volver con control resistiendo el cable."],
errores:["Arquear la lumbar para ganar rango falso.","Patear con impulso.","Cargar tanto que el movimiento se acorta."],
seguridad:["Ejercicio de aislamiento: carga moderada y ejecución estricta."],
progresion:"Más repeticiones y pausas de 1 seg arriba antes que subir mucho el peso."})}
${fichaEj({nombre:"Abducción de cadera (máquina o banda)", series:"3 × 12–20", descanso:"45–90 seg",
principal:"Glúteo medio y menor", secundarios:"Fibras superiores del glúteo mayor, tensor de la fascia lata",
pasos:["En máquina: torso ligeramente inclinado al frente para orientar más glúteo.","Abrir contra la resistencia con control y pausa breve en la apertura máxima.","Volver despacio sin que las placas golpeen.","Con banda: pasos laterales con tensión constante y rodillas semiflexionadas."],
errores:["Impulso y rebote del peso.","Rango cortito por exceso de carga.","Tratarlo como ejercicio principal de glúteo: es complemento."],
seguridad:["Ideal como activación en el calentamiento (banda) o cierre de sesión (máquina)."],
progresion:"Sube repeticiones hasta 20 y luego la carga. Variar el ángulo del torso cambia el énfasis."})}
`},
{id:"evaluacion", t:"Evaluación inicial", h:`
<h2>Capítulo 4 · Evaluación inicial de la clienta</h2>
<p>La primera sesión no se entrena fuerte: <b>se evalúa</b>. Una buena evaluación te da el punto de partida, detecta banderas rojas y construye confianza profesional.</p>
<h3>4.1 Entrevista inicial (10–15 min)</h3>
${tablaM(["Área","Preguntas clave"],[
["Objetivo","¿Qué quieres lograr y para cuándo? Convierte lo vago en medible (usa la pestaña Objetivos 🎯)"],
["Historial","¿Has entrenado antes? ¿Qué te funcionó y qué odiaste?"],
["Salud","Lesiones, cirugías, dolores actuales, enfermedades, medicación, embarazo actual o reciente"],
["Estilo de vida","Sueño, trabajo (sentada/de pie), estrés, días reales disponibles"],
["Preferencias","Ejercicios que le gustan o le dan miedo: ahí se gana adherencia"]])}
${calloutSg("Si reporta dolor de pecho al esforzarse, mareos, hipertensión no controlada, embarazo, cirugía reciente o cualquier condición médica activa: solicita aval médico antes de cargarla. Registra las condiciones en su perfil (campo Discapacidad/enfermedad) y trabaja siempre dentro de lo autorizado.")}
<h3>4.2 Medidas y registro base</h3>
<p>Primera sesión: peso, las 9 circunferencias (pestaña Medidas), fotos opcionales (frente/lado/espalda, misma ropa y luz — siempre con consentimiento explícito) y su indicador de composición corporal.</p>
<h3>4.3 Pruebas de movimiento (15 min)</h3>
${tablaM(["Prueba","Qué observas","Qué te dice"],[
["Sentadilla al cajón (peso corporal)","Profundidad, valgo, talones","Punto de partida del patrón sentadilla"],
["Bisagra con palo en la espalda","Si mantiene 3 contactos (cabeza-dorsal-sacro)","Si puede aprender RDL con seguridad"],
["Zancada estática asistida","Equilibrio y control","Si el unilateral entra ya o después"],
["Plancha 20–30 seg","Control de pelvis y respiración","Base de core para compuestos"],
["Movilidad de tobillo (rodilla a la pared)","Distancia punta-pared","Explica sentadillas cortas o talones que se levantan"]])}
${calloutPr("No conviertas la evaluación en un examen intimidante: preséntala como 'vamos a ver cómo se mueve tu cuerpo para armarte el plan perfecto'. Todo se anota en la Bitácora.")}
`},
{id:"diseno", t:"Diseño de rutinas 3/4/5 días", h:`
<h2>Capítulo 5 · Diseño de rutinas: 3, 4 y 5 días</h2>
<h3>5.1 Selección de ejercicios por patrones</h3>
<p>Arma cada semana cubriendo los patrones básicos: <b>rodilla-dominante</b> (sentadilla, prensa, zancada), <b>bisagra de cadera</b> (RDL, buenos días), <b>empuje de cadera</b> (hip thrust, puente), <b>empuje</b> (press banca/hombro), <b>tracción</b> (remo, jalón), <b>unilateral</b> y <b>abducción/core</b>.</p>
${figManual(svgOrdenSesion(),"Fig. 5.1 — Orden de los ejercicios dentro de la sesión.")}
<h3>5.2 Orden dentro de la sesión</h3>
<p>1º el compuesto más pesado y técnico (cuando está fresca) · 2º compuestos secundarios · 3º unilaterales y accesorios · 4º aislamientos y bombeo. Antes del primer ejercicio: 2–3 series de aproximación.</p>
<h3>5.3 Rutina de 3 días — Principiante (cuerpo completo, énfasis inferior)</h3>
${tablaM(["Día A","Series × Reps"],[["Sentadilla goblet","3 × 8–10"],["Puente de glúteo","3 × 12–15"],["Remo en máquina","3 × 10–12"],["Press de pecho en máquina","3 × 10–12"],["Abducción en máquina","2 × 15"],["Plancha","3 × 20–30 seg"]])}
${tablaM(["Día B","Series × Reps"],[["Peso muerto rumano con mancuernas","3 × 8–10"],["Prensa 45°","3 × 10–12"],["Jalón al pecho","3 × 10–12"],["Press militar con mancuernas","3 × 10–12"],["Patada de glúteo en polea","2 × 12–15"],["Elevación de talones","3 × 12–15"]])}
${tablaM(["Día C","Series × Reps"],[["Hip thrust (barra ligera, aprendizaje)","3 × 10–12"],["Zancada estática","3 × 8–10 /pierna"],["Remo en polea baja","3 × 10–12"],["Aperturas o contractora","2 × 12–15"],["Elevación lateral","2 × 12–15"],["Crunch en polea","3 × 12–15"]])}
<h3>5.4 Rutina de 4 días — Intermedia (torso/pierna, énfasis glúteo)</h3>
${tablaM(["Día","Contenido"],[
["1 · Pierna (fuerza)","Sentadilla 4×6–8 · RDL 3×8–10 · Prensa 3×10 · Abducción 3×15"],
["2 · Torso","Press banca 3×8–10 · Remo con barra 3×8–10 · Press militar 3×10 · Jalón 3×10–12 · Curl + Tríceps 2×12 c/u"],
["3 · Glúteo (hipertrofia)","Hip thrust 4×8–12 · Bulgarian 3×10 /p · Patada en polea 3×12–15 · Puente a 1 pierna 2×15 · Pantorrilla 3×12"],
["4 · Torso + core","Press inclinado 3×10 · Remo con mancuerna 3×10–12 /b · Face pull 3×15 · Elevación lateral 3×12–15 · Plancha + elevación de piernas 3 rondas"]])}
<h3>5.5 Rutina de 5 días — Avanzada (énfasis glúteo)</h3>
${tablaM(["Día","Contenido"],[
["1 · Inferior pesado","Sentadilla 4×5–8 · Hip thrust 4×6–10 · RDL 3×8 · Pantorrilla 4×10"],
["2 · Torso empuje","Press banca 4×6–10 · Press militar 3×8–10 · Inclinado con mancuernas 3×10 · Lateral 4×12–15 · Tríceps 3×12"],
["3 · Glúteo + isquio","Hip thrust con pausa 4×8–12 · Bulgarian 3×8–10 /p · Curl femoral 3×10–12 · Step-up 3×10 /p · Abducción 3×20"],
["4 · Torso tracción","Dominadas o jalón 4×6–10 · Remo con barra 4×8–10 · Remo en polea 3×10–12 · Face pull 3×15 · Bíceps 3×10–12"],
["5 · Inferior bombeo","Prensa 4×12–15 · Zancadas caminando 3×12 /p · Patada en polea 3×15 · Extensión de cuádriceps 3×12–15 · Puente con banda 2×25"]])}
<h3>5.6 Adaptar la plantilla al objetivo</h3>
${tablaM(["Objetivo","Ajustes sobre la plantilla"],[
["Hipertrofia general","Volumen parejo entre grupos; 10–20 series/grupo/semana"],
["Énfasis glúteo","2–3 estímulos semanales de glúteo; recorta accesorios de empuje si falta tiempo"],
["Pérdida de grasa","Misma rutina de fuerza; añade 2–3 cardios de 20–40 min aparte y ajusta la dieta (Cap. 7)"],
["Recomposición","Rutina de hipertrofia + calorías de mantenimiento + proteína alta; progreso por medidas"],
["Desarrollo general / salud","3 días full body todo el año; técnica y constancia por delante"]])}
${calloutPr("Estas rutinas son plantillas de partida: la rutina 'perfecta' es la que la clienta puede cumplir 4 semanas seguidas. Usa el botón 📤 Compartir rutina para clonar plantillas entre clientas del mismo nivel y personalizarlas después.")}
`},
{id:"progresion", t:"Progresión de cargas", h:`
<h2>Capítulo 6 · Cómo progresar cargas, repeticiones y volumen</h2>
<h3>6.1 Doble progresión (el sistema por defecto)</h3>
<p>Asigna un rango de repeticiones (ej. 8–12). La clienta trabaja con una carga hasta completar el tope del rango en TODAS las series con RIR 1–2; entonces sube la carga (2.5–5 kg en inferior, 1–2.5 kg en superior) y vuelve al fondo del rango. Simple, seguro y medible.</p>
${tablaM(["Semana","Hip thrust (ejemplo)","Acción"],[
["1","60 kg → 10, 9, 8","Mantener carga"],
["2","60 kg → 11, 10, 9","Mantener carga"],
["3","60 kg → 12, 12, 12 (RIR 2)","¡Tope logrado! Subir"],
["4","65 kg → 9, 8, 8","Nuevo ciclo"]])}
${calloutPr("Registra cada peso en GymTracker (campo de peso del ejercicio): el historial de carga 📈 dibuja la curva y motiva muchísimo cuando la clienta ve sus ▲.")}
<h3>6.2 Otras palancas de progresión</h3>
${tablaM(["Palanca","Cuándo usarla"],[
["Añadir repeticiones","Siempre primero: es la progresión más fina"],
["Añadir carga","Al topar el rango de repeticiones"],
["Añadir series","Tras 4–6 semanas estancada con buena recuperación"],
["Mejorar rango/tempo","Pausas y bajadas de 3 seg: progresión sin tocar el peso"],
["Reducir descanso","Solo en accesorios; no sacrifiques carga en los básicos"],
["Ejercicio más difícil","Puente→hip thrust; zancada→bulgarian; máquina→libre"]])}
<h3>6.3 Descargas y estancamiento</h3>
<p>Cada 4–8 semanas, o cuando el rendimiento caiga con fatiga acumulada, programa una descarga: misma rutina con ~60–70% de las cargas o la mitad de las series. Si un ejercicio lleva 4+ semanas sin progresar con buena técnica y sueño razonable: revisa el volumen total, cambia la variante o revisa la comida.</p>
`},
{id:"grasa", t:"Perder grasa sin perder músculo", h:`
<h2>Capítulo 7 · Entrenar para perder grasa manteniendo masa muscular</h2>
${calloutEv("La pérdida de grasa requiere déficit calórico sostenido. Durante el déficit, el entrenamiento de fuerza y una ingesta proteica suficiente (referencia habitual: ~1.6–2.2 g/kg/día) son los dos factores mejor respaldados para conservar masa muscular.")}
<h3>7.1 Los 5 principios del déficit bien hecho</h3>
<p><b>1)</b> La sesión de pesas no cambia su esencia: mismas cargas o lo más cercano posible; en déficit el entrenamiento <i>defiende</i> el músculo. <b>2)</b> Déficit moderado (≈ −20% del gasto; la pestaña Nutrición da una referencia orientativa). <b>3)</b> Proteína alta y repartida. <b>4)</b> Cardio complementario: 2–4 sesiones de 20–40 min (caminata rápida, elíptica, bici), separadas de las pesas o después de ellas. <b>5)</b> Medir tendencia semanal de peso + cintas, no el día a día.</p>
<h3>7.2 Señales de un déficit mal llevado</h3>
${tablaM(["Señal","Ajuste"],[
["Cargas cayendo en picada semana a semana","Déficit demasiado agresivo o proteína baja"],
["Hambre extrema, obsesión con la comida","Suavizar el déficit; pausas de dieta"],
["Peso estancado 3+ semanas con adherencia real","Revisar porciones y pasos diarios antes de recortar más"],
["Sueño roto e irritabilidad alta","Reducir cardio y volumen; priorizar recuperación"]])}
${calloutSg("El entrenador no prescribe dietas clínicas: da pautas generales de alimentación saludable y deriva a nutricionista titulado para planes detallados, y siempre que existan condiciones médicas (diabetes, TCA previos, embarazo, etc.).")}
`},
{id:"adaptaciones", t:"Adaptaciones especiales", h:`
<h2>Capítulo 8 · Adaptaciones para casos frecuentes</h2>
<h3>8.1 Principiante absoluta</h3>
<p>Primeras 4–6 semanas: máquinas y peso corporal, 10–15 reps con RIR 3–4, full body 2–3 días. El objetivo real es <b>aprender los patrones y crear el hábito</b>. Celebra la asistencia (calendario 📅) más que la carga.</p>
<h3>8.2 Mujer mayor (50+)</h3>
${calloutEv("El entrenamiento de fuerza en mujeres mayores y postmenopáusicas se asocia a mejoras de fuerza, funcionalidad y densidad mineral ósea; es una de las intervenciones mejor respaldadas para esa etapa.")}
<p>En la práctica: más calentamiento, progresiones más graduales, prioridad a gestos funcionales (levantarse de la silla → sentadilla al cajón, prensa), equilibrio y agarre. Evita el "con cuidado, no cargues": cargar con técnica ES el beneficio. Aval médico si hay osteoporosis diagnosticada u otras condiciones.</p>
<h3>8.3 Clienta con sobrepeso importante</h3>
<p>Ejercicios cómodos para su cuerpo hoy: prensa antes que zancadas, remos en máquina, empujes sentada, caminata como cardio. Cuida la logística (bancos, agarres, rangos) para que nada la haga sentirse expuesta. La báscula bajará más lento que las cintas: mide el abdomen y celebra esos avances.</p>
<h3>8.4 Poca movilidad</h3>
<p>Entrena el patrón en el rango que SÍ controla (sentadilla a cajón alto, RDL a bloques) y dedica 5 min por sesión a movilidad específica de tobillo y cadera. El rango se gana entrenando el rango, no forzándolo con carga.</p>
<h3>8.5 Embarazo y postparto</h3>
${calloutSg("Con una clienta embarazada o en postparto reciente, trabaja únicamente con autorización de su médico y, de forma ideal, con formación específica o en equipo con fisioterapia de suelo pélvico. Este manual no cubre la programación de esa etapa: derivar es lo profesional.")}
<h3>8.6 Ciclo menstrual</h3>
${calloutEv("La evidencia sobre programar el entrenamiento por fases del ciclo es limitada e inconsistente; no hay base sólida para protocolos rígidos por fase.")}
${calloutPr("Regla simple: escucha a la clienta. Si hay días de fatiga o molestias fuertes, baja la intensidad o cambia la sesión sin drama, y compensa cuando se sienta bien. El registro en la Bitácora ayuda a detectar sus patrones.")}
`},
{id:"seguridad", t:"Seguridad y derivación", h:`
<h2>Capítulo 9 · Seguridad: calentamiento, molestias y derivación</h2>
<h3>9.1 Estructura del calentamiento (8–12 min)</h3>
${tablaM(["Bloque","Contenido","Tiempo"],[
["General","Cardio suave (bici, caminata rápida)","3–5 min"],
["Movilidad","2–3 movimientos de las articulaciones del día (cadera, tobillo, hombro)","2–3 min"],
["Activación","Banda: puentes, pasos laterales, abducciones (inferior); retracciones y rotadores (superior)","2–3 min"],
["Aproximación","2–3 series ligeras del primer ejercicio subiendo hasta la carga de trabajo","3–4 min"]])}
<h3>9.2 Dolor vs molestia</h3>
<p><b>Molestia muscular</b> (ardor difuso en el músculo trabajado, agujetas) es parte normal. <b>Dolor articular</b> (puntual, agudo, punzante, en articulación o hueso, o que empeora con las series) NO se entrena "a través": modifica el ejercicio, reduce el rango o cámbialo ese día, y anótalo en la Bitácora.</p>
<h3>9.3 Cuándo derivar a un profesional sanitario</h3>
${tablaM(["Señal","Acción"],[
["Dolor agudo con chasquido, hinchazón o pérdida de fuerza","Detener y derivar a médico/fisioterapia"],
["Dolor que persiste 1–2+ semanas pese a modificar el entrenamiento","Derivar a fisioterapia"],
["Mareo, dolor en el pecho, palpitaciones o falta de aire anormal durante el esfuerzo","Detener la sesión y derivar a médico de inmediato"],
["Adormecimientos u hormigueos irradiados","Derivar a médico/fisioterapia"],
["Sospecha de relación problemática con la comida o el ejercicio","Conversación cuidadosa y derivación a profesional de salud"]])}
${calloutSg("Derivar no es perder una clienta: es la conducta que te define como profesional serio y casi siempre te la devuelve con más confianza. Documenta en la Bitácora qué observaste y qué recomendaste.")}
`},
{id:"gestion", t:"Gestión de varias clientas", h:`
<h2>Capítulo 10 · Atender varias clientas y mantener seguimiento profesional</h2>
<h3>10.1 Organización del piso</h3>
<p>Con 2–4 clientas simultáneas: agrupa por nivel y usa estaciones cercanas; asigna a cada una un ejercicio que domine mientras corriges a la que aprende uno nuevo; rota tu atención en los momentos de riesgo técnico (series pesadas de compuestos), no en los descansos.</p>
${tablaM(["Hábito profesional","Cómo se ve en la práctica"],[
["Plan preparado ANTES de la sesión","La rutina del día ya está cargada en GymTracker; nada de improvisar"],
["Registro en el momento","Pesos y repeticiones se anotan al terminar cada ejercicio, no 'luego'"],
["Revisión semanal (15 min por clienta)","Historial de cargas 📈, asistencia 📅 y objetivos 🎯: ¿progresa, se estanca, falta?"],
["Medición periódica","El recordatorio 📏 te avisa; no dependas de la memoria"],
["Comunicación","Un mensaje corto tras una falta ('te esperamos el jueves') rescata más clientas que cualquier descuento"]])}
<h3>10.2 Retención</h3>
<p>Las clientas se quedan cuando <b>ven su progreso</b>. Enséñales su curva de cargas, sus medidas, su % de asistencia y su avatar cambiando: los datos que ya registras son tu mejor herramienta de retención.</p>
`},
{id:"fichas", t:"Fichas de registro", h:`
<h2>Capítulo 11 · Fichas de registro (plantillas)</h2>
<p>Estas tres fichas cubren todo el seguimiento. En GymTracker Pro ya existen digitalmente (Medidas, Rutinas con historial de carga, Objetivos y Bitácora); las plantillas sirven si algún día necesitas papel.</p>
<h3>Ficha 1 · Evaluación inicial</h3>
${tablaM(["Campo","Registro"],[
["Nombre / Edad / Contacto","________________"],
["Objetivo principal (medible)","________________"],
["Salud: lesiones, condiciones, medicación","________________"],
["Días reales disponibles / horario","________________"],
["Peso (lb) y 9 circunferencias (in)","________________"],
["Resultados de las 5 pruebas de movimiento","________________"],
["Observaciones y plan de arranque","________________"]])}
<h3>Ficha 2 · Registro de sesión</h3>
${tablaM(["Ejercicio","Serie","Carga","Reps","RIR","Nota"],[
["Hip thrust","1","____","____","____",""],
["","2","____","____","____",""],
["","3","____","____","____",""],
["(siguiente ejercicio)","…","____","____","____",""]])}
<h3>Ficha 3 · Evaluación mensual</h3>
${tablaM(["Indicador","Mes pasado","Hoy","Cambio"],[
["Peso (lb)","____","____","____"],
["Abdomen ombligo (in)","____","____","____"],
["Cadera (in)","____","____","____"],
["Carga en hip thrust (al tope de reps)","____","____","____"],
["Carga en sentadilla","____","____","____"],
["% de asistencia del mes","____","____","____"],
["Avance de objetivos 🎯","____","____","____"],
["Ajustes para el próximo mes","","",""]])}
`},
{id:"errores", t:"Errores del entrenador", h:`
<h2>Capítulo 12 · Errores frecuentes del entrenador (y cómo evitarlos)</h2>
${tablaM(["Error","Por qué daña","Antídoto"],[
["Entrenarla como te entrenas tú","Su cuerpo, historia y objetivo no son los tuyos","Programa desde SU evaluación"],
["Sesiones-castigo para 'que sude'","Fatiga sin dirección, lesiones, abandono","Cada ejercicio tiene un porqué en el plan"],
["No registrar nada","Sin datos no hay progresión ni argumentos","Registro en el momento, siempre"],
["Cambiar la rutina cada semana","El progreso necesita repetir para comparar","Bloques de 4–8 semanas con progresión"],
["Ignorar la técnica por subir peso","Una lesión borra meses de avance","La carga sube cuando la técnica lo permite"],
["Prometer resultados con fecha exacta","Genera desconfianza al incumplirse","Promete proceso y muestra datos"],
["Opinar de temas médicos o dietas clínicas","Riesgo real para la clienta y legal para ti","Conoce tu límite profesional y deriva"],
["Hablar del cuerpo de la clienta sin tacto","Daña la relación y la adherencia","Lenguaje de rendimiento y salud, no de defectos"],
["Volumen infinito de bandas y abducciones","Estímulo insuficiente para crecer","La base son los compuestos con carga progresiva"],
["Descuidar a la clienta 'callada'","Es la que se va sin avisar","Revisión semanal de TODAS, no solo de las que preguntan"]])}
`},
{id:"mensual", t:"Evaluación mensual", h:`
<h2>Capítulo 13 · La evaluación mensual del progreso</h2>
<h3>13.1 Qué medir cada mes</h3>
<p>Cada ~30 días (deja que el recordatorio 📏 te avise): peso y las 9 circunferencias, fotos si las usa, revisión del historial de cargas de los 3–5 ejercicios índice (hip thrust, sentadilla, RDL, un empuje y un jalón), % de asistencia del mes y avance de cada objetivo 🎯.</p>
<h3>13.2 Cómo interpretar</h3>
${tablaM(["Escenario","Lectura","Acción"],[
["Cargas ↑ y medidas objetivo mejoran","El plan funciona","No toques casi nada; sigue progresando"],
["Cargas ↑ pero medidas planas (objetivo grasa)","Entrena bien, come de más","Revisar adherencia nutricional"],
["Cargas planas y asistencia < 75%","El problema es la constancia","Resolver agenda y hábito antes que el plan"],
["Todo plano con asistencia buena","Estímulo o recuperación insuficiente","Subir volumen o revisar sueño/estrés; valorar descarga previa"],
["Cargas ↓ varias semanas","Fatiga, déficit agresivo o vida complicada","Descarga + suavizar déficit + conversación honesta"]])}
<h3>13.3 La reunión de resultados (10 minutos que retienen clientas)</h3>
<p>Siéntate con ella y muéstrale: su avatar y los deltas de medidas, su curva de cargas 📈, su % de asistencia 📅 y sus objetivos 🎯 con la barra de avance. Cierra siempre con el plan del mes siguiente en una frase: "este mes vamos a por X". Progreso visible + siguiente paso claro = clienta que se queda.</p>
<p style="margin-top:22px;color:var(--tenue);font-size:12.5px;">— Fin del manual. Material formativo de carácter general: no sustituye la formación certificada del entrenador ni la valoración de profesionales sanitarios en los casos que la requieren. —</p>
`}
];
}
