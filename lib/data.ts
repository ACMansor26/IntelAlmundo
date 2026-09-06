// lib/data.ts
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// ==============================================================================
// 1. POOL DE CONEXIÓN A NEON (fix #6 — driver serverless, deploy confirmado en Vercel)
// ==============================================================================
// Importante: DATABASE_URL en las env vars de Vercel debe apuntar al host CON
// "-pooler" en el nombre (ej. ep-xxx-pooler.us-east-1.aws.neon.tech). Revisalo en
// Neon -> Connection Details. Sin el pooler, este driver igual ayuda (WebSocket en
// vez de TCP persistente por invocacion), pero el pooler es el que evita agotar
// el limite de conexiones bajo trafico concurrente.
neonConfig.webSocketConstructor = ws;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// ==============================================================================
// 2. INTERFACES Y MODELOS DE DATOS
// ==============================================================================
export interface FiltrosDashboard {
  moneda: string;
  ruta?: string;
  aerolinea?: string;
  fuente?: string;
  region?: string;
  tipo_vuelo?: string;
  segmento?: string;
}

export interface ResumenKPIs {
  total_vuelos_unicos: number;
  total_vuelos_mercado: number;
  vuelos_con_almundo: number;
  vuelos_con_despegar: number;
  share_presencia_almundo_pct: number;
  share_presencia_despegar_pct: number;
  win_rate_almundo_pct: number;
  gap_promedio_almundo_pct: number;
  mejor_precio_promedio: number | null;
  markup_promedio_directo_pct: number;
  posicion_promedio_almundo: number | null;
}

export interface ItinerarioAlmundo {
  id_pareja_vuelo: string;
  ruta: string;
  region: string;
  aerolinea: string;
  fuente: string;
  fecha_ida: string;
  hora_salida_ida: string | null;
  fecha_vuelta: string;
  hora_salida_vuelta: string | null;
  dia_semana_ida: string;
  dias_anticipacion: number;
  dias_estadia: number;
  precio_almundo: number | null;
  posicion_almundo: number | null;
  mejor_precio_mercado: number;
  vendedor_ganador: string;
  gap_min_pct: number | null;
  gap_min_monto: number | null;
  spread_despegar_pct: number | null;
  spread_despegar_monto: number | null;
  estado_almundo: 'WIN' | 'OPORTUNIDAD' | 'MODERADO' | 'DESALINEADO' | 'SIN_OFERTA';
}

export interface ResultadoPaginadoItinerarios {
  itinerarios: ItinerarioAlmundo[];
  totalRegistros: number;
  totalPaginas: number;
  paginaActual: number;
  tamanoPagina: number;
}

export interface DatosDistribucionGap {
  rango_gap: string;
  cantidad_vuelos: number;
  share_pct: number;
}

export interface DatosRegionCompetitividad {
  region: string;
  total_vuelos: number;
  win_rate_almundo_pct: number;
  gap_promedio_almundo: number | null;
}

export interface DatosHeadToHeadRelativo {
  ruta: string;
  vuelos_comparados: number;
  spread_promedio_pct: number;
  spread_promedio_monto: number;
}

export interface DatosGraficoAP {
  dias_anticipacion: number;
  almundo: number | null;
  despegar: number | null;
  canal_directo: number | null;
}

export interface DatosEstadia {
  rango_estadia: string;
  almundo: number | null;
  despegar: number | null;
  canal_directo: number | null;
}

export interface DatosDiaSemana {
  dia_semana_vuelo: string;
  almundo: number | null;
  despegar: number | null;
  canal_directo: number | null;
}

export interface DatosShareGanadoresRuta {
  ruta: string;
  almundo_pct: number;
  despegar_pct: number;
  turismocity_pct: number;
  total_vuelos: number;
}

export interface DatosMarkupDirecto {
  aerolinea: string;
  almundo: number | null;
  despegar: number | null;
  turismocity: number | null;
  atrapalo: number | null;
}

export interface DatosRanking {
  vendedor: string;
  ranking_promedio: number;
}

// ==============================================================================
// 3. HELPER DE FILTROS SQL
// ==============================================================================
function normalizarFiltros(
  monedaOrFiltros: string | FiltrosDashboard = 'ARS',
  ruta: string = 'TODAS',
  fuente: string = 'TODAS',
  aerolinea: string = 'TODAS',
  tipo_vuelo: string = 'TODOS',
  region: string = 'TODAS'
): { whereSql: string; params: any[]; filtros: FiltrosDashboard } {
  let f: FiltrosDashboard;
  if (typeof monedaOrFiltros === 'object' && monedaOrFiltros !== null) {
    f = monedaOrFiltros;
  } else {
    f = {
      moneda: monedaOrFiltros || 'ARS',
      ruta,
      fuente,
      aerolinea,
      tipo_vuelo,
      region
    };
  }

  const whereClauses: string[] = ['moneda = $1'];
  const params: any[] = [f.moneda];

  if (f.ruta && f.ruta !== 'TODAS') {
    params.push(f.ruta);
    whereClauses.push(`ruta = $${params.length}`);
  }
  if (f.fuente && f.fuente !== 'TODAS') {
    params.push(f.fuente);
    whereClauses.push(`fuente = $${params.length}`);
  }
  if (f.aerolinea && f.aerolinea !== 'TODAS') {
    params.push(f.aerolinea);
    whereClauses.push(`aerolinea = $${params.length}`);
  }
  if (f.tipo_vuelo && f.tipo_vuelo !== 'TODOS') {
    params.push(f.tipo_vuelo);
    whereClauses.push(`tipo_vuelo = $${params.length}`);
  }
  if (f.region && f.region !== 'TODAS') {
    params.push(f.region);
    whereClauses.push(`region = $${params.length}`);
  }

  return { whereSql: whereClauses.join(' AND '), params, filtros: f };
}

// ==============================================================================
// 3b. ALLOWLIST DE SEGMENTOS (fix #1)
// ==============================================================================
const SEGMENTOS_VALIDOS = ['TODOS', 'OPORTUNIDADES', 'VS_DESPEGAR', 'DESALINEADOS'] as const;
type SegmentoValido = typeof SEGMENTOS_VALIDOS[number];

function normalizarSegmento(candidato: string | undefined): SegmentoValido {
  return (SEGMENTOS_VALIDOS as readonly string[]).includes(candidato ?? '')
    ? (candidato as SegmentoValido)
    : 'TODOS';
}

// ==============================================================================
// 4. KPIS EJECUTIVOS
// ==============================================================================
export async function getResumenKPIs(
  monedaOrFiltros: string | FiltrosDashboard = 'ARS',
  ruta: string = 'TODAS',
  fuente: string = 'TODAS',
  aerolinea: string = 'TODAS',
  tipo_vuelo: string = 'TODOS',
  region: string = 'TODAS'
): Promise<ResumenKPIs> {
  const { whereSql, params } = normalizarFiltros(monedaOrFiltros, ruta, fuente, aerolinea, tipo_vuelo, region);
  const client = await pool.connect();

  try {
    // Fix #4: precio_almundo y markup_directo_almundo salen ahora de una sola fila
    // por vuelo (la de menor precio del vendedor), en vez de MIN(CASE...) separados
    // que podian mezclar columnas de registros de scraping distintos.
    const q = await client.query(
      `
      WITH pares AS (
        SELECT 
          id_pareja_vuelo,
          MIN(precio) AS mejor_precio
        FROM precios_vuelos
        WHERE ${whereSql}
        GROUP BY id_pareja_vuelo
      ),
      almundo_best AS (
        SELECT DISTINCT ON (id_pareja_vuelo)
          id_pareja_vuelo,
          precio AS precio_almundo,
          posicion_vendedor AS posicion_almundo,
          markup_vs_directo_pct * 100 AS markup_directo_almundo
        FROM precios_vuelos
        WHERE ${whereSql} AND vendedor = 'Almundo'
        ORDER BY id_pareja_vuelo, precio ASC, posicion_vendedor ASC
      ),
      despegar_ids AS (
        SELECT DISTINCT id_pareja_vuelo
        FROM precios_vuelos
        WHERE ${whereSql} AND vendedor = 'Despegar'
      )
      SELECT 
        COUNT(*) AS total_vuelos_unicos,
        COUNT(a.precio_almundo) AS vuelos_con_almundo,
        COUNT(d.id_pareja_vuelo) AS vuelos_con_despegar,
        COUNT(CASE WHEN a.precio_almundo IS NOT NULL AND a.precio_almundo <= p.mejor_precio THEN 1 END) AS victorias_almundo,
        ROUND(AVG(CASE WHEN a.precio_almundo IS NOT NULL AND p.mejor_precio > 0 
                  THEN ((a.precio_almundo - p.mejor_precio) / p.mejor_precio) * 100 END), 1) AS gap_promedio_almundo_pct,
        ROUND(AVG(p.mejor_precio)) AS mejor_precio_promedio,
        ROUND(AVG(a.markup_directo_almundo), 1) AS markup_promedio_directo_pct,
        ROUND(AVG(a.posicion_almundo), 2) AS posicion_promedio_almundo
      FROM pares p
      LEFT JOIN almundo_best a ON p.id_pareja_vuelo = a.id_pareja_vuelo
      LEFT JOIN despegar_ids d ON p.id_pareja_vuelo = d.id_pareja_vuelo;
      `,
      params
    );

    const r = q.rows[0] || {};
    const totalUnicos = Number(r.total_vuelos_unicos || 0);
    const conAlmundo = Number(r.vuelos_con_almundo || 0);
    const conDespegar = Number(r.vuelos_con_despegar || 0);
    const victoriasAlmundo = Number(r.victorias_almundo || 0);

    return {
      total_vuelos_unicos: totalUnicos,
      total_vuelos_mercado: totalUnicos,
      vuelos_con_almundo: conAlmundo,
      vuelos_con_despegar: conDespegar,
      share_presencia_almundo_pct: totalUnicos > 0 ? Number(((conAlmundo * 100) / totalUnicos).toFixed(1)) : 0,
      share_presencia_despegar_pct: totalUnicos > 0 ? Number(((conDespegar * 100) / totalUnicos).toFixed(1)) : 0,
      win_rate_almundo_pct: conAlmundo > 0 ? Number(((victoriasAlmundo * 100) / conAlmundo).toFixed(1)) : 0,
      gap_promedio_almundo_pct: Number(r.gap_promedio_almundo_pct || 0),
      mejor_precio_promedio: r.mejor_precio_promedio !== null ? Number(r.mejor_precio_promedio) : null,
      markup_promedio_directo_pct: Number(r.markup_promedio_directo_pct || 0),
      posicion_promedio_almundo: r.posicion_promedio_almundo !== null ? Number(r.posicion_promedio_almundo) : null
    };
  } catch (err) {
    console.error('Error en getResumenKPIs:', err);
    return {
      total_vuelos_unicos: 0,
      total_vuelos_mercado: 0,
      vuelos_con_almundo: 0,
      vuelos_con_despegar: 0,
      share_presencia_almundo_pct: 0,
      share_presencia_despegar_pct: 0,
      win_rate_almundo_pct: 0,
      gap_promedio_almundo_pct: 0,
      mejor_precio_promedio: null,
      markup_promedio_directo_pct: 0,
      posicion_promedio_almundo: null
    };
  } finally {
    client.release();
  }
}

// ==============================================================================
// 5. TABLA PAGINADA DE ITINERARIOS
// ==============================================================================
export async function getTablaItinerariosAlmundo(
  monedaOrFiltros: string | FiltrosDashboard = 'ARS',
  ruta: string = 'TODAS',
  fuente: string = 'TODAS',
  aerolinea: string = 'TODAS',
  tipo_vuelo: string = 'TODOS',
  region: string = 'TODAS',
  segmento: string = 'TODOS',
  pagina: number = 1,
  tamanoPagina: number = 50
): Promise<ResultadoPaginadoItinerarios> {
  const { whereSql, params, filtros } = normalizarFiltros(monedaOrFiltros, ruta, fuente, aerolinea, tipo_vuelo, region);

  // Fix #1: allowlist + parametro real en vez de interpolar el string en el SQL.
  const seg = normalizarSegmento(filtros.segmento || segmento);
  params.push(seg);
  const segParamIdx = params.length;

  const limit = Math.max(1, tamanoPagina);
  const offset = (Math.max(1, pagina) - 1) * limit;

  const client = await pool.connect();

  try {
    // Fix #4: precio_almundo, posicion_almundo y precio_despegar ya no salen de
    // MIN(CASE...) agregados por separado (lo que podia combinar precio de una
    // fila con posicion de otra fila distinta del mismo vendedor). Ahora
    // "almundo_best" / "despegar_best" traen UNA fila por vuelo -la de menor
    // precio, con empate por posicion- asi precio y posicion siempre son del
    // mismo registro.
    const q = await client.query(
      `
      WITH base_vuelos AS (
        SELECT 
          id_pareja_vuelo,
          ruta,
          region,
          aerolinea,
          fuente,
          TO_CHAR(fecha_ida, 'YYYY-MM-DD') AS fecha_ida,
          hora_salida_ida,
          TO_CHAR(fecha_vuelta, 'YYYY-MM-DD') AS fecha_vuelta,
          hora_salida_vuelta,
          dia_semana_ida,
          dias_anticipacion,
          dias_estadia,
          MIN(precio) AS mejor_precio_mercado
        FROM precios_vuelos
        WHERE ${whereSql}
        GROUP BY 
          id_pareja_vuelo, ruta, region, aerolinea, fuente,
          fecha_ida, hora_salida_ida, fecha_vuelta, hora_salida_vuelta,
          dia_semana_ida, dias_anticipacion, dias_estadia
      ),
      almundo_best AS (
        -- Fix: escopado tambien por "fuente" (antes solo por id_pareja_vuelo) --
        -- si no, esta fila mezclaba el precio de Almundo mas barato entre AMBOS
        -- scrapers combinados, aunque base_vuelos ya trae una fila separada por
        -- fuente. Resultado: la fila "TurismoCity" y la fila "Kayak" del mismo
        -- vuelo mostraban el mismo precio_almundo (cruzado entre fuentes) pero
        -- cada una con su propio mejor_precio_mercado (competidores vistos solo
        -- por esa fuente) -- gap_min_pct y estado_almundo podian salir distintos
        -- para el mismo vuelo/precio segun que fila mirabas.
        SELECT DISTINCT ON (id_pareja_vuelo, fuente)
          id_pareja_vuelo,
          fuente,
          precio AS precio_almundo,
          posicion_vendedor AS posicion_almundo
        FROM precios_vuelos
        WHERE ${whereSql} AND vendedor = 'Almundo'
        ORDER BY id_pareja_vuelo, fuente, precio ASC, posicion_vendedor ASC
      ),
      despegar_best AS (
        SELECT DISTINCT ON (id_pareja_vuelo, fuente)
          id_pareja_vuelo,
          fuente,
          precio AS precio_despegar
        FROM precios_vuelos
        WHERE ${whereSql} AND vendedor = 'Despegar'
        ORDER BY id_pareja_vuelo, fuente, precio ASC, posicion_vendedor ASC
      ),
      ganadores AS (
        SELECT DISTINCT ON (id_pareja_vuelo, fuente)
          id_pareja_vuelo,
          fuente,
          vendedor AS vendedor_ganador
        FROM precios_vuelos
        WHERE ${whereSql}
        ORDER BY id_pareja_vuelo, fuente, precio ASC, posicion_vendedor ASC
      ),
      metricas AS (
        SELECT 
          b.*,
          a.precio_almundo,
          a.posicion_almundo,
          dsp.precio_despegar,
          COALESCE(g.vendedor_ganador, 'Desconocido') AS vendedor_ganador,
          CASE 
            WHEN a.precio_almundo IS NOT NULL THEN (a.precio_almundo - b.mejor_precio_mercado)
            ELSE NULL 
          END AS gap_min_monto,
          CASE 
            WHEN a.precio_almundo IS NOT NULL AND b.mejor_precio_mercado > 0 
              THEN ROUND(((a.precio_almundo - b.mejor_precio_mercado) / b.mejor_precio_mercado) * 100, 1)
            ELSE NULL 
          END AS gap_min_pct,
          CASE 
            WHEN a.precio_almundo IS NOT NULL AND dsp.precio_despegar IS NOT NULL 
              THEN (a.precio_almundo - dsp.precio_despegar)
            ELSE NULL 
          END AS spread_despegar_monto,
          CASE 
            WHEN a.precio_almundo IS NOT NULL AND dsp.precio_despegar IS NOT NULL AND dsp.precio_despegar > 0 
              THEN ROUND(((a.precio_almundo - dsp.precio_despegar) / dsp.precio_despegar) * 100, 1)
            ELSE NULL 
          END AS spread_despegar_pct,
          CASE 
            WHEN a.precio_almundo IS NULL THEN 'SIN_OFERTA'
            WHEN b.mejor_precio_mercado <= 0 THEN 'SIN_OFERTA'
            WHEN (a.precio_almundo - b.mejor_precio_mercado) = 0 THEN 'WIN'
            WHEN ((a.precio_almundo - b.mejor_precio_mercado) / b.mejor_precio_mercado) <= 0.03 THEN 'OPORTUNIDAD'
            WHEN ((a.precio_almundo - b.mejor_precio_mercado) / b.mejor_precio_mercado) <= 0.07 THEN 'MODERADO'
            ELSE 'DESALINEADO'
          END AS estado_almundo
        FROM base_vuelos b
        LEFT JOIN almundo_best a ON b.id_pareja_vuelo = a.id_pareja_vuelo AND b.fuente = a.fuente
        LEFT JOIN despegar_best dsp ON b.id_pareja_vuelo = dsp.id_pareja_vuelo AND b.fuente = dsp.fuente
        LEFT JOIN ganadores g ON b.id_pareja_vuelo = g.id_pareja_vuelo AND b.fuente = g.fuente
      ),
      filtrados AS (
        SELECT *, COUNT(*) OVER() AS total_count
        FROM metricas
        WHERE 
          CASE 
            WHEN $${segParamIdx}::text = 'OPORTUNIDADES' THEN estado_almundo = 'OPORTUNIDAD'
            WHEN $${segParamIdx}::text = 'VS_DESPEGAR' THEN spread_despegar_monto < 0
            WHEN $${segParamIdx}::text = 'DESALINEADOS' THEN estado_almundo = 'DESALINEADO'
            ELSE TRUE 
          END
      )
      SELECT * FROM filtrados
      ORDER BY gap_min_monto DESC NULLS LAST, fecha_ida ASC, ruta ASC
      LIMIT ${limit} OFFSET ${offset};
      `,
      params
    );

    const totalRegistros = q.rows.length > 0 ? Number(q.rows[0].total_count) : 0;
    const totalPaginas = Math.ceil(totalRegistros / limit) || 1;

    const itinerarios: ItinerarioAlmundo[] = q.rows.map(r => ({
      id_pareja_vuelo: r.id_pareja_vuelo,
      ruta: r.ruta,
      region: r.region,
      aerolinea: r.aerolinea,
      fuente: r.fuente,
      fecha_ida: r.fecha_ida,
      hora_salida_ida: r.hora_salida_ida || null,
      fecha_vuelta: r.fecha_vuelta,
      hora_salida_vuelta: r.hora_salida_vuelta || null,
      dia_semana_ida: r.dia_semana_ida,
      dias_anticipacion: Number(r.dias_anticipacion),
      dias_estadia: Number(r.dias_estadia),
      precio_almundo: r.precio_almundo !== null ? Number(r.precio_almundo) : null,
      posicion_almundo: r.posicion_almundo !== null ? Number(r.posicion_almundo) : null,
      mejor_precio_mercado: Number(r.mejor_precio_mercado),
      vendedor_ganador: r.vendedor_ganador,
      gap_min_pct: r.gap_min_pct !== null ? Number(r.gap_min_pct) : null,
      gap_min_monto: r.gap_min_monto !== null ? Number(r.gap_min_monto) : null,
      spread_despegar_pct: r.spread_despegar_pct !== null ? Number(r.spread_despegar_pct) : null,
      spread_despegar_monto: r.spread_despegar_monto !== null ? Number(r.spread_despegar_monto) : null,
      estado_almundo: r.estado_almundo as ItinerarioAlmundo['estado_almundo']
    }));

    return {
      itinerarios,
      totalRegistros,
      totalPaginas,
      paginaActual: pagina,
      tamanoPagina: limit
    };
  } catch (err) {
    console.error('Error en getTablaItinerariosAlmundo:', err);
    return {
      itinerarios: [],
      totalRegistros: 0,
      totalPaginas: 1,
      paginaActual: pagina,
      tamanoPagina: limit
    };
  } finally {
    client.release();
  }
}

// ==============================================================================
// 6. MOTOR DE CONSULTAS PARA LOS 9 GRAFICOS ESTRATEGICOS
// ==============================================================================
export async function obtenerDatosDashboard(filtros: FiltrosDashboard) {
  const { whereSql, params } = normalizarFiltros(filtros);
  const client = await pool.connect();

  try {
    // 1. Histograma de Gap % (Elasticidad)
    const qGap = await client.query(
      `
      WITH almundo_gaps AS (
        SELECT 
          id_pareja_vuelo,
          gap_vs_min_pct * 100 AS gap_pct
        FROM precios_vuelos
        WHERE ${whereSql}
          AND vendedor = 'Almundo'
          AND gap_vs_min_pct IS NOT NULL
      ),
      rangos AS (
        SELECT 
          CASE 
            WHEN gap_pct = 0 THEN '0% (Win)'
            WHEN gap_pct > 0 AND gap_pct <= 3 THEN '0.1% a 3%'
            WHEN gap_pct > 3 AND gap_pct <= 7 THEN '3.1% a 7%'
            WHEN gap_pct > 7 AND gap_pct <= 15 THEN '7.1% a 15%'
            ELSE '> 15%'
          END AS rango_gap,
          COUNT(*) AS cantidad_vuelos
        FROM almundo_gaps
        GROUP BY 1
      ),
      orden_rangos AS (
        SELECT unnest(ARRAY['0% (Win)', '0.1% a 3%', '3.1% a 7%', '7.1% a 15%', '> 15%']) AS rango_gap,
               generate_series(1, 5) AS orden
      )
      SELECT 
        o.rango_gap,
        COALESCE(r.cantidad_vuelos, 0) AS cantidad_vuelos,
        ROUND(COALESCE(r.cantidad_vuelos, 0) * 100.0 / NULLIF(SUM(r.cantidad_vuelos) OVER(), 0), 1) AS share_pct
      FROM orden_rangos o
      LEFT JOIN rangos r ON o.rango_gap = r.rango_gap
      ORDER BY o.orden;
      `,
      params
    );

    // 2. Win Rate & Gap Promedio por Region
    const qRegion = await client.query(
      `
      SELECT 
        region,
        COUNT(DISTINCT id_pareja_vuelo) AS total_vuelos,
        ROUND(COUNT(DISTINCT CASE WHEN vendedor = 'Almundo' AND es_mejor_precio = 'SI' THEN id_pareja_vuelo END) * 100.0 / 
              NULLIF(COUNT(DISTINCT CASE WHEN vendedor = 'Almundo' THEN id_pareja_vuelo END), 0), 1) AS win_rate_almundo_pct,
        ROUND(AVG(CASE WHEN vendedor = 'Almundo' THEN gap_vs_min_pct * 100 END), 1) AS gap_promedio_almundo
      FROM precios_vuelos
      WHERE ${whereSql} AND region IS NOT NULL AND region != ''
      GROUP BY region
      ORDER BY total_vuelos DESC;
      `,
      params
    );

    // 3. Almundo vs Despegar: Spread Head-to-Head Relativo (%)
    const qH2H = await client.query(
      `
      WITH pares AS (
        SELECT 
          ruta,
          MIN(CASE WHEN vendedor = 'Almundo' THEN precio END) AS precio_almundo,
          MIN(CASE WHEN vendedor = 'Despegar' THEN precio END) AS precio_despegar
        FROM precios_vuelos
        WHERE ${whereSql} AND vendedor IN ('Almundo', 'Despegar')
        GROUP BY ruta, id_pareja_vuelo
        HAVING COUNT(DISTINCT vendedor) = 2
      )
      SELECT 
        ruta,
        COUNT(*) AS vuelos_comparados,
        ROUND(AVG(((precio_almundo - precio_despegar) * 100.0 / NULLIF(precio_despegar, 0))), 1) AS spread_promedio_pct,
        ROUND(AVG(precio_almundo - precio_despegar)) AS spread_promedio_monto
      FROM pares
      GROUP BY ruta
      ORDER BY vuelos_comparados DESC
      LIMIT 12;
      `,
      params
    );

    // 4. Curva de Anticipacion (Advance Purchase)
    const qAP = await client.query(
      `
      SELECT 
        dias_anticipacion,
        ROUND(AVG(CASE WHEN vendedor = 'Almundo' THEN gap_vs_min_pct * 100 END), 1) AS almundo,
        ROUND(AVG(CASE WHEN vendedor = 'Despegar' THEN gap_vs_min_pct * 100 END), 1) AS despegar,
        ROUND(AVG(CASE WHEN tipo_vendedor = 'AEROLINEA' THEN gap_vs_min_pct * 100 END), 1) AS canal_directo
      FROM precios_vuelos
      WHERE ${whereSql}
      GROUP BY dias_anticipacion
      ORDER BY dias_anticipacion ASC;
      `,
      params
    );

    // 5. Competitividad segun Dias de Estadia
    const qEstadia = await client.query(
      `
      WITH estadia_bucket AS (
        SELECT 
          CASE 
            WHEN dias_estadia BETWEEN 1 AND 4 THEN '1-4d (Escapada)'
            WHEN dias_estadia BETWEEN 5 AND 8 THEN '5-8d (Semana)'
            WHEN dias_estadia BETWEEN 9 AND 14 THEN '9-14d (Vacaciones)'
            ELSE '15d+ (Larga)'
          END AS rango_estadia,
          CASE 
            WHEN dias_estadia BETWEEN 1 AND 4 THEN 1
            WHEN dias_estadia BETWEEN 5 AND 8 THEN 2
            WHEN dias_estadia BETWEEN 9 AND 14 THEN 3
            ELSE 4
          END AS orden_estadia,
          vendedor,
          tipo_vendedor,
          gap_vs_min_pct
        FROM precios_vuelos
        WHERE ${whereSql} AND dias_estadia IS NOT NULL AND dias_estadia > 0
      )
      SELECT 
        rango_estadia,
        ROUND(AVG(CASE WHEN vendedor = 'Almundo' THEN gap_vs_min_pct * 100 END), 1) AS almundo,
        ROUND(AVG(CASE WHEN vendedor = 'Despegar' THEN gap_vs_min_pct * 100 END), 1) AS despegar,
        ROUND(AVG(CASE WHEN tipo_vendedor = 'AEROLINEA' THEN gap_vs_min_pct * 100 END), 1) AS canal_directo
      FROM estadia_bucket
      GROUP BY rango_estadia, orden_estadia
      ORDER BY orden_estadia ASC;
      `,
      params
    );

    // 6. Sensibilidad por Dia de Salida
    const qDiaSemana = await client.query(
      `
      WITH orden_dias AS (
        SELECT unnest(ARRAY['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']) AS dia,
               generate_series(1, 7) AS nro_dia
      )
      SELECT 
        od.dia AS dia_semana_vuelo,
        ROUND(AVG(CASE WHEN pv.vendedor = 'Almundo' THEN pv.gap_vs_min_pct * 100 END), 1) AS almundo,
        ROUND(AVG(CASE WHEN pv.vendedor = 'Despegar' THEN pv.gap_vs_min_pct * 100 END), 1) AS despegar,
        ROUND(AVG(CASE WHEN pv.tipo_vendedor = 'AEROLINEA' THEN pv.gap_vs_min_pct * 100 END), 1) AS canal_directo
      FROM orden_dias od
      LEFT JOIN precios_vuelos pv 
        ON od.dia = pv.dia_semana_ida 
        AND ${whereSql}
      GROUP BY od.dia, od.nro_dia
      ORDER BY od.nro_dia ASC;
      `,
      params
    );

    // 7. Share of Voice por Ruta (Top 6 rutas)
    const qSOV = await client.query(
      `
      SELECT 
        ruta,
        COUNT(DISTINCT id_pareja_vuelo) AS total_vuelos,
        ROUND(COUNT(DISTINCT CASE WHEN vendedor = 'Almundo' THEN id_pareja_vuelo END) * 100.0 / NULLIF(COUNT(DISTINCT id_pareja_vuelo), 0), 1) AS almundo_pct,
        ROUND(COUNT(DISTINCT CASE WHEN vendedor = 'Despegar' THEN id_pareja_vuelo END) * 100.0 / NULLIF(COUNT(DISTINCT id_pareja_vuelo), 0), 1) AS despegar_pct,
        ROUND(COUNT(DISTINCT CASE WHEN vendedor = 'TurismoCity' THEN id_pareja_vuelo END) * 100.0 / NULLIF(COUNT(DISTINCT id_pareja_vuelo), 0), 1) AS turismocity_pct
      FROM precios_vuelos
      WHERE ${whereSql}
      GROUP BY ruta
      ORDER BY total_vuelos DESC
      LIMIT 6;
      `,
      params
    );

    // 8. Markup vs Canal Directo por Aerolinea (Almundo, Despegar, TurismoCity y Atrápalo)
    const qMarkup = await client.query(
      `
      SELECT 
        aerolinea,
        ROUND(AVG(CASE WHEN vendedor = 'Almundo' THEN markup_vs_directo_pct * 100 END), 1) AS almundo,
        ROUND(AVG(CASE WHEN vendedor = 'Despegar' THEN markup_vs_directo_pct * 100 END), 1) AS despegar,
        ROUND(AVG(CASE WHEN vendedor = 'TurismoCity' THEN markup_vs_directo_pct * 100 END), 1) AS turismocity,
        ROUND(AVG(CASE WHEN vendedor = 'Atrápalo' THEN markup_vs_directo_pct * 100 END), 1) AS atrapalo
      FROM precios_vuelos
      WHERE ${whereSql}
        AND markup_vs_directo_pct IS NOT NULL
      GROUP BY aerolinea
      HAVING COUNT(DISTINCT vendedor) >= 2
      ORDER BY aerolinea ASC;
      `,
      params
    );

    // 9. Visibilidad en Pantalla (Ad Rank Promedio)
    const qRanking = await client.query(
      `
      SELECT 
        vendedor,
        ROUND(AVG(posicion_vendedor), 2) AS ranking_promedio
      FROM precios_vuelos
      WHERE ${whereSql}
        AND vendedor IN ('Almundo', 'Despegar', 'TurismoCity', 'Atrápalo', 'Smiles')
      GROUP BY vendedor
      ORDER BY ranking_promedio ASC;
      `,
      params
    );

    return {
      datosDistribucionGap: qGap.rows.map(r => ({
        rango_gap: r.rango_gap,
        cantidad_vuelos: Number(r.cantidad_vuelos),
        share_pct: Number(r.share_pct || 0)
      })),
      datosRegionCompetitividad: qRegion.rows.map(r => ({
        region: r.region,
        total_vuelos: Number(r.total_vuelos),
        win_rate_almundo_pct: Number(r.win_rate_almundo_pct || 0),
        gap_promedio_almundo: r.gap_promedio_almundo !== null ? Number(r.gap_promedio_almundo) : null
      })),
      datosHeadToHeadRelativo: qH2H.rows.map(r => ({
        ruta: r.ruta,
        vuelos_comparados: Number(r.vuelos_comparados),
        spread_promedio_pct: Number(r.spread_promedio_pct || 0),
        spread_promedio_monto: Number(r.spread_promedio_monto || 0)
      })),
      datosAP: qAP.rows.map(r => ({
        dias_anticipacion: Number(r.dias_anticipacion),
        almundo: r.almundo !== null ? Number(r.almundo) : null,
        despegar: r.despegar !== null ? Number(r.despegar) : null,
        canal_directo: r.canal_directo !== null ? Number(r.canal_directo) : null
      })),
      datosEstadia: qEstadia.rows.map(r => ({
        rango_estadia: r.rango_estadia,
        almundo: r.almundo !== null ? Number(r.almundo) : null,
        despegar: r.despegar !== null ? Number(r.despegar) : null,
        canal_directo: r.canal_directo !== null ? Number(r.canal_directo) : null
      })),
      datosDiaSemana: qDiaSemana.rows.map(r => ({
        dia_semana_vuelo: r.dia_semana_vuelo,
        almundo: r.almundo !== null ? Number(r.almundo) : null,
        despegar: r.despegar !== null ? Number(r.despegar) : null,
        canal_directo: r.canal_directo !== null ? Number(r.canal_directo) : null
      })),
      datosShareGanadoresRuta: qSOV.rows.map(r => ({
        ruta: r.ruta,
        total_vuelos: Number(r.total_vuelos),
        almundo_pct: Number(r.almundo_pct || 0),
        despegar_pct: Number(r.despegar_pct || 0),
        turismocity_pct: Number(r.turismocity_pct || 0)
      })),
      datosMarkup: qMarkup.rows.map(r => ({
        aerolinea: r.aerolinea,
        almundo: r.almundo !== null ? Number(r.almundo) : null,
        despegar: r.despegar !== null ? Number(r.despegar) : null,
        turismocity: r.turismocity !== null ? Number(r.turismocity) : null,
        atrapalo: r.atrapalo !== null ? Number(r.atrapalo) : null
      })),
      datosRanking: qRanking.rows.map(r => ({
        vendedor: r.vendedor,
        ranking_promedio: Number(Number(r.ranking_promedio || 0).toFixed(1))
      }))
    };
  } finally {
    client.release();
  }
}

// ==============================================================================
// 7. FUNCIONES DE SELECTORES DINAMICOS
// ==============================================================================
const FUENTES_FALLBACK = ['TurismoCity', 'Kayak'];
const AEROLINEAS_FALLBACK = [
  'Aerolíneas Argentinas', 'JetSmart', 'LATAM', 'Iberia',
  'Air Europa', 'Copa Airlines', 'GOL', 'SKY Airline'
];
const RUTAS_FALLBACK = [
  'AEP-COR', 'AEP-MDZ', 'AEP-BRC', 'AEP-SLA', 'AEP-IGR', 'AEP-TUC', 'COR-MDZ',
  'AEP-SCL', 'AEP-RIO', 'AEP-GRU', 'EZE-MIA', 'EZE-MAD', 'EZE-CUN', 'EZE-PUJ'
];
const REGIONES_FALLBACK = [
  'BUENOS AIRES', 'CENTRO', 'CUYO', 'NOA', 'LITORAL',
  'PATAGONIA', 'CHILE', 'BRASIL', 'CARIBE', 'EEUU', 'EUROPA'
];
const TIPOS_VUELO_FALLBACK = ['INTERNACIONAL', 'DOMESTICO'];

export async function getFuentesDisponibles(moneda?: string): Promise<string[]> {
  try {
    const clause = moneda && moneda !== 'TODAS' ? 'WHERE moneda = $1' : '';
    const params = moneda && moneda !== 'TODAS' ? [moneda] : [];
    const res = await pool.query(
      `SELECT DISTINCT fuente FROM precios_vuelos ${clause} ORDER BY fuente ASC;`,
      params
    );
    return res.rows.length > 0 ? res.rows.map(r => r.fuente) : FUENTES_FALLBACK;
  } catch {
    return FUENTES_FALLBACK;
  }
}

export async function getAerolineasDisponibles(moneda?: string): Promise<string[]> {
  try {
    const clause = moneda && moneda !== 'TODAS' ? 'WHERE moneda = $1' : '';
    const params = moneda && moneda !== 'TODAS' ? [moneda] : [];
    const res = await pool.query(
      `SELECT DISTINCT aerolinea FROM precios_vuelos ${clause} ORDER BY aerolinea ASC;`,
      params
    );
    return res.rows.length > 0 ? res.rows.map(r => r.aerolinea) : AEROLINEAS_FALLBACK;
  } catch {
    return AEROLINEAS_FALLBACK;
  }
}

export async function getRutasDisponibles(moneda?: string): Promise<string[]> {
  try {
    const clause = moneda && moneda !== 'TODAS' ? 'WHERE moneda = $1' : '';
    const params = moneda && moneda !== 'TODAS' ? [moneda] : [];
    const res = await pool.query(
      `SELECT DISTINCT ruta FROM precios_vuelos ${clause} ORDER BY ruta ASC;`,
      params
    );
    return res.rows.length > 0 ? res.rows.map(r => r.ruta) : RUTAS_FALLBACK;
  } catch {
    return RUTAS_FALLBACK;
  }
}

export async function getRegionesDisponibles(moneda?: string, tipo_vuelo?: string): Promise<string[]> {
  try {
    const clauses: string[] = [];
    const params: any[] = [];
    if (moneda && moneda !== 'TODAS') {
      params.push(moneda);
      clauses.push(`moneda = $${params.length}`);
    }
    if (tipo_vuelo && tipo_vuelo !== 'TODOS') {
      params.push(tipo_vuelo);
      clauses.push(`tipo_vuelo = $${params.length}`);
    }
    const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const res = await pool.query(
      `SELECT DISTINCT region FROM precios_vuelos ${whereSql} ORDER BY region ASC;`,
      params
    );
    return res.rows.length > 0 ? res.rows.map(r => r.region) : REGIONES_FALLBACK;
  } catch {
    return REGIONES_FALLBACK;
  }
}

export async function getTiposVueloDisponibles(moneda?: string): Promise<string[]> {
  try {
    const clause = moneda && moneda !== 'TODAS' ? 'WHERE moneda = $1' : '';
    const params = moneda && moneda !== 'TODAS' ? [moneda] : [];
    const res = await pool.query(
      `SELECT DISTINCT tipo_vuelo FROM precios_vuelos ${clause} ORDER BY tipo_vuelo ASC;`,
      params
    );
    return res.rows.length > 0 ? res.rows.map(r => r.tipo_vuelo) : TIPOS_VUELO_FALLBACK;
  } catch {
    return TIPOS_VUELO_FALLBACK;
  }
}