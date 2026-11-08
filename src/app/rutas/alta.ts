import type { Ruta } from './tipos.ts';

export const rutasAlta = {
  alta: { ruta: '/alta/', titulo: 'Tu alta', lote: '4.4', descripcion: 'Alta guiada: datos, DNI y CUIT, selfie, rubros, zonas y horarios, turno de antecedentes, resumen y estados.' },
} as const satisfies Record<string, Ruta>;
