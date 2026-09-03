// lib/data.ts
import { sql } from './db';

export interface ResumenKPIs {
  total_cotizaciones: number;
  total_vuelos_unicos: number;
  ultima_actualizacion: string;
  win_rate_almundo_pct: number;
  gap_promedio_almundo_pct: number;
  mejor_precio_promedio: number;
}

export interface FilaItinerarioAlmundo {
  id_pareja_vuelo: string;
  ruta: string;
  origen: string;
  destino: string;
  tipo_vuelo: string;
  region: string;
  fecha_ida: string;
  fecha_vuelta: string;
  dia_semana_ida: string;
  dias_anticipacion: number;
  dias_estadia: number;
  aerolinea: string;
  fuente: string;
  moneda: string;
  precio_almundo: number | null;
  posicion_almundo: number | null;
  mejor_precio_mercado: number;
  vendedor_ganador: string;
  precio_despegar: number | null;
  gap_min_monto: number | null;
  gap_min_pct: number | null;
  spread_despegar_monto: number | null;
  spread_despegar_pct: number | null;
  estado_almundo: 'WIN' | 'OPORTUNIDAD' | 'MODERADO' | 'DESALINEADO' | 'SIN_OFERTA';
}

export interface ResultadoPaginadoItinerarios {
  itinerarios: FilaItinerarioAlmundo[];
  totalRegistros: number;
  totalPaginas: number;
  paginaActual: number;
  tamanoPagina: number;
}

export interface DatosGraficoAP {
  dias_anticipacion: number;
  almundo: number;
  despegar: number;
  atrapalo: number;
  canal_directo: number;
}

export interface DatosMarkupDirecto {
  aerolinea: string;
  almundo: number;
  despegar: number;
  atrapalo: number;
  turismocity: number;
}

export interface DatosRanking {
  vendedor: string;
  ranking_promedio: number;
  total_ofertas: number;
}

export interface DatosHeadToHead {
  ruta: string;
  precio_almundo: number;
  precio_despegar: number;
  gap_monto_almundo_vs_despegar: number;
}

export interface DatosDiaSemana {
  dia_semana_vuelo: string;
  almundo: number;
  despegar: number;
  atrapalo: number;
  canal_directo: number;
}

export interface DatosDistribucionGap {
  rango_gap: string;
  cantidad_vuelos: number;
  share_pct: number;
}

export interface DatosShareGanadoresRuta {
  ruta: string;
  almundo_pct: number;
  despegar_pct: number;
  atrapalo_pct: number;
  turismocity_pct: number;
  directo_pct: number;
}

export interface DatosParidadCanales {
  vendedor: string;
  turismocity: number;
  kayak: number;
  disparidad_pct: number;
}

export interface DatosHistoricoScraping {
  fecha_obtencion: string;
  win_rate_almundo: number;
  gap_promedio_almundo: number;
  gap_promedio_despegar: number;
  gap_promedio_atrapalo: number;
  gap_promedio_turismocity: number;
  gap_promedio_directo: number;
}

// --- SELECTORES DINÁMICOS DE FILTROS ---

export async function getRutasDisponibles(moneda: string = 'ARS'): Promise<string[]> {
  const rows = await sql`
    SELECT DISTINCT ruta FROM precios_vuelos WHERE moneda = ${moneda} ORDER BY ruta ASC;
  `;
  return rows.map((r: any) => r.ruta);
}

export async function getFuentesDisponibles(moneda: string = 'ARS'): Promise<string[]> {
  const rows = await sql`
    SELECT DISTINCT fuente FROM precios_vuelos WHERE moneda = ${moneda} ORDER BY fuente ASC;
  `;
  return rows.map((r: any) => r.fuente);
}

export async function getAerolineasDisponibles(moneda: string = 'ARS'): Promise<string[]> {
  const rows = await sql`
    SELECT DISTINCT aerolinea FROM precios_vuelos 
    WHERE moneda = ${moneda} AND aerolinea IS NOT NULL AND aerolinea != ''
    ORDER BY aerolinea ASC;
  `;
  return rows.map((r: any) => r.aerolinea);
}

export async function getRegionesDisponibles(moneda: string = 'ARS', tipo_vuelo?: string): Promise<string[]> {
  let queryStr = `SELECT DISTINCT region FROM precios_vuelos WHERE moneda = $1 AND region IS NOT NULL`;
  const params: any[] = [moneda];
  if (tipo_vuelo && tipo_vuelo !== 'TODOS') {
    params.push(tipo_vuelo);
    queryStr += ` AND tipo_vuelo = $${params.length}`;
  }
  queryStr += ` ORDER BY region ASC;`;
  const rows = (await sql.query(queryStr, params)) as any[];
  return rows.map((r: any) => r.region);
}

// --- HELPER PARA CONDICIONALES SQL ---
function armarFiltrosWhere(moneda: string, ruta?: string, fuente?: string, aerolinea?: string, tipo_vuelo?: string, region?: string) {
  let where = `WHERE moneda = $1`;
  const params: any[] = [moneda];

  if (ruta && ruta !== 'TODAS') {
    params.push(ruta);
    where += ` AND ruta = $${params.length}`;
  }
  if (fuente && fuente !== 'TODAS') {
    params.push(fuente);
    where += ` AND fuente = $${params.length}`;
  }
  if (aerolinea && aerolinea !== 'TODAS') {
    params.push(aerolinea);
    where += ` AND aerolinea = $${params.length}`;
  }
  if (tipo_vuelo && tipo_vuelo !== 'TODOS') {
    params.push(tipo_vuelo);
    where += ` AND tipo_vuelo = $${params.length}`;
  }
  if (region && region !== 'TODAS') {
    params.push(region);
    where += ` AND region = $${params.length}`;
  }

  return { where, params };
}

// --- RESUMEN DE KPIS ---
export async function getResumenKPIs(
  moneda: string = 'ARS',
  ruta?: string,
  fuente?: string,
  aerolinea?: string,
  tipo_vuelo?: string,
  region?: string
): Promise<ResumenKPIs> {
  const { where, params } = armarFiltrosWhere(moneda, ruta, fuente, aerolinea, tipo_vuelo, region);

  const queryStr = `
    SELECT 
      COUNT(*)::int AS total_cotizaciones,
      COUNT(DISTINCT id_pareja_vuelo)::int AS total_vuelos_unicos,
      TO_CHAR(MAX(fecha_obtencion), 'DD/MM/YYYY') AS ultima_actualizacion,
      ROUND(
        (COUNT(*) FILTER (WHERE vendedor = 'Almundo' AND es_mejor_precio = 'SI')::decimal / 
        NULLIF(COUNT(*) FILTER (WHERE vendedor = 'Almundo'), 0)) * 100, 1
      )::float AS win_rate_almundo_pct,
      ROUND(
        COALESCE(AVG(gap_vs_min_pct) FILTER (WHERE vendedor = 'Almundo')::numeric * 100, 0), 1
      )::float AS gap_promedio_almundo_pct,
      ROUND(COALESCE(AVG(precio) FILTER (WHERE es_mejor_precio = 'SI')::numeric, 0), 0)::float AS mejor_precio_promedio
    FROM precios_vuelos
    ${where};
  `;

  const rows = (await sql.query(queryStr, params)) as any[];
  return rows[0] as ResumenKPIs;
}

// --- MATRIZ OPERATIVA DE ITINERARIOS ROUND-TRIP ---
export async function getTablaItinerariosAlmundo(
  moneda: string = 'ARS',
  ruta?: string,
  fuente?: string,
  aerolinea?: string,
  tipo_vuelo?: string,
  region?: string,
  segmento?: string,
  pagina: number = 1,
  limite: number = 50
): Promise<ResultadoPaginadoItinerarios> {
  const paginaSaneada = Math.max(1, pagina);
  const offset = (paginaSaneada - 1) * limite;
  const { where, params } = armarFiltrosWhere(moneda, ruta, fuente, aerolinea, tipo_vuelo, region);

  let queryStr = `
    WITH vuelos_agrupados AS (
      SELECT 
        id_pareja_vuelo,
        ruta,
        origen,
        destino,
        tipo_vuelo,
        region,
        TO_CHAR(fecha_ida, 'YYYY-MM-DD') AS fecha_ida,
        TO_CHAR(fecha_vuelta, 'YYYY-MM-DD') AS fecha_vuelta,
        dia_semana_ida,
        dias_anticipacion,
        dias_estadia,
        aerolinea,
        fuente,
        moneda,
        MIN(precio) AS mejor_precio_mercado,
        (ARRAY_AGG(vendedor ORDER BY precio ASC))[1] AS vendedor_ganador,
        MIN(precio) FILTER (WHERE vendedor = 'Almundo') AS precio_almundo,
        MIN(precio) FILTER (WHERE vendedor = 'Despegar') AS precio_despegar,
        MIN(posicion_vendedor) FILTER (WHERE vendedor = 'Almundo') AS posicion_almundo
      FROM precios_vuelos
      ${where}
      GROUP BY id_pareja_vuelo, ruta, origen, destino, tipo_vuelo, region, fecha_ida, fecha_vuelta, dia_semana_ida, dias_anticipacion, dias_estadia, aerolinea, fuente, moneda
    ),
    calculados AS (
      SELECT 
        *,
        CASE 
          WHEN precio_almundo IS NOT NULL THEN precio_almundo - mejor_precio_mercado 
          ELSE NULL 
        END AS gap_min_monto,
        CASE 
          WHEN precio_almundo IS NOT NULL AND mejor_precio_mercado > 0 
          THEN ROUND(((precio_almundo - mejor_precio_mercado)::numeric / mejor_precio_mercado::numeric) * 100, 1)::float
          ELSE NULL 
        END AS gap_min_pct,
        CASE 
          WHEN precio_almundo IS NOT NULL AND precio_despegar IS NOT NULL 
          THEN precio_almundo - precio_despegar 
          ELSE NULL 
        END AS spread_despegar_monto,
        CASE 
          WHEN precio_almundo IS NOT NULL AND precio_despegar IS NOT NULL AND precio_despegar > 0 
          THEN ROUND(((precio_almundo - precio_despegar)::numeric / precio_despegar::numeric) * 100, 1)::float
          ELSE NULL 
        END AS spread_despegar_pct
      FROM vuelos_agrupados
      WHERE 1=1
  `;

  if (segmento === 'WINS') {
    queryStr += ` AND precio_almundo IS NOT NULL AND precio_almundo <= mejor_precio_mercado`;
  } else if (segmento === 'OPORTUNIDADES') {
    queryStr += ` AND precio_almundo IS NOT NULL AND ((precio_almundo - mejor_precio_mercado)::decimal / mejor_precio_mercado) > 0 AND ((precio_almundo - mejor_precio_mercado)::decimal / mejor_precio_mercado) <= 0.03`;
  } else if (segmento === 'VS_DESPEGAR') {
    queryStr += ` AND precio_almundo IS NOT NULL AND precio_despegar IS NOT NULL AND precio_almundo < precio_despegar`;
  } else if (segmento === 'DESALINEADOS') {
    queryStr += ` AND precio_almundo IS NOT NULL AND ((precio_almundo - mejor_precio_mercado)::decimal / mejor_precio_mercado) > 0.07`;
  }

  params.push(limite);
  const limitParam = `$${params.length}`;
  params.push(offset);
  const offsetParam = `$${params.length}`;

  queryStr += `
    ),
    con_conteo AS (
      SELECT *, (COUNT(*) OVER())::int AS total_registros
      FROM calculados
    )
    SELECT *
    FROM con_conteo
    ORDER BY fecha_ida ASC, gap_min_pct ASC NULLS LAST
    LIMIT ${limitParam} OFFSET ${offsetParam};
  `;

  const rows = (await sql.query(queryStr, params)) as any[];
  const totalRegistros = rows.length > 0 ? (rows[0].total_registros || 0) : 0;
  const totalPaginas = Math.ceil(totalRegistros / limite) || 1;

  const itinerarios: FilaItinerarioAlmundo[] = rows.map((r: any) => {
    let estado: FilaItinerarioAlmundo['estado_almundo'] = 'SIN_OFERTA';

    if (r.precio_almundo !== null) {
      const pct = r.gap_min_pct ?? 0;
      if (pct <= 0) {
        estado = 'WIN';
      } else if (pct <= 3.0) {
        estado = 'OPORTUNIDAD';
      } else if (pct <= 7.0) {
        estado = 'MODERADO';
      } else {
        estado = 'DESALINEADO';
      }
    }

    return {
      id_pareja_vuelo: r.id_pareja_vuelo,
      ruta: r.ruta,
      origen: r.origen,
      destino: r.destino,
      tipo_vuelo: r.tipo_vuelo,
      region: r.region,
      fecha_ida: r.fecha_ida,
      fecha_vuelta: r.fecha_vuelta,
      dia_semana_ida: r.dia_semana_ida,
      dias_anticipacion: r.dias_anticipacion,
      dias_estadia: r.dias_estadia,
      aerolinea: r.aerolinea,
      fuente: r.fuente,
      moneda: r.moneda,
      precio_almundo: r.precio_almundo,
      posicion_almundo: r.posicion_almundo,
      mejor_precio_mercado: r.mejor_precio_mercado,
      vendedor_ganador: r.vendedor_ganador,
      precio_despegar: r.precio_despegar,
      gap_min_monto: r.gap_min_monto,
      gap_min_pct: r.gap_min_pct,
      spread_despegar_monto: r.spread_despegar_monto,
      spread_despegar_pct: r.spread_despegar_pct,
      estado_almundo: estado
    };
  });

  return {
    itinerarios,
    totalRegistros,
    totalPaginas,
    paginaActual: paginaSaneada,
    tamanoPagina: limite
  };
}

// 1. Curva AP (Canal Directo mediante tipo_vendedor = 'AEROLINEA')
export async function getGraficoAP(moneda: string = 'ARS', ruta?: string, fuente?: string, aerolinea?: string, tipo_vuelo?: string, region?: string): Promise<DatosGraficoAP[]> {
  const { where, params } = armarFiltrosWhere(moneda, ruta, fuente, aerolinea, tipo_vuelo, region);
  const queryStr = `
    SELECT 
      dias_anticipacion,
      ROUND(COALESCE(AVG(gap_vs_min_pct) FILTER (WHERE vendedor = 'Almundo')::numeric * 100, 0), 1)::float AS almundo,
      ROUND(COALESCE(AVG(gap_vs_min_pct) FILTER (WHERE vendedor = 'Despegar')::numeric * 100, 0), 1)::float AS despegar,
      ROUND(COALESCE(AVG(gap_vs_min_pct) FILTER (WHERE vendedor = 'Atrápalo')::numeric * 100, 0), 1)::float AS atrapalo,
      ROUND(COALESCE(AVG(gap_vs_min_pct) FILTER (WHERE tipo_vendedor = 'AEROLINEA')::numeric * 100, 0), 1)::float AS canal_directo
    FROM precios_vuelos
    ${where}
    GROUP BY dias_anticipacion ORDER BY dias_anticipacion ASC;
  `;
  const rows = (await sql.query(queryStr, params)) as any[];
  return rows as DatosGraficoAP[];
}

// 2. Markup vs Canal Directo por Aerolínea (LATAM incluida directamente)
export async function getGraficoMarkupDirecto(moneda: string = 'ARS', ruta?: string, fuente?: string, aerolinea?: string, tipo_vuelo?: string, region?: string): Promise<DatosMarkupDirecto[]> {
  const { where, params } = armarFiltrosWhere(moneda, ruta, fuente, aerolinea, tipo_vuelo, region);
  const queryStr = `
    SELECT 
      aerolinea,
      ROUND(COALESCE(AVG(markup_vs_directo_pct) FILTER (WHERE vendedor = 'Almundo')::numeric * 100, 0), 1)::float AS almundo,
      ROUND(COALESCE(AVG(markup_vs_directo_pct) FILTER (WHERE vendedor = 'Despegar')::numeric * 100, 0), 1)::float AS despegar,
      ROUND(COALESCE(AVG(markup_vs_directo_pct) FILTER (WHERE vendedor = 'Atrápalo')::numeric * 100, 0), 1)::float AS atrapalo,
      ROUND(COALESCE(AVG(markup_vs_directo_pct) FILTER (WHERE vendedor = 'TurismoCity')::numeric * 100, 0), 1)::float AS turismocity
    FROM precios_vuelos
    ${where} AND aerolinea IS NOT NULL AND aerolinea != ''
    GROUP BY aerolinea
    HAVING COUNT(*) FILTER (WHERE vendedor IN ('Almundo', 'Despegar', 'Atrápalo', 'TurismoCity')) > 0
    ORDER BY aerolinea ASC;
  `;
  const rows = (await sql.query(queryStr, params)) as any[];
  return rows as DatosMarkupDirecto[];
}

// 3. Ranking de Visibilidad
export async function getGraficoRanking(moneda: string = 'ARS', ruta?: string, fuente?: string, aerolinea?: string, tipo_vuelo?: string, region?: string): Promise<DatosRanking[]> {
  const { where, params } = armarFiltrosWhere(moneda, ruta, fuente, aerolinea, tipo_vuelo, region);
  const queryStr = `
    SELECT 
      vendedor,
      ROUND(AVG(posicion_vendedor)::numeric, 2)::float AS ranking_promedio,
      COUNT(*)::int AS total_ofertas
    FROM precios_vuelos
    ${where}
    GROUP BY vendedor ORDER BY ranking_promedio ASC;
  `;
  const rows = (await sql.query(queryStr, params)) as any[];
  return rows as DatosRanking[];
}

// 4. Head to Head Almundo vs Despegar
export async function getGraficoHeadToHead(moneda: string = 'ARS', fuente?: string, aerolinea?: string, tipo_vuelo?: string, region?: string): Promise<DatosHeadToHead[]> {
  const { where, params } = armarFiltrosWhere(moneda, undefined, fuente, aerolinea, tipo_vuelo, region);
  const queryStr = `
    SELECT 
      ruta,
      ROUND(AVG(precio) FILTER (WHERE vendedor = 'Almundo')::numeric, 0)::float AS precio_almundo,
      ROUND(AVG(precio) FILTER (WHERE vendedor = 'Despegar')::numeric, 0)::float AS precio_despegar,
      ROUND(
        (AVG(precio) FILTER (WHERE vendedor = 'Almundo') - AVG(precio) FILTER (WHERE vendedor = 'Despegar'))::numeric, 0
      )::float AS gap_monto_almundo_vs_despegar
    FROM precios_vuelos
    ${where}
    GROUP BY ruta
    HAVING AVG(precio) FILTER (WHERE vendedor = 'Almundo') IS NOT NULL
       AND AVG(precio) FILTER (WHERE vendedor = 'Despegar') IS NOT NULL
    ORDER BY ruta ASC;
  `;
  const rows = (await sql.query(queryStr, params)) as any[];
  return rows as DatosHeadToHead[];
}

// 5. Sensibilidad Día de la Semana de Salida
export async function getGraficoDiaSemana(moneda: string = 'ARS', ruta?: string, fuente?: string, aerolinea?: string, tipo_vuelo?: string, region?: string): Promise<DatosDiaSemana[]> {
  const { where, params } = armarFiltrosWhere(moneda, ruta, fuente, aerolinea, tipo_vuelo, region);
  const queryStr = `
    SELECT 
      dia_semana_ida AS dia_semana_vuelo,
      ROUND(COALESCE(AVG(gap_vs_min_pct) FILTER (WHERE vendedor = 'Almundo')::numeric * 100, 0), 1)::float AS almundo,
      ROUND(COALESCE(AVG(gap_vs_min_pct) FILTER (WHERE vendedor = 'Despegar')::numeric * 100, 0), 1)::float AS despegar,
      ROUND(COALESCE(AVG(gap_vs_min_pct) FILTER (WHERE vendedor = 'Atrápalo')::numeric * 100, 0), 1)::float AS atrapalo,
      ROUND(COALESCE(AVG(gap_vs_min_pct) FILTER (WHERE tipo_vendedor = 'AEROLINEA')::numeric * 100, 0), 1)::float AS canal_directo,
      CASE dia_semana_ida
        WHEN 'Lunes' THEN 1 WHEN 'Martes' THEN 2 WHEN 'Miércoles' THEN 3
        WHEN 'Jueves' THEN 4 WHEN 'Viernes' THEN 5 WHEN 'Sábado' THEN 6 WHEN 'Domingo' THEN 7
      END AS orden
    FROM precios_vuelos
    ${where}
    GROUP BY dia_semana_ida, orden ORDER BY orden ASC;
  `;
  const rows = (await sql.query(queryStr, params)) as any[];
  return rows as DatosDiaSemana[];
}

// 6. Histograma de Brechas
export async function getGraficoDistribucionGap(moneda: string = 'ARS', ruta?: string, fuente?: string, aerolinea?: string, tipo_vuelo?: string, region?: string): Promise<DatosDistribucionGap[]> {
  const { where, params } = armarFiltrosWhere(moneda, ruta, fuente, aerolinea, tipo_vuelo, region);
  const queryStr = `
    SELECT 
      CASE 
        WHEN gap_vs_min_pct <= 0 THEN '0% (Win)'
        WHEN gap_vs_min_pct <= 0.03 THEN '0.1% a 3%'
        WHEN gap_vs_min_pct <= 0.07 THEN '3.1% a 7%'
        WHEN gap_vs_min_pct <= 0.15 THEN '7.1% a 15%'
        ELSE '> 15%'
      END AS rango_gap,
      COUNT(*)::int AS cantidad_vuelos,
      ROUND((COUNT(*)::decimal / SUM(COUNT(*)) OVER ()) * 100, 1)::float AS share_pct,
      CASE 
        WHEN gap_vs_min_pct <= 0 THEN 1 WHEN gap_vs_min_pct <= 0.03 THEN 2
        WHEN gap_vs_min_pct <= 0.07 THEN 3 WHEN gap_vs_min_pct <= 0.15 THEN 4 ELSE 5
      END AS orden
    FROM precios_vuelos
    ${where} AND vendedor = 'Almundo'
    GROUP BY 1, 4 ORDER BY orden ASC;
  `;
  const rows = (await sql.query(queryStr, params)) as any[];
  return rows as DatosDistribucionGap[];
}

// 7. Share de Victorias por Ruta (con TurismoCity y Canal Directo)
export async function getGraficoShareGanadoresRuta(moneda: string = 'ARS', fuente?: string, aerolinea?: string, tipo_vuelo?: string, region?: string): Promise<DatosShareGanadoresRuta[]> {
  const { where, params } = armarFiltrosWhere(moneda, undefined, fuente, aerolinea, tipo_vuelo, region);
  const queryStr = `
    SELECT 
      ruta,
      ROUND(COALESCE(COUNT(*) FILTER (WHERE vendedor = 'Almundo' AND es_mejor_precio = 'SI')::decimal / NULLIF(COUNT(*) FILTER (WHERE es_mejor_precio = 'SI'), 0) * 100, 0), 1)::float AS almundo_pct,
      ROUND(COALESCE(COUNT(*) FILTER (WHERE vendedor = 'Despegar' AND es_mejor_precio = 'SI')::decimal / NULLIF(COUNT(*) FILTER (WHERE es_mejor_precio = 'SI'), 0) * 100, 0), 1)::float AS despegar_pct,
      ROUND(COALESCE(COUNT(*) FILTER (WHERE vendedor = 'Atrápalo' AND es_mejor_precio = 'SI')::decimal / NULLIF(COUNT(*) FILTER (WHERE es_mejor_precio = 'SI'), 0) * 100, 0), 1)::float AS atrapalo_pct,
      ROUND(COALESCE(COUNT(*) FILTER (WHERE vendedor = 'TurismoCity' AND es_mejor_precio = 'SI')::decimal / NULLIF(COUNT(*) FILTER (WHERE es_mejor_precio = 'SI'), 0) * 100, 0), 1)::float AS turismocity_pct,
      ROUND(COALESCE(COUNT(*) FILTER (WHERE tipo_vendedor = 'AEROLINEA' AND es_mejor_precio = 'SI')::decimal / NULLIF(COUNT(*) FILTER (WHERE es_mejor_precio = 'SI'), 0) * 100, 0), 1)::float AS directo_pct
    FROM precios_vuelos
    ${where}
    GROUP BY ruta ORDER BY ruta ASC;
  `;
  const rows = (await sql.query(queryStr, params)) as any[];
  return rows as DatosShareGanadoresRuta[];
}

// 8. Paridad de Canales
export async function getGraficoParidadCanales(moneda: string = 'ARS', ruta?: string, aerolinea?: string, tipo_vuelo?: string, region?: string): Promise<DatosParidadCanales[]> {
  const { where, params } = armarFiltrosWhere(moneda, ruta, undefined, aerolinea, tipo_vuelo, region);
  const queryStr = `
    SELECT 
      vendedor,
      ROUND(AVG(precio) FILTER (WHERE fuente = 'TurismoCity')::numeric, 0)::float AS turismocity,
      ROUND(AVG(precio) FILTER (WHERE fuente = 'Kayak')::numeric, 0)::float AS kayak,
      ROUND(
        COALESCE(
          (AVG(precio) FILTER (WHERE fuente = 'TurismoCity') - AVG(precio) FILTER (WHERE fuente = 'Kayak')) / 
          NULLIF(AVG(precio) FILTER (WHERE fuente = 'Kayak'), 0) * 100, 0
        )::numeric, 1
      )::float AS disparidad_pct
    FROM precios_vuelos
    ${where} AND (vendedor IN ('Almundo', 'Despegar', 'Atrápalo', 'TurismoCity') OR tipo_vendedor = 'AEROLINEA')
    GROUP BY vendedor
    HAVING AVG(precio) FILTER (WHERE fuente = 'TurismoCity') IS NOT NULL
       OR AVG(precio) FILTER (WHERE fuente = 'Kayak') IS NOT NULL
    ORDER BY vendedor ASC;
  `;
  const rows = (await sql.query(queryStr, params)) as any[];
  return rows as DatosParidadCanales[];
}

// 9. Histórico de Scraping (Multicompetidor)
export async function getGraficoHistoricoScraping(moneda: string = 'ARS', ruta?: string, fuente?: string, aerolinea?: string, tipo_vuelo?: string, region?: string): Promise<DatosHistoricoScraping[]> {
  const { where, params } = armarFiltrosWhere(moneda, ruta, fuente, aerolinea, tipo_vuelo, region);
  const queryStr = `
    SELECT 
      TO_CHAR(fecha_obtencion, 'DD/MM') AS fecha_obtencion,
      ROUND((COUNT(*) FILTER (WHERE vendedor = 'Almundo' AND es_mejor_precio = 'SI')::decimal / NULLIF(COUNT(*) FILTER (WHERE vendedor = 'Almundo'), 0)) * 100, 1)::float AS win_rate_almundo,
      ROUND(COALESCE(AVG(gap_vs_min_pct) FILTER (WHERE vendedor = 'Almundo')::numeric * 100, 0), 1)::float AS gap_promedio_almundo,
      ROUND(COALESCE(AVG(gap_vs_min_pct) FILTER (WHERE vendedor = 'Despegar')::numeric * 100, 0), 1)::float AS gap_promedio_despegar,
      ROUND(COALESCE(AVG(gap_vs_min_pct) FILTER (WHERE vendedor = 'Atrápalo')::numeric * 100, 0), 1)::float AS gap_promedio_atrapalo,
      ROUND(COALESCE(AVG(gap_vs_min_pct) FILTER (WHERE vendedor = 'TurismoCity')::numeric * 100, 0), 1)::float AS gap_promedio_turismocity,
      ROUND(COALESCE(AVG(gap_vs_min_pct) FILTER (WHERE tipo_vendedor = 'AEROLINEA')::numeric * 100, 0), 1)::float AS gap_promedio_directo
    FROM precios_vuelos
    ${where}
    GROUP BY fecha_obtencion ORDER BY fecha_obtencion ASC;
  `;
  const rows = (await sql.query(queryStr, params)) as any[];
  return rows as DatosHistoricoScraping[];
}