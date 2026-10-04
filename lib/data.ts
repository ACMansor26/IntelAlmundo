// lib/data.ts
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { unstable_cache } from 'next/cache';

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
  // Competidor elegido para las comparaciones 1-a-1 (matriz, H2H, curvas
  // temporales, distribucion de posicion). Default 'Despegar' -- los graficos
  // de panorama completo (cobertura, markup, ranking, correlacion) siguen
  // mostrando TODOS los competidores sin importar este filtro.
  competidor?: string;
  // Corrida de datos a mostrar: 'ULTIMA' (default: la ultima de cada fuente),
  // 'TODAS' (todo el historico) o una fecha 'YYYY-MM-DD'.
  fecha?: string;
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
  fee_promedio_almundo_pct: number | null;
  filas_a_revisar: number;
}

// Desglose real del checkout de un vendedor para un vuelo+fuente (fila de precios_vuelos).
export interface DetalleVendedor {
  vendedor: string;
  tarifa_base: number | null;
  impuestos: number | null;
  tasas: number | null;
  cargo_gestion: number | null;
  pct_fee: number | null;
  precio_sin_fee: number | null;
  precio_total: number | null;
  precio_listado_vendedor: number | null;
  dif_checkout_vs_listado: number | null;
  pct_dif_checkout_vs_listado: number | null;
  a_revisar: boolean;
  es_mas_barato: boolean;
}

export interface ItinerarioAlmundo {
  id_pareja_vuelo: string;
  ruta: string;
  region: string;
  aerolinea: string;
  numero_vuelo_ida: string | null;
  numero_vuelo_vuelta: string | null;
  escalas_ida: number | null;
  escalas_vuelta: number | null;
  equipaje_bodega: string | null;
  equipaje_mochila: string | null;
  equipaje_mano: string | null;
  aerolinea_vuelta: string | null;
  origen: string | null;
  destino: string | null;
  // Aeropuertos reales de cada tramo (pueden diferir de la ruta: ej. ida AEP, vuelta a EZE)
  aeropuerto_salida_ida: string | null;
  aeropuerto_llegada_ida: string | null;
  aeropuerto_salida_vuelta: string | null;
  aeropuerto_llegada_vuelta: string | null;
  hora_llegada_ida: string | null;
  hora_llegada_vuelta: string | null;
  fecha_llegada_ida: string | null;
  fecha_llegada_vuelta: string | null;
  vendedores: DetalleVendedor[];
  fuente: string;
  fecha_ida: string;
  hora_salida_ida: string | null;
  fecha_vuelta: string;
  hora_salida_vuelta: string | null;
  dias_anticipacion: number;
  dias_estadia: number;
  // Precio base de comparacion = precio_sin_fee (el fee es un cargo del
  // vendedor, no del vuelo); precio_total es lo que paga el cliente.
  precio_almundo: number | null;
  precio_total_almundo: number | null;
  fee_almundo_pct: number | null;
  mejor_precio_mercado: number;
  vendedor_ganador: string;
  gap_min_pct: number | null;
  gap_min_monto: number | null;
  spread_competidor_pct: number | null;
  spread_competidor_monto: number | null;
  a_revisar: boolean;
  estado_almundo: 'WIN' | 'OPORTUNIDAD' | 'MODERADO' | 'DESALINEADO' | 'SIN_OFERTA';
}

export interface ResultadoPaginadoItinerarios {
  // Presente solo si la consulta fallo (la matriz lo muestra en vez de "sin resultados").
  error?: string;
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

export interface DatosComposicionPrecio {
  vendedor: string;
  tarifa_base: number;
  impuestos: number;
  tasas: number;
  cargo_gestion: number;
  precio_total: number;
  pct_fee: number;
  muestras: number;
}

export interface DatosDiaSemana {
  dia_semana_vuelo: string;
  almundo: number | null;
  competidor: number | null;
}

export interface DatosFranjaHoraria {
  franja_horaria: string;
  rango_horas: string;
  almundo: number | null;
  competidor: number | null;
}

export interface DatosFeeAerolinea {
  aerolinea: string;
  almundo: number | null;
  despegar: number | null;
  atrapalo: number | null;
}

export interface DatosShareGanadoresRuta {
  ruta: string;
  almundo_pct: number;
  despegar_pct: number;
  atrapalo_pct: number;
  total_vuelos: number;
}

export interface DatosWinFeeRuta {
  ruta: string;
  win_sin_fee_pct: number;
  win_con_fee_pct: number;
  vuelos: number;
}

export interface DatosListadoCheckout {
  etiqueta: string;
  vendedor: string;
  fuente: string;
  filas: number;
  dif_promedio_pct: number | null;
  a_revisar_pct: number;
}

export interface CorridaScraper {
  id: number;
  fuente: string;
  fecha_inicio: string;
  fecha_fin: string;
  duracion_scraping_seg: number | null;
  duracion_db_seg: number | null;
  duracion_total_seg: number | null;
  jobs_totales: number;
  jobs_con_datos: number;
  jobs_con_almundo: number;
  jobs_con_despegar: number;
  ofertas_totales: number;
  ofertas_ars: number;
  ofertas_usd: number;
  filas_insertadas_db: number;
  watchdog_kills_fase1: number;
  watchdog_reencolados_fase1: number;
  watchdog_descartados_fase1: number;
  jobs_segunda_pasada: number;
  jobs_recuperados_segunda_pasada: number;
  watchdog_kills_fase2: number;
  csv_path: string | null;
}

export interface CorridaJobDetalle {
  idx: number;
  ruta: string;
  moneda: string;
  tipo_vuelo: string | null;
  dias_anticipacion: number;
  dias_estadia: number;
  ofertas_count: number;
  tiene_almundo: boolean;
  tiene_despegar: boolean;
  reviso_segunda_pasada: boolean;
  recupero_almundo_segunda_pasada: boolean;
  // Esquema de checkout: un job = ruta x aerolinea
  aerolinea: string | null;
  tiene_atrapalo: boolean;
  vendedores: string[];
}

// ==============================================================================
// 2b. CONSOLIDACION DE AEROLINEA (Top 7 por volumen + "Otras")
// ==============================================================================
// El campo crudo "aerolinea" concatena, para itinerarios con conexion, cada
// tramo separado por " / " (ej. "LATAM / GOL / Avianca"), lo que produce 43
// valores distintos en la DB -- inmanejable como filtro. Se consolida a la
// aerolinea del PRIMER tramo (la que efectivamente opera el despegue), y todo
// lo que no esta en este Top 7 (medido por volumen real: Aerolineas
// Argentinas y JetSmart concentran mas del 70% de las filas) se agrupa en
// 'OTRAS' (Air Canada, Aeromexico, SWISS, Ethiopian Air -- <10 filas c/u).
const AEROLINEAS_PRINCIPALES = [
  'Aerolíneas Argentinas', 'JetSmart', 'LATAM', 'Arajet', 'GOL', 'Avianca', 'SKY Airline'
];

// Fragmento SQL reutilizado en cualquier lugar que filtre o agrupe por
// aerolinea, para que el filtro (BarraFiltros), los conteos por opcion
// (getConteosFiltros) y el grafico de Markup por Aerolinea usen exactamente
// el mismo criterio de consolidacion.
function exprAerolineaPrincipal(): string {
  const lista = AEROLINEAS_PRINCIPALES.map(a => `'${a.replace(/'/g, "''")}'`).join(', ');
  return `(CASE WHEN split_part(aerolinea_ida, ' / ', 1) IN (${lista}) THEN split_part(aerolinea_ida, ' / ', 1) ELSE 'OTRAS' END)`;
}

// ==============================================================================
// 2c. VISTA DE COMPARACION (esquema de checkout)
// ==============================================================================
// precios_vuelos guarda ahora el desglose real del checkout: una fila por
// (id_pareja_vuelo, vendedor, fuente). Ya no vienen precalculados el minimo del
// vuelo ni los gaps, asi que se derivan aca (en SQL, sin tocar la DB):
//  - a_revisar: el checkout cobra distinto de lo listado por el metabuscador
//    (|pct_dif_checkout_vs_listado| > UMBRAL). Esas filas NO entran en
//    promedios ni en el minimo de referencia.
//  - min_sin_fee / min_total: menor precio entre los vendedores leidos para el
//    MISMO vuelo y la MISMA fuente (el mismo id_pareja_vuelo aparece una vez
//    por fuente, mezclarlas compararia lecturas distintas).
//  - gap_min_pct / gap_min_monto: brecha de la fila vs ese minimo, sobre
//    precio_sin_fee (el fee es un cargo del vendedor, no del vuelo).
//  - es_ultima_corrida: la fila pertenece al dia de datos mas reciente de SU
//    fuente (filtro por defecto del dashboard: no mezclar dias distintos).
// Todas las queries leen de esta subquery (alias pv) en vez de la tabla cruda.
const UMBRAL_A_REVISAR_PCT = 5;
const VISTA_PRECIOS = `(
  SELECT v.*,
    (v.precio_sin_fee - v.min_sin_fee) AS gap_min_monto,
    (v.precio_sin_fee - v.min_sin_fee) * 100.0 / NULLIF(v.min_sin_fee, 0) AS gap_min_pct
  FROM (
    SELECT p.*,
      (ABS(COALESCE(p.pct_dif_checkout_vs_listado, 0)) > ${UMBRAL_A_REVISAR_PCT}) AS a_revisar,
      (p.fecha_obtencion::date = MAX(p.fecha_obtencion::date) OVER (PARTITION BY p.fuente)) AS es_ultima_corrida,
      MIN(CASE WHEN ABS(COALESCE(p.pct_dif_checkout_vs_listado, 0)) <= ${UMBRAL_A_REVISAR_PCT} THEN p.precio_sin_fee END)
        OVER (PARTITION BY p.id_pareja_vuelo, p.fuente, p.fecha_obtencion::date) AS min_sin_fee,
      MIN(CASE WHEN ABS(COALESCE(p.pct_dif_checkout_vs_listado, 0)) <= ${UMBRAL_A_REVISAR_PCT} THEN p.precio_total END)
        OVER (PARTITION BY p.id_pareja_vuelo, p.fuente, p.fecha_obtencion::date) AS min_total
    FROM precios_vuelos p
  ) v
) pv`;
// Clave de "vuelo observado": mismo id_pareja_vuelo en distinta fuente = lectura distinta.
const CLAVE_VUELO = `(id_pareja_vuelo || '|' || fuente)`;

// ==============================================================================
// 3. HELPER DE FILTROS SQL
// ==============================================================================
const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/;

// Agrega al WHERE el corte por corrida segun f.fecha (ver FiltrosDashboard).
function clausulaFecha(f: FiltrosDashboard, whereClauses: string[], params: any[]) {
  const fecha = f.fecha || 'ULTIMA';
  if (fecha === 'TODAS') return;
  if (RE_FECHA.test(fecha)) {
    params.push(fecha);
    whereClauses.push(`fecha_obtencion::date = $${params.length}::date`);
    return;
  }
  whereClauses.push('es_ultima_corrida');
}

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
    whereClauses.push(`${exprAerolineaPrincipal()} = $${params.length}`);
  }
  if (f.tipo_vuelo && f.tipo_vuelo !== 'TODOS') {
    params.push(f.tipo_vuelo);
    whereClauses.push(`tipo_vuelo = $${params.length}`);
  }
  if (f.region && f.region !== 'TODAS') {
    params.push(f.region);
    whereClauses.push(`region = ${params.length}`);
  }
  clausulaFecha(f, whereClauses, params);

  return { whereSql: whereClauses.join(' AND '), params, filtros: f };
}

// Helper para el grafico de Gap ARS vs USD por ruta bimonetaria: necesita
// TODOS los filtros salvo moneda (si no, el filtro de moneda de la pagina
// -que siempre es ARS o USD, nunca "ambas"- haria imposible comparar las
// dos monedas en el mismo grafico).
function construirWhereSinMoneda(f: FiltrosDashboard): { whereSql: string; params: any[] } {
  const whereClauses: string[] = ['1=1'];
  const params: any[] = [];

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
    whereClauses.push(`${exprAerolineaPrincipal()} = $${params.length}`);
  }
  if (f.tipo_vuelo && f.tipo_vuelo !== 'TODOS') {
    params.push(f.tipo_vuelo);
    whereClauses.push(`tipo_vuelo = $${params.length}`);
  }
  if (f.region && f.region !== 'TODAS') {
    params.push(f.region);
    whereClauses.push(`region = $${params.length}`);
  }

  return { whereSql: whereClauses.join(' AND '), params };
}

// ==============================================================================
// 3b. ALLOWLIST DE SEGMENTOS (fix #1)
// ==============================================================================
const SEGMENTOS_VALIDOS = ['TODOS', 'OPORTUNIDADES', 'VS_DESPEGAR', 'DESALINEADOS', 'A_REVISAR'] as const;
type SegmentoValido = typeof SEGMENTOS_VALIDOS[number];

function normalizarSegmento(candidato: string | undefined): SegmentoValido {
  return (SEGMENTOS_VALIDOS as readonly string[]).includes(candidato ?? '')
    ? (candidato as SegmentoValido)
    : 'TODOS';
}

// ==============================================================================
// 4. KPIS EJECUTIVOS
// ==============================================================================
async function getResumenKPIs_sinCache(
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
    // Unidad de analisis = (id_pareja_vuelo, fuente). Todo sobre precio_sin_fee
    // y sin filas "a revisar" (checkout distinto del listado).
    const q = await client.query(
      `
      WITH grupos AS (
        SELECT id_pareja_vuelo, fuente, MIN(precio_sin_fee) AS mejor_precio
        FROM ${VISTA_PRECIOS}
        WHERE ${whereSql} AND NOT a_revisar
        GROUP BY id_pareja_vuelo, fuente
      ),
      almundo_best AS (
        SELECT DISTINCT ON (id_pareja_vuelo, fuente)
          id_pareja_vuelo, fuente, precio_sin_fee AS precio_almundo, pct_fee
        FROM ${VISTA_PRECIOS}
        WHERE ${whereSql} AND vendedor = 'Almundo' AND NOT a_revisar
        ORDER BY id_pareja_vuelo, fuente, precio_sin_fee ASC
      ),
      despegar_ids AS (
        SELECT DISTINCT id_pareja_vuelo, fuente
        FROM ${VISTA_PRECIOS}
        WHERE ${whereSql} AND vendedor = 'Despegar' AND NOT a_revisar
      ),
      revisar AS (
        SELECT COUNT(*) AS n FROM ${VISTA_PRECIOS} WHERE ${whereSql} AND a_revisar
      )
      SELECT
        COUNT(*) AS total_vuelos_unicos,
        COUNT(a.precio_almundo) AS vuelos_con_almundo,
        COUNT(d.id_pareja_vuelo) AS vuelos_con_despegar,
        COUNT(CASE WHEN a.precio_almundo IS NOT NULL AND a.precio_almundo <= g.mejor_precio THEN 1 END) AS victorias_almundo,
        ROUND(AVG(CASE WHEN a.precio_almundo IS NOT NULL AND g.mejor_precio > 0
                  THEN ((a.precio_almundo - g.mejor_precio) / g.mejor_precio) * 100 END), 1) AS gap_promedio_almundo_pct,
        ROUND(AVG(g.mejor_precio)) AS mejor_precio_promedio,
        ROUND(AVG(a.pct_fee), 1) AS fee_promedio_almundo_pct,
        (SELECT n FROM revisar) AS filas_a_revisar
      FROM grupos g
      LEFT JOIN almundo_best a ON g.id_pareja_vuelo = a.id_pareja_vuelo AND g.fuente = a.fuente
      LEFT JOIN despegar_ids d ON g.id_pareja_vuelo = d.id_pareja_vuelo AND g.fuente = d.fuente;
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
      mejor_precio_promedio: r.mejor_precio_promedio !== null && r.mejor_precio_promedio !== undefined ? Number(r.mejor_precio_promedio) : null,
      fee_promedio_almundo_pct: r.fee_promedio_almundo_pct !== null && r.fee_promedio_almundo_pct !== undefined ? Number(r.fee_promedio_almundo_pct) : null,
      filas_a_revisar: Number(r.filas_a_revisar || 0)
    };
  } finally {
    client.release();
  }
}

// ==============================================================================
// 5. TABLA PAGINADA DE ITINERARIOS
// ==============================================================================
async function getTablaItinerariosAlmundo_sinCache(
  monedaOrFiltros: string | FiltrosDashboard = 'ARS',
  ruta: string = 'TODAS',
  fuente: string = 'TODAS',
  aerolinea: string = 'TODAS',
  tipo_vuelo: string = 'TODOS',
  region: string = 'TODAS',
  segmento: string = 'TODOS',
  pagina: number = 1,
  tamanoPagina: number = 50,
  competidor: string = 'Despegar'
): Promise<ResultadoPaginadoItinerarios> {
  const { whereSql, params, filtros } = normalizarFiltros(monedaOrFiltros, ruta, fuente, aerolinea, tipo_vuelo, region);

  // Competidor elegido para "vs {competidor}": viaja como parametro bindeado
  // ($N) en vez de interpolado, igual que el resto de los valores dinamicos.
  const competidorFinal = filtros.competidor || competidor;
  params.push(competidorFinal);
  const competidorIdx = params.length;

  // Fix #1: allowlist + parametro real en vez de interpolar el string en el SQL.
  const seg = normalizarSegmento(filtros.segmento || segmento);
  params.push(seg);
  const segParamIdx = params.length;

  const limit = Math.max(1, tamanoPagina);
  const offset = (Math.max(1, pagina) - 1) * limit;

  const client = await pool.connect();

  try {
    // Una fila por (id_pareja_vuelo, fuente). Los datos descriptivos del vuelo
    // (horarios, numero de vuelo, equipaje) son los mismos para todos los
    // vendedores del grupo, por eso se agregan con MAX en vez de agrupar por
    // ellos (si un vendedor trajera un dato distinto partiria la fila).
    // Comparacion sobre precio_sin_fee y sin filas "a revisar" (checkout !=
    // listado); la fila de Almundo se marca aparte (a_revisar) para el tab.
    const q = await client.query(
      `
      WITH base_vuelos AS (
        SELECT
          id_pareja_vuelo,
          fuente,
          MAX(ruta) AS ruta,
          MAX(region) AS region,
          MAX(aerolinea_ida) AS aerolinea,
          MAX(numero_vuelo_ida) AS numero_vuelo_ida,
          MAX(numero_vuelo_vuelta) AS numero_vuelo_vuelta,
          MAX(escalas_ida) AS escalas_ida,
          MAX(escalas_vuelta) AS escalas_vuelta,
          MAX(equipaje_bodega) AS equipaje_bodega,
          MAX(equipaje_mochila) AS equipaje_mochila,
          MAX(equipaje_mano) AS equipaje_mano,
          MAX(aerolinea_vuelta) AS aerolinea_vuelta,
          MAX(aeropuerto_salida_ida) AS aeropuerto_salida_ida,
          MAX(aeropuerto_llegada_ida) AS aeropuerto_llegada_ida,
          MAX(aeropuerto_salida_vuelta) AS aeropuerto_salida_vuelta,
          MAX(aeropuerto_llegada_vuelta) AS aeropuerto_llegada_vuelta,
          MAX(origen) AS origen,
          MAX(destino) AS destino,
          MAX(hora_llegada_ida) AS hora_llegada_ida,
          MAX(hora_llegada_vuelta) AS hora_llegada_vuelta,
          TO_CHAR(MAX(fecha_llegada_ida), 'YYYY-MM-DD') AS fecha_llegada_ida,
          TO_CHAR(MAX(fecha_llegada_vuelta), 'YYYY-MM-DD') AS fecha_llegada_vuelta,
          TO_CHAR(MAX(fecha_ida), 'YYYY-MM-DD') AS fecha_ida,
          MAX(hora_salida_ida) AS hora_salida_ida,
          TO_CHAR(MAX(fecha_vuelta), 'YYYY-MM-DD') AS fecha_vuelta,
          MAX(hora_salida_vuelta) AS hora_salida_vuelta,
          MAX(dias_anticipacion) AS dias_anticipacion,
          MAX(dias_estadia) AS dias_estadia,
          COALESCE(MIN(precio_sin_fee) FILTER (WHERE NOT a_revisar), MIN(precio_sin_fee)) AS mejor_precio_mercado
        FROM ${VISTA_PRECIOS}
        WHERE ${whereSql}
        GROUP BY id_pareja_vuelo, fuente
      ),
      almundo_best AS (
        SELECT DISTINCT ON (id_pareja_vuelo, fuente)
          id_pareja_vuelo,
          fuente,
          precio_sin_fee AS precio_almundo,
          precio_total AS precio_total_almundo,
          pct_fee AS fee_almundo_pct,
          a_revisar AS almundo_a_revisar
        FROM ${VISTA_PRECIOS}
        WHERE ${whereSql} AND vendedor = 'Almundo'
        ORDER BY id_pareja_vuelo, fuente, precio_sin_fee ASC
      ),
      competidor_best AS (
        SELECT DISTINCT ON (id_pareja_vuelo, fuente)
          id_pareja_vuelo,
          fuente,
          precio_sin_fee AS precio_competidor
        FROM ${VISTA_PRECIOS}
        WHERE ${whereSql} AND vendedor = $${competidorIdx}::text AND NOT a_revisar
        ORDER BY id_pareja_vuelo, fuente, precio_sin_fee ASC
      ),
      ganadores AS (
        SELECT DISTINCT ON (id_pareja_vuelo, fuente)
          id_pareja_vuelo,
          fuente,
          vendedor AS vendedor_ganador
        FROM ${VISTA_PRECIOS}
        WHERE ${whereSql} AND NOT a_revisar
        ORDER BY id_pareja_vuelo, fuente, precio_sin_fee ASC
      ),
      metricas AS (
        SELECT
          b.*,
          a.precio_almundo,
          a.precio_total_almundo,
          a.fee_almundo_pct,
          COALESCE(a.almundo_a_revisar, FALSE) AS a_revisar,
          comp.precio_competidor,
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
            WHEN a.precio_almundo IS NOT NULL AND comp.precio_competidor IS NOT NULL
              THEN (a.precio_almundo - comp.precio_competidor)
            ELSE NULL
          END AS spread_competidor_monto,
          CASE
            WHEN a.precio_almundo IS NOT NULL AND comp.precio_competidor IS NOT NULL AND comp.precio_competidor > 0
              THEN ROUND(((a.precio_almundo - comp.precio_competidor) / comp.precio_competidor) * 100, 1)
            ELSE NULL
          END AS spread_competidor_pct,
          CASE
            WHEN a.precio_almundo IS NULL THEN 'SIN_OFERTA'
            WHEN b.mejor_precio_mercado <= 0 THEN 'SIN_OFERTA'
            WHEN (a.precio_almundo - b.mejor_precio_mercado) <= 0 THEN 'WIN'
            WHEN ((a.precio_almundo - b.mejor_precio_mercado) / b.mejor_precio_mercado) <= 0.03 THEN 'OPORTUNIDAD'
            WHEN ((a.precio_almundo - b.mejor_precio_mercado) / b.mejor_precio_mercado) <= 0.07 THEN 'MODERADO'
            ELSE 'DESALINEADO'
          END AS estado_almundo
        FROM base_vuelos b
        LEFT JOIN almundo_best a ON b.id_pareja_vuelo = a.id_pareja_vuelo AND b.fuente = a.fuente
        LEFT JOIN competidor_best comp ON b.id_pareja_vuelo = comp.id_pareja_vuelo AND b.fuente = comp.fuente
        LEFT JOIN ganadores g ON b.id_pareja_vuelo = g.id_pareja_vuelo AND b.fuente = g.fuente
      ),
      filtrados AS (
        SELECT *, COUNT(*) OVER() AS total_count
        FROM metricas
        WHERE
          CASE
            WHEN $${segParamIdx}::text = 'OPORTUNIDADES' THEN estado_almundo = 'OPORTUNIDAD'
            WHEN $${segParamIdx}::text = 'VS_DESPEGAR' THEN spread_competidor_monto < 0
            WHEN $${segParamIdx}::text = 'DESALINEADOS' THEN estado_almundo = 'DESALINEADO'
            WHEN $${segParamIdx}::text = 'A_REVISAR' THEN a_revisar
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
    const num = (v: any) => (v !== null && v !== undefined ? Number(v) : null);

    // Desglose por vendedor de los vuelos de ESTA pagina (una sola query extra).
    const detallePorClave = new Map<string, DetalleVendedor[]>();
    if (q.rows.length > 0) {
      const ids = q.rows.map(r => r.id_pareja_vuelo);
      const fuentes = q.rows.map(r => r.fuente);
      const dq = await client.query(
        `
        SELECT id_pareja_vuelo, fuente, vendedor, tarifa_base, impuestos, tasas, cargo_gestion,
               pct_fee, precio_sin_fee, precio_total, precio_listado_vendedor,
               dif_checkout_vs_listado, pct_dif_checkout_vs_listado, a_revisar, min_sin_fee
        FROM ${VISTA_PRECIOS}
        WHERE (id_pareja_vuelo, fuente) IN (SELECT unnest($1::text[]), unnest($2::text[]))
        ORDER BY CASE vendedor WHEN 'Almundo' THEN 1 WHEN 'Despegar' THEN 2 WHEN 'Atrápalo' THEN 3 ELSE 4 END, vendedor
        `,
        [ids, fuentes]
      );
      for (const d of dq.rows) {
        const clave = `${d.id_pareja_vuelo}|${d.fuente}`;
        const lista = detallePorClave.get(clave) ?? [];
        lista.push({
          vendedor: d.vendedor,
          tarifa_base: num(d.tarifa_base),
          impuestos: num(d.impuestos),
          tasas: num(d.tasas),
          cargo_gestion: num(d.cargo_gestion),
          pct_fee: num(d.pct_fee),
          precio_sin_fee: num(d.precio_sin_fee),
          precio_total: num(d.precio_total),
          precio_listado_vendedor: num(d.precio_listado_vendedor),
          dif_checkout_vs_listado: num(d.dif_checkout_vs_listado),
          pct_dif_checkout_vs_listado: num(d.pct_dif_checkout_vs_listado),
          a_revisar: Boolean(d.a_revisar),
          es_mas_barato: !d.a_revisar && d.min_sin_fee !== null && Number(d.precio_sin_fee) <= Number(d.min_sin_fee)
        });
        detallePorClave.set(clave, lista);
      }
    }

    const itinerarios: ItinerarioAlmundo[] = q.rows.map(r => ({
      id_pareja_vuelo: r.id_pareja_vuelo,
      ruta: r.ruta,
      region: r.region,
      aerolinea: r.aerolinea,
      numero_vuelo_ida: r.numero_vuelo_ida || null,
      numero_vuelo_vuelta: r.numero_vuelo_vuelta || null,
      escalas_ida: num(r.escalas_ida),
      escalas_vuelta: num(r.escalas_vuelta),
      equipaje_bodega: r.equipaje_bodega || null,
      equipaje_mochila: r.equipaje_mochila || null,
      equipaje_mano: r.equipaje_mano || null,
      aerolinea_vuelta: r.aerolinea_vuelta || null,
      aeropuerto_salida_ida: r.aeropuerto_salida_ida || null,
      aeropuerto_llegada_ida: r.aeropuerto_llegada_ida || null,
      aeropuerto_salida_vuelta: r.aeropuerto_salida_vuelta || null,
      aeropuerto_llegada_vuelta: r.aeropuerto_llegada_vuelta || null,
      origen: r.origen || null,
      destino: r.destino || null,
      hora_llegada_ida: r.hora_llegada_ida || null,
      hora_llegada_vuelta: r.hora_llegada_vuelta || null,
      fecha_llegada_ida: r.fecha_llegada_ida || null,
      fecha_llegada_vuelta: r.fecha_llegada_vuelta || null,
      vendedores: detallePorClave.get(`${r.id_pareja_vuelo}|${r.fuente}`) ?? [],
      fuente: r.fuente,
      fecha_ida: r.fecha_ida,
      hora_salida_ida: r.hora_salida_ida || null,
      fecha_vuelta: r.fecha_vuelta,
      hora_salida_vuelta: r.hora_salida_vuelta || null,
      dias_anticipacion: Number(r.dias_anticipacion),
      dias_estadia: Number(r.dias_estadia),
      precio_almundo: num(r.precio_almundo),
      precio_total_almundo: num(r.precio_total_almundo),
      fee_almundo_pct: num(r.fee_almundo_pct),
      mejor_precio_mercado: Number(r.mejor_precio_mercado),
      vendedor_ganador: r.vendedor_ganador,
      gap_min_pct: num(r.gap_min_pct),
      gap_min_monto: num(r.gap_min_monto),
      spread_competidor_pct: num(r.spread_competidor_pct),
      spread_competidor_monto: num(r.spread_competidor_monto),
      a_revisar: Boolean(r.a_revisar),
      estado_almundo: r.estado_almundo as ItinerarioAlmundo['estado_almundo']
    }));

    return {
      itinerarios,
      totalRegistros,
      totalPaginas,
      paginaActual: pagina,
      tamanoPagina: limit
    };
  } finally {
    client.release();
  }
}

// ==============================================================================
// 5b. CONTEOS POR SEGMENTO (para los tabs de la matriz -- mismo criterio que
// el filtro de segmento en getTablaItinerariosAlmundo, pero sin paginar; se
// consulta una vez por carga de pagina para mostrar "N vuelos" en cada tab).
// ==============================================================================
export interface ConteosSegmento {
  total: number;
  oportunidades: number;
  vs_competidor: number;
  desalineados: number;
  a_revisar: number;
}

async function getConteosSegmento_sinCache(
  monedaOrFiltros: string | FiltrosDashboard = 'ARS',
  ruta: string = 'TODAS',
  fuente: string = 'TODAS',
  aerolinea: string = 'TODAS',
  tipo_vuelo: string = 'TODOS',
  region: string = 'TODAS',
  competidor: string = 'Despegar'
): Promise<ConteosSegmento> {
  const { whereSql, params, filtros } = normalizarFiltros(monedaOrFiltros, ruta, fuente, aerolinea, tipo_vuelo, region);
  const competidorFinal = filtros.competidor || competidor;
  params.push(competidorFinal);
  const competidorIdx = params.length;
  const client = await pool.connect();

  try {
    // Misma logica de estado_almundo/spread_competidor que getTablaItinerariosAlmundo,
    // pero solo agregada a conteos (sin traer filas ni paginar).
    const q = await client.query(
      `
      WITH base_vuelos AS (
        SELECT id_pareja_vuelo, fuente,
          COALESCE(MIN(precio_sin_fee) FILTER (WHERE NOT a_revisar), MIN(precio_sin_fee)) AS mejor_precio_mercado
        FROM ${VISTA_PRECIOS}
        WHERE ${whereSql}
        GROUP BY id_pareja_vuelo, fuente
      ),
      almundo_best AS (
        SELECT DISTINCT ON (id_pareja_vuelo, fuente)
          id_pareja_vuelo, fuente, precio_sin_fee AS precio_almundo, a_revisar AS almundo_a_revisar
        FROM ${VISTA_PRECIOS}
        WHERE ${whereSql} AND vendedor = 'Almundo'
        ORDER BY id_pareja_vuelo, fuente, precio_sin_fee ASC
      ),
      competidor_best AS (
        SELECT DISTINCT ON (id_pareja_vuelo, fuente) id_pareja_vuelo, fuente, precio_sin_fee AS precio_competidor
        FROM ${VISTA_PRECIOS}
        WHERE ${whereSql} AND vendedor = $${competidorIdx}::text AND NOT a_revisar
        ORDER BY id_pareja_vuelo, fuente, precio_sin_fee ASC
      ),
      metricas AS (
        SELECT
          b.id_pareja_vuelo,
          COALESCE(a.almundo_a_revisar, FALSE) AS a_revisar,
          CASE
            WHEN a.precio_almundo IS NULL THEN 'SIN_OFERTA'
            WHEN b.mejor_precio_mercado <= 0 THEN 'SIN_OFERTA'
            WHEN (a.precio_almundo - b.mejor_precio_mercado) <= 0 THEN 'WIN'
            WHEN ((a.precio_almundo - b.mejor_precio_mercado) / b.mejor_precio_mercado) <= 0.03 THEN 'OPORTUNIDAD'
            WHEN ((a.precio_almundo - b.mejor_precio_mercado) / b.mejor_precio_mercado) <= 0.07 THEN 'MODERADO'
            ELSE 'DESALINEADO'
          END AS estado_almundo,
          CASE
            WHEN a.precio_almundo IS NOT NULL AND comp.precio_competidor IS NOT NULL
              THEN (a.precio_almundo - comp.precio_competidor)
            ELSE NULL
          END AS spread_competidor_monto
        FROM base_vuelos b
        LEFT JOIN almundo_best a ON b.id_pareja_vuelo = a.id_pareja_vuelo AND b.fuente = a.fuente
        LEFT JOIN competidor_best comp ON b.id_pareja_vuelo = comp.id_pareja_vuelo AND b.fuente = comp.fuente
      )
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE estado_almundo = 'OPORTUNIDAD') AS oportunidades,
        COUNT(*) FILTER (WHERE spread_competidor_monto < 0) AS vs_competidor,
        COUNT(*) FILTER (WHERE estado_almundo = 'DESALINEADO') AS desalineados,
        COUNT(*) FILTER (WHERE a_revisar) AS a_revisar
      FROM metricas;
      `,
      params
    );

    const r = q.rows[0] || {};
    return {
      total: Number(r.total || 0),
      oportunidades: Number(r.oportunidades || 0),
      vs_competidor: Number(r.vs_competidor || 0),
      desalineados: Number(r.desalineados || 0),
      a_revisar: Number(r.a_revisar || 0)
    };
  } finally {
    client.release();
  }
}

// ==============================================================================
// 5c. CONTEOS POR OPCION DE FILTRO (para mostrar "AEP-COR (18)" en los
// selects de BarraFiltros). Cada dimension se cuenta EXCLUYENDO su propio
// filtro actual (pero respetando los demas) -- patron de busqueda facetada
// estandar: si ya elegiste una ruta, el conteo de "Aerolinea" sigue
// reflejando esa ruta, pero el conteo de "Ruta" no se auto-filtra por si
// mismo (si no, la ruta elegida mostraria un numero artificialmente parcial).
// ==============================================================================
export interface ConteosFiltros {
  porRuta: Record<string, number>;
  porRegion: Record<string, number>;
  porAerolinea: Record<string, number>;
  porFuente: Record<string, number>;
}

async function getConteosFiltros_sinCache(filtros: FiltrosDashboard): Promise<ConteosFiltros> {
  const client = await pool.connect();

  async function conteoPorCampo(
    campo: 'ruta' | 'region' | 'aerolinea' | 'fuente',
    excluirCampo: 'ruta' | 'region' | 'aerolinea' | 'fuente'
  ): Promise<Record<string, number>> {
    const filtrosSinCampo: FiltrosDashboard = { ...filtros, [excluirCampo]: undefined };
    const { whereSql, params } = normalizarFiltros(filtrosSinCampo);
    // La aerolinea cruda trae combos de conexion (43 valores distintos) -- se
    // agrupa por el mismo criterio de "aerolinea principal" que usa el filtro
    // real (exprAerolineaPrincipal), asi el conteo que ve el usuario en el
    // select coincide con las opciones consolidadas (Top 7 + "Otras").
    const selectExpr = campo === 'aerolinea' ? exprAerolineaPrincipal() : campo;
    try {
      const q = await client.query(
        `SELECT ${selectExpr} AS ${campo}, COUNT(DISTINCT id_pareja_vuelo) AS cantidad
         FROM ${VISTA_PRECIOS} WHERE ${whereSql} GROUP BY 1;`,
        params
      );
      const mapa: Record<string, number> = {};
      for (const row of q.rows) mapa[row[campo]] = Number(row.cantidad);
      return mapa;
    } catch (err) {
      console.error(`Error en getConteosFiltros (${campo}):`, err);
      return {};
    }
  }

  try {
    // Secuencial (no Promise.all) -- un mismo client de pg procesa una
    // consulta a la vez; encolarlas en paralelo sobre el mismo client no
    // suma velocidad y complica el manejo de errores por consulta.
    const porRuta = await conteoPorCampo('ruta', 'ruta');
    const porRegion = await conteoPorCampo('region', 'region');
    const porAerolinea = await conteoPorCampo('aerolinea', 'aerolinea');
    const porFuente = await conteoPorCampo('fuente', 'fuente');
    return { porRuta, porRegion, porAerolinea, porFuente };
  } finally {
    client.release();
  }
}

// ==============================================================================
// 6. MOTOR DE CONSULTAS PARA LOS 9 GRAFICOS ESTRATEGICOS
// ==============================================================================
async function obtenerDatosDashboard_sinCache(filtros: FiltrosDashboard) {
  const { whereSql, params } = normalizarFiltros(filtros);

  // Competidor elegido para las comparaciones 1-a-1 (H2H y perfil temporal).
  // IMPORTANTE: no se pushea a "params" -- Postgres rechaza una query si se le
  // pasan MAS parametros bindeados de los que su texto referencia ("bind
  // message supplies N parameters, but prepared statement requires M"), asi
  // que las queries que NO usan competidor deben seguir recibiendo el
  // "params" original. "paramsConCompetidor" es un array aparte, solo para las
  // queries que si lo referencian ($competidorIdx).
  const competidorFinal = filtros.competidor || 'Despegar';
  const paramsConCompetidor = [...params, competidorFinal];
  const competidorIdx = paramsConCompetidor.length;

  const V = VISTA_PRECIOS;
  const K = CLAVE_VUELO;
  const num = (v: any) => (v !== null && v !== undefined ? Number(v) : null);

  try {
    // Las consultas se lanzan todas juntas (cada una con su propia conexion del
    // pool) y se esperan en paralelo, en vez de una detras de otra.
    // 1. Histograma de Gap % de Almundo vs la mejor tarifa (precio_sin_fee) del mismo
    // vuelo y fuente. Excluye filas "a revisar".
    const qGap = pool.query(
      `
      WITH almundo_gaps AS (
        SELECT gap_min_pct AS gap_pct
        FROM ${V}
        WHERE ${whereSql}
          AND vendedor = 'Almundo'
          AND NOT a_revisar
          AND gap_min_pct IS NOT NULL
      ),
      rangos AS (
        SELECT
          CASE
            WHEN gap_pct <= 0 THEN '0% (Win)'
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

    // 2. Win Rate & Gap Promedio por Region (win = Almundo tiene el menor precio_sin_fee
    // del grupo vuelo+fuente).
    const qRegion = pool.query(
      `
      SELECT
        region,
        COUNT(DISTINCT ${K}) AS total_vuelos,
        ROUND(COUNT(DISTINCT CASE WHEN vendedor = 'Almundo' AND NOT a_revisar AND precio_sin_fee <= min_sin_fee THEN ${K} END) * 100.0 /
              NULLIF(COUNT(DISTINCT CASE WHEN vendedor = 'Almundo' AND NOT a_revisar THEN ${K} END), 0), 1) AS win_rate_almundo_pct,
        ROUND(AVG(CASE WHEN vendedor = 'Almundo' AND NOT a_revisar THEN gap_min_pct END), 1) AS gap_promedio_almundo
      FROM ${V}
      WHERE ${whereSql} AND region IS NOT NULL AND region != ''
      GROUP BY region
      ORDER BY total_vuelos DESC;
      `,
      params
    );

    // 3. Almundo vs Competidor elegido: Spread Head-to-Head Relativo (%) sobre precio_sin_fee
    const qH2H = pool.query(
      `
      WITH pares AS (
        SELECT
          ruta,
          MIN(CASE WHEN vendedor = 'Almundo' THEN precio_sin_fee END) AS precio_almundo,
          MIN(CASE WHEN vendedor = $${competidorIdx}::text THEN precio_sin_fee END) AS precio_competidor
        FROM ${V}
        WHERE ${whereSql} AND vendedor IN ('Almundo', $${competidorIdx}::text) AND NOT a_revisar
        GROUP BY ruta, id_pareja_vuelo, fuente
        HAVING COUNT(DISTINCT vendedor) = 2
      )
      SELECT
        ruta,
        COUNT(*) AS vuelos_comparados,
        ROUND(AVG(((precio_almundo - precio_competidor) * 100.0 / NULLIF(precio_competidor, 0))), 1) AS spread_promedio_pct,
        ROUND(AVG(precio_almundo - precio_competidor)) AS spread_promedio_monto
      FROM pares
      GROUP BY ruta
      ORDER BY vuelos_comparados DESC
      LIMIT 12;
      `,
      paramsConCompetidor
    );

    // 4. Composicion del precio por vendedor (tarifa base + impuestos + tasas + fee).
    // Solo sobre vuelos leidos por Almundo Y Despegar en la misma fuente, para que el
    // promedio compare lo mismo (si no, el mix de rutas distorsiona).
    const qComposicion = pool.query(
      `
      WITH comparables AS (
        SELECT id_pareja_vuelo, fuente
        FROM ${V}
        WHERE ${whereSql} AND vendedor IN ('Almundo', 'Despegar') AND NOT a_revisar
        GROUP BY id_pareja_vuelo, fuente
        HAVING COUNT(DISTINCT vendedor) = 2
      )
      SELECT
        vendedor,
        ROUND(AVG(tarifa_base)) AS tarifa_base,
        ROUND(AVG(impuestos)) AS impuestos,
        ROUND(AVG(tasas)) AS tasas,
        ROUND(AVG(cargo_gestion)) AS cargo_gestion,
        ROUND(AVG(precio_total)) AS precio_total,
        ROUND(AVG(pct_fee), 1) AS pct_fee,
        COUNT(*) AS muestras
      FROM ${V}
      WHERE ${whereSql} AND NOT a_revisar
        AND (id_pareja_vuelo, fuente) IN (SELECT id_pareja_vuelo, fuente FROM comparables)
      GROUP BY vendedor
      ORDER BY CASE vendedor WHEN 'Almundo' THEN 1 WHEN 'Despegar' THEN 2 ELSE 3 END, vendedor;
      `,
      params
    );

    // 5a. Perfil temporal: dia de salida (se deriva de fecha_ida; dia_semana_ida ya no existe).
    const qDiaSemana = pool.query(
      `
      WITH orden_dias AS (
        SELECT unnest(ARRAY['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']) AS dia,
               generate_series(1, 7) AS nro_dia
      )
      SELECT
        od.dia AS dia_semana_vuelo,
        ROUND(AVG(CASE WHEN pv.vendedor = 'Almundo' THEN pv.gap_min_pct END), 1) AS almundo,
        ROUND(AVG(CASE WHEN pv.vendedor = $${competidorIdx}::text THEN pv.gap_min_pct END), 1) AS competidor
      FROM orden_dias od
      LEFT JOIN ${V}
        ON od.nro_dia = EXTRACT(ISODOW FROM pv.fecha_ida)::int
        AND NOT pv.a_revisar
        AND ${whereSql}
      GROUP BY od.dia, od.nro_dia
      ORDER BY od.nro_dia ASC;
      `,
      paramsConCompetidor
    );

    // 5b. Perfil temporal: franja horaria de salida (hora_salida_ida sigue existiendo).
    const qFranjaHoraria = pool.query(
      `
      WITH franja_bucket AS (
        SELECT
          CASE
            WHEN hora_salida_ida::time >= '00:00' AND hora_salida_ida::time < '06:00' THEN 'Madrugada'
            WHEN hora_salida_ida::time >= '06:00' AND hora_salida_ida::time < '12:00' THEN 'Mañana'
            WHEN hora_salida_ida::time >= '12:00' AND hora_salida_ida::time < '18:00' THEN 'Tarde'
            ELSE 'Noche'
          END AS franja_horaria,
          CASE
            WHEN hora_salida_ida::time >= '00:00' AND hora_salida_ida::time < '06:00' THEN '00-06h'
            WHEN hora_salida_ida::time >= '06:00' AND hora_salida_ida::time < '12:00' THEN '06-12h'
            WHEN hora_salida_ida::time >= '12:00' AND hora_salida_ida::time < '18:00' THEN '12-18h'
            ELSE '18-24h'
          END AS rango_horas,
          CASE
            WHEN hora_salida_ida::time >= '00:00' AND hora_salida_ida::time < '06:00' THEN 1
            WHEN hora_salida_ida::time >= '06:00' AND hora_salida_ida::time < '12:00' THEN 2
            WHEN hora_salida_ida::time >= '12:00' AND hora_salida_ida::time < '18:00' THEN 3
            ELSE 4
          END AS orden_franja,
          vendedor,
          gap_min_pct
        FROM ${V}
        WHERE ${whereSql} AND hora_salida_ida IS NOT NULL AND NOT a_revisar
      )
      SELECT
        franja_horaria,
        rango_horas,
        ROUND(AVG(CASE WHEN vendedor = 'Almundo' THEN gap_min_pct END), 1) AS almundo,
        ROUND(AVG(CASE WHEN vendedor = $${competidorIdx}::text THEN gap_min_pct END), 1) AS competidor
      FROM franja_bucket
      GROUP BY franja_horaria, rango_horas, orden_franja
      ORDER BY orden_franja ASC;
      `,
      paramsConCompetidor
    );

    // 6. Fee (% sobre precio_sin_fee) por aerolinea y vendedor
    const qFee = pool.query(
      `
      SELECT
        ${exprAerolineaPrincipal()} AS aerolinea,
        ROUND(AVG(CASE WHEN vendedor = 'Almundo' THEN pct_fee END), 1) AS almundo,
        ROUND(AVG(CASE WHEN vendedor = 'Despegar' THEN pct_fee END), 1) AS despegar,
        ROUND(AVG(CASE WHEN vendedor = 'Atrápalo' THEN pct_fee END), 1) AS atrapalo
      FROM ${V}
      WHERE ${whereSql} AND NOT a_revisar AND pct_fee IS NOT NULL
      GROUP BY 1
      ORDER BY 1 ASC;
      `,
      params
    );

    // 7. Cobertura por ruta: % de vuelos observados (vuelo+fuente) donde cada vendedor
    // pudo leerse en el checkout. Un vendedor ausente NO significa que no venda el vuelo
    // (a veces la fuente lo bloquea).
    const qSOV = pool.query(
      `
      SELECT
        ruta,
        COUNT(DISTINCT ${K}) AS total_vuelos,
        ROUND(COUNT(DISTINCT CASE WHEN vendedor = 'Almundo' THEN ${K} END) * 100.0 / NULLIF(COUNT(DISTINCT ${K}), 0), 1) AS almundo_pct,
        ROUND(COUNT(DISTINCT CASE WHEN vendedor = 'Despegar' THEN ${K} END) * 100.0 / NULLIF(COUNT(DISTINCT ${K}), 0), 1) AS despegar_pct,
        ROUND(COUNT(DISTINCT CASE WHEN vendedor = 'Atrápalo' THEN ${K} END) * 100.0 / NULLIF(COUNT(DISTINCT ${K}), 0), 1) AS atrapalo_pct
      FROM ${V}
      WHERE ${whereSql}
      GROUP BY ruta
      ORDER BY total_vuelos DESC
      LIMIT 6;
      `,
      params
    );

    // 8. Win rate de Almundo por ruta: sin fee (precio_sin_fee) vs con fee (precio_total).
    // La diferencia es cuanto cuesta el fee en vuelos ganados.
    const qWinFee = pool.query(
      `
      SELECT
        ruta,
        COUNT(DISTINCT CASE WHEN vendedor = 'Almundo' THEN ${K} END) AS vuelos,
        ROUND(COUNT(DISTINCT CASE WHEN vendedor = 'Almundo' AND precio_sin_fee <= min_sin_fee THEN ${K} END) * 100.0 /
              NULLIF(COUNT(DISTINCT CASE WHEN vendedor = 'Almundo' THEN ${K} END), 0), 1) AS win_sin_fee_pct,
        ROUND(COUNT(DISTINCT CASE WHEN vendedor = 'Almundo' AND precio_total <= min_total THEN ${K} END) * 100.0 /
              NULLIF(COUNT(DISTINCT CASE WHEN vendedor = 'Almundo' THEN ${K} END), 0), 1) AS win_con_fee_pct
      FROM ${V}
      WHERE ${whereSql} AND NOT a_revisar
      GROUP BY ruta
      HAVING COUNT(DISTINCT CASE WHEN vendedor = 'Almundo' THEN ${K} END) > 0
      ORDER BY vuelos DESC
      LIMIT 8;
      `,
      params
    );

    // 9. Diferencia checkout vs listado por vendedor y fuente: el promedio excluye filas
    // "a revisar" (se cuentan aparte como % de filas).
    const qListado = pool.query(
      `
      SELECT
        vendedor,
        fuente,
        COUNT(*) AS filas,
        ROUND(AVG(CASE WHEN NOT a_revisar THEN pct_dif_checkout_vs_listado END), 2) AS dif_promedio_pct,
        ROUND(COUNT(*) FILTER (WHERE a_revisar) * 100.0 / NULLIF(COUNT(*), 0), 1) AS a_revisar_pct
      FROM ${V}
      WHERE ${whereSql}
      GROUP BY vendedor, fuente
      ORDER BY vendedor ASC, fuente ASC;
      `,
      params
    );

    const R = await Promise.all([qGap, qRegion, qH2H, qComposicion, qDiaSemana, qFranjaHoraria, qFee, qSOV, qWinFee, qListado]);

    return {
      datosDistribucionGap: R[0].rows.map(r => ({
        rango_gap: r.rango_gap,
        cantidad_vuelos: Number(r.cantidad_vuelos),
        share_pct: Number(r.share_pct || 0)
      })) as DatosDistribucionGap[],
      datosRegionCompetitividad: R[1].rows.map(r => ({
        region: r.region,
        total_vuelos: Number(r.total_vuelos),
        win_rate_almundo_pct: Number(r.win_rate_almundo_pct || 0),
        gap_promedio_almundo: num(r.gap_promedio_almundo)
      })) as DatosRegionCompetitividad[],
      datosHeadToHeadRelativo: R[2].rows.map(r => ({
        ruta: r.ruta,
        vuelos_comparados: Number(r.vuelos_comparados),
        spread_promedio_pct: Number(r.spread_promedio_pct || 0),
        spread_promedio_monto: Number(r.spread_promedio_monto || 0)
      })) as DatosHeadToHeadRelativo[],
      datosComposicion: R[3].rows.map(r => ({
        vendedor: r.vendedor,
        tarifa_base: Number(r.tarifa_base || 0),
        impuestos: Number(r.impuestos || 0),
        tasas: Number(r.tasas || 0),
        cargo_gestion: Number(r.cargo_gestion || 0),
        precio_total: Number(r.precio_total || 0),
        pct_fee: Number(r.pct_fee || 0),
        muestras: Number(r.muestras || 0)
      })) as DatosComposicionPrecio[],
      datosDiaSemana: R[4].rows.map(r => ({
        dia_semana_vuelo: r.dia_semana_vuelo,
        almundo: num(r.almundo),
        competidor: num(r.competidor)
      })) as DatosDiaSemana[],
      datosFranjaHoraria: R[5].rows.map(r => ({
        franja_horaria: r.franja_horaria,
        rango_horas: r.rango_horas,
        almundo: num(r.almundo),
        competidor: num(r.competidor)
      })) as DatosFranjaHoraria[],
      datosFee: R[6].rows.map(r => ({
        aerolinea: r.aerolinea,
        almundo: num(r.almundo),
        despegar: num(r.despegar),
        atrapalo: num(r.atrapalo)
      })) as DatosFeeAerolinea[],
      datosShareGanadoresRuta: R[7].rows.map(r => ({
        ruta: r.ruta,
        total_vuelos: Number(r.total_vuelos),
        almundo_pct: Number(r.almundo_pct || 0),
        despegar_pct: Number(r.despegar_pct || 0),
        atrapalo_pct: Number(r.atrapalo_pct || 0)
      })) as DatosShareGanadoresRuta[],
      datosWinFee: R[8].rows.map(r => ({
        ruta: r.ruta,
        vuelos: Number(r.vuelos),
        win_sin_fee_pct: Number(r.win_sin_fee_pct || 0),
        win_con_fee_pct: Number(r.win_con_fee_pct || 0)
      })) as DatosWinFeeRuta[],
      datosListadoCheckout: R[9].rows.map(r => ({
        etiqueta: `${r.vendedor} · ${r.fuente}`,
        vendedor: r.vendedor,
        fuente: r.fuente,
        filas: Number(r.filas),
        dif_promedio_pct: num(r.dif_promedio_pct),
        a_revisar_pct: Number(r.a_revisar_pct || 0)
      })) as DatosListadoCheckout[]
    };
  } catch (err) {
    // Si una consulta falla, se esperan igual las demas para no dejar promesas sin atender.
    throw err;
  }
}

// ==============================================================================
// 7. FUNCIONES DE SELECTORES DINAMICOS
// ==============================================================================
const FUENTES_FALLBACK = ['TurismoCity', 'Kayak', 'Skyscanner'];
const AEROLINEAS_FALLBACK = [...AEROLINEAS_PRINCIPALES, 'OTRAS'];
const RUTAS_FALLBACK = [
  'AEP-COR', 'AEP-MDZ', 'AEP-BRC', 'AEP-SLA', 'AEP-IGR', 'AEP-TUC', 'COR-MDZ',
  'AEP-SCL', 'AEP-RIO', 'AEP-GRU', 'EZE-MIA', 'EZE-MAD', 'EZE-CUN', 'EZE-PUJ'
];
const REGIONES_FALLBACK = [
  'BUENOS AIRES', 'CENTRO', 'CUYO', 'NOA', 'LITORAL',
  'PATAGONIA', 'CHILE', 'BRASIL', 'CARIBE', 'EEUU', 'EUROPA'
];
const TIPOS_VUELO_FALLBACK = ['INTERNACIONAL', 'DOMESTICO'];
const COMPETIDORES_FALLBACK = ['Despegar', 'Atrápalo'];

// Vendedores utilizables como "competidor" en el filtro de comparacion 1-a-1:
// excluye a Almundo (el vendedor propio) y al canal directo (tipo_vendedor
// AEROLINEA), que se trata aparte en todos los graficos.
async function getCompetidoresDisponibles_raw(moneda?: string): Promise<string[]> {
  try {
    const whereClauses = [`vendedor != 'Almundo'`, `tipo_vendedor != 'AEROLINEA'`];
    const params: any[] = [];
    if (moneda && moneda !== 'TODAS') {
      params.push(moneda);
      whereClauses.push(`moneda = $${params.length}`);
    }
    const res = await pool.query(
      `SELECT DISTINCT vendedor FROM precios_vuelos WHERE ${whereClauses.join(' AND ')} ORDER BY vendedor ASC;`,
      params
    );
    return res.rows.length > 0 ? res.rows.map(r => r.vendedor) : COMPETIDORES_FALLBACK;
  } catch {
    return COMPETIDORES_FALLBACK;
  }
}

async function getFuentesDisponibles_raw(moneda?: string): Promise<string[]> {
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

async function getAerolineasDisponibles_raw(moneda?: string): Promise<string[]> {
  try {
    const clause = moneda && moneda !== 'TODAS' ? 'WHERE moneda = $1' : '';
    const params = moneda && moneda !== 'TODAS' ? [moneda] : [];
    const res = await pool.query(
      `SELECT DISTINCT ${exprAerolineaPrincipal()} AS aerolinea FROM precios_vuelos ${clause};`,
      params
    );
    if (res.rows.length === 0) return AEROLINEAS_FALLBACK;
    // Orden fijo por volumen historico (no alfabetico) -- "Otras" siempre al
    // final. Solo se listan las opciones que realmente tienen datos para esta
    // moneda (evita mostrar una aerolinea en 0 en el select).
    const presentes = new Set(res.rows.map(r => r.aerolinea));
    const ordenadas = AEROLINEAS_PRINCIPALES.filter(a => presentes.has(a));
    if (presentes.has('OTRAS')) ordenadas.push('OTRAS');
    return ordenadas;
  } catch {
    return AEROLINEAS_FALLBACK;
  }
}

async function getRutasDisponibles_raw(moneda?: string): Promise<string[]> {
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

async function getRegionesDisponibles_raw(moneda?: string, tipo_vuelo?: string): Promise<string[]> {
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

async function getTiposVueloDisponibles_raw(moneda?: string): Promise<string[]> {
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

// ==============================================================================
// 8. HISTORIAL DE CORRIDAS DEL SCRAPER (tablas scraper_runs / scraper_run_jobs,
// creadas por guardar_log_corrida() en tcprueba.py). Si las tablas todavia no
// existen (ninguna corrida con el nuevo logging fue ejecutada aun) las queries
// devuelven [] en vez de romper la pagina.
// ==============================================================================
export async function getHistorialCorridas(fechaExacta?: string): Promise<CorridaScraper[]> {
  try {
    const res = await pool.query(
      `
      SELECT
        id, fuente,
        TO_CHAR(fecha_inicio, 'YYYY-MM-DD HH24:MI') AS fecha_inicio,
        TO_CHAR(fecha_fin, 'YYYY-MM-DD HH24:MI') AS fecha_fin,
        duracion_scraping_seg, duracion_db_seg, duracion_total_seg,
        jobs_totales, jobs_con_datos, jobs_con_almundo, jobs_con_despegar,
        ofertas_totales, ofertas_ars, ofertas_usd, filas_insertadas_db,
        watchdog_kills_fase1, watchdog_reencolados_fase1, watchdog_descartados_fase1,
        jobs_segunda_pasada, jobs_recuperados_segunda_pasada, watchdog_kills_fase2,
        csv_path
      FROM scraper_runs
      ${fechaExacta ? 'WHERE DATE(fecha_inicio) = $1::date' : ''}
      ORDER BY fecha_inicio DESC;
      `,
      fechaExacta ? [fechaExacta] : []
    );

    return res.rows.map(r => ({
      id: Number(r.id),
      fuente: r.fuente,
      fecha_inicio: r.fecha_inicio,
      fecha_fin: r.fecha_fin,
      duracion_scraping_seg: r.duracion_scraping_seg !== null ? Number(r.duracion_scraping_seg) : null,
      duracion_db_seg: r.duracion_db_seg !== null ? Number(r.duracion_db_seg) : null,
      duracion_total_seg: r.duracion_total_seg !== null ? Number(r.duracion_total_seg) : null,
      jobs_totales: Number(r.jobs_totales || 0),
      jobs_con_datos: Number(r.jobs_con_datos || 0),
      jobs_con_almundo: Number(r.jobs_con_almundo || 0),
      jobs_con_despegar: Number(r.jobs_con_despegar || 0),
      ofertas_totales: Number(r.ofertas_totales || 0),
      ofertas_ars: Number(r.ofertas_ars || 0),
      ofertas_usd: Number(r.ofertas_usd || 0),
      filas_insertadas_db: Number(r.filas_insertadas_db || 0),
      watchdog_kills_fase1: Number(r.watchdog_kills_fase1 || 0),
      watchdog_reencolados_fase1: Number(r.watchdog_reencolados_fase1 || 0),
      watchdog_descartados_fase1: Number(r.watchdog_descartados_fase1 || 0),
      jobs_segunda_pasada: Number(r.jobs_segunda_pasada || 0),
      jobs_recuperados_segunda_pasada: Number(r.jobs_recuperados_segunda_pasada || 0),
      watchdog_kills_fase2: Number(r.watchdog_kills_fase2 || 0),
      csv_path: r.csv_path || null
    }));
  } catch (err) {
    console.error('Error en getHistorialCorridas (¿la tabla scraper_runs todavía no existe?):', err);
    return [];
  }
}

export async function getFechasConCorridas(): Promise<string[]> {
  try {
    const res = await pool.query(
      `SELECT DISTINCT TO_CHAR(fecha_inicio, 'YYYY-MM-DD') AS fecha
       FROM scraper_runs
       ORDER BY fecha DESC;`
    );
    return res.rows.map(r => r.fecha);
  } catch {
    return [];
  }
}

export async function getDetalleCorrida(runId: number): Promise<CorridaJobDetalle[]> {
  try {
    const res = await pool.query(
      `
      SELECT
        idx, ruta, moneda, tipo_vuelo, dias_anticipacion, dias_estadia,
        ofertas_count, tiene_almundo, tiene_despegar,
        reviso_segunda_pasada, recupero_almundo_segunda_pasada,
        aerolinea, tiene_atrapalo, vendedores
      FROM scraper_run_jobs
      WHERE run_id = $1
      ORDER BY idx ASC, aerolinea ASC;
      `,
      [runId]
    );

    return res.rows.map(r => ({
      idx: Number(r.idx),
      ruta: r.ruta,
      moneda: r.moneda,
      tipo_vuelo: r.tipo_vuelo || null,
      dias_anticipacion: Number(r.dias_anticipacion),
      dias_estadia: Number(r.dias_estadia),
      ofertas_count: Number(r.ofertas_count || 0),
      tiene_almundo: Boolean(r.tiene_almundo),
      tiene_despegar: Boolean(r.tiene_despegar),
      reviso_segunda_pasada: Boolean(r.reviso_segunda_pasada),
      recupero_almundo_segunda_pasada: Boolean(r.recupero_almundo_segunda_pasada),
      aerolinea: r.aerolinea || null,
      tiene_atrapalo: Boolean(r.tiene_atrapalo),
      vendedores: r.vendedores ? String(r.vendedores).split(',').map((v: string) => v.trim()).filter(Boolean) : []
    }));
  } catch (err) {
    console.error('Error en getDetalleCorrida:', err);
    return [];
  }
}

// ==============================================================================
// 9. CACHE (los datos cambian solo cuando corre el scraper)
// ==============================================================================
// unstable_cache: la clave incluye los argumentos (filtros), asi cada combinacion
// de filtros se calcula una vez cada CACHE_SEG segundos. Una excepcion NO se
// cachea (por eso las funciones internas relanzan y el "mensaje amable" se arma
// aca afuera). Tag 'precios' permite invalidar todo con revalidateTag('precios').
const CACHE_SEG = 300;
const TAG = ['precios'];

const _kpis = unstable_cache(getResumenKPIs_sinCache, ['getResumenKPIs'], { revalidate: CACHE_SEG, tags: TAG });
const _tabla = unstable_cache(getTablaItinerariosAlmundo_sinCache, ['getTablaItinerariosAlmundo'], { revalidate: CACHE_SEG, tags: TAG });
const _conteosSeg = unstable_cache(getConteosSegmento_sinCache, ['getConteosSegmento'], { revalidate: CACHE_SEG, tags: TAG });
const _conteosFiltros = unstable_cache(getConteosFiltros_sinCache, ['getConteosFiltros'], { revalidate: CACHE_SEG, tags: TAG });
export const obtenerDatosDashboard = unstable_cache(obtenerDatosDashboard_sinCache, ['obtenerDatosDashboard'], { revalidate: CACHE_SEG, tags: TAG });

export async function getResumenKPIs(...args: Parameters<typeof getResumenKPIs_sinCache>): Promise<ResumenKPIs> {
  try {
    return await _kpis(...args);
  } catch (err) {
    console.error('Error en getResumenKPIs:', err);
    return {
      total_vuelos_unicos: 0, total_vuelos_mercado: 0, vuelos_con_almundo: 0, vuelos_con_despegar: 0,
      share_presencia_almundo_pct: 0, share_presencia_despegar_pct: 0, win_rate_almundo_pct: 0,
      gap_promedio_almundo_pct: 0, mejor_precio_promedio: null, fee_promedio_almundo_pct: null, filas_a_revisar: 0
    };
  }
}

export async function getTablaItinerariosAlmundo(...args: Parameters<typeof getTablaItinerariosAlmundo_sinCache>): Promise<ResultadoPaginadoItinerarios> {
  try {
    return await _tabla(...args);
  } catch (err) {
    console.error('Error en getTablaItinerariosAlmundo:', err);
    return {
      error: 'No se pudo consultar la base de datos. Reintentá en unos segundos.',
      itinerarios: [], totalRegistros: 0, totalPaginas: 1,
      paginaActual: typeof args[7] === 'number' ? args[7] : 1,
      tamanoPagina: typeof args[8] === 'number' ? args[8] : 50
    };
  }
}

export async function getConteosSegmento(...args: Parameters<typeof getConteosSegmento_sinCache>): Promise<ConteosSegmento> {
  try {
    return await _conteosSeg(...args);
  } catch (err) {
    console.error('Error en getConteosSegmento:', err);
    return { total: 0, oportunidades: 0, vs_competidor: 0, desalineados: 0, a_revisar: 0 };
  }
}

export async function getConteosFiltros(...args: Parameters<typeof getConteosFiltros_sinCache>): Promise<ConteosFiltros> {
  try {
    return await _conteosFiltros(...args);
  } catch (err) {
    console.error('Error en getConteosFiltros:', err);
    return { porRuta: {}, porRegion: {}, porAerolinea: {}, porFuente: {} };
  }
}

// ==============================================================================
// 10. FRESCURA DE LOS DATOS (no se cachea: es una consulta barata y el usuario
// espera ver la hora real de la ultima corrida)
// ==============================================================================
export interface InfoActualizacion {
  ultima: string | null;          // 'dd/mm HH:MM' de la lectura mas reciente
  fechas: string[];               // dias con datos, mas reciente primero (YYYY-MM-DD)
}

async function getInfoActualizacion_raw(): Promise<InfoActualizacion> {
  try {
    const [u, f] = await Promise.all([
      pool.query(`SELECT TO_CHAR(MAX(fecha_obtencion), 'DD/MM HH24:MI') AS ultima FROM precios_vuelos`),
      pool.query(`SELECT DISTINCT TO_CHAR(fecha_obtencion::date, 'YYYY-MM-DD') AS fecha FROM precios_vuelos ORDER BY fecha DESC LIMIT 30`)
    ]);
    return { ultima: u.rows[0]?.ultima ?? null, fechas: f.rows.map(r => r.fecha) };
  } catch {
    return { ultima: null, fechas: [] };
  }
}

// Listas de opciones de los filtros y frescura: cambian solo con cada corrida.
const CACHE_LISTAS_SEG = 600;
export const getCompetidoresDisponibles = unstable_cache(getCompetidoresDisponibles_raw, ['getCompetidoresDisponibles'], { revalidate: CACHE_LISTAS_SEG, tags: TAG });
export const getFuentesDisponibles = unstable_cache(getFuentesDisponibles_raw, ['getFuentesDisponibles'], { revalidate: CACHE_LISTAS_SEG, tags: TAG });
export const getAerolineasDisponibles = unstable_cache(getAerolineasDisponibles_raw, ['getAerolineasDisponibles'], { revalidate: CACHE_LISTAS_SEG, tags: TAG });
export const getRutasDisponibles = unstable_cache(getRutasDisponibles_raw, ['getRutasDisponibles'], { revalidate: CACHE_LISTAS_SEG, tags: TAG });
export const getRegionesDisponibles = unstable_cache(getRegionesDisponibles_raw, ['getRegionesDisponibles'], { revalidate: CACHE_LISTAS_SEG, tags: TAG });
export const getTiposVueloDisponibles = unstable_cache(getTiposVueloDisponibles_raw, ['getTiposVueloDisponibles'], { revalidate: CACHE_LISTAS_SEG, tags: TAG });
export const getInfoActualizacion = unstable_cache(getInfoActualizacion_raw, ['getInfoActualizacion'], { revalidate: CACHE_LISTAS_SEG, tags: TAG });
