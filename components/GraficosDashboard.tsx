// components/GraficosDashboard.tsx
'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
  LabelList
} from 'recharts';
import {
  DatosGraficoAP,
  DatosMarkupDirecto,
  DatosRanking,
  DatosHeadToHead,
  DatosDiaSemana,
  DatosDistribucionGap,
  DatosShareGanadoresRuta,
  DatosParidadCanales,
  DatosHistoricoScraping
} from '@/lib/data';

interface Props {
  moneda: string;
  rutaSeleccionada: string;
  aerolineaSeleccionada: string;
  datosAP: DatosGraficoAP[];
  datosMarkup: DatosMarkupDirecto[];
  datosRanking: DatosRanking[];
  datosHeadToHead: DatosHeadToHead[];
  datosDiaSemana: DatosDiaSemana[];
  datosDistribucionGap: DatosDistribucionGap[];
  datosShareGanadoresRuta: DatosShareGanadoresRuta[];
  datosParidadCanales: DatosParidadCanales[];
  datosHistoricoScraping: DatosHistoricoScraping[];
}

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: '#111C30',
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

const COLOR_ALMUNDO = '#FF5A00';
const COLOR_DESPEGAR = '#3B82F6';
const COLOR_ATRAPALO = '#EC4899';
const COLOR_TURISMOCITY = '#A855F7';
const COLOR_DIRECTO = '#10B981';

const COLORES_HISTOGRAMA: Record<string, string> = {
  '0% (Win)': '#10B981',
  '0.1% a 3%': '#0EA5E9',
  '3.1% a 7%': '#FF5A00',
  '7.1% a 15%': '#F97316',
  '> 15%': '#EF4444'
};

export default function GraficosDashboard({
  moneda,
  datosAP,
  datosMarkup,
  datosRanking,
  datosHeadToHead,
  datosDiaSemana,
  datosDistribucionGap,
  datosShareGanadoresRuta,
  datosParidadCanales,
  datosHistoricoScraping
}: Props) {
  const prefijo = moneda === 'USD' ? 'USD ' : '$ ';

  const formatPrecio = (value: any, name: any) => {
    if (typeof value === 'number') {
      return [`${prefijo}${Math.round(value).toLocaleString('es-AR')}`, name || 'Precio'];
    }
    return [value, name];
  };

  const formatPctTooltip = (value: any, name: any) => {
    if (typeof value === 'number') {
      return [`+${value}%`, name || 'Gap vs Mínimo'];
    }
    return [value, name];
  };

  const renderLegendText = (value: string) => (
    <span className="text-slate-200 font-medium text-xs ml-1">{value}</span>
  );

  return (
    <div className="space-y-12">

      {/* BLOQUE 1: REVENUE MANAGEMENT & OPORTUNIDADES CLAVE */}
      <div>
        <div className="border-b border-slate-800 pb-3 mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#FF5A00] animate-pulse"></span>
              I. Revenue Management & Conversiones Incrementales
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Identificación de micro-brechas de precio para maximizar Conversion Rate (CVR) y Share de Mercado
            </p>
          </div>
          <span className="hidden sm:inline-block text-[11px] font-mono bg-[#FF5A00]/15 text-[#FF7A29] border border-[#FF5A00]/40 px-2.5 py-1 rounded-full font-semibold">
            FOCO: CVR & ROAS
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 1. Histograma de Brecha */}
          <div className="bg-[#111C30] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-lg shadow-black/20">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">1. Histograma de Elasticidad / Gap</h3>
                <span className="text-[10px] bg-sky-950 text-sky-300 border border-sky-800 px-2 py-0.5 rounded">Oportunidad</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Concentración de inventario según distancia a la mejor tarifa</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosDistribucionGap} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="rango_gap" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
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

            <div className="bg-[#0B1120] border border-slate-800 rounded-lg p-3 space-y-1 text-[11px]">
              <p className="text-slate-300"><strong className="text-[#FF5A00]">¿Qué mide?:</strong> Qué porcentaje del catálogo está a distancia mínima de ganar la venta.</p>
              <p className="text-slate-300"><strong className="text-sky-400">Impacto en CVR:</strong> Los vuelos en el rango <span className="text-sky-300 font-semibold">0.1% a 3%</span> representan conversiones perdidas por spreads marginales recuperables.</p>
            </div>
          </div>

          {/* 2. Cuota de Victorias por Ruta (INCLUYE TURISMOCITY) */}
          <div className="bg-[#111C30] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-lg shadow-black/20">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">2. Share de Victorias (Buy Box)</h3>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">Share of Voice</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Porcentaje de vuelos donde cada competidor lidera el precio mínimo</p>
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
                    formatter={(v: any, name: any) => [`${v}%`, name]}
                  />
                  <Legend wrapperStyle={{ paddingTop: '4px' }} formatter={renderLegendText} />
                  <Bar dataKey="almundo_pct" name="Almundo" stackId="a" fill={COLOR_ALMUNDO} />
                  <Bar dataKey="despegar_pct" name="Despegar" stackId="a" fill={COLOR_DESPEGAR} />
                  <Bar dataKey="atrapalo_pct" name="Atrápalo" stackId="a" fill={COLOR_ATRAPALO} />
                  <Bar dataKey="turismocity_pct" name="TurismoCity" stackId="a" fill={COLOR_TURISMOCITY} />
                  <Bar dataKey="directo_pct" name="Directo" stackId="a" fill={COLOR_DIRECTO} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#0B1120] border border-slate-800 rounded-lg p-3 space-y-1 text-[11px]">
              <p className="text-slate-300"><strong className="text-[#FF5A00]">¿Qué mide?:</strong> La dominancia en el Buy Box del metabuscador por ruta específica.</p>
              <p className="text-slate-300"><strong className="text-sky-400">Impacto en CTR:</strong> Ganar el mejor precio multiplica el CTR del metabuscador hasta 3x.</p>
            </div>
          </div>

          {/* 3. Histórico de Competitividad (TODOS LOS COMPETIDORES) */}
          <div className="bg-[#111C30] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-lg shadow-black/20">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">3. Histórico de Competitividad Multicompetidor</h3>
                <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded">Tracking</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Evolución del gap % de todos los competidores vs mejor tarifa</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={datosHistoricoScraping} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="fecha_obtencion" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} unit="%" />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={formatPctTooltip}
                  />
                  <Legend wrapperStyle={{ paddingTop: '4px' }} formatter={renderLegendText} />
                  <Line type="monotone" dataKey="gap_promedio_almundo" name="Almundo" stroke={COLOR_ALMUNDO} strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="gap_promedio_despegar" name="Despegar" stroke={COLOR_DESPEGAR} strokeWidth={1.5} dot={{ r: 2.5 }} />
                  <Line type="monotone" dataKey="gap_promedio_atrapalo" name="Atrápalo" stroke={COLOR_ATRAPALO} strokeWidth={1.5} dot={{ r: 2.5 }} />
                  <Line type="monotone" dataKey="gap_promedio_turismocity" name="TurismoCity" stroke={COLOR_TURISMOCITY} strokeWidth={1.5} dot={{ r: 2.5 }} />
                  <Line type="monotone" dataKey="gap_promedio_directo" name="Canal Directo" stroke={COLOR_DIRECTO} strokeWidth={1.5} strokeDasharray="3 3" dot={{ r: 2.5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#0B1120] border border-slate-800 rounded-lg p-3 space-y-1 text-[11px]">
              <p className="text-slate-300"><strong className="text-[#FF5A00]">¿Qué mide?:</strong> La tendencia de competitividad de Almundo frente a toda la industria a través de las capturas.</p>
              <p className="text-slate-300"><strong className="text-sky-400">Impacto en ROAS:</strong> Refleja si las optimizaciones comerciales permitieron achicar la brecha con el mercado.</p>
            </div>
          </div>

        </div>
      </div>

      {/* BLOQUE 2: COMPETITIVIDAD DIRECTA & BOOKING WINDOW */}
      <div>
        <div className="border-b border-slate-800 pb-3 mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-sky-500"></span>
              II. Competitividad Directa & Booking Window (Lead Time)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Elasticidad según días de anticipación y sobreprecios de OTAs sobre webs oficiales de aerolíneas
            </p>
          </div>
          <span className="hidden sm:inline-block text-[11px] font-mono bg-sky-950/60 text-sky-300 border border-sky-800/80 px-2.5 py-1 rounded-full">
            FOCO: LEAD TIME & MARKUPS
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 4. Curva AP */}
          <div className="bg-[#111C30] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-lg shadow-black/20">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">4. Curva de Anticipación (AP)</h3>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Lead Time</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Gap % según días previos a la salida (Advance Purchase)</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={datosAP} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="dias_anticipacion" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} unit="d" />
                  <YAxis stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} unit="%" />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={formatPctTooltip}
                  />
                  <Legend wrapperStyle={{ paddingTop: '4px' }} formatter={renderLegendText} />
                  <Line type="monotone" dataKey="almundo" name="Almundo" stroke={COLOR_ALMUNDO} strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="despegar" name="Despegar" stroke={COLOR_DESPEGAR} strokeWidth={1.5} dot={{ r: 2.5 }} />
                  <Line type="monotone" dataKey="atrapalo" name="Atrápalo" stroke={COLOR_ATRAPALO} strokeWidth={1.5} dot={{ r: 2.5 }} />
                  <Line type="monotone" dataKey="canal_directo" name="Directo" stroke={COLOR_DIRECTO} strokeWidth={1.5} strokeDasharray="3 3" dot={{ r: 2.5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#0B1120] border border-slate-800 rounded-lg p-3 space-y-1 text-[11px]">
              <p className="text-slate-300"><strong className="text-[#FF5A00]">¿Qué mide?:</strong> En qué ventana de compra (Last Minute vs Anticipada) Almundo es más competitivo.</p>
              <p className="text-slate-300"><strong className="text-sky-400">Elasticidad:</strong> Compras de última hora (2-4d) son inelásticas (urgencia); compras de más de 7 días son de alta sensibilidad.</p>
            </div>
          </div>

          {/* 5. Head to Head Almundo vs Despegar */}
          <div className="bg-[#111C30] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-lg shadow-black/20">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">5. Almundo vs Despegar (H2H)</h3>
                <span className="text-[10px] bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 rounded">Rival Directo</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Comparativa de tarifa media directa por ruta en catálogo común</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosHeadToHead} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="ruta" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} tickFormatter={(v) => `${prefijo}${v / 1000}k`} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={formatPrecio}
                  />
                  <Legend wrapperStyle={{ paddingTop: '4px' }} formatter={renderLegendText} />
                  <Bar dataKey="precio_almundo" name="Almundo" fill={COLOR_ALMUNDO} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="precio_despegar" name="Despegar" fill={COLOR_DESPEGAR} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#0B1120] border border-slate-800 rounded-lg p-3 space-y-1 text-[11px]">
              <p className="text-slate-300"><strong className="text-[#FF5A00]">¿Qué mide?:</strong> El spread absoluto contra el principal rival OTA del mercado.</p>
              <p className="text-slate-300"><strong className="text-sky-400">Impacto en Paid Search:</strong> Define la efectividad de campañas de conquista de marca (Search Competitors).</p>
            </div>
          </div>

          {/* 6. Markup vs Canal Directo (INCLUYE TURISMOCITY Y TODAS LAS AEROLÍNEAS COMO LATAM) */}
          <div className="bg-[#111C30] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-lg shadow-black/20">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">6. Markup vs Canal Directo por Aerolínea</h3>
                <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded">Leakage Risk</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Recargo de cada OTA sobre la tarifa oficial de cada aerolínea</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosMarkup} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="aerolinea" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} unit="%" />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={(v: any, name: any) => [`+${v}%`, name]}
                  />
                  <Legend wrapperStyle={{ paddingTop: '4px' }} formatter={renderLegendText} />
                  <Bar dataKey="almundo" name="Almundo" fill={COLOR_ALMUNDO} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="despegar" name="Despegar" fill={COLOR_DESPEGAR} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="atrapalo" name="Atrápalo" fill={COLOR_ATRAPALO} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="turismocity" name="TurismoCity" fill={COLOR_TURISMOCITY} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#0B1120] border border-slate-800 rounded-lg p-3 space-y-1 text-[11px]">
              <p className="text-slate-300"><strong className="text-[#FF5A00]">¿Qué mide?:</strong> El sobreprecio de las agencias respecto al canal oficial de la aerolínea (Aerolíneas Arg., LATAM, JetSmart).</p>
              <p className="text-slate-300"><strong className="text-sky-400">Riesgo de Fuga:</strong> Si el markup supera el 5%, el usuario abandona la compra en la agencia y compra directo.</p>
            </div>
          </div>

        </div>
      </div>

      {/* BLOQUE 3: METABUSCADORES, VISIBILIDAD & DÍA DE LA SEMANA */}
      <div>
        <div className="border-b border-slate-800 pb-3 mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-400"></span>
              III. Paridad de Canales, Visibilidad & Dayparting
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Consistencia entre TurismoCity y Kayak, posición en pantalla y patrones por día de vuelo
            </p>
          </div>
          <span className="hidden sm:inline-block text-[11px] font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-800/80 px-2.5 py-1 rounded-full">
            FOCO: AD RANK & CHANNELS
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 7. Paridad de Canales TurismoCity vs Kayak */}
          <div className="bg-[#111C30] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-lg shadow-black/20">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">7. Paridad: TurismoCity vs Kayak</h3>
                <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded">Channel Parity</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Consistencia de tarifas publicadas entre ambos metabuscadores</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosParidadCanales} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="vendedor" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} tickFormatter={(v) => `${prefijo}${v / 1000}k`} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={formatPrecio}
                  />
                  <Legend wrapperStyle={{ paddingTop: '4px' }} formatter={renderLegendText} />
                  <Bar dataKey="turismocity" name="TurismoCity" fill={COLOR_DESPEGAR} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="kayak" name="Kayak" fill="#F97316" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#0B1120] border border-slate-800 rounded-lg p-3 space-y-1 text-[11px]">
              <p className="text-slate-300"><strong className="text-[#FF5A00]">¿Qué mide?:</strong> Discrepancias de precio entre feeds de afiliados y metabuscadores.</p>
              <p className="text-slate-300"><strong className="text-sky-400">Impacto:</strong> Evita canibalizaciones y arbitrajes negativos de precios entre canales.</p>
            </div>
          </div>

          {/* 8. Ranking de Visibilidad */}
          <div className="bg-[#111C30] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-lg shadow-black/20">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">8. Visibilidad en Pantalla (Ad Rank)</h3>
                <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded">Above the Fold</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Posición media en el listado de agencias (#1 = Mayor Visibilidad)</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosRanking} layout="vertical" margin={{ top: 10, right: 35, left: 35, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis type="number" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} domain={[1, 'dataMax + 0.6']} />
                  <YAxis type="category" dataKey="vendedor" stroke="#64748b" tick={{ fill: '#f8fafc', fontSize: 10, fontWeight: 500 }} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={(v: any) => [`#${v}`, 'Posición Media']}
                  />
                  <Bar dataKey="ranking_promedio" name="Posición Promedio" radius={[0, 4, 4, 0]}>
                    {datosRanking.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.vendedor === 'Almundo' ? COLOR_ALMUNDO : COLOR_DESPEGAR} />
                    ))}
                    <LabelList dataKey="ranking_promedio" position="right" fill="#ffffff" fontSize={10} fontWeight={600} formatter={(v: any) => `#${v}`} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#0B1120] border border-slate-800 rounded-lg p-3 space-y-1 text-[11px]">
              <p className="text-slate-300"><strong className="text-[#FF5A00]">¿Qué mide?:</strong> La ubicación visual promedio en el listado de cotizaciones.</p>
              <p className="text-slate-300"><strong className="text-sky-400">Click Share:</strong> El Top 3 concentra más del 80% de los clics salientes (Above the fold).</p>
            </div>
          </div>

          {/* 9. Sensibilidad Día de la Semana */}
          <div className="bg-[#111C30] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-lg shadow-black/20">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">9. Sensibilidad por Día de Vuelo</h3>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded">Schedule Bidding</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Variación de la brecha de precio según el día de salida</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={datosDiaSemana} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="dia_semana_vuelo" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} tickFormatter={(d) => d.slice(0, 3)} />
                  <YAxis stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} unit="%" />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={formatPctTooltip}
                  />
                  <Legend wrapperStyle={{ paddingTop: '4px' }} formatter={renderLegendText} />
                  <Line type="monotone" dataKey="almundo" name="Almundo" stroke={COLOR_ALMUNDO} strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="despegar" name="Despegar" stroke={COLOR_DESPEGAR} strokeWidth={1.5} dot={{ r: 2.5 }} />
                  <Line type="monotone" dataKey="canal_directo" name="Directo" stroke={COLOR_DIRECTO} strokeWidth={1.5} strokeDasharray="3 3" dot={{ r: 2.5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#0B1120] border border-slate-800 rounded-lg p-3 space-y-1 text-[11px]">
              <p className="text-slate-300"><strong className="text-[#FF5A00]">¿Qué mide?:</strong> Días con mayor presión competitiva según el tipo de viaje (Ocio vs Corporativo).</p>
              <p className="text-slate-300"><strong className="text-sky-400">Impacto:</strong> Permite programar campañas en días con mayor ventaja de precio.</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}