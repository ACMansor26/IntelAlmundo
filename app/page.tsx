// app/page.tsx
import { getResumenKPIs, getRutasDisponibles, getTablaPrecios } from '@/lib/data';
import Link from 'next/link';

interface PageProps {
  searchParams: Promise<{
    moneda?: string;
    ruta?: string;
    equipaje?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const moneda = params.moneda || 'ARS';
  const ruta = params.ruta || 'TODAS';
  const equipaje = params.equipaje || 'TODOS';

  const [kpis, rutas, vuelos] = await Promise.all([
    getResumenKPIs(moneda, ruta),
    getRutasDisponibles(moneda),
    getTablaPrecios(moneda, ruta, equipaje)
  ]);

  const formatoPrecio = (val: number | null) => {
    if (val === null || val === undefined) return '-';
    return moneda === 'USD'
      ? `USD ${Math.round(val).toLocaleString('es-AR')}`
      : `$ ${Math.round(val).toLocaleString('es-AR')}`;
  };

  const formatoGapMonto = (val: number | null) => {
    if (val === null || val === undefined) return '-';
    const signo = val > 0 ? '+' : '';
    return moneda === 'USD'
      ? `${signo}USD ${Math.round(val).toLocaleString('es-AR')}`
      : `${signo}$ ${Math.round(val).toLocaleString('es-AR')}`;
  };

  const formatoGapPct = (val: number | null) => {
    if (val === null || val === undefined) return '-';
    const pct = val * 100;
    const signo = pct > 0 ? '+' : '';
    return `${signo}${pct.toFixed(1)}%`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Encabezado con Switch de Navegación */}
<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
  <div>
    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
      Panel de Inteligencia de Precios
    </h1>
    <p className="text-slate-400 text-sm mt-1">
      Monitoreo competitivo de TurismoCity y Kayak vs Almundo
    </p>
  </div>

  {/* Selector de Vistas (Tabs) */}
  <div className="inline-flex rounded-lg bg-slate-900 p-1 border border-slate-800">
    <Link
      href={`/?moneda=${moneda}&ruta=${ruta}&equipaje=${equipaje}`}
      className="px-4 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white shadow transition"
    >
      Tabla de Detalle
    </Link>
    <Link
      href={`/graficos?moneda=${moneda}&ruta=${ruta}`}
      className="px-4 py-1.5 text-xs font-medium rounded-md text-slate-400 hover:text-white transition"
    >
      Gráficos & KPIs
    </Link>
  </div>
</div>

        {/* Barra de Filtros */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center gap-4">
          {/* Selector Moneda */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Moneda:</span>
            <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800">
              <Link
                href={`/?moneda=ARS&ruta=TODAS&equipaje=${equipaje}`}
                className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                  moneda === 'ARS' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                ARS
              </Link>
              <Link
                href={`/?moneda=USD&ruta=TODAS&equipaje=${equipaje}`}
                className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                  moneda === 'USD' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                USD
              </Link>
            </div>
          </div>

          {/* Selector Ruta */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ruta:</span>
            <div className="flex flex-wrap gap-1">
              <Link
                href={`/?moneda=${moneda}&ruta=TODAS&equipaje=${equipaje}`}
                className={`px-2.5 py-1 text-xs rounded-md border transition ${
                  ruta === 'TODAS'
                    ? 'bg-blue-900/40 border-blue-500 text-blue-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                Todas
              </Link>
              {rutas.map((r) => (
                <Link
                  key={r}
                  href={`/?moneda=${moneda}&ruta=${r}&equipaje=${equipaje}`}
                  className={`px-2.5 py-1 text-xs rounded-md border transition ${
                    ruta === r
                      ? 'bg-blue-900/40 border-blue-500 text-blue-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {r}
                </Link>
              ))}
            </div>
          </div>

          {/* Selector Equipaje */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Equipaje:</span>
            <div className="flex flex-wrap gap-1">
              {['TODOS', 'Solo Mochila', 'Mochila + Carry-on', 'Mano + Bodega'].map((eq) => (
                <Link
                  key={eq}
                  href={`/?moneda=${moneda}&ruta=${ruta}&equipaje=${eq}`}
                  className={`px-2.5 py-1 text-xs rounded-md border transition ${
                    equipaje === eq
                      ? 'bg-blue-900/40 border-blue-500 text-blue-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {eq}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Tarjetas KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <span className="text-xs text-slate-400 uppercase font-medium">Win Rate Almundo</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${
                (kpis?.win_rate_almundo_pct || 0) >= 30 ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {kpis?.win_rate_almundo_pct || 0}%
              </span>
              <span className="text-xs text-slate-500">con mejor precio</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <span className="text-xs text-slate-400 uppercase font-medium">Gap Almundo vs Mínimo</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-100">
                +{kpis?.gap_promedio_almundo_pct || 0}%
              </span>
              <span className="text-xs text-slate-500">promedio</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <span className="text-xs text-slate-400 uppercase font-medium">Cotizaciones Monitoreadas</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-100">
                {kpis?.total_cotizaciones?.toLocaleString('es-AR') || 0}
              </span>
              <span className="text-xs text-slate-500">registros</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <span className="text-xs text-slate-400 uppercase font-medium">Mejor Precio Promedio</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-blue-400">
                {formatoPrecio(kpis?.mejor_precio_promedio || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Tabla de Detalle */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Detalle de Cotizaciones</h2>
            <span className="text-xs text-slate-400">Mostrando {vuelos.length} registros</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-medium border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Fecha Vuelo</th>
                  <th className="py-3 px-3">Ruta</th>
                  <th className="py-3 px-3">Vendedor</th>
                  <th className="py-3 px-2 text-center">Posición</th>
                  <th className="py-3 px-2 text-center" title="Días de Anticipación (Advance Purchase)">AP</th>
                  <th className="py-3 px-3">Equipaje</th>
                  <th className="py-3 px-3 text-right">Precio</th>
                  <th className="py-3 px-3 text-right">Precio Almundo</th>
                  <th className="py-3 px-3 text-right">Gap Monto</th>
                  <th className="py-3 px-3 text-right">Gap %</th>
                  <th className="py-3 px-3 text-center">Fuente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {vuelos.map((v) => {
                  const esAlmundo = v.vendedor === 'Almundo';
                  const gapMonto = esAlmundo ? v.gap_vs_min_monto : v.gap_vs_almundo_monto;
                  const gapPct = esAlmundo ? v.gap_vs_min_pct : v.gap_vs_almundo_pct;

                  return (
                    <tr key={v.id} className="hover:bg-slate-800/30 transition">
                      {/* 1. Fecha Vuelo */}
                      <td className="py-3 px-3 font-sans text-slate-300 whitespace-nowrap">
                        {v.fecha_vuelo} <span className="text-slate-500 text-[11px]">({v.dia_semana_vuelo.slice(0, 3)})</span>
                      </td>

                      {/* 2. Ruta */}
                      <td className="py-3 px-3 font-sans whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-blue-300 font-semibold text-[11px] border border-slate-700">
                          {v.ruta}
                        </span>
                      </td>

                      {/* 3. Vendedor */}
                      <td className="py-3 px-3 font-sans">
                        <span className={`font-semibold ${esAlmundo ? 'text-amber-400' : 'text-white'}`}>
                          {v.vendedor}
                        </span>
                      </td>

                      {/* 4. Posición */}
                      <td className="py-3 px-2 text-center">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-sans text-[11px]">
                          #{v.posicion_vendedor || 1}
                        </span>
                      </td>

                      {/* 5. AP (Anticipación en días) */}
                      <td className="py-3 px-2 text-center">
                        <span className="text-slate-400 font-sans text-[11px]">
                          {v.dias_anticipacion}d
                        </span>
                      </td>

                      {/* 6. Equipaje */}
                      <td className="py-3 px-3 font-sans whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${
                          v.equipaje_incluido === 'Mano + Bodega'
                            ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                            : v.equipaje_incluido === 'Mochila + Carry-on'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {v.equipaje_incluido}
                        </span>
                      </td>

                      {/* 7. Precio */}
                      <td className="py-3 px-3 text-right font-semibold text-white whitespace-nowrap">
                        {formatoPrecio(v.precio)}
                        {v.es_mejor_precio === 'SI' && (
                          <span className="ml-1.5 px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[9px] font-sans font-bold">
                            WIN
                          </span>
                        )}
                      </td>

                      {/* 8. Precio Almundo */}
                      <td className="py-3 px-3 text-right text-slate-400 whitespace-nowrap">
                        {v.precio_almundo ? formatoPrecio(v.precio_almundo) : '-'}
                      </td>

                      {/* 9. Gap Monto */}
                      <td className={`py-3 px-3 text-right whitespace-nowrap ${
                        gapMonto !== null && gapMonto < 0 
                          ? 'text-emerald-400' 
                          : gapMonto !== null && gapMonto > 0 
                          ? 'text-rose-400' 
                          : 'text-slate-500'
                      }`}>
                        {formatoGapMonto(gapMonto)}
                      </td>

                      {/* 10. Gap % */}
                      <td className={`py-3 px-3 text-right whitespace-nowrap font-semibold ${
                        gapPct !== null && gapPct < 0 
                          ? 'text-emerald-400' 
                          : gapPct !== null && gapPct > 0 
                          ? 'text-rose-400' 
                          : 'text-slate-500'
                      }`}>
                        {formatoGapPct(gapPct)}
                      </td>

                      {/* 11. Fuente */}
                      <td className="py-3 px-3 text-center font-sans text-slate-400 text-[11px] whitespace-nowrap">
                        {v.fuente}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}