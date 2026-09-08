// app/page.tsx
import React from 'react';
import { Space_Grotesk, IBM_Plex_Mono } from 'next/font/google';
import {
  getResumenKPIs,
  getRutasDisponibles,
  getFuentesDisponibles,
  getAerolineasDisponibles,
  getRegionesDisponibles,
  getTiposVueloDisponibles,
  getTablaItinerariosAlmundo,
  getConteosSegmento,
  getConteosFiltros
} from '@/lib/data';
import BarraFiltros from '@/components/BarraFiltros';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Tipografia deliberada (ver plan de diseno): Space Grotesk para titulos/labels
// -con caracter tecnico, no el Inter/system-default de cualquier dashboard- e
// IBM Plex Mono para TODA cifra (antes solo la tabla usaba mono), reforzando
// la lectura de "panel de instrumentos" en vez de tarjetas SaaS genericas.
// Ambos se cargan via next/font directamente en este archivo (no hace falta
// tocar layout.tsx).
const fontTitulo = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-heading'
});
const fontDato = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-data'
});

const heading = '[font-family:var(--font-heading)]';
const dato = '[font-family:var(--font-data)] tabular-nums';

interface PageProps {
  searchParams: Promise<{
    moneda?: string;
    ruta?: string;
    fuente?: string;
    aerolinea?: string;
    tipo_vuelo?: string;
    region?: string;
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
  const tipo_vuelo = params.tipo_vuelo || 'TODOS';
  const region = params.region || 'TODAS';
  const segmento = params.segmento || 'TODOS';
  const pagina = Math.max(1, parseInt(params.pagina || '1', 10));

  const [kpis, rutas, fuentes, aerolineas, regiones, tiposVuelo, resultadoPaginado, conteosSegmento, conteosFiltros] = await Promise.all([
    getResumenKPIs(moneda, ruta, fuente, aerolinea, tipo_vuelo, region),
    getRutasDisponibles(moneda),
    getFuentesDisponibles(moneda),
    getAerolineasDisponibles(moneda),
    getRegionesDisponibles(moneda, tipo_vuelo),
    getTiposVueloDisponibles(moneda),
    getTablaItinerariosAlmundo(moneda, ruta, fuente, aerolinea, tipo_vuelo, region, segmento, pagina, 50),
    getConteosSegmento(moneda, ruta, fuente, aerolinea, tipo_vuelo, region),
    getConteosFiltros({ moneda, ruta, fuente, aerolinea, tipo_vuelo, region })
  ]);

  const {
    itinerarios = [],
    totalRegistros = 0,
    totalPaginas = 1,
    paginaActual = 1,
    tamanoPagina = 50
  } = resultadoPaginado || {};

  const desdeRegistro = totalRegistros === 0 ? 0 : (paginaActual - 1) * tamanoPagina + 1;
  const hastaRegistro = Math.min(paginaActual * tamanoPagina, totalRegistros);

  const formatoPrecio = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '-';
    return moneda === 'USD'
      ? `USD ${Math.round(val).toLocaleString('es-AR')}`
      : `$ ${Math.round(val).toLocaleString('es-AR')}`;
  };

  const formatoGapMonto = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '-';
    const signo = val > 0 ? '+' : '';
    return moneda === 'USD'
      ? `${signo}USD ${Math.round(val).toLocaleString('es-AR')}`
      : `${signo}$ ${Math.round(val).toLocaleString('es-AR')}`;
  };

  const formatoGapPct = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '-';
    const signo = val > 0 ? '+' : '';
    return `${signo}${val.toFixed(1)}%`;
  };

  // Fix: URLSearchParams en vez de template string manual — evita romper la URL
  // cuando fuente/aerolinea/ruta traen espacios, & u otros caracteres especiales.
  const buildPageUrl = (targetPage: number, targetSegment?: string) => {
    const seg = targetSegment !== undefined ? targetSegment : segmento;
    const p = new URLSearchParams({
      moneda,
      ruta,
      fuente,
      aerolinea,
      tipo_vuelo,
      region,
      segmento: seg,
      pagina: String(targetPage)
    });
    return `/?${p.toString()}`;
  };

  const paginasVisibles: number[] = [];
  const startPage = Math.max(1, paginaActual - 2);
  const endPage = Math.min(totalPaginas, paginaActual + 2);
  for (let i = startPage; i <= endPage; i++) {
    paginasVisibles.push(i);
  }

  // Ticker de KPIs: una sola franja con divisores finos en vez de 7 tarjetas
  // identicas con el mismo shadow/radius (el cliche "SaaS-card kit").
  const kpiItems = [
    {
      label: 'Win Rate Almundo',
      value: `${kpis?.win_rate_almundo_pct ?? 0}%`,
      sub: 'buy box',
      color: (kpis?.win_rate_almundo_pct ?? 0) >= 30 ? 'text-emerald-400' : 'text-[#FF7A29]'
    },
    {
      label: 'Gap vs Líder',
      value: formatoGapPct(kpis?.gap_promedio_almundo_pct),
      sub: 'promedio',
      color: 'text-slate-100'
    },
    {
      label: 'Cobertura Almundo',
      value: `${kpis?.share_presencia_almundo_pct ?? 0}%`,
      sub: 'vuelos ofertados',
      color: (kpis?.share_presencia_almundo_pct ?? 0) >= 80 ? 'text-emerald-400' : 'text-amber-400'
    },
    {
      label: 'Markup vs Directo',
      value: formatoGapPct(kpis?.markup_promedio_directo_pct),
      sub: 'Almundo',
      color: 'text-slate-100'
    },
    {
      label: 'Ad Rank Media',
      value:
        kpis?.posicion_promedio_almundo !== null && kpis?.posicion_promedio_almundo !== undefined
          ? `#${kpis.posicion_promedio_almundo.toFixed(1)}`
          : 'N/D',
      sub: 'Almundo',
      color:
        kpis?.posicion_promedio_almundo !== null &&
        kpis?.posicion_promedio_almundo !== undefined &&
        kpis.posicion_promedio_almundo <= 2
          ? 'text-emerald-400'
          : 'text-[#FF7A29]'
    },
    {
      label: 'Pares Filtrados',
      value: (kpis?.total_vuelos_unicos ?? 0).toLocaleString('es-AR'),
      sub: 'combinaciones',
      color: 'text-sky-400'
    },
    {
      label: 'Tarifa Ganadora Media',
      value: formatoPrecio(kpis?.mejor_precio_promedio),
      sub: null,
      color: 'text-emerald-400'
    }
  ];

  // Mapa de estado -> color de acento para la barra izquierda de cada fila y
  // para el indicador de texto en la columna "Estado Almundo" (reemplaza los
  // badges/pill por un rail de color + punto, menos ruido a esta densidad).
  const acentoPorEstado: Record<string, { rail: string; dot: string; text: string; label: string }> = {
    WIN: { rail: '#34d399', dot: 'bg-emerald-400', text: 'text-emerald-400', label: 'Buy box win' },
    OPORTUNIDAD: { rail: '#38bdf8', dot: 'bg-sky-400', text: 'text-sky-300', label: 'Oportunidad' },
    MODERADO: { rail: '#fbbf24', dot: 'bg-amber-400', text: 'text-amber-300', label: 'Brecha media' },
    DESALINEADO: { rail: '#fb7185', dot: 'bg-rose-400', text: 'text-rose-300', label: 'Desalineado' },
    SIN_OFERTA: { rail: '#475569', dot: 'bg-slate-600', text: 'text-slate-500', label: 'Sin cobertura' }
  };

  // Color por tab alineado al mismo codigo que ya usa el resto del dashboard
  // (estadoColores mas arriba): Oportunidad=ambar, Despegar=celeste,
  // Desalineado=rosa. "Todos" se queda con el naranja de marca.
  const tabsSegmento = [
    { id: 'TODOS', label: 'Todos', cantidad: conteosSegmento.total, colorActivo: 'bg-[#FF5A00] text-white' },
    { id: 'OPORTUNIDADES', label: 'Oportunidades (≤3%)', cantidad: conteosSegmento.oportunidades, colorActivo: 'bg-amber-500 text-white' },
    { id: 'VS_DESPEGAR', label: 'Ganando a Despegar', cantidad: conteosSegmento.vs_despegar, colorActivo: 'bg-sky-500 text-white' },
    { id: 'DESALINEADOS', label: 'Desalineados (>7%)', cantidad: conteosSegmento.desalineados, colorActivo: 'bg-rose-500 text-white' }
  ];

  return (
    <div className={`${fontTitulo.variable} ${fontDato.variable} min-h-screen bg-[#080B14] text-slate-100 p-6 md:p-10 font-sans`}>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#FF5A00] opacity-60 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF5A00]" />
              </span>
              <span>Panel en vivo de tarifas Ida y Vuelta</span>
            </div>
            <h1 className={`${heading} text-2xl md:text-3xl font-semibold tracking-tight text-white mt-1.5`}>
              Matriz Operativa de Decisiones
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Benchmarking de Almundo contra competidores en metabuscadores, por itinerario completo
            </p>
          </div>

          <nav className="flex items-center gap-5 border-b border-white/10 md:border-0">
            <Link
              href={buildPageUrl(1)}
              className="relative pb-2 text-xs font-medium text-white"
            >
              Matriz Almundo
              <span className="absolute left-0 right-0 -bottom-px h-[2px] rounded-full bg-[#FF5A00]" />
            </Link>
            <Link
              href={`/graficos?moneda=${moneda}&ruta=${ruta}&fuente=${fuente}&aerolinea=${aerolinea}&tipo_vuelo=${tipo_vuelo}&region=${region}`}
              className="relative pb-2 text-xs font-medium text-slate-500 hover:text-slate-300 transition"
            >
              Gráficos & KPIs
            </Link>
            <Link
              href="/historial"
              className="relative pb-2 text-xs font-medium text-slate-500 hover:text-slate-300 transition"
            >
              Historial de Búsquedas
            </Link>
          </nav>
        </div>

        {/* Barra de Filtros con Metabuscador, Rutas y Aerolíneas */}
        <BarraFiltros
          moneda={moneda}
          fuente={fuente}
          ruta={ruta}
          aerolinea={aerolinea}
          tipoVuelo={tipo_vuelo}
          region={region}
          rutas={rutas}
          aerolineas={aerolineas}
          fuentes={fuentes}
          regiones={regiones}
          tiposVuelo={tiposVuelo}
          conteoRutas={conteosFiltros.porRuta}
          conteoRegiones={conteosFiltros.porRegion}
          conteoAerolineas={conteosFiltros.porAerolinea}
          conteoFuentes={conteosFiltros.porFuente}
        />

        {/* Ticker de KPIs — una sola franja con divisores finos, no 7 cards identicas */}
        <div className="rounded-2xl border border-white/10 bg-[#10182B] overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 divide-x divide-y xl:divide-y-0 divide-white/10">
            {kpiItems.map((item) => (
              <div key={item.label} className="p-4 md:p-5">
                <span className="text-[11px] text-slate-500">{item.label}</span>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className={`${dato} text-2xl font-semibold ${item.color}`}>{item.value}</span>
                </div>
                {item.sub && <span className="text-[10px] text-slate-600">{item.sub}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Tabla Centrada en Almundo (Round-trip) */}
        <div className="rounded-2xl border border-white/10 bg-[#10182B] overflow-hidden">

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 p-5">
            <div>
              <h2 className={`${heading} text-base font-semibold text-white`}>Detalle Operativo por Itinerario Completo</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Ordenado por mayor impacto en $ — mostrando <strong className="text-white">{desdeRegistro}</strong> a{' '}
                <strong className="text-white">{hastaRegistro}</strong> de <strong className="text-sky-400">{totalRegistros}</strong> pares de vuelos
              </p>
            </div>

            {/* Tabs de segmento como pills segmentadas (mismo tratamiento que
                el historial de búsquedas): color por significado + contador
                por tab + hover con fondo, en vez del subrayado plano de antes. */}
            <nav className="flex flex-wrap items-center gap-1 rounded-full border border-white/10 bg-[#050810] p-1">
              {tabsSegmento.map((tab) => (
                <Link
                  key={tab.id}
                  href={buildPageUrl(1, tab.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                    segmento === tab.id
                      ? tab.colorActivo
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
                >
                  {tab.label}{' '}
                  <span className={segmento === tab.id ? 'text-white/70' : 'text-slate-600'}>
                    · {tab.cantidad}
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#050810] text-slate-500 font-medium border-b border-white/10">
                <tr>
                  <th className="py-3 px-3">Ruta & Región</th>
                  <th className="py-3 px-3">Fechas (Ida ➔ Vuelta)</th>
                  <th className="py-3 px-2 text-center">AP / Est.</th>
                  <th className="py-3 px-3 text-right">Precio Almundo</th>
                  <th className="py-3 px-3 text-right">Líder Mercado</th>
                  <th className="py-3 px-3 text-right">Gap vs Líder</th>
                  <th className="py-3 px-3 text-right">vs Despegar</th>
                  <th className="py-3 px-3 text-center">Estado Almundo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {itinerarios.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                      No se encontraron itinerarios para los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  itinerarios.map((item, idx) => {
                    const tieneAlmundo = item.precio_almundo !== null;
                    const acento = acentoPorEstado[item.estado_almundo] ?? acentoPorEstado.SIN_OFERTA;

                    return (
                      // Fix: id_pareja_vuelo NO es unico por si solo -- el mismo vuelo
                      // (misma ruta/fechas/horarios) puede venir de dos fuentes distintas
                      // (TurismoCity y Kayak), cada una con su propia fila agregada (el
                      // query agrupa por id_pareja_vuelo + fuente). Se suma fuente + idx
                      // como desempate para garantizar unicidad real.
                      <tr key={`${item.id_pareja_vuelo}-${item.fuente}-${idx}`} className="hover:bg-white/[0.03] transition">

                        {/* 1. Ruta & Región — el rail de color a la izquierda reemplaza el
                            badge de estado repetido en cada fila (inset box-shadow en el
                            primer td, ya que el borde no renderiza de forma confiable en <tr>). */}
                        <td
                          className="py-3 px-3 whitespace-nowrap"
                          style={{ boxShadow: `inset 3px 0 0 0 ${acento.rail}` }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-sky-950/60 text-sky-300 font-semibold text-[11px] border border-sky-800/60">
                              {item.ruta}
                            </span>
                            <span className="text-[10px] text-slate-400 bg-[#050810] px-1.5 py-0.5 rounded border border-white/10">
                              {item.region}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                            <span className="font-semibold text-slate-300">{item.aerolinea}</span>
                            <span className="text-slate-600">/</span>
                            <span className="text-slate-500">{item.fuente}</span>
                          </div>
                        </td>

                        {/* 2. Fechas Ida y Vuelta */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="text-white font-medium flex items-center gap-1">
                            <span>{item.fecha_ida ? item.fecha_ida.slice(5) : '-'}</span>
                            <span className="text-slate-600">➔</span>
                            <span>{item.fecha_vuelta ? item.fecha_vuelta.slice(5) : '-'}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {item.dia_semana_ida} salida
                          </div>
                        </td>

                        {/* 3. Anticipación y Estadía */}
                        <td className="py-3 px-2 text-center whitespace-nowrap">
                          <span className={`${dato} text-slate-300 text-[11px] bg-[#050810] px-2 py-0.5 rounded border border-white/10`}>
                            {item.dias_anticipacion}d / <strong className="text-sky-400">{item.dias_estadia}d</strong>
                          </span>
                        </td>

                        {/* 4. Precio Almundo */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          {tieneAlmundo ? (
                            <div>
                              <span className={`${dato} font-semibold text-[13px] ${item.estado_almundo === 'WIN' ? 'text-[#FF5A00]' : 'text-white'}`}>
                                {formatoPrecio(item.precio_almundo)}
                              </span>
                              <div className={`${dato} text-[10px] text-slate-500`}>
                                Posición #{item.posicion_almundo ?? 'N/D'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-600 italic text-[11px]">Sin oferta</span>
                          )}
                        </td>

                        {/* 5. Mejor Precio */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className={`${dato} font-semibold text-emerald-400 text-[13px]`}>
                            {formatoPrecio(item.mejor_precio_mercado)}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[130px] ml-auto" title={item.vendedor_ganador}>
                            {item.vendedor_ganador}
                          </div>
                        </td>

                        {/* 6. Gap vs Líder */}
                        <td className={`${dato} py-3 px-3 text-right whitespace-nowrap`}>
                          {tieneAlmundo ? (
                            <div>
                              <div className={`font-semibold ${acento.text}`}>
                                {formatoGapPct(item.gap_min_pct)}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {formatoGapMonto(item.gap_min_monto)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-700">-</span>
                          )}
                        </td>

                        {/* 7. Spread vs Despegar */}
                        <td className={`${dato} py-3 px-3 text-right whitespace-nowrap`}>
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
                            <span className="text-slate-700 text-[11px]">N/D</span>
                          )}
                        </td>

                        {/* 8. Estado Almundo — punto + texto de color en vez de pill,
                            baja "ruido" de badges repetidos a esta densidad. */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${acento.text}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${acento.dot}`} />
                            {acento.label}
                          </span>
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
            <div className="p-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs">
              <div className="text-slate-400 text-center sm:text-left">
                Página <span className="font-semibold text-white">{paginaActual}</span> de <span className="font-semibold text-white">{totalPaginas}</span>
              </div>

              <div className={`${dato} flex items-center justify-center gap-1.5 flex-wrap`}>
                <Link
                  href={buildPageUrl(Math.max(1, paginaActual - 1))}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-1 ${
                    paginaActual <= 1
                      ? 'border-white/5 text-slate-700 pointer-events-none bg-[#050810]/40'
                      : 'border-white/10 bg-[#050810] text-slate-300 hover:text-white hover:border-white/20'
                  }`}
                  aria-disabled={paginaActual <= 1}
                >
                  ← Anterior
                </Link>

                {startPage > 1 && (
                  <>
                    <Link
                      href={buildPageUrl(1)}
                      className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-[#050810] text-slate-400 hover:text-white hover:border-white/20 transition"
                    >
                      1
                    </Link>
                    {startPage > 2 && <span className="px-1 text-slate-700">...</span>}
                  </>
                )}

                {paginasVisibles.map((p) => (
                  <Link
                    key={p}
                    href={buildPageUrl(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      p === paginaActual
                        ? 'bg-[#FF5A00] text-white shadow-md shadow-[#FF5A00]/20'
                        : 'border border-white/10 bg-[#050810] text-slate-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {p}
                  </Link>
                ))}

                {endPage < totalPaginas && (
                  <>
                    {endPage < totalPaginas - 1 && <span className="px-1 text-slate-700">...</span>}
                    <Link
                      href={buildPageUrl(totalPaginas)}
                      className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-[#050810] text-slate-400 hover:text-white hover:border-white/20 transition"
                    >
                      {totalPaginas}
                    </Link>
                  </>
                )}

                <Link
                  href={buildPageUrl(Math.min(totalPaginas, paginaActual + 1))}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-1 ${
                    paginaActual >= totalPaginas
                      ? 'border-white/5 text-slate-700 pointer-events-none bg-[#050810]/40'
                      : 'border-white/10 bg-[#050810] text-slate-300 hover:text-white hover:border-white/20'
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