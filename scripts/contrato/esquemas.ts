// Componentes del OpenAPI 0.11.0 generados desde los esquemas Zod del contrato (los nuevos de cada dominio). Ver openapi.ts.
import { z } from 'zod';

type J = null | boolean | number | string | J[] | { [k: string]: J };
const C = new URL('../../src/contracts/', import.meta.url).href;

export const DOMINIOS = [
  'comun',
  'seguridad',
  'registro',
  'mapa',
  'presupuestos',
  'ingresos',
  'equipamiento',
  'modo-trabajo',
  'obras',
  'repuestos',
  'equipo',
  'chat',
  'ferreterias',
  'camino',
  'agenda',
  'cuenta',
] as const;

/** Ya están en el YAML (escritos a mano): se referencian, no se vuelven a emitir. */
const EXISTENTES: Record<string, string> = {
  InstanteSchema: 'Instante',
  MontoSchema: 'Monto',
  HorarioSchema: 'Horario',
  PuntoSchema: 'Punto',
  ZonaMapaSchema: 'ZonaMapa',
  SesionSchema: 'Sesion',
};
/** Primitivos de comun.ts que valen como componente propio. */
const PRIMITIVOS_COMUN = new Set(['FechaSchema', 'MesSchema', 'CantidadSchema']);
const SIN_COMPONENTE = new Set(['CodigoSeisSchema', 'InicialesSchema', 'ResumenCortoSchema', 'TelefonoSchema', 'IdentificadorSchema']);
const DESCRIPCIONES: Record<string, string> = {
  Fecha: 'Fecha calendario de Buenos Aires (AAAA-MM-DD)',
  Mes: 'Mes calendario (AAAA-MM)',
  Cantidad: 'Positiva, hasta 10000 y con hasta 3 decimales. La plata se calcula en el servidor con multiplicar (centavos enteros)',
};

export async function generar(existentesYaml: Set<string>) {
  const dto = await import(C + 'dto.ts');
  const reg = z.registry<{ id: string; description?: string }>();
  for (const [exp, id] of Object.entries(EXISTENTES)) reg.add(dto[exp], { id });
  const nuevos: string[] = [];
  const dominioDe: Record<string, string> = {};
  for (const d of DOMINIOS) {
    const m = await import(`${C}${d}.ts`);
    for (const [exp, v] of Object.entries(m)) {
      if (!exp.endsWith('Schema') || !(v instanceof z.ZodType)) continue;
      if (SIN_COMPONENTE.has(exp)) continue;
      if (d === 'comun' && !PRIMITIVOS_COMUN.has(exp) && !['PersonaVisibleSchema', 'ProfesionalRefSchema', 'ArchivoFirmadoSchema', 'ConVersionSchema'].includes(exp)) continue;
      const id = exp.slice(0, -'Schema'.length);
      if (existentesYaml.has(id)) throw new Error(`choca con un componente existente: ${id}`);
      if (nuevos.includes(id)) throw new Error(`repetido: ${id}`);
      const meta: { id: string; description?: string } = { id };
      if (DESCRIPCIONES[id]) meta.description = DESCRIPCIONES[id];
      reg.add(v as z.ZodType, meta);
      nuevos.push(id);
      dominioDe[id] = d;
    }
  }
  const salida = z.toJSONSchema(reg, { uri: (id: string) => `#/components/schemas/${id}`, target: 'draft-2020-12', unrepresentable: 'any' }) as { schemas: Record<string, J> };
  const esquemas: Record<string, J> = {};
  for (const id of nuevos) esquemas[id] = limpiar(salida.schemas[id] ?? null);
  return { esquemas, nuevos, dominioDe };
}

const MAX = 9007199254740991;
function limpiar(n: J): J {
  if (Array.isArray(n)) return n.map(limpiar);
  if (n === null || typeof n !== 'object') return n;
  const o: { [k: string]: J } = {};
  for (const [k, v] of Object.entries(n)) {
    if (k === '$schema' || k === '$id') continue;
    if (k === 'maximum' && v === MAX) continue;
    if (k === 'minimum' && v === -MAX) continue;
    o[k] = limpiar(v);
  }
  if (typeof o.format === 'string' && 'pattern' in o) delete o.pattern;
  // anyOf [X, null] → oneOf (disjuntos), como el resto del archivo.
  if (Array.isArray(o.anyOf) && o.anyOf.length === 2 && o.anyOf.some((x) => JSON.stringify(x) === '{"type":"null"}')) {
    o.oneOf = o.anyOf;
    delete o.anyOf;
  }
  // Orden legible: type, enum, const, format primero.
  if (o.type === 'integer' && o.exclusiveMinimum === 0 && !('minimum' in o)) {
    delete o.exclusiveMinimum;
    o.minimum = 1;
  }
  const orden = ['$ref', 'type', 'const', 'enum', 'format', 'description', 'additionalProperties', 'required'];
  const r: { [k: string]: J } = {};
  for (const k of orden) if (k in o) r[k] = o[k] ?? null;
  for (const [k, v] of Object.entries(o)) if (!(k in r)) r[k] = v;
  return r;
}
