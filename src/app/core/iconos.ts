/* ============================================================
   ICONOS DE LA APP (dibujos propios de trazo, 24×24, currentColor)
   Se usan desde el componente <app-icono> y, como texto SVG, desde
   el contenido del manual. Sustituyen a los emojis de la plantilla.
   ============================================================ */
export const ICONOS: Record<string, string> = {
  // Generales
  mas: '<path d="M12 5v14M5 12h14"/>',
  cerrar: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m4.5 12.5 4.5 4.5 10-10"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  casa: '<path d="M3.5 11 12 4l8.5 7"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5.5h4V20"/>',
  lupa: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  editar: '<path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17z"/><path d="m14.5 7 3 3"/>',
  papelera: '<path d="M4.5 7h15"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 13h9l1-13"/><path d="M10 11v6M14 11v6"/>',
  recargar: '<path d="M20 11a8 8 0 0 0-14.3-4.6L4 8.5"/><path d="M4 4v4.5h4.5"/><path d="M4 13a8 8 0 0 0 14.3 4.6L20 15.5"/><path d="M20 20v-4.5h-4.5"/>',
  engranaje: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/>',
  herramienta: '<path d="M14.5 5.5a4 4 0 0 0 5 5L12 18a2.1 2.1 0 0 1-3-3z"/><path d="M14.5 5.5 17 3l4 4-2.5 2.5"/><path d="m9 15-5 5"/>',
  guardar: '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4"/><rect x="8" y="13" width="8" height="5" rx="1"/>',
  descargar: '<path d="M12 4v11"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M5 19.5h14"/>',
  subir: '<path d="M12 15V4"/><path d="m7.5 8.5 4.5-4.5 4.5 4.5"/><path d="M5 19.5h14"/>',
  enviar: '<path d="M21 3 10.5 13.5"/><path d="M21 3 14.5 21l-4-7.5L3 9.5z"/>',
  compartir: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6"/>',
  chat: '<path d="M4 18.5V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8z"/><path d="M8.5 9h7M8.5 12.5h4.5"/>',
  telefono: '<rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M11 18.5h2"/>',
  pin: '<path d="M12 21v-6"/><path d="M7.5 15h9l-1.5-4V5h-6v6z"/><path d="M8 5h8"/>',
  documento: '<path d="M6 3h8.5L19 7.5V21H6z"/><path d="M14 3v5h5"/><path d="M9 13h7M9 16.5h5"/>',
  recibo: '<path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21z"/><path d="M9 8h6M9 11.5h6M9 15h3.5"/>',
  tarjeta: '<rect x="2.5" y="5" width="19" height="14" rx="2.2"/><path d="M2.5 9.5h19M6 15h4"/>',
  dinero: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.8"/><path d="M6 9.5v5M18 9.5v5"/>',
  candado: '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  escudo: '<path d="M12 3 4.5 6v5.5c0 4.6 3.1 8 7.5 9.5 4.4-1.5 7.5-4.9 7.5-9.5V6z"/><path d="m8.8 12 2.2 2.2 4.2-4.4"/>',
  alerta: '<path d="M12 3.5 2.8 19.5h18.4z"/><path d="M12 10v4.2M12 16.8v.2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.2"/>',
  bombilla: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
  regalo: '<rect x="3.5" y="9" width="17" height="4" rx="1"/><path d="M5 13v8h14v-8M12 9v12"/><path d="M12 9C10 9 7.5 8 7.5 6a2 2 0 0 1 4.5 0v3zM12 9c2 0 4.5-1 4.5-3a2 2 0 0 0-4.5 0"/>',
  prohibido: '<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
  campana: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>',
  reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  bandera: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
  // Personas y cuerpo
  persona: '<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5c.8-4 3.8-6.2 7.5-6.2s6.7 2.2 7.5 6.2"/>',
  usuarios: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3 19c.6-3.2 3-5 6-5s5.4 1.8 6 5"/><circle cx="17" cy="9.5" r="2.4"/><path d="M16 14.2c2.4.2 4.2 1.8 4.8 4.3"/>',
  mujer: '<circle cx="12" cy="7.5" r="3.6"/><path d="M8.5 7.5c0 4-2 5-2 5h3"/><path d="M15.5 7.5c0 4 2 5 2 5h-3"/><path d="M5.5 20.5c.8-3.8 3.4-5.8 6.5-5.8s5.7 2 6.5 5.8"/>',
  hombre: '<circle cx="12" cy="8" r="3.6"/><path d="M8.6 6.6c1.2-2.6 5.6-2.6 6.8 0"/><path d="M5 20.5c.8-4.2 3.6-6.2 7-6.2s6.2 2 7 6.2"/>',
  'cuerpo-delgado': '<circle cx="12" cy="4.5" r="2"/><path d="M12 7v7M9.5 9.5l2.5-1 2.5 1M10.8 21l1.2-7 1.2 7"/>',
  'cuerpo-grueso': '<circle cx="12" cy="4.5" r="2"/><path d="M8 9.5c-1 3 .5 5.5 4 5.5s5-2.5 4-5.5c-1-1.5-7-1.5-8 0z"/><path d="M10 15l-.5 6M14 15l.5 6"/>',
  'cuerpo-atletico': '<circle cx="12" cy="4.5" r="2"/><path d="M6.5 8.5 12 8l5.5.5-2.5 6h-6z"/><path d="M10 14.5 9.5 21M14 14.5l.5 6.5"/>',
  cumple: '<path d="M4.5 20.5h15V13a2 2 0 0 0-2-2h-11a2 2 0 0 0-2 2z"/><path d="M4.5 15.5c1.5 1.3 3 1.3 4.5 0s3-1.3 4.5 0 3 1.3 4.5 0 1.3-.5 1.5-.5"/><path d="M12 11V7.5"/><path d="M12 3.5c1 1 1 2.5 0 3-1-.5-1-2 0-3z"/>',
  cama: '<path d="M3 18V7M3 13h18v5"/><path d="M21 13v-2a2.5 2.5 0 0 0-2.5-2.5H11V13"/><circle cx="7" cy="10.5" r="1.8"/>',
  // Entrenamiento y salud
  pesa: '<path d="M2.5 12h19"/><rect x="4.5" y="7" width="3" height="10" rx="1"/><rect x="16.5" y="7" width="3" height="10" rx="1"/><path d="M2.5 9.5v5M21.5 9.5v5"/>',
  regla: '<rect x="2.5" y="8" width="19" height="8" rx="1.5"/><path d="M6.5 8v3M10 8v4M13.5 8v3M17 8v4"/>',
  rutina: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2.8h6V4"/><path d="M8.5 10h7M8.5 13.5h7M8.5 17h4"/>',
  manzana: '<path d="M12 7.5c-1.5-1.3-6.5-1.6-7 3.5-.4 4.2 2.3 9.5 5 9.5 1 0 1.3-.5 2-.5s1 .5 2 .5c2.7 0 5.4-5.3 5-9.5-.5-5.1-5.5-4.8-7-3.5z"/><path d="M12 7.5C12 5.5 13 4 15 3.5"/>',
  cubiertos: '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10"/><path d="M17 21V3c-2 1.5-3 4-3 7h3"/>',
  calendario: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><path d="M7.5 13.5h2M11 13.5h2M14.5 13.5h2M7.5 17h2M11 17h2"/>',
  diana: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.8"/><circle cx="12" cy="12" r="1.3"/>',
  nota: '<path d="M5 3.5h14v17H5z"/><path d="M8.5 8h7M8.5 11.5h7M8.5 15h4"/>',
  fuego: '<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.4 2.4-5.4 3.6-8.3.4 1.6 1.4 2.8 2.6 3.3.2-2.6 1.4-4.6 3.3-6.3.2 2.8 3.5 5.3 3.5 10 0 4.3-2.6 7.5-6.5 7.5z"/><path d="M12 21c-1.6 0-2.8-1.2-2.8-2.8 0-1.8 1.6-2.6 2.2-4 .9 1.3 3.4 2 3.4 4 0 1.6-1.2 2.8-2.8 2.8z"/>',
  tendencia: '<path d="m3 17 6-6 4 4 7.5-7.5"/><path d="M14.5 7.5h6v6"/>',
  'tendencia-baja': '<path d="m3 7 6 6 4-4 7.5 7.5"/><path d="M14.5 16.5h6v-6"/>',
  balanza: '<path d="M12 4v16M7 20h10M5 7h14"/><path d="m5 7-2.5 6a3 3 0 0 0 5 0zM19 7l-2.5 6a3 3 0 0 0 5 0z"/>',
  actividad: '<path d="M2.5 12h4l2.5-6 4.5 12 2.5-6h5.5"/>',
  grafico: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  libro: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>',
  microscopio: '<path d="M9 3.5 14 6l-3 6-5-2.5z"/><path d="m11.5 9.5 2 1"/><path d="M5 21h14M7 17.5h8"/><path d="M15 9a5 5 0 0 1 0 8.5"/>',
  nube: '<path d="M7 18.5h10a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7 9.6 4.5 4.5 0 0 0 7 18.5z"/>',
  estrella: '<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>',
};

/** SVG del icono como texto (para HTML generado, p. ej. el manual). */
export function iconoSvg(nombre: string, tam = 16, clase = 'ico-inline'): string {
  return `<svg class="${clase}" width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS[nombre] ?? ''}</svg>`;
}
