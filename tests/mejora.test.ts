import { describe, it, expect } from 'vitest';
import { calcularMejora, PISO_FEE_PCT, type VendedorMejora } from '@/lib/mejora';

const v = (vendedor: string, sinFee: number, fee: number, extra: Partial<VendedorMejora> = {}): VendedorMejora => ({
  vendedor, a_revisar: false, precio_sin_fee: sinFee, cargo_gestion: fee, precio_total: sinFee + fee, ...extra
});

describe('margen de mejora del fee', () => {
  it('usa un piso del 3%', () => expect(PISO_FEE_PCT).toBe(3));

  it('cerrable: la diferencia entra en el margen de fee', () => {
    // Almundo: sin fee 100.000, fee 8.000 (8%) -> piso 3.000 -> margen 5.000. Despegar total 105.000 -> dif 3.000
    const r = calcularMejora([v('Almundo', 100000, 8000), v('Despegar', 105000, 0)])!;
    expect(r.margen_monto).toBe(5000);
    expect(r.margen_pct).toBe(5);
    expect(r.vs[0]).toMatchObject({ estado: 'CERRABLE', diferencia_monto: 3000, mejora_monto: 3000, residuo_monto: 0 });
    expect(r.vs[0].mejora_pct_fee).toBeCloseTo(3);
  });

  it('fuera de alcance: baja el fee al piso y aun asi queda un residuo', () => {
    const r = calcularMejora([v('Almundo', 100000, 8000), v('Atrápalo', 100000, 0)])!;
    expect(r.vs[0]).toMatchObject({ estado: 'FUERA_ALCANCE', mejora_monto: 5000, residuo_monto: 3000 });
  });

  it('ganando: Almundo ya es mas barato, no hay mejora que hacer', () => {
    const r = calcularMejora([v('Almundo', 100000, 3000), v('Despegar', 110000, 3300)])!;
    expect(r.vs[0]).toMatchObject({ estado: 'GANANDO', mejora_monto: 0, residuo_monto: 0 });
  });

  it('fee en el piso o por debajo: margen 0', () => {
    const r = calcularMejora([v('Almundo', 100000, 2000), v('Despegar', 100000, 0)])!;
    expect(r.margen_monto).toBe(0);
    expect(r.vs[0].estado).toBe('FUERA_ALCANCE');
  });

  it('ignora competidores a revisar y respeta el competidor elegido', () => {
    const lista = [v('Almundo', 100000, 8000), v('Despegar', 100000, 0, { a_revisar: true }), v('Atrápalo', 104000, 0)];
    expect(calcularMejora(lista)!.vs.map((x) => x.competidor)).toEqual(['Atrápalo']);
    expect(calcularMejora(lista, 'Despegar')!.vs).toEqual([]);
  });

  it('sin Almundo legible no hay calculo', () => {
    expect(calcularMejora([v('Despegar', 100000, 0)])).toBeNull();
    expect(calcularMejora([v('Almundo', 100000, 8000, { a_revisar: true })])).toBeNull();
  });
});

describe('avisos y resto fuera de alcance', () => {
  it('expresa lo que no cubre el fee como % de la tarifa base', () => {
    const r = calcularMejora([v('Almundo', 100000, 8000, { tarifa_base: 80000 }), v('Atrápalo', 100000, 0)])!;
    expect(r.vs[0].residuo_monto).toBe(3000);
    expect(r.vs[0].residuo_pct_tarifa).toBeCloseTo(3.75);
  });

  it('marca fee bajo el piso', () => {
    expect(calcularMejora([v('Almundo', 100000, 2000), v('Despegar', 100000, 0)])!.bajo_piso).toBe(true);
    expect(calcularMejora([v('Almundo', 100000, 3000), v('Despegar', 100000, 0)])!.bajo_piso).toBe(false);
    expect(calcularMejora([v('Almundo', 100000, 2999.99), v('Despegar', 100000, 0)])!.bajo_piso).toBe(false); // redondeo de centavos
  });
});
