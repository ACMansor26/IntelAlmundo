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

// Alternativa accesible a cada grafico: los mismos datos en una tabla real
// (lectores de pantalla, teclado, copiar/pegar). Va colapsada para no ocupar
// espacio a quien ve el grafico.
type FilaDatos = Record<string, unknown>;
// Lo unico que se usa del item que recharts pasa a los formatter de tooltip.
type ItemGrafico = { payload?: Record<string, unknown> };
// rango_horas del primer punto del tooltip de la franja horaria (payload de recharts: array de items).
const rangoDeHoras = (payload: unknown): string | null => {
  const primero = Array.isArray(payload) ? (payload[0] as ItemGrafico | undefined) : undefined;
  const r = primero?.payload?.rango_horas;
  return typeof r === 'string' ? r : null;
};

interface ColumnaTabla {
  key: string;
  label: string;
  formato?: (v: unknown, fila: FilaDatos) => string;
}

function TablaDatos({ titulo, columnas, filas }: { titulo: string; columnas: ColumnaTabla[]; filas: object[] }) {
  return (
    <details className="rounded-lg border border-white/10 bg-[color:var(--sunk)] text-[11px]">
      <summary className="cursor-pointer select-none px-3 py-2 font-medium text-slate-300 hover:text-white">
        Ver datos en tabla
      </summary>
      <div className="overflow-x-auto px-3 pb-3">
        <table className="w-full text-left">
          <caption className="sr-only">{titulo}</caption>
          <thead>
            <tr className="text-slate-400">
              {columnas.map((c) => (
                <th key={c.key} scope="col" className="py-1.5 pr-3 font-medium">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {filas.length === 0 && (
              <tr>
                <td colSpan={columnas.length} className="py-2 text-slate-400">Sin datos para los filtros seleccionados.</td>
              </tr>
            )}
            {(filas as FilaDatos[]).map((f, i) => (
              <tr key={i}>
                {columnas.map((c, j) => {
                  const v = f[c.key];
                  const txt = c.formato ? c.formato(v, f) : v === null || v === undefined ? 'N/D' : String(v);
                  return j === 0 ? (
                    <th key={c.key} scope="row" className="py-1.5 pr-3 font-medium text-white">{txt}</th>
                  ) : (
                    <td key={c.key} className="py-1.5 pr-3 tabular-nums">{txt}</td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

const pct = (v: unknown) => (v === null || v === undefined ? 'N/D' : `${v}%`);
const num = (v: unknown) => (v === null || v === undefined ? 'N/D' : Number(v).toLocaleString('es-AR'));

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

  const formatPctTooltip = (value: unknown, name: string | number | undefined): [string, string | number] => {
    if (value === null || value === undefined) return ['N/D', name ?? ''];
    if (typeof value === 'number') {
      const signo = value > 0 ? '+' : '';
      return [`${signo}${value}%`, name ?? ''];
    }
    return [String(value), name ?? ''];
  };

  const formatMonto = (v: unknown, name: string | number | undefined) => [`${prefijo}${Number(v).toLocaleString('es-AR')}`, name ?? ''];

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
    { data: object[]; xKey: string; tickFormatter?: (v: string) => string; labelFormatter?: (label: unknown, payload: unknown) => string }
  > = {
    dia_semana: { data: datosDiaSemana, xKey: 'dia_semana_vuelo', tickFormatter: (d) => d.slice(0, 3) },
    franja_horaria: {
      data: datosFranjaHoraria,
      xKey: 'franja_horaria',
      labelFormatter: (label, payload) =>
        rangoDeHoras(payload) ? `${label} (${rangoDeHoras(payload)})` : String(label)
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

            <div className="h-56 w-full" role="img" aria-label="1. Gráfico de barras: cantidad de vuelos de Almundo por rango de distancia a la tarifa más baja. Los mismos datos están en la tabla de abajo.">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosDistribucionGap} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="rango_gap" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={(v: unknown, _, item: ItemGrafico) => [`${v} vuelos (${item.payload?.share_pct}%)`, 'Volumen']}
                  />
                  <Bar dataKey="cantidad_vuelos" name="Vuelos" radius={[4, 4, 0, 0]}>
                    {datosDistribucionGap.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORES_HISTOGRAMA[entry.rango_gap] || COLOR_ALMUNDO} />
                    ))}
                    <LabelList dataKey="share_pct" position="top" fill="#cbd5e1" fontSize={10} formatter={(v: unknown) => `${v}%`} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <TablaDatos titulo="Distribución de brecha" filas={datosDistribucionGap} columnas={[{ key: 'rango_gap', label: 'Rango de brecha' }, { key: 'cantidad_vuelos', label: 'Vuelos', formato: num }, { key: 'share_pct', label: 'Participación', formato: pct }]} />

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

            <div className="h-64 w-full" role="img" aria-label="2. Gráfico de barras horizontales: win rate de Almundo por región. Los mismos datos están en la tabla de abajo.">
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
                    formatter={(v: unknown, name: string | number | undefined, item: ItemGrafico) => [
                      `${v}% (${item.payload?.total_vuelos} vuelos / Gap: +${item.payload?.gap_promedio_almundo || 0}%)`,
                      'Win Rate'
                    ]}
                  />
                  <Bar dataKey="win_rate_almundo_pct" name="Win Rate Almundo" fill="#10B981" radius={[0, 4, 4, 0]}>
                    <LabelList dataKey="win_rate_almundo_pct" position="right" fill="#ffffff" fontSize={10} formatter={(v: unknown) => `${v}%`} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <TablaDatos titulo="Win rate de Almundo por región" filas={datosRegionCompetitividad} columnas={[{ key: 'region', label: 'Región' }, { key: 'total_vuelos', label: 'Vuelos', formato: num }, { key: 'win_rate_almundo_pct', label: 'Win rate', formato: pct }, { key: 'gap_promedio_almundo', label: 'Brecha promedio', formato: pct }]} />

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

            <div className="h-56 w-full" role="img" aria-label="3. Gráfico de barras: diferencia porcentual de precio entre Almundo y el competidor elegido, por ruta. Los mismos datos están en la tabla de abajo.">
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
                    formatter={(v: unknown, _, item: ItemGrafico) => [
                      `${Number(v) > 0 ? `+${v}% (${competidor} más barato)` : `${v}% (Almundo más barato)`} [${prefijo}${Math.abs(Number(item.payload?.spread_promedio_monto)).toLocaleString('es-AR')}] · ${item.payload?.vuelos_comparados} vuelos`,
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

            <TablaDatos titulo={`Spread de Almundo vs ${competidor} por ruta`} filas={datosHeadToHeadRelativo} columnas={[{ key: 'ruta', label: 'Ruta' }, { key: 'vuelos_comparados', label: 'Vuelos comparados', formato: num }, { key: 'spread_promedio_pct', label: 'Spread', formato: pct }, { key: 'spread_promedio_monto', label: 'Spread en monto', formato: (v) => `${prefijo}${num(v)}` }]} />

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

            <div className="h-56 w-full" role="img" aria-label="4. Gráfico de barras apiladas: composición del precio promedio de cada vendedor en tarifa base, impuestos, tasas y fee. Los mismos datos están en la tabla de abajo.">
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

            <TablaDatos titulo="Composición del precio por vendedor" filas={datosComposicion} columnas={[{ key: 'vendedor', label: 'Vendedor' }, { key: 'tarifa_base', label: 'Tarifa base', formato: (v) => `${prefijo}${num(v)}` }, { key: 'impuestos', label: 'Impuestos', formato: (v) => `${prefijo}${num(v)}` }, { key: 'tasas', label: 'Tasas', formato: (v) => `${prefijo}${num(v)}` }, { key: 'cargo_gestion', label: 'Fee', formato: (v) => `${prefijo}${num(v)}` }, { key: 'precio_total', label: 'Precio total', formato: (v) => `${prefijo}${num(v)}` }, { key: 'pct_fee', label: 'Fee %', formato: pct }, { key: 'muestras', label: 'Lecturas', formato: num }]} />

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

            <div className="h-56 w-full" role="img" aria-label="5. Gráfico de barras: brecha promedio de Almundo y del competidor según el día de salida o la franja horaria elegidos. Los mismos datos están en la tabla de abajo.">
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

            <TablaDatos titulo={`Brecha promedio por ${vistaTemporal === 'dia_semana' ? 'día de salida' : 'franja horaria'}`} filas={configVistaTemporal[vistaTemporal].data} columnas={[{ key: configVistaTemporal[vistaTemporal].xKey, label: vistaTemporal === 'dia_semana' ? 'Día' : 'Franja', formato: (v, f) => (f.rango_horas ? `${v} (${f.rango_horas})` : String(v)) }, { key: 'almundo', label: 'Almundo', formato: pct }, { key: 'competidor', label: competidor, formato: pct }]} />

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

            <div className="h-56 w-full" role="img" aria-label="6. Gráfico de barras: fee promedio como porcentaje del precio sin fee, por aerolínea y vendedor. Los mismos datos están en la tabla de abajo.">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosFee} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="aerolinea" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} unit="%" />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={(v: unknown, name: string | number | undefined) => [v !== null && v !== undefined ? `${v}%` : 'N/D', name ?? '']}
                  />
                  <Legend wrapperStyle={{ paddingTop: '4px' }} formatter={renderLegendText} />
                  <Bar dataKey="almundo" name="Almundo" fill={COLOR_ALMUNDO} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="despegar" name="Despegar" fill={COLOR_DESPEGAR} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="atrapalo" name="Atrápalo" fill={COLOR_ATRAPALO} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <TablaDatos titulo="Fee por aerolínea y vendedor" filas={datosFee} columnas={[{ key: 'aerolinea', label: 'Aerolínea' }, { key: 'almundo', label: 'Almundo', formato: pct }, { key: 'despegar', label: 'Despegar', formato: pct }, { key: 'atrapalo', label: 'Atrápalo', formato: pct }]} />

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

            <div className="h-56 w-full" role="img" aria-label="7. Gráfico de barras: porcentaje de vuelos en que se pudo leer el checkout de cada vendedor, por ruta. Los mismos datos están en la tabla de abajo.">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosShareGanadoresRuta} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="ruta" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} unit="%" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={(v: unknown, name: string | number | undefined) => [`${v}% de vuelos`, name ?? '']}
                  />
                  <Legend wrapperStyle={{ paddingTop: '4px' }} formatter={renderLegendText} />
                  <Bar dataKey="almundo_pct" name="Almundo" fill={COLOR_ALMUNDO} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="despegar_pct" name="Despegar" fill={COLOR_DESPEGAR} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="atrapalo_pct" name="Atrápalo" fill={COLOR_ATRAPALO} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <TablaDatos titulo="Cobertura de vendedores por ruta" filas={datosShareGanadoresRuta} columnas={[{ key: 'ruta', label: 'Ruta' }, { key: 'total_vuelos', label: 'Vuelos', formato: num }, { key: 'almundo_pct', label: 'Almundo', formato: pct }, { key: 'despegar_pct', label: 'Despegar', formato: pct }, { key: 'atrapalo_pct', label: 'Atrápalo', formato: pct }]} />

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

            <div className="h-56 w-full" role="img" aria-label="8. Gráfico de barras: win rate de Almundo por ruta, antes y después de sumar el fee. Los mismos datos están en la tabla de abajo.">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosWinFee} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="ruta" stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 9 }} interval={0} />
                  <YAxis stroke="#64748b" tick={{ fill: '#cbd5e1', fontSize: 10 }} unit="%" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={(v: unknown, name: string | number | undefined, item: ItemGrafico) => [`${v}% (${item.payload?.vuelos} vuelos)`, name ?? '']}
                  />
                  <Legend wrapperStyle={{ paddingTop: '4px' }} formatter={renderLegendText} />
                  <Bar dataKey="win_sin_fee_pct" name="Sin fee" fill={COLOR_SIN_FEE} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="win_con_fee_pct" name="Con fee (precio final)" fill={COLOR_CON_FEE} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <TablaDatos titulo="Win rate sin fee vs con fee por ruta" filas={datosWinFee} columnas={[{ key: 'ruta', label: 'Ruta' }, { key: 'vuelos', label: 'Vuelos', formato: num }, { key: 'win_sin_fee_pct', label: 'Win rate sin fee', formato: pct }, { key: 'win_con_fee_pct', label: 'Win rate con fee', formato: pct }]} />

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

            <div className="h-56 w-full" role="img" aria-label="9. Gráfico de barras: desvío promedio del precio de checkout respecto al listado y porcentaje de filas a revisar, por vendedor y fuente. Los mismos datos están en la tabla de abajo.">
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
                    formatter={(v: unknown, name: string | number | undefined, item: ItemGrafico) => [
                      v !== null && v !== undefined ? `${v}% (${item.payload?.filas} filas)` : 'N/D',
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

            <TablaDatos titulo="Checkout vs listado del metabuscador" filas={datosListadoCheckout} columnas={[{ key: 'etiqueta', label: 'Vendedor · fuente' }, { key: 'filas', label: 'Filas', formato: num }, { key: 'dif_promedio_pct', label: 'Desvío promedio', formato: pct }, { key: 'a_revisar_pct', label: 'Filas a revisar', formato: pct }]} />

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
