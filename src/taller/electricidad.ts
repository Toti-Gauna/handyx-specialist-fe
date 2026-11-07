// Taller · Electricidad (fase H1, docs/herramientas.md). Lógica pura: sin React ni navegador, con pruebas.
//
// IMPORTANTE: las tablas de esta herramienta son VALORES DE REFERENCIA PENDIENTES DE REVISIÓN TÉCNICA Y LEGAL. Se tomaron
// de bibliografía técnica pública (método de instalación B2 de IEC 60364-5-52, cobre con aislación de PVC, 30 °C) y de los
// criterios de la Reglamentación AEA 90364-7-771 que se usan en Argentina. No se copió ninguna tabla de la norma. Hasta que
// un profesional y Legal los revisen, la interfaz muestra `REVISION.aviso` junto a cada resultado.

export const REVISION = {
  estado: 'pendiente' as 'pendiente' | 'revisado',
  aviso: 'Valores de referencia en revisión técnica. Confirmá siempre con la reglamentación AEA 90364 vigente y tu criterio profesional.',
  fuente: 'Referencia: IEC 60364-5-52 (método B2, cobre/PVC, 30 °C) y criterios de la Reglamentación AEA 90364-7-771.',
};

/** Secciones comerciales de conductores de cobre (mm²). */
export const SECCIONES = [1.5, 2.5, 4, 6, 10, 16, 25, 35] as const;
export type Seccion = (typeof SECCIONES)[number];

/** Corriente admisible (A) en cañería embutida, cobre/PVC, 30 °C. Clave: conductores cargados (2 = monofásico, 3 = trifásico). */
const CORRIENTE_ADMISIBLE: Record<2 | 3, Record<Seccion, number>> = {
  2: { 1.5: 16.5, 2.5: 23, 4: 30, 6: 38, 10: 52, 16: 69, 25: 83, 35: 103 },
  3: { 1.5: 15, 2.5: 20, 4: 27, 6: 34, 10: 46, 16: 62, 25: 80, 35: 99 },
};

/** Factor por temperatura ambiente (aislación de PVC, referencia 30 °C). */
const FACTOR_TEMPERATURA: Record<number, number> = { 25: 1.06, 30: 1, 35: 0.94, 40: 0.87, 45: 0.79, 50: 0.71 };
export const TEMPERATURAS = [25, 30, 35, 40, 45, 50] as const;

/** Factor por circuitos agrupados en el mismo caño. */
const FACTOR_AGRUPAMIENTO = [1, 1, 0.8, 0.7, 0.65, 0.6, 0.57] as const;
export const MAX_CIRCUITOS_AGRUPADOS = 6;

/** Calibres comerciales de interruptores termomagnéticos (A). */
export const CALIBRES = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100] as const;

export const TIPOS_CIRCUITO = ['iluminacion', 'tomas', 'especial', 'seccional', 'principal'] as const;
export type TipoCircuito = (typeof TIPOS_CIRCUITO)[number];

export const CIRCUITO: Record<TipoCircuito, { texto: string; seccionMinima: Seccion; caidaMaxima: number; calibreMaximo: number | null }> = {
  iluminacion: { texto: 'Iluminación (IUG)', seccionMinima: 1.5, caidaMaxima: 3, calibreMaximo: 16 },
  tomas: { texto: 'Tomacorrientes (TUG)', seccionMinima: 2.5, caidaMaxima: 5, calibreMaximo: 20 },
  especial: { texto: 'Uso especial (aire, horno, bomba)', seccionMinima: 2.5, caidaMaxima: 5, calibreMaximo: null },
  seccional: { texto: 'Línea seccional', seccionMinima: 2.5, caidaMaxima: 1, calibreMaximo: null },
  principal: { texto: 'Línea principal', seccionMinima: 4, caidaMaxima: 1, calibreMaximo: null },
};

export type Sistema = 'monofasico' | 'trifasico';
export const TENSION: Record<Sistema, number> = { monofasico: 220, trifasico: 380 };

/** Resistividad del cobre a temperatura de servicio (Ω·mm²/m), valor conservador usual. */
export const RESISTIVIDAD_COBRE = 0.0225;

const redondear = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

/** Corriente de proyecto desde la potencia: I = P / (U·cosφ) (mono) o P / (√3·U·cosφ) (tri). */
export function corrienteDesdePotencia(potenciaW: number, sistema: Sistema, cosPhi = 0.9): number {
  if (potenciaW <= 0 || cosPhi <= 0 || cosPhi > 1) return 0;
  const u = TENSION[sistema];
  return potenciaW / ((sistema === 'trifasico' ? Math.sqrt(3) : 1) * u * cosPhi);
}

/** Caída de tensión en % para una sección: ΔU = k·L·I·ρ·cosφ / S, con k = 2 (mono) o √3 (tri). Sin reactancia (≤ 35 mm²). */
export function caidaDeTension(o: { corriente: number; longitud: number; seccion: number; sistema: Sistema; cosPhi?: number }): { voltios: number; porcentaje: number } {
  const k = o.sistema === 'trifasico' ? Math.sqrt(3) : 2;
  const v = (k * o.longitud * o.corriente * RESISTIVIDAD_COBRE * (o.cosPhi ?? 0.9)) / o.seccion;
  return { voltios: redondear(v), porcentaje: redondear((v / TENSION[o.sistema]) * 100) };
}

export function factorTemperatura(t: number): number {
  return FACTOR_TEMPERATURA[t] ?? 1;
}
export function factorAgrupamiento(circuitos: number): number {
  const n = Math.min(Math.max(1, Math.round(circuitos)), MAX_CIRCUITOS_AGRUPADOS);
  return FACTOR_AGRUPAMIENTO[n] ?? 1;
}

/** Corriente admisible corregida (A) de una sección. */
export function corrienteAdmisible(seccion: Seccion, sistema: Sistema, temperatura = 30, circuitos = 1): number {
  const base = CORRIENTE_ADMISIBLE[sistema === 'trifasico' ? 3 : 2][seccion];
  return redondear(base * factorTemperatura(temperatura) * factorAgrupamiento(circuitos), 1);
}

export interface EntradaConductor {
  corriente: number;
  longitud: number;
  sistema: Sistema;
  tipo: TipoCircuito;
  temperatura?: number;
  circuitos?: number;
  cosPhi?: number;
}

export interface FilaSeccion {
  seccion: Seccion;
  admisible: number;
  calibre: number | null;
  caida: number;
  cumple: { corriente: boolean; caida: boolean; minimo: boolean };
}

export interface ResultadoConductor {
  /** La sección mínima que cumple todo, o null si ninguna hasta 35 mm² alcanza. */
  seccion: Seccion | null;
  calibre: number | null;
  admisible: number | null;
  caida: { voltios: number; porcentaje: number } | null;
  caidaMaxima: number;
  /** Qué decidió la sección: la corriente, la caída de tensión o el mínimo del tipo de circuito. */
  manda: 'corriente' | 'caida' | 'minimo' | null;
  /** Calibre de la protección que corresponde a la corriente de proyecto (In ≥ Ib). */
  calibreProyecto: number | null;
  avisos: string[];
  tabla: FilaSeccion[];
}

/** Calibre comercial más chico que cubre la corriente de proyecto. */
export function calibreParaCorriente(corriente: number): number | null {
  return CALIBRES.find((c) => c >= corriente) ?? null;
}

/**
 * Sección mínima de un circuito. Cumple a la vez: Ib ≤ In ≤ Iz (protección que cubre la corriente y protege el cable),
 * caída de tensión dentro del máximo del tipo de circuito y sección mínima del tipo.
 */
export function elegirConductor(e: EntradaConductor): ResultadoConductor {
  const tipo = CIRCUITO[e.tipo];
  const temperatura = e.temperatura ?? 30;
  const circuitos = e.circuitos ?? 1;
  const avisos: string[] = [];
  const calibreProyecto = calibreParaCorriente(e.corriente);
  if (calibreProyecto === null) avisos.push('La corriente supera los calibres de esta herramienta (100 A): hace falta un cálculo específico.');
  if (tipo.calibreMaximo !== null && calibreProyecto !== null && calibreProyecto > tipo.calibreMaximo) {
    avisos.push(`Este tipo de circuito no debería superar ${tipo.calibreMaximo} A: conviene dividirlo.`);
  }
  const tabla: FilaSeccion[] = SECCIONES.map((s) => {
    const admisible = corrienteAdmisible(s, e.sistema, temperatura, circuitos);
    const caida = caidaDeTension({ corriente: e.corriente, longitud: e.longitud, seccion: s, sistema: e.sistema, cosPhi: e.cosPhi ?? 0.9 }).porcentaje;
    const calibre = calibreProyecto !== null && calibreProyecto <= admisible ? calibreProyecto : null;
    return {
      seccion: s,
      admisible,
      calibre,
      caida,
      cumple: { corriente: calibre !== null, caida: caida <= tipo.caidaMaxima, minimo: s >= tipo.seccionMinima },
    };
  });
  const elegida = tabla.find((f) => f.cumple.corriente && f.cumple.caida && f.cumple.minimo) ?? null;
  if (!elegida) {
    return {
      seccion: null,
      calibre: null,
      admisible: null,
      caida: null,
      caidaMaxima: tipo.caidaMaxima,
      manda: null,
      calibreProyecto,
      avisos: [...avisos, 'Ninguna sección hasta 35 mm² cumple: revisá la longitud, partí el circuito o hacé un cálculo específico.'],
      tabla,
    };
  }
  // Qué la decidió: la más chica que cumple cada condición por separado.
  const primera = (c: keyof FilaSeccion['cumple']) => tabla.find((f) => f.cumple[c])?.seccion ?? 0;
  const candidatas = { corriente: primera('corriente'), caida: primera('caida'), minimo: primera('minimo') };
  const manda = (Object.entries(candidatas) as [ResultadoConductor['manda'] & string, number][]).reduce((a, b) => (b[1] > a[1] ? b : a))[0];
  return {
    seccion: elegida.seccion,
    calibre: elegida.calibre,
    admisible: elegida.admisible,
    caida: caidaDeTension({ corriente: e.corriente, longitud: e.longitud, seccion: elegida.seccion, sistema: e.sistema, cosPhi: e.cosPhi ?? 0.9 }),
    caidaMaxima: tipo.caidaMaxima,
    manda,
    calibreProyecto,
    avisos,
    tabla,
  };
}

// ── Planificador de vivienda (grado de electrificación) ──────────────────────────────────────────────────────────────

export const GRADOS = ['minima', 'media', 'elevada', 'superior'] as const;
export type Grado = (typeof GRADOS)[number];

export const GRADO: Record<Grado, { texto: string; hastaM2: number | null; demandaKva: string; circuitos: { iug: number; tug: number; libres: number } }> = {
  minima: { texto: 'Mínima', hastaM2: 60, demandaKva: '3,7 kVA', circuitos: { iug: 1, tug: 1, libres: 0 } },
  media: { texto: 'Media', hastaM2: 130, demandaKva: '7 kVA', circuitos: { iug: 1, tug: 1, libres: 1 } },
  elevada: { texto: 'Elevada', hastaM2: 200, demandaKva: '11 kVA', circuitos: { iug: 2, tug: 2, libres: 1 } },
  superior: { texto: 'Superior', hastaM2: null, demandaKva: 'más de 11 kVA', circuitos: { iug: 2, tug: 2, libres: 2 } },
};

export const AMBIENTES = ['estar', 'dormitorio', 'cocina', 'bano', 'pasillo', 'lavadero', 'garage', 'exterior'] as const;
export type Ambiente = (typeof AMBIENTES)[number];

/** Bocas mínimas por ambiente (referencia). `porM2`: una boca más cada tantos m² cuando corresponde. */
export const AMBIENTE: Record<Ambiente, { texto: string; iug: number; iugPorM2?: number; tug: number; tugPorM2?: number }> = {
  estar: { texto: 'Living o comedor', iug: 1, iugPorM2: 18, tug: 2, tugPorM2: 6 },
  dormitorio: { texto: 'Dormitorio', iug: 1, tug: 3 },
  cocina: { texto: 'Cocina', iug: 2, tug: 3 },
  bano: { texto: 'Baño', iug: 1, tug: 1 },
  pasillo: { texto: 'Pasillo o vestíbulo', iug: 1, tug: 1 },
  lavadero: { texto: 'Lavadero', iug: 1, tug: 2 },
  garage: { texto: 'Garage', iug: 1, tug: 1 },
  exterior: { texto: 'Patio o balcón', iug: 1, tug: 1 },
};

export interface AmbienteCargado {
  tipo: Ambiente;
  m2: number;
}

export function gradoPorSuperficie(m2: number): Grado {
  if (m2 <= 60) return 'minima';
  if (m2 <= 130) return 'media';
  if (m2 <= 200) return 'elevada';
  return 'superior';
}

export function bocasDeAmbiente(a: AmbienteCargado): { iug: number; tug: number } {
  const def = AMBIENTE[a.tipo];
  const iug = def.iugPorM2 ? Math.max(def.iug, Math.ceil(a.m2 / def.iugPorM2)) : def.iug;
  const tug = def.tugPorM2 ? Math.max(def.tug, Math.ceil(a.m2 / def.tugPorM2)) : def.tug;
  return { iug, tug };
}

export interface PlanVivienda {
  superficie: number;
  grado: Grado;
  circuitos: { iug: number; tug: number; libres: number; total: number };
  bocas: { iug: number; tug: number; total: number };
  porAmbiente: (AmbienteCargado & { iug: number; tug: number })[];
}

export function planificarVivienda(ambientes: AmbienteCargado[]): PlanVivienda {
  const superficie = redondear(ambientes.reduce((s, a) => s + Math.max(0, a.m2), 0), 1);
  const grado = gradoPorSuperficie(superficie);
  const porAmbiente = ambientes.map((a) => ({ ...a, ...bocasDeAmbiente(a) }));
  const iug = porAmbiente.reduce((s, a) => s + a.iug, 0);
  const tug = porAmbiente.reduce((s, a) => s + a.tug, 0);
  const c = GRADO[grado].circuitos;
  return { superficie, grado, circuitos: { ...c, total: c.iug + c.tug + c.libres }, bocas: { iug, tug, total: iug + tug }, porAmbiente };
}

// ── Iluminación ───────────────────────────────────────────────────────────────────────────────────────────────────────

export const USOS_LUZ = ['dormitorio', 'estar', 'cocina', 'bano', 'pasillo', 'escritorio', 'taller', 'local'] as const;
export type UsoLuz = (typeof USOS_LUZ)[number];
export const LUX: Record<UsoLuz, { texto: string; lux: number }> = {
  dormitorio: { texto: 'Dormitorio', lux: 150 },
  estar: { texto: 'Living o comedor', lux: 200 },
  cocina: { texto: 'Cocina', lux: 300 },
  bano: { texto: 'Baño', lux: 200 },
  pasillo: { texto: 'Pasillo', lux: 100 },
  escritorio: { texto: 'Escritorio o estudio', lux: 500 },
  taller: { texto: 'Taller', lux: 500 },
  local: { texto: 'Local comercial', lux: 500 },
};
/** Utilización del local × mantenimiento: cuánto de la luz llega al plano de trabajo. */
export const RENDIMIENTO_LOCAL = 0.6 * 0.8;

export function iluminacion(o: { uso: UsoLuz; m2: number; lumenesPorLuminaria: number }): { lux: number; lumenes: number; luminarias: number; luxLogrados: number } {
  const lux = LUX[o.uso].lux;
  const lumenes = Math.ceil((lux * Math.max(0, o.m2)) / RENDIMIENTO_LOCAL);
  const luminarias = o.lumenesPorLuminaria > 0 ? Math.max(1, Math.ceil(lumenes / o.lumenesPorLuminaria)) : 0;
  const luxLogrados = o.m2 > 0 ? Math.round((luminarias * o.lumenesPorLuminaria * RENDIMIENTO_LOCAL) / o.m2) : 0;
  return { lux, lumenes, luminarias, luxLogrados };
}

// ── Consumo y ahorro ─────────────────────────────────────────────────────────────────────────────────────────────────

export interface Artefacto {
  nombre: string;
  watts: number;
  cantidad: number;
  horasPorDia: number;
}

/** kWh por mes (30 días) y su costo con la tarifa que carga el profesional ($/kWh en centavos). */
export function consumoMensual(artefactos: Artefacto[], tarifaCentavosPorKwh: number): { kwh: number; centavos: number; porArtefacto: { nombre: string; kwh: number }[] } {
  const porArtefacto = artefactos.map((a) => ({ nombre: a.nombre, kwh: redondear((a.watts * a.cantidad * a.horasPorDia * 30) / 1000, 1) }));
  const kwh = redondear(porArtefacto.reduce((s, a) => s + a.kwh, 0), 1);
  return { kwh, centavos: Math.round(kwh * Math.max(0, tarifaCentavosPorKwh)), porArtefacto };
}

/** Ahorro mensual de cambiar una lámpara por otra (por ejemplo, a LED). */
export function ahorroCambio(o: { wattsAntes: number; wattsDespues: number; cantidad: number; horasPorDia: number; tarifaCentavosPorKwh: number }): { kwh: number; centavos: number } {
  const kwh = redondear(((o.wattsAntes - o.wattsDespues) * o.cantidad * o.horasPorDia * 30) / 1000, 1);
  return { kwh, centavos: Math.round(kwh * o.tarifaCentavosPorKwh) };
}

// ── Ley de Ohm y potencia ────────────────────────────────────────────────────────────────────────────────────────────

export type Magnitud = 'tension' | 'corriente' | 'resistencia' | 'potencia';
export type ValoresOhm = Partial<Record<Magnitud, number>>;

/** Con dos magnitudes cualesquiera calcula las otras dos. null si hay menos de dos o algún valor no es positivo. */
export function leyDeOhm(v: ValoresOhm): Required<ValoresOhm> | null {
  const dadas = (Object.entries(v) as [Magnitud, number | undefined][]).filter((e): e is [Magnitud, number] => typeof e[1] === 'number' && e[1] > 0);
  if (dadas.length < 2) return null;
  const m = Object.fromEntries(dadas.slice(0, 2)) as ValoresOhm;
  const { tension, corriente, resistencia, potencia } = m;
  let r: [number, number, number, number];
  if (tension !== undefined && corriente !== undefined) r = [tension, corriente, tension / corriente, tension * corriente];
  else if (tension !== undefined && resistencia !== undefined) r = [tension, tension / resistencia, resistencia, (tension * tension) / resistencia];
  else if (tension !== undefined && potencia !== undefined) r = [tension, potencia / tension, (tension * tension) / potencia, potencia];
  else if (corriente !== undefined && resistencia !== undefined) r = [corriente * resistencia, corriente, resistencia, corriente * corriente * resistencia];
  else if (corriente !== undefined && potencia !== undefined) r = [potencia / corriente, corriente, potencia / (corriente * corriente), potencia];
  else if (resistencia !== undefined && potencia !== undefined) r = [Math.sqrt(potencia * resistencia), Math.sqrt(potencia / resistencia), resistencia, potencia];
  else return null;
  const [U, I, R, P] = r;
  return { tension: redondear(U), corriente: redondear(I, 3), resistencia: redondear(R, 3), potencia: redondear(P) };
}

// ── Referencias sin conexión ─────────────────────────────────────────────────────────────────────────────────────────

export const COLORES_CONDUCTORES = [
  { funcion: 'Fase (L1)', color: 'Marrón', hex: '#7a4b2a' },
  { funcion: 'Fase (L2)', color: 'Negro', hex: '#1b1b1b' },
  { funcion: 'Fase (L3)', color: 'Rojo', hex: '#c62828' },
  { funcion: 'Neutro', color: 'Celeste', hex: '#4fa3d9' },
  { funcion: 'Tierra (PE)', color: 'Verde y amarillo', hex: 'rayado' },
] as const;

export const SEGURIDAD_ANTES_DE_TRABAJAR = [
  'Cortá la alimentación del circuito y del tablero si hace falta.',
  'Bloqueá el interruptor y dejá un cartel: nadie lo tiene que volver a dar.',
  'Verificá la ausencia de tensión con un instrumento (probador o multímetro) que sepas que funciona.',
  'Poné a tierra y en cortocircuito cuando el trabajo lo pida.',
  'Delimitá la zona y usá herramientas aisladas y protección personal.',
] as const;
