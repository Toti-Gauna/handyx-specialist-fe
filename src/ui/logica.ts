// Lógica pura del kit v3 (sin React ni DOM): se prueba en logica.test.ts. Reusa la del kit v2 donde ya existe.
import type { Punto } from '../contracts/dto.ts';
import { distanciaM, rumbo } from '../lib/geo.ts';
import { pesosDesdeCentavos } from '../lib/formato.ts';

export { iniciales, tonoAvatar, TONOS_AVATAR, tiraDias, grillaMes, moverMes, claveFecha, alturaAlSoltar, siguienteAltura, ALTURAS_HOJA } from '../kit/logica.ts';
export type { AlturaHoja, DiaGrilla, DiaTira } from '../kit/logica.ts';

// ── Cifras ─────────────────────────────────────────────────────────────

/** Espacios no separables: "$ 45.000" o "12 km" nunca se parten en dos renglones. */
export const sinCortes = (t: string): string => t.replace(/ /g, ' ');

/** Texto de una `Cifra`: centavos enteros en pesos o un texto ya armado; nunca vacío. */
export function textoCifra(centavos?: number, texto?: string): string {
  if (typeof centavos === 'number' && Number.isFinite(centavos)) return sinCortes(pesosDesdeCentavos(Math.round(centavos)));
  return sinCortes(texto ?? '');
}

// ── Progreso ───────────────────────────────────────────────────────────

/** Porcentaje entero entre 0 y 100 (un total 0 es 0 %, nunca NaN). */
export function porcentaje(hechas: number, total: number): number {
  if (!(total > 0)) return 0;
  return Math.max(0, Math.min(100, Math.round((100 * hechas) / total)));
}

/** "Paso 2 de 5": el texto de los pasos cortos. */
export const textoPaso = (paso: number, total: number): string => `Paso ${Math.max(1, Math.min(paso, total))} de ${total}`;

// ── Acciones fijas ─────────────────────────────────────────────────────

/** Más de este largo, dos botones no entran lado a lado con texto al 100 % en 320 px. */
export const LARGO_MAXIMO_EN_FILA = 14;

/** Dos acciones van en fila solo si son cortas; si no, en columna (la principal arriba). */
export function disposicionAcciones(textos: readonly string[]): 'fila' | 'columna' {
  if (textos.length <= 1) return 'columna';
  if (textos.length > 2) return 'columna';
  return textos.every((t) => t.trim().length <= LARGO_MAXIMO_EN_FILA) ? 'fila' : 'columna';
}

// ── Stepper y teclado de precio ────────────────────────────────────────

export function pasoStepper(valor: number, delta: number, min: number, max: number): number {
  const v = Math.round(valor + delta);
  return Math.max(min, Math.min(max, v));
}

/** Máximo de dígitos en pesos del teclado de precio ($ 99.999.999). */
export const DIGITOS_PRECIO = 8;

export type TeclaPrecio = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '000' | 'borrar';
export const TECLAS_PRECIO: readonly TeclaPrecio[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'borrar'];

/** Aplica una tecla al precio en pesos enteros (el teclado no maneja centavos: se cotiza en pesos). */
export function aplicarTecla(pesos: number, tecla: TeclaPrecio): number {
  const actual = pesos > 0 ? String(Math.trunc(pesos)) : '';
  let nuevo: string;
  if (tecla === 'borrar') nuevo = actual.slice(0, -1);
  else nuevo = (actual + tecla).replace(/^0+/, '');
  if (nuevo.length > DIGITOS_PRECIO) return pesos;
  return nuevo === '' ? 0 : Number(nuevo);
}

// ── Rueda de hora ──────────────────────────────────────────────────────

/** Opciones de la rueda en minutos desde las 00:00, cada `paso` minutos, entre `desde` y `hasta` (incluidos). */
export function opcionesHora(desde = 7 * 60, hasta = 21 * 60, paso = 30): number[] {
  const r: number[] = [];
  for (let m = desde; m <= hasta; m += paso) r.push(m);
  return r;
}

export const textoHora = (minutos: number): string => `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;

/** Índice de la opción más cercana (para dejar la rueda quieta en una opción válida). */
export function indiceCercano(opciones: readonly number[], valor: number): number {
  let mejor = 0;
  for (let i = 1; i < opciones.length; i++) if (Math.abs((opciones[i] ?? 0) - valor) < Math.abs((opciones[mejor] ?? 0) - valor)) mejor = i;
  return mejor;
}

// ── Código ─────────────────────────────────────────────────────────────

export const normalizarCodigo = (t: string, largo = 6): string => t.replace(/\D/g, '').slice(0, largo);

// ── Chat ───────────────────────────────────────────────────────────────

export interface MensajeChat {
  id: string;
  autor: 'yo' | 'otro';
  nombre: string;
  texto: string;
  hora: string;
  editado?: boolean;
  reacciones?: readonly string[];
}

/** Mensajes seguidos del mismo autor van "pegados": solo el último lleva avatar y solo el primero el nombre. */
export function agruparMensajes<T extends Pick<MensajeChat, 'autor' | 'nombre'>>(lista: readonly T[]): Array<T & { primero: boolean; ultimo: boolean }> {
  return lista.map((m, i) => {
    const antes = lista[i - 1];
    const despues = lista[i + 1];
    const mismo = (o: T | undefined) => !!o && o.autor === m.autor && o.nombre === m.nombre;
    return { ...m, primero: !mismo(antes), ultimo: !mismo(despues) };
  });
}

// ── Escritorio ─────────────────────────────────────────────────────────

/** Desde este ancho y con un puntero fino (mouse) se muestra la pantalla de escritorio: la app es solo para el celular. */
export const ANCHO_ESCRITORIO = 900;

export const esEscritorio = (ancho: number, punteroFino: boolean): boolean => ancho >= ANCHO_ESCRITORIO && punteroFino;

export const CONSULTA_ESCRITORIO = `(min-width: ${ANCHO_ESCRITORIO}px) and (pointer: fine)`;

// ── Mapa de arreglos ───────────────────────────────────────────────────

/** Zonas de Mar del Plata y alrededores para "Me voy hasta…": centros aproximados (nunca direcciones). */
export const DESTINOS: readonly { id: string; nombre: string; centro: Punto }[] = [
  { id: 'centro', nombre: 'Centro', centro: { lat: -38.0005, lng: -57.5516 } },
  { id: 'la-perla', nombre: 'La Perla', centro: { lat: -37.9915, lng: -57.5536 } },
  { id: 'puerto', nombre: 'Puerto', centro: { lat: -38.0465, lng: -57.5413 } },
  { id: 'los-troncos', nombre: 'Los Troncos', centro: { lat: -38.0228, lng: -57.5555 } },
  { id: 'punta-mogotes', nombre: 'Punta Mogotes', centro: { lat: -38.0738, lng: -57.5477 } },
  { id: 'constitucion', nombre: 'Constitución', centro: { lat: -37.9689, lng: -57.5653 } },
  { id: 'camet', nombre: 'Camet', centro: { lat: -37.9265, lng: -57.5405 } },
  { id: 'bosque-peralta-ramos', nombre: 'Bosque Peralta Ramos', centro: { lat: -38.0816, lng: -57.5826 } },
  { id: 'sierra-de-los-padres', nombre: 'Sierra de los Padres', centro: { lat: -37.9473, lng: -57.7779 } },
  { id: 'batan', nombre: 'Batán', centro: { lat: -38.0047, lng: -57.7097 } },
  { id: 'chapadmalal', nombre: 'Chapadmalal', centro: { lat: -38.1736, lng: -57.6559 } },
];

/** Busca destinos por nombre sin importar mayúsculas ni tildes ("batan" encuentra Batán). */
export function buscarDestinos(texto: string, lista = DESTINOS) {
  const n = plano(texto);
  if (!n) return [...lista];
  return lista.filter((d) => plano(d.nombre).includes(n));
}

const plano = (t: string): string =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

export interface PedidoEnMapa {
  id: string;
  zona: Punto;
}

/**
 * Pedidos "camino a" un destino: los que quedan cerca del destino o en su dirección desde donde estás (dentro de un
 * cono de ±`toleranciaGrados` y no más lejos que el destino más un margen). Ordenados por distancia desde vos.
 */
export function pedidosHacia<T extends PedidoEnMapa>(desde: Punto, destino: Punto, pedidos: readonly T[], toleranciaGrados = 40, cercaDestinoM = 2500): T[] {
  const haciaDestino = rumbo(desde, destino);
  const largo = distanciaM(desde, destino);
  return pedidos
    .filter((p) => {
      if (distanciaM(p.zona, destino) <= cercaDestinoM) return true;
      const d = distanciaM(desde, p.zona);
      if (d > largo + cercaDestinoM) return false;
      const dif = Math.abs(((rumbo(desde, p.zona) - haciaDestino + 540) % 360) - 180);
      return dif <= toleranciaGrados;
    })
    .sort((a, b) => distanciaM(desde, a.zona) - distanciaM(desde, b.zona));
}

/** Distancia legible y sin corte: "800 m" o "3,4 km". */
export function textoDistancia(metros: number): string {
  if (metros < 1000) return sinCortes(`${Math.max(100, Math.round(metros / 100) * 100)} m`);
  return sinCortes(`${(Math.round(metros / 100) / 10).toLocaleString('es-AR')} km`);
}

export interface Caja {
  norte: number;
  sur: number;
  oeste: number;
  este: number;
}

/** Caja que abarca la ciudad y Batán, para el mapa estilizado (cuando no hay motor de mapa). */
export const CAJA_MDP: Caja = { norte: -37.91, sur: -38.19, oeste: -57.8, este: -57.52 };

/** Posición de un punto dentro de la caja, en % (0–100, recortado a los bordes). */
export function enCaja(p: Punto, c: Caja = CAJA_MDP): { x: number; y: number } {
  const x = ((p.lng - c.oeste) / (c.este - c.oeste)) * 100;
  const y = ((c.norte - p.lat) / (c.norte - c.sur)) * 100;
  const recorte = (v: number) => Math.max(0, Math.min(100, v));
  return { x: recorte(x), y: recorte(y) };
}
