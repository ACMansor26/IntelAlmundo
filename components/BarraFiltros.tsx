// components/BarraFiltros.tsx
'use client';

import React, { useTransition } from 'react';
import { ChevronDown } from 'lucide-react';
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
  competidor?: string;
  // Corrida de datos: 'ULTIMA' (default), 'TODAS' o 'YYYY-MM-DD'
  fecha?: string;
  fechas?: string[];
  // Fuentes sin datos en la ultima ejecucion (ultimo dato mas viejo): se avisa debajo de los filtros.
  fuentesAtrasadas?: { fuente: string; ultima: string }[];

  // Listas dinamicas opcionales
  rutas?: string[];
  aerolineas?: string[];
  fuentes?: string[];
  regiones?: string[];
  tiposVuelo?: string[];
  competidores?: string[];

  // Conteos por opcion (mejora #5): "AEP-COR (18)" en vez de solo "AEP-COR".
  // Opcionales -- si no llegan, el select funciona igual pero sin el numero.
  conteoRutas?: Record<string, number>;
  conteoRegiones?: Record<string, number>;
  conteoAerolineas?: Record<string, number>;
  conteoFuentes?: Record<string, number>;
}

const FUENTES_DEFAULT = ['TurismoCity', 'Kayak', 'Skyscanner'];

const RUTAS_DEFAULT = [
  'AEP-COR', 'AEP-MDZ', 'AEP-BRC', 'AEP-SLA', 'AEP-IGR', 'AEP-TUC', 'COR-MDZ',
  'AEP-SCL', 'AEP-RIO', 'AEP-GRU', 'EZE-MIA', 'EZE-MAD', 'EZE-CUN', 'EZE-PUJ'
];

// Top 7 por volumen + "Otras" -- mismo criterio de consolidacion que
// exprAerolineaPrincipal() en lib/data.ts (la aerolinea cruda trae combos de
// conexion, ej. "LATAM / GOL", que sin esto explotaban en 43 opciones).
const AEROLINEAS_DEFAULT = [
  'Aerolíneas Argentinas', 'JetSmart', 'LATAM', 'Arajet', 'GOL', 'Avianca', 'SKY Airline', 'OTRAS'
];

// El valor real que viaja en la URL/query sigue siendo 'OTRAS' (para que el
// filtro SQL lo matchee), pero se muestra con una etiqueta legible.
const etiquetarAerolinea = (valor: string) => (valor === 'OTRAS' ? 'Otras aerolíneas' : valor);

// Fix: antes region/regiones/tipoVuelo llegaban como props desde page.tsx y se
// descartaban sin usarse en este componente. Estos fallbacks siguen el mismo
// patron que los de arriba, por si la query a la DB no devuelve nada.
const REGIONES_DEFAULT = [
  'BUENOS AIRES', 'CENTRO', 'CUYO', 'NOA', 'LITORAL',
  'PATAGONIA', 'CHILE', 'BRASIL', 'CARIBE', 'EEUU', 'EUROPA'
];
const TIPOS_VUELO_DEFAULT = ['INTERNACIONAL', 'DOMESTICO'];
const COMPETIDORES_DEFAULT = ['Despegar', 'Atrápalo'];

// Los valores reales en la DB pueden venir en cualquier casing
// ('INTERNACIONAL', 'Internacional', etc.) — esto normaliza solo la etiqueta
// visible, nunca el valor que se manda en la URL/query.
const etiquetar = (valor: string) =>
  valor.charAt(0).toUpperCase() + valor.slice(1).toLowerCase();

// Sufijo "(N)" para una opcion de select, si hay conteo disponible para ese
// valor exacto. Sin el conteo (prop no pasada, o valor no encontrado en el
// mapa) el label queda igual que antes.
const conCantidad = (label: string, valor: string, conteos?: Record<string, number>) => {
  if (!conteos || !(valor in conteos)) return label;
  return `${label} (${conteos[valor]})`;
};

function Flecha() {
  return (
    <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
  );
}

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
  const competidorAct = props.competidor || 'Despegar';
  const fechaAct = props.fecha || 'ULTIMA';
  const listaFechas = props.fechas ?? [];

  const listaFuentes = props.fuentes && props.fuentes.length > 0 ? props.fuentes : FUENTES_DEFAULT;
  const listaRutas = props.rutas && props.rutas.length > 0 ? props.rutas : RUTAS_DEFAULT;
  const listaAeros = props.aerolineas && props.aerolineas.length > 0 ? props.aerolineas : AEROLINEAS_DEFAULT;
  const listaRegiones = props.regiones && props.regiones.length > 0 ? props.regiones : REGIONES_DEFAULT;
  const listaTiposVuelo = props.tiposVuelo && props.tiposVuelo.length > 0 ? props.tiposVuelo : TIPOS_VUELO_DEFAULT;
  const listaCompetidores = props.competidores && props.competidores.length > 0 ? props.competidores : COMPETIDORES_DEFAULT;

  // Mejora #3: un select/toggle se resalta con borde naranja tenue cuando su
  // valor no es el default ("TODAS"/"TODOS") -- da un vistazo rapido de que
  // filtros estan activos sin tener que leer cada chip.
  const activo = (valor: string) => valor !== 'TODAS' && valor !== 'TODOS';
  const claseChip = (esActivo: boolean) =>
    `flex items-center justify-between sm:justify-start gap-2 border rounded-lg px-3 py-2 transition-colors ${
      esActivo ? 'bg-[color:var(--acc)]/[0.06] border-[color:var(--acc)]/40' : 'bg-[color:var(--sunk2)] border-white/10'
    }`;

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

  // "Competidor" no tiene un default tipo "TODAS"/"TODOS" -- su default es
  // 'Despegar', asi que necesita su propio criterio de cuando limpiar el
  // parametro de la URL en vez de reusar actualizarFiltro().
  const actualizarCompetidor = (valor: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (valor && valor !== 'Despegar') {
      params.set('competidor', valor);
    } else {
      params.delete('competidor');
    }

    if (params.has('pagina')) {
      params.set('pagina', '1');
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const actualizarFecha = (valor: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (valor && valor !== 'ULTIMA') {
      params.set('fecha', valor);
    } else {
      params.delete('fecha');
    }
    if (params.has('pagina')) {
      params.set('pagina', '1');
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const etiquetaFecha = (f: string) => {
    const [y, m, d] = f.split('-');
    return `${d}/${m}/${y}`;
  };

  // Mejora #4: "Limpiar filtros" -- resetea ruta/región/aerolínea/metabuscador
  // (no moneda ni tipo de vuelo, que son mas un modo de vista que un filtro
  // de recorte) y solo se muestra si alguno de esos esta activo.
  const hayFiltrosActivos = activo(fuenteAct) || activo(rutaAct) || activo(aeroAct) || activo(regionAct);
  const limpiarFiltros = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('fuente');
    params.delete('ruta');
    params.delete('aerolinea');
    params.delete('region');
    if (params.has('pagina')) params.set('pagina', '1');
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  // Mejora #1: los <select> nativos comparten el mismo fondo/borde que los
  // botones, con la flecha del navegador ocultada (appearance-none) y una
  // propia dibujada a mano -- así no rompen la consistencia visual con el
  // resto de los controles según el sistema operativo/navegador del usuario.
  const claseSelect =
    'appearance-none bg-[color:var(--sunk)] border border-white/10 text-slate-200 text-xs rounded-md ' +
    'pl-2.5 pr-7 py-1 focus:border-[color:var(--acc)] transition-colors cursor-pointer min-h-8';


  return (
    <div className="rounded-2xl border border-white/10 bg-[color:var(--surf)] p-3 space-y-3">

      {/* Fila 1: Moneda, Tipo de Vuelo, Metabuscador */}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:flex sm:flex-wrap items-stretch sm:items-center sm:justify-center gap-2 sm:gap-3">

        {/* Moneda */}
        <div className={claseChip(false)}>
          <span className="text-[11px] font-medium text-slate-400">Moneda</span>
          <div className="inline-flex bg-[color:var(--sunk)] rounded-md p-1">
            <button
              onClick={() => actualizarFiltro('moneda', 'ARS')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                monedaAct === 'ARS' ? 'bg-[color:var(--acc)] text-white shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              ARS ($)
            </button>
            <button
              onClick={() => actualizarFiltro('moneda', 'USD')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                monedaAct === 'USD' ? 'bg-[color:var(--acc)] text-white shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              USD (US$)
            </button>
          </div>
        </div>

        {/* Tipo de Vuelo */}
        <div className={claseChip(false)}>
          <span className="text-[11px] font-medium text-slate-400">Tipo de Vuelo</span>
          <div className="inline-flex bg-[color:var(--sunk)] rounded-md p-1">
            <button
              onClick={() => actualizarFiltro('tipo_vuelo', 'TODOS')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                tipoVueloAct === 'TODOS' ? 'bg-[color:var(--acc)] text-white shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Todos
            </button>
            {listaTiposVuelo.map((t) => (
              <button
                key={t}
                onClick={() => actualizarFiltro('tipo_vuelo', t)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  tipoVueloAct === t ? 'bg-[color:var(--acc)] text-white shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {etiquetar(t)}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro: Metabuscador */}
        <div className={claseChip(activo(fuenteAct))}>
          <label htmlFor="select-fuente" className="text-[11px] font-medium text-slate-400">Metabuscador</label>
          <div className="relative">
            <select
              id="select-fuente"
              value={fuenteAct}
              onChange={(e) => actualizarFiltro('fuente', e.target.value)}
              className={claseSelect}
            >
              <option value="TODAS">Todos los Metas</option>
              {listaFuentes.map((f) => (
                <option key={f} value={f}>
                  {conCantidad(f, f, props.conteoFuentes)}
                </option>
              ))}
            </select>
            <Flecha />
          </div>
        </div>

        {/* Filtro: Competidor a comparar (1-a-1 vs. Almundo) */}
        <div className={claseChip(competidorAct !== 'Despegar')}>
          <label htmlFor="select-competidor" className="text-[11px] font-medium text-slate-400">Comparar vs</label>
          <div className="relative">
            <select
              id="select-competidor"
              value={competidorAct}
              onChange={(e) => actualizarCompetidor(e.target.value)}
              className={claseSelect}
            >
              {listaCompetidores.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <Flecha />
          </div>
        </div>

        {/* Filtro: corrida de datos (por defecto, la mas reciente de cada fuente) */}
        <div className={claseChip(fechaAct !== 'ULTIMA')}>
          <label htmlFor="select-fecha" className="text-[11px] font-medium text-slate-400">Datos</label>
          <div className="relative">
            <select
              id="select-fecha"
              value={fechaAct}
              onChange={(e) => actualizarFecha(e.target.value)}
              className={claseSelect}
            >
              <option value="ULTIMA">Última ejecución</option>
              <option value="TODAS">Todo el histórico</option>
              {listaFechas.map((f) => (
                <option key={f} value={f}>{etiquetaFecha(f)}</option>
              ))}
            </select>
            <Flecha />
          </div>
        </div>
      </div>

      {/* Fila 2: Ruta, Región, Aerolínea */}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:flex sm:flex-wrap items-stretch sm:items-center sm:justify-center gap-2 sm:gap-3">

        {/* Filtro: Ruta */}
        <div className={claseChip(activo(rutaAct))}>
          <label htmlFor="select-ruta" className="text-[11px] font-medium text-slate-400">Ruta</label>
          <div className="relative">
            <select
              id="select-ruta"
              value={rutaAct}
              onChange={(e) => actualizarFiltro('ruta', e.target.value)}
              className={claseSelect}
            >
              <option value="TODAS">Todas las Rutas</option>
              {listaRutas.map((r) => (
                <option key={r} value={r}>
                  {conCantidad(r, r, props.conteoRutas)}
                </option>
              ))}
            </select>
            <Flecha />
          </div>
        </div>

        {/* Filtro: Region — antes llegaba como prop y no se usaba */}
        <div className={claseChip(activo(regionAct))}>
          <label htmlFor="select-region" className="text-[11px] font-medium text-slate-400">Región</label>
          <div className="relative">
            <select
              id="select-region"
              value={regionAct}
              onChange={(e) => actualizarFiltro('region', e.target.value)}
              className={claseSelect}
            >
              <option value="TODAS">Todas las Regiones</option>
              {listaRegiones.map((r) => (
                <option key={r} value={r}>
                  {conCantidad(r, r, props.conteoRegiones)}
                </option>
              ))}
            </select>
            <Flecha />
          </div>
        </div>

        {/* Filtro: Aerolinea */}
        <div className={claseChip(activo(aeroAct))}>
          <label htmlFor="select-aero" className="text-[11px] font-medium text-slate-400">Aerolínea</label>
          <div className="relative">
            <select
              id="select-aero"
              value={aeroAct}
              onChange={(e) => actualizarFiltro('aerolinea', e.target.value)}
              className={claseSelect}
            >
              <option value="TODAS">Todas las Aerolíneas</option>
              {listaAeros.map((a) => (
                <option key={a} value={a}>
                  {conCantidad(etiquetarAerolinea(a), a, props.conteoAerolineas)}
                </option>
              ))}
            </select>
            <Flecha />
          </div>
        </div>

        {/* Mejora #4: solo aparece si hay algun filtro de recorte activo */}
        {hayFiltrosActivos && (
          <button
            onClick={limpiarFiltros}
            className="text-[11px] font-medium text-slate-400 hover:text-[color:var(--acc2)] transition-colors underline decoration-dotted underline-offset-4"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Fuentes sin datos en la ultima ejecucion: solo con "Última ejecución" y todas las fuentes */}
      {fechaAct === 'ULTIMA' && fuenteAct === 'TODAS' && (props.fuentesAtrasadas ?? []).length > 0 && (
        <p role="status" className="text-center text-[11px] text-amber-300/90">
          Sin datos en la última ejecución de {(props.fuentesAtrasadas ?? []).map((x) => `${x.fuente} (último dato ${x.ultima})`).join(', ')}.
          Elegí esa fuente o un día puntual para verla.
        </p>
      )}

      {/* Feedback visual de transicion */}
      {isPending && (
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[color:var(--acc)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--acc)] animate-pulse" />
          <span>Filtrando…</span>
        </div>
      )}
    </div>
  );
}
