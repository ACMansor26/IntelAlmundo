// app/historial/page.tsx
import React from 'react';
import { Metadata } from 'next';
import { Space_Grotesk, IBM_Plex_Mono } from 'next/font/google';
import { getHistorialCorridas, getDetalleCorrida, type CorridaJobDetalle } from '@/lib/data';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Almundo | Historial de Búsquedas',
  description: 'Qué se buscó, cuánto tardó y qué encontró cada ronda de búsqueda automática'
};

const fontTitulo = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-heading'
});
const fontDato = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-data'
});
const heading = '[font-family:var(--font-heading)]';
const dato = '[font-family:var(--font-data)] tabular-nums';

type PageProps = {
  searchParams: Promise<{ run?: string; estado?: string; recuperados?: string }> | { run?: string; estado?: string; recuperados?: string };
};

function formatoSeg(val: number | null): string {
  if (val === null || val === undefined) return '-';
  if (val < 60) return `${val.toFixed(0)}s`;
  const min = Math.floor(val / 60);
  const seg = Math.round(val % 60);
  return `${min}m ${seg}s`;
}

// Estado por resultado -- mutuamente excluyentes entre si (cada job cae en
// exactamente uno). "Recuperados en 2da pasada" queda AFUERA de este grupo a
// proposito: un job recuperado ya tiene Almundo, asi que termina en AMBOS o
// SOLO_ALMUNDO -- mezclarlo aca como una categoria mas se solaparia con esas
// dos. Se filtra por separado, igual que un segundo eje independiente.
const ESTADOS_VALIDOS = ['TODOS', 'AMBOS', 'SOLO_ALMUNDO', 'SOLO_DESPEGAR', 'NINGUNO'] as const;
type EstadoValido = typeof ESTADOS_VALIDOS[number];

function normalizarEstado(candidato: string | undefined): EstadoValido {
  return (ESTADOS_VALIDOS as readonly string[]).includes(candidato ?? '')
    ? (candidato as EstadoValido)
    : 'TODOS';
}

export default async function HistorialPage(props: PageProps) {
  const resolvedSearchParams = await Promise.resolve(props.searchParams);
  const runIdParam = resolvedSearchParams?.run ? parseInt(resolvedSearchParams.run, 10) : null;
  const estado = normalizarEstado(resolvedSearchParams?.estado);
  const soloRecuperados = resolvedSearchParams?.recuperados === '1';

  const corridas = await getHistorialCorridas(30);
  const runSeleccionado = runIdParam && corridas.some(c => c.id === runIdParam)
    ? runIdParam
    : (corridas[0]?.id ?? null);

  const detalleCompleto = runSeleccionado !== null ? await getDetalleCorrida(runSeleccionado) : [];
  const corridaActiva = corridas.find(c => c.id === runSeleccionado) || null;

  // Extraido a funcion propia (antes vivia inline en el .filter) para poder
  // reutilizarlo tambien en el conteo por tab, sin duplicar el switch.
  const coincideEstado = (j: CorridaJobDetalle, e: EstadoValido): boolean => {
    switch (e) {
      case 'AMBOS': return j.tiene_almundo && j.tiene_despegar;
      case 'SOLO_ALMUNDO': return j.tiene_almundo && !j.tiene_despegar;
      case 'SOLO_DESPEGAR': return j.tiene_despegar && !j.tiene_almundo;
      case 'NINGUNO': return !j.tiene_almundo && !j.tiene_despegar;
      default: return true;
    }
  };

  // Base para los conteos por tab: respeta el toggle de "recuperados" (asi
  // el numero mostrado en cada tab es el que realmente vas a ver si lo
  // clickeas), pero no el filtro de estado -- cada tab cuenta sobre el mismo
  // universo, independiente de cual este seleccionado.
  const detalleBaseConteo = detalleCompleto.filter((j) => !soloRecuperados || j.recupero_almundo_segunda_pasada);

  const detalle = detalleBaseConteo.filter((j) => coincideEstado(j, estado));

  const buildDetalleUrl = (targetEstado: EstadoValido, targetRecuperados: boolean) => {
    const p = new URLSearchParams({ estado: targetEstado });
    if (runSeleccionado !== null) p.set('run', String(runSeleccionado));
    if (targetRecuperados) p.set('recuperados', '1');
    return `/historial?${p.toString()}`;
  };

  // Colores por tab: alineados al mismo codigo de color que ya usa la tabla
  // (Almundo = emerald, Despegar = sky, ausencia = rose). "Todos" y el color
  // por defecto de la nav se quedan con el naranja de marca.
  const tabsEstado: { id: EstadoValido; label: string; colorActivo: string }[] = [
    { id: 'TODOS', label: 'Todos', colorActivo: 'bg-[#FF5A00] text-white' },
    { id: 'AMBOS', label: 'Almundo y Despegar', colorActivo: 'bg-gradient-to-r from-emerald-500 to-sky-500 text-white' },
    { id: 'SOLO_ALMUNDO', label: 'Solo Almundo', colorActivo: 'bg-emerald-500 text-white' },
    { id: 'SOLO_DESPEGAR', label: 'Solo Despegar', colorActivo: 'bg-sky-500 text-white' },
    { id: 'NINGUNO', label: 'Ninguno de los dos', colorActivo: 'bg-rose-500 text-white' }
  ];

  const header = (
    <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-white/10 pb-6">
      <div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#FF5A00] opacity-60 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF5A00]" />
          </span>
          <span>Actividad reciente de las búsquedas automáticas</span>
        </div>
        <h1 className={`${heading} text-2xl md:text-3xl font-semibold tracking-tight text-white mt-1.5`}>
          Historial de Búsquedas
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-2xl">
          Qué se buscó, cuánto tardó y qué encontró cada ronda de búsqueda automática.
        </p>
      </div>

      <nav className="flex items-center gap-5 border-b border-white/10 md:border-0">
        <Link href="/" className="relative pb-2 text-xs font-medium text-slate-500 hover:text-slate-300 transition">
          Matriz Almundo
        </Link>
        <Link href="/graficos" className="relative pb-2 text-xs font-medium text-slate-500 hover:text-slate-300 transition">
          Gráficos & KPIs
        </Link>
        <span className="relative pb-2 text-xs font-medium text-white">
          Historial de Búsquedas
          <span className="absolute left-0 right-0 -bottom-px h-[2px] rounded-full bg-[#FF5A00]" />
        </span>
      </nav>
    </header>
  );

  if (corridas.length === 0) {
    return (
      <main className={`${fontTitulo.variable} ${fontDato.variable} min-h-screen bg-[#080B14] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8`}>
        {header}
        <div className="bg-rose-950/30 border border-rose-800/50 rounded-2xl p-6 text-center text-rose-300">
          <p className="font-semibold text-sm">Todavía no hay búsquedas registradas.</p>
          <p className="text-xs text-rose-400 mt-1">
            Esta página se completa sola apenas termina la próxima ronda de búsqueda automática.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={`${fontTitulo.variable} ${fontDato.variable} min-h-screen bg-[#080B14] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8`}>
      {header}

      {/* Tabla de corridas */}
      <section className="rounded-2xl border border-white/10 bg-[#10182B] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] text-slate-500 border-b border-white/10">
                <th className="p-3 font-medium">Fecha</th>
                <th className="p-3 font-medium">Buscador</th>
                <th className="p-3 font-medium">Duración</th>
                <th className="p-3 font-medium">Rutas revisadas</th>
                <th className="p-3 font-medium">Almundo encontrado</th>
                <th className="p-3 font-medium">Despegar encontrado</th>
                <th className="p-3 font-medium">Precios guardados</th>
                <th className="p-3 font-medium">Reinicios</th>
                <th className="p-3 font-medium">Segunda revisión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {corridas.map((c) => {
                const activa = c.id === runSeleccionado;
                const watchdogTotal = c.watchdog_kills_fase1 + c.watchdog_kills_fase2;
                return (
                  <tr
                    key={c.id}
                    className={`relative cursor-pointer ${activa ? 'bg-[#FF5A00]/10' : 'hover:bg-white/[0.03] transition'}`}
                  >
                    <td className="p-3">
                      {/* Link que cubre toda la fila (no solo esta celda) -- position:
                          relative en el <tr> + absolute inset-0 acá hace que un click
                          en cualquier punto de la card navegue a esta corrida. */}
                      <Link
                        href={`/historial?run=${c.id}`}
                        className="absolute inset-0"
                        aria-label={`Ver detalle de la corrida del ${c.fecha_inicio}`}
                      />
                      <span className={`${dato} text-xs ${activa ? 'text-white font-semibold' : 'text-slate-300'}`}>
                        {c.fecha_inicio}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-slate-400">{c.fuente}</td>
                    <td className={`p-3 ${dato} text-xs text-slate-300`}>{formatoSeg(c.duracion_total_seg)}</td>
                    <td className={`p-3 ${dato} text-xs text-slate-300`}>{c.jobs_con_datos}/{c.jobs_totales}</td>
                    <td className={`p-3 ${dato} text-xs`}>
                      <span className={c.jobs_con_almundo === c.jobs_totales ? 'text-emerald-400' : 'text-[#FF7A29]'}>
                        {c.jobs_con_almundo}/{c.jobs_totales}
                      </span>
                    </td>
                    <td className={`p-3 ${dato} text-xs text-sky-400`}>{c.jobs_con_despegar}/{c.jobs_totales}</td>
                    <td className={`p-3 ${dato} text-xs text-slate-300`}>{c.filas_insertadas_db}</td>
                    <td className={`p-3 ${dato} text-xs`}>
                      {watchdogTotal > 0 ? (
                        <span className="text-amber-400">
                          {watchdogTotal} reinicio{watchdogTotal !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className={`p-3 ${dato} text-xs text-slate-300`}>
                      {c.jobs_segunda_pasada > 0
                        ? `${c.jobs_recuperados_segunda_pasada}/${c.jobs_segunda_pasada} recuperadas`
                        : <span className="text-slate-600">-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Detalle de la corrida seleccionada */}
      {corridaActiva && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
            <h2 className={`${heading} text-lg font-semibold text-white`}>
              Detalle de la búsqueda del {corridaActiva.fecha_inicio}
            </h2>
            <span className="text-xs text-slate-500">
              Búsqueda: {formatoSeg(corridaActiva.duracion_scraping_seg)} · Guardado: {formatoSeg(corridaActiva.duracion_db_seg)}
            </span>
          </div>

          {(corridaActiva.watchdog_kills_fase1 > 0 || corridaActiva.watchdog_kills_fase2 > 0) && (
            <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-3 text-xs text-amber-300 flex flex-wrap gap-x-6 gap-y-1">
              <span>
                En la primera revisión el sistema tuvo que reiniciar {corridaActiva.watchdog_kills_fase1}
                {' '}{corridaActiva.watchdog_kills_fase1 !== 1 ? 'veces' : 'vez'} por demoras excesivas:
                {' '}{corridaActiva.watchdog_reencolados_fase1} ruta{corridaActiva.watchdog_reencolados_fase1 !== 1 ? 's' : ''} se reintentaron con éxito
                y {corridaActiva.watchdog_descartados_fase1} no se pudieron recuperar.
              </span>
              {corridaActiva.watchdog_kills_fase2 > 0 && (
                <span>En la segunda revisión hubo {corridaActiva.watchdog_kills_fase2} reinicio{corridaActiva.watchdog_kills_fase2 !== 1 ? 's' : ''} más.</span>
              )}
            </div>
          )}

          {/* Explicacion de criterios/metodologia de recuperacion: <details>
              nativo (sin JS) para no inflar el peso de una pagina que ya es
              mayormente informativa. Lenguaje llano, sin nombrar mecanismos
              internos (watchdog, requeue, etc.) por su nombre tecnico. */}
          <details className="rounded-xl border border-white/10 bg-[#10182B] group">
            <summary className="cursor-pointer list-none p-3 text-xs font-medium text-slate-300 flex items-center gap-2">
              <span className="text-slate-500 transition group-open:rotate-90">▸</span>
              ¿Cómo funciona la recuperación de rutas?
            </summary>
            <div className="px-3 pb-4 pt-1 space-y-3 text-xs text-slate-400 leading-relaxed border-t border-white/5">
              <div>
                <p className="text-slate-300 font-medium mt-2">1. Si una búsqueda tarda demasiado</p>
                <p>
                  Si una ruta no responde en varios minutos, el sistema la reinicia y la vuelve a intentar
                  más adelante en la misma corrida (hasta 2 veces). Si tras esos reintentos sigue sin
                  responder, se descarta y queda marcada como no recuperada.
                </p>
              </div>
              <div>
                <p className="text-slate-300 font-medium">2. Si el sitio bloquea la conexión</p>
                <p>
                  Cuando un buscador detecta actividad automatizada y bloquea la consulta, la ruta se
                  reintenta más tarde (con una pausa más larga antes de seguir) hasta 2 veces. Si el
                  bloqueo persiste, esa ruta se descarta por esta corrida.
                </p>
              </div>
              <div>
                <p className="text-slate-300 font-medium">3. Segunda revisión (al final de la corrida)</p>
                <p>
                  Todas las rutas que terminaron sin mostrar precio de Almundo se vuelven a buscar una vez
                  más, dándoles más margen: el doble de opciones de vuelo revisadas y más tiempo de espera
                  para que cargue la página. Si en esta segunda vuelta aparece Almundo, la ruta queda
                  marcada como <span className="text-emerald-400">Recuperado</span>; si sigue sin aparecer,
                  queda como <span className="text-slate-400">Sin cambio</span>.
                </p>
              </div>
              <div className="rounded-lg bg-white/[0.03] p-3">
                <p className="text-slate-300 font-medium">¿Por qué hace falta este resguardo?</p>
                <p className="mt-1">
                  Que una ruta salga "sin Almundo" en la primera pasada no siempre significa que Almundo
                  realmente no tenía oferta ahí: a veces la página tardó un poco más de lo normal en
                  terminar de cargar, o el precio estaba en una opción de vuelo más abajo de las primeras
                  revisadas. Sin un segundo intento, esos casos quedarían mal contados como "ausencia real"
                  cuando en realidad fueron un problema pasajero de carga — un falso negativo. La segunda
                  revisión, al darle más tiempo y revisar más opciones, permite confirmar cuáles ausencias
                  son genuinas y cuáles eran solo demoras: si aparece Almundo en la segunda vuelta, era un
                  falso negativo de la primera pasada; si sigue sin aparecer con ese margen extra, hay mucha
                  más confianza de que la ausencia es real.
                </p>
              </div>
            </div>
          </details>

          {/* Filtros del detalle: por resultado (mutuamente excluyentes) +
              recuperados en 2da pasada (eje independiente, se combina con
              cualquiera de los anteriores). Tabs segmentadas con color por
              resultado (mismo codigo que la tabla: Almundo=emerald,
              Despegar=sky, ausencia=rose) + contador por tab + switch (no
              pill) para el eje de "recuperados", que se lee como un flag
              independiente y no como una opcion mas del primer grupo. */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-600 mb-1.5 px-1">Resultado</p>
              <nav className="flex flex-wrap items-center gap-1 rounded-full border border-white/10 bg-[#10182B] p-1">
                {tabsEstado.map((tab) => {
                  const cantidad = detalleBaseConteo.filter((j) => coincideEstado(j, tab.id)).length;
                  return (
                    <Link
                      key={tab.id}
                      href={buildDetalleUrl(tab.id, soloRecuperados)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                        estado === tab.id
                          ? tab.colorActivo
                          : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      {tab.label} <span className={estado === tab.id ? 'text-white/70' : 'text-slate-600'}>· {cantidad}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-600 mb-1.5 px-1">Origen</p>
              <Link
                href={buildDetalleUrl(estado, !soloRecuperados)}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-[#10182B] px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-300 transition"
              >
                {/* Switch (track + knob) en vez de una pill igual a las de arriba
                    -- comunica "flag que se prende/apaga" y no "otra opcion del
                    mismo grupo excluyente". */}
                <span className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition ${
                  soloRecuperados ? 'bg-emerald-500' : 'bg-white/10'
                }`}>
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${
                    soloRecuperados ? 'translate-x-3.5' : 'translate-x-0.5'
                  }`} />
                </span>
                Recuperados en la segunda revisión
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#10182B] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] text-slate-500 border-b border-white/10">
                    <th className="p-3 font-medium">#</th>
                    <th className="p-3 font-medium">Ruta</th>
                    <th className="p-3 font-medium">Moneda</th>
                    <th className="p-3 font-medium">Antelación / Duración viaje</th>
                    <th className="p-3 font-medium">Precios encontrados</th>
                    <th className="p-3 font-medium">Almundo</th>
                    <th className="p-3 font-medium">Despegar</th>
                    <th className="p-3 font-medium">Segunda revisión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {detalle.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-xs text-slate-500">
                        Ninguna ruta de esta búsqueda coincide con el filtro seleccionado.
                      </td>
                    </tr>
                  )}
                  {detalle.map((j) => (
                    <tr key={j.idx} className="hover:bg-white/[0.03] transition">
                      <td className={`p-3 ${dato} text-xs text-slate-500`}>{j.idx}</td>
                      <td className="p-3 text-xs text-slate-200 font-medium">{j.ruta}</td>
                      <td className="p-3 text-xs text-slate-400">{j.moneda}</td>
                      <td className={`p-3 ${dato} text-xs text-slate-400`}>{j.dias_anticipacion}d / {j.dias_estadia}d</td>
                      <td className={`p-3 ${dato} text-xs text-slate-300`}>{j.ofertas_count}</td>
                      <td className="p-3 text-xs">
                        {j.tiene_almundo
                          ? <span className="text-emerald-400">Sí</span>
                          : <span className="text-rose-400">No</span>}
                      </td>
                      <td className="p-3 text-xs">
                        {j.tiene_despegar
                          ? <span className="text-emerald-400">Sí</span>
                          : <span className="text-slate-600">No</span>}
                      </td>
                      <td className="p-3 text-xs">
                        {j.reviso_segunda_pasada ? (
                          j.recupero_almundo_segunda_pasada
                            ? <span className="text-emerald-400">Recuperado</span>
                            : <span className="text-slate-500">Sin cambio</span>
                        ) : (
                          <span className="text-slate-700">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
