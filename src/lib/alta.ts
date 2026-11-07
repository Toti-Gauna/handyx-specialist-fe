// Pasos del alta guiada (lote 4.4): qué falta, qué hay que corregir y qué ya está, a partir de lo que dice el servidor.
// La app no decide si algo está verificado: solo lo muestra. Lo que falta para enviar sale de `faltantesEnvio`.
import type { NombreIcono } from '../components/Icono.tsx';
import type { DatosAlta, Disponibilidad, FaltanteEnvio, PerfilEspecialista } from '../contracts/dto.ts';
import type { EstadoDocumento } from '../contracts/maquinas.ts';

export const PASOS_ALTA = ['datos', 'identidad', 'selfie', 'rubros', 'zonas', 'antecedentes'] as const;
export type PasoAlta = (typeof PASOS_ALTA)[number];

/** listo · falta (para enviar) · corregir (Operations lo marcó) · revision (lo está viendo Operations) · opcional (no frena el envío). */
export type EstadoItem = 'listo' | 'falta' | 'corregir' | 'revision' | 'opcional';

export interface ItemAlta {
  paso: PasoAlta;
  titulo: string;
  icono: NombreIcono;
  estado: EstadoItem;
  detalle: string;
}

export const PASO_DE_FALTANTE: Record<FaltanteEnvio, PasoAlta> = {
  datos: 'datos',
  dni: 'identidad',
  cuitCuil: 'identidad',
  fotoCara: 'selfie',
  rubros: 'rubros',
  matricula: 'rubros',
};

const RECHAZO = new Set<EstadoDocumento>(['rechazado', 'vencido']);
const docs = (estados: EstadoDocumento[], faltan: boolean, textos: { falta: string; corregir: string; revision: string; listo: string }): Pick<ItemAlta, 'estado' | 'detalle'> => {
  if (estados.some((e) => RECHAZO.has(e))) return { estado: 'corregir', detalle: textos.corregir };
  if (faltan) return { estado: 'falta', detalle: textos.falta };
  if (estados.some((e) => e === 'en_revision')) return { estado: 'revision', detalle: textos.revision };
  return { estado: 'listo', detalle: textos.listo };
};

export function itemsAlta(perfil: PerfilEspecialista, datos: DatosAlta, disponibilidad: Disponibilidad | null, formatoFecha: (iso: string) => string): ItemAlta[] {
  const f = new Set(perfil.faltantesEnvio);
  const conMatricula = perfil.rubros.filter((r) => r.matricula !== null).map((r) => r.matricula as EstadoDocumento);
  const zonas = disponibilidad?.zonas.length ?? 0;
  const franjas = disponibilidad?.franjas.length ?? 0;
  const a = perfil.antecedentes;
  const cita = perfil.citaAntecedentes;
  return [
    {
      paso: 'datos',
      titulo: 'Tus datos',
      icono: 'usuario',
      ...(f.has('datos') ? { estado: 'falta' as const, detalle: 'Nombre, fecha de nacimiento y dónde vivís' } : { estado: 'listo' as const, detalle: [datos.nombre, datos.apellido].filter(Boolean).join(' ') }),
    },
    {
      paso: 'identidad',
      titulo: 'DNI y CUIT o CUIL',
      icono: 'escudo',
      ...docs([perfil.documentos.dni, perfil.documentos.cuitCuil], f.has('dni') || f.has('cuitCuil'), {
        falta: 'Foto del DNI (frente y dorso) y tu número de CUIT o CUIL',
        corregir: 'Operations te pidió volver a cargarlo',
        revision: 'Lo está revisando Operations',
        listo: 'Cargado',
      }),
    },
    {
      paso: 'selfie',
      titulo: 'Tu foto',
      icono: 'camara',
      ...docs([perfil.documentos.fotoCara], f.has('fotoCara'), {
        falta: 'Una selfie de frente, con buena luz',
        corregir: 'Operations te pidió sacarla de nuevo',
        revision: 'La está revisando Operations',
        listo: 'Cargada',
      }),
    },
    {
      paso: 'rubros',
      titulo: 'Tus rubros',
      icono: 'llave',
      ...docs(conMatricula, f.has('rubros') || f.has('matricula'), {
        falta: f.has('rubros') ? 'Elegí en qué trabajás' : 'Falta la matrícula de un rubro',
        corregir: 'Hay que volver a cargar una matrícula',
        revision: 'Operations revisa tu matrícula',
        listo: `${perfil.rubros.length} ${perfil.rubros.length === 1 ? 'rubro' : 'rubros'}`,
      }),
    },
    {
      paso: 'zonas',
      titulo: 'Zonas y horarios',
      icono: 'pin',
      ...(zonas > 0 && franjas > 0
        ? { estado: 'listo' as const, detalle: `${zonas} ${zonas === 1 ? 'barrio' : 'barrios'} · ${franjas} ${franjas === 1 ? 'franja' : 'franjas'}` }
        : { estado: 'opcional' as const, detalle: 'Dónde y cuándo trabajás. Podés hacerlo después' }),
    },
    {
      paso: 'antecedentes',
      titulo: 'Antecedentes en persona',
      icono: 'calendario',
      ...(a === 'aprobada'
        ? { estado: 'listo' as const, detalle: 'Verificación aprobada' }
        : a === 'no_aprobada'
          ? { estado: 'corregir' as const, detalle: 'La verificación no se aprobó. Escribinos desde Ayuda' }
          : a === 'no_asistio'
            ? { estado: 'falta' as const, detalle: 'No pudiste ir: elegí otro turno' }
            : cita
              ? { estado: 'listo' as const, detalle: `Turno: ${formatoFecha(cita.inicio)}` }
              : { estado: 'opcional' as const, detalle: 'Elegí un turno (o te lo coordina Operations)' }),
    },
  ];
}

/** Para el anillo: listos (o en revisión) sobre los pasos que cuentan. Los opcionales cuentan solo si están hechos. */
export function progresoAlta(items: readonly ItemAlta[]): { hechos: number; total: number } {
  return { hechos: items.filter((i) => i.estado === 'listo' || i.estado === 'revision').length, total: items.length };
}

/** El primer paso que conviene abrir: lo marcado para corregir, después lo que falta. */
export function siguientePaso(items: readonly ItemAlta[]): PasoAlta | null {
  return (items.find((i) => i.estado === 'corregir') ?? items.find((i) => i.estado === 'falta'))?.paso ?? null;
}

export const esPasoAlta = (v: string | null): v is PasoAlta => (PASOS_ALTA as readonly string[]).includes(v ?? '');

// ── Horarios en mosaico ─────────────────────────────────────────────────────────────────────────

/** Tres bloques por día. Al guardar, los bloques seguidos se unen en una sola franja (mañana + tarde = 8 a 17 h). */
export const BLOQUES_HORARIO = [
  { id: 'manana', texto: 'Mañana', desde: '08:00', hasta: '12:00' },
  { id: 'tarde', texto: 'Tarde', desde: '12:00', hasta: '17:00' },
  { id: 'noche', texto: 'Noche', desde: '17:00', hasta: '21:00' },
] as const;
export type Bloque = (typeof BLOQUES_HORARIO)[number]['id'];
/** Lunes primero, como en el calendario de la app (0 = domingo). */
export const DIAS_SEMANA = [1, 2, 3, 4, 5, 6, 0] as const;

const clave = (dia: number, b: Bloque) => `${dia}:${b}`;

/** Bloques marcados a partir de las franjas guardadas: un bloque cuenta si alguna franja lo cubre entero. */
export function bloquesDesdeFranjas(franjas: readonly { dia: number; desde: string; hasta: string }[]): Set<string> {
  const marcados = new Set<string>();
  for (const f of franjas) for (const b of BLOQUES_HORARIO) if (f.desde <= b.desde && f.hasta >= b.hasta) marcados.add(clave(f.dia, b.id));
  return marcados;
}

/** Franjas para guardar: por día, los bloques seguidos se unen. */
export function franjasDesdeBloques(marcados: ReadonlySet<string>): { dia: number; desde: string; hasta: string }[] {
  const franjas: { dia: number; desde: string; hasta: string }[] = [];
  for (const dia of DIAS_SEMANA) {
    let actual: { dia: number; desde: string; hasta: string } | null = null;
    for (const b of BLOQUES_HORARIO) {
      if (marcados.has(clave(dia, b.id))) {
        if (actual && actual.hasta === b.desde) actual.hasta = b.hasta;
        else {
          actual = { dia, desde: b.desde, hasta: b.hasta };
          franjas.push(actual);
        }
      } else actual = null;
    }
  }
  return franjas;
}

export const claveBloque = clave;
