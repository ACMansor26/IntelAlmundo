// lib/esquema.ts
// Contrato entre el dashboard y la base: columnas que las consultas de
// lib/data.ts leen de precios_vuelos y de las tablas de log. Lo usan los tests
// (esquema.test.ts) y el chequeo de salud (/api/salud) para enterarse de un
// cambio de esquema ANTES de que rompa una pantalla.
export const COLUMNAS_PRECIOS_VUELOS = [
  'id_pareja_vuelo', 'fuente', 'vendedor', 'tipo_vendedor', 'tipo_vuelo', 'region', 'ruta', 'origen', 'destino',
  'fecha_ida', 'fecha_vuelta', 'dias_anticipacion', 'dias_estadia', 'moneda',
  'aerolinea_ida', 'aerolinea_vuelta', 'numero_vuelo_ida', 'numero_vuelo_vuelta', 'escalas_ida', 'escalas_vuelta',
  'aeropuerto_salida_ida', 'aeropuerto_llegada_ida', 'aeropuerto_salida_vuelta', 'aeropuerto_llegada_vuelta',
  'hora_salida_ida', 'hora_salida_vuelta', 'hora_llegada_ida', 'hora_llegada_vuelta',
  'fecha_llegada_ida', 'fecha_llegada_vuelta',
  'equipaje_mochila', 'equipaje_mano', 'equipaje_bodega',
  'tarifa_base', 'impuestos', 'tasas', 'cargo_gestion', 'precio_total', 'precio_sin_fee', 'pct_fee',
  'precio_listado_vendedor', 'dif_checkout_vs_listado', 'pct_dif_checkout_vs_listado',
  'fecha_obtencion'
] as const;

export const COLUMNAS_SCRAPER_RUNS = [
  'id', 'fuente', 'fecha_inicio', 'fecha_fin', 'duracion_scraping_seg', 'duracion_db_seg', 'duracion_total_seg',
  'jobs_totales', 'jobs_con_datos', 'jobs_con_almundo', 'jobs_con_despegar', 'ofertas_totales', 'ofertas_ars',
  'ofertas_usd', 'filas_insertadas_db', 'watchdog_kills_fase1', 'watchdog_reencolados_fase1',
  'watchdog_descartados_fase1', 'jobs_segunda_pasada', 'jobs_recuperados_segunda_pasada', 'watchdog_kills_fase2',
  'csv_path'
] as const;

export const COLUMNAS_SCRAPER_RUN_JOBS = [
  'run_id', 'idx', 'ruta', 'moneda', 'tipo_vuelo', 'dias_anticipacion', 'dias_estadia', 'ofertas_count',
  'tiene_almundo', 'tiene_despegar', 'reviso_segunda_pasada', 'recupero_almundo_segunda_pasada',
  'aerolinea', 'tiene_atrapalo', 'vendedores'
] as const;

export const TABLAS_CONTRATO = {
  precios_vuelos: COLUMNAS_PRECIOS_VUELOS,
  scraper_runs: COLUMNAS_SCRAPER_RUNS,
  scraper_run_jobs: COLUMNAS_SCRAPER_RUN_JOBS
} as const;
