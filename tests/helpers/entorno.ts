// tests/helpers/entorno.ts
// Utilidades compartidas por las pruebas que hablan con Neon.
import fs from 'node:fs';
import path from 'node:path';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

// Carga .env.local si DATABASE_URL no vino del entorno (CI la define directo).
export function cargarEntorno(): string | undefined {
  if (!process.env.DATABASE_URL) {
    const archivo = path.resolve(__dirname, '../../.env.local');
    if (fs.existsSync(archivo)) {
      for (const linea of fs.readFileSync(archivo, 'utf8').split(/\r?\n/)) {
        const m = linea.match(/^(\w+)=(.*)$/);
        if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
      }
    }
  }
  return process.env.DATABASE_URL;
}

// Endpoint directo (sin "-pooler"): el pooler de Neon no acepta el parametro
// de arranque `search_path`, que es lo que aisla el esquema de prueba.
export function urlDirecta(url: string): string {
  return url.replace('-pooler', '');
}

export function urlConSchema(url: string, schema: string): string {
  const u = new URL(urlDirecta(url));
  u.searchParams.set('options', `-c search_path=${schema}`);
  return u.toString();
}

export function crearPoolAdmin(url: string): Pool {
  return new Pool({ connectionString: urlDirecta(url) });
}
