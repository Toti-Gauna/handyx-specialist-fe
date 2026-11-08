import { z } from 'zod';
import { DatosAltaSchema, PerfilEspecialistaSchema, PerfilPublicoSchema, TurnoAntecedentesSchema } from '../../contracts/dto.ts';
import type { ApiAlta } from '../api/alta.ts';
import type { ClienteHttp } from './cliente.ts';
import { id } from './comun.ts';

export const altaHttp = (c: ClienteHttp): ApiAlta => ({
  perfil: () => c.pedir('GET', '/v1/especialista/perfil', PerfilEspecialistaSchema),
  perfilPublico: () => c.pedir('GET', '/v1/especialista/perfil/publico', PerfilPublicoSchema),
  datosAlta: () => c.pedir('GET', '/v1/especialista/alta/datos', DatosAltaSchema),
  guardarDatosAlta: (datos) => c.pedir('PUT', '/v1/especialista/alta/datos', DatosAltaSchema, { cuerpo: datos }),
  cargarDocumento(tipo, rubro, archivo, dorso) {
    const f = new FormData();
    if (archivo) f.set('archivo', archivo);
    if (dorso) f.set('dorso', dorso);
    if (rubro) f.set('rubro', rubro);
    return c.pedir('POST', `/v1/especialista/documentos/${id(tipo)}`, PerfilEspecialistaSchema, { formulario: f });
  },
  elegirRubros: (rubros) => c.pedir('PUT', '/v1/especialista/rubros', PerfilEspecialistaSchema, { cuerpo: { rubros } }),
  enviarAlta: () => c.pedir('POST', '/v1/especialista/alta/envio', PerfilEspecialistaSchema),
  turnosAntecedentes: () => c.pedir('GET', '/v1/especialista/antecedentes/turnos', z.array(TurnoAntecedentesSchema)),
  reservarTurno: (turnoId) => c.pedir('PUT', '/v1/especialista/antecedentes/turno', PerfilEspecialistaSchema, { cuerpo: { turnoId } }),
});
