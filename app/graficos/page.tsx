// app/graficos/page.tsx
import {
  getResumenKPIs,
  getRutasDisponibles,
  getGraficoAP,
  getGraficoMarkupDirecto,
  getGraficoEquipaje,
  getGraficoRanking,
  getGraficoHeadToHead,
  getGraficoDiaSemana,
  getGraficoDistribucionGap,
  getGraficoShareGanadoresRuta,
  getGraficoParidadCanales,
  getGraficoHistoricoScraping
} from '@/lib/data';
import GraficosDashboard from '@/components/GraficosDashboard';
import Link from 'next/link';

interface PageProps {
  searchParams: Promise<{
    moneda?: string;
    ruta?: string;
  }>;
}

export default async function GraficosPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const moneda = params.moneda || 'ARS';
  const ruta = params.ruta || 'TODAS';

  const [
    kpis,
    rutas,
    datosAP,
    datosMarkup,
    datosEquipaje,
    datosRanking,
    datosHeadToHead,
    datosDiaSemana,
    datosDistribucionGap,
    datosShareGanadoresRuta,
    datosParidadCanales,
    datosHistoricoScraping
  ] = await Promise.all([
    getResumenKPIs(moneda, ruta),
    getRutasDisponibles(moneda),
    getGraficoAP(moneda, ruta),
    getGraficoMarkupDirecto(moneda, ruta),
    getGraficoEquipaje(moneda, ruta),
    getGraficoRanking(moneda, ruta),
    getGraficoHeadToHead(moneda),
    getGraficoDiaSemana(moneda, ruta),
    getGraficoDistribucionGap(moneda, ruta),
    getGraficoShareGanadoresRuta(moneda),
    getGraficoParidadCanales(moneda, ruta),
    getGraficoHistoricoScraping(moneda, ruta)
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Encabezado con Enfoque de Growth & Performance Marketing */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-950 text-blue-400 border border-blue-800 tracking-wide uppercase">
                Growth & Performance Analytics
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">
              Panel de Inteligencia de Precios & Revenue
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Monitoreo del Buy Box, elasticidad de demanda y benchmarking competitivo para optimización de ROAS y CVR
            </p>
          </div>

          <div className="inline-flex rounded-lg bg-slate-900 p-1 border border-slate-800">
            <Link
              href={`/?moneda=${moneda}&ruta=${ruta}`}
              className="px-4 py-1.5 text-xs font-medium rounded-md text-slate-400 hover:text-white transition"
            >
              Tabla de Detalle
            </Link>
            <Link
              href={`/graficos?moneda=${moneda}&ruta=${ruta}`}
              className="px-4 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white shadow transition"
            >
              Gráficos & Playbooks
            </Link>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Moneda:</span>
            <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800">
              <Link
                href={`/graficos?moneda=ARS&ruta=TODAS`}
                className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                  moneda === 'ARS' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                ARS
              </Link>
              <Link
                href={`/graficos?moneda=USD&ruta=TODAS`}
                className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                  moneda === 'USD' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                USD
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ruta:</span>
            <div className="flex flex-wrap gap-1">
              <Link
                href={`/graficos?moneda=${moneda}&ruta=TODAS`}
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
                  href={`/graficos?moneda=${moneda}&ruta=${r}`}
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
        </div>

        {/* Resumen Superior de KPIs de Performance */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase font-medium">Buy Box / Win Rate Almundo</span>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950 px-1.5 py-0.5 rounded">CVR Booster</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-amber-400">
              {kpis?.win_rate_almundo_pct || 0}%
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">% de ofertas liderando la mejor tarifa</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase font-medium">Gap Medio vs Mejor Precio</span>
              <span className="text-[10px] text-blue-400 font-semibold bg-blue-950 px-1.5 py-0.5 rounded">Elasticidad</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-100">
              +{kpis?.gap_promedio_almundo_pct || 0}%
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Sobreprecio medio respecto al ganador</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase font-medium">Inventario Monitoreado</span>
              <span className="text-[10px] text-slate-400 font-semibold bg-slate-800 px-1.5 py-0.5 rounded">Muestra</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-blue-400">
              {kpis?.total_cotizaciones?.toLocaleString('es-AR') || 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Cotizaciones activas en la base</p>
          </div>
        </div>

        {/* Componente con los 10 Gráficos y sus Callouts de Estrategia */}
        <GraficosDashboard
          moneda={moneda}
          rutaSeleccionada={ruta}
          datosAP={datosAP}
          datosMarkup={datosMarkup}
          datosEquipaje={datosEquipaje}
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