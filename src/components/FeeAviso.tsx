'use client';
import { avisoFee, type AvisoFee, type PoliticaFee } from '../contracts/fee.ts';
import { useAhora } from '../hooks/useAhora.ts';

const FIN = '10/12/2026';
const INICIO = '10/11/2026';

const dias = (n: number) => `${n} ${n === 1 ? 'día' : 'días'}`;

/** Una frase corta con el estado del fee 0 %, para tarjetas y listas. */
export function resumenFee(a: AvisoFee): string {
  if (a.fase === 'antes') return `Del ${INICIO} al ${FIN} Handy no te cobra tarifa. Empieza en ${dias(a.diasParaEmpezar)}.`;
  if (a.fase === 'vigente') return a.ultimoDia ? `Hoy es el último día sin tarifa de Handy (hasta el ${FIN}).` : `Handy no te cobra tarifa hasta el ${FIN}. Quedan ${dias(a.diasRestantes)}.`;
  return `La demo terminó el ${FIN}. No hay ninguna tarifa definida.`;
}

/**
 * Explicación del fee 0 %: es la tarifa de Handy (no un descuento sobre tu precio), el pago del servicio va directo
 * a vos y, al terminar la demo, no se aplica ninguna tarifa sin una política aprobada y tu aceptación.
 */
export function TextoFee({ politica }: { politica: PoliticaFee }) {
  const ahora = useAhora(60_000);
  const a = avisoFee(ahora, politica);
  return (
    <div className="pila pila--chica">
      <p>
        <strong>{resumenFee(a)}</strong>
      </p>
      <p>Es la tarifa de Handy: no es un descuento sobre tu precio. Vos ponés tu precio y el usuario te paga a vos directamente.</p>
      <p className="texto-suave">
        {a.fase === 'terminada'
          ? 'Handy no aplica ninguna tarifa sin una política aprobada y sin que la aceptes antes.'
          : `Al terminar la demo, Handy no aplica ninguna tarifa automáticamente: primero hace falta una política aprobada y tu aceptación.`}
      </p>
    </div>
  );
}

/** Contador de días de la pantalla Cuenta. */
export function ContadorFee({ politica }: { politica: PoliticaFee }) {
  const ahora = useAhora(60_000);
  const a = avisoFee(ahora, politica);
  const numero = a.fase === 'antes' ? a.diasParaEmpezar : a.fase === 'vigente' ? a.diasRestantes : 0;
  const rotulo = a.fase === 'antes' ? (numero === 1 ? 'día para que empiece' : 'días para que empiece') : numero === 1 ? 'día restante' : 'días restantes';
  return (
    <div className="tarjeta tarjeta--noche">
      <p className="sobre">Tarifa de Handy durante la demo</p>
      {a.fase === 'antes' || (a.fase === 'vigente' && !a.ultimoDia) ? (
        <p className="contador">
          <span className="contador__numero">{numero}</span>
          <span>{rotulo}</span>
        </p>
      ) : null}
      <TextoFee politica={politica} />
    </div>
  );
}
