import { categoriaGrasa, estaturaPulgadas, porcentajeGrasa, serieGrasa } from './grasa';
import { Atleta } from './modelos';

describe('% de grasa (fórmula de la Marina de EE. UU.)', () => {
  it('hombre: 5\'10", cintura 34", cuello 15" → ~17.5 %', () => {
    // 86.010·log10(19) − 70.041·log10(70) + 36.76 = 17.51
    expect(porcentajeGrasa('hombre', 70, { abdomenOmbligo: 34, cuello: 15 })).toBe(17.5);
  });

  it('mujer: 5\'5", cintura 28", cadera 38", cuello 13" → ~25.9 %', () => {
    // 163.205·log10(53) − 97.684·log10(65) − 78.387 = 25.93
    expect(porcentajeGrasa('mujer', 65, { abdomenAlto: 28, cadera: 38, cuello: 13 })).toBe(25.9);
  });

  it('mujer sin cintura estrecha usa la del ombligo', () => {
    expect(porcentajeGrasa('mujer', 65, { abdomenOmbligo: 28, cadera: 38, cuello: 13 })).toBe(25.9);
  });

  it('sin cuello, sin cintura o con datos imposibles no inventa un número', () => {
    expect(porcentajeGrasa('hombre', 70, { abdomenOmbligo: 34, cuello: null })).toBeNull();
    expect(porcentajeGrasa('hombre', 70, { cuello: 15 })).toBeNull();
    expect(porcentajeGrasa('hombre', 70, { abdomenOmbligo: 14, cuello: 15 })).toBeNull(); // cintura < cuello
    expect(porcentajeGrasa('hombre', 0, { abdomenOmbligo: 34, cuello: 15 })).toBeNull(); // sin estatura
    expect(porcentajeGrasa('hombre', 70, { abdomenOmbligo: 15.5, cuello: 15 })).toBeNull(); // da < 2 %
  });

  it('categorías ACE por género', () => {
    expect(categoriaGrasa('hombre', 12).categoria).toBe('Atlético');
    expect(categoriaGrasa('hombre', 20).categoria).toBe('Promedio');
    expect(categoriaGrasa('hombre', 26).categoria).toBe('Alto');
    expect(categoriaGrasa('mujer', 20).categoria).toBe('Atlético');
    expect(categoriaGrasa('mujer', 23).categoria).toBe('Fitness');
    expect(categoriaGrasa('mujer', 33).categoria).toBe('Alto');
  });

  it('la serie salta las mediciones sin cuello', () => {
    const a = {
      genero: 'hombre', estaturaPies: 5, estaturaPulg: 10,
      medidas: [
        { id: '1', fecha: '2026-01-01', peso: 180, abdomenOmbligo: 36, cuello: null },
        { id: '2', fecha: '2026-02-01', peso: 178, abdomenOmbligo: 35, cuello: 15 },
        { id: '3', fecha: '2026-03-01', peso: 176, abdomenOmbligo: 34, cuello: 15 },
      ],
    } as unknown as Atleta;
    expect(estaturaPulgadas(a)).toBe(70);
    expect(serieGrasa(a).map((p) => p.fecha)).toEqual(['2026-02-01', '2026-03-01']);
    expect(serieGrasa(a)[1].valor).toBe(17.5);
  });
});
