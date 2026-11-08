'use client';
// Marcador de un pedido en el mapa de arreglos: un pin-ilustración (el mosaico del rubro) con el precio sugerido
// debajo. Es un botón ≥ 48 px: tocarlo abre el detalle en una hoja, nunca acepta nada. El nombre accesible dice rubro,
// zona aproximada, precio y distancia.
import { NOMBRE_RUBRO, type Rubro } from '../../contracts/rubros.ts';
import { Icono, type NombreIconoUi } from '../atomos/Icono.tsx';
import { textoCifra, textoDistancia } from '../logica.ts';

export const ICONO_RUBRO: Record<Rubro, NombreIconoUi> = {
  electricidad: 'rayo',
  plomeria: 'gota',
  gas: 'llama',
  cerrajeria: 'candado',
  albanileria: 'ladrillo',
  aire_acondicionado: 'copo',
};

export interface PropsMarcadorPedido {
  rubro: Rubro;
  zona: string;
  /** Precio sugerido en centavos (lo decide el especialista: es una referencia). */
  sugeridoCentavos: number | null;
  distanciaM: number | null;
  urgente?: boolean;
  elegido?: boolean;
  nuevo?: boolean;
  onTocar(): void;
}

export function MarcadorPedido({ rubro, zona, sugeridoCentavos, distanciaM, urgente = false, elegido = false, nuevo = false, onTocar }: PropsMarcadorPedido) {
  const precio = sugeridoCentavos !== null ? textoCifra(sugeridoCentavos) : null;
  const lejos = distanciaM !== null ? textoDistancia(distanciaM) : null;
  const nombre = [`${NOMBRE_RUBRO[rubro]} en ${zona}`, urgente ? 'urgente' : null, precio ? `sugerido ${precio}` : null, lejos ? `a ${lejos}` : null].filter(Boolean).join(', ');
  return (
    <button type="button" className={`ui-marcador-pedido${elegido ? ' ui-marcador-pedido--elegido' : ''}${nuevo ? ' ui-marcador-pedido--nuevo' : ''}`} aria-label={`${nombre}. Ver el detalle`} aria-pressed={elegido} onClick={onTocar}>
      <span className="ui-marcador-pedido__pin" aria-hidden="true">
        <Icono nombre={ICONO_RUBRO[rubro]} />
        {urgente ? <span className="ui-marcador-pedido__urgente">Urgente</span> : null}
      </span>
      {precio ? (
        <span className="ui-marcador-pedido__precio" aria-hidden="true">
          {precio}
        </span>
      ) : null}
    </button>
  );
}
