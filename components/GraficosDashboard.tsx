// components/GraficosDashboard.tsx
'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
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
  DatosGraficoAP,
  DatosVolumenAP,
  DatosEstadia,
  DatosDiaSemana,
  DatosShareGanadoresRuta,
  DatosMarkupDirecto,
  DatosRanking,
  DatosDistribucionPosicion,
  DatosFranjaHoraria,
  DatosGapMonedaRuta,
  DatosCorrelacionPosicion
} from '@/lib/data';

interface Props {
  moneda: string;
  competidor: string;
  rutaSeleccionada?: string;
  aerolineaSeleccionada?: string;
  datosDistribucionGap: DatosDistribucionGap[];
  datosRegionCompetitividad: DatosRegionCompetitividad[];
  datosHeadToHeadRelativo: DatosHeadToHeadRelativo[];
  datosAP: DatosGraficoAP[];
  datosVolumenAP: DatosVolumenAP[];
  datosEstadia: DatosEstadia[];
  datosDiaSemana: DatosDiaSemana[];
  datosShareGanadoresRuta: DatosShareGanadoresRuta[];
  datosMarkup: DatosMarkupDirecto[];
  datosRanking: DatosRanking[];
  datosDistribucionPosicion: DatosDistribucionPosicion[];
  datosFranjaHoraria: DatosFranjaHoraria[];
  datosGapMoneda: DatosGapMonedaRuta[];
  datosCorrelacionPosicion: DatosCorrelacionPosicion[];
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
const COLOR_TURISMOCITY = '#A855F7';
const COLOR_ATRAPALO = '#EC4899';
const COLOR_DIRECTO = '#10B981';
const COLOR_ARS = '#FF5A00';
const COLOR_USD = '#22D3EE';
const COLOR_MEJOR_PRECIO = '#10B981';
const COLOR_NO_MEJOR_PRECIO = '#EF4444';

const COLORES_HISTOGRAMA: Record<string, string> = {
  '0% (Win)': '#10B981',
  '0.1% a 3%': '#0EA5E9',
  '3.1% a 7%': '#FF5A00',
  '7.1% a 15%': '#F97316',
  '> 15%': '#EF4444'
};

export default function GraficosDashboard({
  moneda,
  competidor,
  datosDistribucionGap,
  datosRegionCompetitividad,
  datosHeadToHeadRelativo,
  datosAP,
  datosVolumenAP,
  datosEstadia,
  datosDiaSemana,
  datosShareGanadoresRuta,
  datosMarkup,
  datosRanking,
  datosDistribucionPosicion,
  datosFranjaHoraria,
  datosGapMoneda,
  datosCorrelacionPosicion
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

  const renderLegendText = (value: string) => (
    <span className="text-slate-200 font-medium text-xs ml-1">{value}</span>
  );

  // Consolida los ex-gráficos 5 (Estadía), 6 (Día de Semana) y 10 (Franja
  // Horaria) en un único chart con selector: los tres responden la misma
  // pregunta ("¿el gap cambia según el perfil temporal del vuelo?"), solo
  // cambia el eje de corte -- separarlos en 3 cards distintas era redundante.
  type VistaTemporal = 'estadia' | 'dia_semana' | 'franja_horaria';
  const [vistaTemporal, setVistaTemporal] = useState<VistaTemporal>('estadia');

  const vistasTemporales: { id: VistaTemporal; label: string }[] = [
    { id: 'estadia', label: 'Duración de Estadía' },
    { id: 'dia_semana', label: 'Día de Salida' },
    { id: 'franja_horaria', label: 'Franja Horaria' }
  ];

  const configVistaTemporal: Record<
    VistaTemporal,
    { data: any[]; xKey: string; tickFormatter?: (v: string) => string; labelFormatter?: (label: any, payload: any) => any }
  > = {
    estadia: { data: datosEstadia, xKey: 'rango_estadia' },
    dia_semana: { data: datosDiaSemana, xKey: 'dia_semana_vuelo', tickFormatter: (d) => d.slice(0, 3) },
    franja_horaria: {
      data: datosFranjaHoraria,
      xKey: 'franja_horaria',
      labelFormatter: (label, payload) =>
        payload?.[0]?.payload?.rango_horas ? `${label} (${payload[0].payload.rango_horas})` : label
    }
  };

  const notasVistaTemporal: Record<VistaTemporal, React.ReactNode> = {
    estadia: (
      <>
        <p className="text-slate-300"><strong className="text-[#FF5A00]">Escapadas (1-4d):</strong> Tráfico sensible a horarios y canal directo; requiere paridad estricta para convertir.</p>
        <p className="text-slate-300"><strong className="text-sky-400">Vacaciones (9-14d+):</strong> El valor agregado (cuotas, equipaje, hoteles) podría tolerar mayor spread; sin datos de conversión, es una hipótesis a confirmar.</p>
      </>
    ),
    dia_semana: (
      <>
        <p className="text-slate-300"><strong className="text-[#FF5A00]">Patrón Semanal:</strong> Diferencia salidas corporativas (martes/miércoles) vs salidas turísticas (viernes/domingo).</p>
        <p className="text-slate-300"><strong className="text-sky-400">Optimización de Puja:</strong> Activar multiplicadores de CPC en metabuscadores para los días con menor brecha.</p>
      </>
    ),
    franja_horaria: (
      <>
        <p className="text-slate-300"><strong className="text-cyan-400">Menor competencia:</strong> Los horarios menos convenientes (madrugada/noche) suelen tener menos oferta y pueden mostrar gaps distintos a los horarios pico.</p>
        <p className="text-slate-300"><strong className="text-[#FF7A29]">Puja diferenciada:</strong> Si una franja muestra brecha sistemáticamente peor, conviene revisar el pricing específico de esos horarios.</p>
      </>
    )
  };

  return (
    <div className="space-y-12">

      {/* ===================================================================== */}
      {/* BLOQUE I: REVENUE MANAGEMENT & POSICIONAMIENTO REGIONAL               */}
      {/* ===================================================================== */}
      <div>
        <div className="border-b border-slate-800 pb-3 mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#FF5A00] animate-pulse"></span>
              I. Revenue Management & Posicionamiento Regional
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Análisis de posicionamiento tarifario, Buy Box win rate por región y spread vs. {competidor}
            </p>
          </div>
          <span className="hidden sm:inline-block text-[11px] font-mono bg-[#FF5A00]/15 text-[#FF7A29] border border-[#FF5A00]/40 px-2.5 py-1 rounded-full font-semibold">
            BUY BOX Y PRICING REGIONAL
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 1. Histograma de Gap */}
          <div className="bg-[#111C30] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-lg shadow-black/20">
            <div>
              <h3 className="text-sm font-semibold text-white">1. Distribución de Brecha (Buy Box Proximity)</h3>
              <p className="text-[11px] text-slate-400 mt-1">Concentración de vuelos según distancia porcentual a la tarifa ganadora</p>
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
              <p className="text-slate-300"><strong className="text-sky-300">Micro-brecha (0.1% a 3%):</strong> Vuelos prioritarios para micro-ajustes de comisión o promociones bancarias.</p>
              <p className="text-slate-300"><strong className="text-emerald-400">Buy Box Wins (0%):</strong> Vuelos con precio más bajo de pantalla; hipótesis de mayor probabilidad de conversión, pendiente de validar con datos de CVR.</p>
            </div>
          </div>

          {/* 2. Win Rate por Región */}
          <div className="bg-[#111C30] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-lg shadow-black/20">
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

            <div className="bg-[#0B1120] border border-slate-800 rounded-lg p-3 space-y-1 text-[11px]">
              <p className="text-slate-300"><strong className="text-emerald-400">Lectura de Cartera:</strong> Evalúa el balance entre Cabotaje (paridad sensible) e Internacional (financiación).</p>
              <p className="text-slate-300"><strong className="text-sky-400">Decisión Comercial:</strong> Ajustar markups en regiones con Win Rate &lt; 25% para no penalizar la posición de despliegue.</p>
            </div>
          </div>

          {/* 3. Spread H2H Almundo vs Competidor elegido Relativo */}
          <div className="bg-[#111C30] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-lg shadow-black/20">
            <div>
              <h3 className="text-sm font-semibold text-white">3. Spread H2H vs {competidor} (Relativo %)</h3>
              <p className="text-[11px] text-slate-400 mt-1">Diferencial porcentual de tarifa en vuelos cotizados por ambos operadores</p>
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
                      `${v > 0 ? `+${v}% (${competidor} más barato)` : `${v}% (Almundo más barato)`} [${prefijo}${Math.abs(item.payload.spread_promedio_monto).toLocaleString('es-AR')}]`,
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

            <div className="bg-[#0B1120] border border-slate-800 rounded-lg p-3 space-y-1 text-[11px]">
              <p className="text-slate-300"><strong className="text-emerald-400">Verde (&le; 0%):</strong> Almundo cotiza igual o más barato, capturando la preferencia del usuario.</p>
              <p className="text-slate-300"><strong className="text-rose-400">Rojo (&gt; 0%):</strong> {competidor} cotiza con ventaja; riesgo inmediato de fuga de ventas en la góndola.</p>
            </div>
          </div>

        </div>
      </div>

      {/* ===================================================================== */}
      {/* BLOQUE II: PATRONES DE DEMANDA & COMPORTAMIENTO DEL VIAJERO           */}
      {/* ===================================================================== */}
      <div>
        <div className="border-b border-slate-800 pb-3 mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-sky-500"></span>
              II. Patrones de Demanda & Comportamiento del Viajero
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Curva de Anticipación (con volumen de respaldo) y perfil temporal del vuelo: estadía, día y franja horaria de salida
            </p>
          </div>
          <span className="hidden sm:inline-block text-[11px] font-mono bg-sky-950/60 text-sky-300 border border-sky-800/80 px-2.5 py-1 rounded-full">
            VENTANA DE RESERVA Y PERFIL DE VIAJE
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 4. Curva de Anticipación */}
          <div className="bg-[#111C30] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-lg shadow-black/20">
            <div>
              <h3 className="text-sm font-semibold text-white">4. Curva de Anticipación (Advance Purchase)</h3>
              <p className="text-[11px] text-slate-400 mt-1">Brecha porcentual promedio según días previos a la fecha de vuelo</p>
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
                  <Line type="monotone" dataKey="almundo" name="Almundo" stroke={COLOR_ALMUNDO} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                  <Line type="monotone" dataKey="competidor" name={competidor} stroke={COLOR_DESPEGAR} strokeWidth={1.5} dot={{ r: 2.5 }} connectNulls />
                  <Line type="monotone" dataKey="canal_directo" name="Directo" stroke={COLOR_DIRECTO} strokeWidth={1.5} strokeDasharray="3 3" dot={{ r: 2.5 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#0B1120] border border-slate-800 rounded-lg p-3 space-y-1 text-[11px]">
              <p className="text-slate-300"><strong className="text-[#FF5A00]">Ventana Óptima:</strong> Identifica los rangos de anticipación donde Almundo lidera con menor spread.</p>
              <p className="text-slate-300"><strong className="text-sky-400">Pauta Publicitaria:</strong> Alinear el bidding agresivo en metabuscadores hacia las ventanas más competitivas.</p>
            </div>
          </div>

          {/* 5. Perfil Temporal del Vuelo (selector: Estadía / Día de Salida / Franja Horaria) */}
          <div className="bg-[#111C30] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-lg shadow-black/20">
            <div>
              <h3 className="text-sm font-semibold text-white">5. Perfil Temporal del Vuelo</h3>
              <p className="text-[11px] text-slate-400 mt-1">Brecha porcentual promedio según distintos cortes temporales del vuelo</p>

              <nav className="flex flex-wrap items-center gap-1 rounded-full border border-white/10 bg-[#0B1120] p-1 mt-3 w-fit">
                {vistasTemporales.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVistaTemporal(v.id)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition ${
                      vistaTemporal === v.id
                        ? 'bg-[#FF5A00] text-white'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
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
                  <Bar dataKey="competidor" name={competidor} fill={COLOR_DESPEGAR} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="canal_directo" name="Directo" fill={COLOR_DIRECTO} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#0B1120] border border-slate-800 rounded-lg p-3 space-y-1 text-[11px]">
              {notasVistaTemporal[vistaTemporal]}
            </div>
          </div>

          {/* 6. Volumen de Vuelos por Ventana de Anticipación */}
          <div className="bg-[#111C30] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-lg shadow-black/20">
            <div>
              <h3 className="text-sm font-semibold text-white">6. Volumen por Ventana de Anticipación</h3>
              <p className="text-[11px] text-slate-400 mt-1">Cantidad de vuelos distintos detrás de cada tramo de la Curva de Anticipación</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={datosVolumenAP} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="rango_ap" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 9 }} />
                  <YAxis yAxisId="volumen" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                  <YAxis yAxisId="gap" orientation="right" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} unit="%" />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={(v: any, name: any) =>
                      name === 'Vuelos en la muestra' ? [v, name] : formatPctTooltip(v, name)
                    }
                  />
                  <Legend wrapperStyle={{ paddingTop: '4px' }} formatter={renderLegendText} />
                  <Bar yAxisId="volumen" dataKey="total_vuelos" name="Vuelos en la muestra" fill="#334155" radius={[3, 3, 0, 0]} />
                  <Line yAxisId="gap" type="monotone" dataKey="gap_almundo" name="Gap Almundo" stroke={COLOR_ALMUNDO} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#0B1120] border border-slate-800 rounded-lg p-3 space-y-1 text-[11px]">
              <p className="text-slate-300"><strong className="text-[#FF5A00]">Lectura conjunta:</strong> Un tramo con buen gap pero pocas barras (poco volumen) es una conclusión débil — conviene esperar más datos antes de accionar pauta sobre esa ventana.</p>
              <p className="text-slate-300"><strong className="text-sky-400">Dónde confiar:</strong> Priorizá para bidding los tramos donde el gap favorable coincide con volumen alto.</p>
            </div>
          </div>

        </div>
      </div>

      {/* ===================================================================== */}
      {/* BLOQUE III: METABUSCADORES, CANAL DIRECTO & GÓNDOLA PUBLICITARIA     */}
      {/* ===================================================================== */}
      <div>
        <div className="border-b border-slate-800 pb-3 mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-400"></span>
              III. Performance en Metabuscadores, Canal Directo & Góndola
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Disponibilidad de inventario en góndola, índice de fuga al canal directo y posición promedio de despliegue en pantalla
            </p>
          </div>
          <span className="hidden sm:inline-block text-[11px] font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-800/80 px-2.5 py-1 rounded-full">
            CONTROL DE POSICIONAMIENTO Y FUGA DE VENTAS
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 6. Cobertura de Inventario (Top 6 Rutas) */}
          <div className="bg-[#111C30] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-lg shadow-black/20">
            <div>
              <h3 className="text-sm font-semibold text-white">7. Cobertura de Inventario por Ruta</h3>
              <p className="text-[11px] text-slate-400 mt-1">Porcentaje de búsquedas donde cada operador cuenta con oferta activa (Top Rutas)</p>
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
                  <Bar dataKey="turismocity_pct" name="TurismoCity" fill={COLOR_TURISMOCITY} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="atrapalo_pct" name="Atrápalo" fill={COLOR_ATRAPALO} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#0B1120] border border-slate-800 rounded-lg p-3 space-y-1 text-[11px]">
              <p className="text-slate-300"><strong className="text-[#FF5A00]">Salud del Feed:</strong> Rutas con presencia 0% señalan fallas de integración, blackouts o inventario no conectado.</p>
              <p className="text-slate-300"><strong className="text-emerald-400">Cobertura:</strong> Asegurar presencia constante frente a Despegar para no ceder tráfico en tramos clave.</p>
            </div>
          </div>

          {/* 7. Markup vs Canal Directo por Aerolínea (con Atrápalo) */}
          <div className="bg-[#111C30] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-lg shadow-black/20">
            <div>
              <h3 className="text-sm font-semibold text-white">8. Riesgo de Fuga hacia Canal Directo (Markup %)</h3>
              <p className="text-[11px] text-slate-400 mt-1">Recargo medio de las agencias sobre la tarifa oficial de la aerolínea</p>
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
                  <Bar dataKey="turismocity" name="TurismoCity" fill={COLOR_TURISMOCITY} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="atrapalo" name="Atrápalo" fill={COLOR_ATRAPALO} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#0B1120] border border-slate-800 rounded-lg p-3 space-y-1 text-[11px]">
              <p className="text-slate-300"><strong className="text-[#FF5A00]">Desintermediación:</strong> Markups elevados incrementan el riesgo de fuga hacia el canal directo; el umbral de referencia es un supuesto, no viene de datos propios validados.</p>
              <p className="text-slate-300"><strong className="text-sky-400">Benchmark OTA:</strong> Controlar si Atrápalo o Despegar reducen margen para ganar tracción en el metabuscador.</p>
            </div>
          </div>

          {/* 8. Posición Promedio de Despliegue */}
          <div className="bg-[#111C30] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-lg shadow-black/20">
            <div>
              <h3 className="text-sm font-semibold text-white">9. Posición Promedio de Despliegue</h3>
              <p className="text-[11px] text-slate-400 mt-1">Ranking medio de visualización en los resultados (#1 = Mayor probabilidad de clic)</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosRanking} layout="vertical" margin={{ top: 10, right: 35, left: 35, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis type="number" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} domain={[1, 'dataMax + 0.5']} />
                  <YAxis type="category" dataKey="vendedor" stroke="#64748b" tick={{ fill: '#f8fafc', fontSize: 10, fontWeight: 500 }} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={(v: any) => [`#${Number(v).toFixed(1)}`, 'Posición Media']}
                  />
                  <Bar dataKey="ranking_promedio" name="Posición Promedio" radius={[0, 4, 4, 0]}>
                    {datosRanking.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={
                          entry.vendedor === 'Almundo' 
                            ? COLOR_ALMUNDO 
                            : entry.vendedor === 'Despegar' 
                            ? COLOR_DESPEGAR 
                            : entry.vendedor === 'TurismoCity' 
                            ? COLOR_TURISMOCITY 
                            : entry.vendedor === 'Atrápalo' 
                            ? COLOR_ATRAPALO 
                            : '#64748b'
                        } 
                      />
                    ))}
                    <LabelList 
                      dataKey="ranking_promedio" 
                      position="right" 
                      fill="#ffffff" 
                      fontSize={10} 
                      fontWeight={600} 
                      formatter={(v: any) => `#${Number(v).toFixed(1)}`} 
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#0B1120] border border-slate-800 rounded-lg p-3 space-y-1 text-[11px]">
              <p className="text-slate-300"><strong className="text-[#FF5A00]">Click Share:</strong> Estar en las 2 primeras posiciones captura más del 80% de los clics salientes.</p>
              <p className="text-slate-300"><strong className="text-sky-400">Visibilidad:</strong> Una posición promedio &gt; #3 reduce drásticamente el CTR aunque el precio sea competitivo.</p>
            </div>
          </div>

        </div>
      </div>

      {/* ===================================================================== */}
      {/* BLOQUE IV: ANALISIS CAMBIARIO & DIAGNOSTICO DE VISIBILIDAD            */}
      {/* ===================================================================== */}
      <div>
        <div className="border-b border-slate-800 pb-3 mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-cyan-400"></span>
              IV. Análisis Cambiario & Diagnóstico de Visibilidad
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Paridad ARS/USD en rutas bimonetarias y diagnóstico de visibilidad: distribución y correlación de posición en pantalla
            </p>
          </div>
          <span className="hidden sm:inline-block text-[11px] font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-800/80 px-2.5 py-1 rounded-full">
            RIESGO CAMBIARIO
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 9. Gap Almundo: ARS vs USD por ruta bimonetaria */}
          <div className="bg-[#111C30] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-lg shadow-black/20">
            <div>
              <h3 className="text-sm font-semibold text-white">10. Paridad Cambiaria (ARS vs USD)</h3>
              <p className="text-[11px] text-slate-400 mt-1">Brecha promedio de Almundo por moneda, solo en rutas con oferta en ambas</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosGapMoneda} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="ruta" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} unit="%" />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={formatPctTooltip}
                  />
                  <Legend wrapperStyle={{ paddingTop: '4px' }} formatter={renderLegendText} />
                  <Bar dataKey="gap_ars" name="ARS" fill={COLOR_ARS} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="gap_usd" name="USD" fill={COLOR_USD} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#0B1120] border border-slate-800 rounded-lg p-3 space-y-1 text-[11px]">
              <p className="text-slate-300"><strong className="text-cyan-400">Barra faltante:</strong> Si no aparece una de las dos barras, Almundo no tiene oferta en esa moneda para esa ruta — no es un empate a 0%.</p>
              <p className="text-slate-300"><strong className="text-[#FF7A29]">Hipótesis a validar:</strong> Un gap sistemáticamente peor en USD sugiere un problema de actualización de tipo de cambio o de inventario en dólares, no de precio real.</p>
            </div>
          </div>

          {/* 11. Distribución de Posición en Pantalla por Vendedor */}
          <div className="bg-[#111C30] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-lg shadow-black/20">
            <div>
              <h3 className="text-sm font-semibold text-white">11. Distribución de Posición en Pantalla</h3>
              <p className="text-[11px] text-slate-400 mt-1">% de apariciones de cada vendedor en cada rango de posición (no un promedio)</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosDistribucionPosicion} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="rango_posicion" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} unit="%" />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={(v: any, name: any) => [v !== null && v !== undefined ? `${v}%` : 'N/D', name]}
                  />
                  <Legend wrapperStyle={{ paddingTop: '4px' }} formatter={renderLegendText} />
                  <Bar dataKey="almundo_pct" name="Almundo" fill={COLOR_ALMUNDO} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="competidor_pct" name={competidor} fill={COLOR_DESPEGAR} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#0B1120] border border-slate-800 rounded-lg p-3 space-y-1 text-[11px]">
              <p className="text-slate-300"><strong className="text-[#FF5A00]">Por qué importa:</strong> Un promedio de #3 puede esconder que la mitad de las veces estás #1 y la otra mitad #6+ — esta vista muestra si el posicionamiento es estable o errático.</p>
              <p className="text-slate-300"><strong className="text-sky-400">Comparación justa:</strong> Cada barra es % sobre el propio volumen del vendedor, así Almundo y {competidor} son comparables aunque tengan distinta cantidad de cotizaciones.</p>
            </div>
          </div>

          {/* 12. Correlación Precio vs Posición en Pantalla */}
          <div className="bg-[#111C30] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-lg shadow-black/20">
            <div>
              <h3 className="text-sm font-semibold text-white">12. Precio vs Posición en Pantalla</h3>
              <p className="text-[11px] text-slate-400 mt-1">Posición promedio de cada vendedor cuando es el más barato vs cuando no lo es</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosCorrelacionPosicion} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="vendedor" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fill: '#cbd5e1', fontSize: 10 }}
                    reversed
                    domain={[1, 'dataMax + 0.5']}
                    tickFormatter={(v: number) => `#${v.toFixed(1)}`}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={(v: any, name: any) => [v !== null && v !== undefined ? `#${Number(v).toFixed(1)}` : 'N/D', name]}
                  />
                  <Legend wrapperStyle={{ paddingTop: '4px' }} formatter={renderLegendText} />
                  <Bar dataKey="posicion_cuando_mejor_precio" name="Cuando es el más barato" fill={COLOR_MEJOR_PRECIO} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="posicion_cuando_no_mejor_precio" name="Cuando NO es el más barato" fill={COLOR_NO_MEJOR_PRECIO} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#0B1120] border border-slate-800 rounded-lg p-3 space-y-1 text-[11px]">
              <p className="text-slate-300"><strong className="text-emerald-400">Sin diferencia:</strong> Si las dos barras de un vendedor son parecidas, su posición en pantalla no depende del precio — puede haber un acuerdo comercial u otro criterio de ranking.</p>
              <p className="text-slate-300"><strong className="text-rose-400">Techo de posición:</strong> Barra roja alta pese a precio bajo sugiere que ser el más barato no alcanza para mejorar la visibilidad de Almundo.</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}