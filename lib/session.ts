// lib/session.ts
// Sesion firmada (HMAC-SHA256) con vencimiento. Usa Web Crypto, asi funciona
// igual en el proxy (middleware) y en las server actions. El valor de la cookie
// es "<expira_ms>.<firma>": no se puede fabricar sin conocer el secreto.
export const COOKIE_SESION = 'almundo_auth_session';
export const DURACION_SESION_SEG = 60 * 60 * 24 * 7; // 7 dias

function secreto(): string {
  // AUTH_SECRET si existe; si no, se deriva de la contraseña del dashboard
  // (cambiarla invalida todas las sesiones). Sin ninguna de las dos no hay
  // forma de firmar: la autenticacion falla cerrada.
  return process.env.AUTH_SECRET || process.env.DASHBOARD_PASSWORD || '';
}

async function firmar(mensaje: string): Promise<string> {
  const clave = secreto();
  if (!clave) return '';
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(clave),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const firma = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(mensaje));
  return Array.from(new Uint8Array(firma)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Comparacion en tiempo constante (evita filtrar la firma por timing).
export function igualesSeguro(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function crearToken(): Promise<string | null> {
  const expira = String(Date.now() + DURACION_SESION_SEG * 1000);
  const firma = await firmar(expira);
  return firma ? `${expira}.${firma}` : null;
}

export async function tokenValido(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [expira, firma] = token.split('.');
  if (!expira || !firma) return false;
  if (!/^\d+$/.test(expira) || Number(expira) < Date.now()) return false;
  const esperada = await firmar(expira);
  return esperada !== '' && igualesSeguro(firma, esperada);
}
