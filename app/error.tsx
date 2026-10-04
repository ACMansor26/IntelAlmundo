// app/error.tsx
// Frontera de error: si una pagina lanza una excepcion no controlada se muestra
// esto (con opcion de reintentar) en vez de una pantalla en blanco.
'use client';

import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div role="alert" className="max-w-md rounded-2xl border border-rose-800/60 bg-rose-950/40 p-6 text-center space-y-3">
        <AlertTriangle aria-hidden="true" className="mx-auto h-6 w-6 text-rose-300" />
        <h1 className="text-sm font-semibold text-rose-200">Algo falló al cargar esta pantalla</h1>
        <p className="text-xs text-rose-300/80">
          Puede ser un problema momentáneo de conexión con la base de datos. Reintentá; si persiste, avisá al equipo.
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-[color:var(--acc)] px-4 py-2 text-xs font-semibold text-white hover:bg-[color:var(--acc2)] transition-colors cursor-pointer"
        >
          Reintentar
        </button>
      </div>
    </main>
  );
}
