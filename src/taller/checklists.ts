// Checklists de trabajo de Electricidad (fase H1.5). Siempre empiezan por la seguridad. Los usa la pantalla del Taller
// y, desde H0.4, el Modo trabajo. Inspirados en los procedimientos de corte, bloqueo y verificación que se usan en obra.

export interface SeccionChecklist {
  titulo: string;
  pasos: string[];
}
export interface Checklist {
  id: string;
  titulo: string;
  secciones: SeccionChecklist[];
}

const SEGURIDAD: SeccionChecklist = {
  titulo: 'Seguridad',
  pasos: [
    'Avisá al cliente que vas a cortar la luz.',
    'Cortá el circuito (o la llave general) y bloquealo con un cartel.',
    'Verificá la ausencia de tensión con un instrumento que sepas que funciona.',
  ],
};

export const CHECKLISTS_ELECTRICIDAD: readonly Checklist[] = [
  {
    id: 'cambio-tablero',
    titulo: 'Cambio de tablero',
    secciones: [
      SEGURIDAD,
      { titulo: 'Antes de desmontar', pasos: ['Sacale una foto al tablero viejo.', 'Rotulá cada cable con el circuito que alimenta.'] },
      {
        titulo: 'Montaje',
        pasos: ['Fijá el gabinete y el riel DIN.', 'Conectá la general, el diferencial y los circuitos.', 'Llevá el conductor de protección a las borneras.', 'Ajustá todos los bornes.'],
      },
      { titulo: 'Cierre', pasos: ['Probá el diferencial con su botón de prueba.', 'Medí la tensión.', 'Etiquetá cada protección.', 'Hacé el informe para el cliente.'] },
    ],
  },
  {
    id: 'nuevo-circuito',
    titulo: 'Circuito nuevo',
    secciones: [
      SEGURIDAD,
      { titulo: 'Cálculo', pasos: ['Calculá la sección y la protección en el Taller.', 'Verificá que entre en el tablero (módulos libres).'] },
      { titulo: 'Instalación', pasos: ['Pasá el caño y las cajas.', 'Cableá fase, neutro y tierra con los colores que corresponden.', 'Conectá la protección nueva.'] },
      { titulo: 'Cierre', pasos: ['Probá cada boca.', 'Etiquetá la protección nueva.'] },
    ],
  },
  {
    id: 'toma-llave',
    titulo: 'Cambio de toma o llave',
    secciones: [
      SEGURIDAD,
      { titulo: 'Cambio', pasos: ['Revisá el estado de los cables (sin recalentamiento).', 'Conectá respetando fase, neutro y tierra.', 'Fijá bien el módulo y la tapa.'] },
      { titulo: 'Cierre', pasos: ['Probá con un artefacto o un probador de tomas.'] },
    ],
  },
  {
    id: 'luminaria',
    titulo: 'Instalación de luminaria',
    secciones: [
      SEGURIDAD,
      { titulo: 'Instalación', pasos: ['Verificá que el soporte aguante el peso.', 'Conectá la tierra si la luminaria la tiene.', 'Usá borneras o empalmes aislados.'] },
      { titulo: 'Cierre', pasos: ['Probá el encendido desde la llave.'] },
    ],
  },
  {
    id: 'falla',
    titulo: 'Búsqueda de falla',
    secciones: [
      { titulo: 'Seguridad', pasos: ['Preguntá qué pasó y desde cuándo.', 'Trabajá sin tensión siempre que se pueda; si tenés que medir con tensión, usá protección y herramientas aisladas.'] },
      { titulo: 'Diagnóstico', pasos: ['Identificá qué protección salta.', 'Desconectá los artefactos del circuito y probá de nuevo.', 'Medí la aislación del circuito.'] },
      { titulo: 'Cierre', pasos: ['Explicale al cliente la causa y la solución.', 'Hacé el informe con las mediciones.'] },
    ],
  },
];

export const totalPasos = (c: Checklist) => c.secciones.reduce((s, x) => s + x.pasos.length, 0);
export const clavePaso = (seccion: number, paso: number) => `${seccion}.${paso}`;
