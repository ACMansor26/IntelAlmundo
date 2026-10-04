// components/GraficosDashboardLazy.tsx
// Carga diferida de los graficos: Recharts es lo mas pesado del bundle y sus
// graficos no se pueden renderizar en el servidor (ResponsiveContainer necesita
// medir el DOM), asi que se cargan solo en el navegador mientras se muestra un
// esqueleto con el mismo alto -- el HTML inicial es mas liviano y no hay salto.
'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const GraficosDashboard = dynamic(() => import('@/components/GraficosDashboard'), {
  ssr: false,
  loading: () => (
    <div className="space-y-12" aria-busy="true">
      <span className="sr-only">Cargando gráficos…</span>
      {[0, 1, 2].map((s) => (
        <div key={s} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[0, 1, 2].map((c) => (
            <div key={c} className="h-[26rem] animate-pulse rounded-2xl border border-white/10 bg-white/5" />
          ))}
        </div>
      ))}
    </div>
  )
});

export default GraficosDashboard;
