import { avisoFee, type PoliticaFee } from '../contracts/fee.ts';

/**
 * Cuánto cobra Handy por un pedido (LEG-43: se ve antes de ofertar). Sin política vigente no se inventa un
 * porcentaje: se dice que no hay tarifa definida.
 */
export function tarifaTexto(politica: PoliticaFee | null, ahora: Date): string | null {
  if (!politica) return 'Tarifa de Handyx: sin tarifa definida.';
  const a = avisoFee(ahora, politica);
  if (a.fase === 'terminada') return 'Tarifa de Handyx: sin tarifa definida.';
  const bps = politica.bpsEspecialista;
  const texto = bps === 0 ? '0 %' : `${bps / 100} %`;
  return a.fase === 'antes' ? `Tarifa de Handyx: ${texto} durante la demo (empieza el 10/11).` : `Tarifa de Handyx: ${texto} durante la demo (hasta el 10/12).`;
}
