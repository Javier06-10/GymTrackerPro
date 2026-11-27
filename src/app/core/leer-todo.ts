/**
 * Lee TODAS las filas de una consulta de Supabase, página por página.
 *
 * PostgREST corta cada respuesta en un máximo de filas (1.000 por defecto en Supabase)
 * y NO avisa: una consulta sin paginar devuelve las primeras 1.000 y el resto
 * desaparece en silencio. Con 100 atletas que pagan cada mes, eso pasa en menos de
 * un año.
 *
 * `pagina(desde, hasta)` debe construir la consulta con `.range(desde, hasta)` y un
 * orden ESTABLE (añade `id` como desempate) para que ninguna fila se repita ni se
 * salte entre páginas.
 *
 * Se detiene al recibir una página vacía, no una "corta": si el servidor tuviera un
 * máximo menor que `tam`, una página corta no significaría que se acabaron los datos.
 */
export interface PaginaSupabase<T> {
  data: T[] | null;
  error: unknown;
}

export async function leerTodo<T>(
  pagina: (desde: number, hasta: number) => PromiseLike<PaginaSupabase<T>>,
  tam = 1000,
): Promise<T[]> {
  const filas: T[] = [];
  for (let vueltas = 0; vueltas < 1000; vueltas++) {
    const { data, error } = await pagina(filas.length, filas.length + tam - 1);
    if (error) throw error;
    if (!data?.length) return filas;
    filas.push(...data);
  }
  throw new Error('leerTodo: demasiadas páginas (¿el orden de la consulta no es estable?)');
}
