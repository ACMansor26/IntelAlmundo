// app/layout.tsx
import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import { Suspense } from 'react';
import ProgresoNavegacion from '@/components/ProgresoNavegacion';

export const metadata: Metadata = {
  title: 'Almundo | Inteligencia de Precios & Revenue Management',
  description: 'Panel de monitoreo competitivo y análisis de tarifas de vuelos.',
};

// Tipografia unica del sitio: Montserrat. Las variables --font-heading y
// --font-data (usadas por las paginas) apuntan a ella desde globals.css; las
// cifras usan tabular-nums para que las columnas alineen.
const fontBase = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-base'
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={fontBase.variable}>
      <body className="text-slate-100 antialiased">
        <a href="#contenido" className="skip-link">Saltar al contenido</a>
        <Suspense fallback={null}>
          <ProgresoNavegacion />
        </Suspense>
        <div id="contenido">{children}</div>
      </body>
    </html>
  );
}
