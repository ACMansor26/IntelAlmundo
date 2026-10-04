// components/PaginaCargando.tsx
// Skeleton compartido para los loading.tsx de cada ruta: reserva el espacio de
// header + filtros + KPIs + contenido mientras corren las queries a Neon, en
// vez de una pantalla vacia que "salta" al cargar.
import React from 'react';

const bloque = 'animate-pulse rounded-xl bg-white/5';

export default function PaginaCargando({ filas = 5 }: { filas?: number }) {
  return (
    <main
      className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Cargando datos…</span>
      <div className="space-y-3 border-b border-white/10 pb-6">
        <div className={`${bloque} h-3 w-56`} />
        <div className={`${bloque} h-8 w-80 max-w-full`} />
        <div className={`${bloque} h-3 w-96 max-w-full`} />
      </div>
      <div className={`${bloque} h-24`} />
      <div className={`${bloque} h-24`} />
      <div className="space-y-3">
        {Array.from({ length: filas }).map((_, i) => (
          <div key={i} className={`${bloque} h-20`} />
        ))}
      </div>
    </main>
  );
}
