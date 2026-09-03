// app/page.tsx
import {
  getResumenKPIs,
  getRutasDisponibles,
  getFuentesDisponibles,
  getAerolineasDisponibles,
  getTablaItinerariosAlmundo
} from '@/lib/data';
import BarraFiltros from '@/components/BarraFiltros';
import Link from 'next/link';

interface PageProps {
  searchParams: Promise<{
    moneda?: string;
    ruta?: string;
    fuente?: string;
    aerolinea?: string;
    segmento?: string;
    pagina?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const moneda = params.moneda || 'ARS';
  const ruta = params.ruta || 'TODAS';
  const fuente = params.fuente || 'TODAS';
  const aerolinea = params.aerolinea || 'TODAS';
  const segmento = params.segmento || 'TODOS';
  const pagina = Math.max(1, parseInt(params.pagina || '1', 10));

  const [kpis, rutas, fuentes, aerolineas, resultadoPaginado] = await Promise.all([
    getResumenKPIs(moneda, ruta, fuente, aerolinea),
    getRutasDisponibles(moneda),
    getFuentesDisponibles(moneda),
    getAerolineasDisponibles(moneda),
    getTablaItinerariosAlmundo(moneda, ruta, fuente, aerolinea, segmento, pagina, 50)
  ]);

  const { itinerarios, totalRegistros, totalPaginas, paginaActual, tamanoPagina } = resultadoPaginado;
  const desdeRegistro = totalRegistros === 0 ? 0 : (paginaActual - 1) * tamanoPagina + 1;
  const hastaRegistro = Math.min(paginaActual * tamanoPagina, totalRegistros);

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
    const signo = val > 0 ? '+' : '';
    return `${signo}${val.toFixed(1)}%`;
  };

  const buildPageUrl = (targetPage: number, targetSegment?: string) => {
    const seg = targetSegment !== undefined ? targetSegment : segmento;
    return `/?moneda=${moneda}&ruta=${ruta}&fuente=${fuente}&aerolinea=${aerolinea}&segmento=${seg}&pagina=${targetPage}`;
  };

  const paginasVisibles: number[] = [];
  const startPage = Math.max(1, paginaActual - 2);
  const endPage = Math.min(totalPaginas, paginaActual + 2);
  for (let i = startPage; i <= endPage; i++) {
    paginasVisibles.push(i);
  }

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF5A00]/15 text-[#FF7A29] border border-[#FF5A00]/40 tracking-wider uppercase">
                Almundo Pricing & Growth Matrix
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">
              Matriz Operativa de Decisiones
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Monitoreo itinerario por itinerario de la posición de Almundo vs líderes de mercado
            </p>
          </div>

          <div className="inline-flex rounded-lg bg-[#111C30] p-1 border border-slate-800">
            <Link
              href={buildPageUrl(1)}
              className="px-4 py-1.5 text-xs font-semibold rounded-md bg-[#FF5A00] text-white shadow transition"
            >
              Matriz Almundo
            </Link>
            <Link
              href={`/graficos?moneda=${moneda}&ruta=${ruta}&fuente=${fuente}&aerolinea=${aerolinea}`}
              className="px-4 py-1.5 text-xs font-medium rounded-md text-slate-400 hover:text-white transition"
            >
              Gráficos & KPIs
            </Link>
          </div>
        </div>

        {/* Barra de Filtros con Desplegables de Ruta y Aerolínea */}
        <BarraFiltros
          moneda={moneda}
          fuente={fuente}
          ruta={ruta}
          aerolinea={aerolinea}
          rutas={rutas}
          aerolineas={aerolineas}
          fuentes={fuentes}
        />

        {/* Tarjetas KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#111C30] border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20">
            <span className="text-xs text-slate-400 uppercase font-medium">Win Rate Almundo</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${
                (kpis?.win_rate_almundo_pct || 0) >= 30 ? 'text-emerald-400' : 'text-[#FF7A29]'
              }`}>
                {kpis?.win_rate_almundo_pct || 0}%
              </span>
              <span className="text-xs text-slate-500">Buy Box</span>
            </div>
          </div>

          <div className="bg-[#111C30] border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20">
            <span className="text-xs text-slate-400 uppercase font-medium">Gap Almundo vs Mínimo</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-100">
                +{kpis?.gap_promedio_almundo_pct || 0}%
              </span>
              <span className="text-xs text-slate-500">promedio</span>
            </div>
          </div>

          <div className="bg-[#111C30] border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20">
            <span className="text-xs text-slate-400 uppercase font-medium">Vuelos Únicos Monitoreados</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-sky-400">
                {kpis?.total_vuelos_unicos?.toLocaleString('es-AR') || 0}
              </span>
              <span className="text-xs text-slate-500">itinerarios</span>
            </div>
          </div>

          <div className="bg-[#111C30] border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20">
            <span className="text-xs text-slate-400 uppercase font-medium">Tarifa Ganadora Media</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-emerald-400">
                {formatoPrecio(kpis?.mejor_precio_promedio || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Tabla Centrada en Almundo (SIN EQUIPAJE NI PLAYBOOK) */}
        <div className="bg-[#111C30] border border-slate-800 rounded-xl overflow-hidden space-y-4 p-5 shadow-xl shadow-black/30">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-semibold text-white">Detalle Operativo por Itinerario</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Mostrando <strong className="text-white">{desdeRegistro}</strong> a <strong className="text-white">{hastaRegistro}</strong> de <strong className="text-sky-400">{totalRegistros}</strong> vuelos filtrados
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 bg-[#0B1120] p-1.5 rounded-lg border border-slate-800">
              {[
                { id: 'TODOS', label: 'Todos los Vuelos' },
                { id: 'OPORTUNIDADES', label: '🎯 Oportunidades Clave (≤3%)' },
                { id: 'WINS', label: '🏆 Buy Box Wins' },
                { id: 'VS_DESPEGAR', label: '⚔️ Ganando a Despegar' },
                { id: 'DESALINEADOS', label: '⚠️ Desalineados (>7%)' }
              ].map((tab) => (
                <Link
                  key={tab.id}
                  href={buildPageUrl(1, tab.id)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                    segmento === tab.id
                      ? 'bg-[#FF5A00] text-white font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0B1120] text-slate-400 uppercase font-medium border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Vuelo & Ruta</th>
                  <th className="py-3 px-2 text-center" title="Advance Purchase / Lead Time">AP</th>
                  <th className="py-3 px-3 text-right">Precio Almundo</th>
                  <th className="py-3 px-3 text-right">Líder de Mercado</th>
                  <th className="py-3 px-3 text-right">Gap vs Líder</th>
                  <th className="py-3 px-3 text-right">vs Despegar</th>
                  <th className="py-3 px-3 text-center">Estado Almundo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {itinerarios.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-sans text-xs">
                      No se encontraron itinerarios para los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  itinerarios.map((item, idx) => {
                    const tieneAlmundo = item.precio_almundo !== null;
                    const esWin = item.estado_almundo === 'WIN';
                    const esOportunidad = item.estado_almundo === 'OPORTUNIDAD';
                    const esDesalineado = item.estado_almundo === 'DESALINEADO';

                    return (
                      <tr key={idx} className="hover:bg-[#1E293B]/40 transition">
                        
                        {/* 1. Vuelo & Ruta */}
                        <td className="py-3 px-3 font-sans whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-sky-950/80 text-sky-300 font-semibold text-[11px] border border-sky-800/80">
                              {item.ruta}
                            </span>
                            <span className="text-white font-medium">{item.fecha_vuelo}</span>
                            <span className="text-slate-500 text-[11px]">({item.dia_semana_vuelo.slice(0, 3)})</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                            <span className="font-semibold text-slate-300">{item.aerolinea}</span>
                            <span>•</span>
                            <span className="text-slate-500">{item.fuente}</span>
                          </div>
                        </td>

                        {/* 2. AP */}
                        <td className="py-3 px-2 text-center font-sans">
                          <span className="text-slate-300 text-[11px] bg-[#0B1120] px-1.5 py-0.5 rounded border border-slate-800">
                            {item.dias_anticipacion}d
                          </span>
                        </td>

                        {/* 3. Precio Almundo */}
                        <td className="py-3 px-3 text-right font-sans whitespace-nowrap">
                          {tieneAlmundo ? (
                            <div>
                              <span className={`font-bold font-mono text-[13px] ${esWin ? 'text-[#FF5A00]' : 'text-white'}`}>
                                {formatoPrecio(item.precio_almundo)}
                              </span>
                              <div className="text-[10px] text-slate-400">
                                Posición #{item.posicion_almundo || 1}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">No disponible</span>
                          )}
                        </td>

                        {/* 4. Mejor Precio */}
                        <td className="py-3 px-3 text-right font-sans whitespace-nowrap">
                          <div className="font-bold font-mono text-emerald-400 text-[13px]">
                            {formatoPrecio(item.mejor_precio_mercado)}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[130px] ml-auto" title={item.vendedor_ganador}>
                            {item.vendedor_ganador}
                          </div>
                        </td>

                        {/* 5. Gap vs Líder */}
                        <td className="py-3 px-3 text-right whitespace-nowrap font-mono">
                          {tieneAlmundo ? (
                            <div>
                              <div className={`font-bold ${
                                esWin ? 'text-emerald-400' : esOportunidad ? 'text-sky-400' : 'text-rose-400'
                              }`}>
                                {formatoGapPct(item.gap_min_pct)}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {formatoGapMonto(item.gap_min_monto)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>

                        {/* 6. Spread vs Despegar */}
                        <td className="py-3 px-3 text-right whitespace-nowrap font-mono">
                          {item.spread_despegar_monto !== null ? (
                            <div>
                              <div className={`font-semibold ${
                                item.spread_despegar_monto < 0 ? 'text-emerald-400' : item.spread_despegar_monto === 0 ? 'text-slate-400' : 'text-rose-400'
                              }`}>
                                {formatoGapPct(item.spread_despegar_pct)}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {formatoGapMonto(item.spread_despegar_monto)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-600 text-[11px]">N/D</span>
                          )}
                        </td>

                        {/* 7. Estado Almundo */}
                        <td className="py-3 px-3 text-center font-sans whitespace-nowrap">
                          {esWin && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              BUY BOX WIN
                            </span>
                          )}
                          {esOportunidad && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-800 flex items-center justify-center gap-1">
                              🎯 OPORTUNIDAD
                            </span>
                          )}
                          {item.estado_almundo === 'MODERADO' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-[#FF5A00]/15 text-[#FF7A29] border border-[#FF5A00]/40">
                              BRECHA MEDIA
                            </span>
                          )}
                          {esDesalineado && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-rose-950/60 text-rose-300 border border-rose-800/80">
                              DESALINEADO
                            </span>
                          )}
                          {item.estado_almundo === 'SIN_OFERTA' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400">
                              SIN COBERTURA
                            </span>
                          )}
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 font-sans text-xs">
              <div className="text-slate-400 text-center sm:text-left">
                Página <span className="font-semibold text-white">{paginaActual}</span> de <span className="font-semibold text-white">{totalPaginas}</span>
              </div>

              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                <Link
                  href={buildPageUrl(Math.max(1, paginaActual - 1))}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-1 ${
                    paginaActual <= 1
                      ? 'border-slate-800/50 text-slate-600 pointer-events-none bg-[#0B1120]/40'
                      : 'border-slate-700 bg-[#0B1120] text-slate-300 hover:text-white hover:border-slate-600 shadow-sm'
                  }`}
                  aria-disabled={paginaActual <= 1}
                >
                  ← Anterior
                </Link>

                {startPage > 1 && (
                  <>
                    <Link
                      href={buildPageUrl(1)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-[#0B1120] text-slate-400 hover:text-white hover:border-slate-700 transition font-mono"
                    >
                      1
                    </Link>
                    {startPage > 2 && <span className="px-1 text-slate-600">...</span>}
                  </>
                )}

                {paginasVisibles.map((p) => (
                  <Link
                    key={p}
                    href={buildPageUrl(p)}
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold transition ${
                      p === paginaActual
                        ? 'bg-[#FF5A00] text-white shadow-md shadow-[#FF5A00]/20'
                        : 'border border-slate-800 bg-[#0B1120] text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {p}
                  </Link>
                ))}

                {endPage < totalPaginas && (
                  <>
                    {endPage < totalPaginas - 1 && <span className="px-1 text-slate-600">...</span>}
                    <Link
                      href={buildPageUrl(totalPaginas)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-[#0B1120] text-slate-400 hover:text-white hover:border-slate-700 transition font-mono"
                    >
                      {totalPaginas}
                    </Link>
                  </>
                )}

                <Link
                  href={buildPageUrl(Math.min(totalPaginas, paginaActual + 1))}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-1 ${
                    paginaActual >= totalPaginas
                      ? 'border-slate-800/50 text-slate-600 pointer-events-none bg-[#0B1120]/40'
                      : 'border-slate-700 bg-[#0B1120] text-slate-300 hover:text-white hover:border-slate-600 shadow-sm'
                  }`}
                  aria-disabled={paginaActual >= totalPaginas}
                >
                  Siguiente →
                </Link>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}