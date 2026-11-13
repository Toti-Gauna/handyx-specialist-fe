// Informe eléctrico (fase H1.4). Lógica pura: evalúa las mediciones que carga el profesional con SUS instrumentos y el
// estado del tablero, y propone recomendaciones. Valores de referencia EN REVISIÓN TÉCNICA (ver REVISION en
// electricidad.ts): no es un certificado ni reemplaza la documentación oficial.

export type Semaforo = 'bien' | 'atencion' | 'mal';
export const MEDICIONES = ['puestaTierra', 'disparoDiferencial', 'aislacion', 'tension'] as const;
export type Medicion = (typeof MEDICIONES)[number];

export const MEDICION: Record<Medicion, { texto: string; unidad: string; referencia: string; instrumento: string; evaluar(v: number): Semaforo }> = {
  puestaTierra: {
    texto: 'Resistencia de puesta a tierra',
    unidad: 'Ω',
    referencia: 'Hasta 40 Ω con disyuntor diferencial; se recomienda 10 Ω o menos.',
    instrumento: 'Telurímetro',
    evaluar: (v) => (v <= 10 ? 'bien' : v <= 40 ? 'atencion' : 'mal'),
  },
  disparoDiferencial: {
    texto: 'Disparo del diferencial a su corriente nominal',
    unidad: 'ms',
    referencia: 'Hasta 300 ms.',
    instrumento: 'Probador de diferenciales',
    evaluar: (v) => (v <= 300 ? 'bien' : 'mal'),
  },
  aislacion: {
    texto: 'Resistencia de aislación (a 500 V)',
    unidad: 'MΩ',
    referencia: '1 MΩ o más.',
    instrumento: 'Megóhmetro',
    evaluar: (v) => (v >= 1 ? 'bien' : v >= 0.5 ? 'atencion' : 'mal'),
  },
  tension: {
    texto: 'Tensión entre fase y neutro',
    unidad: 'V',
    referencia: '220 V ± 10 % (198 a 242 V).',
    instrumento: 'Multímetro',
    evaluar: (v) => (v >= 209 && v <= 231 ? 'bien' : v >= 198 && v <= 242 ? 'atencion' : 'mal'),
  },
};

export const PUNTOS_TABLERO = ['diferencial', 'tierra', 'identificacion', 'temperatura', 'tapas', 'bornes'] as const;
export type PuntoTablero = (typeof PUNTOS_TABLERO)[number];
export type EstadoPunto = 'si' | 'no' | 'no_aplica';

export const PUNTO_TABLERO: Record<PuntoTablero, { texto: string; siNo: string }> = {
  diferencial: { texto: 'Tiene disyuntor diferencial de 30 mA', siNo: 'Instalar un disyuntor diferencial de 30 mA: protege a las personas de descargas.' },
  tierra: { texto: 'Conductor de protección (tierra) en todos los circuitos', siNo: 'Llevar el conductor de protección a todos los circuitos y tomas.' },
  identificacion: { texto: 'Cada protección dice qué circuito alimenta', siNo: 'Identificar cada protección (podés imprimir las etiquetas desde el Taller).' },
  temperatura: { texto: 'Sin signos de recalentamiento', siNo: 'Revisar las conexiones con signos de recalentamiento y reemplazar lo dañado.' },
  tapas: { texto: 'Tapa y contratapa completas', siNo: 'Completar tapa y contratapa: ninguna parte con tensión al alcance de la mano.' },
  bornes: { texto: 'Bornes ajustados', siNo: 'Reajustar los bornes flojos.' },
};

export interface DatosInforme {
  mediciones: Partial<Record<Medicion, number>>;
  tablero: Partial<Record<PuntoTablero, EstadoPunto>>;
}

const RECOMENDACION_MEDICION: Record<Medicion, Partial<Record<Semaforo, string>>> = {
  puestaTierra: {
    atencion: 'Mejorar la puesta a tierra para bajar de 10 Ω (por ejemplo, con una jabalina adicional).',
    mal: 'La puesta a tierra supera 40 Ω: hay que rehacerla antes de seguir usando la instalación.',
  },
  disparoDiferencial: { mal: 'El diferencial tarda más de lo admisible en disparar: reemplazarlo.' },
  aislacion: {
    atencion: 'La aislación está baja: buscar humedad o conductores dañados.',
    mal: 'Aislación insuficiente: hay riesgo de fuga a tierra. Buscar y reparar la falla.',
  },
  tension: {
    atencion: 'La tensión está cerca de los límites: si se repite, consultar a la distribuidora.',
    mal: 'La tensión está fuera de rango: avisar a la distribuidora (EDEA) y proteger los artefactos.',
  },
};

const ORDEN: Record<Semaforo, number> = { bien: 0, atencion: 1, mal: 2 };

export interface ResultadoInforme {
  general: Semaforo | null;
  mediciones: { medicion: Medicion; valor: number; estado: Semaforo }[];
  recomendaciones: string[];
}

export function evaluarInforme(d: DatosInforme): ResultadoInforme {
  const mediciones = MEDICIONES.flatMap((m) => {
    const v = d.mediciones[m];
    return v === undefined || !Number.isFinite(v) || v < 0 ? [] : [{ medicion: m, valor: v, estado: MEDICION[m].evaluar(v) }];
  });
  const recomendaciones: string[] = [];
  for (const m of mediciones) {
    const r = RECOMENDACION_MEDICION[m.medicion][m.estado];
    if (r) recomendaciones.push(r);
  }
  const malos = PUNTOS_TABLERO.filter((p) => d.tablero[p] === 'no');
  for (const p of malos) recomendaciones.push(PUNTO_TABLERO[p].siNo);
  const estados: Semaforo[] = [...mediciones.map((m) => m.estado), ...malos.map((p): Semaforo => (p === 'diferencial' || p === 'tierra' ? 'mal' : 'atencion'))];
  const general = estados.length ? estados.reduce((a, b) => (ORDEN[b] > ORDEN[a] ? b : a)) : null;
  return { general, mediciones, recomendaciones };
}
