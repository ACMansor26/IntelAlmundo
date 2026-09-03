// app/graficos/page.tsx
import {
  getResumenKPIs,
  getRutasDisponibles,
  getFuentesDisponibles,
  getAerolineasDisponibles,
  getGraficoAP,
  getGraficoMarkupDirecto,
  getGraficoRanking,
  getGraficoHeadToHead,
  getGraficoDiaSemana,
  getGraficoDistribucionGap,
  getGraficoShareGanadoresRuta,
  getGraficoParidadCanales,
  getGraficoHistoricoScraping
} from '@/lib/data';
import BarraFiltros from '@/components/BarraFiltros';
import GraficosDashboard from '@/components/GraficosDashboard';
import Link from 'next/link';

interface PageProps {
  searchParams: Promise<{
    moneda?: string;
    ruta?: string;
    fuente?: string;
    aerolinea?: string;
  }>;
}

export default async function GraficosPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const moneda = params.moneda || 'ARS';
  const ruta = params.ruta || 'TODAS';
  const fuente = params.fuente || 'TODAS';
  const aerolinea = params.aerolinea || 'TODAS';

  const [
    kpis,
    rutas,
    fuentes,
    aerolineas,
    datosAP,
    datosMarkup,
    datosRanking,
    datosHeadToHead,
    datosDiaSemana,
    datosDistribucionGap,
    datosShareGanadoresRuta,
    datosParidadCanales,
    datosHistoricoScraping
  ] = await Promise.all([
    getResumenKPIs(moneda, ruta, fuente, aerolinea),
    getRutasDisponibles(moneda),
    getFuentesDisponibles(moneda),
    getAerolineasDisponibles(moneda),
    getGraficoAP(moneda, ruta, fuente, aerolinea),
    getGraficoMarkupDirecto(moneda, ruta, fuente, aerolinea),
    getGraficoRanking(moneda, ruta, fuente, aerolinea),
    getGraficoHeadToHead(moneda, fuente, aerolinea),
    getGraficoDiaSemana(moneda, ruta, fuente, aerolinea),
    getGraficoDistribucionGap(moneda, ruta, fuente, aerolinea),
    getGraficoShareGanadoresRuta(moneda, fuente, aerolinea),
    getGraficoParidadCanales(moneda, ruta, aerolinea),
    getGraficoHistoricoScraping(moneda, ruta, fuente, aerolinea)
  ]);

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF5A00]/15 text-[#FF7A29] border border-[#FF5A00]/40 tracking-wider uppercase">
                Almundo Growth & Performance Analytics
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">
              Panel de Inteligencia de Precios & Revenue
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Monitoreo del Buy Box, elasticidad de demanda y benchmarking competitivo para optimización de ROAS y CVR
            </p>
          </div>

          <div className="inline-flex rounded-lg bg-[#111C30] p-1 border border-slate-800">
            <Link
              href={`/?moneda=${moneda}&ruta=${ruta}&fuente=${fuente}&aerolinea=${aerolinea}`}
              className="px-4 py-1.5 text-xs font-medium rounded-md text-slate-400 hover:text-white transition"
            >
              Matriz Almundo
            </Link>
            <Link
              href={`/graficos?moneda=${moneda}&ruta=${ruta}&fuente=${fuente}&aerolinea=${aerolinea}`}
              className="px-4 py-1.5 text-xs font-semibold rounded-md bg-[#FF5A00] text-white shadow transition"
            >
              Gráficos & KPIs
            </Link>
          </div>
        </div>

        {/* Barra de Filtros con Desplegables */}
        <BarraFiltros
          moneda={moneda}
          fuente={fuente}
          ruta={ruta}
          aerolinea={aerolinea}
          rutas={rutas}
          aerolineas={aerolineas}
          fuentes={fuentes}
        />

        {/* Resumen Superior */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#111C30] border border-slate-800 rounded-xl p-4 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase font-medium">Buy Box / Win Rate Almundo</span>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950 px-1.5 py-0.5 rounded">CVR Booster</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-[#FF5A00]">
              {kpis?.win_rate_almundo_pct || 0}%
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">% de ofertas liderando la mejor tarifa</p>
          </div>

          <div className="bg-[#111C30] border border-slate-800 rounded-xl p-4 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase font-medium">Gap Medio vs Mejor Precio</span>
              <span className="text-[10px] text-sky-400 font-semibold bg-sky-950 px-1.5 py-0.5 rounded">Elasticidad</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-100">
              +{kpis?.gap_promedio_almundo_pct || 0}%
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Sobreprecio medio respecto al ganador</p>
          </div>

          <div className="bg-[#111C30] border border-slate-800 rounded-xl p-4 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase font-medium">Inventario Monitoreado</span>
              <span className="text-[10px] text-slate-400 font-semibold bg-slate-800 px-1.5 py-0.5 rounded">Muestra</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-sky-400">
              {kpis?.total_cotizaciones?.toLocaleString('es-AR') || 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Cotizaciones activas en la base</p>
          </div>
        </div>

        {/* Gráficos */}
        <GraficosDashboard
          moneda={moneda}
          rutaSeleccionada={ruta}
          aerolineaSeleccionada={aerolinea}
          datosAP={datosAP}
          datosMarkup={datosMarkup}
          datosRanking={datosRanking}
          datosHeadToHead={datosHeadToHead}
          datosDiaSemana={datosDiaSemana}
          datosDistribucionGap={datosDistribucionGap}
          datosShareGanadoresRuta={datosShareGanadoresRuta}
          datosParidadCanales={datosParidadCanales}
          datosHistoricoScraping={datosHistoricoScraping}
        />

      </div>
    </div>
  );
}