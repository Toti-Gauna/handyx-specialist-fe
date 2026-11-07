// Armador de tablero (fase H1). Lógica pura: dispositivos sobre riel DIN, módulos, gabinete, materiales y etiquetas.
// La vista 3D (Three.js) solo dibuja lo que devuelve este módulo.
import { DISPOSITIVOS_TABLERO } from '../contracts/dto.ts';

/** Los tipos son los del contrato (0.10.0): la IA del Taller devuelve los mismos. */
export const TIPOS_DISPOSITIVO = DISPOSITIVOS_TABLERO;
export type TipoDispositivo = (typeof TIPOS_DISPOSITIVO)[number];

export const DISPOSITIVO: Record<TipoDispositivo, { texto: string; corto: string; modulos: number; calibres: readonly number[]; color: string }> = {
  termica_1p: { texto: 'Interruptor termomagnético 1 polo', corto: 'Térmica 1P', modulos: 1, calibres: [6, 10, 16, 20, 25, 32], color: '#f2f2ee' },
  termica_2p: { texto: 'Interruptor termomagnético 2 polos', corto: 'Térmica 2P', modulos: 2, calibres: [10, 16, 20, 25, 32, 40, 50, 63], color: '#f2f2ee' },
  termica_4p: { texto: 'Interruptor termomagnético 4 polos', corto: 'Térmica 4P', modulos: 4, calibres: [16, 20, 25, 32, 40, 50, 63], color: '#f2f2ee' },
  diferencial_2p: { texto: 'Disyuntor diferencial 2 polos 30 mA', corto: 'Diferencial 2P', modulos: 2, calibres: [25, 40, 63], color: '#e8eef8' },
  diferencial_4p: { texto: 'Disyuntor diferencial 4 polos 30 mA', corto: 'Diferencial 4P', modulos: 4, calibres: [25, 40, 63], color: '#e8eef8' },
  sobretension: { texto: 'Protector de sobretensiones', corto: 'Sobretensión', modulos: 2, calibres: [], color: '#f6f0d8' },
  contactor: { texto: 'Contactor modular', corto: 'Contactor', modulos: 2, calibres: [25, 40], color: '#eef2ee' },
  borneras: { texto: 'Borneras de neutro y tierra', corto: 'Borneras', modulos: 2, calibres: [], color: '#d9dde4' },
};

/** Gabinetes estándar por cantidad de módulos (12 por fila desde 24). */
export const GABINETES = [2, 4, 6, 8, 12, 18, 24, 36, 48] as const;

export interface Dispositivo {
  id: string;
  tipo: TipoDispositivo;
  calibre: number | null;
  /** Lo que protege, para la etiqueta: «Iluminación living», «Tomas cocina». */
  circuito: string;
}

export interface ArmadoTablero {
  modulosUsados: number;
  /** Lugar libre que se deja para ampliar (20 % o al menos 2 módulos). */
  reserva: number;
  gabinete: number | null;
  filas: number;
  porFila: number;
  /** Posición de cada dispositivo: fila y módulo de inicio (0). */
  posiciones: { id: string; fila: number; inicio: number; modulos: number }[];
  avisos: string[];
}

export const reservaPara = (usados: number) => Math.max(2, Math.ceil(usados * 0.2));

export function armarTablero(dispositivos: readonly Dispositivo[]): ArmadoTablero {
  const usados = dispositivos.reduce((s, d) => s + DISPOSITIVO[d.tipo].modulos, 0);
  const reserva = reservaPara(usados);
  const gabinete = GABINETES.find((g) => g >= usados + reserva) ?? null;
  const porFila = gabinete === null ? 12 : gabinete <= 18 ? gabinete : 12;
  const filas = gabinete === null ? Math.ceil(usados / 12) : Math.ceil(gabinete / porFila);
  const posiciones: ArmadoTablero['posiciones'] = [];
  let fila = 0;
  let inicio = 0;
  for (const d of dispositivos) {
    const m = DISPOSITIVO[d.tipo].modulos;
    if (inicio + m > porFila) {
      fila += 1;
      inicio = 0;
    }
    posiciones.push({ id: d.id, fila, inicio, modulos: m });
    inicio += m;
  }
  const avisos: string[] = [];
  if (gabinete === null) avisos.push('Supera los gabinetes modulares de 48 módulos: hace falta un tablero a medida.');
  if (!dispositivos.some((d) => d.tipo === 'diferencial_2p' || d.tipo === 'diferencial_4p')) {
    avisos.push('Falta un disyuntor diferencial de 30 mA: es obligatorio para proteger a las personas.');
  }
  const termicasSinCircuito = dispositivos.filter((d) => d.tipo.startsWith('termica') && !d.circuito.trim()).length;
  if (termicasSinCircuito) avisos.push(`${termicasSinCircuito} protección${termicasSinCircuito === 1 ? '' : 'es'} sin el circuito que protege: completalo para las etiquetas.`);
  return { modulosUsados: usados, reserva, gabinete, filas, porFila, posiciones, avisos };
}

export interface ItemMaterial {
  descripcion: string;
  cantidad: number;
}

/** Lista de materiales agrupada por tipo y calibre, más el gabinete y los accesorios. */
export function materialesTablero(dispositivos: readonly Dispositivo[]): ItemMaterial[] {
  const grupos = new Map<string, number>();
  for (const d of dispositivos) {
    const clave = `${DISPOSITIVO[d.tipo].texto}${d.calibre ? ` ${d.calibre} A` : ''}`;
    grupos.set(clave, (grupos.get(clave) ?? 0) + 1);
  }
  const items: ItemMaterial[] = [...grupos.entries()].map(([descripcion, cantidad]) => ({ descripcion, cantidad }));
  const a = armarTablero(dispositivos);
  if (a.gabinete) items.push({ descripcion: `Gabinete modular de ${a.gabinete} módulos con riel DIN`, cantidad: 1 });
  if (a.reserva > 0) items.push({ descripcion: 'Tapas ciegas de 1 módulo (reserva)', cantidad: a.reserva });
  return items;
}

/** Texto de cada etiqueta del tablero, en el orden en que están montados. */
export function etiquetas(dispositivos: readonly Dispositivo[]): string[] {
  return dispositivos.map((d) => {
    const nombre = d.circuito.trim() || DISPOSITIVO[d.tipo].corto;
    return d.calibre ? `${nombre} · ${d.calibre} A` : nombre;
  });
}

/** Un tablero de vivienda típico para empezar (el profesional lo cambia a gusto). */
export function tableroInicial(): Dispositivo[] {
  return [
    { id: 'd1', tipo: 'termica_2p', calibre: 40, circuito: 'General' },
    { id: 'd2', tipo: 'diferencial_2p', calibre: 40, circuito: 'Diferencial 30 mA' },
    { id: 'd3', tipo: 'termica_1p', calibre: 10, circuito: 'Iluminación' },
    { id: 'd4', tipo: 'termica_1p', calibre: 16, circuito: 'Tomas' },
    { id: 'd5', tipo: 'termica_1p', calibre: 20, circuito: 'Aire acondicionado' },
  ];
}
