/** Utilidades de escala compartidas por las gráficas. */

/** Ticks "limpios" (1, 2, 2.5, 5 × 10^n) que cubren [min, max]. */
export function ticksLimpios(min: number, max: number, cantidad = 4): number[] {
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const bruto = (max - min) / cantidad;
  const mag = Math.pow(10, Math.floor(Math.log10(bruto)));
  const paso = [1, 2, 2.5, 5, 10].map((f) => f * mag).find((p) => p >= bruto) ?? 10 * mag;
  const inicio = Math.floor(min / paso) * paso;
  const fin = Math.ceil(max / paso) * paso;
  const ticks: number[] = [];
  for (let v = inicio; v <= fin + paso / 2; v += paso) ticks.push(Number(v.toFixed(6)));
  return ticks;
}

/** Formato compacto para ejes: 1,250 · 12.5K · 1.2M */
export function compacto(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e6) return (n / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M';
  if (a >= 1e4) return (n / 1e3).toFixed(a >= 1e5 ? 0 : 1).replace(/\.0$/, '') + 'K';
  return n.toLocaleString('es-DO', { maximumFractionDigits: 1 });
}

/** Posición relativa del puntero dentro del SVG en unidades del viewBox. */
export function puntoEnSvg(ev: PointerEvent, svg: SVGSVGElement, anchoVB: number) {
  const r = svg.getBoundingClientRect();
  return { x: ((ev.clientX - r.left) * anchoVB) / r.width, escala: r.width / anchoVB };
}
