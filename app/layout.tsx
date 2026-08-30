// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Almundo | Inteligencia de Precios & Revenue Management',
  description: 'Panel de monitoreo competitivo y análisis de tarifas de vuelos.',
  icons: {
    icon: '/icon.png', // O '/favicon.ico'
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}