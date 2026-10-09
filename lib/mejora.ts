// lib/mejora.ts
// Margen de mejora de fee de Almundo frente a cada competidor.
//
// Modelo (sobre lo que paga el cliente, o sea precio final):
//   diferencia   = precio final Almundo - precio final competidor
//   piso de fee  = PISO_FEE_PCT % del precio sin fee de Almundo (lo que se lleva el metabuscador)
//   margen       = max(fee actual de Almundo - piso, 0)         -> lo que se puede bajar sin perdida
//   mejora       = min(diferencia, margen) si diferencia > 0     -> lo que realmente conviene bajar
// Si diferencia <= margen la brecha se cierra solo con fee; si no, queda un residuo
// que el fee no alcanza a cubrir (hay que mejorar tarifa, no comision).

// Comision que se lleva cada metabuscador por venta. Hoy solo hay datos domesticos (3%).
// Si se suman vuelos internacionales, pasar a un mapa por tipo_vuelo.
export const PISO_FEE_PCT = 3;

// El fee viene redondeado a centavos: un fee de exactamente 3% puede quedar 1 centavo
// por debajo del piso. Se tolera esa diferencia (en la moneda del vuelo) antes de
// marcar "fee bajo el piso".
export const TOLERANCIA_REDONDEO_FEE = 1;

// Alerta de tarifa base: la tarifa base de Almundo esta este % o mas por encima de la
// del competidor mas barato (tarifa_base contra tarifa_base, sin impuestos ni tasas).
export const UMBRAL_ALERTA_TARIFA_PCT = 10;

export function diferenciaTarifaPct(almundo: number | null, competidor: number | null): number | null {
  if (almundo === null || competidor === null || competidor <= 0) return null;
  return ((almundo - competidor) / competidor) * 100;
}

export type EstadoMejora = 'GANANDO' | 'CERRABLE' | 'FUERA_ALCANCE' | 'SIN_COMPARACION';

export interface VendedorMejora {
  vendedor: string;
  a_revisar: boolean;
  precio_sin_fee: number | null;
  precio_total: number | null;
  cargo_gestion: number | null;
  tarifa_base?: number | null;
}

export interface MejoraVsCompetidor {
  competidor: string;
  precio_competidor: number;
  diferencia_monto: number; // + = Almundo mas caro
  diferencia_pct: number;
  estado: EstadoMejora;
  mejora_monto: number; // cuanto bajar de fee para igualar (0 si ya gana o no alcanza)
  mejora_pct_fee: number; // puntos de fee que representa esa baja (sobre precio sin fee)
  residuo_monto: number; // lo que sigue faltando tras bajar el fee al piso
  residuo_pct_tarifa: number | null; // ese residuo como % de la tarifa base de Almundo (cuanto habria que negociar)
}

export interface MejoraAlmundo {
  fee_actual_monto: number;
  fee_actual_pct: number;
  fee_piso_monto: number;
  margen_monto: number; // fee bajable sin perdida
  margen_pct: number; // en puntos de fee
  bajo_piso: boolean; // Almundo ya cobra menos fee que el piso: vende con menos del 3%
  vs: MejoraVsCompetidor[];
}

export function calcularMejora(vendedores: VendedorMejora[], competidor: string = 'TODOS'): MejoraAlmundo | null {
  const a = vendedores.find((v) => v.vendedor === 'Almundo');
  if (!a || a.a_revisar || a.precio_total === null || a.precio_sin_fee === null || a.precio_sin_fee <= 0) return null;

  const fee = a.cargo_gestion ?? 0;
  const piso = (a.precio_sin_fee * PISO_FEE_PCT) / 100;
  const margen = Math.max(fee - piso, 0);
  const aTotal = a.precio_total;

  const vs = vendedores
    .filter((v) => v.vendedor !== 'Almundo' && !v.a_revisar && v.precio_total !== null && v.precio_total > 0
      && (competidor === 'TODOS' || v.vendedor === competidor))
    .map((v): MejoraVsCompetidor => {
      const dif = aTotal - v.precio_total!;
      const estado: EstadoMejora = dif <= 0 ? 'GANANDO' : dif <= margen ? 'CERRABLE' : 'FUERA_ALCANCE';
      const mejora = dif > 0 ? Math.min(dif, margen) : 0;
      return {
        competidor: v.vendedor,
        precio_competidor: v.precio_total!,
        diferencia_monto: dif,
        diferencia_pct: (dif / v.precio_total!) * 100,
        estado,
        mejora_monto: mejora,
        mejora_pct_fee: (mejora / a.precio_sin_fee!) * 100,
        residuo_monto: Math.max(dif - margen, 0),
        residuo_pct_tarifa: a.tarifa_base && a.tarifa_base > 0 ? (Math.max(dif - margen, 0) / a.tarifa_base) * 100 : null
      };
    });

  return {
    fee_actual_monto: fee,
    fee_actual_pct: (fee / a.precio_sin_fee) * 100,
    fee_piso_monto: piso,
    margen_monto: margen,
    margen_pct: (margen / a.precio_sin_fee) * 100,
    bajo_piso: fee < piso - TOLERANCIA_REDONDEO_FEE,
    vs
  };
}
