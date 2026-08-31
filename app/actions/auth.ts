// app/actions/auth.ts
'use server';

import { cookies } from 'next/headers';

export async function loginModalAction(usuario: string, password: string) {
  const validUser = process.env.DASHBOARD_USER || 'cvccorp';
  const validPass = process.env.DASHBOARD_PASSWORD || 'Almundo2026!';

  if (usuario.trim() === validUser && password.trim() === validPass) {
    const cookieStore = await cookies();
    cookieStore.set('almundo_auth_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días de sesión activa
      path: '/',
    });
    return { success: true };
  }

  return { success: false, error: 'Usuario o contraseña incorrectos.' };
}