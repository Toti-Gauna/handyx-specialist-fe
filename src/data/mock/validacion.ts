import type { ZodError } from 'zod';
import { FalloApi } from '../errores.ts';

/** Un esquema que no se cumple es `400 validacion` con el detalle por campo (sin valores). */
export function zodAFallo(e: ZodError): FalloApi {
  const campos = e.issues.map((i) => ({ campo: i.path.join('.') || 'cuerpo', codigo: i.code }));
  return new FalloApi('validacion', 400, {
    codigo: 'validacion',
    mensaje: 'Revisá los datos ingresados.',
    requestId: 'req-prueba-0001',
    campos,
  });
}
