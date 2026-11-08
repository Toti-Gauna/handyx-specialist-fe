import { z } from 'zod';
import { DatosAltaSchema, PerfilEspecialistaSchema, PerfilPublicoSchema, TurnoAntecedentesSchema } from '../../contracts/dto.ts';
import { CertificadoSchema, OnboardingSchema, RegistroEspecialistaSchema } from '../../contracts/registro.ts';
import type { ApiAlta } from '../api/alta.ts';
import type { ClienteHttp } from './cliente.ts';
import { id, Nada } from './comun.ts';

const R = '/v1/especialista/registro';

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

  // ── Registro por pasos (0.11) ──
  async crearCuenta(datos) {
    await c.pedir('POST', '/v1/auth/cuenta', Nada, { cuerpo: datos });
  },
  registro: () => c.pedir('GET', R, RegistroEspecialistaSchema),
  guardarDatosRegistro: (datos) => c.pedir('PUT', `${R}/datos`, RegistroEspecialistaSchema, { cuerpo: datos }),
  guardarDomicilio: (datos) => c.pedir('PUT', `${R}/domicilio`, RegistroEspecialistaSchema, { cuerpo: datos }),
  guardarRubrosRegistro: (datos) => c.pedir('PUT', `${R}/rubros`, RegistroEspecialistaSchema, { cuerpo: datos }),
  guardarZonas: (datos) => c.pedir('PUT', `${R}/zonas`, RegistroEspecialistaSchema, { cuerpo: datos }),
  cargarSelfie(foto, version) {
    const f = new FormData();
    if (foto) f.set('foto', foto);
    f.set('version', String(version));
    return c.pedir('POST', `${R}/selfie`, RegistroEspecialistaSchema, { formulario: f });
  },
  cargarDni({ frente, dorso, numero, version }) {
    const f = new FormData();
    if (frente) f.set('frente', frente);
    if (dorso) f.set('dorso', dorso);
    f.set('numero', numero);
    f.set('version', String(version));
    return c.pedir('POST', `${R}/dni`, RegistroEspecialistaSchema, { formulario: f });
  },
  guardarCuit: (datos) => c.pedir('PUT', `${R}/cuit`, RegistroEspecialistaSchema, { cuerpo: datos }),
  cargarCertificado(datos, { archivo }) {
    const f = new FormData();
    if (archivo) f.set('archivo', archivo);
    f.set('datos', new Blob([JSON.stringify(datos)], { type: 'application/json' }));
    return c.pedir('POST', `${R}/certificados`, CertificadoSchema, { formulario: f });
  },
  async quitarCertificado(certificadoId) {
    await c.pedir('DELETE', `${R}/certificados/${id(certificadoId)}`, Nada);
  },
  cargarAntecedentes({ archivo }) {
    const f = new FormData();
    if (archivo) f.set('archivo', archivo);
    return c.pedir('POST', `${R}/antecedentes`, RegistroEspecialistaSchema, { formulario: f });
  },
  enviarRegistro: (datos) => c.pedir('POST', `${R}/envio`, RegistroEspecialistaSchema, { cuerpo: datos }),
  onboarding: () => c.pedir('GET', '/v1/especialista/onboarding', OnboardingSchema),
  marcarOnboarding: (datos) => c.pedir('PUT', '/v1/especialista/onboarding', OnboardingSchema, { cuerpo: datos }),
});
