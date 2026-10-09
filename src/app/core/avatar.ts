// @ts-nocheck
/* ------------------------------------------------------------
   AVATAR ANATÓMICO SVG y GRÁFICA DE LÍNEA — portados tal cual de la plantilla.
   Generan cadenas SVG que se insertan con [innerHTML] (ver SvgSeguroPipe).
   Recibe un objeto con genero, composicion y medidas (ascendentes por fecha).
   ------------------------------------------------------------ */
import { fmtFecha } from './util';

export type VistaAvatar = 'frente' | 'lado' | 'espalda';

export function dibujarAvatar(c, vistaForzada: VistaAvatar, ancho?: number): string {
  const V = vistaForzada;
  const ANCHO = ancho || 320;
  const esMujer = c.genero==="mujer";
  const ult = c.medidas.length ? c.medidas[c.medidas.length-1] : null;
  const prim = c.medidas.length ? c.medidas[0] : null;

  const base = esMujer
    ? {pecho:34, brazoRelajado:11, brazoContraido:11.7, antebrazo:9.3, abdomenAlto:27, abdomenOmbligo:28, cadera:38, pierna:21, pantorrilla:13.5}
    : {pecho:38, brazoRelajado:13, brazoContraido:14, antebrazo:11, abdomenAlto:32, abdomenOmbligo:33, cadera:38, pierna:22, pantorrilla:14.5};

  const med = z => ult ? ult[z] : null;
  function escala(zona){
    if(med(zona)==null) return 1;
    return Math.max(.72, Math.min(1.5, med(zona)/base[zona]));
  }
  const eBrazo = med("brazoRelajado")!=null ? escala("brazoRelajado")
               : med("brazoContraido")!=null ? Math.max(.72,Math.min(1.5, med("brazoContraido")/base.brazoContraido))
               : 1;
  const eAnte = med("antebrazo")!=null ? escala("antebrazo") : eBrazo;

  let compHombros=1, compCintura=1, compGlobal=1, grasa=false;
  if(c.composicion==="delgado"){ compGlobal=.9; compCintura=.93; }
  if(c.composicion==="grasa"){ compCintura=1.2; compHombros=1.02; grasa=true; }
  if(c.composicion==="musculo"){ compHombros=1.08; compCintura=.93; }

  const CX=160;
  const wH   = (esMujer?45:58) * escala("pecho") * compHombros * compGlobal;
  const wPec = (esMujer?44:50) * escala("pecho") * compGlobal;
  const wAbdA= (esMujer?26:33) * escala("abdomenAlto") * compCintura * compGlobal;
  const wAbdO= (esMujer?27:34) * escala("abdomenOmbligo") * compCintura * compGlobal;
  const wCad = (esMujer?48:40) * escala("cadera") * compGlobal;
  const wB   = (esMujer?10.5:14) * eBrazo * compGlobal;
  const wA   = (esMujer?8.2:10.8) * eAnte * compGlobal;
  const wM   = 23 * escala("pierna") * compGlobal;
  const wP   = (esMujer?11.5:13) * escala("pantorrilla") * compGlobal;
  const panza = grasa ? Math.max(6, wAbdO*.2) : 0;

  const Y = {cuello:124, hombro:150, axila:188, pecho:200, bajoPecho:212,
             abdAlto:246, ombligo:276, cadera:322, entre:356, muslo:392,
             rodilla:458, pant:500, tobillo:566, pie:592};
  const r2 = n => Math.round(n*10)/10;

  // Estilo lámina anatómica
  const FONDO="url(#avFondo)", CUERPO="url(#avCuerpo)", L="#2e3558";
  const TRAZO=`fill="${CUERPO}" stroke="${L}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"`;
  const PELO=`fill="#9aa2b8" stroke="${L}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"`;
  const MUSC=`fill="none" stroke="${L}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity=".55"`;

  // ---- Mapa de calor ----
  function crecimiento(zona){
    if(!prim || !ult || prim[zona]==null || ult[zona]==null || prim[zona]===0) return 0;
    return (ult[zona]-prim[zona]) / prim[zona];
  }
  const glow = z => { const g=crecimiento(z); return g>0.004 ? Math.min(.5, g*6) : 0; };
  const reduc = z => { const g=crecimiento(z); return g<-0.004 ? Math.min(.45, Math.abs(g)*6) : 0; };
  const OP = {
    pecho: glow("pecho"),
    brazo: Math.max(glow("brazoRelajado"), glow("brazoContraido")),
    ante: glow("antebrazo"),
    cadera: glow("cadera"),
    muslo: glow("pierna"),
    pant: glow("pantorrilla"),
    abd: Math.max(reduc("abdomenAlto"), reduc("abdomenOmbligo"))
  };
  // Volumen: cada pieza (torso, brazo, pierna) se sombrea hacia sus bordes como un cilindro.
  const DEFS = `<defs>
    <filter id="difum" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="10"/></filter>
    <filter id="avSuave" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="4"/></filter>
    <linearGradient id="avCuerpo" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#d9deea"/><stop offset=".32" stop-color="#fbfcfe"/>
      <stop offset=".62" stop-color="#f4f6fa"/><stop offset="1" stop-color="#cfd5e3"/>
    </linearGradient>
    <radialGradient id="avFondo" cx=".5" cy=".42" r=".75">
      <stop offset="0" stop-color="#f3f5fa"/><stop offset="1" stop-color="#dce1ec"/>
    </radialGradient>
  </defs>`;

  // Contorno simétrico: recibe inicio [x,y] y tramos [c1x,c1y,c2x,c2y,px,py]
  // con x como desplazamiento desde CX; genera lado derecho + izquierdo espejado.
  function simetrico(inicio, segs){
    let d = `M ${r2(CX+inicio[0])} ${inicio[1]} `;
    segs.forEach(s=>{ d += `C ${r2(CX+s[0])} ${s[1]}, ${r2(CX+s[2])} ${s[3]}, ${r2(CX+s[4])} ${s[5]} `; });
    for(let i=segs.length-1;i>=0;i--){
      const s=segs[i];
      const prev = i>0 ? [segs[i-1][4],segs[i-1][5]] : inicio;
      d += `C ${r2(CX-s[2])} ${s[3]}, ${r2(CX-s[0])} ${s[1]}, ${r2(CX-prev[0])} ${prev[1]} `;
    }
    return d + "Z";
  }

  function svgEnvoltura(contenido, etiqueta){
    return `<svg viewBox="0 0 320 640" width="${ANCHO}" xmlns="http://www.w3.org/2000/svg" aria-label="${etiqueta}">
      ${DEFS}
      <rect x="3" y="3" width="314" height="634" rx="18" fill="${FONDO}"/>
      <ellipse cx="160" cy="600" rx="74" ry="9" fill="#2e3558" opacity=".18" filter="url(#avSuave)"/>
      ${contenido}
    </svg>`;
  }

  if(V==="lado") return vistaLado();
  return vistaFrontalOEspalda(V==="espalda");

  /* ================= FRENTE / ESPALDA ================= */
  function vistaFrontalOEspalda(esEspalda){
    // --- Torso (contorno simétrico) ---
    const segsTorso = [];
    segsTorso.push([32,128, wH-12,134, wH,Y.hombro]);
    segsTorso.push([wH+1,166, wPec+4,176, wPec,Y.axila]);
    if(esMujer && !esEspalda){
      segsTorso.push([wPec+6,206, wPec+2,216, wAbdA+9,224]);
      segsTorso.push([wAbdA+3,232, wAbdA+1,240, wAbdA,Y.abdAlto]);
    }else{
      segsTorso.push([wPec-1,222, wAbdA+panza*.5+4,230, wAbdA+panza*.5,Y.abdAlto]);
    }
    segsTorso.push([wAbdA-1,256, wAbdO+panza+2,264, wAbdO+panza,Y.ombligo]);
    segsTorso.push([wAbdO+panza-1,294, wCad+1,304, wCad,Y.cadera]);
    segsTorso.push([wCad-2,344, 26,352, 9,Y.entre]);
    segsTorso.push([4,Y.entre+3, 1,Y.entre+4, 0,Y.entre+5]);
    const torso = simetrico([15,Y.cuello], segsTorso);

    // --- Brazo (contorno con mano) ---
    function brazo(s){
      const xTop = CX + s*(wH-11), xBic = CX + s*(wH+3), xMun = CX + s*(wH+11), xCodo=(xBic+xMun)/2;
      const yBic=216, yCodo=252, yAnte=286, yMun=336, yMano=372;
      return `M ${r2(xTop)} ${Y.hombro-4}
        C ${r2(xBic+s*(wB+4))} ${Y.hombro+6}, ${r2(xBic+s*(wB+3))} 172, ${r2(xBic+s*wB)} ${yBic}
        C ${r2(xBic+s*(wB-1))} ${yBic+18}, ${r2(xCodo+s*(wA+1))} ${yCodo-8}, ${r2(xCodo+s*wA*.95)} ${yCodo}
        C ${r2(xCodo+s*(wA+2))} ${yCodo+14}, ${r2(xMun+s*(wA+1))} ${yAnte-4}, ${r2(xMun+s*wA)} ${yAnte}
        C ${r2(xMun+s*(wA-2))} ${yAnte+20}, ${r2(xMun+s*8)} ${yMun-10}, ${r2(xMun+s*7)} ${yMun}
        C ${r2(xMun+s*10)} ${yMun+14}, ${r2(xMun+s*8)} ${yMano-8}, ${r2(xMun+s*2)} ${yMano}
        C ${r2(xMun-s*4)} ${yMano+4}, ${r2(xMun-s*8)} ${yMano-10}, ${r2(xMun-s*7)} ${yMun}
        C ${r2(xMun-s*7)} ${yMun-8}, ${r2(xMun-s*wA*.82)} ${yAnte+16}, ${r2(xMun-s*wA*.85)} ${yAnte}
        C ${r2(xMun-s*wA*.9)} ${yAnte-6}, ${r2(xCodo-s*wA*.68)} ${yCodo+10}, ${r2(xCodo-s*wA*.7)} ${yCodo}
        C ${r2(xCodo-s*wA*.72)} ${yCodo-10}, ${r2(xBic-s*wB*.78)} ${yBic+14}, ${r2(xBic-s*wB*.8)} ${yBic}
        C ${r2(xBic-s*wB*.85)} ${yBic-16}, ${r2(CX+s*(wPec-3))} ${Y.axila+6}, ${r2(CX+s*(wPec-4))} ${Y.axila-2}
        C ${r2(CX+s*(wPec+2))} ${Y.axila-16}, ${r2(xTop-s*2)} ${Y.hombro+6}, ${r2(xTop)} ${Y.hombro-4} Z`;
    }
    // --- Pierna (contorno con pie) ---
    function pierna(s){
      const xc = CX + s*wCad*.52, wRod = wP*.85, largoPie = esMujer ? 24 : 29;
      return `M ${r2(CX+s*wCad)} ${Y.cadera}
        C ${r2(xc+s*(wM+2))} ${Y.cadera+34}, ${r2(xc+s*(wM+1))} ${Y.muslo-14}, ${r2(xc+s*wM)} ${Y.muslo}
        C ${r2(xc+s*(wM-3))} ${Y.muslo+28}, ${r2(xc+s*(wRod+2))} ${Y.rodilla-22}, ${r2(xc+s*wRod)} ${Y.rodilla}
        C ${r2(xc+s*(wRod+3))} ${Y.rodilla+14}, ${r2(xc+s*(wP+2))} ${Y.pant-16}, ${r2(xc+s*wP)} ${Y.pant}
        C ${r2(xc+s*(wP-2))} ${Y.pant+24}, ${r2(xc+s*8.5)} ${Y.tobillo-18}, ${r2(xc+s*7.5)} ${Y.tobillo}
        C ${r2(xc+s*8)} ${Y.tobillo+10}, ${r2(xc+s*(largoPie-4))} ${Y.pie-10}, ${r2(xc+s*largoPie)} ${Y.pie-4}
        C ${r2(xc+s*(largoPie+2))} ${Y.pie}, ${r2(xc+s*largoPie)} ${Y.pie+3}, ${r2(xc+s*(largoPie-6))} ${Y.pie+3}
        L ${r2(xc-s*9)} ${Y.pie+3}
        C ${r2(xc-s*11)} ${Y.pie}, ${r2(xc-s*9)} ${Y.tobillo+8}, ${r2(xc-s*7.5)} ${Y.tobillo}
        C ${r2(xc-s*8)} ${Y.tobillo-18}, ${r2(xc-s*(wP*.92-2))} ${Y.pant+22}, ${r2(xc-s*wP*.92)} ${Y.pant+2}
        C ${r2(xc-s*(wP*.92+1))} ${Y.pant-14}, ${r2(xc-s*(wRod*.85+1))} ${Y.rodilla+12}, ${r2(xc-s*wRod*.85)} ${Y.rodilla}
        C ${r2(xc-s*(wRod*.85+2))} ${Y.rodilla-20}, ${r2(xc-s*(wM*.9+1))} ${Y.muslo+24}, ${r2(xc-s*wM*.9)} ${Y.muslo+4}
        C ${r2(xc-s*(wM*.9+2))} ${Y.muslo-16}, ${r2(CX+s*11)} ${Y.entre+16}, ${r2(CX+s*9)} ${Y.entre} Z`;
    }

    // --- Cabeza, cuello, cabello ---
    const cabeza = `M ${CX} 34 C ${CX+20} 34, ${CX+27} 50, ${CX+26} 66
      C ${CX+25} 82, ${CX+17} 94, ${CX+8} 99 C ${CX+4} 101, ${CX-4} 101, ${CX-8} 99
      C ${CX-17} 94, ${CX-25} 82, ${CX-26} 66 C ${CX-27} 50, ${CX-20} 34, ${CX} 34 Z`;
    const cuello = `M ${CX-13} 92 C ${CX-13} 104, ${CX-14} 114, ${CX-17} ${Y.cuello+4}
      L ${CX+17} ${Y.cuello+4} C ${CX+14} 114, ${CX+13} 104, ${CX+13} 92 Z`;
    const peloHombre = esEspalda
      ? `<path d="M ${CX-26} 64 C ${CX-27} 40, ${CX+27} 40, ${CX+26} 64 C ${CX+26} 80, ${CX+20} 92, ${CX+10} 97 C ${CX} 100, ${CX-10} 99, ${CX-10} 97 C ${CX-20} 92, ${CX-26} 80, ${CX-26} 64 Z" ${TRAZO}/>`
      : `<path d="M ${CX-26} 62 C ${CX-27} 38, ${CX+27} 38, ${CX+26} 62 C ${CX+20} 50, ${CX-20} 50, ${CX-26} 62 Z" ${TRAZO}/>`;
    const peloMujer = esEspalda
      ? `<path d="M ${CX-27} 60 C ${CX-30} 36, ${CX+30} 36, ${CX+27} 60
          C ${CX+33} 96, ${CX+31} 142, ${CX+23} 172 C ${CX+8} 182, ${CX-8} 182, ${CX-23} 172
          C ${CX-31} 142, ${CX-33} 96, ${CX-27} 60 Z" ${TRAZO}/>`
      : `<path d="M ${CX-27} 60 C ${CX-30} 34, ${CX+30} 34, ${CX+27} 60
          C ${CX+34} 88, ${CX+34} 122, ${CX+28} 150 C ${CX+24} 158, ${CX+16} 158, ${CX+14} 150
          C ${CX+22} 122, ${CX+22} 94, ${CX+15} 66
          C ${CX+2} 74, ${CX-8} 72, ${CX-15} 64
          C ${CX-22} 92, ${CX-22} 122, ${CX-14} 150
          C ${CX-16} 158, ${CX-24} 158, ${CX-28} 150 C ${CX-34} 122, ${CX-34} 88, ${CX-27} 60 Z" ${TRAZO}/>`;

    // --- Compartimientos musculares ---
    let m = "";
    if(!esEspalda){
      // cuello / esternocleidomastoideo
      [-1,1].forEach(s=>{ m += `<path d="M ${r2(CX+s*6)} 96 C ${r2(CX+s*9)} 106, ${r2(CX+s*13)} 114, ${r2(CX+s*16)} ${Y.cuello}" ${MUSC}/>`; });
      // trapecio superior
      [-1,1].forEach(s=>{ m += `<path d="M ${r2(CX+s*17)} ${Y.cuello-2} Q ${r2(CX+s*36)} ${Y.cuello+6} ${r2(CX+s*wH*.62)} ${Y.hombro-6}" ${MUSC}/>`; });
      // deltoides (cuña)
      [-1,1].forEach(s=>{ m += `<path d="M ${r2(CX+s*(wH-18))} 143 C ${r2(CX+s*(wH+4))} 148, ${r2(CX+s*(wH+5))} 168, ${r2(CX+s*(wPec+1))} 185 C ${r2(CX+s*(wPec-4))} 189, ${r2(CX+s*(wH-15))} 172, ${r2(CX+s*(wH-18))} 143 Z" ${MUSC}/>`; });
      // pectorales
      [-1,1].forEach(s=>{ m += `<path d="M ${r2(CX+s*4)} 148 C ${r2(CX+s*wPec*.55)} 140, ${r2(CX+s*(wPec-7))} 148, ${r2(CX+s*(wPec-4))} 165 C ${r2(CX+s*(wPec-4))} 182, ${r2(CX+s*wPec*.6)} ${esMujer?208:202}, ${r2(CX+s*11)} ${esMujer?212:207} C ${r2(CX+s*5)} ${esMujer?209:204}, ${r2(CX+s*4)} 156, ${r2(CX+s*4)} 148 Z" ${MUSC}/>`; });
      // abdominales (columna con V)
      const yAbsTop = esMujer ? 224 : 214;
      m += `<path d="${simetrico([20,yAbsTop],[
        [22,yAbsTop+22, 21,250, 19,264],
        [18,286, 16,306, 9,326],
        [6,334, 2,339, 0,341]
      ])}" ${MUSC}/>`;
      m += `<line x1="${CX}" y1="${yAbsTop+2}" x2="${CX}" y2="${335}" stroke="${L}" stroke-width="1.9" opacity=".85"/>`;
      [yAbsTop+20, yAbsTop+42, yAbsTop+64].forEach(y=>{
        [-1,1].forEach(s=>{ m += `<path d="M ${r2(CX+s*3)} ${y} Q ${r2(CX+s*10)} ${y+3} ${r2(CX+s*17)} ${y-1}" ${MUSC}/>`; });
      });
      // ombligo
      m += `<path d="M ${CX-3} ${Y.ombligo+14} q 3 3 6 0" ${MUSC}/>`;
      // oblicuos / serrato
      [-1,1].forEach(s=>{ m += `<path d="M ${r2(CX+s*(wPec-6))} 196 C ${r2(CX+s*(wAbdA+3))} 224, ${r2(CX+s*(wAbdO+panza+2))} 262, ${r2(CX+s*(wCad-8))} 300 C ${r2(CX+s*(wCad-18))} 308, ${r2(CX+s*26)} 294, ${r2(CX+s*24)} 262 C ${r2(CX+s*23)} 236, ${r2(CX+s*25)} 212, ${r2(CX+s*(wPec-13))} 195 Z" ${MUSC}/>`; });
      // línea inguinal
      [-1,1].forEach(s=>{ m += `<path d="M ${r2(CX+s*(wCad-6))} 312 C ${r2(CX+s*(wCad-14))} 330, ${r2(CX+s*20)} 344, ${r2(CX+s*10)} ${Y.entre-2}" ${MUSC}/>`; });
    }else{
      // ESPALDA: trapecio en rombo
      m += `<path d="${simetrico([0,116],[
        [16,124, 25,138, 20,160],
        [14,182, 8,196, 0,204]
      ])}" ${MUSC}/>`;
      // deltoides
      [-1,1].forEach(s=>{ m += `<path d="M ${r2(CX+s*(wH-18))} 143 C ${r2(CX+s*(wH+4))} 148, ${r2(CX+s*(wH+5))} 168, ${r2(CX+s*(wPec+1))} 185 C ${r2(CX+s*(wPec-4))} 189, ${r2(CX+s*(wH-15))} 172, ${r2(CX+s*(wH-18))} 143 Z" ${MUSC}/>`; });
      // escápulas (infraespinoso)
      [-1,1].forEach(s=>{ m += `<path d="M ${r2(CX+s*13)} 162 C ${r2(CX+s*(wPec-10))} 170, ${r2(CX+s*(wPec-6))} 188, ${r2(CX+s*wPec*.55)} 206 C ${r2(CX+s*22)} 210, ${r2(CX+s*14)} 194, ${r2(CX+s*13)} 162 Z" ${MUSC}/>`; });
      // dorsales
      [-1,1].forEach(s=>{ m += `<path d="M ${r2(CX+s*(wPec-3))} 196 C ${r2(CX+s*(wAbdA+2))} 230, ${r2(CX+s*wAbdO)} 262, ${r2(CX+s*15)} 294 C ${r2(CX+s*9)} 282, ${r2(CX+s*11)} 228, ${r2(CX+s*(wPec-14))} 196 Z" ${MUSC}/>`; });
      // columna
      m += `<line x1="${CX}" y1="206" x2="${CX}" y2="300" stroke="${L}" stroke-width="1.9" opacity=".85"/>`;
      // glúteos
      [-1,1].forEach(s=>{ m += `<path d="M ${r2(CX+s*3)} 306 C ${r2(CX+s*wCad*.85)} 298, ${r2(CX+s*wCad*.96)} 336, ${r2(CX+s*wCad*.6)} ${Y.entre+2} C ${r2(CX+s*wCad*.28)} ${Y.entre+10}, ${r2(CX+s*5)} 358, ${r2(CX+s*3)} 332 Z" ${MUSC}/>`; });
      // femoral (línea) y triceps
      [-1,1].forEach(s=>{
        const xcp = CX + s*wCad*.52;
        m += `<path d="M ${r2(xcp)} ${Y.muslo-6} C ${r2(xcp+s*3)} ${Y.muslo+30}, ${r2(xcp-s*2)} ${Y.rodilla-30}, ${r2(xcp)} ${Y.rodilla-12}" ${MUSC}/>`;
        const xBic = CX + s*(wH+3);
        m += `<path d="M ${r2(xBic+s*wB*.3)} 176 C ${r2(xBic-s*wB*.2)} 198, ${r2(xBic-s*wB*.15)} 220, ${r2(xBic+s*wB*.2)} 244" ${MUSC}/>`;
      });
    }
    // rodillas, pantorrillas, tobillos y dedos (ambas vistas)
    [-1,1].forEach(s=>{
      const xc = CX + s*wCad*.52, largoPie = esMujer ? 24 : 29;
      if(!esEspalda){
        // panel del cuádriceps
        m += `<path d="M ${r2(xc-s*wM*.55)} 340 C ${r2(xc-s*wM*.85)} 374, ${r2(xc-s*wM*.55)} 420, ${r2(xc-s*8)} ${Y.rodilla-12}
          C ${r2(xc+s*4)} ${Y.rodilla-18}, ${r2(xc+s*wM*.55)} 420, ${r2(xc+s*wM*.6)} 380
          C ${r2(xc+s*wM*.5)} 354, ${r2(xc+s*12)} 336, ${r2(xc-s*wM*.55)} 340 Z" ${MUSC}/>`;
        // sartorio
        m += `<path d="M ${r2(CX+s*14)} ${Y.entre-4} C ${r2(xc-s*wM*.15)} ${Y.muslo}, ${r2(xc-s*4)} 428, ${r2(xc-s*wP*.5)} ${Y.rodilla+4}" ${MUSC}/>`;
        // rótula
        m += `<path d="M ${r2(xc-s*7)} ${Y.rodilla-6} C ${r2(xc-s*9)} ${Y.rodilla+8}, ${r2(xc-s*5)} ${Y.rodilla+20}, ${r2(xc)} ${Y.rodilla+22} C ${r2(xc+s*5)} ${Y.rodilla+20}, ${r2(xc+s*9)} ${Y.rodilla+8}, ${r2(xc+s*7)} ${Y.rodilla-6} C ${r2(xc+s*3)} ${Y.rodilla-10}, ${r2(xc-s*3)} ${Y.rodilla-10}, ${r2(xc-s*7)} ${Y.rodilla-6} Z" ${MUSC}/>`;
      }else{
        // corva
        m += `<path d="M ${r2(xc-s*7)} ${Y.rodilla+2} Q ${r2(xc)} ${Y.rodilla+8} ${r2(xc+s*7)} ${Y.rodilla+2}" ${MUSC}/>`;
      }
      // pantorrilla (dos vientres)
      m += `<path d="M ${r2(xc-s*wP*.8)} ${Y.pant-12} C ${r2(xc-s*wP*.95)} ${Y.pant+10}, ${r2(xc-s*wP*.45)} ${Y.pant+32}, ${r2(xc-s*2)} ${Y.pant+42}" ${MUSC}/>`;
      m += `<path d="M ${r2(xc+s*wP*.78)} ${Y.pant-10} C ${r2(xc+s*wP*.9)} ${Y.pant+8}, ${r2(xc+s*wP*.4)} ${Y.pant+28}, ${r2(xc+s*3)} ${Y.pant+40}" ${MUSC}/>`;
      // tobillo
      m += `<path d="M ${r2(xc-s*6)} ${Y.tobillo-4} q ${r2(s*6)} 4 ${r2(s*12)} 0" ${MUSC}/>`;
      // dedos del pie
      if(!esEspalda){
        m += `<path d="M ${r2(xc+s*(largoPie-9))} ${Y.pie-4} L ${r2(xc+s*(largoPie-8))} ${Y.pie+2}" ${MUSC}/>
        <path d="M ${r2(xc+s*(largoPie-15))} ${Y.pie-5} L ${r2(xc+s*(largoPie-14))} ${Y.pie+2}" ${MUSC}/>`;
      }
      // codo y línea del antebrazo
      const xBic = CX + s*(wH+3), xMun = CX + s*(wH+11), xCodo=(xBic+xMun)/2;
      if(!esEspalda){
        m += `<path d="M ${r2(xBic-s*wB*.45)} 174 C ${r2(xBic+s*wB*.3)} 194, ${r2(xBic+s*wB*.25)} 214, ${r2(xBic-s*wB*.15)} 240" ${MUSC}/>`;
        m += `<path d="M ${r2(xCodo-s*5)} 254 q ${r2(s*6)} 5 ${r2(s*11)} 0" ${MUSC}/>`;
        m += `<path d="M ${r2(xMun+s*wA*.4)} 268 C ${r2(xMun+s*wA*.5)} 292, ${r2(xMun+s*4)} 316, ${r2(xMun+s*2)} 332" ${MUSC}/>`;
        // dedos de la mano
        m += `<path d="M ${r2(xMun-s*3)} 352 L ${r2(xMun-s*2)} 368" ${MUSC}/>
        <path d="M ${r2(xMun+s*3)} 352 L ${r2(xMun+s*3)} 368" ${MUSC}/>`;
      }else{
        m += `<path d="M ${r2(xCodo-s*4)} 248 q ${r2(s*5)} -6 ${r2(s*10)} 0" ${MUSC}/>`;
      }
    });

    // busto femenino (línea inferior)
    if(esMujer && !esEspalda){
      [-1,1].forEach(s=>{ m += `<path d="M ${r2(CX+s*wPec*.8)} ${Y.pecho-4} Q ${r2(CX+s*wPec*.35)} ${Y.bajoPecho+8} ${r2(CX+s*6)} ${Y.bajoPecho+2}" fill="none" stroke="${L}" stroke-width="2" opacity=".85" stroke-linecap="round"/>`; });
    }
    // pliegue del abdomen (composición grasa)
    if(grasa && !esEspalda){
      m += `<path d="M ${r2(CX-wAbdO*.5)} ${Y.cadera-14} Q ${CX} ${Y.cadera-4} ${r2(CX+wAbdO*.5)} ${Y.cadera-14}" ${MUSC}/>`;
    }

    // --- Mapa de calor ---
    let calor = "";
    if(OP.pecho) calor += `<ellipse cx="${CX}" cy="${Y.pecho-14}" rx="${r2(wPec*.8)}" ry="26" fill="var(--ambar)" opacity="${OP.pecho}" filter="url(#difum)"/>`;
    [-1,1].forEach(s=>{
      if(OP.brazo) calor += `<ellipse cx="${r2(CX+s*(wH+4))}" cy="210" rx="${r2(wB+5)}" ry="32" fill="var(--ambar)" opacity="${OP.brazo}" filter="url(#difum)"/>`;
      if(OP.ante) calor += `<ellipse cx="${r2(CX+s*(wH+10))}" cy="292" rx="${r2(wA+4)}" ry="26" fill="var(--ambar)" opacity="${OP.ante}" filter="url(#difum)"/>`;
      if(OP.muslo) calor += `<ellipse cx="${r2(CX+s*wCad*.52)}" cy="${Y.muslo+4}" rx="${r2(wM*.9)}" ry="42" fill="var(--ambar)" opacity="${OP.muslo}" filter="url(#difum)"/>`;
      if(OP.pant) calor += `<ellipse cx="${r2(CX+s*wCad*.52)}" cy="${Y.pant+4}" rx="${r2(wP+4)}" ry="32" fill="var(--ambar)" opacity="${OP.pant}" filter="url(#difum)"/>`;
    });
    if(OP.cadera) calor += `<ellipse cx="${CX}" cy="${Y.cadera-2}" rx="${r2(wCad*.82)}" ry="22" fill="var(--ambar)" opacity="${OP.cadera}" filter="url(#difum)"/>`;
    if(OP.abd) calor += `<ellipse cx="${CX}" cy="${(Y.abdAlto+Y.ombligo)/2}" rx="${r2(wAbdO+panza+6)}" ry="30" fill="var(--verde)" opacity="${OP.abd}" filter="url(#difum)"/>`;

    const cuerpo = `
      ${esMujer && !esEspalda ? peloMujer.replace(TRAZO, PELO) : ""}
      <path d="${pierna(-1)}" ${TRAZO}/>
      <path d="${pierna(1)}" ${TRAZO}/>
      <path d="${torso}" ${TRAZO}/>
      <path d="${brazo(-1)}" ${TRAZO}/>
      <path d="${brazo(1)}" ${TRAZO}/>
      <path d="${cuello}" ${TRAZO}/>
      <path d="${cabeza}" ${TRAZO}/>
      ${esMujer ? (esEspalda ? peloMujer.replace(TRAZO, PELO) : "") : peloHombre.replace(TRAZO, PELO)}
      ${calor}
      ${m}`;
    return svgEnvoltura(cuerpo, `Avatar anatómico — vista ${esEspalda?'espalda':'frontal'}`);
  }

  /* ================= VISTA DE PERFIL (LADO) ================= */
  function vistaLado(){
    const X=160;
    const dPec  = (esMujer?24:30) * escala("pecho") * compGlobal;
    const dAbdA = ((esMujer?19:24) * escala("abdomenAlto") * compCintura + panza*.6) * compGlobal;
    const dAbdO = ((esMujer?20:25) * escala("abdomenOmbligo") * compCintura + panza) * compGlobal;
    const dEsp  = (esMujer?21:26) * compHombros * compGlobal;
    const dGlut = (esMujer?34:29) * escala("cadera") * compGlobal;
    const dMusF = (10 + 14*escala("pierna")) * compGlobal;
    const dMusB = (8 + 12*escala("pierna")) * compGlobal;
    const dCalf = (5 + 12*escala("pantorrilla")) * compGlobal;
    const bust = esMujer ? 11 : 0;

    const cabeza = `M 150 44
      C 176 40, 192 56, 192 76
      C 192 82, 196 84, 195 89
      C 194 94, 188 92, 186 98
      C 183 106, 172 110, 160 107
      C 145 104, 135 90, 136 70
      C 137 54, 141 46, 150 44 Z`;
    const pelo = esMujer
      ? `<path d="M 148 40 C 180 34, 196 58, 192 72
          C 186 58, 172 50, 158 52
          C 140 56, 132 74, 134 96
          C 136 136, 134 166, 128 192
          C 122 200, 112 198, 112 188
          C 120 156, 122 116, 120 86
          C 120 58, 130 44, 148 40 Z" ${TRAZO}/>`
      : `<path d="M 148 40 C 178 34, 194 56, 192 72 C 186 56, 170 48, 154 51 C 142 54, 136 62, 135 72 C 133 58, 138 44, 148 40 Z" ${TRAZO}/>`;

    const bustSeg = esMujer
      ? `C ${r2(X+dPec+bust)} 182, ${r2(X+dPec+bust+2)} 198, ${r2(X+dPec-4)} 210
         C ${r2(X+dAbdA+3)} 222, ${r2(X+dAbdA+1)} 234, ${r2(X+dAbdA)} 246 `
      : `C ${r2(X+dPec-2)} 198, ${r2(X+dAbdA+3)} 224, ${r2(X+dAbdA)} 246 `;
    const torso = `M 176 122
      C 188 138, ${r2(X+dPec+2)} 152, ${r2(X+dPec)} 176
      ${bustSeg}
      C ${r2(X+dAbdA-1)} 258, ${r2(X+dAbdO+2)} 264, ${r2(X+dAbdO)} 276
      C ${r2(X+dAbdO-2)} 296, ${r2(X+10)} 312, ${r2(X+8)} 330
      L ${r2(X+4)} 352 L ${r2(X-10)} 352
      C ${r2(X-dGlut+4)} 346, ${r2(X-dGlut)} 332, ${r2(X-dGlut)} 314
      C ${r2(X-dGlut+2)} 292, ${r2(X-16)} 268, ${r2(X-15)} 248
      C ${r2(X-14)} 224, ${r2(X-dEsp-2)} 212, ${r2(X-dEsp)} 186
      C ${r2(X-dEsp+2)} 158, ${r2(X-12)} 138, ${r2(X-10)} 124 Z`;

    function piernaLado(){
      return `M ${r2(X+8)} 324
        C ${r2(X+dMusF+4)} 350, ${r2(X+dMusF)} 386, ${r2(X+dMusF-4)} 408
        C ${r2(X+11)} 436, ${r2(X+10)} 450, ${r2(X+9)} 462
        C ${r2(X+11)} 486, ${r2(X+7)} 520, ${r2(X+5)} 546
        C ${r2(X+5)} 556, ${r2(X+3)} 562, ${r2(X+5)} 566
        C ${r2(X+16)} 570, ${r2(X+31)} 580, ${r2(X+37)} 588
        C ${r2(X+39)} 592, ${r2(X+37)} 595, ${r2(X+31)} 595
        L ${r2(X-12)} 595
        C ${r2(X-16)} 590, ${r2(X-14)} 574, ${r2(X-10)} 566
        C ${r2(X-7)} 556, ${r2(X-12)} 540, ${r2(X-dCalf+2)} 518
        C ${r2(X-dCalf)} 508, ${r2(X-dCalf-1)} 486, ${r2(X-8)} 458
        C ${r2(X-11)} 434, ${r2(X-dMusB)} 410, ${r2(X-dMusB)} 390
        C ${r2(X-dMusB)} 372, ${r2(X-11)} 358, ${r2(X-10)} 350 Z`;
    }
    const xA=157;
    const brazoLado = `M ${r2(xA-10)} 148
      C ${r2(xA+wB+5)} 152, ${r2(xA+wB+3)} 184, ${r2(xA+wB)} 216
      C ${r2(xA+wB-2)} 236, ${r2(xA+wA+4)} 246, ${r2(xA+wA+2)} 258
      C ${r2(xA+wA+5)} 276, ${r2(xA+wA+2)} 302, ${r2(xA+8)} 336
      C ${r2(xA+10)} 348, ${r2(xA+9)} 364, ${r2(xA+3)} 374
      C ${r2(xA-3)} 378, ${r2(xA-8)} 368, ${r2(xA-7)} 354
      C ${r2(xA-8)} 344, ${r2(xA-wA*.8)} 302, ${r2(xA-wA*.85)} 278
      C ${r2(xA-wA-2)} 262, ${r2(xA-wB*.8)} 246, ${r2(xA-wB*.82)} 222
      C ${r2(xA-wB*.9)} 194, ${r2(xA-wB-4)} 164, ${r2(xA-11)} 150 Z`;

    let m = `<path d="M 156 78 C 151 74, 150 84, 155 87 C 158 88, 159 81, 156 78 Z" ${MUSC}/>`; // oreja
    m += `<path d="M ${r2(X-dGlut+6)} 338 Q ${r2(X-dGlut*.4)} 350 ${r2(X-8)} 348" ${MUSC}/>`;   // pliegue glúteo
    m += `<path d="M ${r2(X-dGlut+8)} 296 C ${r2(X-dGlut-2)} 310, ${r2(X-dGlut+2)} 334, ${r2(X-12)} 344" ${MUSC}/>`; // glúteo
    m += `<path d="M ${r2(X+7)} 458 q 6 4 -1 10" ${MUSC}/>`;                                     // rodilla
    m += `<path d="M ${r2(X-dCalf+3)} 490 Q ${r2(X-dCalf-2)} 510 ${r2(X-8)} 540" ${MUSC}/>`;     // pantorrilla
    m += `<path d="M ${r2(X+dMusF-6)} 376 Q ${r2(X+dMusF-11)} 408 ${r2(X+6)} 440" ${MUSC}/>`;    // cuádriceps
    m += `<path d="M ${r2(xA-wB*.4)} 176 C ${r2(xA+wB*.3)} 196, ${r2(xA+wB*.25)} 216, ${r2(xA-wB*.1)} 242" ${MUSC}/>`; // bíceps
    if(esMujer){
      m += `<path d="M ${r2(X+dPec+bust-2)} 200 Q ${r2(X+dPec-2)} 212 ${r2(X+dAbdA+1)} 220" ${MUSC}/>`;
    }else{
      m += `<path d="M ${r2(X+dPec-3)} 194 Q ${r2(X+dPec-8)} 204 ${r2(X+dAbdA+2)} 216" ${MUSC}/>`;
    }
    if(grasa){
      m += `<path d="M ${r2(X+dAbdO-4)} 296 Q ${r2(X+dAbdO*.5)} 304 ${r2(X+4)} 302" ${MUSC}/>`;
    }

    let calor = "";
    if(OP.pecho) calor += `<ellipse cx="${r2(X+dPec-8)}" cy="188" rx="16" ry="26" fill="var(--ambar)" opacity="${OP.pecho}" filter="url(#difum)"/>`;
    if(OP.brazo) calor += `<ellipse cx="${xA}" cy="214" rx="${r2(wB+5)}" ry="32" fill="var(--ambar)" opacity="${OP.brazo}" filter="url(#difum)"/>`;
    if(OP.ante) calor += `<ellipse cx="${xA}" cy="296" rx="${r2(wA+4)}" ry="26" fill="var(--ambar)" opacity="${OP.ante}" filter="url(#difum)"/>`;
    if(OP.cadera) calor += `<ellipse cx="${r2(X-dGlut+10)}" cy="316" rx="20" ry="26" fill="var(--ambar)" opacity="${OP.cadera}" filter="url(#difum)"/>`;
    if(OP.muslo) calor += `<ellipse cx="${X}" cy="396" rx="${r2(dMusF+6)}" ry="40" fill="var(--ambar)" opacity="${OP.muslo}" filter="url(#difum)"/>`;
    if(OP.pant) calor += `<ellipse cx="${r2(X-6)}" cy="504" rx="${r2(dCalf+6)}" ry="30" fill="var(--ambar)" opacity="${OP.pant}" filter="url(#difum)"/>`;
    if(OP.abd) calor += `<ellipse cx="${r2(X+dAbdO-8)}" cy="260" rx="18" ry="30" fill="var(--verde)" opacity="${OP.abd}" filter="url(#difum)"/>`;

    const cuerpo = `
      <path d="${piernaLado()}" ${TRAZO} transform="translate(-9,0)" opacity=".55"/>
      <path d="${torso}" ${TRAZO}/>
      <path d="${piernaLado()}" ${TRAZO}/>
      <path d="M 150 102 C 152 112, 150 116, 148 126 L 176 124 C 172 116, 172 110, 173 104 Z" ${TRAZO}/>
      <path d="${cabeza}" ${TRAZO}/>
      ${pelo.replace(TRAZO, PELO)}
      <path d="${brazoLado}" ${TRAZO}/>
      ${calor}
      ${m}`;
    return svgEnvoltura(cuerpo, "Avatar anatómico — vista de perfil");
  }
}

/* Gráfica de línea SVG para la app (tema oscuro) */
export function graficaLineaSVG(puntos: { fecha: string; valor: number }[], unidad: string): string {
  if(puntos.length<2) return "";
  const W=560, H=190, mx=44, mt=16, mb=30;
  const vals = puntos.map(p=>p.valor);
  let min=Math.min(...vals), max=Math.max(...vals);
  if(min===max){ min-=1; max+=1; }
  const rango = max-min, pad = rango*0.12;
  min-=pad; max+=pad;
  const X = i => mx + (W-mx-14) * (puntos.length===1?0:i/(puntos.length-1));
  const Y = v => mt + (H-mt-mb) * (1-(v-min)/(max-min));
  let s = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;">`;
  [0.25,0.5,0.75].forEach(f=>{
    const y = mt+(H-mt-mb)*f;
    s += `<line x1="${mx}" y1="${y}" x2="${W-14}" y2="${y}" stroke="var(--borde)" stroke-dasharray="4 5" stroke-width="1"/>`;
  });
  s += `<line x1="${mx}" y1="${H-mb}" x2="${W-14}" y2="${H-mb}" stroke="var(--borde)" stroke-width="1.4"/>`;
  const pts = puntos.map((p,i)=>X(i).toFixed(1)+","+Y(p.valor).toFixed(1)).join(" ");
  s += `<polyline points="${pts}" fill="none" stroke="var(--ambar)" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>`;
  puntos.forEach((p,i)=>{
    s += `<circle cx="${X(i).toFixed(1)}" cy="${Y(p.valor).toFixed(1)}" r="4" fill="#1a1e26" stroke="var(--ambar)" stroke-width="2.4"/>`;
  });
  const ult = puntos[puntos.length-1], pri = puntos[0];
  s += `<text x="${(X(puntos.length-1)-6).toFixed(1)}" y="${(Y(ult.valor)-10).toFixed(1)}" text-anchor="end" font-size="13" font-weight="800" fill="var(--ambar)">${ult.valor} ${unidad}</text>`;
  s += `<text x="${mx-8}" y="${(Y(vals.indexOf(Math.max(...vals))>=0?Math.max(...vals):max)).toFixed(1)}" text-anchor="end" font-size="10.5" fill="var(--texto-suave)">${Math.max(...vals)}</text>`;
  s += `<text x="${mx-8}" y="${(Y(Math.min(...vals))+4).toFixed(1)}" text-anchor="end" font-size="10.5" fill="var(--texto-suave)">${Math.min(...vals)}</text>`;
  s += `<text x="${mx}" y="${H-8}" font-size="10.5" fill="var(--tenue)">${fmtFecha(pri.fecha)}</text>`;
  s += `<text x="${W-14}" y="${H-8}" text-anchor="end" font-size="10.5" fill="var(--tenue)">${fmtFecha(ult.fecha)}</text>`;
  s += `<text x="${mx}" y="12" font-size="10" fill="var(--tenue)">${unidad}</text>`;
  return s+"</svg>";
}
