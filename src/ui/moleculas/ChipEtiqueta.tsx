// Una `Etiqueta` de estado de la app (lib/etiquetas.ts: documentos, alta, soporte…) como `Chip` del kit v3: ícono y texto,
// nunca solo color. Hasta que todas las pantallas pasen al kit v3, esto une las dos formas de nombrar el tono.
import type { Etiqueta } from '../../lib/etiquetas.ts';
import { Chip, type TonoChip } from '../atomos/Texto.tsx';

const TONO: Record<Etiqueta['tono'], TonoChip> = { neutro: 'gris', azul: 'tinte', aviso: 'amarillo', exito: 'exito', error: 'error', noche: 'noche' };

export function ChipEtiqueta({ e, texto }: { e: Etiqueta; texto?: string }) {
  return (
    <Chip tono={TONO[e.tono]} icono={e.icono}>
      {texto ?? e.texto}
    </Chip>
  );
}
