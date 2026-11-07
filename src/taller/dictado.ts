// Presupuesto dictado (fase H1.3): de lo que el electricista cuenta a tareas y materiales para editar. Lógica pura.
// Son reglas simples, en el teléfono: las usa el mock y sirven de punto de partida mientras no haya IA autorizada.
// Sin precios: los pone el profesional con su lista (H0.2). Las cantidades son una estimación para revisar.
import type { PresupuestoSugerido } from '../contracts/dto.ts';

const PALABRAS: Record<string, number> = { un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, doce: 12, quince: 15, veinte: 20 };

/** Cantidad dicha justo antes de una palabra clave: «4 tomas», «cuatro tomas». 1 si no se dijo. */
export function cantidadAntes(texto: string, clave: RegExp): number | null {
  const t = ` ${texto.toLowerCase()} `;
  const m = new RegExp(`(\\d+|${Object.keys(PALABRAS).join('|')})\\s+(?:\\w+\\s+){0,2}?${clave.source}`).exec(t);
  if (m?.[1]) return /^\d+$/.test(m[1]) ? Number(m[1]) : (PALABRAS[m[1]] ?? 1);
  return clave.test(t) ? 1 : null;
}

type Tarea = PresupuestoSugerido['tareas'][number];
type Material = PresupuestoSugerido['materiales'][number];

export function presupuestoElectrico(texto: string): PresupuestoSugerido {
  const tareas: Tarea[] = [];
  const materiales: Material[] = [];
  const avisos: string[] = [];
  const sumar = (descripcion: string, cantidad: number, unidad: Material['unidad']) => {
    const ya = materiales.find((m) => m.descripcion === descripcion && m.unidad === unidad);
    if (ya) ya.cantidad = Math.round((ya.cantidad + cantidad) * 10) / 10;
    else materiales.push({ descripcion, cantidad, unidad });
  };

  const tablero = cantidadAntes(texto, /tableros?/);
  const circuitos = cantidadAntes(texto, /circuitos?/);
  if (tablero) {
    const n = Math.max(2, circuitos ?? 4);
    tareas.push({ descripcion: `Cambio de tablero con ${n} circuitos`, horas: 2 + n * 0.5 });
    sumar(`Gabinete modular de ${n + 4 <= 12 ? 12 : 18} módulos con riel DIN`, 1, 'unidad');
    sumar('Interruptor termomagnético 2 polos 40 A (general)', 1, 'unidad');
    sumar('Interruptor termomagnético 1 polo', n, 'unidad');
    sumar('Borneras de neutro y tierra', 1, 'unidad');
  }
  const diferencial = cantidadAntes(texto, /(disyuntor|diferencial)(es)?/);
  if (diferencial || tablero) sumar('Disyuntor diferencial 2 polos 40 A 30 mA', diferencial ?? 1, 'unidad');

  const tomas = cantidadAntes(texto, /tomas?(corrientes?)?\b/);
  if (tomas) {
    tareas.push({ descripcion: `Agregar ${tomas} ${tomas === 1 ? 'toma' : 'tomas'}`, horas: tomas * 0.75 });
    sumar('Módulo de toma 10 A con tierra', tomas, 'unidad');
    sumar('Caja rectangular 5 × 10', tomas, 'unidad');
    sumar('Cable unipolar 2,5 mm²', tomas * 9, 'metro');
    sumar('Caño corrugado 3/4"', tomas * 3, 'metro');
  }
  const luces = cantidadAntes(texto, /(luminarias?|luces|lámparas?|plafones?|paneles?)/);
  if (luces) {
    tareas.push({ descripcion: `Instalar ${luces} ${luces === 1 ? 'luminaria' : 'luminarias'}`, horas: luces * 0.5 });
    sumar('Luminaria (la elige el cliente)', luces, 'unidad');
    sumar('Cable unipolar 1,5 mm²', luces * 6, 'metro');
  }
  const llaves = cantidadAntes(texto, /llaves?( de luz)?\b/);
  if (llaves && !/llave (de )?paso/.test(texto.toLowerCase())) {
    tareas.push({ descripcion: `Colocar ${llaves} ${llaves === 1 ? 'llave de luz' : 'llaves de luz'}`, horas: llaves * 0.4 });
    sumar('Módulo de punto (llave)', llaves, 'unidad');
    sumar('Caja rectangular 5 × 10', llaves, 'unidad');
  }
  if (/puesta a tierra|jabalina/.test(texto.toLowerCase())) {
    tareas.push({ descripcion: 'Puesta a tierra con jabalina y medición', horas: 2 });
    sumar('Jabalina de acero cobreado 1,5 m', 1, 'unidad');
    sumar('Cable verde y amarillo 4 mm²', 10, 'metro');
  }
  if (!tareas.length) {
    tareas.push({ descripcion: 'Visita, diagnóstico y presupuesto', horas: 1 });
    avisos.push('No reconocimos trabajos concretos: contá qué hay que hacer (por ejemplo, «agregar 3 tomas en la cocina»).');
  }
  avisos.push('Las cantidades son una estimación: revisalas antes de presupuestar.');
  return { tareas, materiales, avisos };
}
