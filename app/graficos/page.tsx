// app/graficos/page.tsx
import {
  getResumenKPIs,
  getRutasDisponibles,
  getFuentesDisponibles,
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
    fuente?: string;
  }>;
}

export default async function GraficosPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const moneda = params.moneda || 'ARS';
  const ruta = params.ruta || 'TODAS';
  const fuente = params.fuente || 'TODAS';

  const [
    kpis,
    rutas,
    fuentes,
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
    getResumenKPIs(moneda, ruta, fuente),
    getRutasDisponibles(moneda),
    getFuentesDisponibles(moneda),
    getGraficoAP(moneda, ruta, fuente),
    getGraficoMarkupDirecto(moneda, ruta, fuente),
    getGraficoEquipaje(moneda, ruta, fuente),
    getGraficoRanking(moneda, ruta, fuente),
    getGraficoHeadToHead(moneda, fuente),
    getGraficoDiaSemana(moneda, ruta, fuente),
    getGraficoDistribucionGap(moneda, ruta, fuente),
    getGraficoShareGanadoresRuta(moneda, fuente),
    getGraficoParidadCanales(moneda, ruta),
    getGraficoHistoricoScraping(moneda, ruta, fuente)
  ]);

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Encabezado con Enfoque de Growth & Almundo Branding */}
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
              href={`/?moneda=${moneda}&ruta=${ruta}&fuente=${fuente}`}
              className="px-4 py-1.5 text-xs font-medium rounded-md text-slate-400 hover:text-white transition"
            >
              Matriz Almundo
            </Link>
            <Link
              href={`/graficos?moneda=${moneda}&ruta=${ruta}&fuente=${fuente}`}
              className="px-4 py-1.5 text-xs font-semibold rounded-md bg-[#FF5A00] text-white shadow transition"
            >
              Gráficos & Playbooks
            </Link>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="bg-[#111C30] border border-slate-800 p-4 rounded-xl flex flex-wrap items-center gap-4 shadow-lg shadow-black/20">
          
          {/* Moneda */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Moneda:</span>
            <div className="inline-flex rounded-lg bg-[#0B1120] p-1 border border-slate-800">
              <Link
                href={`/graficos?moneda=ARS&ruta=TODAS&fuente=${fuente}`}
                className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                  moneda === 'ARS' ? 'bg-[#FF5A00] text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                ARS
              </Link>
              <Link
                href={`/graficos?moneda=USD&ruta=TODAS&fuente=${fuente}`}
                className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                  moneda === 'USD' ? 'bg-[#FF5A00] text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                USD
              </Link>
            </div>
          </div>

          {/* Fuente */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Fuente:</span>
            <div className="flex flex-wrap gap-1">
              <Link
                href={`/graficos?moneda=${moneda}&ruta=${ruta}&fuente=TODAS`}
                className={`px-2.5 py-1 text-xs rounded-md border transition ${
                  fuente === 'TODAS'
                    ? 'bg-[#FF5A00]/20 border-[#FF5A00] text-[#FF7A29] font-medium'
                    : 'bg-[#0B1120] border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                Todas
              </Link>
              {fuentes.map((f) => (
                <Link
                  key={f}
                  href={`/graficos?moneda=${moneda}&ruta=${ruta}&fuente=${f}`}
                  className={`px-2.5 py-1 text-xs rounded-md border transition ${
                    fuente === f
                      ? 'bg-[#FF5A00]/20 border-[#FF5A00] text-[#FF7A29] font-medium'
                      : 'bg-[#0B1120] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {f}
                </Link>
              ))}
            </div>
          </div>

          {/* Ruta */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ruta:</span>
            <div className="flex flex-wrap gap-1">
              <Link
                href={`/graficos?moneda=${moneda}&ruta=TODAS&fuente=${fuente}`}
                className={`px-2.5 py-1 text-xs rounded-md border transition ${
                  ruta === 'TODAS'
                    ? 'bg-[#FF5A00]/20 border-[#FF5A00] text-[#FF7A29] font-medium'
                    : 'bg-[#0B1120] border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                Todas
              </Link>
              {rutas.map((r) => (
                <Link
                  key={r}
                  href={`/graficos?moneda=${moneda}&ruta=${r}&fuente=${fuente}`}
                  className={`px-2.5 py-1 text-xs rounded-md border transition ${
                    ruta === r
                      ? 'bg-[#FF5A00]/20 border-[#FF5A00] text-[#FF7A29] font-medium'
                      : 'bg-[#0B1120] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {r}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Resumen Superior de KPIs */}
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

        {/* Los 10 Gráficos con Estilo Almundo */}
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