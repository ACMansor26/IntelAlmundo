// app/api/salud/route.ts
// Chequeo de salud para un monitor externo (UptimeRobot, Better Stack, etc.): responde 200 si
// todo esta bien y 503 si la base no responde, cambio el esquema o los datos estan viejos.
// Es publico a proposito (para que el monitor no necesite sesion) pero sin sesion solo
// devuelve el estado general; el detalle de los problemas requiere estar logueado.
import { NextRequest, NextResponse } from 'next/server';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { TABLAS_CONTRATO } from '@/lib/esquema';
import { COOKIE_SESION, tokenValido } from '@/lib/session';

export const dynamic = 'force-dynamic';

neonConfig.webSocketConstructor = ws;

// Horas sin lecturas nuevas a partir de las cuales se avisa (el scraper corre a diario).
const MAX_HORAS_SIN_DATOS = Number(process.env.SALUD_MAX_HORAS_SIN_DATOS || 36);

export async function GET(req: NextRequest) {
  const problemas: string[] = [];
  let estado: 'ok' | 'degradado' | 'error' = 'ok';
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    await pool.query('SELECT 1');

    // 1. Contrato de esquema: las columnas que usan las consultas del dashboard.
    for (const [tabla, columnas] of Object.entries(TABLAS_CONTRATO)) {
      const res = await pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1`,
        [tabla]
      );
      const existentes = new Set(res.rows.map((r) => r.column_name));
      const faltantes = columnas.filter((c) => !existentes.has(c));
      if (faltantes.length > 0) {
        estado = 'error';
        problemas.push(`${tabla}: faltan columnas ${faltantes.join(', ')}`);
      }
    }

    // 2. Frescura de los datos.
    if (estado !== 'error') {
      const f = await pool.query(
        `SELECT EXTRACT(EPOCH FROM (now() - MAX(fecha_obtencion))) / 3600 AS horas FROM precios_vuelos`
      );
      const horas = f.rows[0]?.horas === null || f.rows[0]?.horas === undefined ? null : Number(f.rows[0].horas);
      if (horas === null) {
        estado = 'degradado';
        problemas.push('precios_vuelos no tiene lecturas');
      } else if (horas > MAX_HORAS_SIN_DATOS) {
        estado = 'degradado';
        problemas.push(`última lectura hace ${Math.round(horas)} h (umbral ${MAX_HORAS_SIN_DATOS} h)`);
      }
    }
  } catch (err: any) {
    estado = 'error';
    problemas.push(`base de datos no disponible: ${err?.message ?? 'error desconocido'}`);
  } finally {
    await pool.end().catch(() => {});
  }

  const conSesion = await tokenValido(req.cookies.get(COOKIE_SESION)?.value);
  return NextResponse.json(
    conSesion ? { estado, problemas } : { estado },
    { status: estado === 'ok' ? 200 : 503, headers: { 'Cache-Control': 'no-store' } }
  );
}
