import { PresupuestoSugeridoSchema, SugerenciaTableroSchema } from '../../contracts/dto.ts';
import type { ApiTaller } from '../api/taller.ts';
import type { ClienteHttp } from './cliente.ts';

export const tallerHttp = (c: ClienteHttp): ApiTaller => ({
  iaTablero(foto) {
    const f = new FormData();
    f.set('foto', foto, 'tablero.jpg');
    return c.pedir('POST', '/v1/especialista/taller/ia/tablero', SugerenciaTableroSchema, { formulario: f });
  },
  iaPresupuesto: (entrada) => c.pedir('POST', '/v1/especialista/taller/ia/presupuesto', PresupuestoSugeridoSchema, { cuerpo: entrada }),
});
