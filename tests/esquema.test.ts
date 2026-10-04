// tests/esquema.test.ts
// Contrato de esquema contra la base REAL (solo lectura sobre information_schema):
// si el scraper cambia o elimina una columna que el dashboard usa, esto falla
// con el nombre exacto de la columna, antes de que se rompa una pantalla.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { cargarEntorno, crearPoolAdmin } from './helpers/entorno';
import { TABLAS_CONTRATO } from '@/lib/esquema';

const url = cargarEntorno();

describe.skipIf(!url)('contrato de esquema con la base real', () => {
  let pool: ReturnType<typeof crearPoolAdmin>;

  beforeAll(() => {
    pool = crearPoolAdmin(url!);
  });
  afterAll(async () => {
    await pool.end();
  });

  for (const [tabla, columnas] of Object.entries(TABLAS_CONTRATO)) {
    it(`${tabla} tiene todas las columnas que usa el dashboard`, async () => {
      const res = await pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`,
        [tabla]
      );
      const existentes = new Set(res.rows.map((r) => r.column_name));
      const faltantes = columnas.filter((c) => !existentes.has(c));
      expect(faltantes, `Columnas que faltan en ${tabla}`).toEqual([]);
    });
  }

  it('los importes de precios_vuelos son numericos', async () => {
    const res = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'precios_vuelos'
         AND column_name = ANY($1)`,
      [['tarifa_base', 'impuestos', 'tasas', 'cargo_gestion', 'precio_total', 'precio_sin_fee', 'pct_fee', 'pct_dif_checkout_vs_listado']]
    );
    for (const r of res.rows) expect(r.data_type, r.column_name).toBe('numeric');
  });
});
