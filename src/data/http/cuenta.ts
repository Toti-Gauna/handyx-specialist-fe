import { z } from 'zod';
import { AvisoBandejaSchema, ExportacionDatosSchema, PerfilPropioSchema } from '../../contracts/cuenta.ts';
import { BajaSchema, FeeVigenteSchema, paginado, PreferenciasSchema } from '../../contracts/dto.ts';
import { RegistroEspecialistaSchema } from '../../contracts/registro.ts';
import { AltaTotpSchema, CodigosRespaldoSchema, SeguridadSchema } from '../../contracts/seguridad.ts';
import type { ApiCuenta } from '../api/cuenta.ts';
import type { ClienteHttp } from './cliente.ts';
import { id, Nada } from './comun.ts';

// «Letra más grande»: el lote 1.5 suma `letraGrande` al contrato; hasta entonces se acepta acá (el `extend` pisa al contrato).
const PreferenciasCuentaSchema = PreferenciasSchema.extend({ letraGrande: z.boolean().optional() });
const E = '/v1/especialista';

export const cuentaHttp = (c: ClienteHttp): ApiCuenta => ({
  feeVigente: () => c.pedir('GET', '/v1/fee/vigente', FeeVigenteSchema),
  aceptarAvisoFee: (politicaId, version) => c.pedir('POST', '/v1/fee/aviso', FeeVigenteSchema, { cuerpo: { politicaId, version } }),
  preferencias: () => c.pedir('GET', '/v1/cuenta/preferencias', PreferenciasCuentaSchema),
  guardarPreferencias: (p) => c.pedir('PUT', '/v1/cuenta/preferencias', PreferenciasCuentaSchema, { cuerpo: p }),
  activarPush: () => c.pedir('POST', '/v1/cuenta/push', PreferenciasCuentaSchema),
  baja: () => c.pedir('GET', '/v1/cuenta/baja', BajaSchema.nullable()),
  solicitarBaja: () => c.pedir('POST', '/v1/cuenta/baja', BajaSchema),
  async cancelarBaja() {
    await c.pedir('DELETE', '/v1/cuenta/baja', Nada);
  },

  perfilPropio: () => c.pedir('GET', `${E}/perfil/propio`, PerfilPropioSchema),
  guardarPresentacion: (g) => c.pedir('PUT', `${E}/perfil/presentacion`, PerfilPropioSchema, { cuerpo: g }),
  cambiarFotoPerfil(foto) {
    const f = new FormData();
    f.append('foto', foto);
    return c.pedir('POST', `${E}/perfil/foto`, PerfilPropioSchema, { formulario: f });
  },
  datosYVerificacion: () => c.pedir('GET', `${E}/registro`, RegistroEspecialistaSchema),

  seguridad: () => c.pedir('GET', `${E}/seguridad`, SeguridadSchema),
  iniciarTotp: (r) => c.pedir('POST', `${E}/seguridad/totp`, AltaTotpSchema, { cuerpo: r }),
  confirmarTotp: (x) => c.pedir('POST', `${E}/seguridad/totp/confirmacion`, CodigosRespaldoSchema, { cuerpo: x }),
  cambiarSegundaVerificacion: (x) => c.pedir('PUT', `${E}/seguridad/segunda-verificacion`, SeguridadSchema, { cuerpo: x }),
  generarCodigosRespaldo: (r) => c.pedir('POST', `${E}/seguridad/codigos-respaldo`, CodigosRespaldoSchema, { cuerpo: r }),
  async cerrarDispositivo(did) {
    await c.pedir('DELETE', `${E}/seguridad/dispositivos/${id(did)}`, Nada);
  },

  bandeja: (cursor) => c.pedir('GET', `${E}/bandeja${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`, paginado(AvisoBandejaSchema)),
  async marcarLeidoEnBandeja(aid) {
    await c.pedir('POST', `${E}/bandeja/${id(aid)}/leido`, Nada);
  },
  async borrarDeBandeja(aid) {
    await c.pedir('DELETE', `${E}/bandeja/${id(aid)}`, Nada);
  },
  async vaciarBandeja() {
    await c.pedir('DELETE', `${E}/bandeja`, Nada);
  },

  exportacionDatos: () => c.pedir('GET', `${E}/privacidad/exportacion`, ExportacionDatosSchema.nullable()),
  pedirExportacionDatos: (r) => c.pedir('POST', `${E}/privacidad/exportacion`, ExportacionDatosSchema, { cuerpo: r }),
});
