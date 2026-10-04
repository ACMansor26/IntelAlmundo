-- Indices de apoyo para el dashboard (idempotente: se puede correr varias veces).
-- Las consultas filtran por moneda/ruta/fuente, agrupan por (id_pareja_vuelo, fuente)
-- y cortan por dia de corrida (fecha_obtencion::date).
CREATE INDEX IF NOT EXISTS idx_pv_moneda_ruta        ON precios_vuelos (moneda, ruta);
CREATE INDEX IF NOT EXISTS idx_pv_id_fuente          ON precios_vuelos (id_pareja_vuelo, fuente);
CREATE INDEX IF NOT EXISTS idx_pv_fuente_corrida     ON precios_vuelos (fuente, (fecha_obtencion::date));
CREATE INDEX IF NOT EXISTS idx_pv_vendedor           ON precios_vuelos (vendedor);
