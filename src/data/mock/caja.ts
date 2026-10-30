import { GuardarMediosCobroSchema, type CajaResumen, type MediosCobro, type Pago } from '../../contracts/dto.ts';
import { monto } from '../../contracts/dinero.ts';
import { MAQUINA_PAGO, puedeTransicionar } from '../../contracts/maquinas.ts';
import type { SimulacionPostDemo } from '../api.ts';
import { ahoraMs, fallo, idempotente, iso, type EstadoMock } from './estado.ts';
import { zodAFallo } from './validacion.ts';

/** Porcentaje ILUSTRATIVO de la simulación post-demo (tarifa del especialista de la demo de la landing). No aprobado. */
const BPS_ILUSTRATIVO = 1_000;

function buscar(s: EstadoMock, id: string): Pago {
  const p = s.pagos.find((x) => x.id === id);
  if (!p) throw fallo('no_encontrado', 404, 'no_encontrado', 'No encontramos ese pago.');
  return p;
}

const suma = (pagos: Pago[]) => monto(pagos.reduce((n, p) => n + p.neto.centavos, 0));

export const caja = (s: EstadoMock) => ({
  mediosCobro: (): MediosCobro => structuredClone(s.mediosCobro),
  guardarMediosCobro(m: unknown): MediosCobro {
    const ok = GuardarMediosCobroSchema.safeParse(m);
    if (!ok.success) throw zodAFallo(ok.error);
    if (ok.data.version !== s.mediosCobro.version) throw fallo('conflicto', 409, 'conflicto_version', 'Tus formas de cobro cambiaron. Volvé a abrirlas.');
    s.mediosCobro = { ...s.mediosCobro, efectivo: ok.data.efectivo, mercadoPago: ok.data.mercadoPago, version: s.mediosCobro.version + 1 };
    return structuredClone(s.mediosCobro);
  },
  cajaResumen: (): CajaResumen => ({
    pendiente: suma(s.pagos.filter((p) => p.estado === 'pendiente')),
    reportado: suma(s.pagos.filter((p) => p.estado === 'reportado' || p.estado === 'en_discrepancia')),
    verificado: suma(s.pagos.filter((p) => p.estado === 'verificado')),
    feeHandyPeriodo: monto(s.pagos.reduce((n, p) => n + p.feeHandy.centavos, 0)),
  }),
  pagos: () => ({ items: [...s.pagos].sort((a, b) => Date.parse(b.actualizadoEn) - Date.parse(a.actualizadoEn)), siguienteCursor: null }),

  // Reportar un cobro NO lo verifica: queda `reportado` hasta que lo confirme un webhook validado u Operations.
  reportarCobro(id: string, clave: string): Pago {
    return idempotente(s, `pago:${clave}`, () => {
      const p = buscar(s, id);
      if (!puedeTransicionar(MAQUINA_PAGO, p.estado, 'reportado', 'especialista')) {
        throw fallo('conflicto', 409, 'transicion_invalida', 'Este pago ya no se puede reportar.');
      }
      p.estado = 'reportado';
      p.fuenteConfirmacion = 'reporte_especialista';
      p.actualizadoEn = iso(ahoraMs(s));
      return p;
    });
  },
  marcarDiscrepancia(id: string, clave: string): Pago {
    return idempotente(s, `discrepancia:${clave}`, () => {
      const p = buscar(s, id);
      if (!puedeTransicionar(MAQUINA_PAGO, p.estado, 'en_discrepancia', 'especialista')) {
        throw fallo('conflicto', 409, 'transicion_invalida', 'Solo podés marcar una discrepancia en un pago reportado.');
      }
      p.estado = 'en_discrepancia';
      p.actualizadoEn = iso(ahoraMs(s));
      return p;
    });
  },

  simulacionPostDemo(): SimulacionPostDemo {
    const efectivo = s.pagos.filter((p) => p.metodo === 'efectivo' && (p.estado === 'reportado' || p.estado === 'verificado' || p.estado === 'en_discrepancia'));
    return {
      rotulo: 'Simulación posterior a la demo · política futura NO vigente ni aprobada · no se cobra nada en el piloto',
      entradas: efectivo.map((p) => ({
        pagoId: p.id,
        descripcion: p.descripcion,
        cobrado: p.monto,
        comision: monto(Number((BigInt(p.monto.centavos) * BigInt(BPS_ILUSTRATIVO) + 5_000n) / 10_000n)),
        estado: p.estado === 'verificado' ? ('saldada' as const) : ('adeudada' as const),
      })),
    };
  },
});
