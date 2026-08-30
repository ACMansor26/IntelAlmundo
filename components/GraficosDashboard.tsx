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
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)'
  },
  labelStyle: {
    color: '#ffffff',
    fontWeight: 600,
    marginBottom: '4px'
  },
  itemStyle: {
    color: '#f8fafc'
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

  const formatPrecio = (value: any) => {
    if (typeof value === 'number') {
      return [`${prefijo}${Math.round(value).toLocaleString('es-AR')}`, ''];
    }
    return [value, ''];
  };

  const formatPctTooltip = (value: any) => {
    if (typeof value === 'number') {
      return [`+${value}%`, ''];
    }
    return [value, ''];
  };

  const renderLegendText = (value: string) => (
    <span className="text-slate-200 font-medium text-xs ml-1">{value}</span>
  );

  return (
    <div className="space-y-10">

      {/* =========================================================================
          BLOQUE 1: REVENUE MANAGEMENT & PRICING ESTRATÉGICO
         ========================================================================= */}
      <div>
        <div className="border-b border-slate-800 pb-2 mb-4">
          <h2 className="text-lg font-bold text-white tracking-wide uppercase flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400"></span>
            I. Revenue Management & Oportunidades Clave
          </h2>
          <p className="text-xs text-slate-400">
            Detección de ventas marginales, share por mercado y evolución temporal
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 7. Histograma de Oportunidad */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-white">
                1. Histograma de Brecha Almundo
              </h3>
              <p className="text-[11px] text-slate-400">
                Distribución de vuelos según distancia respecto al mejor precio
              </p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosDistribucionGap} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="rango_gap" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={(v: any, _, item: any) => [`${v} vuelos (${item.payload.share_pct}%)`, 'Cantidad']}
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
          </div>

          {/* 8. Cuota de Victorias por Ruta (100% Stacked) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-white">
                2. Share de Victorias por Ruta (%)
              </h3>
              <p className="text-[11px] text-slate-400">
                Porcentaje de vuelos donde cada competidor gana el precio mínimo
              </p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosShareGanadoresRuta} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="ruta" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} unit="%" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={(v: any) => [`${v}%`, 'Win Share']}
                  />
                  <Legend wrapperStyle={{ paddingTop: '6px' }} formatter={renderLegendText} />
                  <Bar dataKey="almundo_pct" name="Almundo" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="despegar_pct" name="Despegar" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="atrapalo_pct" name="Atrápalo" stackId="a" fill="#ec4899" />
                  <Bar dataKey="directo_pct" name="Directo" stackId="a" fill="#10b981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 10. Evolución Histórica de Scraping */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-white">
                3. Histórico de Competitividad
              </h3>
              <p className="text-[11px] text-slate-400">
                Evolución de la brecha % a lo largo de las fechas de captura
              </p>
            </div>
            <div className="h-64 w-full">
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
                  <Legend wrapperStyle={{ paddingTop: '6px' }} formatter={renderLegendText} />
                  <Line type="monotone" dataKey="gap_promedio_almundo" name="Gap Almundo %" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="gap_promedio_despegar" name="Gap Despegar %" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BLOQUE 2: COMPETITIVIDAD DIRECTA & ANTICIPACIÓN
         ========================================================================= */}
      <div>
        <div className="border-b border-slate-800 pb-2 mb-4">
          <h2 className="text-lg font-bold text-white tracking-wide uppercase flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>
            II. Competitividad Directa & Anticipación (AP)
          </h2>
          <p className="text-xs text-slate-400">
            Comparativa contra OTAs rivales, curvas por días de compra y sobreprecio oficial
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1. Curva AP */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-white">
                4. Curva de Anticipación (AP)
              </h3>
              <p className="text-[11px] text-slate-400">
                Gap % vs mínimo según días previos a la salida del vuelo
              </p>
            </div>
            <div className="h-64 w-full">
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
                  <Legend wrapperStyle={{ paddingTop: '6px' }} formatter={renderLegendText} />
                  <Line type="monotone" dataKey="almundo" name="Almundo" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="despegar" name="Despegar" stroke="#3b82f6" strokeWidth={1.5} dot={{ r: 2.5 }} />
                  <Line type="monotone" dataKey="atrapalo" name="Atrápalo" stroke="#ec4899" strokeWidth={1.5} dot={{ r: 2.5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 5. Head to Head Almundo vs Despegar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-white">
                5. Head-to-Head: Almundo vs Despegar
              </h3>
              <p className="text-[11px] text-slate-400">
                Comparativa de tarifa promedio directa por ruta monitoreada
              </p>
            </div>
            <div className="h-64 w-full">
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
                  <Legend wrapperStyle={{ paddingTop: '6px' }} formatter={renderLegendText} />
                  <Bar dataKey="precio_almundo" name="Almundo" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="precio_despegar" name="Despegar" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Markup vs Canal Directo */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-white">
                6. Markup sobre Canal Directo (%)
              </h3>
              <p className="text-[11px] text-slate-400">
                Sobreprecio de cada OTA respecto a la web oficial de la aerolínea
              </p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosMarkup} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="aerolinea" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} unit="%" />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={(v: any) => [`+${v}%`, 'Markup']}
                  />
                  <Legend wrapperStyle={{ paddingTop: '6px' }} formatter={renderLegendText} />
                  <Bar dataKey="almundo" name="Almundo" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="despegar" name="Despegar" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BLOQUE 3: SEGMENTACIÓN OPERATIVA, CANALES & VISIBILIDAD
         ========================================================================= */}
      <div>
        <div className="border-b border-slate-800 pb-2 mb-4">
          <h2 className="text-lg font-bold text-white tracking-wide uppercase flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
            III. Segmentación Operativa, Canales & Visibilidad
          </h2>
          <p className="text-xs text-slate-400">
            Paridad entre metabuscadores, posición en listado y patrones por día/equipaje
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 9. Paridad de Canales TurismoCity vs Kayak */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-white">
                7. Paridad de Canales: TurismoCity vs Kayak
              </h3>
              <p className="text-[11px] text-slate-400">
                Chequeo de disparidad en precios publicados en ambos metabuscadores
              </p>
            </div>
            <div className="h-64 w-full">
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
                  <Legend wrapperStyle={{ paddingTop: '6px' }} formatter={renderLegendText} />
                  <Bar dataKey="turismocity" name="TurismoCity" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="kayak" name="Kayak" fill="#f97316" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4. Ranking de Visibilidad */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-white">
                8. Visibilidad en Pantalla (Ranking Promedio)
              </h3>
              <p className="text-[11px] text-slate-400">
                Posición media en el listado de proveedores (Posición #1 = Mayor visibilidad)
              </p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosRanking} layout="vertical" margin={{ top: 10, right: 35, left: 35, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} domain={[1, 'dataMax + 0.6']} />
                  <YAxis type="category" dataKey="vendedor" stroke="#64748b" tick={{ fill: '#f8fafc', fontSize: 10, fontWeight: 500 }} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={(v: any) => [`Posición #${v}`, 'Ranking Promedio']}
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
          </div>

          {/* 3. Competitividad por Equipaje */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-white">
                9. Competitividad por Tipo de Equipaje
              </h3>
              <p className="text-[11px] text-slate-400">
                Gap % de cada vendedor respecto al precio mínimo según franquicia
              </p>
            </div>
            <div className="h-64 w-full">
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
                  <Legend wrapperStyle={{ paddingTop: '6px' }} formatter={renderLegendText} />
                  <Bar dataKey="almundo" name="Almundo" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="despegar" name="Despegar" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="canal_directo" name="Directo" fill="#10b981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 6. Sensibilidad Día de la Semana */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-white">
                10. Sensibilidad por Día de la Semana
              </h3>
              <p className="text-[11px] text-slate-400">
                Variación de la brecha % según el día de salida del vuelo
              </p>
            </div>
            <div className="h-64 w-full">
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
                  <Legend wrapperStyle={{ paddingTop: '6px' }} formatter={renderLegendText} />
                  <Line type="monotone" dataKey="almundo" name="Almundo" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="despegar" name="Despegar" stroke="#3b82f6" strokeWidth={1.5} dot={{ r: 2.5 }} />
                  <Line type="monotone" dataKey="canal_directo" name="Directo" stroke="#10b981" strokeWidth={1.5} strokeDasharray="3 3" dot={{ r: 2.5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}