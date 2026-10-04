// app/graficos/page.tsx
import React from 'react';
import { Metadata } from 'next';
import {
  obtenerDatosDashboard,
  getRutasDisponibles,
  getFuentesDisponibles,
  getAerolineasDisponibles,
  getRegionesDisponibles,
  getTiposVueloDisponibles,
  getConteosFiltros,
  getCompetidoresDisponibles,
  getInfoActualizacion
} from '@/lib/data';
import GraficosDashboard from '@/components/GraficosDashboardLazy';
import BarraFiltros from '@/components/BarraFiltros';
import AppHeader from '@/components/AppHeader';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Almundo | Pricing Intelligence & Metasearch Dashboard',
  description: 'Monitor analítico de competitividad, Share of Voice y Revenue Management',
};

// Misma tipografia que la matriz (app/page.tsx): Space Grotesk para
// titulos/labels, IBM Plex Mono con tabular-nums para toda cifra.
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
  const competidor = (resolvedSearchParams?.competidor as string) || 'Despegar';
  const fecha = (resolvedSearchParams?.fecha as string) || 'ULTIMA';

  // Fix: esta pagina no traia las listas dinamicas de filtros — BarraFiltros
  // caia siempre al fallback hardcodeado en vez de los valores reales de la DB.
  const [rutas, fuentes, aerolineas, regiones, tiposVuelo, competidores, conteosFiltros, infoActualizacion] = await Promise.all([
    getRutasDisponibles(moneda),
    getFuentesDisponibles(moneda),
    getAerolineasDisponibles(moneda),
    getRegionesDisponibles(moneda, tipo_vuelo),
    getTiposVueloDisponibles(moneda),
    getCompetidoresDisponibles(moneda),
    getConteosFiltros({ moneda, ruta, fuente, aerolinea, tipo_vuelo, region, fecha }),
    getInfoActualizacion()
  ]);

  let datos = null;
  let errorMsg: string | null = null;

  try {
    datos = await obtenerDatosDashboard({ moneda, ruta, aerolinea, fuente, region, tipo_vuelo, competidor, fecha });
  } catch (err: any) {
    console.error('Error al consultar Neon PostgreSQL:', err);
    errorMsg = 'No se pudo conectar a la base de datos de Neon o aún no hay registros disponibles.';
  }

  // Fix: la URL de vuelta a la matriz se armaba con template string manual,
  // igual que el bug ya corregido en app/page.tsx — se rompe con espacios o
  // caracteres especiales en fuente/aerolinea, y no llevaba tipo_vuelo.
  const buildMatrizUrl = () => {
    const p = new URLSearchParams({ moneda, ruta, fuente, aerolinea, tipo_vuelo, region, competidor, fecha });
    return `/?${p.toString()}`;
  };

  const barraFiltrosProps = {
    moneda,
    ruta,
    aerolinea,
    fuente,
    region,
    tipoVuelo: tipo_vuelo,
    competidor,
    fecha,
    fechas: infoActualizacion.fechas,
    rutas,
    fuentes,
    aerolineas,
    regiones,
    tiposVuelo,
    competidores,
    conteoRutas: conteosFiltros.porRuta,
    conteoRegiones: conteosFiltros.porRegion,
    conteoAerolineas: conteosFiltros.porAerolinea,
    conteoFuentes: conteosFiltros.porFuente
  };

  // Header unico, calculado antes del branch de error para no duplicar el JSX
  // (antes estaba copiado literal en las dos ramas).
  const header = (
    <AppHeader
      activo="graficos"
      estado="Panel en vivo de checkout real por vendedor"
      titulo="Competitive Flight Analytics"
      subtitulo="Competitividad de precio, estructura del checkout (tarifa, impuestos, tasas y fee) y cobertura de vendedores, por ruta y aerolínea."
      hrefMatriz={buildMatrizUrl()}
      hrefGraficos="#"
      actualizado={infoActualizacion.ultima}
    />
  );

  if (!datos || errorMsg) {
    return (
      <main className={`min-h-screen text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8`}>
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

  // Fix: "Presencia Despegar" quedaba fijo aunque el usuario cambiara el
  // competidor a comparar en la barra de filtros -- ahora toma la columna de
  // qSOV (datosShareGanadoresRuta) que corresponde al competidor elegido.
  const campoPctCompetidor = competidor === 'Atrápalo' ? 'atrapalo_pct' : 'despegar_pct';

  const avgSovCompetidor = totalVuelosSov > 0
    ? Math.round(
        datos.datosShareGanadoresRuta.reduce((acc, curr) => acc + curr[campoPctCompetidor] * curr.total_vuelos, 0) / totalVuelosSov
      )
    : 0;

  const compAlmundo = datos.datosComposicion.find(c => c.vendedor === 'Almundo');
  const compCompetidor = datos.datosComposicion.find(c => c.vendedor === competidor);
  const feeAlmundo = compAlmundo ? compAlmundo.pct_fee : null;
  const feeCompetidor = compCompetidor ? compCompetidor.pct_fee : null;

  // Mismo ticker-strip que la matriz: una sola franja con divisores finos en
  // vez de 4 cards identicas con el mismo shadow/radius.
  const kpiItems = [
    {
      label: 'Vuelos con Almundo',
      value: totalVuelosEnCatalogo.toLocaleString('es-AR'),
      sub: 'lecturas de checkout (sin filas a revisar)',
      color: 'text-white'
    },
    {
      label: 'Win Rate (Mejor Tarifa)',
      value: `${winRateAlmundo}%`,
      sub: 'vuelos donde lideramos el buy box',
      color: 'text-emerald-400'
    },
    {
      label: 'Fee medio Almundo',
      value: feeAlmundo !== null ? `${feeAlmundo}%` : 'N/D',
      sub: feeCompetidor !== null ? `vs ${feeCompetidor}% ${competidor} (sobre precio sin fee)` : 'sobre precio sin fee',
      color: 'text-[color:var(--acc2)]'
    },
    {
      label: `Presencia ${competidor}`,
      value: `${avgSovCompetidor}%`,
      sub: 'share de góndola, ponderado por volumen',
      color: 'text-sky-400'
    }
  ];

  return (
    <main className={`min-h-screen text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8`}>
      {header}

      {/* Barra de Filtros */}
      <BarraFiltros {...barraFiltrosProps} />

      {/* Ticker de KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiItems.map((item) => (
          <div key={item.label} className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[color:var(--surf2)] to-[color:var(--surf)] p-5">
            <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[color:var(--acc)] to-[color:var(--acc)]/0" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{item.label}</span>
            <p className={`${dato} text-3xl font-bold leading-none mt-2.5 ${item.color}`}>{item.value}</p>
            <span className="text-[10px] text-slate-400 mt-2 block">{item.sub}</span>
          </div>
        ))}
      </section>

      {/* Grilla 3x3 de Gráficos Analíticos */}
      <GraficosDashboard
        moneda={moneda}
        competidor={competidor}
        rutaSeleccionada={ruta}
        aerolineaSeleccionada={aerolinea}
        datosDistribucionGap={datos.datosDistribucionGap}
        datosRegionCompetitividad={datos.datosRegionCompetitividad}
        datosHeadToHeadRelativo={datos.datosHeadToHeadRelativo}
        datosComposicion={datos.datosComposicion}
        datosDiaSemana={datos.datosDiaSemana}
        datosFranjaHoraria={datos.datosFranjaHoraria}
        datosFee={datos.datosFee}
        datosShareGanadoresRuta={datos.datosShareGanadoresRuta}
        datosWinFee={datos.datosWinFee}
        datosListadoCheckout={datos.datosListadoCheckout}
      />
    </main>
  );
}