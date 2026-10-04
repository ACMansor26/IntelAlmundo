// components/GraficosDashboard.tsx
'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine
} from 'recharts';
import {
  DatosDistribucionGap,
  DatosRegionCompetitividad,
  DatosHeadToHeadRelativo,
  DatosComposicionPrecio,
  DatosDiaSemana,
  DatosFranjaHoraria,
  DatosFeeAerolinea,
  DatosShareGanadoresRuta,
  DatosWinFeeRuta,
  DatosListadoCheckout
} from '@/lib/data';

interface Props {
  moneda: string;
  competidor: string;
  rutaSeleccionada?: string;
  aerolineaSeleccionada?: string;
  datosDistribucionGap: DatosDistribucionGap[];
  datosRegionCompetitividad: DatosRegionCompetitividad[];
  datosHeadToHeadRelativo: DatosHeadToHeadRelativo[];
  datosComposicion: DatosComposicionPrecio[];
  datosDiaSemana: DatosDiaSemana[];
  datosFranjaHoraria: DatosFranjaHoraria[];
  datosFee: DatosFeeAerolinea[];
  datosShareGanadoresRuta: DatosShareGanadoresRuta[];
  datosWinFee: DatosWinFeeRuta[];
  datosListadoCheckout: DatosListadoCheckout[];
}

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: 'var(--surf)',
    borderColor: '#334155',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#ffffff',
    boxShadow: '0 10px 20px -3px rgba(0, 0, 0, 0.6)',
    padding: '10px 14px'
  },
  labelStyle: {
    color: '#ffffff',
    fontWeight: 700,
    marginBottom: '6px',
    fontSize: '13px'
  },
  itemStyle: {
    color: '#e2e8f0',
    fontSize: '12px',
    padding: '2px 0'
  }
};

const COLOR_ALMUNDO = 'var(--acc)';
const COLOR_DESPEGAR = '#3B82F6';
const COLOR_ATRAPALO = '#EC4899';
const COLOR_SIN_FEE = '#10B981';
const COLOR_CON_FEE = '#F59E0B';
const COLOR_TARIFA = '#38BDF8';
const COLOR_IMPUESTOS = '#6366F1';
const COLOR_TASAS = '#A78BFA';
const COLOR_FEE = 'var(--acc)';

const COLORES_HISTOGRAMA: Record<string, string> = {
  '0% (Win)': '#10B981',
  '0.1% a 3%': '#0EA5E9',
  '3.1% a 7%': 'var(--acc)',
  '7.1% a 15%': '#F97316',
  '> 15%': '#EF4444'
};

const colorVendedor = (v: string) =>
  v === 'Almundo' ? COLOR_ALMUNDO : v === 'Despegar' ? COLOR_DESPEGAR : v === 'Atrápalo' ? COLOR_ATRAPALO : '#64748b';

export default function GraficosDashboard({
  moneda,
  competidor,
  datosDistribucionGap,
  datosRegionCompetitividad,
  datosHeadToHeadRelativo,
  datosComposicion,
  datosDiaSemana,
  datosFranjaHoraria,
  datosFee,
  datosShareGanadoresRuta,
  datosWinFee,
  datosListadoCheckout
}: Props) {
  const prefijo = moneda === 'USD' ? 'USD ' : '$ ';

  const formatPctTooltip = (value: any, name: any) => {
    if (value === null || value === undefined) return ['N/D', name];
    if (typeof value === 'number') {
      const signo = value > 0 ? '+' : '';
      return [`${signo}${value}%`, name];
    }
    return [value, name];
  };

  const formatMonto = (v: any, name: any) => [`${prefijo}${Number(v).toLocaleString('es-AR')}`, name];

  const renderLegendText = (value: string) => (
    <span className="text-slate-200 font-medium text-xs ml-1">{value}</span>
  );

  // Perfil temporal del vuelo: mismo gap (vs la tarifa mas baja del vuelo) cortado
  // por dia de salida o por franja horaria. La estadia ya no se muestra: el scraper
  // hoy solo toma estadia fija de 7 dias, el corte seria un unico punto.
  type VistaTemporal = 'dia_semana' | 'franja_horaria';
  const [vistaTemporal, setVistaTemporal] = useState<VistaTemporal>('dia_semana');

  const vistasTemporales: { id: VistaTemporal; label: string }[] = [
    { id: 'dia_semana', label: 'Día de Salida' },
    { id: 'franja_horaria', label: 'Franja Horaria' }
  ];

  const configVistaTemporal: Record<
    VistaTemporal,
    { data: any[]; xKey: string; tickFormatter?: (v: string) => string; labelFormatter?: (label: any, payload: any) => any }
  > = {
    dia_semana: { data: datosDiaSemana, xKey: 'dia_semana_vuelo', tickFormatter: (d) => d.slice(0, 3) },
    franja_horaria: {
      data: datosFranjaHoraria,
      xKey: 'franja_horaria',
      labelFormatter: (label, payload) =>
        payload?.[0]?.payload?.rango_horas ? `${label} (${payload[0].payload.rango_horas})` : label
    }
  };

  const notasVistaTemporal: Record<VistaTemporal, React.ReactNode> = {
    dia_semana: (
      <>
        <p className="text-slate-300"><strong className="text-[color:var(--acc)]">Patrón Semanal:</strong> Diferencia salidas corporativas (martes/miércoles) vs salidas turísticas (viernes/domingo).</p>
        <p className="text-slate-300"><strong className="text-sky-400">Ojo con la muestra:</strong> Con pocos vuelos por día, una barra puede salir de 1 o 2 lecturas; confirmá el volumen antes de actuar.</p>
      </>
    ),
    franja_horaria: (
      <>
        <p className="text-slate-300"><strong className="text-cyan-400">Menor competencia:</strong> Los horarios menos convenientes (madrugada/noche) suelen tener menos oferta y pueden mostrar gaps distintos a los horarios pico.</p>
        <p className="text-slate-300"><strong className="text-[color:var(--acc2)]">Pricing por horario:</strong> Si una franja muestra brecha sistemáticamente peor, conviene revisar el pricing específico de esos horarios.</p>
      </>
    )
  };

  const muestrasComposicion = datosComposicion.length > 0
    ? Math.min(...datosComposicion.map((d) => d.muestras))
    : 0;

  return (
    <div className="space-y-12">

      {/* ===================================================================== */}
      {/* BLOQUE I: COMPETITIVIDAD DE PRECIO                                    */}
      {/* ===================================================================== */}
      <div>
        <div className="border-b border-slate-800 pb-3 mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[color:var(--acc)] animate-pulse"></span>
              I. Competitividad de Precio
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Distancia a la tarifa más baja, win rate por región y spread vs. {competidor}. Todo sobre precio sin fee del checkout.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 1. Histograma de Gap */}
          <div className="bg-gradient-to-b from-[color:var(--surf2)] to-[color:var(--surf)] border border-white/10 hover:border-white/20 transition-colors rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-lg shadow-black/30">
            <div>
              <h3 className="text-sm font-semibold text-white">1. Distribución de Brecha (Buy Box Proximity)</h3>
              <p className="text-[11px] text-slate-400 mt-1">Concentración de vuelos según distancia porcentual a la tarifa más baja del mismo vuelo y fuente</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosDistribucionGap} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="rango_gap" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={(v: any, _, item: any) => [`${v} vuelos (${item.payload.share_pct}%)`, 'Volumen']}
                  />
                  <Bar dataKey="cantidad_vuelos" name="Vuelos" radius={[4, 4, 0, 0]}>
                    {datosDistribucionGap.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORES_HISTOGRAMA[entry.rango_gap] || COLOR_ALMUNDO} />
                    ))}
                    <LabelList dataKey="share_pct" position="top" fill="#cbd5e1" fontSize={10} formatter={(v: any) => `${v}%`} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[color:var(--sunk)] border border-slate-800 rounded-lg p-3 space-y-1 text-[11px]">
              <p className="text-slate-300"><strong className="text-sky-300">Micro-brecha (0.1% a 3%):</strong> Vuelos prioritarios para micro-ajustes de comisión o promociones bancarias.</p>
              <p className="text-slate-300"><strong className="text-emerald-400">Buy Box Wins (0%):</strong> Almundo tiene el precio sin fee más bajo del vuelo; no incluye filas marcadas &quot;a revisar&quot;.</p>
            </div>
          </div>

          {/* 2. Win Rate por Región */}
          <div className="bg-gradient-to-b from-[color:var(--surf2)] to-[color:var(--surf)] border border-white/10 hover:border-white/20 transition-colors rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-lg shadow-black/30">
            <div>
              <h3 className="text-sm font-semibold text-white">2. Win Rate Almundo por Región</h3>
              <p className="text-[11px] text-slate-400 mt-1">Porcentaje de vuelos ganados y brecha promedio según destino</p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosRegionCompetitividad} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis type="number" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} unit="%" domain={[0, 100]} />
                  <YAxis
                    type="category"
                    dataKey="region"
                    stroke="#64748b"
                    tick={{ fill: '#f8fafc', fontSize: 9 }}
                    interval={0}
                    width={85}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={(v: any, name: any, item: any) => [
                      `${v}% (${item.payload.total_vuelos} vuelos / Gap: +${item.payload.gap_promedio_almundo || 0}%)`,
                      'Win Rate'
                    ]}
                  />
                  <Bar dataKey="win_rate_almundo_pct" name="Win Rate Almundo" fill="#10B981" radius={[0, 4, 4, 0]}>
                    <LabelList dataKey="win_rate_almundo_pct" position="right" fill="#ffffff" fontSize={10} formatter={(v: any) => `${v}%`} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[color:var(--sunk)] border border-slate-800 rounded-lg p-3 space-y-1 text-[11px]">
              <p className="text-slate-300"><strong className="text-emerald-400">Lectura de Cartera:</strong> Evalúa el balance entre Cabotaje (paridad sensible) e Internacional (financiación).</p>
              <p className="text-slate-300"><strong className="text-sky-400">Decisión Comercial:</strong> Ajustar markups en regiones con Win Rate &lt; 25% para no penalizar la posición de despliegue.</p>
            </div>
          </div>

          {/* 3. Spread H2H Almundo vs Competidor elegido Relativo */}
          <div className="bg-gradient-to-b from-[color:var(--surf2)] to-[color:var(--surf)] border border-white/10 hover:border-white/20 transition-colors rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-lg shadow-black/30">
            <div>
              <h3 className="text-sm font-semibold text-white">3. Spread H2H vs {competidor} (Relativo %)</h3>
              <p className="text-[11px] text-slate-400 mt-1">Diferencial porcentual de precio sin fee en vuelos leídos para ambos vendedores en la misma fuente</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosHeadToHeadRelativo} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis
                    dataKey="ruta"
                    stroke="#64748b"
                    tick={{ fill: '#cbd5e1', fontSize: 9 }}
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                    height={40}
                  />
                  <YAxis stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} unit="%" />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={(v: any, _, item: any) => [
                      `${v > 0 ? `+${v}% (${competidor} más barato)` : `${v}% (Almundo más barato)`} [${prefijo}${Math.abs(item.payload.spread_promedio_monto).toLocaleString('es-AR')}] · ${item.payload.vuelos_comparados} vuelos`,
                      'Spread Relativo'
                    ]}
                  />
                  <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} />
                  <Bar dataKey="spread_promedio_pct" name="Spread %" radius={[3, 3, 0, 0]}>
                    {datosHeadToHeadRelativo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.spread_promedio_pct <= 0 ? '#10B981' : '#EF4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[color:var(--sunk)] border border-slate-800 rounded-lg p-3 space-y-1 text-[11px]">
              <p className="text-slate-300"><strong className="text-emerald-400">Verde (&le; 0%):</strong> Almundo cotiza igual o más barato antes del fee.</p>
              <p className="text-slate-300"><strong className="text-rose-400">Rojo (&gt; 0%):</strong> {competidor} cotiza con ventaja; riesgo de fuga de ventas en la góndola.</p>
            </div>
          </div>

        </div>
      </div>

      {/* ===================================================================== */}
      {/* BLOQUE II: ESTRUCTURA DE PRECIO Y FEE                                 */}
      {/* ===================================================================== */}
      <div>
        <div className="border-b border-slate-800 pb-3 mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-sky-500"></span>
              II. Estructura de Precio & Fee
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cómo se compone el precio de cada vendedor, cuánto cobra de fee y si la brecha cambia según el perfil temporal del vuelo
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 4. Composicion del precio */}
          <div className="bg-gradient-to-b from-[color:var(--surf2)] to-[color:var(--surf)] border border-white/10 hover:border-white/20 transition-colors rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-lg shadow-black/30">
            <div>
              <h3 className="text-sm font-semibold text-white">4. Composición del Precio por Vendedor</h3>
              <p className="text-[11px] text-slate-400 mt-1">Promedio de tarifa base, impuestos, tasas y fee en vuelos leídos por Almundo y Despegar</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosComposicion} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="vendedor" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fill: '#cbd5e1', fontSize: 10 }}
                    tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={formatMonto}
                  />
                  <Legend wrapperStyle={{ paddingTop: '4px' }} formatter={renderLegendText} />
                  <Bar dataKey="tarifa_base" name="Tarifa base" stackId="p" fill={COLOR_TARIFA} />
                  <Bar dataKey="impuestos" name="Impuestos" stackId="p" fill={COLOR_IMPUESTOS} />
                  <Bar dataKey="tasas" name="Tasas" stackId="p" fill={COLOR_TASAS} />
                  <Bar dataKey="cargo_gestion" name="Fee" stackId="p" fill={COLOR_FEE} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[color:var(--sunk)] border border-slate-800 rounded-lg p-3 space-y-1 text-[11px]">
              <p className="text-slate-300"><strong className="text-[color:var(--acc)]">Dónde se pierde el vuelo:</strong> Si la tarifa base es igual, la diferencia está en impuestos, tasas o fee. En Atrápalo las tasas incluyen el IVA; en Almundo, el IVA del fee.</p>
              <p className="text-slate-300"><strong className="text-sky-400">Muestra:</strong> {muestrasComposicion > 0 ? `${muestrasComposicion} lecturas por vendedor` : 'sin lecturas comparables'}; con pocos datos tomalo como orientativo.</p>
            </div>
          </div>

          {/* 5. Perfil Temporal del Vuelo (selector: Dia de Salida / Franja Horaria) */}
          <div className="bg-gradient-to-b from-[color:var(--surf2)] to-[color:var(--surf)] border border-white/10 hover:border-white/20 transition-colors rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-lg shadow-black/30">
            <div>
              <h3 className="text-sm font-semibold text-white">5. Perfil Temporal del Vuelo</h3>
              <p className="text-[11px] text-slate-400 mt-1">Brecha promedio vs la tarifa más baja, según día o franja horaria de salida</p>

              <nav className="flex flex-wrap items-center gap-1 rounded-full border border-white/10 bg-[color:var(--sunk)] p-1 mt-3 w-fit">
                {vistasTemporales.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVistaTemporal(v.id)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition ${
                      vistaTemporal === v.id
                        ? 'bg-[color:var(--acc)] text-white'
                        : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={configVistaTemporal[vistaTemporal].data}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis
                    dataKey={configVistaTemporal[vistaTemporal].xKey}
                    stroke="#64748b"
                    tick={{ fill: '#cbd5e1', fontSize: 10 }}
                    tickFormatter={configVistaTemporal[vistaTemporal].tickFormatter}
                  />
                  <YAxis stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} unit="%" />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={formatPctTooltip}
                    labelFormatter={configVistaTemporal[vistaTemporal].labelFormatter}
                  />
                  <Legend wrapperStyle={{ paddingTop: '4px' }} formatter={renderLegendText} />
                  <Bar dataKey="almundo" name="Almundo" fill={COLOR_ALMUNDO} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="competidor" name={competidor} fill={colorVendedor(competidor)} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[color:var(--sunk)] border border-slate-800 rounded-lg p-3 space-y-1 text-[11px]">
              {notasVistaTemporal[vistaTemporal]}
            </div>
          </div>

          {/* 6. Fee por aerolinea y vendedor */}
          <div className="bg-gradient-to-b from-[color:var(--surf2)] to-[color:var(--surf)] border border-white/10 hover:border-white/20 transition-colors rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-lg shadow-black/30">
            <div>
              <h3 className="text-sm font-semibold text-white">6. Fee por Aerolínea y Vendedor</h3>
              <p className="text-[11px] text-slate-400 mt-1">Cargo de gestión promedio como % del precio sin fee</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosFee} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="aerolinea" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} unit="%" />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={(v: any, name: any) => [v !== null && v !== undefined ? `${v}%` : 'N/D', name]}
                  />
                  <Legend wrapperStyle={{ paddingTop: '4px' }} formatter={renderLegendText} />
                  <Bar dataKey="almundo" name="Almundo" fill={COLOR_ALMUNDO} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="despegar" name="Despegar" fill={COLOR_DESPEGAR} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="atrapalo" name="Atrápalo" fill={COLOR_ATRAPALO} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[color:var(--sunk)] border border-slate-800 rounded-lg p-3 space-y-1 text-[11px]">
              <p className="text-slate-300"><strong className="text-[color:var(--acc)]">Palanca de margen:</strong> Un fee de Almundo mayor al de Despegar en una aerolínea explica brecha de precio total aunque la tarifa sea idéntica.</p>
              <p className="text-slate-300"><strong className="text-sky-400">Barra faltante:</strong> El vendedor no se pudo leer en esa aerolínea; no equivale a fee 0%.</p>
            </div>
          </div>

        </div>
      </div>

      {/* ===================================================================== */}
      {/* BLOQUE III: COBERTURA & CALIDAD DEL DATO                              */}
      {/* ===================================================================== */}
      <div>
        <div className="border-b border-slate-800 pb-3 mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-400"></span>
              III. Cobertura & Calidad del Dato
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Qué vendedores se pudieron leer, cuánto cuesta el fee en vuelos ganados y cuánto se desvía el checkout de lo que muestra el metabuscador
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 7. Cobertura de Inventario (Top 6 Rutas) */}
          <div className="bg-gradient-to-b from-[color:var(--surf2)] to-[color:var(--surf)] border border-white/10 hover:border-white/20 transition-colors rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-lg shadow-black/30">
            <div>
              <h3 className="text-sm font-semibold text-white">7. Cobertura de Vendedores por Ruta</h3>
              <p className="text-[11px] text-slate-400 mt-1">% de vuelos observados donde se pudo leer el checkout de cada vendedor (Top Rutas)</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosShareGanadoresRuta} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="ruta" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} unit="%" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={(v: any, name: any) => [`${v}% de vuelos`, name]}
                  />
                  <Legend wrapperStyle={{ paddingTop: '4px' }} formatter={renderLegendText} />
                  <Bar dataKey="almundo_pct" name="Almundo" fill={COLOR_ALMUNDO} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="despegar_pct" name="Despegar" fill={COLOR_DESPEGAR} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="atrapalo_pct" name="Atrápalo" fill={COLOR_ATRAPALO} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[color:var(--sunk)] border border-slate-800 rounded-lg p-3 space-y-1 text-[11px]">
              <p className="text-slate-300"><strong className="text-[color:var(--acc)]">Hueco de lectura:</strong> A veces Kayak o Skyscanner bloquean un vendedor. Un vendedor ausente no significa que no venda ese vuelo.</p>
              <p className="text-slate-300"><strong className="text-emerald-400">Cobertura baja:</strong> Antes de sacar conclusiones de una ruta, confirmá que los tres vendedores se leyeron.</p>
            </div>
          </div>

          {/* 8. Win rate con vs sin fee por ruta */}
          <div className="bg-gradient-to-b from-[color:var(--surf2)] to-[color:var(--surf)] border border-white/10 hover:border-white/20 transition-colors rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-lg shadow-black/30">
            <div>
              <h3 className="text-sm font-semibold text-white">8. Win Rate: Sin Fee vs Con Fee</h3>
              <p className="text-[11px] text-slate-400 mt-1">Vuelos donde Almundo es el más barato antes y después de sumar el fee, por ruta</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosWinFee} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="ruta" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 9 }} interval={0} />
                  <YAxis stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} unit="%" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={(v: any, name: any, item: any) => [`${v}% (${item.payload.vuelos} vuelos)`, name]}
                  />
                  <Legend wrapperStyle={{ paddingTop: '4px' }} formatter={renderLegendText} />
                  <Bar dataKey="win_sin_fee_pct" name="Sin fee" fill={COLOR_SIN_FEE} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="win_con_fee_pct" name="Con fee (precio final)" fill={COLOR_CON_FEE} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[color:var(--sunk)] border border-slate-800 rounded-lg p-3 space-y-1 text-[11px]">
              <p className="text-slate-300"><strong className="text-[color:var(--acc)]">Costo del fee:</strong> La caída entre la barra verde y la ámbar es la parte del win rate que se pierde por cobrar fee.</p>
              <p className="text-slate-300"><strong className="text-sky-400">Decisión:</strong> Si el win rate final es muy inferior, evaluar absorber parte del fee en esas rutas.</p>
            </div>
          </div>

          {/* 9. Diferencia checkout vs listado */}
          <div className="bg-gradient-to-b from-[color:var(--surf2)] to-[color:var(--surf)] border border-white/10 hover:border-white/20 transition-colors rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-lg shadow-black/30">
            <div>
              <h3 className="text-sm font-semibold text-white">9. Checkout vs Listado del Metabuscador</h3>
              <p className="text-[11px] text-slate-400 mt-1">Desvío promedio del precio final vs lo mostrado, y % de filas a revisar (&gt; 5%), por vendedor y fuente</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosListadoCheckout} margin={{ top: 10, right: 10, left: -15, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis
                    dataKey="etiqueta"
                    stroke="#64748b"
                    tick={{ fill: '#cbd5e1', fontSize: 9 }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    height={55}
                  />
                  <YAxis stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} unit="%" />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={(v: any, name: any, item: any) => [
                      v !== null && v !== undefined ? `${v}% (${item.payload.filas} filas)` : 'N/D',
                      name
                    ]}
                  />
                  <Legend wrapperStyle={{ paddingTop: '4px' }} formatter={renderLegendText} />
                  <ReferenceLine y={0} stroke="#64748b" strokeWidth={1} />
                  <Bar dataKey="dif_promedio_pct" name="Desvío promedio" fill="#38BDF8" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="a_revisar_pct" name="Filas a revisar" fill="#EF4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[color:var(--sunk)] border border-slate-800 rounded-lg p-3 space-y-1 text-[11px]">
              <p className="text-slate-300"><strong className="text-sky-400">Normal ≈ 0%:</strong> El checkout casi siempre cobra lo mismo que muestra el listado.</p>
              <p className="text-slate-300"><strong className="text-rose-400">Filas a revisar:</strong> Se excluyen de promedios y rankings del dashboard; están filtrables en la Matriz.</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
