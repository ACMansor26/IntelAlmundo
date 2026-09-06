// app/graficos/page.tsx
import React from 'react';
import { Metadata } from 'next';
import { Space_Grotesk, IBM_Plex_Mono } from 'next/font/google';
import {
  obtenerDatosDashboard,
  getRutasDisponibles,
  getFuentesDisponibles,
  getAerolineasDisponibles,
  getRegionesDisponibles,
  getTiposVueloDisponibles
} from '@/lib/data';
import GraficosDashboard from '@/components/GraficosDashboard';
import BarraFiltros from '@/components/BarraFiltros';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Almundo | Pricing Intelligence & Metasearch Dashboard',
  description: 'Monitor analítico de competitividad, Share of Voice y Revenue Management',
};

// Misma tipografia que la matriz (app/page.tsx): Space Grotesk para
// titulos/labels, IBM Plex Mono con tabular-nums para toda cifra.
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

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
};

export default async function GraficosPage(props: PageProps) {
  const resolvedSearchParams = await Promise.resolve(props.searchParams);

  const moneda = (resolvedSearchParams?.moneda as string) === 'USD' ? 'USD' : 'ARS';
  const ruta = (resolvedSearchParams?.ruta as string) || 'TODAS';
  const aerolinea = (resolvedSearchParams?.aerolinea as string) || 'TODAS';
  const fuente = (resolvedSearchParams?.fuente as string) || 'TODAS';
  const region = (resolvedSearchParams?.region as string) || 'TODAS';
  // Fix: el filtro de tipo de vuelo no se leia de la URL ni se pasaba a
  // obtenerDatosDashboard, aunque FiltrosDashboard ya lo soporta.
  const tipo_vuelo = (resolvedSearchParams?.tipo_vuelo as string) || 'TODOS';

  // Fix: esta pagina no traia las listas dinamicas de filtros — BarraFiltros
  // caia siempre al fallback hardcodeado en vez de los valores reales de la DB.
  const [rutas, fuentes, aerolineas, regiones, tiposVuelo] = await Promise.all([
    getRutasDisponibles(moneda),
    getFuentesDisponibles(moneda),
    getAerolineasDisponibles(moneda),
    getRegionesDisponibles(moneda, tipo_vuelo),
    getTiposVueloDisponibles(moneda)
  ]);

  let datos = null;
  let errorMsg: string | null = null;

  try {
    datos = await obtenerDatosDashboard({ moneda, ruta, aerolinea, fuente, region, tipo_vuelo });
  } catch (err: any) {
    console.error('Error al consultar Neon PostgreSQL:', err);
    errorMsg = 'No se pudo conectar a la base de datos de Neon o aún no hay registros disponibles.';
  }

  // Fix: la URL de vuelta a la matriz se armaba con template string manual,
  // igual que el bug ya corregido en app/page.tsx — se rompe con espacios o
  // caracteres especiales en fuente/aerolinea, y no llevaba tipo_vuelo.
  const buildMatrizUrl = () => {
    const p = new URLSearchParams({ moneda, ruta, fuente, aerolinea, tipo_vuelo, region });
    return `/?${p.toString()}`;
  };

  const barraFiltrosProps = {
    moneda,
    ruta,
    aerolinea,
    fuente,
    region,
    tipoVuelo: tipo_vuelo,
    rutas,
    fuentes,
    aerolineas,
    regiones,
    tiposVuelo
  };

  // Header unico, calculado antes del branch de error para no duplicar el JSX
  // (antes estaba copiado literal en las dos ramas).
  const header = (
    <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-white/10 pb-6">
      <div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#FF5A00] opacity-60 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF5A00]" />
          </span>
          <span>Panel en vivo de Share of Voice y Revenue Management</span>
        </div>
        <h1 className={`${heading} text-2xl md:text-3xl font-semibold tracking-tight text-white mt-1.5`}>
          Competitive Flight Analytics
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-2xl">
          Paridad tarifaria, góndola competitiva y márgenes sobre canales directos, por ruta y aerolínea.
        </p>
      </div>

      <nav className="flex items-center gap-5 border-b border-white/10 md:border-0">
        <Link
          href={buildMatrizUrl()}
          className="relative pb-2 text-xs font-medium text-slate-500 hover:text-slate-300 transition"
        >
          Matriz Almundo
        </Link>
        <span className="relative pb-2 text-xs font-medium text-white">
          Gráficos & KPIs
          <span className="absolute left-0 right-0 -bottom-px h-[2px] rounded-full bg-[#FF5A00]" />
        </span>
      </nav>
    </header>
  );

  if (!datos || errorMsg) {
    return (
      <main className={`${fontTitulo.variable} ${fontDato.variable} min-h-screen bg-[#080B14] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8`}>
        {header}

        <BarraFiltros {...barraFiltrosProps} />

        <div className="bg-rose-950/30 border border-rose-800/50 rounded-2xl p-6 text-center text-rose-300">
          <p className="font-semibold text-sm">{errorMsg || 'No se encontraron datos para los filtros seleccionados.'}</p>
          <p className="text-xs text-rose-400 mt-1">Verificá que el scraper haya guardado cotizaciones en la base de datos Neon.</p>
        </div>
      </main>
    );
  }

  const totalVuelosEnCatalogo = datos.datosDistribucionGap.reduce((acc, curr) => acc + curr.cantidad_vuelos, 0);
  const winRateAlmundo = datos.datosDistribucionGap.find(d => d.rango_gap === '0% (Win)')?.share_pct || 0;

  // Fix: promedio ponderado por total_vuelos en vez de promedio simple entre
  // rutas — antes una ruta con 5 vuelos pesaba igual que una con 500.
  const totalVuelosSov = datos.datosShareGanadoresRuta.reduce((acc, curr) => acc + curr.total_vuelos, 0);

  const avgSovAlmundo = totalVuelosSov > 0
    ? Math.round(
        datos.datosShareGanadoresRuta.reduce((acc, curr) => acc + curr.almundo_pct * curr.total_vuelos, 0) / totalVuelosSov
      )
    : 0;

  const avgSovDespegar = totalVuelosSov > 0
    ? Math.round(
        datos.datosShareGanadoresRuta.reduce((acc, curr) => acc + curr.despegar_pct * curr.total_vuelos, 0) / totalVuelosSov
      )
    : 0;

  // Mismo ticker-strip que la matriz: una sola franja con divisores finos en
  // vez de 4 cards identicas con el mismo shadow/radius.
  const kpiItems = [
    {
      label: 'Vuelos con Almundo',
      value: totalVuelosEnCatalogo.toLocaleString('es-AR'),
      sub: 'itinerarios con presencia confirmada',
      color: 'text-white'
    },
    {
      label: 'Win Rate (Mejor Tarifa)',
      value: `${winRateAlmundo}%`,
      sub: 'vuelos donde lideramos el buy box',
      color: 'text-emerald-400'
    },
    {
      label: 'Presencia Media Almundo',
      value: `${avgSovAlmundo}%`,
      sub: 'share de góndola, ponderado por volumen',
      color: 'text-[#FF7A29]'
    },
    {
      label: 'Presencia Despegar',
      value: `${avgSovDespegar}%`,
      sub: 'share de góndola, ponderado por volumen',
      color: 'text-sky-400'
    }
  ];

  return (
    <main className={`${fontTitulo.variable} ${fontDato.variable} min-h-screen bg-[#080B14] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8`}>
      {header}

      {/* Barra de Filtros */}
      <BarraFiltros {...barraFiltrosProps} />

      {/* Ticker de KPIs */}
      <section className="rounded-2xl border border-white/10 bg-[#10182B] overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-white/10">
          {kpiItems.map((item) => (
            <div key={item.label} className="p-4 md:p-5">
              <span className="text-[11px] text-slate-500">{item.label}</span>
              <p className={`${dato} text-2xl font-semibold mt-1.5 ${item.color}`}>{item.value}</p>
              <span className="text-[10px] text-slate-600 mt-0.5 block">{item.sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Grilla 3x3 de Gráficos Analíticos */}
      <GraficosDashboard
        moneda={moneda}
        rutaSeleccionada={ruta}
        aerolineaSeleccionada={aerolinea}
        datosDistribucionGap={datos.datosDistribucionGap}
        datosRegionCompetitividad={datos.datosRegionCompetitividad}
        datosHeadToHeadRelativo={datos.datosHeadToHeadRelativo}
        datosAP={datos.datosAP}
        datosEstadia={datos.datosEstadia}
        datosDiaSemana={datos.datosDiaSemana}
        datosShareGanadoresRuta={datos.datosShareGanadoresRuta}
        datosMarkup={datos.datosMarkup}
        datosRanking={datos.datosRanking}
      />
    </main>
  );
}