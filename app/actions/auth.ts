// app/actions/auth.ts
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE_SESION, DURACION_SESION_SEG, crearToken, igualesSeguro } from '@/lib/session';

export async function loginAction(usuario: string, password: string) {
  const validUser = process.env.DASHBOARD_USER || 'cvccorp';
  // Sin DASHBOARD_PASSWORD en el entorno NADIE puede entrar (antes habia una
  // contraseña por defecto escrita en el codigo).
  const validPass = process.env.DASHBOARD_PASSWORD;

  if (!validPass) {
    return { success: false, error: 'El acceso no está configurado en el servidor.' };
  }

  const okUser = igualesSeguro(usuario.trim(), validUser);
  const okPass = igualesSeguro(password.trim(), validPass);

  if (okUser && okPass) {
    const token = await crearToken();
    if (!token) return { success: false, error: 'El acceso no está configurado en el servidor.' };
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_SESION, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: DURACION_SESION_SEG,
      path: '/',
    });
    return { success: true };
  }

  // Frena un poco los intentos automaticos de fuerza bruta.
  await new Promise((r) => setTimeout(r, 800));
  return { success: false, error: 'Usuario o contraseña incorrectos.' };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_SESION);
  redirect('/login');
}
