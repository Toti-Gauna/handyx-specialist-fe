// Textos de cada estado del contrato, en español rioplatense. Cada estado dice QUÉ pasa y, cuando aplica, qué sigue.
// El tono es solo apoyo visual: el significado siempre está en el texto y en el ícono.
// El tono `noche` queda reservado al TIPO urgente (ChipTipo): ningún estado lo usa, para no confundir tipo con estado.
import type { EstadoAlta, EstadoDocumento, EstadoPago, EstadoPresencial, EstadoPropuesta, EstadoSoporte, EstadoTrabajo } from '../contracts/maquinas.ts';
import type { NombreIcono } from '../components/Icono.tsx';

export type Tono = 'neutro' | 'azul' | 'exito' | 'aviso' | 'error' | 'noche';
export interface Etiqueta {
  texto: string;
  tono: Tono;
  icono: NombreIcono;
  detalle?: string;
}

export const ALTA: Record<EstadoAlta, Etiqueta & { detalle: string }> = {
  borrador: { texto: 'Alta sin enviar', tono: 'neutro', icono: 'editar', detalle: 'Completá los pasos y enviá tu alta para que la revise Operations.' },
  enviada: { texto: 'Alta enviada', tono: 'azul', icono: 'reloj', detalle: 'Recibimos tu alta. Operations la va a tomar en revisión.' },
  en_revision: { texto: 'En revisión', tono: 'azul', icono: 'lupa', detalle: 'Operations está revisando tus datos. Mientras tanto no podés editarlos.' },
  requiere_correccion: { texto: 'Hay que corregir algo', tono: 'aviso', icono: 'alerta', detalle: 'Corregí lo que te indicamos y volvé a enviar el alta.' },
  habilitada: { texto: 'Alta habilitada', tono: 'exito', icono: 'verificado', detalle: 'Podés declarar tu disponibilidad y recibir pedidos.' },
  rechazada: { texto: 'Alta rechazada', tono: 'error', icono: 'prohibido', detalle: 'No pudimos habilitar tu alta. Podés escribirnos desde Ayuda.' },
  suspendida: { texto: 'Cuenta suspendida', tono: 'error', icono: 'prohibido', detalle: 'Tu cuenta está suspendida. Escribinos desde Ayuda.' },
};

export const DOCUMENTO: Record<EstadoDocumento, Etiqueta> = {
  faltante: { texto: 'Falta cargarlo', tono: 'neutro', icono: 'mas' },
  cargado: { texto: 'Cargado, sin revisar', tono: 'azul', icono: 'reloj' },
  en_revision: { texto: 'En revisión', tono: 'azul', icono: 'lupa' },
  verificado: { texto: 'Verificado por Handyx', tono: 'exito', icono: 'verificado' },
  rechazado: { texto: 'Hay que volver a cargarlo', tono: 'aviso', icono: 'alerta' },
  vencido: { texto: 'Vencido', tono: 'aviso', icono: 'alerta' },
};

export const PRESENCIAL: Record<EstadoPresencial, Etiqueta & { detalle: string }> = {
  pendiente_cita: { texto: 'Cita pendiente', tono: 'neutro', icono: 'calendario', detalle: 'Operations te va a contactar para coordinar una cita presencial.' },
  cita_coordinada: { texto: 'Cita coordinada', tono: 'azul', icono: 'calendario', detalle: 'Ya hay una cita presencial acordada. Llevá tu DNI.' },
  aprobada: { texto: 'Verificación presencial aprobada', tono: 'exito', icono: 'verificado', detalle: 'Operations registró el resultado. No guardamos ningún archivo.' },
  no_aprobada: { texto: 'Verificación no aprobada', tono: 'error', icono: 'prohibido', detalle: 'Escribinos desde Ayuda si querés saber más.' },
  no_asistio: { texto: 'No asististe a la cita', tono: 'aviso', icono: 'alerta', detalle: 'Operations puede coordinar una cita nueva.' },
};

export const RUBRO_ESTADO: Record<'elegido' | 'habilitado' | 'requiere_matricula' | 'en_revision' | 'no_habilitado', Etiqueta> = {
  elegido: { texto: 'Elegido', tono: 'neutro', icono: 'check' },
  habilitado: { texto: 'Habilitado', tono: 'exito', icono: 'verificado' },
  requiere_matricula: { texto: 'Falta la matrícula', tono: 'aviso', icono: 'alerta' },
  en_revision: { texto: 'En revisión', tono: 'azul', icono: 'lupa' },
  no_habilitado: { texto: 'No habilitado', tono: 'error', icono: 'prohibido' },
};

export const PROPUESTA: Record<EstadoPropuesta, Etiqueta> = {
  pendiente: { texto: 'Esperando respuesta', tono: 'azul', icono: 'reloj' },
  aceptada: { texto: 'Aceptada', tono: 'exito', icono: 'checkCirculo' },
  rechazada: { texto: 'Rechazada', tono: 'error', icono: 'cerrar' },
  reemplazada: { texto: 'Reemplazada por otra', tono: 'neutro', icono: 'reintentar' },
  vencida: { texto: 'Venció', tono: 'neutro', icono: 'reloj' },
  retirada: { texto: 'Retirada', tono: 'neutro', icono: 'cerrar' },
};

export const TRABAJO: Record<EstadoTrabajo, Etiqueta> = {
  agendado: { texto: 'Agendado', tono: 'azul', icono: 'calendario' },
  en_camino: { texto: 'En camino', tono: 'azul', icono: 'pin' },
  en_sitio: { texto: 'En el lugar', tono: 'azul', icono: 'pin' },
  en_curso: { texto: 'En curso', tono: 'azul', icono: 'maletin' },
  finalizado: { texto: 'Finalizado', tono: 'exito', icono: 'checkCirculo' },
  cancelado: { texto: 'Cancelado', tono: 'neutro', icono: 'cerrar' },
};

export const PAGO: Record<EstadoPago, Etiqueta & { detalle: string }> = {
  pendiente: { texto: 'Pendiente', tono: 'aviso', icono: 'reloj', detalle: 'Todavía no hay un cobro confirmado.' },
  reportado: { texto: 'Reportado, sin verificar', tono: 'azul', icono: 'info', detalle: 'Vos informaste el cobro. Todavía no está verificado.' },
  verificado: { texto: 'Verificado', tono: 'exito', icono: 'verificado', detalle: 'Confirmado por el proveedor de pagos o por Operations.' },
  fallido: { texto: 'Falló', tono: 'error', icono: 'alerta', detalle: 'El proveedor informó un problema con este pago.' },
  en_discrepancia: { texto: 'En discrepancia', tono: 'aviso', icono: 'alerta', detalle: 'El importe o el cobro no coinciden. Operations lo revisa.' },
};

export const SOPORTE: Record<EstadoSoporte, Etiqueta> = {
  abierto: { texto: 'Abierto', tono: 'azul', icono: 'info' },
  en_curso: { texto: 'En curso', tono: 'azul', icono: 'lupa' },
  esperando_respuesta: { texto: 'Esperando tu respuesta', tono: 'aviso', icono: 'chat' },
  resuelto: { texto: 'Resuelto', tono: 'exito', icono: 'checkCirculo' },
  cerrado: { texto: 'Cerrado', tono: 'neutro', icono: 'check' },
};

export const TIPO_PEDIDO = { urgente: 'Urgente · Ahora', programado: 'Programado', obra: 'Obra' } as const;
export const METODO_PAGO = { mercado_pago: 'Mercado Pago (directo a tu cuenta)', efectivo: 'Efectivo' } as const;
export const GENERO = { mujer: 'Mujer', varon: 'Varón', otro: 'Otro', prefiero_no_decir: 'Prefiero no decirlo' } as const;
export const CATEGORIA_SOPORTE = { asistencia: 'Asistencia', reclamo: 'Reclamo', pago: 'Un pago', cuenta: 'Mi cuenta' } as const;
export const FALTANTE = {
  datos: 'Datos personales',
  dni: 'DNI',
  cuitCuil: 'CUIT o CUIL',
  fotoCara: 'Foto de cara',
  rubros: 'Rubros',
  matricula: 'Matrícula o certificación',
} as const;
export const ZONAS = ['Centro', 'La Perla', 'Playa Grande', 'Güemes', 'Punta Mogotes', 'Constitución'] as const;
export const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const;

/** Versiones de textos legales aceptadas en el registro. PENDIENTE: texto definitivo de Legal (hoy provisorio). */
export const TERMINOS_VERSION = 'esp-terminos-2026-10-29-prov';
export const PRIVACIDAD_VERSION = 'esp-privacidad-2026-10-29-prov';
