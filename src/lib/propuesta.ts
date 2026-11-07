// "Tu precio" (lote 4.5): opciones de cuándo ir y frases rápidas para "qué incluye". Funciones puras, con pruebas.
import { fechaHora, hora } from './formato.ts';

export interface OpcionCuando {
  id: string;
  texto: string;
  inicio: string;
}

const MIN = 60_000;
const CUARTO = 15 * MIN;
const redondear = (ms: number) => Math.ceil(ms / CUARTO) * CUARTO;

/**
 * Cuándo podés ir. Urgentes: en 30 min, 1 h o 2 h (redondeado al cuarto de hora). Programados y obras: el día que pidió el
 * cliente. En una contraoferta, primero lo que propuso. Siempre se puede elegir otro día y horario aparte.
 */
export function opcionesCuando(tipo: 'urgente' | 'programado' | 'obra', fechaSolicitada: string | null, ahora: Date, propuestoPorCliente: string | null = null): OpcionCuando[] {
  const t = ahora.getTime();
  const op: OpcionCuando[] = [];
  if (propuestoPorCliente && Date.parse(propuestoPorCliente) > t) op.push({ id: 'cliente', texto: `Lo que propuso · ${fechaHora(propuestoPorCliente)}`, inicio: propuestoPorCliente });
  if (tipo === 'urgente') {
    for (const [id, m, texto] of [
      ['30', 30, 'En 30 min'],
      ['60', 60, 'En 1 hora'],
      ['120', 120, 'En 2 horas'],
    ] as const) {
      const inicio = new Date(redondear(t + m * MIN)).toISOString();
      op.push({ id, texto: `${texto} · ${hora(inicio)}`, inicio });
    }
  } else if (fechaSolicitada && Date.parse(fechaSolicitada) > t && fechaSolicitada !== propuestoPorCliente) {
    op.push({ id: 'pedida', texto: `El día que pidió · ${fechaHora(fechaSolicitada)}`, inicio: fechaSolicitada });
  }
  return op;
}

/** Frases para armar "qué incluye" con un toque (se pueden editar después). Sin promesas que Handyx no puede cumplir. */
export const FRASES_ALCANCE = ['Mano de obra', 'Materiales incluidos', 'Materiales aparte (te paso la lista)', 'Visita para ver el problema'] as const;

/** Suma una frase al texto sin repetirla, separada con un punto. */
export function sumarFrase(texto: string, frase: string): string {
  const t = texto.trim();
  if (t.toLowerCase().includes(frase.toLowerCase())) return t;
  return t ? `${t.replace(/[.\s]+$/, '')}. ${frase}.` : `${frase}.`;
}
