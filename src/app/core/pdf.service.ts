import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Atleta, PagoAtleta } from './modelos';
import { Membrete, cargarLogoPDF, descargarPlanPDF, exportarProgresoPDF, pdfABlob, planComidasPDF, reciboPagoPDF, reporteMensualPDF } from './pdf';
import { PlanComidas } from './planes-comida';

/** Genera los PDFs firmados con el perfil del entrenador que tiene la sesión. */
@Injectable({ providedIn: 'root' })
export class PdfService {
  private readonly auth = inject(AuthService);

  private async membrete(): Promise<Membrete> {
    const p = this.auth.perfil();
    return { nombre: p?.nombre ?? '', negocio: p?.negocio ?? '', logo: await cargarLogoPDF(p?.logo_url), sistema: p?.unidades ?? 'imperial' };
  }

  /** Devuelve false si no hay dos mediciones con zonas en común. */
  async progreso(a: Atleta): Promise<boolean> {
    return exportarProgresoPDF(a, await this.membrete()) !== null;
  }

  async recibo(a: Atleta, pago: PagoAtleta) {
    reciboPagoPDF(a, pago, await this.membrete());
  }

  async reporteMensual(atletas: Atleta[], mes: string) {
    reporteMensualPDF(atletas, mes, await this.membrete());
  }

  /** Descarga el PDF del plan de comidas. */
  async planComidas(a: Atleta, plan: PlanComidas) {
    const { archivo, pdf } = planComidasPDF(a, plan, await this.membrete());
    descargarPlanPDF(archivo, pdf);
  }

  /**
   * Comparte el PDF del plan con el menú del teléfono (WhatsApp, correo…).
   * Devuelve 'compartido', 'cancelado' o 'descargado' (si el navegador no permite compartir archivos).
   */
  async compartirPlanComidas(a: Atleta, plan: PlanComidas, mensaje: string): Promise<'compartido' | 'cancelado' | 'descargado'> {
    const { archivo, pdf } = planComidasPDF(a, plan, await this.membrete());
    const file = new File([pdfABlob(pdf)], archivo, { type: 'application/pdf' });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Plan de alimentación', text: mensaje });
        return 'compartido';
      } catch (e) {
        if ((e as DOMException)?.name === 'AbortError') return 'cancelado';
      }
    }
    descargarPlanPDF(archivo, pdf);
    return 'descargado';
  }
}
