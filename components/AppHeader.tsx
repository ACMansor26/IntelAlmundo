// components/AppHeader.tsx
// Encabezado compartido de las tres pantallas (antes copiado en cada pagina).
import React from 'react';
import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';

type Seccion = 'matriz' | 'graficos' | 'historial';

interface Props {
  activo: Seccion;
  estado: string;
  titulo: string;
  subtitulo: string;
  hrefMatriz: string;
  hrefGraficos: string;
  hrefHistorial?: string;
  // Hora de la lectura mas reciente en la base (ej. '03/10 03:01')
  actualizado?: string | null;
}

const heading = '[font-family:var(--font-heading)]';

export default function AppHeader({
  activo,
  estado,
  titulo,
  subtitulo,
  hrefMatriz,
  hrefGraficos,
  hrefHistorial = '/historial',
  actualizado
}: Props) {
  const tabs: { id: Seccion; label: string; href: string }[] = [
    { id: 'matriz', label: 'Matriz Almundo', href: hrefMatriz },
    { id: 'graficos', label: 'Gráficos & KPIs', href: hrefGraficos },
    { id: 'historial', label: 'Historial de Búsquedas', href: hrefHistorial }
  ];

  return (
    <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-white/10 pb-6">
      <div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[color:var(--acc)] opacity-60 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--acc)]" />
          </span>
          <span>{estado}</span>
          {actualizado && (
            <span className="ml-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-slate-300">
              Datos al {actualizado}
            </span>
          )}
        </div>
        <h1 className={`${heading} text-2xl md:text-3xl font-semibold tracking-tight text-white mt-1.5`}>
          {titulo}
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-2xl">{subtitulo}</p>
      </div>

      <div className="flex items-center gap-5 border-b border-white/10 md:border-0">
      <nav aria-label="Secciones" className="flex items-center gap-5 overflow-x-auto">
        {tabs.map((t) =>
          t.id === activo ? (
            <span key={t.id} aria-current="page" className="relative pb-2 text-xs font-medium text-white whitespace-nowrap">
              {t.label}
              <span className="absolute left-0 right-0 -bottom-px h-[2px] rounded-full bg-[color:var(--acc)]" />
            </span>
          ) : (
            <Link
              key={t.id}
              href={t.href}
              className="relative pb-2 text-xs font-medium text-slate-400 hover:text-white transition-colors whitespace-nowrap"
            >
              {t.label}
            </Link>
          )
        )}
      </nav>
      <form action={logoutAction} className="pb-2">
        <button
          type="submit"
          className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <LogOut aria-hidden="true" className="h-3.5 w-3.5" />
          Salir
        </button>
      </form>
      </div>
    </header>
  );
}
