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
  DatosEquipaje,
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
  datosAP: DatosGraficoAP[];
  datosMarkup: DatosMarkupDirecto[];
  datosEquipaje: DatosEquipaje[];
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
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#ffffff',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
    padding: '10px 14px'
  },
  labelStyle: {
    color: '#f8fafc',
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

const COLORES_HISTOGRAMA: Record<string, string> = {
  '0% (Win)': '#10b981',
  '0.1% a 3%': '#06b6d4',
  '3.1% a 7%': '#f59e0b',
  '7.1% a 15%': '#f97316',
  '> 15%': '#ef4444'
};

export default function GraficosDashboard({
  moneda,
  rutaSeleccionada,
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

      {/* =========================================================================
          BLOQUE 1: REVENUE MANAGEMENT & LOW-HANGING FRUIT
         ========================================================================= */}
      <div>
        <div className="border-b border-slate-800 pb-3 mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-amber-400 animate-pulse"></span>
              I. Revenue Management & Conversiones Incrementales (Low-Hanging Fruit)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Identificación de micro-brechas de precio para maximizar Conversion Rate (CVR) y Share de Mercado
            </p>
          </div>
          <span className="hidden sm:inline-block text-[11px] font-mono bg-amber-950/60 text-amber-300 border border-amber-800/80 px-2.5 py-1 rounded-full">
            FOCO: CVR & ROAS
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 1. Histograma de Brecha */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">1. Histograma de Elasticidad / Gap</h3>
                <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded">Oportunidad</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Concentración de inventario según distancia a la mejor tarifa</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosDistribucionGap} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
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
                      <Cell key={`cell-${index}`} fill={COLORES_HISTOGRAMA[entry.rango_gap] || '#f59e0b'} />
                    ))}
                    <LabelList dataKey="share_pct" position="top" fill="#cbd5e1" fontSize={10} formatter={(v: any) => `${v}%`} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Explicación Marketing */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 space-y-1 text-[11px]">
              <p className="text-slate-300"><strong className="text-amber-400">¿Qué mide?:</strong> Qué % del inventario está "a tiro" de ganar la venta.</p>
              <p className="text-slate-300"><strong className="text-blue-400">Impacto en CVR:</strong> Los vuelos en el rango <span className="text-cyan-300 font-semibold">0.1% a 3%</span> son ventas perdidas por diferencias mínimas de precio.</p>
              <p className="text-slate-300"><strong className="text-emerald-400">Playbook:</strong> Activar cupones dinámicos o micro-rebajas para capturar este volumen sin destruir el margen medio.</p>
            </div>
          </div>

          {/* 2. Cuota de Victorias por Ruta (100% Stacked) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">2. Share de Victorias (Buy Box)</h3>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">Share of Voice</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">% de veces que cada competidor lidera el precio mínimo por ruta</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosShareGanadoresRuta} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="ruta" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} unit="%" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={(v: any, name: any) => [`${v}%`, name]}
                  />
                  <Legend wrapperStyle={{ paddingTop: '4px' }} formatter={renderLegendText} />
                  <Bar dataKey="almundo_pct" name="Almundo" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="despegar_pct" name="Despegar" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="atrapalo_pct" name="Atrápalo" stackId="a" fill="#ec4899" />
                  <Bar dataKey="directo_pct" name="Directo" stackId="a" fill="#10b981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Explicación Marketing */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 space-y-1 text-[11px]">
              <p className="text-slate-300"><strong className="text-amber-400">¿Qué mide?:</strong> La dominancia en el Buy Box del metabuscador por ruta específica.</p>
              <p className="text-slate-300"><strong className="text-blue-400">Impacto en CTR:</strong> Ganar el mejor precio multiplica el CTR del metabuscador hasta 3x.</p>
              <p className="text-slate-300"><strong className="text-emerald-400">Playbook:</strong> Aumentar puja (Bid Modifiers) en rutas ganadoras y bajar inversión en rutas con pérdida estructural de precio.</p>
            </div>
          </div>

          {/* 3. Histórico de Competitividad */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">3. Histórico de Competitividad</h3>
                <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded">Tracking</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Evolución de la brecha de pricing a lo largo de las fechas de captura</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={datosHistoricoScraping} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="fecha_obtencion" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} unit="%" />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={formatPctTooltip}
                  />
                  <Legend wrapperStyle={{ paddingTop: '4px' }} formatter={renderLegendText} />
                  <Line type="monotone" dataKey="gap_promedio_almundo" name="Gap Almundo" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="gap_promedio_despegar" name="Gap Despegar" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Explicación Marketing */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 space-y-1 text-[11px]">
              <p className="text-slate-300"><strong className="text-amber-400">¿Qué mide?:</strong> La tendencia de competitividad antes y después de cambios de pricing o promociones.</p>
              <p className="text-slate-300"><strong className="text-blue-400">Impacto en ROAS:</strong> Correlaciona si las campañas de Paid Media se lanzaron con precios competitivos.</p>
              <p className="text-slate-300"><strong className="text-emerald-400">Playbook:</strong> Intensificar pauta en Google/Meta Ads en días donde la brecha vs Despegar se achica.</p>
            </div>
          </div>

        </div>
      </div>

      {/* =========================================================================
          BLOQUE 2: COMPETITIVIDAD DIRECTA & BOOKING WINDOW (AP)
         ========================================================================= */}
      <div>
        <div className="border-b border-slate-800 pb-3 mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-blue-500"></span>
              II. Competitividad Directa & Booking Window (Lead Time)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Elasticidad de compra según días de anticipación y benchmarking contra OTAs y aerolíneas
            </p>
          </div>
          <span className="hidden sm:inline-block text-[11px] font-mono bg-blue-950/60 text-blue-300 border border-blue-800/80 px-2.5 py-1 rounded-full">
            FOCO: FUNNEL & BOOKING LEAD TIME
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 4. Curva AP */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="dias_anticipacion" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} unit="d" />
                  <YAxis stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} unit="%" />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={formatPctTooltip}
                  />
                  <Legend wrapperStyle={{ paddingTop: '4px' }} formatter={renderLegendText} />
                  <Line type="monotone" dataKey="almundo" name="Almundo" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="despegar" name="Despegar" stroke="#3b82f6" strokeWidth={1.5} dot={{ r: 2.5 }} />
                  <Line type="monotone" dataKey="atrapalo" name="Atrápalo" stroke="#ec4899" strokeWidth={1.5} dot={{ r: 2.5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 space-y-1 text-[11px]">
              <p className="text-slate-300"><strong className="text-amber-400">¿Qué mide?:</strong> En qué ventana de compra (Last Minute vs Anticipada) Almundo es más competitivo.</p>
              <p className="text-slate-300"><strong className="text-blue-400">Elasticidad:</strong> Compras de última hora (2-4d) son inelásticas (urgencia); compras lejanas son de alta sensibilidad de precio.</p>
              <p className="text-slate-300"><strong className="text-emerald-400">Playbook:</strong> Mantener margen en última hora; afilar precios en ventanas +7 días para ganar el tráfico de planificación.</p>
            </div>
          </div>

          {/* 5. Head to Head Almundo vs Despegar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="ruta" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} tickFormatter={(v) => `${prefijo}${v / 1000}k`} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={formatPrecio}
                  />
                  <Legend wrapperStyle={{ paddingTop: '4px' }} formatter={renderLegendText} />
                  <Bar dataKey="precio_almundo" name="Almundo" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="precio_despegar" name="Despegar" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 space-y-1 text-[11px]">
              <p className="text-slate-300"><strong className="text-amber-400">¿Qué mide?:</strong> El spread absoluto contra el mayor competidor de pauta digital del país.</p>
              <p className="text-slate-300"><strong className="text-blue-400">Impacto en Paid Search:</strong> Define el éxito en campañas de conquista de marca (Search Competitors).</p>
              <p className="text-slate-300"><strong className="text-emerald-400">Playbook:</strong> Activar anuncios con copys de pricing agresivo en las rutas donde Almundo le gana a Despegar.</p>
            </div>
          </div>

          {/* 6. Markup vs Canal Directo */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">6. Markup vs Canal Directo</h3>
                <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded">Leakage Risk</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Recargo de cada OTA sobre la tarifa oficial de la aerolínea</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosMarkup} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="aerolinea" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} unit="%" />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={(v: any, name: any) => [`+${v}%`, name]}
                  />
                  <Legend wrapperStyle={{ paddingTop: '4px' }} formatter={renderLegendText} />
                  <Bar dataKey="almundo" name="Almundo" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="despegar" name="Despegar" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 space-y-1 text-[11px]">
              <p className="text-slate-300"><strong className="text-amber-400">¿Qué mide?:</strong> El sobreprecio aplicado respecto a comprar directamente en la aerolínea.</p>
              <p className="text-slate-300"><strong className="text-blue-400">Riesgo de Fuga:</strong> Si el markup supera el 5%, el usuario abandona la metabúsqueda y compra directo.</p>
              <p className="text-slate-300"><strong className="text-emerald-400">Playbook:</strong> Comunicar cuotas sin interés y beneficios de fidelidad para justificar el diferencial.</p>
            </div>
          </div>

        </div>
      </div>

      {/* =========================================================================
          BLOQUE 3: SEGMENTACIÓN OPERATIVA, CANALES & VISIBILIDAD
         ========================================================================= */}
      <div>
        <div className="border-b border-slate-800 pb-3 mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-400"></span>
              III. Segmentación de Audiencias, Paridad de Canales & Visibilidad
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Optimización de Ad Rank en metabuscadores, paridad de canales afiliados y segmentación por día/franquicia
            </p>
          </div>
          <span className="hidden sm:inline-block text-[11px] font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-800/80 px-2.5 py-1 rounded-full">
            FOCO: AD RANK & DAYPARTING
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* 7. Paridad de Canales TurismoCity vs Kayak */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">7. Paridad de Canales: TurismoCity vs Kayak</h3>
                <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded">Channel Parity</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Consistencia de tarifas publicadas entre ambos metabuscadores</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosParidadCanales} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="vendedor" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} tickFormatter={(v) => `${prefijo}${v / 1000}k`} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={formatPrecio}
                  />
                  <Legend wrapperStyle={{ paddingTop: '4px' }} formatter={renderLegendText} />
                  <Bar dataKey="turismocity" name="TurismoCity" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="kayak" name="Kayak" fill="#f97316" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 space-y-1 text-[11px]">
              <p className="text-slate-300"><strong className="text-amber-400">¿Qué mide?:</strong> Discrepancias de precio entre feeds de afiliados y metabuscadores.</p>
              <p className="text-slate-300"><strong className="text-blue-400">Impacto en Canibalización:</strong> Precios dispares entre canales canibalizan el ROAS y dañan el Quality Score de los feeds.</p>
              <p className="text-slate-300"><strong className="text-emerald-400">Playbook:</strong> Auditar caching y reglas de markups por partner ID para evitar arbitrajes negativos.</p>
            </div>
          </div>

          {/* 8. Ranking de Visibilidad */}
          {/* 8. Ranking de Visibilidad */}
<div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
  <div>
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-white">8. Visibilidad en Pantalla (Ad Rank / Posición)</h3>
      <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded">Above the Fold</span>
    </div>
    <p className="text-[11px] text-slate-400 mt-1">Posición media en el listado de agencias (Posición #1 = Mayor Click Share)</p>
  </div>

  <div className="h-56 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={datosRanking} layout="vertical" margin={{ top: 10, right: 35, left: 35, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
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
            <Cell key={`cell-${index}`} fill={entry.vendedor === 'Almundo' ? '#f59e0b' : '#3b82f6'} />
          ))}
          <LabelList dataKey="ranking_promedio" position="right" fill="#ffffff" fontSize={10} fontWeight={600} formatter={(v: any) => `#${v}`} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>

  <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 space-y-1 text-[11px]">
    <p className="text-slate-300"><strong className="text-amber-400">¿Qué mide?:</strong> La ubicación visual promedio en el listado de cotizaciones.</p>
    <p className="text-slate-300"><strong className="text-blue-400">Click Share:</strong> El Top 3 concentra más del 80% de los clics salientes.</p>
    <p className="text-slate-300"><strong className="text-emerald-400">Playbook:</strong> Ajustar pricing en rutas clave para escalar al Top 3 y evitar pérdida de visibilidad en el feed.</p>
  </div>
</div>

          {/* 9. Competitividad por Equipaje */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">9. Competitividad por Franquicia de Equipaje</h3>
                <span className="text-[10px] bg-teal-950 text-teal-300 border border-teal-800 px-2 py-0.5 rounded">Product Tiering</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Gap % respecto a la tarifa mínima según equipaje incluido</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosEquipaje} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="equipaje_incluido" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} unit="%" />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={formatPctTooltip}
                  />
                  <Legend wrapperStyle={{ paddingTop: '4px' }} formatter={renderLegendText} />
                  <Bar dataKey="almundo" name="Almundo" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="despegar" name="Despegar" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="canal_directo" name="Directo" fill="#10b981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 space-y-1 text-[11px]">
              <p className="text-slate-300"><strong className="text-amber-400">¿Qué mide?:</strong> Competitividad en tarifas *unbundled* (mochila) vs completas (bodega).</p>
              <p className="text-slate-300"><strong className="text-blue-400">AOV vs Adquisición:</strong> "Solo mochila" tracciona clics de adquisición; "bodega" aporta alto Average Order Value.</p>
              <p className="text-slate-300"><strong className="text-emerald-400">Playbook:</strong> Destinar campañas de tráfico frío a tarifas base y retargeting a paquetes con equipaje.</p>
            </div>
          </div>

          {/* 10. Sensibilidad Día de la Semana */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">10. Sensibilidad por Día de Vuelo (Dayparting)</h3>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded">Schedule Bidding</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Variación de la brecha de precio según el día de la semana de salida</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={datosDiaSemana} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="dia_semana_vuelo" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} tickFormatter={(d) => d.slice(0, 3)} />
                  <YAxis stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} unit="%" />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={formatPctTooltip}
                  />
                  <Legend wrapperStyle={{ paddingTop: '4px' }} formatter={renderLegendText} />
                  <Line type="monotone" dataKey="almundo" name="Almundo" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="despegar" name="Despegar" stroke="#3b82f6" strokeWidth={1.5} dot={{ r: 2.5 }} />
                  <Line type="monotone" dataKey="canal_directo" name="Directo" stroke="#10b981" strokeWidth={1.5} strokeDasharray="3 3" dot={{ r: 2.5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 space-y-1 text-[11px]">
              <p className="text-slate-300"><strong className="text-amber-400">¿Qué mide?:</strong> Días con mayor presión competitiva según tipo de viaje (Ocio fin de semana vs Corporativo).</p>
              <p className="text-slate-300"><strong className="text-blue-400">Impacto en Paid Media:</strong> Optimiza las pujas de Google/Meta según el día de vuelo más rentable.</p>
              <p className="text-slate-300"><strong className="text-emerald-400">Playbook:</strong> Incrementar pauta para salidas en los días donde Almundo ofrece el spread más bajo.</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}