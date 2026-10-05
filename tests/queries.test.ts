// tests/queries.test.ts
// Ejecuta las consultas REALES de lib/data.ts contra datos de ejemplo. Se crea un
// esquema temporal (test_dash_<timestamp>) en Neon con la MISMA estructura que
// public.precios_vuelos, se cargan unos pocos vuelos con resultados conocidos y
// se borra todo al terminar. No toca los datos reales.
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { cargarEntorno, crearPoolAdmin, urlConSchema } from './helpers/entorno';

// unstable_cache solo existe dentro del runtime de Next: aca se ejecuta directo.
vi.mock('next/cache', () => ({ unstable_cache: <T>(fn: T) => fn }));

const url = cargarEntorno();
const SCHEMA = `test_dash_${Date.now()}`;

type Fila = Record<string, unknown>;

// Fila base de precios_vuelos (todas las columnas que el dashboard lee).
function fila(o: Fila): Fila {
  return {
    fuente: 'Kayak', tipo_vendedor: 'OTA', tipo_vuelo: 'DOMESTICO', region: 'CENTRO', ruta: 'AEP-COR',
    origen: 'AEP', destino: 'COR', fecha_ida: '2026-10-17', fecha_vuelta: '2026-10-24',
    dias_anticipacion: 15, dias_estadia: 7, moneda: 'ARS',
    aerolinea_ida: 'JetSmart', aerolinea_vuelta: 'JetSmart', numero_vuelo_ida: 'JA100', numero_vuelo_vuelta: 'JA101',
    escalas_ida: 0, escalas_vuelta: 0,
    aeropuerto_salida_ida: 'AEP', aeropuerto_llegada_ida: 'COR', aeropuerto_salida_vuelta: 'COR', aeropuerto_llegada_vuelta: 'EZE',
    hora_salida_ida: '06:00', hora_salida_vuelta: '08:00', hora_llegada_ida: '07:30', hora_llegada_vuelta: '09:30',
    fecha_llegada_ida: '2026-10-17', fecha_llegada_vuelta: '2026-10-24',
    equipaje_mochila: 'SI', equipaje_mano: 'NO', equipaje_bodega: 'NO',
    tarifa_base: 500, impuestos: 300, tasas: 100, cargo_gestion: 0, pct_fee: 0,
    pct_dif_checkout_vs_listado: 0, dif_checkout_vs_listado: 0,
    fecha_obtencion: '2026-10-03 10:00:00',
    ...o,
    // derivados coherentes con el desglose del checkout
    precio_total: o.precio_total ?? Number(o.precio_sin_fee) + Number(o.cargo_gestion ?? 0),
    precio_listado_vendedor: o.precio_listado_vendedor ?? Number(o.precio_sin_fee) + Number(o.cargo_gestion ?? 0)
  };
}

const ID = (n: string) => `AEP-COR_2026-10-17-${n}_2026-10-24-0800_AP15D_7D_ARS`;
const IDU = (n: string) => `AEP-COR_2026-10-17-${n}_2026-10-24-0800_AP15D_7D_USD`;

// F1 (Kayak, JetSmart): Almundo 1000 (+100 fee) vs Despegar 900 vs Atrapalo 950 -> brecha 11,11% (7.1%-15%)
// F2 (Kayak, AR): Almundo 800 = Despegar 800 -> gana. Sin Atrapalo.
// F2 tambien en TurismoCity: Almundo 850 vs Despegar 800 -> brecha 6,25% (3.1%-7%)
// F3 (TurismoCity, AR): checkout de Almundo 12% sobre el listado -> "a revisar" (se excluye); Despegar 900.
// F4 (Kayak, 02/10): corrida vieja, solo aparece con fecha 02/10 o "TODAS".
const FILAS: Fila[] = [
  fila({ id_pareja_vuelo: ID('0600'), vendedor: 'Almundo', precio_sin_fee: 1000, cargo_gestion: 100, pct_fee: 10 }),
  fila({ id_pareja_vuelo: ID('0600'), vendedor: 'Despegar', precio_sin_fee: 900 }),
  fila({ id_pareja_vuelo: ID('0600'), vendedor: 'Atrápalo', precio_sin_fee: 950, cargo_gestion: 50, pct_fee: 5.3 }),
  fila({ id_pareja_vuelo: ID('0700'), aerolinea_ida: 'Aerolíneas Argentinas', numero_vuelo_ida: 'AR200', hora_salida_ida: '07:00', vendedor: 'Almundo', precio_sin_fee: 800, cargo_gestion: 40, pct_fee: 5 }),
  fila({ id_pareja_vuelo: ID('0700'), aerolinea_ida: 'Aerolíneas Argentinas', numero_vuelo_ida: 'AR200', hora_salida_ida: '07:00', vendedor: 'Despegar', precio_sin_fee: 800 }),
  fila({ id_pareja_vuelo: ID('0700'), fuente: 'TurismoCity', aerolinea_ida: 'Aerolíneas Argentinas', numero_vuelo_ida: 'AR200', hora_salida_ida: '07:00', vendedor: 'Almundo', precio_sin_fee: 850, cargo_gestion: 42.5, pct_fee: 5 }),
  fila({ id_pareja_vuelo: ID('0700'), fuente: 'TurismoCity', aerolinea_ida: 'Aerolíneas Argentinas', numero_vuelo_ida: 'AR200', hora_salida_ida: '07:00', vendedor: 'Despegar', precio_sin_fee: 800 }),
  fila({ id_pareja_vuelo: ID('1800'), fuente: 'TurismoCity', aerolinea_ida: 'Aerolíneas Argentinas', numero_vuelo_ida: 'AR300', hora_salida_ida: '18:00', vendedor: 'Almundo', precio_sin_fee: 1000, cargo_gestion: 30, pct_fee: 3, pct_dif_checkout_vs_listado: 12, dif_checkout_vs_listado: 120 }),
  fila({ id_pareja_vuelo: ID('1800'), fuente: 'TurismoCity', aerolinea_ida: 'Aerolíneas Argentinas', numero_vuelo_ida: 'AR300', hora_salida_ida: '18:00', vendedor: 'Despegar', precio_sin_fee: 900 }),
  fila({ id_pareja_vuelo: ID('0500'), vendedor: 'Almundo', precio_sin_fee: 700, fecha_obtencion: '2026-10-02 10:00:00' }),
  fila({ id_pareja_vuelo: ID('0500'), vendedor: 'Despegar', precio_sin_fee: 700, fecha_obtencion: '2026-10-02 10:00:00' }),
  // Moneda USD, aparte de los casos ARS: U1 solo tiene a Almundo (no hay con quien comparar),
  // U2 tiene a Almundo 500 vs Despegar 400 (brecha 25%).
  fila({ id_pareja_vuelo: IDU('0900'), moneda: 'USD', hora_salida_ida: '09:00', vendedor: 'Almundo', precio_sin_fee: 500 }),
  fila({ id_pareja_vuelo: IDU('1000'), moneda: 'USD', hora_salida_ida: '10:00', vendedor: 'Almundo', precio_sin_fee: 500 }),
  fila({ id_pareja_vuelo: IDU('1000'), moneda: 'USD', hora_salida_ida: '10:00', vendedor: 'Despegar', precio_sin_fee: 400 }),
  // Skyscanner con datos solo del 02/10 (una fuente atrasada respecto del resto, que llega al 03/10).
  fila({ id_pareja_vuelo: IDU('1100'), fuente: 'Skyscanner', moneda: 'USD', hora_salida_ida: '11:00', vendedor: 'Almundo', precio_sin_fee: 600, fecha_obtencion: '2026-10-02 09:00:00' }),
  fila({ id_pareja_vuelo: IDU('1100'), fuente: 'Skyscanner', moneda: 'USD', hora_salida_ida: '11:00', vendedor: 'Despegar', precio_sin_fee: 600, fecha_obtencion: '2026-10-02 09:00:00' })
];

describe.skipIf(!url)('consultas del dashboard contra datos de ejemplo', () => {
  let admin: ReturnType<typeof crearPoolAdmin>;
  let data: typeof import('@/lib/data');

  beforeAll(async () => {
    admin = crearPoolAdmin(url!);
    await admin.query(`CREATE SCHEMA ${SCHEMA}`);
    await admin.query(`CREATE TABLE ${SCHEMA}.precios_vuelos (LIKE public.precios_vuelos INCLUDING DEFAULTS)`);
    await admin.query(`CREATE TABLE ${SCHEMA}.scraper_runs (LIKE public.scraper_runs INCLUDING DEFAULTS)`);
    await admin.query(`CREATE TABLE ${SCHEMA}.scraper_run_jobs (LIKE public.scraper_run_jobs INCLUDING DEFAULTS)`);

    let id = 1;
    for (const f of FILAS) {
      const cols = ['id', ...Object.keys(f)];
      const vals = [id++, ...Object.values(f)];
      await admin.query(
        `INSERT INTO ${SCHEMA}.precios_vuelos (${cols.join(', ')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(', ')})`,
        vals
      );
    }
    await admin.query(
      `INSERT INTO ${SCHEMA}.scraper_runs (id, fuente, fecha_inicio, fecha_fin, jobs_totales, jobs_con_datos, jobs_con_almundo, jobs_con_despegar, ofertas_totales, ofertas_ars, ofertas_usd, filas_insertadas_db)
       VALUES (1, 'Kayak', '2026-10-03 03:00', '2026-10-03 03:10', 2, 2, 2, 2, 6, 6, 0, 6)`
    );
    await admin.query(
      `INSERT INTO ${SCHEMA}.scraper_run_jobs (run_id, idx, ruta, moneda, tipo_vuelo, dias_anticipacion, dias_estadia, ofertas_count, tiene_almundo, tiene_despegar, aerolinea, tiene_atrapalo, vendedores)
       VALUES (1, 1, 'AEP-COR', 'ARS', 'DOMESTICO', 15, 7, 3, true, true, 'JetSmart', true, 'Almundo,Despegar,Atrápalo')`
    );

    // lib/data.ts crea su Pool al importarse: se apunta al esquema temporal ANTES.
    process.env.DATABASE_URL = urlConSchema(url!, SCHEMA);
    data = await import('@/lib/data');
  });

  afterAll(async () => {
    if (admin) {
      await admin.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
      await admin.end();
    }
  });

  const base = { moneda: 'ARS' };

  it('getResumenKPIs: win rate, brecha, fee y filas a revisar', async () => {
    const k = await data.getResumenKPIs(base);
    expect(k.total_vuelos_unicos).toBe(4); // F1K, F2K, F2TC, F3TC (F4 es de otro dia)
    expect(k.vuelos_con_almundo).toBe(3); // F3TC: Almundo "a revisar", excluido
    expect(k.win_rate_almundo_pct).toBe(33.3); // solo F2 en Kayak
    expect(k.gap_promedio_almundo_pct).toBe(5.8); // (11,11 + 0 + 6,25) / 3
    expect(k.fee_promedio_almundo_pct).toBe(6.7); // (10 + 5 + 5) / 3
    expect(k.filas_a_revisar).toBe(1);
  });

  it('el filtro de corrida: ULTIMA, un dia puntual y TODAS', async () => {
    expect((await data.getResumenKPIs({ ...base, fecha: 'ULTIMA' })).total_vuelos_unicos).toBe(4);
    expect((await data.getResumenKPIs({ ...base, fecha: '2026-10-03' })).total_vuelos_unicos).toBe(4);
    expect((await data.getResumenKPIs({ ...base, fecha: '2026-10-02' })).total_vuelos_unicos).toBe(1);
    expect((await data.getResumenKPIs({ ...base, fecha: 'TODAS' })).total_vuelos_unicos).toBe(5);
    // un dia sin datos no debe fallar, solo devolver 0
    expect((await data.getResumenKPIs({ ...base, fecha: '2026-01-01' })).total_vuelos_unicos).toBe(0);
  });

  it('obtenerDatosDashboard devuelve las 9 estructuras con los valores esperados', async () => {
    const d = await data.obtenerDatosDashboard(base);

    // 1. distribucion de brecha: 1 win, 1 en 3.1-7%, 1 en 7.1-15%
    const porRango = Object.fromEntries(d.datosDistribucionGap.map((r) => [r.rango_gap, r.cantidad_vuelos]));
    expect(porRango).toEqual({ '0% (Win)': 1, '0.1% a 3%': 0, '3.1% a 7%': 1, '7.1% a 15%': 1, '> 15%': 0 });

    // 2. region
    expect(d.datosRegionCompetitividad).toHaveLength(1);
    expect(d.datosRegionCompetitividad[0]).toMatchObject({ region: 'CENTRO', win_rate_almundo_pct: 33.3 });

    // 3. spread vs Despegar (F3 excluido por "a revisar")
    expect(d.datosHeadToHeadRelativo[0]).toMatchObject({ ruta: 'AEP-COR', vuelos_comparados: 3, spread_promedio_pct: 5.8 });

    // 4. composicion: Almundo y Despegar sobre los mismos vuelos
    const comp = Object.fromEntries(d.datosComposicion.map((c) => [c.vendedor, c]));
    expect(Object.keys(comp)).toEqual(expect.arrayContaining(['Almundo', 'Despegar']));
    expect(comp['Almundo'].cargo_gestion).toBeGreaterThan(comp['Despegar'].cargo_gestion);

    // 5. perfil temporal
    expect(d.datosDiaSemana).toHaveLength(7);
    expect(d.datosFranjaHoraria.map((f) => f.franja_horaria)).toEqual(expect.arrayContaining(['Mañana']));

    // 6. fee por aerolinea consolidada
    const fee = Object.fromEntries(d.datosFee.map((f) => [f.aerolinea, f]));
    expect(fee['JetSmart'].almundo).toBe(10);

    // 7. cobertura
    expect(d.datosShareGanadoresRuta[0]).toMatchObject({ ruta: 'AEP-COR', total_vuelos: 4 });

    // 8. win rate sin fee vs con fee
    expect(d.datosWinFee[0].win_sin_fee_pct).toBeGreaterThanOrEqual(d.datosWinFee[0].win_con_fee_pct);

    // 9. checkout vs listado: Almundo en TurismoCity tiene 1 de 2 filas a revisar
    const lc = d.datosListadoCheckout.find((r) => r.vendedor === 'Almundo' && r.fuente === 'TurismoCity');
    expect(lc?.a_revisar_pct).toBe(50);
  });

  it('el competidor elegido cambia la comparacion 1 a 1', async () => {
    const d = await data.obtenerDatosDashboard({ ...base, competidor: 'Atrápalo' });
    // Solo F1 tiene a Almundo y Atrapalo juntos: (1000-950)/950 = 5,3%
    expect(d.datosHeadToHeadRelativo[0]).toMatchObject({ vuelos_comparados: 1, spread_promedio_pct: 5.3 });
  });

  it('getTablaItinerariosAlmundo: una fila por vuelo y fuente, con desglose por vendedor', async () => {
    const r = await data.getTablaItinerariosAlmundo(base, 'TODAS', 'TODAS', 'TODAS', 'TODOS', 'TODAS', 'TODOS', 1, 50, 'Despegar');
    expect(r.error).toBeUndefined();
    expect(r.totalRegistros).toBe(4);
    const f1 = r.itinerarios.find((i) => i.numero_vuelo_ida === 'JA100')!;
    expect(f1.aerolinea).toBe('JetSmart');
    expect(f1.aeropuerto_llegada_vuelta).toBe('EZE'); // aeropuerto real, no el de la ruta
    expect(f1.precio_almundo).toBe(1000);
    expect(f1.precio_total_almundo).toBe(1100);
    expect(f1.vendedores.map((v) => v.vendedor)).toEqual(['Almundo', 'Despegar', 'Atrápalo']);
    expect(f1.vendedores.find((v) => v.vendedor === 'Despegar')?.es_mas_barato).toBe(true);
    expect(f1.spread_competidor_monto).toBe(100);
  });

  it('un vuelo con un solo vendedor valido no cuenta como win ni como brecha', async () => {
    const usd = { moneda: 'USD' };
    const k = await data.getResumenKPIs(usd);
    expect(k.total_vuelos_unicos).toBe(2);
    expect(k.vuelos_con_almundo).toBe(2);
    expect(k.win_rate_almundo_pct).toBe(0); // solo U2 es comparable y Almundo no gana
    expect(k.gap_promedio_almundo_pct).toBe(25);

    const t = await data.getTablaItinerariosAlmundo(usd, 'TODAS', 'TODAS', 'TODAS', 'TODOS', 'TODAS', 'TODOS', 1, 50, 'Despegar');
    const solo = t.itinerarios.find((i) => i.hora_salida_ida === '09:00')!;
    expect(solo.estado_almundo).toBe('SIN_COMPARACION');
    expect(solo.gap_min_pct).toBeNull();
    expect(solo.vendedores[0].es_mas_barato).toBe(false);
    const comp = t.itinerarios.find((i) => i.hora_salida_ida === '10:00')!;
    expect(comp.estado_almundo).toBe('DESALINEADO');
    expect(comp.gap_min_pct).toBe(25);

    const d = await data.obtenerDatosDashboard(usd);
    expect(d.datosDistribucionGap.find((r) => r.rango_gap === '0% (Win)')?.cantidad_vuelos).toBe(0);
    expect(d.datosRegionCompetitividad[0].win_rate_almundo_pct).toBe(0);
    expect(d.datosWinFee[0].vuelos).toBe(1);
  });

  it('"Última ejecución" usa una sola fecha para todas las fuentes y avisa de las atrasadas', async () => {
    const usd = { moneda: 'USD' };
    // Skyscanner solo tiene datos del 02/10: no entra en la ultima ejecucion global...
    expect((await data.getResumenKPIs({ ...usd, fecha: 'ULTIMA' })).total_vuelos_unicos).toBe(2);
    // ...pero si se la elige como fuente, se ve SU ultimo dia
    expect((await data.getResumenKPIs({ ...usd, fuente: 'Skyscanner', fecha: 'ULTIMA' })).total_vuelos_unicos).toBe(1);
    expect((await data.getResumenKPIs({ ...usd, fecha: 'TODAS' })).total_vuelos_unicos).toBe(3);
    const info = await data.getInfoActualizacion();
    expect(info.fuentesAtrasadas).toEqual([{ fuente: 'Skyscanner', ultima: '02/10' }]);
  });

  it('segmentos y conteos de la matriz', async () => {
    const c = await data.getConteosSegmento(base, 'TODAS', 'TODAS', 'TODAS', 'TODOS', 'TODAS', 'Despegar');
    expect(c.total).toBe(4);
    expect(c.a_revisar).toBe(1);
    const rev = await data.getTablaItinerariosAlmundo(base, 'TODAS', 'TODAS', 'TODAS', 'TODOS', 'TODAS', 'A_REVISAR', 1, 50, 'Despegar');
    expect(rev.totalRegistros).toBe(1);
    expect(rev.itinerarios[0].numero_vuelo_ida).toBe('AR300');
  });

  it('filtro de aerolinea consolidada', async () => {
    const jet = await data.getTablaItinerariosAlmundo({ ...base, aerolinea: 'JetSmart' }, 'TODAS', 'TODAS', 'TODAS', 'TODOS', 'TODAS', 'TODOS', 1, 50, 'Despegar');
    expect(jet.totalRegistros).toBe(1);
    const otras = await data.getTablaItinerariosAlmundo({ ...base, aerolinea: 'OTRAS' }, 'TODAS', 'TODAS', 'TODAS', 'TODOS', 'TODAS', 'TODOS', 1, 50, 'Despegar');
    expect(otras.totalRegistros).toBe(0);
    const conteos = await data.getConteosFiltros(base);
    expect(conteos.porAerolinea).toEqual({ JetSmart: 1, 'Aerolíneas Argentinas': 2 });
  });

  it('listas de filtros y frescura de datos', async () => {
    expect(await data.getRutasDisponibles('ARS')).toEqual(['AEP-COR']);
    expect(await data.getFuentesDisponibles('ARS')).toEqual(['Kayak', 'TurismoCity']);
    expect(await data.getCompetidoresDisponibles('ARS')).toEqual(['Atrápalo', 'Despegar']);
    const info = await data.getInfoActualizacion();
    expect(info.ultima).toBe('03/10 10:00');
    expect(info.fechas).toEqual(['2026-10-03', '2026-10-02']);
  });

  it('historial de corridas y detalle por aerolinea', async () => {
    const corridas = await data.getHistorialCorridas();
    expect(corridas).toHaveLength(1);
    expect(corridas[0]).toMatchObject({ fuente: 'Kayak', jobs_totales: 2 });
    const detalle = await data.getDetalleCorrida(1);
    expect(detalle[0]).toMatchObject({ aerolinea: 'JetSmart', tiene_atrapalo: true, vendedores: ['Almundo', 'Despegar', 'Atrápalo'] });
  });
});
