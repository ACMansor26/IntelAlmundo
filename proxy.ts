// proxy.ts (middleware en Next 16)
// Toda ruta del dashboard exige una sesion firmada y vigente ANTES de que se
// ejecute la pagina: sin ella ni siquiera se consulta la base de datos.
import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_SESION, tokenValido } from '@/lib/session';

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /api/salud: lo consulta un monitor externo sin sesion (sin sesion solo devuelve el estado).
  if (pathname === '/login' || pathname === '/api/salud') return NextResponse.next();

  if (await tokenValido(req.cookies.get(COOKIE_SESION)?.value)) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  // Todo menos assets internos de Next y archivos estaticos.
  matcher: ['/((?!_next/static|_next/image|icon.png|favicon.ico|almundo-logo).*)'],
};
