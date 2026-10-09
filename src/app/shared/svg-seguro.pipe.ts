import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/** Marca como seguro el SVG generado por nuestro código (avatar y gráficas). Nunca usar con texto del usuario. */
@Pipe({ name: 'svgSeguro' })
export class SvgSeguroPipe implements PipeTransform {
  private readonly san = inject(DomSanitizer);
  transform(svg: string): SafeHtml {
    return this.san.bypassSecurityTrustHtml(svg);
  }
}
