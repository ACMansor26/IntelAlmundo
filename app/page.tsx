// app/page.tsx
import { calcularMejora, diferenciaTarifaPct, PISO_FEE_PCT, UMBRAL_ALERTA_TARIFA_PCT } from '@/lib/mejora';
import React from 'react';
import {
  getResumenKPIs,
  getRutasDisponibles,
  getFuentesDisponibles,
  getAerolineasDisponibles,
  getRegionesDisponibles,
  getTiposVueloDisponibles,
  getTablaItinerariosAlmundo,
  getConteosSegmento,
  getMejoraAgregada,
  getConteosFiltros,
  getCompetidoresDisponibles,
  getInfoActualizacion
} from '@/lib/data';
import BarraFiltros from '@/components/BarraFiltros';
import Link from 'next/link';
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import ConMarca from '@/components/ConMarca';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Tipografia deliberada (ver plan de diseno): Space Grotesk para titulos/labels
// -con caracter tecnico, no el Inter/system-default de cualquier dashboard- e
// IBM Plex Mono para TODA cifra (antes solo la tabla usaba mono), reforzando
// la lectura de "panel de instrumentos" en vez de tarjetas SaaS genericas.
// Ambos se cargan via next/font directamente en este archivo (no hace falta
// tocar layout.tsx).
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
    competidor?: string;
    fecha?: string;
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
  const competidor = params.competidor || 'TODOS';
  const fecha = params.fecha || 'ULTIMA';
  const filtros = { moneda, ruta, fuente, aerolinea, tipo_vuelo, region, fecha, competidor };

  const [kpis, rutas, fuentes, aerolineas, regiones, tiposVuelo, competidores, resultadoPaginado, conteosSegmento, conteosFiltros, infoActualizacion, mejoraAgregada] = await Promise.all([
    getResumenKPIs(filtros),
    getRutasDisponibles(moneda),
    getFuentesDisponibles(moneda),
    getAerolineasDisponibles(moneda),
    getRegionesDisponibles(moneda, tipo_vuelo),
    getTiposVueloDisponibles(moneda),
    getCompetidoresDisponibles(moneda),
    getTablaItinerariosAlmundo(filtros, ruta, fuente, aerolinea, tipo_vuelo, region, segmento, pagina, 50, competidor),
    getConteosSegmento(filtros, ruta, fuente, aerolinea, tipo_vuelo, region, competidor),
    getConteosFiltros({ moneda, ruta, fuente, aerolinea, tipo_vuelo, region, fecha }),
    getInfoActualizacion(),
    getMejoraAgregada(filtros, ruta, fuente, aerolinea, tipo_vuelo, region, competidor)
  ]);

  const errorConsulta = resultadoPaginado?.error;
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

  // dd/mm en vez de "YYYY-MM-DD" crudo o el viejo slice(5) que daba "MM-DD".
  const formatoFechaCorta = (f: string | null | undefined) => {
    if (!f) return '-';
    const [, mes, dia] = f.split('-');
    return `${dia}/${mes}`;
  };

  // "HH:MM" recortado a 5 chars por si Postgres devuelve "HH:MM:SS".
  const formatoHora = (h: string | null | undefined) => {
    if (!h) return null;
    return h.slice(0, 5);
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
      pagina: String(targetPage),
      competidor,
      fecha
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
  const kpiItems: { label: string; value: string; sub: string | null; color: string; href?: string; resaltar?: boolean }[] = [
    {
      label: 'Alerta tarifa base',
      value: conteosSegmento.alerta_tarifa.toLocaleString('es-AR'),
      sub: `tarifa base +${UMBRAL_ALERTA_TARIFA_PCT}% sobre la competencia`,
      color: conteosSegmento.alerta_tarifa > 0 ? 'text-amber-300' : 'text-emerald-400',
      href: buildPageUrl(1, 'ALERTA_TARIFA'),
      resaltar: conteosSegmento.alerta_tarifa > 0
    },
    {
      label: 'Alerta comisión',
      value: conteosSegmento.bajo_piso.toLocaleString('es-AR'),
      sub: `fee bajo el ${PISO_FEE_PCT}%`,
      color: conteosSegmento.bajo_piso > 0 ? 'text-fuchsia-300' : 'text-emerald-400',
      href: buildPageUrl(1, 'ALERTA_COMISION'),
      resaltar: conteosSegmento.bajo_piso > 0
    },
    {
      label: 'Filas a revisar',
      value: (kpis?.filas_a_revisar ?? 0).toLocaleString('es-AR'),
      sub: 'checkout ≠ listado (>5%)',
      color: (kpis?.filas_a_revisar ?? 0) > 0 ? 'text-amber-400' : 'text-emerald-400',
      href: buildPageUrl(1, 'A_REVISAR')
    },
    {
      label: 'Cobertura Almundo',
      value: `${kpis?.share_presencia_almundo_pct ?? 0}%`,
      sub: 'vuelos ofertados',
      color: (kpis?.share_presencia_almundo_pct ?? 0) >= 80 ? 'text-emerald-400' : 'text-amber-400'
    }
  ];

  // Mapa de estado -> color de acento para la barra izquierda de cada fila y
  // para el indicador de texto en la columna "Estado Almundo" (reemplaza los
  // badges/pill por un rail de color + punto, menos ruido a esta densidad).
  const acentoPorEstado: Record<string, { rail: string; dot: string; text: string; label: string }> = {
    GANANDO: { rail: '#34d399', dot: 'bg-emerald-400', text: 'text-emerald-400', label: 'Más barato' },
    CERRABLE: { rail: '#38bdf8', dot: 'bg-sky-400', text: 'text-sky-300', label: 'Cerrable con fee' },
    FUERA_ALCANCE: { rail: '#fb7185', dot: 'bg-rose-400', text: 'text-rose-300', label: 'Fuera de alcance' },
    SIN_COMPARACION: { rail: '#64748b', dot: 'bg-slate-500', text: 'text-slate-400', label: 'Sin comparación' }
  };

  // Color por tab alineado al mismo codigo que ya usa el resto del dashboard
  // (estadoColores mas arriba): Oportunidad=ambar, Despegar=celeste,
  // Desalineado=rosa. "Todos" se queda con el naranja de marca.
  const tabsSegmento = [
    { id: 'TODOS', label: 'Todos', cantidad: conteosSegmento.total, colorActivo: 'bg-[color:var(--acc)] text-white' },
    { id: 'ALERTA_TARIFA', label: 'Alerta tarifa base', cantidad: conteosSegmento.alerta_tarifa, colorActivo: 'bg-amber-500 text-white' },
    { id: 'ALERTA_COMISION', label: 'Alerta comisión', cantidad: conteosSegmento.bajo_piso, colorActivo: 'bg-fuchsia-600 text-white' },
    { id: 'A_REVISAR', label: 'A revisar', cantidad: conteosSegmento.a_revisar, colorActivo: 'bg-amber-600 text-white' }
  ];

  return (
    <div className={`min-h-screen text-slate-100 p-6 md:p-10`}>
      <div className="max-w-7xl mx-auto space-y-8">

        <AppHeader
          activo="matriz"
          estado="Panel en vivo de tarifas Ida y Vuelta"
          titulo="Matriz Operativa de Decisiones"
          subtitulo="Benchmarking de Almundo contra competidores en metabuscadores, por itinerario completo"
          hrefMatriz={buildPageUrl(1)}
          hrefGraficos={`/graficos?${new URLSearchParams({ moneda, ruta, fuente, aerolinea, tipo_vuelo, region, fecha, ...(competidor !== 'TODOS' ? { competidor } : {}) }).toString()}`}
          actualizado={infoActualizacion.ultima}
          horasDesdeActualizacion={infoActualizacion.horas}
        />

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
          competidor={competidor}
          competidores={competidores}
          permitirTodos
          fecha={fecha}
          fechas={infoActualizacion.fechas}
          fuentesAtrasadas={infoActualizacion.fuentesAtrasadas}
          conteoRutas={conteosFiltros.porRuta}
          conteoRegiones={conteosFiltros.porRegion}
          conteoAerolineas={conteosFiltros.porAerolinea}
          conteoFuentes={conteosFiltros.porFuente}
        />

        {/* KPIs: lo accionable primero; las alertas llevan directo a su pestaña */}
        <div className="zona-carga grid grid-cols-2 xl:grid-cols-4 gap-3">
          {kpiItems.map((item) => {
            const clase = `relative overflow-hidden rounded-2xl border bg-gradient-to-b from-[color:var(--surf2)] to-[color:var(--surf)] p-4 block ${
              item.resaltar ? 'border-amber-400/40' : 'border-white/10'
            } ${item.href ? 'transition-colors hover:border-white/30' : ''}`;
            const contenido = (
              <>
                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[color:var(--acc)] to-[color:var(--acc)]/0" />
                <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-slate-400"><ConMarca texto={item.label} /></span>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className={`${dato} text-3xl font-bold leading-none tracking-[-0.02em] whitespace-nowrap ${item.color}`}>{item.value}</span>
                </div>
                {item.sub && <span className="mt-1.5 block text-[0.6875rem] text-slate-400">{item.sub}</span>}
              </>
            );
            return item.href ? (
              <Link key={item.label} href={item.href} className={clase}>{contenido}</Link>
            ) : (
              <div key={item.label} className={clase}>{contenido}</div>
            );
          })}
        </div>

        {/* Dónde rinde más bajar el fee: suma por ruta y aerolínea sobre todos los vuelos filtrados */}
        {(mejoraAgregada.rutas.length > 0 || mejoraAgregada.aerolineas.length > 0) && (
          <details className="group rounded-2xl border border-white/10 bg-[color:var(--surf)] overflow-hidden">
            <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer flex items-center justify-between gap-3 px-5 py-4 hover:bg-white/[0.03] transition">
              <div>
                <h2 className={`${heading} text-base font-semibold text-white`}>Dónde rinde más bajar el fee</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {conteosSegmento.cerrables.toLocaleString('es-AR')} vuelos se igualan al más barato bajando el fee hasta el piso de {PISO_FEE_PCT}% ·
                  {' '}{formatoPrecio(mejoraAgregada.rutas.reduce((s, f) => s + f.fee_a_ceder, 0))} de fee a ceder en total
                </p>
              </div>
              <ChevronDown aria-hidden="true" className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
            </summary>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 p-5 pt-1 border-t border-white/5 bg-[color:var(--sunk)]/60">
              {[
                { titulo: 'Por ruta', filas: mejoraAgregada.rutas },
                { titulo: 'Por aerolínea', filas: mejoraAgregada.aerolineas }
              ].map((bloque) => (
                <div key={bloque.titulo} className="overflow-x-auto rounded-xl border border-white/10 bg-[color:var(--surf)]">
                  <table className="w-full text-xs text-slate-300">
                    <caption className="text-left px-3 pt-3 pb-1 text-[0.6875rem] uppercase tracking-wide text-slate-400">{bloque.titulo} · top 8 por fee a ceder</caption>
                    <thead className="text-slate-400 border-b border-white/10">
                      <tr>
                        <th scope="col" className="py-2 px-3 text-left font-medium">{bloque.titulo === 'Por ruta' ? 'Ruta' : 'Aerolínea'}</th>
                        <th scope="col" className="py-2 px-3 text-right font-medium">Cerrables</th>
                        <th scope="col" className="py-2 px-3 text-right font-medium">Fee a ceder</th>
                        <th scope="col" className="py-2 px-3 text-right font-medium">Fuera de alcance</th>
                        <th scope="col" className="py-2 px-3 text-right font-medium">Sin cubrir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {bloque.filas.slice(0, 8).map((f) => (
                        <tr key={f.clave}>
                          <th scope="row" className="py-2 px-3 text-left font-semibold text-slate-200">{f.clave}</th>
                          <td className={`${dato} py-2 px-3 text-right text-sky-300`}>{f.cerrables}</td>
                          <td className={`${dato} py-2 px-3 text-right`}>{formatoPrecio(f.fee_a_ceder)}</td>
                          <td className={`${dato} py-2 px-3 text-right text-rose-300`}>{f.fuera_alcance}</td>
                          <td className={`${dato} py-2 px-3 text-right`}>{formatoPrecio(f.residuo)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Tabla Centrada en Almundo (Round-trip) */}
        <div className="rounded-2xl border border-white/10 bg-[color:var(--surf)] overflow-hidden">

          <div className="flex flex-col gap-4 border-b border-white/10 p-5">
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
            <nav aria-label="Segmentos" className="flex flex-nowrap items-center gap-1 overflow-x-auto self-start max-w-full rounded-full border border-white/10 bg-[color:var(--sunk2)] p-1">
              {tabsSegmento.map((tab) => (
                <Link
                  key={tab.id}
                  href={buildPageUrl(1, tab.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                    segmento === tab.id
                      ? tab.colorActivo
                      : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
                  }`}
                >
                  {tab.label}{' '}
                  <span className={segmento === tab.id ? 'text-white/70' : 'text-slate-400'}>
                    · {tab.cantidad}
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Lista de vuelos como cards de metabuscador: cerrada muestra aerolínea,
              ruta y horarios; al abrirla (click) se despliega el desglose real del
              checkout por vendedor. <details> nativo = sin JS en el cliente. */}
          <div className="zona-carga space-y-3 p-4">
            {errorConsulta ? (
              <div role="alert" className="rounded-xl border border-rose-800/60 bg-rose-950/40 py-8 px-4 text-center text-rose-300 text-xs">
                <p className="font-semibold text-sm">{errorConsulta}</p>
                <p className="mt-1 text-rose-400">Esto no es &quot;sin resultados&quot;: la consulta falló.</p>
              </div>
            ) : itinerarios.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No se encontraron itinerarios para los filtros seleccionados.
              </div>
            ) : (
              itinerarios.map((item, idx) => {
                const acento = acentoPorEstado[item.estado_mejora] ?? acentoPorEstado.SIN_COMPARACION;
                const mejora = calcularMejora(item.vendedores ?? [], competidor);
                const mejorComp = mejora && mejora.vs.length > 0 ? mejora.vs.reduce((m, x) => (x.precio_competidor < m.precio_competidor ? x : m)) : null;
                const almundoTarifa = (item.vendedores ?? []).find((v) => v.vendedor === 'Almundo')?.tarifa_base ?? null;
                const vendedores = item.vendedores ?? [];
                const filas: { label: string; key: 'tarifa_base' | 'impuestos' | 'tasas' | 'cargos' | 'cargo_gestion' | 'precio_sin_fee' | 'precio_total' | 'precio_listado_vendedor'; fuerte?: boolean }[] = [
                  { label: 'Tarifa base', key: 'tarifa_base' },
                  { label: 'Impuestos', key: 'impuestos' },
                  { label: 'Tasas', key: 'tasas' },
                  { label: 'Cargos (service fee)', key: 'cargos' },
                  { label: 'Fee del vendedor', key: 'cargo_gestion' },
                  { label: 'Precio sin fee', key: 'precio_sin_fee', fuerte: true },
                  { label: 'Precio final', key: 'precio_total', fuerte: true },
                  { label: 'Listado del metabuscador', key: 'precio_listado_vendedor' }
                ];
                const si = (v: string | null) => (v === 'SI' ? 'Incluido' : v === 'NO' ? 'No incluido' : v ?? 'N/D');

                return (
                  // id_pareja_vuelo no es unico por si solo (misma lectura en varias
                  // fuentes): se suma fuente + idx como desempate.
                  <details key={`${item.id_pareja_vuelo}-${item.fuente}-${idx}`} className="group rounded-xl border border-white/10 bg-[color:var(--surf)] overflow-hidden open:border-[color:var(--acc)]/40 open:shadow-lg open:shadow-black/30 transition-colors">
                    <summary
                      className="list-none [&::-webkit-details-marker]:hidden cursor-pointer px-4 py-3.5 hover:bg-white/[0.03] transition"
                      style={{ boxShadow: `inset 3px 0 0 0 ${acento.rail}` }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-[minmax(140px,1fr)_minmax(0,1.4fr)_minmax(0,1.4fr)_minmax(120px,auto)_auto] gap-3 md:gap-5 items-center">

                        {/* Aerolínea + ruta */}
                        <div>
                          <div className="text-[13px] font-semibold text-white">{item.aerolinea}</div>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-sky-950/60 text-sky-300 font-semibold text-[11px] border border-sky-800/60">
                              {item.ruta}
                            </span>
                            <span className="text-[0.6875rem] text-slate-400 bg-[color:var(--sunk2)] px-1.5 py-0.5 rounded border border-white/10">
                              {item.region}
                            </span>
                          </div>
                        </div>

                        {/* Tramo de ida y de vuelta: fecha, salida → llegada, nº de vuelo */}
                        {[
                          { titulo: 'Ida', fecha: item.fecha_ida, salida: item.hora_salida_ida, llegada: item.hora_llegada_ida, nro: item.numero_vuelo_ida, esc: item.escalas_ida, desde: item.aeropuerto_salida_ida ?? item.origen, hasta: item.aeropuerto_llegada_ida ?? item.destino },
                          { titulo: 'Vuelta', fecha: item.fecha_vuelta, salida: item.hora_salida_vuelta, llegada: item.hora_llegada_vuelta, nro: item.numero_vuelo_vuelta, esc: item.escalas_vuelta, desde: item.aeropuerto_salida_vuelta ?? item.destino, hasta: item.aeropuerto_llegada_vuelta ?? item.origen }
                        ].map((t) => (
                          <div key={t.titulo}>
                            <div className="text-[0.6875rem] uppercase tracking-wide text-slate-400">
                              {t.titulo} · <span className="text-slate-300 normal-case">{formatoFechaCorta(t.fecha)}</span>
                            </div>
                            <div className={`${dato} text-[15px] font-semibold text-white mt-0.5`}>
                              {formatoHora(t.salida) ?? '--:--'}
                              <ArrowRight aria-hidden="true" className="inline h-4 w-4 mx-1 text-slate-400" />
                              {formatoHora(t.llegada) ?? '--:--'}
                            </div>
                            <div className={`${dato} text-[0.6875rem] text-slate-400 mt-0.5`}>
                              {t.desde ?? ''}{t.desde && t.hasta ? <ArrowRight aria-hidden="true" className="inline h-3 w-3 mx-0.5" /> : null}{t.hasta ?? ''}
                              {t.nro ? ` · ${t.nro}` : ''}
                              {' · '}
                              {(t.esc ?? 0) > 0
                                ? <span className="text-amber-400">{t.esc} escala{(t.esc ?? 0) > 1 ? 's' : ''}</span>
                                : 'Directo'}
                            </div>
                          </div>
                        ))}

                        {/* Precio final de Almundo y diferencia contra el competidor mas barato */}
                        <div className="md:text-right">
                          <div className={`${dato} text-lg font-semibold leading-tight tracking-[-0.01em] text-white`}>
                            {item.precio_total_almundo !== null ? formatoPrecio(item.precio_total_almundo) : 'Sin precio'}
                          </div>
                          {mejorComp ? (
                            <div className={`${dato} text-[0.6875rem] mt-0.5 ${mejorComp.diferencia_monto <= 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                              {formatoGapPct(Math.round(mejorComp.diferencia_pct * 10) / 10)} vs {mejorComp.competidor}
                            </div>
                          ) : (
                            <div className="text-[0.6875rem] mt-0.5 text-slate-400">sin comparación</div>
                          )}
                        </div>

                        {/* Un solo estado + alertas; el detalle por competidor va en el desplegable */}
                        <div className="flex items-center justify-between md:justify-end gap-3">
                          <div className="flex flex-col items-start md:items-end gap-1">
                            <span className={`inline-flex items-center gap-1.5 text-[0.6875rem] font-semibold ${acento.text}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${acento.dot}`} />
                              {acento.label}
                            </span>
                            {item.alerta_tarifa_base && (
                              <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[0.6875rem] font-semibold text-amber-300">
                                Tarifa base {formatoGapPct(item.tarifa_dif_pct)}
                              </span>
                            )}
                            {item.bajo_piso_fee && (
                              <span className="rounded-full border border-fuchsia-400/40 bg-fuchsia-400/10 px-2 py-0.5 text-[0.6875rem] font-semibold text-fuchsia-300">
                                Comisión &lt;{PISO_FEE_PCT}%
                              </span>
                            )}
                            <span className="text-[0.6875rem] text-slate-400">{item.fuente}</span>
                          </div>
                          <ChevronDown aria-hidden="true" className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
                        </div>
                      </div>
                    </summary>

                    {/* Desplegable: desglose del checkout por vendedor */}
                    <div className="px-4 pb-5 pt-1 bg-[color:var(--sunk)]/60 border-t border-white/5">
                      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-5 pt-4">

                        <div className="space-y-3 text-xs">
                          <div className="space-y-3">
                            <div className="text-[0.6875rem] uppercase tracking-wide text-slate-400">Itinerario</div>
                            {[
                              { titulo: 'Vuelo de ida', aerolinea: item.aerolinea, nro: item.numero_vuelo_ida, fecha: item.fecha_ida, salida: item.hora_salida_ida, desde: item.aeropuerto_salida_ida ?? item.origen, fechaLlegada: item.fecha_llegada_ida, llegada: item.hora_llegada_ida, hasta: item.aeropuerto_llegada_ida ?? item.destino, esc: item.escalas_ida },
                              { titulo: 'Vuelo de vuelta', aerolinea: item.aerolinea_vuelta ?? item.aerolinea, nro: item.numero_vuelo_vuelta, fecha: item.fecha_vuelta, salida: item.hora_salida_vuelta, desde: item.aeropuerto_salida_vuelta ?? item.destino, fechaLlegada: item.fecha_llegada_vuelta, llegada: item.hora_llegada_vuelta, hasta: item.aeropuerto_llegada_vuelta ?? item.origen, esc: item.escalas_vuelta }
                            ].map((t) => (
                              <div key={t.titulo} className="rounded-lg border border-white/10 bg-[color:var(--sunk)] p-2.5">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[11px] font-semibold text-white">{t.titulo}</span>
                                  <span className={`${dato} text-[11px] font-semibold text-[color:var(--acc2)]`}>{t.nro ?? 'N/D'}</span>
                                </div>
                                <div className="text-slate-300 mt-0.5">{t.aerolinea}{t.nro ? ` ${t.nro}` : ''}</div>
                                <div className={`${dato} mt-1.5 text-slate-200`}>
                                  <span className="text-white font-semibold">{formatoHora(t.salida) ?? '--:--'}</span>
                                  <span className="text-slate-400"> {t.desde ?? ''} · {formatoFechaCorta(t.fecha)}</span>
                                </div>
                                <div className={`${dato} text-slate-200`}>
                                  <span className="text-white font-semibold">{formatoHora(t.llegada) ?? '--:--'}</span>
                                  <span className="text-slate-400"> {t.hasta ?? ''} · {formatoFechaCorta(t.fechaLlegada ?? t.fecha)}</span>
                                </div>
                                <div className="mt-1 text-[11px]">
                                  {(t.esc ?? 0) > 0
                                    ? <span className="text-amber-400">{t.esc} escala{(t.esc ?? 0) > 1 ? 's' : ''}</span>
                                    : <span className="text-slate-400">Directo</span>}
                                </div>
                              </div>
                            ))}
                            <div className={`${dato} text-slate-300`}>
                              Anticipación <span className="font-semibold text-white">{item.dias_anticipacion}d</span>
                              <span className="text-slate-400"> · </span>
                              Estadía <span className="font-semibold text-white">{item.dias_estadia}d</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-[0.6875rem] uppercase tracking-wide text-slate-400 mb-1">Equipaje</div>
                            <div className="text-slate-300 space-y-0.5">
                              <div>Mochila: <span className="text-slate-400">{si(item.equipaje_mochila)}</span></div>
                              <div>Mano: <span className="text-slate-400">{si(item.equipaje_mano)}</span></div>
                              <div>Bodega: <span className="text-slate-400">{si(item.equipaje_bodega)}</span></div>
                            </div>
                          </div>
                          <div>
                            <div className="text-[0.6875rem] uppercase tracking-wide text-slate-400 mb-1"><ConMarca texto="Posición de Almundo" /></div>
                            <div className="text-slate-300">
                              {item.precio_almundo !== null
                                ? <>Líder: <span className="text-emerald-400 font-semibold">{item.vendedor_ganador}</span> · gap {formatoGapPct(item.gap_min_pct)} ({formatoGapMonto(item.gap_min_monto)})</>
                                : 'Almundo no se pudo leer en este vuelo'}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4 min-w-0">
                        <div className="overflow-x-auto rounded-xl border border-white/10 bg-[color:var(--surf)]">
                          <table className="w-full text-xs text-slate-300">
                            <thead className="text-slate-400 border-b border-white/10">
                              <tr>
                                <th className="py-2 px-3 text-left font-medium">Desglose del checkout</th>
                                {vendedores.map((v) => (
                                  <th key={v.vendedor} className="py-2 px-3 text-right font-semibold text-slate-200 whitespace-nowrap">
                                    {v.vendedor}
                                    {v.es_mas_barato && <span className="ml-1.5 text-[0.625rem] font-semibold text-emerald-400">MÁS BARATO</span>}
                                    {v.a_revisar && <span className="ml-1.5 text-[0.625rem] font-semibold text-amber-400">A REVISAR</span>}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {vendedores.length === 0 && (
                                <tr><td className="py-4 px-3 text-slate-400">Sin lecturas de checkout para este vuelo.</td></tr>
                              )}
                              {vendedores.length > 0 && filas.map((f) => (
                                <tr key={f.key} className={f.fuerte ? 'bg-white/[0.03]' : ''}>
                                  <td className={`py-2 px-3 ${f.fuerte ? 'font-semibold text-slate-200' : 'text-slate-400'}`}>{f.label}</td>
                                  {vendedores.map((v) => (
                                    <td key={v.vendedor} className={`${dato} py-2 px-3 text-right whitespace-nowrap ${f.fuerte ? 'font-semibold text-white' : ''}`}>
                                      {formatoPrecio(v[f.key])}
                                      {f.key === 'cargo_gestion' && v.pct_fee !== null && (
                                        <span className="text-[0.6875rem] text-slate-400"> ({v.pct_fee.toFixed(1)}%)</span>
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                              {vendedores.length > 0 && almundoTarifa !== null && (
                                <tr>
                                  <td className="py-2 px-3 text-slate-400">Tarifa base de Almundo vs este vendedor</td>
                                  {vendedores.map((v) => {
                                    const dif = v.vendedor === 'Almundo' || v.a_revisar ? null : diferenciaTarifaPct(almundoTarifa, v.tarifa_base);
                                    return (
                                      <td key={v.vendedor} className={`${dato} py-2 px-3 text-right whitespace-nowrap ${dif !== null && dif >= UMBRAL_ALERTA_TARIFA_PCT ? 'text-amber-300 font-semibold' : 'text-slate-400'}`}>
                                        {dif === null ? '-' : formatoGapPct(Math.round(dif * 10) / 10)}
                                      </td>
                                    );
                                  })}
                                </tr>
                              )}
                              {vendedores.length > 0 && (
                                <tr>
                                  <td className="py-2 px-3 text-slate-400">Checkout vs listado</td>
                                  {vendedores.map((v) => (
                                    <td key={v.vendedor} className={`${dato} py-2 px-3 text-right whitespace-nowrap ${v.a_revisar ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}>
                                      {v.pct_dif_checkout_vs_listado !== null ? formatoGapPct(v.pct_dif_checkout_vs_listado) : 'N/D'}
                                    </td>
                                  ))}
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        {mejora && (
                          <div className="overflow-x-auto rounded-xl border border-white/10 bg-[color:var(--surf)]">
                            <div className="px-3 pt-3 pb-1 text-[0.6875rem] uppercase tracking-wide text-slate-400">
                              Margen de mejora del fee · fee actual {formatoPrecio(mejora.fee_actual_monto)} ({mejora.fee_actual_pct.toFixed(1)}%) · piso {PISO_FEE_PCT}% = {formatoPrecio(mejora.fee_piso_monto)} · bajable sin pérdida {formatoPrecio(mejora.margen_monto)} ({mejora.margen_pct.toFixed(1)} pp)
                            </div>
                            {mejora.bajo_piso && (
                              <div className="mx-3 mb-2 rounded-lg border border-fuchsia-500/40 bg-fuchsia-500/10 px-3 py-1.5 text-[11px] text-fuchsia-200">
                                Almundo ya cobra menos del {PISO_FEE_PCT}% de fee en este vuelo: está vendiendo por debajo de lo que se lleva el metabuscador.
                              </div>
                            )}
                            {mejora.vs.length === 0 ? (
                              <div className="px-3 pb-3 text-xs text-slate-400">Sin competidores comparables (leídos y no marcados a revisar) en este vuelo.</div>
                            ) : (
                              <table className="w-full text-xs text-slate-300">
                                <thead className="text-slate-400 border-b border-white/10">
                                  <tr>
                                    <th className="py-2 px-3 text-left font-medium">vs competidor</th>
                                    <th className="py-2 px-3 text-right font-medium">Precio final</th>
                                    <th className="py-2 px-3 text-right font-medium">Diferencia</th>
                                    <th className="py-2 px-3 text-right font-medium">Fee a bajar</th>
                                    <th className="py-2 px-3 text-right font-medium">Mejora en $</th>
                                    <th className="py-2 px-3 text-right font-medium">Queda</th>
                                    <th className="py-2 px-3 text-left font-medium">Resultado</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                  {mejora.vs.map((m) => (
                                    <tr key={m.competidor}>
                                      <td className="py-2 px-3 font-semibold text-slate-200">{m.competidor}</td>
                                      <td className={`${dato} py-2 px-3 text-right`}>{formatoPrecio(m.precio_competidor)}</td>
                                      <td className={`${dato} py-2 px-3 text-right`}>{formatoGapPct(m.diferencia_pct)} ({formatoGapMonto(m.diferencia_monto)})</td>
                                      <td className={`${dato} py-2 px-3 text-right`}>{m.estado === 'GANANDO' ? '-' : `-${m.mejora_pct_fee.toFixed(1)} pp`}</td>
                                      <td className={`${dato} py-2 px-3 text-right`}>{m.estado === 'GANANDO' ? '-' : formatoPrecio(m.mejora_monto)}</td>
                                      <td className={`${dato} py-2 px-3 text-right ${m.residuo_monto > 0 ? 'text-rose-300' : ''}`}>{m.residuo_monto > 0 ? <>{formatoPrecio(m.residuo_monto)}{m.residuo_pct_tarifa !== null && <span className="text-[0.6875rem] text-slate-400"> ({m.residuo_pct_tarifa.toFixed(1)}% de la tarifa base)</span>}</> : '-'}</td>
                                      <td className={`py-2 px-3 font-semibold ${acentoPorEstado[m.estado].text}`}>{acentoPorEstado[m.estado].label}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        )}
                        </div>

                      </div>
                    </div>
                  </details>
                );
              })
            )}
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
                      ? 'border-white/5 text-slate-700 pointer-events-none bg-[color:var(--sunk2)]/40'
                      : 'border-white/10 bg-[color:var(--sunk2)] text-slate-300 hover:text-white hover:border-white/20'
                  }`}
                  aria-disabled={paginaActual <= 1}
                >
                  <ChevronLeft aria-hidden="true" className="h-3.5 w-3.5" /> Anterior
                </Link>

                {startPage > 1 && (
                  <>
                    <Link
                      href={buildPageUrl(1)}
                      className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-[color:var(--sunk2)] text-slate-400 hover:text-white hover:border-white/20 transition"
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
                        ? 'bg-[color:var(--acc)] text-white shadow-md shadow-[color:var(--acc)]/20'
                        : 'border border-white/10 bg-[color:var(--sunk2)] text-slate-400 hover:text-white hover:border-white/20'
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
                      className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-[color:var(--sunk2)] text-slate-400 hover:text-white hover:border-white/20 transition"
                    >
                      {totalPaginas}
                    </Link>
                  </>
                )}

                <Link
                  href={buildPageUrl(Math.min(totalPaginas, paginaActual + 1))}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-1 ${
                    paginaActual >= totalPaginas
                      ? 'border-white/5 text-slate-700 pointer-events-none bg-[color:var(--sunk2)]/40'
                      : 'border-white/10 bg-[color:var(--sunk2)] text-slate-300 hover:text-white hover:border-white/20'
                  }`}
                  aria-disabled={paginaActual >= totalPaginas}
                >
                  Siguiente <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}