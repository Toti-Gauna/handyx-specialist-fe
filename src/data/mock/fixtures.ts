// Fixtures SINTÉTICOS por escenario. Nombres ficticios, correos @example.test, ids 00000000-….
// Cada escenario arma el estado completo; los que no están habilitados no tienen pedidos ni trabajos.
import type {
  Aviso,
  CasoSoporteDetalle,
  Conversacion,
  Mensaje,
  Pago,
  PerfilEspecialista,
  Propuesta,
} from '../../contracts/dto.ts';
import { monto } from '../../contracts/dinero.ts';
import {
  CODIGO_PRUEBA,
  CREDENCIALES_PRUEBA,
  CUENTAS_PROVEEDOR_PRUEBA,
  MINUTO,
  RELOJ_BASE,
  idFijo,
  iso,
  type Escenario,
  type EstadoMock,
  type PedidoInterno,
  type TrabajoInterno,
} from './estado.ts';
import { BASE_PRUEBA, destinoPrueba, zonaPrueba } from './mapa.ts';
import { FOTO_PRUEBA } from './fotos.ts';
import { calcularFaltantes } from './reglas.ts';
import { turnosDePrueba } from './turnos.ts';

const MIN = 60_000;
const HORA = 60 * MIN;
const DIA = 24 * HORA;
const T0 = RELOJ_BASE;
const pesos = (n: number) => monto(n * 100);

export const ID = {
  cuenta: idFijo(0xa1),
  especialista: idFijo(0x01),
  // pedidos
  pUrgente: idFijo(0xb1),
  pProgramado: idFijo(0xb2),
  pGas: idFijo(0xb3),
  pObra: idFijo(0xb4),
  pUrgenteElec: idFijo(0xb5),
  pAire: idFijo(0xb6),
  // trabajos
  t1: idFijo(0xc1),
  t2: idFijo(0xc2),
  t3: idFijo(0xc3),
  t4: idFijo(0xc4),
  t5: idFijo(0xc5),
  /** Obra agendada de 3 etapas en 5 jornadas (lote 4.7), para recorrerla de punta a punta. */
  t6: idFijo(0xc6),
  // conversaciones
  c1: idFijo(0xd1),
  c2: idFijo(0xd2),
  c3: idFijo(0xd3),
  // pagos
  pg1: idFijo(0xe1),
  pg2: idFijo(0xe2),
  pg3: idFijo(0xe3),
  pg4: idFijo(0xe4),
  // propuestas
  pr1: idFijo(0xf1),
  pr2: idFijo(0xf2),
  pr3: idFijo(0xf3),
  pr4: idFijo(0xf4),
  // casos
  s1: idFijo(0x51),
  s2: idFijo(0x52),
} as const;

const vacioPerfil = (): PerfilEspecialista => ({
  id: ID.especialista,
  email: CREDENCIALES_PRUEBA.email,
  nombre: null,
  apellido: null,
  estadoAlta: 'borrador',
  motivoRevision: null,
  documentos: { dni: 'faltante', cuitCuil: 'faltante', fotoCara: 'faltante' },
  antecedentes: 'pendiente_cita',
  citaAntecedentes: null,
  rubros: [],
  faltantesEnvio: ['datos', 'dni', 'cuitCuil', 'fotoCara', 'rubros'],
  baja: null,
  version: 1,
});

export function estadoBase(escenario: Escenario): EstadoMock {
  return {
    escenario,
    inicioReal: Date.now(),
    saltosMs: 0,
    falla: null,
    fallaProxima: null,
    fallaMensaje: false,
    conflictoProximo: false,
    pushRechazado: false,
    sesionActiva: escenario !== 'nuevo',
    verificados: new Set([CREDENCIALES_PRUEBA.email]),
    aceptaron: new Set([CREDENCIALES_PRUEBA.email]),
    codigoEmail: null,
    recuperacion: new Map(),
    sesionExpirada: false,
    intentosFallidos: 0,
    cuentas: new Map([[CREDENCIALES_PRUEBA.email, CREDENCIALES_PRUEBA.password]]),
    cuenta: { id: ID.cuenta, email: CREDENCIALES_PRUEBA.email },
    perfil: vacioPerfil(),
    alta: {
      datos: { nombre: null, apellido: null, fechaNacimiento: null, nacionalidad: null, genero: null, ciudad: null, barrio: null },
      dni: null,
      cuitCuil: null,
      version: 1,
    },
    disponibilidad: {
      urgentesAhora: false,
      urgentesCambiadoEn: null,
      programados: false,
      franjas: [],
      zonas: [],
      version: 1,
    },
    pedidos: [],
    propuestas: [],
    trabajos: [],
    conversaciones: [],
    mensajes: {},
    pagos: [],
    casos: [],
    avisos: [],
    preferencias: { avisosUrgentes: true, avisosProgramados: true, avisosMensajes: true, avisosPagos: true, push: 'sin_pedir' },
    contactos: [],
    mediosCobro: { efectivo: true, mercadoPago: true, cuentaMercadoPago: { estado: 'vinculada', etiqueta: 'Cuenta de prueba de Mercado Pago' }, version: 0 },
    baja: null,
    feeAvisoEn: null,
    viajes: new Map(),
    turnos: turnosDePrueba(),
    gps: { senal: 'normal', rapido: false, posicion: BASE_PRUEBA, desviar: false },
    idempotencia: new Map(),
    contador: 0,
    nota: null,
  };
}

export function crearEstado(escenario: Escenario): EstadoMock {
  const s = estadoBase(escenario);
  if (escenario === 'nuevo') return s;

  // Cuentas a medio crear: no hay alta todavía.
  if (escenario === 'sin_verificar') {
    const email = 'cuenta.nueva@example.test';
    s.cuentas.set(email, 'una-clave-larga-de-prueba');
    s.aceptaron.add(email);
    s.cuenta.email = email;
    s.perfil.email = email;
    s.codigoEmail = { codigo: CODIGO_PRUEBA, venceMs: RELOJ_BASE + 10 * MINUTO, reenviarDesdeMs: RELOJ_BASE + MINUTO, intentos: 0 };
    return s;
  }
  if (escenario === 'sin_aceptar') {
    const { email } = CUENTAS_PROVEEDOR_PRUEBA.google[0];
    s.cuentas.set(email, '');
    s.verificados.add(email);
    s.cuenta.email = email;
    s.perfil.email = email;
    return s;
  }

  if (escenario === 'incompleto') {
    s.alta.datos = { ...s.alta.datos, nombre: 'Especialista', apellido: 'De Prueba' };
    s.perfil = {
      ...vacioPerfil(),
      nombre: 'Especialista',
      apellido: 'De Prueba',
      documentos: { dni: 'cargado', cuitCuil: 'faltante', fotoCara: 'faltante' },
      rubros: [{ rubro: 'plomeria', estado: 'elegido', matricula: null }],
      faltantesEnvio: ['datos', 'cuitCuil', 'fotoCara'],
    };
    s.alta.dni = '30111222';
    return s;
  }

  // Alta completa para los demás escenarios
  s.alta = {
    datos: {
      nombre: 'Especialista',
      apellido: 'De Prueba',
      fechaNacimiento: '1988-04-12',
      nacionalidad: 'Argentina',
      genero: 'prefiero_no_decir',
      ciudad: 'Mar del Plata',
      barrio: 'Centro',
    },
    dni: '30111222',
    cuitCuil: '20301112229',
    version: 4,
  };
  s.perfil = {
    ...vacioPerfil(),
    nombre: 'Especialista',
    apellido: 'De Prueba',
    faltantesEnvio: [],
    version: 3,
  };
  s.disponibilidad = {
    urgentesAhora: false,
    urgentesCambiadoEn: null,
    programados: true,
    franjas: [
      { dia: 1, desde: '08:00', hasta: '17:00' },
      { dia: 3, desde: '08:00', hasta: '17:00' },
      { dia: 5, desde: '08:00', hasta: '13:00' },
    ],
    zonas: ['Centro', 'La Perla', 'Playa Grande'],
    version: 1,
  };

  if (escenario === 'en_revision' || escenario === 'correccion' || escenario === 'rechazado') {
    s.perfil.estadoAlta = escenario === 'en_revision' ? 'en_revision' : escenario === 'correccion' ? 'requiere_correccion' : 'rechazada';
    s.perfil.documentos = { dni: 'en_revision', cuitCuil: 'en_revision', fotoCara: 'en_revision' };
    s.perfil.rubros = [
      { rubro: 'plomeria', estado: 'en_revision', matricula: null },
      { rubro: 'gas', estado: 'en_revision', matricula: 'en_revision' },
    ];
    if (escenario === 'correccion') {
      s.perfil.motivoRevision = 'La foto del DNI se ve cortada. Volvé a cargarla completa y con buena luz.';
      s.perfil.documentos.dni = 'rechazado';
    }
    if (escenario === 'rechazado') {
      s.perfil.motivoRevision = 'No pudimos validar tu alta con la documentación presentada. Si creés que es un error, escribinos desde Ayuda.';
      s.perfil.documentos = { dni: 'rechazado', cuitCuil: 'verificado', fotoCara: 'verificado' };
    }
    s.disponibilidad.programados = false;
    s.disponibilidad.zonas = [];
    s.disponibilidad.franjas = [];
    // Lo que falta lo calcula el servidor (antes quedaba vacío y el resumen decía "Está todo cargado" con el DNI rechazado).
    s.perfil.faltantesEnvio = calcularFaltantes(s);
    s.avisos.push({
      id: idFijo(0x71),
      tipo: 'cuenta',
      titulo: escenario === 'en_revision' ? 'Tu alta está en revisión' : escenario === 'correccion' ? 'Tu alta necesita una corrección' : 'Revisamos tu alta',
      cuerpo: 'Abrí la app para ver los próximos pasos.',
      creadoEn: iso(T0 - 2 * HORA),
      leido: false,
      destino: { ruta: 'alta', id: null },
    });
    return s;
  }

  // ── habilitado y baja: operación completa ──────────────────────────────────────────────────────
  s.perfil.estadoAlta = 'habilitada';
  s.perfil.documentos = { dni: 'verificado', cuitCuil: 'verificado', fotoCara: 'verificado' };
  s.perfil.antecedentes = 'aprobada';
  s.perfil.rubros = [
    { rubro: 'plomeria', estado: 'habilitado', matricula: null },
    { rubro: 'electricidad', estado: 'habilitado', matricula: null },
    { rubro: 'albanileria', estado: 'habilitado', matricula: null },
    { rubro: 'gas', estado: 'requiere_matricula', matricula: 'faltante' },
  ];
  s.perfil.faltantesEnvio = [];
  s.feeAvisoEn = iso(T0 - 6 * DIA);
  s.preferencias.push = 'activado';

  const ped = (
    id: string,
    p: Partial<PedidoInterno['pub']> & Pick<PedidoInterno['pub'], 'rubro' | 'tipo' | 'descripcion' | 'zonaAproximada' | 'creadoEn' | 'estado'>,
    extra: Partial<PedidoInterno> = {},
  ): PedidoInterno => ({
    pub: { id, fechaSolicitada: null, ventanaHasta: null, zonaMapa: zonaPrueba(id, destinoPrueba(id, p.zonaAproximada)), ...p },
    cliente: 'Cliente de prueba',
    direccion: 'Dirección de prueba 100 (ficticia)',
    destino: destinoPrueba(id, p.zonaAproximada),
    metodoPago: 'mercado_pago',
    conversacionId: null,
    ...extra,
  });

  s.pedidos = [
    ped(ID.pUrgente, { rubro: 'plomeria', tipo: 'urgente', descripcion: 'Pérdida debajo de la bacha de la cocina: sale agua al abrir la canilla.', zonaAproximada: 'La Perla', creadoEn: iso(T0 - 8 * MIN), ventanaHasta: iso(T0 + 12 * MIN), estado: 'buscando' }, { cliente: 'Cliente de prueba 1' }),
    ped(ID.pProgramado, { rubro: 'plomeria', tipo: 'programado', descripcion: 'Cambiar el flexible del inodoro y revisar una canilla que gotea.', zonaAproximada: 'Centro', fechaSolicitada: iso(Date.parse('2026-11-19T13:00:00Z')), creadoEn: iso(T0 - 3 * HORA), ventanaHasta: iso(T0 + 9 * HORA), estado: 'buscando' }, { cliente: 'Cliente de prueba 2', conversacionId: ID.c2 }),
    ped(ID.pGas, { rubro: 'gas', tipo: 'programado', descripcion: 'Revisión anual del calefón.', zonaAproximada: 'Centro', fechaSolicitada: iso(Date.parse('2026-11-20T15:00:00Z')), creadoEn: iso(T0 - 5 * HORA), ventanaHasta: iso(T0 + 7 * HORA), estado: 'buscando' }),
    ped(ID.pObra, { rubro: 'albanileria', tipo: 'obra', descripcion: 'Revoque y pintura de una medianera. Primero una visita para presupuestar.', zonaAproximada: 'Playa Grande', fechaSolicitada: iso(Date.parse('2026-11-24T13:00:00Z')), creadoEn: iso(T0 - 6 * HORA), ventanaHasta: iso(T0 + 6 * HORA), estado: 'buscando' }, { cliente: 'Cliente de prueba 3' }),
    ped(ID.pUrgenteElec, { rubro: 'electricidad', tipo: 'urgente', descripcion: 'Saltó la térmica y no vuelve a subir.', zonaAproximada: 'Playa Grande', creadoEn: iso(T0 - 2 * MIN), ventanaHasta: iso(T0 + 18 * MIN), estado: 'buscando' }, { cliente: 'Cliente de prueba 4' }),
    ped(ID.pAire, { rubro: 'aire_acondicionado', tipo: 'programado', descripcion: 'Limpieza y service de un split.', zonaAproximada: 'Centro', fechaSolicitada: iso(Date.parse('2026-11-21T14:00:00Z')), creadoEn: iso(T0 - 4 * HORA), ventanaHasta: iso(T0 + 8 * HORA), estado: 'buscando' }),
  ];

  const prop = (p: Omit<Propuesta, 'version' | 'reemplazaA'> & Partial<Pick<Propuesta, 'reemplazaA'>>): Propuesta => ({ version: 0, reemplazaA: null, ...p });
  s.propuestas = [
    // El usuario le propone al especialista (pedido programado, con chat desde la cotización)
    prop({ id: ID.pr1, pedidoId: ID.pProgramado, autorRol: 'usuario', monto: pesos(38000), alcance: 'Cambio de flexible y revisión de la canilla. Materiales incluidos.', horario: { inicio: iso(Date.parse('2026-11-19T13:00:00Z')), fin: iso(Date.parse('2026-11-19T15:00:00Z')) }, venceEn: iso(T0 + 6 * HORA), estado: 'pendiente' }),
    // Trabajos acordados
    prop({ id: ID.pr2, pedidoId: idFijo(0xb7), autorRol: 'especialista', monto: pesos(45000), alcance: 'Cambio de flexible y canilla del baño.', horario: { inicio: iso(Date.parse('2026-11-18T13:00:00Z')), fin: iso(Date.parse('2026-11-18T15:00:00Z')) }, venceEn: iso(T0 - 20 * HORA), estado: 'aceptada' }),
    prop({ id: ID.pr3, pedidoId: idFijo(0xb8), autorRol: 'especialista', monto: pesos(30000), alcance: 'Destapación de cañería.', horario: { inicio: iso(T0 - DIA - 3 * HORA), fin: null }, venceEn: iso(T0 - 3 * DIA), estado: 'aceptada' }),
    prop({ id: ID.pr4, pedidoId: idFijo(0xb9), autorRol: 'especialista', monto: pesos(52000), alcance: 'Cambio de tablero y térmicas.', horario: { inicio: iso(T0 - 5 * DIA), fin: null }, venceEn: iso(T0 - 7 * DIA), estado: 'aceptada' }),
  ];

  const trab = (
    id: string,
    pedidoId: string,
    propuestaId: string,
    estado: TrabajoInterno['trabajo']['estado'],
    rubro: TrabajoInterno['trabajo']['rubro'],
    tipo: TrabajoInterno['trabajo']['tipo'],
    importe: number,
    alcance: string,
    inicio: number,
    conversacionId: string,
    contraparte: string,
    extra: Partial<TrabajoInterno> = {},
  ): TrabajoInterno => ({
    trabajo: {
      id,
      pedidoId,
      propuestaAceptadaId: propuestaId,
      rubro,
      tipo,
      acuerdo: { monto: pesos(importe), alcance, horario: { inicio: iso(inicio), fin: null } },
      direccion: 'Dirección de prueba 100 (ficticia)',
      destino: destinoPrueba(id, 'Güemes'),
      estado,
      // Los que ya llegaron, con la llegada automática (geocerca) salvo que el escenario diga otra cosa.
      llegada: ['en_sitio', 'en_curso', 'finalizado'].includes(estado) ? { modo: 'automatica', motivo: null, en: iso(inicio) } : null,
      conversacionId,
      version: 1,
    },
    contraparte,
    eventos: [{ estado: 'agendado', en: iso(inicio - 2 * DIA), actor: 'sistema' }],
    etapas: [],
    cambioPendienteId: null,
    pagoId: null,
    metodoPago: 'mercado_pago',
    adicionales: [],
    jornadas: [],
    diario: [],
    ...extra,
  });

  const t1 = trab(ID.t1, idFijo(0xb7), ID.pr2, 'agendado', 'plomeria', 'programado', 45000, 'Cambio de flexible y canilla del baño.', Date.parse('2026-11-18T13:00:00Z'), ID.c1, 'Cliente de prueba 5', { pagoId: ID.pg1 });
  t1.trabajo.acuerdo.horario.fin = iso(Date.parse('2026-11-18T15:00:00Z'));
  const t2 = trab(ID.t2, idFijo(0xb8), ID.pr3, 'finalizado', 'plomeria', 'urgente', 30000, 'Destapación de cañería.', T0 - DIA - 3 * HORA, ID.c3, 'Cliente de prueba 6', { pagoId: ID.pg2, metodoPago: 'efectivo' });
  t2.eventos.push({ estado: 'en_camino', en: iso(T0 - DIA - 3 * HORA), actor: 'especialista' }, { estado: 'en_sitio', en: iso(T0 - DIA - 2.6 * HORA), actor: 'especialista' }, { estado: 'en_curso', en: iso(T0 - DIA - 2.5 * HORA), actor: 'especialista' }, { estado: 'finalizado', en: iso(T0 - DIA - 1.5 * HORA), actor: 'especialista' });
  t2.trabajo.direccion = null;
  t2.trabajo.destino = null;
  t2.trabajo.llegada = { modo: 'respaldo', motivo: 'sin_senal', en: iso(T0 - DIA - 2.6 * HORA) };
  const t3 = trab(ID.t3, idFijo(0xb9), ID.pr4, 'finalizado', 'electricidad', 'programado', 52000, 'Cambio de tablero y térmicas.', T0 - 5 * DIA, idFijo(0xd4), 'Cliente de prueba 7', { pagoId: ID.pg3 });
  t3.eventos.push({ estado: 'finalizado', en: iso(T0 - 5 * DIA + 4 * HORA), actor: 'especialista' });
  t3.trabajo.direccion = null;
  t3.trabajo.destino = null;
  const t4 = trab(ID.t4, idFijo(0xba), idFijo(0xf5), 'en_curso', 'albanileria', 'obra', 320000, 'Revoque, pintura y terminación de una medianera, en tres etapas.', T0 - 3 * DIA, idFijo(0xd5), 'Cliente de prueba 8', { pagoId: ID.pg4 });
  t4.eventos.push({ estado: 'en_curso', en: iso(T0 - 3 * DIA), actor: 'especialista' });
  // Obras (0.8.0): etapas con lo que incluyen y su cobro, jornadas de 9 a 17 (hora de Buenos Aires) y diario.
  const DIA_9 = Date.parse('2026-11-17T12:00:00.000Z'); // martes 17/11, 9:00 en Buenos Aires
  const etapa = (n: number, orden: number, nombre: string, incluye: string, importe: number, estado: TrabajoInterno['etapas'][number]['estado'], terminadaEn: number | null = null, pagoId: string | null = null) => ({
    id: idFijo(n),
    orden,
    nombre,
    incluye,
    monto: pesos(importe),
    estado,
    terminadaEn: terminadaEn === null ? null : iso(terminadaEn),
    pagoId,
  });
  const jornada = (n: number, etapaId: string, numero: number, dia: number, estado: TrabajoInterno['jornadas'][number]['estado'] = 'programada') => ({
    id: idFijo(n),
    etapaId,
    numero,
    horario: { inicio: iso(DIA_9 + dia * DIA), fin: iso(DIA_9 + dia * DIA + 8 * HORA) },
    estado,
    cambioPendiente: null,
  });
  t4.trabajo.acuerdo.horario.inicio = iso(DIA_9 - 3 * DIA);
  t4.etapas = [
    etapa(0xc41, 1, 'Revoque', 'Picado del revoque flojo, revoque grueso y fino de la medianera.', 120000, 'terminada', T0 - 2 * DIA, ID.pg4),
    etapa(0xc42, 2, 'Pintura', 'Fijador y dos manos de látex para exterior.', 140000, 'en_curso'),
    etapa(0xc43, 3, 'Terminación', 'Cierre de juntas, limpieza y retiro de escombros.', 60000, 'pendiente'),
  ];
  t4.jornadas = [
    jornada(0xca1, idFijo(0xc41), 1, -3, 'hecha'),
    jornada(0xca2, idFijo(0xc41), 2, -2, 'hecha'),
    jornada(0xca3, idFijo(0xc42), 3, 0),
    jornada(0xca4, idFijo(0xc42), 4, 2),
    jornada(0xca5, idFijo(0xc43), 5, 5),
  ];
  t4.diario = [
    { id: idFijo(0xcd1), etapaId: idFijo(0xc41), jornadaId: idFijo(0xca1), nota: 'Picamos todo el revoque flojo y dejamos la pared lista para revocar.', fotos: [{ id: idFijo(0xcd5), url: FOTO_PRUEBA }], creadoEn: iso(DIA_9 - 3 * DIA + 7 * HORA) },
    { id: idFijo(0xcd2), etapaId: idFijo(0xc41), jornadaId: idFijo(0xca2), nota: 'Terminamos el revoque grueso y el fino. Tiene que secar antes de pintar.', fotos: [{ id: idFijo(0xcd6), url: FOTO_PRUEBA }, { id: idFijo(0xcd7), url: FOTO_PRUEBA }], creadoEn: iso(DIA_9 - 2 * DIA + 7 * HORA) },
  ];
  const t6 = trab(ID.t6, idFijo(0xbc), idFijo(0xf7), 'agendado', 'albanileria', 'obra', 250000, 'Pintura de un departamento de dos ambientes, en tres etapas.', DIA_9 + DIA, idFijo(0xd7), 'Cliente de prueba 11');
  t6.trabajo.acuerdo.horario.fin = iso(DIA_9 + DIA + 8 * HORA);
  t6.trabajo.destino = destinoPrueba(ID.t6, 'Centro');
  t6.etapas = [
    etapa(0xc61, 1, 'Preparación', 'Proteger pisos y muebles, enduido y lijado de paredes.', 60000, 'pendiente'),
    etapa(0xc62, 2, 'Pintura', 'Dos manos de látex interior en paredes y techos.', 150000, 'pendiente'),
    etapa(0xc63, 3, 'Terminación', 'Marcos, retoques y limpieza final.', 40000, 'pendiente'),
  ];
  // Miércoles a viernes, y lunes y martes de la semana siguiente.
  t6.jornadas = [
    jornada(0xcb1, idFijo(0xc61), 1, 1),
    jornada(0xcb2, idFijo(0xc62), 2, 2),
    jornada(0xcb3, idFijo(0xc62), 3, 3),
    jornada(0xcb4, idFijo(0xc62), 4, 6),
    jornada(0xcb5, idFijo(0xc63), 5, 7),
  ];
  const t5 = trab(ID.t5, idFijo(0xbb), idFijo(0xf6), 'cancelado', 'plomeria', 'programado', 25000, 'Revisión de pérdida (cancelado por el usuario).', T0 - 8 * DIA, idFijo(0xd6), 'Cliente de prueba 9');
  t5.eventos.push({ estado: 'cancelado', en: iso(T0 - 8 * DIA - 3 * HORA), actor: 'usuario' });
  t5.trabajo.direccion = null;
  t5.trabajo.destino = null;
  s.trabajos = [t1, t2, t3, t4, t5, t6];

  const pago = (
    id: string,
    trabajoId: string,
    descripcion: string,
    importe: number,
    metodo: Pago['metodo'],
    estado: Pago['estado'],
    fuente: Pago['fuenteConfirmacion'],
    ref: string | null,
    en: number,
    etapaId: string | null = null,
  ): Pago => ({
    id,
    trabajoId,
    etapaId,
    descripcion,
    feeHandy: pesos(0),
    neto: pesos(importe),
    metodo,
    monto: pesos(importe),
    estado,
    fuenteConfirmacion: fuente,
    referenciaProveedor: ref,
    actualizadoEn: iso(en),
  });
  s.pagos = [
    pago(ID.pg1, ID.t1, 'Plomería · 18/11', 45000, 'mercado_pago', 'pendiente', null, null, T0 - 20 * HORA),
    pago(ID.pg2, ID.t2, 'Plomería · 16/11', 30000, 'efectivo', 'reportado', 'reporte_especialista', null, T0 - DIA),
    pago(ID.pg3, ID.t3, 'Electricidad · 12/11', 52000, 'mercado_pago', 'verificado', 'webhook_proveedor', 'MP-PRUEBA-0003', T0 - 5 * DIA + 5 * HORA),
    pago(ID.pg4, ID.t4, 'Albañilería · Etapa 1 · Revoque', 120000, 'mercado_pago', 'fallido', 'webhook_proveedor', 'MP-PRUEBA-0004', T0 - 2 * DIA, idFijo(0xc41)),
  ];

  const conv = (id: string, pedidoId: string, trabajoId: string | null, contraparte: string, etapa: Conversacion['etapa'], ultimo: string | null, noLeidos: number, en: number): Conversacion => ({
    id,
    pedidoId,
    trabajoId,
    contraparte,
    etapa,
    ultimoMensaje: ultimo,
    noLeidos,
    actualizadoEn: iso(en),
    contactoId: null,
  });
  s.conversaciones = [
    conv(ID.c2, ID.pProgramado, null, 'Cliente de prueba 2', 'cotizando', 'Propuesta de $ 38.000 para el jueves 19/11', 1, T0 - 25 * MIN),
    conv(ID.c1, idFijo(0xb7), ID.t1, 'Cliente de prueba 5', 'trabajo', 'Perfecto, te espero mañana.', 1, T0 - 2 * HORA),
    conv(ID.c3, idFijo(0xb8), ID.t2, 'Cliente de prueba 6', 'cerrada', 'Gracias, quedó funcionando.', 0, T0 - DIA),
    conv(idFijo(0xd7), idFijo(0xbc), ID.t6, 'Cliente de prueba 11', 'trabajo', 'Dejo las llaves con el encargado.', 0, T0 - 3 * HORA),
  ];
  // Contactos (lote 4.8): uno ya guardado desde su chat; el resto se agrega desde cada conversación.
  s.contactos = [{ id: idFijo(0x7a1), conversacionId: ID.c1, nombre: 'Cliente de prueba 5', detalle: 'Plomería · Güemes', agregadoEn: iso(T0 - 2 * DIA) }];
  for (const k of s.contactos) {
    const c = s.conversaciones.find((x) => x.id === k.conversacionId);
    if (c) c.contactoId = k.id;
  }
  const msg = (id: number, conversacionId: string, autorRol: Mensaje['autorRol'], texto: string | null, en: number, tipo: Mensaje['tipo'] = 'texto', propuestaId: string | null = null): Mensaje => ({
    id: idFijo(0x900 + id),
    conversacionId,
    autorRol,
    tipo,
    texto,
    mediaUrl: null,
    propuestaId,
    enviadoEn: iso(en),
  });
  s.mensajes = {
    [ID.c2]: [
      msg(1, ID.c2, 'usuario', 'Hola, necesito cambiar el flexible del inodoro y una canilla que gotea.', T0 - 2 * HORA),
      msg(2, ID.c2, 'especialista', '¿Podés mandarme una foto de la canilla?', T0 - 100 * MIN),
      msg(3, ID.c2, 'usuario', 'Te propongo $ 38.000 con materiales para el jueves 19/11 a las 10:00.', T0 - 25 * MIN, 'propuesta', ID.pr1),
    ],
    [ID.c1]: [
      msg(4, ID.c1, 'especialista', 'Hola, mañana a las 10:00 estoy por ahí.', T0 - 3 * HORA),
      msg(5, ID.c1, 'usuario', 'Perfecto, te espero mañana.', T0 - 2 * HORA),
    ],
    [ID.c3]: [msg(6, ID.c3, 'usuario', 'Gracias, quedó funcionando.', T0 - DIA)],
    [idFijo(0xd7)]: [msg(20, idFijo(0xd7), 'usuario', 'Dejo las llaves con el encargado.', T0 - 3 * HORA)],
  };

  const caso = (id: string, asunto: string, categoria: CasoSoporteDetalle['categoria'], estado: CasoSoporteDetalle['estado'], trabajoId: string | null, detalle: string, eventos: CasoSoporteDetalle['eventos'], en: number): CasoSoporteDetalle => ({
    id,
    asunto,
    categoria,
    estado,
    trabajoId,
    pedidoId: null,
    creadoEn: iso(en),
    actualizadoEn: eventos.length > 0 ? (eventos[eventos.length - 1]?.creadoEn ?? iso(en)) : iso(en),
    detalle,
    eventos,
  });
  s.casos = [
    caso(ID.s1, 'Diferencia en un cobro con Mercado Pago', 'pago', 'resuelto', ID.t3, 'El pago figura acreditado pero el monto no coincide con lo acordado.', [
      { id: idFijo(0xa01), autor: 'handy', texto: 'Revisamos el movimiento: coincide con lo acordado. Si seguís viendo una diferencia, respondé este caso.', adjuntos: 0, creadoEn: iso(T0 - 3 * DIA) },
    ], T0 - 4 * DIA),
    caso(ID.s2, 'El usuario no estaba en el lugar', 'reclamo', 'en_curso', ID.t2, 'Llegué en el horario acordado y no había nadie para abrir.', [
      { id: idFijo(0xa02), autor: 'handy', texto: 'Recibimos tu reclamo y lo estamos revisando con la otra parte.', adjuntos: 0, creadoEn: iso(T0 - 20 * HORA) },
    ], T0 - 22 * HORA),
  ];

  const av = (n: number, tipo: Aviso['tipo'], titulo: string, cuerpo: string, en: number, ruta: Aviso['destino']['ruta'], id: string | null, leido = false): Aviso => ({
    id: idFijo(0x800 + n),
    tipo,
    titulo,
    cuerpo,
    creadoEn: iso(en),
    leido,
    destino: { ruta, id },
  });
  s.avisos = [
    av(1, 'pedido_urgente', 'Pedido urgente en tu zona', 'Plomería · La Perla. Abrilo para ver el detalle y decidir.', T0 - 8 * MIN, 'pedido', ID.pUrgente),
    av(2, 'pedido_programado', 'Nuevo pedido programado', 'Plomería · Centro · jueves 19/11. Podés enviar tu propuesta cuando quieras.', T0 - 3 * HORA, 'pedido', ID.pProgramado),
    av(3, 'propuesta', 'Te llegó una propuesta', 'Cliente de prueba 2 te propone un precio y horario. Abrila para responder.', T0 - 25 * MIN, 'pedido', ID.pProgramado),
    av(4, 'mensaje', 'Mensaje nuevo', 'Tenés un mensaje en un trabajo agendado.', T0 - 2 * HORA, 'hilo', ID.c1),
    av(5, 'pago', 'Un pago no se acreditó', 'Mercado Pago informó un problema con un pago de una obra.', T0 - 2 * DIA, 'caja', null, true),
    av(6, 'soporte', 'Novedades en tu reclamo', 'Hay una respuesta en un caso abierto.', T0 - 20 * HORA, 'soporte', ID.s2, true),
  ];

  if (escenario === 'baja') {
    s.baja = {
      estado: 'solicitada',
      solicitadaEn: iso(T0 - 2 * HORA),
      mensaje: 'Recibimos tu solicitud. Todavía no se borró nada: podés cancelarla mientras esté en este estado.',
    };
    s.perfil.baja = 'solicitada';
  }
  return s;
}
