// Premios del oficio para el Camino Handyx (fase G). Borrador: cantidades, montos y modelos los define Ignacio, con
// presupuesto y proveedores. Cada hito muestra de antemano su premio (sin azar). Electricidad, fase H1.5.
import type { Rubro } from '../contracts/rubros.ts';

export interface PremioOficio {
  hito: number;
  premio: string;
  estado: 'PENDIENTE';
}

export const PREMIOS_ELECTRICIDAD: readonly PremioOficio[] = [
  { hito: 1, premio: 'Kit chico: tornillos, tarugos y cinta aisladora', estado: 'PENDIENTE' },
  { hito: 2, premio: 'Consumibles: terminales, precintos y borneras', estado: 'PENDIENTE' },
  { hito: 3, premio: 'Gorra Handyx', estado: 'PENDIENTE' },
  { hito: 4, premio: 'Juego de destornilladores aislados', estado: 'PENDIENTE' },
  { hito: 5, premio: 'Campera Handyx', estado: 'PENDIENTE' },
  { hito: 6, premio: 'Pinza amperométrica', estado: 'PENDIENTE' },
];

export const PREMIOS_POR_OFICIO: Partial<Record<Rubro, readonly PremioOficio[]>> = { electricidad: PREMIOS_ELECTRICIDAD };
