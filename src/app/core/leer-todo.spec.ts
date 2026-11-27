import { leerTodo } from './leer-todo';

/** Simula PostgREST: devuelve como mucho `maxServidor` filas por respuesta, sin avisar. */
function tablaFalsa(total: number, maxServidor = 1000) {
  const filas = Array.from({ length: total }, (_, i) => ({ id: i }));
  const llamadas: [number, number][] = [];
  const pagina = (desde: number, hasta: number) => {
    llamadas.push([desde, hasta]);
    const fin = Math.min(hasta + 1, desde + maxServidor);
    return Promise.resolve({ data: filas.slice(desde, fin), error: null });
  };
  return { pagina, llamadas };
}

describe('leerTodo', () => {
  it('trae más de 1.000 filas completas, sin repetir ni saltar ninguna', async () => {
    const { pagina } = tablaFalsa(2500);
    const filas = await leerTodo(pagina);
    expect(filas.length).toBe(2500);
    expect(filas.map((f) => f.id)).toEqual(Array.from({ length: 2500 }, (_, i) => i));
  });

  it('con exactamente 1.000 filas no pierde la última página', async () => {
    const { pagina } = tablaFalsa(1000);
    expect((await leerTodo(pagina)).length).toBe(1000);
  });

  it('sigue leyendo aunque el servidor corte en menos filas que el tamaño pedido', async () => {
    const { pagina } = tablaFalsa(1300, 500);
    expect((await leerTodo(pagina)).length).toBe(1300);
  });

  it('una tabla vacía devuelve [] con una sola consulta', async () => {
    const { pagina, llamadas } = tablaFalsa(0);
    expect(await leerTodo(pagina)).toEqual([]);
    expect(llamadas.length).toBe(1);
  });

  it('propaga el error de Supabase', async () => {
    const fallo = { message: 'permiso denegado' };
    await expectAsync(leerTodo(() => Promise.resolve({ data: null, error: fallo }))).toBeRejectedWith(fallo);
  });
});
