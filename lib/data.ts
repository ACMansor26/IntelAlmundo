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

export interface FilaVuelo {
  id: number;
  fuente: string;
  ruta: string;
  id_itinerario: string;
  fecha_vuelo: string;
  dias_anticipacion: number;
  dia_semana_vuelo: string;
  aerolinea: string;
  vendedor: string;
  posicion_vendedor: number;
  equipaje_incluido: string;
  moneda: string;
  precio: number;
  minimo_vuelo: number;
  es_mejor_precio: string;
  precio_almundo: number | null;
  gap_vs_almundo_monto: number | null;
  gap_vs_almundo_pct: number | null;
  gap_vs_min_monto: number;
  gap_vs_min_pct: number;
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

// --- Métodos de Extracción Base ---

export async function getResumenKPIs(moneda: string = 'ARS', ruta?: string): Promise<ResumenKPIs> {
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
    queryStr += ` AND ruta = $2`;
  }
  queryStr += `;`;

  const rows = (await sql.query(queryStr, params)) as any[];
  return rows[0] as ResumenKPIs;
}

export async function getRutasDisponibles(moneda: string = 'ARS'): Promise<string[]> {
  const rows = await sql`
    SELECT DISTINCT ruta 
    FROM precios_vuelos 
    WHERE moneda = ${moneda} 
    ORDER BY ruta ASC;
  `;
  return rows.map((r: any) => r.ruta);
}

export async function getTablaPrecios(
  moneda: string = 'ARS',
  ruta?: string,
  equipaje?: string
): Promise<FilaVuelo[]> {
  let queryStr = `
    SELECT 
      id, fuente, ruta, id_itinerario, TO_CHAR(fecha_vuelo, 'YYYY-MM-DD') as fecha_vuelo,
      dias_anticipacion, dia_semana_vuelo, aerolinea, vendedor, posicion_vendedor,
      equipaje_incluido, moneda, precio, minimo_vuelo, es_mejor_precio,
      precio_almundo, gap_vs_almundo_monto, gap_vs_almundo_pct,
      gap_vs_min_monto, gap_vs_min_pct
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

  queryStr += ` ORDER BY fecha_vuelo ASC, precio ASC LIMIT 250;`;
  const rows = (await sql.query(queryStr, params)) as any[];
  return rows as FilaVuelo[];
}

// 1. Curva de Anticipación (AP)
export async function getGraficoAP(moneda: string = 'ARS', ruta?: string): Promise<DatosGraficoAP[]> {
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
  if (ruta && ruta !== 'TODAS') {
    params.push(ruta);
    queryStr += ` AND ruta = $2`;
  }
  queryStr += ` GROUP BY dias_anticipacion ORDER BY dias_anticipacion ASC;`;

  const rows = (await sql.query(queryStr, params)) as any[];
  return rows as DatosGraficoAP[];
}

// 2. Markup vs Canal Directo
export async function getGraficoMarkupDirecto(moneda: string = 'ARS', ruta?: string): Promise<DatosMarkupDirecto[]> {
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
  if (ruta && ruta !== 'TODAS') {
    params.push(ruta);
    queryStr += ` AND ruta = $2`;
  }
  queryStr += `
    GROUP BY aerolinea
    HAVING COUNT(*) FILTER (WHERE vendedor IN ('Almundo', 'Despegar', 'Atrápalo')) > 0
    ORDER BY aerolinea ASC;
  `;

  const rows = (await sql.query(queryStr, params)) as any[];
  return rows as DatosMarkupDirecto[];
}

// 3. Competitividad por Equipaje
export async function getGraficoEquipaje(moneda: string = 'ARS', ruta?: string): Promise<DatosEquipaje[]> {
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
  if (ruta && ruta !== 'TODAS') {
    params.push(ruta);
    queryStr += ` AND ruta = $2`;
  }
  queryStr += ` GROUP BY equipaje_incluido ORDER BY equipaje_incluido ASC;`;

  const rows = (await sql.query(queryStr, params)) as any[];
  return rows as DatosEquipaje[];
}

// 4. Ranking de Visibilidad
export async function getGraficoRanking(moneda: string = 'ARS', ruta?: string): Promise<DatosRanking[]> {
  let queryStr = `
    SELECT 
      vendedor,
      ROUND(AVG(posicion_vendedor)::numeric, 2)::float AS ranking_promedio,
      COUNT(*)::int AS total_ofertas
    FROM precios_vuelos
    WHERE moneda = $1
  `;
  const params: any[] = [moneda];
  if (ruta && ruta !== 'TODAS') {
    params.push(ruta);
    queryStr += ` AND ruta = $2`;
  }
  queryStr += ` GROUP BY vendedor ORDER BY ranking_promedio ASC;`;

  const rows = (await sql.query(queryStr, params)) as any[];
  return rows as DatosRanking[];
}

// 5. Head-to-Head: Almundo vs Despegar
export async function getGraficoHeadToHead(moneda: string = 'ARS'): Promise<DatosHeadToHead[]> {
  const queryStr = `
    SELECT 
      ruta,
      ROUND(AVG(precio) FILTER (WHERE vendedor = 'Almundo')::numeric, 0)::float AS precio_almundo,
      ROUND(AVG(precio) FILTER (WHERE vendedor = 'Despegar')::numeric, 0)::float AS precio_despegar,
      ROUND(
        (AVG(precio) FILTER (WHERE vendedor = 'Almundo') - AVG(precio) FILTER (WHERE vendedor = 'Despegar'))::numeric, 0
      )::float AS gap_monto_almundo_vs_despegar
    FROM precios_vuelos
    WHERE moneda = $1
    GROUP BY ruta
    HAVING AVG(precio) FILTER (WHERE vendedor = 'Almundo') IS NOT NULL
       AND AVG(precio) FILTER (WHERE vendedor = 'Despegar') IS NOT NULL
    ORDER BY ruta ASC;
  `;

  const rows = (await sql.query(queryStr, [moneda])) as any[];
  return rows as DatosHeadToHead[];
}

// 6. Sensibilidad Día de la Semana
export async function getGraficoDiaSemana(moneda: string = 'ARS', ruta?: string): Promise<DatosDiaSemana[]> {
  let queryStr = `
    SELECT 
      dia_semana_vuelo,
      ROUND(COALESCE(AVG(gap_vs_min_pct) FILTER (WHERE vendedor = 'Almundo')::numeric * 100, 0), 1)::float AS almundo,
      ROUND(COALESCE(AVG(gap_vs_min_pct) FILTER (WHERE vendedor = 'Despegar')::numeric * 100, 0), 1)::float AS despegar,
      ROUND(COALESCE(AVG(gap_vs_min_pct) FILTER (WHERE vendedor = 'Atrápalo')::numeric * 100, 0), 1)::float AS atrapalo,
      ROUND(COALESCE(AVG(gap_vs_min_pct) FILTER (WHERE vendedor IN ('Aerolíneas Argentinas', 'JetSmart', 'LATAM'))::numeric * 100, 0), 1)::float AS canal_directo,
      CASE dia_semana_vuelo
        WHEN 'Lunes' THEN 1
        WHEN 'Martes' THEN 2
        WHEN 'Miércoles' THEN 3
        WHEN 'Jueves' THEN 4
        WHEN 'Viernes' THEN 5
        WHEN 'Sábado' THEN 6
        WHEN 'Domingo' THEN 7
      END AS orden
    FROM precios_vuelos
    WHERE moneda = $1
  `;
  const params: any[] = [moneda];
  if (ruta && ruta !== 'TODAS') {
    params.push(ruta);
    queryStr += ` AND ruta = $2`;
  }
  queryStr += ` GROUP BY dia_semana_vuelo, orden ORDER BY orden ASC;`;

  const rows = (await sql.query(queryStr, params)) as any[];
  return rows as DatosDiaSemana[];
}

// 7. NUEVO: Histograma de Oportunidad (Distribución por Rangos de Brecha)
export async function getGraficoDistribucionGap(moneda: string = 'ARS', ruta?: string): Promise<DatosDistribucionGap[]> {
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
        WHEN gap_vs_min_pct <= 0 THEN 1
        WHEN gap_vs_min_pct <= 0.03 THEN 2
        WHEN gap_vs_min_pct <= 0.07 THEN 3
        WHEN gap_vs_min_pct <= 0.15 THEN 4
        ELSE 5
      END AS orden
    FROM precios_vuelos
    WHERE moneda = $1 AND vendedor = 'Almundo'
  `;
  const params: any[] = [moneda];
  if (ruta && ruta !== 'TODAS') {
    params.push(ruta);
    queryStr += ` AND ruta = $2`;
  }
  queryStr += `
    GROUP BY 
      CASE 
        WHEN gap_vs_min_pct <= 0 THEN '0% (Win)'
        WHEN gap_vs_min_pct <= 0.03 THEN '0.1% a 3%'
        WHEN gap_vs_min_pct <= 0.07 THEN '3.1% a 7%'
        WHEN gap_vs_min_pct <= 0.15 THEN '7.1% a 15%'
        ELSE '> 15%'
      END,
      CASE 
        WHEN gap_vs_min_pct <= 0 THEN 1
        WHEN gap_vs_min_pct <= 0.03 THEN 2
        WHEN gap_vs_min_pct <= 0.07 THEN 3
        WHEN gap_vs_min_pct <= 0.15 THEN 4
        ELSE 5
      END
    ORDER BY orden ASC;
  `;

  const rows = (await sql.query(queryStr, params)) as any[];
  return rows as DatosDistribucionGap[];
}

// 8. NUEVO: Cuota de Victorias por Ruta (100% Stacked)
export async function getGraficoShareGanadoresRuta(moneda: string = 'ARS'): Promise<DatosShareGanadoresRuta[]> {
  const queryStr = `
    SELECT 
      ruta,
      ROUND(COALESCE(COUNT(*) FILTER (WHERE vendedor = 'Almundo' AND es_mejor_precio = 'SI')::decimal / NULLIF(COUNT(*) FILTER (WHERE es_mejor_precio = 'SI'), 0) * 100, 0), 1)::float AS almundo_pct,
      ROUND(COALESCE(COUNT(*) FILTER (WHERE vendedor = 'Despegar' AND es_mejor_precio = 'SI')::decimal / NULLIF(COUNT(*) FILTER (WHERE es_mejor_precio = 'SI'), 0) * 100, 0), 1)::float AS despegar_pct,
      ROUND(COALESCE(COUNT(*) FILTER (WHERE vendedor = 'Atrápalo' AND es_mejor_precio = 'SI')::decimal / NULLIF(COUNT(*) FILTER (WHERE es_mejor_precio = 'SI'), 0) * 100, 0), 1)::float AS atrapalo_pct,
      ROUND(COALESCE(COUNT(*) FILTER (WHERE vendedor IN ('Aerolíneas Argentinas', 'JetSmart', 'LATAM') AND es_mejor_precio = 'SI')::decimal / NULLIF(COUNT(*) FILTER (WHERE es_mejor_precio = 'SI'), 0) * 100, 0), 1)::float AS directo_pct
    FROM precios_vuelos
    WHERE moneda = $1
    GROUP BY ruta
    ORDER BY ruta ASC;
  `;

  const rows = (await sql.query(queryStr, [moneda])) as any[];
  return rows as DatosShareGanadoresRuta[];
}

// 9. NUEVO: Paridad de Canales (TurismoCity vs Kayak)
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
  if (ruta && ruta !== 'TODAS') {
    params.push(ruta);
    queryStr += ` AND ruta = $2`;
  }
  queryStr += `
    GROUP BY vendedor
    HAVING AVG(precio) FILTER (WHERE fuente = 'TurismoCity') IS NOT NULL
       OR AVG(precio) FILTER (WHERE fuente = 'Kayak') IS NOT NULL
    ORDER BY vendedor ASC;
  `;

  const rows = (await sql.query(queryStr, params)) as any[];
  return rows as DatosParidadCanales[];
}

// 10. NUEVO: Evolución Histórica de Competitividad por Fecha de Scraping
export async function getGraficoHistoricoScraping(moneda: string = 'ARS', ruta?: string): Promise<DatosHistoricoScraping[]> {
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
  if (ruta && ruta !== 'TODAS') {
    params.push(ruta);
    queryStr += ` AND ruta = $2`;
  }
  queryStr += ` GROUP BY fecha_obtencion ORDER BY fecha_obtencion ASC;`;

  const rows = (await sql.query(queryStr, params)) as any[];
  return rows as DatosHistoricoScraping[];
}