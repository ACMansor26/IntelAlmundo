// app/layout.tsx
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import AuthModal from '@/components/AuthModal';
import './globals.css';

export const metadata: Metadata = {
  title: 'Almundo | Inteligencia de Precios & Revenue Management',
  description: 'Panel de monitoreo competitivo y análisis de tarifas de vuelos.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.has('almundo_auth_session');

  return (
    <html lang="es">
      <body className="bg-[#0B1120] text-slate-100 antialiased font-sans">
        <AuthModal isAuthenticated={isAuthenticated} />
        {children}
      </body>
    </html>
  );
}