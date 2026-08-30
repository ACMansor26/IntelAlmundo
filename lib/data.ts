// lib/data.ts
import { sql } from './db';

// --- Interfaces de Datos ---
export interface ResumenKPIs {
  total_cotizaciones: number;
  total_vuelos_unicos: number;
  ultima_actualizacion: string;
  win_rate_almundo_pct: number;
  gap_promedio_almundo_pct: number;
  mejor_precio_promedio: number;
}

export interface FilaItinerarioAlmundo {
  id_itinerario: string;
  fecha_vuelo: string;
  dia_semana_vuelo: string;
  dias_anticipacion: number;
  ruta: string;
  aerolinea: string;
  equipaje_incluido: string;
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
  accion_playbook: string;
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
}

export interface DatosEquipaje {
  equipaje_incluido: string;
  almundo: number;
  despegar: number;
  atrapalo: number;
  canal_directo: number;
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
}

// --- Listados de Filtros ---

export async function getRutasDisponibles(moneda: string = 'ARS'): Promise<string[]> {
  const rows = await sql`
    SELECT DISTINCT ruta 
    FROM precios_vuelos 
    WHERE moneda = ${moneda} 
    ORDER BY ruta ASC;
  `;
  return rows.map((r: any) => r.ruta);
}

export async function getFuentesDisponibles(moneda: string = 'ARS'): Promise<string[]> {
  const rows = await sql`
    SELECT DISTINCT fuente 
    FROM precios_vuelos 
    WHERE moneda = ${moneda} 
    ORDER BY fuente ASC;
  `;
  return rows.map((r: any) => r.fuente);
}

export async function getResumenKPIs(moneda: string = 'ARS', ruta?: string, fuente?: string): Promise<ResumenKPIs> {
  let queryStr = `
    SELECT 
      COUNT(*)::int AS total_cotizaciones,
      COUNT(DISTINCT id_itinerario)::int AS total_vuelos_unicos,
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
    WHERE moneda = $1
  `;
  const params: any[] = [moneda];

  if (ruta && ruta !== 'TODAS') {
    params.push(ruta);
    queryStr += ` AND ruta = $${params.length}`;
  }
  if (fuente && fuente !== 'TODAS') {
    params.push(fuente);
    queryStr += ` AND fuente = $${params.length}`;
  }
  queryStr += `;`;

  const rows = (await sql.query(queryStr, params)) as any[];
  return rows[0] as ResumenKPIs;
}

// --- NUEVA MATRIZ OPERATIVA DE ITINERARIOS CENTRADA EN ALMUNDO ---
export async function getTablaItinerariosAlmundo(
  moneda: string = 'ARS',
  ruta?: string,
  equipaje?: string,
  fuente?: string,
  segmento?: string
): Promise<FilaItinerarioAlmundo[]> {
  let queryStr = `
    WITH vuelos_agrupados AS (
      SELECT 
        id_itinerario,
        TO_CHAR(fecha_vuelo, 'YYYY-MM-DD') AS fecha_vuelo,
        dia_semana_vuelo,
        dias_anticipacion,
        ruta,
        aerolinea,
        equipaje_incluido,
        fuente,
        moneda,
        MIN(precio) AS mejor_precio_mercado,
        (ARRAY_AGG(vendedor ORDER BY precio ASC))[1] AS vendedor_ganador,
        MIN(precio) FILTER (WHERE vendedor = 'Almundo') AS precio_almundo,
        MIN(precio) FILTER (WHERE vendedor = 'Despegar') AS precio_despegar,
        MIN(posicion_vendedor) FILTER (WHERE vendedor = 'Almundo') AS posicion_almundo
      FROM precios_vuelos
      WHERE moneda = $1
  `;
  const params: any[] = [moneda];

  if (ruta && ruta !== 'TODAS') {
    params.push(ruta);
    queryStr += ` AND ruta = $${params.length}`;
  }
  if (equipaje && equipaje !== 'TODOS') {
    params.push(equipaje);
    queryStr += ` AND equipaje_incluido = $${params.length}`;
  }
  if (fuente && fuente !== 'TODAS') {
    params.push(fuente);
    queryStr += ` AND fuente = $${params.length}`;
  }

  queryStr += `
      GROUP BY id_itinerario, fecha_vuelo, dia_semana_vuelo, dias_anticipacion, ruta, aerolinea, equipaje_incluido, fuente, moneda
    )
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

  // Filtro por Quick Segments de Performance Marketing
  if (segmento === 'WINS') {
    queryStr += ` AND precio_almundo IS NOT NULL AND precio_almundo <= mejor_precio_mercado`;
  } else if (segmento === 'OPORTUNIDADES') {
    queryStr += ` AND precio_almundo IS NOT NULL AND ((precio_almundo - mejor_precio_mercado)::decimal / mejor_precio_mercado) > 0 AND ((precio_almundo - mejor_precio_mercado)::decimal / mejor_precio_mercado) <= 0.03`;
  } else if (segmento === 'VS_DESPEGAR') {
    queryStr += ` AND precio_almundo IS NOT NULL AND precio_despegar IS NOT NULL AND precio_almundo < precio_despegar`;
  } else if (segmento === 'DESALINEADOS') {
    queryStr += ` AND precio_almundo IS NOT NULL AND ((precio_almundo - mejor_precio_mercado)::decimal / mejor_precio_mercado) > 0.07`;
  }

  queryStr += ` ORDER BY fecha_vuelo ASC, gap_min_pct ASC NULLS LAST LIMIT 250;`;

  const rows = (await sql.query(queryStr, params)) as any[];

  return rows.map((r: any) => {
    let estado: FilaItinerarioAlmundo['estado_almundo'] = 'SIN_OFERTA';
    let playbook = 'Revisar Conexión de Feed / Inventario';

    if (r.precio_almundo !== null) {
      const pct = r.gap_min_pct ?? 0;
      if (pct <= 0) {
        estado = 'WIN';
        playbook = '🚀 Escalar Pauta / Bid Top Metas';
      } else if (pct <= 3.0) {
        estado = 'OPORTUNIDAD';
        playbook = '🎯 Activar Cupón / Match Tarifa';
      } else if (pct <= 7.0) {
        estado = 'MODERADO';
        playbook = '💳 Empujar Financiación / Cuotas';
      } else {
        estado = 'DESALINEADO';
        playbook = '⏸️ Bajar Pujas / Pausar KW';
      }
    }

    return {
      ...r,
      estado_almundo: estado,
      accion_playbook: playbook
    };
  });
}

// (Se mantienen las funciones de gráficos sin cambios)
export async function getGraficoAP(moneda: string = 'ARS', ruta?: string, fuente?: string): Promise<DatosGraficoAP[]> {
  let queryStr = `
    SELECT 
      dias_anticipacion,
      ROUND(COALESCE(AVG(gap_vs_min_pct) FILTER (WHERE vendedor = 'Almundo')::numeric * 100, 0), 1)::float AS almundo,
      ROUND(COALESCE(AVG(gap_vs_min_pct) FILTER (WHERE vendedor = 'Despegar')::numeric * 100, 0), 1)::float AS despegar,
      ROUND(COALESCE(AVG(gap_vs_min_pct) FILTER (WHERE vendedor = 'Atrápalo')::numeric * 100, 0), 1)::float AS atrapalo,
      ROUND(COALESCE(AVG(gap_vs_min_pct) FILTER (WHERE vendedor IN ('Aerolíneas Argentinas', 'JetSmart', 'LATAM'))::numeric * 100, 0), 1)::float AS canal_directo
    FROM precios_vuelos
    WHERE moneda = $1
  `;
  const params: any[] = [moneda];
  if (ruta && ruta !== 'TODAS') { params.push(ruta); queryStr += ` AND ruta = $${params.length}`; }
  if (fuente && fuente !== 'TODAS') { params.push(fuente); queryStr += ` AND fuente = $${params.length}`; }
  queryStr += ` GROUP BY dias_anticipacion ORDER BY dias_anticipacion ASC;`;
  const rows = (await sql.query(queryStr, params)) as any[];
  return rows as DatosGraficoAP[];
}

export async function getGraficoMarkupDirecto(moneda: string = 'ARS', ruta?: string, fuente?: string): Promise<DatosMarkupDirecto[]> {
  let queryStr = `
    SELECT 
      aerolinea,
      ROUND(COALESCE(AVG(markup_vs_directo_pct) FILTER (WHERE vendedor = 'Almundo')::numeric * 100, 0), 1)::float AS almundo,
      ROUND(COALESCE(AVG(markup_vs_directo_pct) FILTER (WHERE vendedor = 'Despegar')::numeric * 100, 0), 1)::float AS despegar,
      ROUND(COALESCE(AVG(markup_vs_directo_pct) FILTER (WHERE vendedor = 'Atrápalo')::numeric * 100, 0), 1)::float AS atrapalo
    FROM precios_vuelos
    WHERE moneda = $1 AND precio_canal_directo IS NOT NULL
  `;
  const params: any[] = [moneda];
  if (ruta && ruta !== 'TODAS') { params.push(ruta); queryStr += ` AND ruta = $${params.length}`; }
  if (fuente && fuente !== 'TODAS') { params.push(fuente); queryStr += ` AND fuente = $${params.length}`; }
  queryStr += ` GROUP BY aerolinea HAVING COUNT(*) FILTER (WHERE vendedor IN ('Almundo', 'Despegar', 'Atrápalo')) > 0 ORDER BY aerolinea ASC;`;
  const rows = (await sql.query(queryStr, params)) as any[];
  return rows as DatosMarkupDirecto[];
}

export async function getGraficoEquipaje(moneda: string = 'ARS', ruta?: string, fuente?: string): Promise<DatosEquipaje[]> {
  let queryStr = `
    SELECT 
      equipaje_incluido,
      ROUND(COALESCE(AVG(gap_vs_min_pct) FILTER (WHERE vendedor = 'Almundo')::numeric * 100, 0), 1)::float AS almundo,
      ROUND(COALESCE(AVG(gap_vs_min_pct) FILTER (WHERE vendedor = 'Despegar')::numeric * 100, 0), 1)::float AS despegar,
      ROUND(COALESCE(AVG(gap_vs_min_pct) FILTER (WHERE vendedor = 'Atrápalo')::numeric * 100, 0), 1)::float AS atrapalo,
      ROUND(COALESCE(AVG(gap_vs_min_pct) FILTER (WHERE vendedor IN ('Aerolíneas Argentinas', 'JetSmart', 'LATAM'))::numeric * 100, 0), 1)::float AS canal_directo
    FROM precios_vuelos
    WHERE moneda = $1
  `;
  const params: any[] = [moneda];
  if (ruta && ruta !== 'TODAS') { params.push(ruta); queryStr += ` AND ruta = $${params.length}`; }
  if (fuente && fuente !== 'TODAS') { params.push(fuente); queryStr += ` AND fuente = $${params.length}`; }
  queryStr += ` GROUP BY equipaje_incluido ORDER BY equipaje_incluido ASC;`;
  const rows = (await sql.query(queryStr, params)) as any[];
  return rows as DatosEquipaje[];
}

export async function getGraficoRanking(moneda: string = 'ARS', ruta?: string, fuente?: string): Promise<DatosRanking[]> {
  let queryStr = `
    SELECT 
      vendedor,
      ROUND(AVG(posicion_vendedor)::numeric, 2)::float AS ranking_promedio,
      COUNT(*)::int AS total_ofertas
    FROM precios_vuelos
    WHERE moneda = $1
  `;
  const params: any[] = [moneda];
  if (ruta && ruta !== 'TODAS') { params.push(ruta); queryStr += ` AND ruta = $${params.length}`; }
  if (fuente && fuente !== 'TODAS') { params.push(fuente); queryStr += ` AND fuente = $${params.length}`; }
  queryStr += ` GROUP BY vendedor ORDER BY ranking_promedio ASC;`;
  const rows = (await sql.query(queryStr, params)) as any[];
  return rows as DatosRanking[];
}

export async function getGraficoHeadToHead(moneda: string = 'ARS', fuente?: string): Promise<DatosHeadToHead[]> {
  let queryStr = `
    SELECT 
      ruta,
      ROUND(AVG(precio) FILTER (WHERE vendedor = 'Almundo')::numeric, 0)::float AS precio_almundo,
      ROUND(AVG(precio) FILTER (WHERE vendedor = 'Despegar')::numeric, 0)::float AS precio_despegar,
      ROUND(
        (AVG(precio) FILTER (WHERE vendedor = 'Almundo') - AVG(precio) FILTER (WHERE vendedor = 'Despegar'))::numeric, 0
      )::float AS gap_monto_almundo_vs_despegar
    FROM precios_vuelos
    WHERE moneda = $1
  `;
  const params: any[] = [moneda];
  if (fuente && fuente !== 'TODAS') { params.push(fuente); queryStr += ` AND fuente = $${params.length}`; }
  queryStr += ` GROUP BY ruta HAVING AVG(precio) FILTER (WHERE vendedor = 'Almundo') IS NOT NULL AND AVG(precio) FILTER (WHERE vendedor = 'Despegar') IS NOT NULL ORDER BY ruta ASC;`;
  const rows = (await sql.query(queryStr, params)) as any[];
  return rows as DatosHeadToHead[];
}

export async function getGraficoDiaSemana(moneda: string = 'ARS', ruta?: string, fuente?: string): Promise<DatosDiaSemana[]> {
  let queryStr = `
    SELECT 
      dia_semana_vuelo,
      ROUND(COALESCE(AVG(gap_vs_min_pct) FILTER (WHERE vendedor = 'Almundo')::numeric * 100, 0), 1)::float AS almundo,
      ROUND(COALESCE(AVG(gap_vs_min_pct) FILTER (WHERE vendedor = 'Despegar')::numeric * 100, 0), 1)::float AS despegar,
      ROUND(COALESCE(AVG(gap_vs_min_pct) FILTER (WHERE vendedor = 'Atrápalo')::numeric * 100, 0), 1)::float AS atrapalo,
      ROUND(COALESCE(AVG(gap_vs_min_pct) FILTER (WHERE vendedor IN ('Aerolíneas Argentinas', 'JetSmart', 'LATAM'))::numeric * 100, 0), 1)::float AS canal_directo,
      CASE dia_semana_vuelo
        WHEN 'Lunes' THEN 1 WHEN 'Martes' THEN 2 WHEN 'Miércoles' THEN 3
        WHEN 'Jueves' THEN 4 WHEN 'Viernes' THEN 5 WHEN 'Sábado' THEN 6 WHEN 'Domingo' THEN 7
      END AS orden
    FROM precios_vuelos
    WHERE moneda = $1
  `;
  const params: any[] = [moneda];
  if (ruta && ruta !== 'TODAS') { params.push(ruta); queryStr += ` AND ruta = $${params.length}`; }
  if (fuente && fuente !== 'TODAS') { params.push(fuente); queryStr += ` AND fuente = $${params.length}`; }
  queryStr += ` GROUP BY dia_semana_vuelo, orden ORDER BY orden ASC;`;
  const rows = (await sql.query(queryStr, params)) as any[];
  return rows as DatosDiaSemana[];
}

export async function getGraficoDistribucionGap(moneda: string = 'ARS', ruta?: string, fuente?: string): Promise<DatosDistribucionGap[]> {
  let queryStr = `
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
    WHERE moneda = $1 AND vendedor = 'Almundo'
  `;
  const params: any[] = [moneda];
  if (ruta && ruta !== 'TODAS') { params.push(ruta); queryStr += ` AND ruta = $${params.length}`; }
  if (fuente && fuente !== 'TODAS') { params.push(fuente); queryStr += ` AND fuente = $${params.length}`; }
  queryStr += ` GROUP BY 1, 4 ORDER BY orden ASC;`;
  const rows = (await sql.query(queryStr, params)) as any[];
  return rows as DatosDistribucionGap[];
}

export async function getGraficoShareGanadoresRuta(moneda: string = 'ARS', fuente?: string): Promise<DatosShareGanadoresRuta[]> {
  let queryStr = `
    SELECT 
      ruta,
      ROUND(COALESCE(COUNT(*) FILTER (WHERE vendedor = 'Almundo' AND es_mejor_precio = 'SI')::decimal / NULLIF(COUNT(*) FILTER (WHERE es_mejor_precio = 'SI'), 0) * 100, 0), 1)::float AS almundo_pct,
      ROUND(COALESCE(COUNT(*) FILTER (WHERE vendedor = 'Despegar' AND es_mejor_precio = 'SI')::decimal / NULLIF(COUNT(*) FILTER (WHERE es_mejor_precio = 'SI'), 0) * 100, 0), 1)::float AS despegar_pct,
      ROUND(COALESCE(COUNT(*) FILTER (WHERE vendedor = 'Atrápalo' AND es_mejor_precio = 'SI')::decimal / NULLIF(COUNT(*) FILTER (WHERE es_mejor_precio = 'SI'), 0) * 100, 0), 1)::float AS atrapalo_pct,
      ROUND(COALESCE(COUNT(*) FILTER (WHERE vendedor IN ('Aerolíneas Argentinas', 'JetSmart', 'LATAM') AND es_mejor_precio = 'SI')::decimal / NULLIF(COUNT(*) FILTER (WHERE es_mejor_precio = 'SI'), 0) * 100, 0), 1)::float AS directo_pct
    FROM precios_vuelos
    WHERE moneda = $1
  `;
  const params: any[] = [moneda];
  if (fuente && fuente !== 'TODAS') { params.push(fuente); queryStr += ` AND fuente = $${params.length}`; }
  queryStr += ` GROUP BY ruta ORDER BY ruta ASC;`;
  const rows = (await sql.query(queryStr, params)) as any[];
  return rows as DatosShareGanadoresRuta[];
}

export async function getGraficoParidadCanales(moneda: string = 'ARS', ruta?: string): Promise<DatosParidadCanales[]> {
  let queryStr = `
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
    WHERE moneda = $1 AND vendedor IN ('Almundo', 'Despegar', 'Atrápalo', 'JetSmart', 'Aerolíneas Argentinas')
  `;
  const params: any[] = [moneda];
  if (ruta && ruta !== 'TODAS') { params.push(ruta); queryStr += ` AND ruta = $2`; }
  queryStr += ` GROUP BY vendedor HAVING AVG(precio) FILTER (WHERE fuente = 'TurismoCity') IS NOT NULL OR AVG(precio) FILTER (WHERE fuente = 'Kayak') IS NOT NULL ORDER BY vendedor ASC;`;
  const rows = (await sql.query(queryStr, params)) as any[];
  return rows as DatosParidadCanales[];
}

export async function getGraficoHistoricoScraping(moneda: string = 'ARS', ruta?: string, fuente?: string): Promise<DatosHistoricoScraping[]> {
  let queryStr = `
    SELECT 
      TO_CHAR(fecha_obtencion, 'DD/MM') AS fecha_obtencion,
      ROUND(
        (COUNT(*) FILTER (WHERE vendedor = 'Almundo' AND es_mejor_precio = 'SI')::decimal / 
        NULLIF(COUNT(*) FILTER (WHERE vendedor = 'Almundo'), 0)) * 100, 1
      )::float AS win_rate_almundo,
      ROUND(
        COALESCE(AVG(gap_vs_min_pct) FILTER (WHERE vendedor = 'Almundo')::numeric * 100, 0), 1
      )::float AS gap_promedio_almundo,
      ROUND(
        COALESCE(AVG(gap_vs_min_pct) FILTER (WHERE vendedor = 'Despegar')::numeric * 100, 0), 1
      )::float AS gap_promedio_despegar
    FROM precios_vuelos
    WHERE moneda = $1
  `;
  const params: any[] = [moneda];
  if (ruta && ruta !== 'TODAS') { params.push(ruta); queryStr += ` AND ruta = $${params.length}`; }
  if (fuente && fuente !== 'TODAS') { params.push(fuente); queryStr += ` AND fuente = $${params.length}`; }
  queryStr += ` GROUP BY fecha_obtencion ORDER BY fecha_obtencion ASC;`;
  const rows = (await sql.query(queryStr, params)) as any[];
  return rows as DatosHistoricoScraping[];
}