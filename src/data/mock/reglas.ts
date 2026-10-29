// Emulación en el mock de las reglas que en producción aplica el SERVIDOR. Se prueban acá para que el mock
// no muestre nada que el backend real nunca ofrecería (elegibilidad, faltantes del alta, estado derivado).
import type { FaltanteEnvio, PedidoElegible } from '../../contracts/dto.ts';
import { requiereMatricula } from '../../contracts/rubros.ts';
import { ahoraMs, type EstadoMock, type PedidoInterno } from './estado.ts';

const FALTA = new Set(['faltante', 'rechazado', 'vencido']);

export function calcularFaltantes(s: EstadoMock): FaltanteEnvio[] {
  const d = s.alta.datos;
  const f: FaltanteEnvio[] = [];
  if ([d.nombre, d.apellido, d.fechaNacimiento, d.nacionalidad, d.genero, d.ciudad].some((v) => v === null || v === '')) f.push('datos');
  if (s.alta.dni === null || FALTA.has(s.perfil.documentos.dni)) f.push('dni');
  if (s.alta.cuitCuil === null || FALTA.has(s.perfil.documentos.cuitCuil)) f.push('cuitCuil');
  if (FALTA.has(s.perfil.documentos.fotoCara)) f.push('fotoCara');
  if (s.perfil.rubros.length === 0) f.push('rubros');
  if (s.perfil.rubros.some((r) => requiereMatricula(r.rubro) && (r.matricula === null || FALTA.has(r.matricula)))) f.push('matricula');
  return f;
}

export function recalcular(s: EstadoMock): void {
  s.perfil.faltantesEnvio = calcularFaltantes(s);
  s.perfil.nombre = s.alta.datos.nombre;
  s.perfil.apellido = s.alta.datos.apellido;
  s.perfil.version += 1;
}

export const altaEditable = (s: EstadoMock): boolean => s.perfil.estadoAlta === 'borrador' || s.perfil.estadoAlta === 'requiere_correccion';
export const habilitada = (s: EstadoMock): boolean => s.perfil.estadoAlta === 'habilitada' && s.perfil.baja === null;

export const tengoPropuesta = (s: EstadoMock, pedidoId: string): boolean =>
  s.propuestas.some((p) => p.pedidoId === pedidoId && p.autorRol === 'especialista');

/** Estado que vería el especialista: una búsqueda urgente vencida pasa a `sin_propuestas` (lo decide el servidor). */
export function estadoDerivado(s: EstadoMock, p: PedidoInterno): PedidoElegible['estado'] {
  const v = p.pub.ventanaHasta;
  if (p.pub.estado === 'buscando' && v && Date.parse(v) <= ahoraMs(s)) return 'sin_propuestas';
  return p.pub.estado;
}

/** Elegibilidad: alta habilitada, rubro habilitado, zona cubierta y opt-in según el tipo de pedido. */
export function esElegible(s: EstadoMock, p: PedidoInterno): boolean {
  if (!habilitada(s)) return false;
  const rubroOk = s.perfil.rubros.some((r) => r.rubro === p.pub.rubro && r.estado === 'habilitado');
  if (!rubroOk) return false;
  if (!s.disponibilidad.zonas.includes(p.pub.zonaAproximada)) return false;
  return p.pub.tipo === 'urgente' ? s.disponibilidad.urgentesAhora : s.disponibilidad.programados;
}

export function aPedidoElegible(s: EstadoMock, p: PedidoInterno): PedidoElegible {
  const mia = s.propuestas.filter((x) => x.pedidoId === p.pub.id && x.autorRol === 'especialista').at(-1);
  return { ...p.pub, estado: estadoDerivado(s, p), miPropuesta: mia ? { id: mia.id, estado: mia.estado } : null };
}

/** Un pedido se muestra si es elegible y sigue abierto, o si ya tengo una propuesta en él (hilo en curso). */
export function visible(s: EstadoMock, p: PedidoInterno): boolean {
  if (!habilitada(s)) return false;
  if (p.pub.estado === 'cancelado') return false;
  if (tengoPropuesta(s, p.pub.id)) return true;
  if (p.pub.estado === 'acordado') return false;
  return esElegible(s, p);
}

export function nombrePublico(s: EstadoMock): string | null {
  const { nombre, apellido } = s.alta.datos;
  return nombre && apellido ? `${nombre} ${apellido.charAt(0)}.` : null;
}
