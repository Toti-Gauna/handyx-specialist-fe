// Máquinas de estado compartidas (estado, transición permitida y actor). El servidor es la autoridad:
// valida cada transición con estas mismas tablas y registra actor y fecha. Los frontends solo las usan
// para mostrar qué acciones están disponibles. Detalle y diagramas: docs/state-machines.md.

export const ACTORES = ['especialista', 'usuario', 'operations', 'sistema'] as const;
export type Actor = (typeof ACTORES)[number];

export interface Transicion<E extends string> {
  desde: E;
  hacia: E;
  actores: readonly Actor[];
}

export interface Maquina<E extends string> {
  nombre: string;
  estados: readonly E[];
  inicial: E;
  transiciones: readonly Transicion<E>[];
}

export function puedeTransicionar<E extends string>(m: Maquina<E>, desde: E, hacia: E, actor: Actor): boolean {
  return m.transiciones.some((t) => t.desde === desde && t.hacia === hacia && t.actores.includes(actor));
}

export function siguientes<E extends string>(m: Maquina<E>, desde: E, actor: Actor): E[] {
  return m.transiciones.filter((t) => t.desde === desde && t.actores.includes(actor)).map((t) => t.hacia);
}

export function esFinal<E extends string>(m: Maquina<E>, estado: E): boolean {
  return !m.transiciones.some((t) => t.desde === estado);
}

const t = <E extends string>(desde: E, hacia: E, ...actores: Actor[]): Transicion<E> => ({ desde, hacia, actores });

// ── Alta del especialista ────────────────────────────────────────────────────────────────────────
// Habilitar exige además los requisitos de `faltantesParaHabilitar` (los valida el servidor).
export const ESTADOS_ALTA = [
  'borrador',
  'enviada',
  'en_revision',
  'requiere_correccion',
  'habilitada',
  'rechazada',
  'suspendida',
] as const;
export type EstadoAlta = (typeof ESTADOS_ALTA)[number];

export const MAQUINA_ALTA: Maquina<EstadoAlta> = {
  nombre: 'alta_especialista',
  estados: ESTADOS_ALTA,
  inicial: 'borrador',
  transiciones: [
    t('borrador', 'enviada', 'especialista'),
    t('enviada', 'en_revision', 'operations'),
    t('en_revision', 'requiere_correccion', 'operations'),
    t('requiere_correccion', 'enviada', 'especialista'),
    t('en_revision', 'habilitada', 'operations'),
    t('en_revision', 'rechazada', 'operations'),
    t('habilitada', 'suspendida', 'operations'),
    t('suspendida', 'habilitada', 'operations'),
  ],
};

// ── Revisión de un documento (DNI, CUIT/CUIL, foto de cara, matrícula/certificación) ────────────
// `cargado` NUNCA equivale a `verificado`. Solo Operations verifica; el especialista solo carga.
export const ESTADOS_DOCUMENTO = ['faltante', 'cargado', 'en_revision', 'verificado', 'rechazado', 'vencido'] as const;
export type EstadoDocumento = (typeof ESTADOS_DOCUMENTO)[number];

export const MAQUINA_DOCUMENTO: Maquina<EstadoDocumento> = {
  nombre: 'revision_documento',
  estados: ESTADOS_DOCUMENTO,
  inicial: 'faltante',
  transiciones: [
    t('faltante', 'cargado', 'especialista'),
    t('rechazado', 'cargado', 'especialista'),
    t('vencido', 'cargado', 'especialista'),
    t('cargado', 'en_revision', 'operations'),
    t('en_revision', 'verificado', 'operations'),
    t('en_revision', 'rechazado', 'operations'),
    t('verificado', 'vencido', 'sistema'),
  ],
};

// ── Antecedentes: verificación presencial por Operations ─────────────────────────────────────────
// Sin archivos: ni PDF, ni imagen, ni captura, ni grabación. Solo el resultado mínimo, actor y fecha.
export const ESTADOS_PRESENCIAL = ['pendiente_cita', 'cita_coordinada', 'aprobada', 'no_aprobada', 'no_asistio'] as const;
export type EstadoPresencial = (typeof ESTADOS_PRESENCIAL)[number];

export const MAQUINA_PRESENCIAL: Maquina<EstadoPresencial> = {
  nombre: 'verificacion_presencial',
  estados: ESTADOS_PRESENCIAL,
  inicial: 'pendiente_cita',
  transiciones: [
    // Desde 0.5.0 el especialista reserva el turno él mismo (o lo coordina Operations). Cambiar de turno no cambia el estado.
    t('pendiente_cita', 'cita_coordinada', 'especialista', 'operations'),
    t('cita_coordinada', 'aprobada', 'operations'),
    t('cita_coordinada', 'no_aprobada', 'operations'),
    t('cita_coordinada', 'no_asistio', 'operations'),
    t('no_asistio', 'cita_coordinada', 'especialista', 'operations'),
  ],
};

// ── Pedido (service_request). Dueño: api-usuario ─────────────────────────────────────────────────
// Sin oferta el pedido no inventa especialistas: queda `sin_propuestas` y Operations puede buscar a mano.
export const ESTADOS_PEDIDO = ['buscando', 'sin_propuestas', 'busqueda_manual', 'acordado', 'cancelado'] as const;
export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number];

export const MAQUINA_PEDIDO: Maquina<EstadoPedido> = {
  nombre: 'pedido',
  estados: ESTADOS_PEDIDO,
  inicial: 'buscando',
  transiciones: [
    t('buscando', 'acordado', 'sistema'), // efecto de aceptar una propuesta (transacción única)
    t('buscando', 'sin_propuestas', 'sistema'), // vence la ventana (20 min urgente / 12 h programado)
    t('sin_propuestas', 'buscando', 'usuario'), // relanzar, hasta MAX_RELANZAMIENTOS
    t('sin_propuestas', 'busqueda_manual', 'operations'),
    t('busqueda_manual', 'buscando', 'operations'),
    t('busqueda_manual', 'acordado', 'sistema'),
    t('buscando', 'cancelado', 'usuario'),
    t('sin_propuestas', 'cancelado', 'usuario'),
    t('busqueda_manual', 'cancelado', 'usuario', 'operations'),
  ],
};

// ── Propuesta / contrapropuesta (bidireccional) ──────────────────────────────────────────────────
// Acepta o rechaza solo la contraparte; retira solo el autor (ver `puedeResponder`).
// Una contrapropuesta deja la anterior `reemplazada`. Vencer y reemplazar son del sistema.
export const ESTADOS_PROPUESTA = ['pendiente', 'aceptada', 'rechazada', 'reemplazada', 'vencida', 'retirada'] as const;
export type EstadoPropuesta = (typeof ESTADOS_PROPUESTA)[number];

export const MAQUINA_PROPUESTA: Maquina<EstadoPropuesta> = {
  nombre: 'propuesta',
  estados: ESTADOS_PROPUESTA,
  inicial: 'pendiente',
  transiciones: [
    t('pendiente', 'aceptada', 'usuario', 'especialista'),
    t('pendiente', 'rechazada', 'usuario', 'especialista'),
    t('pendiente', 'retirada', 'usuario', 'especialista'),
    t('pendiente', 'reemplazada', 'sistema'),
    t('pendiente', 'vencida', 'sistema'),
  ],
};

export type RolParte = 'usuario' | 'especialista';

/** Regla de contraparte: quien escribió la propuesta no puede aceptarla ni rechazarla; vencida no se contrata. */
export function puedeResponder(
  p: { estado: EstadoPropuesta; autorRol: RolParte; venceEn: string },
  actor: RolParte,
  ahora: Date,
): boolean {
  return p.estado === 'pendiente' && p.autorRol !== actor && ahora.getTime() < Date.parse(p.venceEn);
}

// ── Trabajo (job): nace de una propuesta aceptada ────────────────────────────────────────────────
// "Llegué" (`en_sitio`) es un evento explícito del especialista; la ubicación es opcional.
// Cambiar el acuerdo exige otra propuesta aceptada (queda en el historial), no una transición.
export const ESTADOS_TRABAJO = ['agendado', 'en_camino', 'en_sitio', 'en_curso', 'finalizado', 'cancelado'] as const;
export type EstadoTrabajo = (typeof ESTADOS_TRABAJO)[number];

export const MAQUINA_TRABAJO: Maquina<EstadoTrabajo> = {
  nombre: 'trabajo',
  estados: ESTADOS_TRABAJO,
  inicial: 'agendado',
  transiciones: [
    t('agendado', 'en_camino', 'especialista'),
    t('en_camino', 'en_sitio', 'especialista'),
    t('en_sitio', 'en_curso', 'especialista'),
    t('en_curso', 'finalizado', 'especialista'), // confirmación del usuario: PENDIENTE de definir
    t('agendado', 'cancelado', 'usuario', 'especialista', 'operations'),
    t('en_camino', 'cancelado', 'usuario', 'especialista', 'operations'),
    t('en_sitio', 'cancelado', 'usuario', 'especialista', 'operations'),
    t('en_curso', 'cancelado', 'operations'),
  ],
};

// ── Pago directo del usuario al especialista (Mercado Pago o efectivo) ───────────────────────────
// Handy no recibe ese dinero. `reportado` (manual) NO es `verificado`. Verifica un webhook validado
// del proveedor (`sistema`) u Operations con evidencia; nunca la parte que reporta.
export const ESTADOS_PAGO = ['pendiente', 'reportado', 'verificado', 'fallido', 'en_discrepancia'] as const;
export type EstadoPago = (typeof ESTADOS_PAGO)[number];

export const MAQUINA_PAGO: Maquina<EstadoPago> = {
  nombre: 'pago',
  estados: ESTADOS_PAGO,
  inicial: 'pendiente',
  transiciones: [
    t('pendiente', 'reportado', 'usuario', 'especialista'),
    t('pendiente', 'verificado', 'sistema'),
    t('pendiente', 'fallido', 'sistema'),
    t('fallido', 'pendiente', 'usuario'),
    t('reportado', 'verificado', 'operations', 'sistema'),
    t('reportado', 'en_discrepancia', 'usuario', 'especialista', 'operations'),
    t('en_discrepancia', 'verificado', 'operations'),
    t('en_discrepancia', 'fallido', 'operations'),
  ],
};

// ── Asistencia y reclamos ────────────────────────────────────────────────────────────────────────
export const ESTADOS_SOPORTE = ['abierto', 'en_curso', 'esperando_respuesta', 'resuelto', 'cerrado'] as const;
export type EstadoSoporte = (typeof ESTADOS_SOPORTE)[number];

export const MAQUINA_SOPORTE: Maquina<EstadoSoporte> = {
  nombre: 'soporte',
  estados: ESTADOS_SOPORTE,
  inicial: 'abierto',
  transiciones: [
    t('abierto', 'en_curso', 'operations'),
    t('en_curso', 'esperando_respuesta', 'operations'),
    t('esperando_respuesta', 'en_curso', 'usuario', 'especialista'),
    t('en_curso', 'resuelto', 'operations'),
    t('resuelto', 'en_curso', 'usuario', 'especialista'), // reabrir
    t('resuelto', 'cerrado', 'sistema', 'operations'),
  ],
};

// ── Baja de cuenta (eliminación real, con retenciones legales) ───────────────────────────────────
export const ESTADOS_BAJA = ['solicitada', 'en_proceso', 'completada', 'completada_con_retencion', 'cancelada'] as const;
export type EstadoBaja = (typeof ESTADOS_BAJA)[number];

export const MAQUINA_BAJA: Maquina<EstadoBaja> = {
  nombre: 'baja_cuenta',
  estados: ESTADOS_BAJA,
  inicial: 'solicitada',
  transiciones: [
    t('solicitada', 'cancelada', 'usuario', 'especialista'),
    t('solicitada', 'en_proceso', 'sistema', 'operations'),
    t('en_proceso', 'completada', 'sistema'),
    t('en_proceso', 'completada_con_retencion', 'sistema'),
  ],
};

// ── Requisitos de habilitación ───────────────────────────────────────────────────────────────────
export interface RequisitosAlta {
  dni: EstadoDocumento;
  cuitCuil: EstadoDocumento;
  fotoCara: EstadoDocumento;
  antecedentes: EstadoPresencial;
  /** Rubros con al menos uno habilitado (matrícula verificada cuando corresponde). */
  rubrosHabilitados: number;
}

export type Faltante = 'dni' | 'cuitCuil' | 'fotoCara' | 'antecedentes' | 'rubro';

/** Qué falta verificar para habilitar. Cargado ≠ verificado: solo cuenta `verificado` / `aprobada`. */
export function faltantesParaHabilitar(r: RequisitosAlta): Faltante[] {
  const faltan: Faltante[] = [];
  if (r.dni !== 'verificado') faltan.push('dni');
  if (r.cuitCuil !== 'verificado') faltan.push('cuitCuil');
  if (r.fotoCara !== 'verificado') faltan.push('fotoCara');
  if (r.antecedentes !== 'aprobada') faltan.push('antecedentes');
  if (r.rubrosHabilitados < 1) faltan.push('rubro');
  return faltan;
}
