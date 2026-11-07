// Catálogo del Taller (docs/herramientas.md): qué herramientas hay por oficio y en qué fase se construyen.
// Una herramienta `lista` tiene pantalla; las demás se muestran como «En preparación» sin prometer fecha.
import type { NombreIcono } from '../components/Icono.tsx';
import type { Rubro } from '../contracts/rubros.ts';

export interface Herramienta {
  id: string;
  rubro: Rubro | 'todos';
  titulo: string;
  bajada: string;
  icono: NombreIcono;
  fase: string;
  lista: boolean;
  /** Funciona sin conexión (no guarda nada). */
  sinConexion?: boolean;
}

export const HERRAMIENTAS: readonly Herramienta[] = [
  // H1 · Electricidad
  { id: 'conductores', rubro: 'electricidad', titulo: 'Sección y caída de tensión', bajada: 'Cable, protección y caída en un solo cálculo', icono: 'rayo', fase: 'H1', lista: true, sinConexion: true },
  { id: 'vivienda', rubro: 'electricidad', titulo: 'Planificador de vivienda', bajada: 'Grado de electrificación, circuitos y bocas', icono: 'casa', fase: 'H1', lista: true, sinConexion: true },
  { id: 'tablero', rubro: 'electricidad', titulo: 'Armador de tablero 3D', bajada: 'Encastrá las protecciones y sacá la lista', icono: 'caja', fase: 'H1', lista: true, sinConexion: true },
  { id: 'iluminacion', rubro: 'electricidad', titulo: 'Iluminación', bajada: 'Lúmenes y cantidad de luminarias', icono: 'info', fase: 'H1', lista: true, sinConexion: true },
  { id: 'consumo', rubro: 'electricidad', titulo: 'Consumo y ahorro', bajada: 'Cuánto gasta y cuánto ahorra tu cliente', icono: 'billetera', fase: 'H1', lista: true, sinConexion: true },
  { id: 'ohm', rubro: 'electricidad', titulo: 'Ohm y referencias', bajada: 'Ley de Ohm, colores y seguridad', icono: 'escudo', fase: 'H1', lista: true, sinConexion: true },
  { id: 'etiquetas-ia', rubro: 'electricidad', titulo: 'Etiquetado de tablero con IA', bajada: 'Una foto y te propone las etiquetas', icono: 'camara', fase: 'H1', lista: false },
  // Comunes (H0)
  { id: 'nivel', rubro: 'todos', titulo: 'Nivel y pendiente', bajada: 'Con el giroscopio del celular', icono: 'reintentar', fase: 'H0', lista: true, sinConexion: true },
  { id: 'presupuesto', rubro: 'todos', titulo: 'Presupuestador', bajada: 'Mano de obra, materiales y tu margen', icono: 'etiqueta', fase: 'H0', lista: false },
  { id: 'precios', rubro: 'todos', titulo: 'Mi lista de precios', bajada: 'Cargala o sacale una foto a la del corralón', icono: 'billetera', fase: 'H0', lista: false },
  { id: 'ingresos', rubro: 'todos', titulo: 'Ingresos y gastos', bajada: 'Tu ganancia real por trabajo y por mes', icono: 'caja', fase: 'H0', lista: false },
  // H2–H6
  { id: 'frigorias', rubro: 'aire_acondicionado', titulo: 'Frigorías', bajada: 'Con la orientación del ambiente', icono: 'aire', fase: 'H2', lista: false },
  { id: 'pendiente-desague', rubro: 'plomeria', titulo: 'Pendiente de desagües', bajada: 'Apoyá el celular sobre el caño', icono: 'canilla', fase: 'H3', lista: false },
  { id: 'canerias-gas', rubro: 'gas', titulo: 'Cañerías y ventilación', bajada: 'Diámetros por tramo y rejillas', icono: 'llama', fase: 'H4', lista: false },
  { id: 'materiales-obra', rubro: 'albanileria', titulo: 'Cómputo de materiales', bajada: 'Ladrillos, cemento, arena y hierro', icono: 'ladrillos', fase: 'H5', lista: false },
  { id: 'cerraduras', rubro: 'cerrajeria', titulo: 'Identificar una cerradura', bajada: 'Con una foto', icono: 'llave', fase: 'H6', lista: false },
];

export const herramienta = (id: string): Herramienta | undefined => HERRAMIENTAS.find((h) => h.id === id);

/** Las del rubro primero (en el orden del catálogo), después las comunes y al final las de otros oficios. */
export function ordenarParaRubros(rubros: readonly Rubro[]): { tuyas: Herramienta[]; comunes: Herramienta[]; otras: Herramienta[] } {
  const tuyas = HERRAMIENTAS.filter((h) => h.rubro !== 'todos' && rubros.includes(h.rubro));
  const comunes = HERRAMIENTAS.filter((h) => h.rubro === 'todos');
  const otras = HERRAMIENTAS.filter((h) => h.rubro !== 'todos' && !rubros.includes(h.rubro));
  return { tuyas, comunes, otras };
}
