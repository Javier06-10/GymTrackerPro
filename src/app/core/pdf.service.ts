import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Atleta, PagoAtleta } from './modelos';
import { Membrete, cargarLogoPDF, exportarProgresoPDF, reciboPagoPDF, reporteMensualPDF } from './pdf';

/** Genera los PDFs firmados con el perfil del entrenador que tiene la sesión. */
@Injectable({ providedIn: 'root' })
export class PdfService {
  private readonly auth = inject(AuthService);

  private async membrete(): Promise<Membrete> {
    const p = this.auth.perfil();
    return { nombre: p?.nombre ?? '', negocio: p?.negocio ?? '', logo: await cargarLogoPDF(p?.logo_url) };
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
}
