// Lector simulado de la lista del corralón (lote 2.2). Solo en la vista previa: no abre la cámara ni lee una foto real;
// devuelve los renglones de una lista de PRUEBA («Corralón Simulación») como los daría el detector de texto del teléfono.
// Con la API real es null (origen.http.ts) y el lector es el del teléfono (src/presupuestos/lector.ts).
import type { LectorLista } from '../../presupuestos/lector.ts';

export const RENGLONES_PRUEBA = [
  'CORRALÓN SIMULACIÓN',
  'Lista de precios 17/11/2026',
  'Cartucho cerámico 35 mm ........ $ 10.600',
  'Flexible 40 cm .................. $ 1.600',
  'Llave de paso 1/2" .............. $ 7.400',
  'Termofusión 20 mm (tira) ........ $ 5.900',
  'Codo 20 mm ...................... $ 1?0',
  'Teflón 12 mm .................... $ 2.300',
] as const;

export const lectorListaPrueba: LectorLista = {
  simulado: true,
  leer: async () => [...RENGLONES_PRUEBA],
};
