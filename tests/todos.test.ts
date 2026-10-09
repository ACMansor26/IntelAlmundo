// Matriz con competidor "TODOS" (default): la consulta debe correr y comparar contra el mejor competidor.
import { describe, it, expect, vi } from 'vitest';
import { cargarEntorno } from './helpers/entorno';

vi.mock('next/cache', () => ({ unstable_cache: <T>(fn: T) => fn }));
const url = cargarEntorno();

describe.skipIf(!url)('matriz con todos los competidores', () => {
  it('getTablaItinerariosAlmundo y getConteosSegmento aceptan competidor TODOS', async () => {
    const { getTablaItinerariosAlmundo, getConteosSegmento } = await import('@/lib/data');
    const filtros = { moneda: 'ARS', competidor: 'TODOS', fecha: 'TODAS' };
    const tabla = await getTablaItinerariosAlmundo(filtros, 'TODAS', 'TODAS', 'TODAS', 'TODOS', 'TODAS', 'TODOS', 1, 5, 'TODOS');
    expect(tabla.error).toBeUndefined();
    const conteos = await getConteosSegmento(filtros, 'TODAS', 'TODAS', 'TODAS', 'TODOS', 'TODAS', 'TODOS');
    expect(conteos.total).toBeGreaterThanOrEqual(0);
    const agr = await (await import('@/lib/data')).getMejoraAgregada(filtros, 'TODAS', 'TODAS', 'TODAS', 'TODOS', 'TODAS', 'TODOS');
    expect(Array.isArray(agr.rutas)).toBe(true);
    const piso = await getTablaItinerariosAlmundo(filtros, 'TODAS', 'TODAS', 'TODAS', 'TODOS', 'TODAS', 'BAJO_PISO', 1, 5, 'TODOS');
    expect(piso.error).toBeUndefined();
    for (const seg of ['ALERTA_TARIFA', 'ALERTA_COMISION']) {
      const t = await getTablaItinerariosAlmundo(filtros, 'TODAS', 'TODAS', 'TODAS', 'TODOS', 'TODAS', seg, 1, 5, 'TODOS');
      expect(t.error, seg).toBeUndefined();
    }
    expect(conteos.alerta_tarifa).toBeGreaterThanOrEqual(0);
  });
});
