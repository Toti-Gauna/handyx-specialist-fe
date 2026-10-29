// Fixtures SINTÉTICOS (ficticios). Nada de datos reales: nombres de prueba, zonas genéricas de MDP,
// ids fijos con el prefijo 00000000-… para que se reconozcan a simple vista.
import type { Disponibilidad, PedidoElegible, PerfilEspecialista } from '../../contracts/dto.ts';

export const ID_ESPECIALISTA = '00000000-0000-4000-8000-000000000001';
export const ID_CUENTA = '00000000-0000-4000-8000-0000000000a1';

export const perfilHabilitado: PerfilEspecialista = {
  id: ID_ESPECIALISTA,
  nombre: 'Especialista',
  apellido: 'De Prueba',
  estadoAlta: 'habilitada',
  motivoRevision: null,
  documentos: { dni: 'verificado', cuitCuil: 'verificado', fotoCara: 'verificado' },
  antecedentes: 'aprobada',
  rubros: [
    { rubro: 'plomeria', estado: 'habilitado', matricula: null },
    { rubro: 'gas', estado: 'requiere_matricula', matricula: 'faltante' },
  ],
  baja: null,
  version: 3,
};

export const perfilEnRevision: PerfilEspecialista = {
  ...perfilHabilitado,
  estadoAlta: 'en_revision',
  documentos: { dni: 'en_revision', cuitCuil: 'cargado', fotoCara: 'en_revision' },
  antecedentes: 'pendiente_cita',
  rubros: [{ rubro: 'plomeria', estado: 'en_revision', matricula: null }],
  version: 1,
};

export const disponibilidadInicial: Disponibilidad = {
  urgentesAhora: false,
  urgentesCambiadoEn: null,
  programados: true,
  franjas: [
    { dia: 1, desde: '08:00', hasta: '17:00' },
    { dia: 3, desde: '08:00', hasta: '17:00' },
  ],
  zonas: ['mdp-centro', 'mdp-la-perla'],
  version: 1,
};

export const pedidosFixture: PedidoElegible[] = [
  {
    id: '00000000-0000-4000-8000-0000000000b1',
    rubro: 'plomeria',
    tipo: 'urgente',
    descripcion: 'Pérdida debajo de la bacha de la cocina (pedido de prueba).',
    zonaAproximada: 'La Perla',
    fechaSolicitada: null,
    creadoEn: '2026-11-17T14:52:00.000Z',
    ventanaHasta: '2026-11-17T15:12:00.000Z',
    estado: 'buscando',
    miPropuesta: null,
  },
  {
    id: '00000000-0000-4000-8000-0000000000b2',
    rubro: 'plomeria',
    tipo: 'programado',
    descripcion: 'Cambiar el flexible del inodoro (pedido de prueba).',
    zonaAproximada: 'Centro',
    fechaSolicitada: '2026-11-19T13:00:00.000Z',
    creadoEn: '2026-11-17T12:10:00.000Z',
    ventanaHasta: '2026-11-18T00:10:00.000Z',
    estado: 'buscando',
    miPropuesta: null,
  },
  {
    id: '00000000-0000-4000-8000-0000000000b3',
    rubro: 'gas',
    tipo: 'programado',
    descripcion: 'Revisión de calefón (pedido de prueba).',
    zonaAproximada: 'Centro',
    fechaSolicitada: '2026-11-20T15:00:00.000Z',
    creadoEn: '2026-11-17T11:00:00.000Z',
    ventanaHasta: '2026-11-17T23:00:00.000Z',
    estado: 'buscando',
    miPropuesta: null,
  },
];
