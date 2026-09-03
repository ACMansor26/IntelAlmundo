// components/BarraFiltros.tsx
'use client';

import React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface Props {
  moneda: string;
  fuente: string;
  ruta: string;
  aerolinea: string;
  rutas: string[];
  aerolineas: string[];
  fuentes: string[];
}

export default function BarraFiltros({
  moneda,
  fuente,
  ruta,
  aerolinea,
  rutas,
  aerolineas,
  fuentes
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    params.set('pagina', '1'); // Resetea a la primera página al cambiar filtros
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="bg-[#111C30] border border-slate-800 p-4 rounded-xl flex flex-wrap items-center gap-5 shadow-lg shadow-black/20">
      
      {/* 1. Selector Moneda */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Moneda:</span>
        <div className="inline-flex rounded-lg bg-[#0B1120] p-1 border border-slate-800">
          {['ARS', 'USD'].map((m) => (
            <button
              key={m}
              onClick={() => updateParam('moneda', m)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                moneda === m
                  ? 'bg-[#FF5A00] text-white shadow font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Selector Fuente */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Fuente:</span>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => updateParam('fuente', 'TODAS')}
            className={`px-2.5 py-1 text-xs rounded-md border transition ${
              fuente === 'TODAS'
                ? 'bg-[#FF5A00]/20 border-[#FF5A00] text-[#FF7A29] font-medium'
                : 'bg-[#0B1120] border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            Todas
          </button>
          {fuentes.map((f) => (
            <button
              key={f}
              onClick={() => updateParam('fuente', f)}
              className={`px-2.5 py-1 text-xs rounded-md border transition ${
                fuente === f
                  ? 'bg-[#FF5A00]/20 border-[#FF5A00] text-[#FF7A29] font-medium'
                  : 'bg-[#0B1120] border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Desplegable Rutas */}
      <div className="flex items-center gap-2">
        <label htmlFor="select-ruta" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Ruta:
        </label>
        <select
          id="select-ruta"
          value={ruta}
          onChange={(e) => updateParam('ruta', e.target.value)}
          className="bg-[#0B1120] border border-slate-700 hover:border-slate-600 focus:border-[#FF5A00] text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#FF5A00] transition cursor-pointer"
        >
          <option value="TODAS">Todas las rutas</option>
          {rutas.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* 4. Desplegable Aerolíneas (incluye LATAM) */}
      <div className="flex items-center gap-2">
        <label htmlFor="select-aerolinea" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Aerolínea:
        </label>
        <select
          id="select-aerolinea"
          value={aerolinea}
          onChange={(e) => updateParam('aerolinea', e.target.value)}
          className="bg-[#0B1120] border border-slate-700 hover:border-slate-600 focus:border-[#FF5A00] text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#FF5A00] transition cursor-pointer"
        >
          <option value="TODAS">Todas las aerolíneas</option>
          {aerolineas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

    </div>
  );
}