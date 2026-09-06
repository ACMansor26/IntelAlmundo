// components/BarraFiltros.tsx
'use client';

import React, { useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface Props {
  // Compatibilidad dual de nombres de props
  moneda?: string;
  monedaActual?: string;
  fuente?: string;
  fuenteActual?: string;
  ruta?: string;
  rutaActual?: string;
  aerolinea?: string;
  aerolineaActual?: string;
  tipoVuelo?: string;
  region?: string;

  // Listas dinamicas opcionales
  rutas?: string[];
  aerolineas?: string[];
  fuentes?: string[];
  regiones?: string[];
  tiposVuelo?: string[];
}

const FUENTES_DEFAULT = ['TurismoCity', 'Kayak'];

const RUTAS_DEFAULT = [
  'AEP-COR', 'AEP-MDZ', 'AEP-BRC', 'AEP-SLA', 'AEP-IGR', 'AEP-TUC', 'COR-MDZ',
  'AEP-SCL', 'AEP-RIO', 'AEP-GRU', 'EZE-MIA', 'EZE-MAD', 'EZE-CUN', 'EZE-PUJ'
];

const AEROLINEAS_DEFAULT = [
  'Aerolíneas Argentinas', 'JetSmart', 'LATAM', 'Iberia',
  'Air Europa', 'Copa Airlines', 'GOL', 'SKY Airline'
];

// Fix: antes region/regiones/tipoVuelo llegaban como props desde page.tsx y se
// descartaban sin usarse en este componente. Estos fallbacks siguen el mismo
// patron que los de arriba, por si la query a la DB no devuelve nada.
const REGIONES_DEFAULT = [
  'BUENOS AIRES', 'CENTRO', 'CUYO', 'NOA', 'LITORAL',
  'PATAGONIA', 'CHILE', 'BRASIL', 'CARIBE', 'EEUU', 'EUROPA'
];
const TIPOS_VUELO_DEFAULT = ['INTERNACIONAL', 'DOMESTICO'];

// Los valores reales en la DB pueden venir en cualquier casing
// ('INTERNACIONAL', 'Internacional', etc.) — esto normaliza solo la etiqueta
// visible, nunca el valor que se manda en la URL/query.
const etiquetar = (valor: string) =>
  valor.charAt(0).toUpperCase() + valor.slice(1).toLowerCase();

export default function BarraFiltros(props: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Resolucion de valores actuales
  const monedaAct = props.moneda || props.monedaActual || 'ARS';
  const fuenteAct = props.fuente || props.fuenteActual || 'TODAS';
  const rutaAct = props.ruta || props.rutaActual || 'TODAS';
  const aeroAct = props.aerolinea || props.aerolineaActual || 'TODAS';
  const tipoVueloAct = props.tipoVuelo || 'TODOS';
  const regionAct = props.region || 'TODAS';

  const listaFuentes = props.fuentes && props.fuentes.length > 0 ? props.fuentes : FUENTES_DEFAULT;
  const listaRutas = props.rutas && props.rutas.length > 0 ? props.rutas : RUTAS_DEFAULT;
  const listaAeros = props.aerolineas && props.aerolineas.length > 0 ? props.aerolineas : AEROLINEAS_DEFAULT;
  const listaRegiones = props.regiones && props.regiones.length > 0 ? props.regiones : REGIONES_DEFAULT;
  const listaTiposVuelo = props.tiposVuelo && props.tiposVuelo.length > 0 ? props.tiposVuelo : TIPOS_VUELO_DEFAULT;

  const actualizarFiltro = (clave: string, valor: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (valor && valor !== 'TODAS' && valor !== 'TODOS') {
      params.set(clave, valor);
    } else {
      params.delete(clave);
    }

    // Al cambiar cualquier filtro, volvemos a la pagina 1 en caso de paginacion
    if (params.has('pagina')) {
      params.set('pagina', '1');
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#10182B] p-3 space-y-3">

      {/* Fila 1: Moneda, Tipo de Vuelo, Metabuscador */}
      <div className="flex flex-wrap items-center justify-center gap-3">

        {/* Moneda */}
        <div className="flex items-center gap-2 bg-[#050810] border border-white/10 rounded-lg px-3 py-2">
          <span className="text-[11px] font-medium text-slate-500">Moneda</span>
          <div className="inline-flex bg-[#0B1120] rounded-md p-1">
            <button
              onClick={() => actualizarFiltro('moneda', 'ARS')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                monedaAct === 'ARS' ? 'bg-[#FF5A00] text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              ARS ($)
            </button>
            <button
              onClick={() => actualizarFiltro('moneda', 'USD')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                monedaAct === 'USD' ? 'bg-[#FF5A00] text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              USD (US$)
            </button>
          </div>
        </div>

        {/* Tipo de Vuelo */}
        <div className="flex items-center gap-2 bg-[#050810] border border-white/10 rounded-lg px-3 py-2">
          <span className="text-[11px] font-medium text-slate-500">Tipo de Vuelo</span>
          <div className="inline-flex bg-[#0B1120] rounded-md p-1">
            <button
              onClick={() => actualizarFiltro('tipo_vuelo', 'TODOS')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                tipoVueloAct === 'TODOS' ? 'bg-[#FF5A00] text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            {listaTiposVuelo.map((t) => (
              <button
                key={t}
                onClick={() => actualizarFiltro('tipo_vuelo', t)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  tipoVueloAct === t ? 'bg-[#FF5A00] text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {etiquetar(t)}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro: Metabuscador */}
        <div className="flex items-center gap-2 bg-[#050810] border border-white/10 rounded-lg px-3 py-2">
          <label htmlFor="select-fuente" className="text-[11px] font-medium text-slate-500">Metabuscador</label>
          <select
            id="select-fuente"
            value={fuenteAct}
            onChange={(e) => actualizarFiltro('fuente', e.target.value)}
            className="bg-[#0B1120] border border-white/10 text-slate-200 text-xs rounded-md px-2.5 py-1 focus:outline-none focus:border-[#FF5A00] transition-colors"
          >
            <option value="TODAS">Todos los Metas</option>
            {listaFuentes.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Fila 2: Ruta, Región, Aerolínea */}
      <div className="flex flex-wrap items-center justify-center gap-3">

        {/* Filtro: Ruta */}
        <div className="flex items-center gap-2 bg-[#050810] border border-white/10 rounded-lg px-3 py-2">
          <label htmlFor="select-ruta" className="text-[11px] font-medium text-slate-500">Ruta</label>
          <select
            id="select-ruta"
            value={rutaAct}
            onChange={(e) => actualizarFiltro('ruta', e.target.value)}
            className="bg-[#0B1120] border border-white/10 text-slate-200 text-xs rounded-md px-2.5 py-1 focus:outline-none focus:border-[#FF5A00] transition-colors"
          >
            <option value="TODAS">Todas las Rutas</option>
            {listaRutas.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro: Region — antes llegaba como prop y no se usaba */}
        <div className="flex items-center gap-2 bg-[#050810] border border-white/10 rounded-lg px-3 py-2">
          <label htmlFor="select-region" className="text-[11px] font-medium text-slate-500">Región</label>
          <select
            id="select-region"
            value={regionAct}
            onChange={(e) => actualizarFiltro('region', e.target.value)}
            className="bg-[#0B1120] border border-white/10 text-slate-200 text-xs rounded-md px-2.5 py-1 focus:outline-none focus:border-[#FF5A00] transition-colors"
          >
            <option value="TODAS">Todas las Regiones</option>
            {listaRegiones.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro: Aerolinea */}
        <div className="flex items-center gap-2 bg-[#050810] border border-white/10 rounded-lg px-3 py-2">
          <label htmlFor="select-aero" className="text-[11px] font-medium text-slate-500">Aerolínea</label>
          <select
            id="select-aero"
            value={aeroAct}
            onChange={(e) => actualizarFiltro('aerolinea', e.target.value)}
            className="bg-[#0B1120] border border-white/10 text-slate-200 text-xs rounded-md px-2.5 py-1 focus:outline-none focus:border-[#FF5A00] transition-colors"
          >
            <option value="TODAS">Todas las Aerolíneas</option>
            {listaAeros.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Feedback visual de transicion */}
      {isPending && (
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#FF5A00]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#FF5A00] animate-pulse" />
          <span>Filtrando…</span>
        </div>
      )}
    </div>
  );
}