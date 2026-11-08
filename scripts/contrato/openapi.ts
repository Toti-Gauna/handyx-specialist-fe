// Genera la parte 0.11.0 del OpenAPI (docs/api/openapi.yaml): las rutas desde la tabla de rutas.ts y los esquemas desde
// los Zod de cada dominio (src/contracts/<dominio>.ts → JSON Schema 2020-12), para que no se desalineen. Lo anterior a
// 0.11.0 sigue escrito a mano. Re-ejecutable: quita lo generado (entre las marcas «═══ 0.11.0») y lo vuelve a armar.
// Uso: node scripts/contrato/openapi.ts [docs/api/openapi.yaml]. Después: npm test (openapi.test.ts compara los enums).
import { readFileSync, writeFileSync } from 'node:fs';
import { bloque } from './emitir.ts';
import { generar } from './esquemas.ts';
import { RUTAS, type Op } from './rutas.ts';

type J = null | boolean | number | string | J[] | { [k: string]: J };
const archivoYaml = process.argv[2] ?? new URL('../../docs/api/openapi.yaml', import.meta.url).pathname;
let yaml = readFileSync(archivoYaml, 'utf8');
const MARCA = '# ═══ 0.11.0';
const TAGS = ['seguridad', 'registro', 'presupuestos', 'precios', 'ingresos', 'equipamiento', 'modo-trabajo', 'obras', 'repuestos', 'equipo', 'chat', 'ferreteria', 'camino', 'agenda'];
// Regenerar: quitar lo generado antes (rutas desde la marca hasta components, esquemas desde la marca hasta el final, tags).
if (yaml.includes(MARCA)) {
  const iRutas = yaml.indexOf(`\n  ${MARCA}`);
  const iComp = yaml.indexOf('\ncomponents:\n');
  yaml = yaml.slice(0, iRutas) + '\n' + yaml.slice(iComp);
  const iEsq = yaml.indexOf(`\n    ${MARCA}`);
  yaml = yaml.slice(0, iEsq) + '\n';
  yaml = yaml.replace(TAGS.map((t) => `  - name: ${t}\n`).join(''), '');
  if (yaml.includes(MARCA)) throw new Error('no se pudo quitar lo generado');
}

const existentes = new Set([...yaml.matchAll(/^ {4}([A-Za-z]+):/gm)].map((m) => m[1] ?? ''));
const { esquemas, nuevos } = await generar(existentes);
const ref = (n: string): J => ({ $ref: `#/components/schemas/${n}` });
const conocido = (n: string) => nuevos.includes(n) || existentes.has(n);

function parametros(op: Op): J[] {
  const ps: J[] = [];
  for (const [, nombre] of op.p.matchAll(/\{(\w+)\}/g)) {
    if (nombre === 'id') ps.push({ $ref: '#/components/parameters/Id' });
    else if (nombre === 'seccion') ps.push({ name: 'seccion', in: 'path', required: true, schema: { type: 'string', enum: ['causa', 'antes_despues', 'pruebas', 'materiales_garantia', 'recomendaciones'] } });
    else if (nombre === 'capitulo') ps.push({ name: 'capitulo', in: 'path', required: true, schema: { type: 'integer', minimum: 1, maximum: 6 } });
    else if (nombre === 'fecha') ps.push({ name: 'fecha', in: 'path', required: true, schema: { type: 'string', format: 'date' } });
    else ps.push({ name: nombre ?? '', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } });
  }
  for (const [name, schema, requerido] of op.q ?? []) {
    const q: { [k: string]: J } = { name, in: 'query', schema: schema as J };
    if (requerido) q.required = true;
    ps.push(q);
  }
  if (op.m !== 'get' && !op.pub) ps.push({ $ref: '#/components/parameters/Csrf' });
  if (op.idem) ps.push({ $ref: '#/components/parameters/Idempotencia' });
  return ps;
}

function campoMultipart(v: string): J {
  if (v.startsWith('binary[]:')) return { type: 'array', items: { type: 'string', format: 'binary' }, description: v.slice(9) };
  if (v.startsWith('binary:')) return { type: 'string', format: 'binary', description: v.slice(7) };
  if (v === 'integer') return { type: 'integer', minimum: 0 };
  if (v === 'uuid') return { type: 'string', format: 'uuid' };
  if (v === 'string') return { type: 'string' };
  if (v.startsWith('string:')) return { type: 'string', pattern: v.slice(7) };
  if (!conocido(v)) throw new Error(`esquema desconocido en multipart: ${v}`);
  return { ...(ref(v) as object), description: 'JSON (parte con Content-Type application/json)' } as J;
}

function cuerpo(op: Op): J | undefined {
  if (!op.body) return undefined;
  const content: { [k: string]: J } = {};
  if (typeof op.body === 'string') {
    if (!conocido(op.body)) throw new Error(`esquema desconocido: ${op.body}`);
    content['application/json'] = { schema: ref(op.body) };
  } else {
    if (op.body.json) {
      if (!conocido(op.body.json)) throw new Error(`esquema desconocido: ${op.body.json}`);
      content['application/json'] = { schema: ref(op.body.json) };
    }
    const props: { [k: string]: J } = {};
    for (const [k, v] of Object.entries(op.body.multipart)) props[k] = campoMultipart(v);
    const esquema: { [k: string]: J } = { type: 'object' };
    if (op.body.requeridos?.length) esquema.required = op.body.requeridos;
    esquema.properties = props;
    content['multipart/form-data'] = { schema: esquema };
  }
  return { required: true, content };
}

function respuestas(op: Op): J {
  const [codigo, esquema, descripcion, forma] = op.ok;
  const r: { [k: string]: J } = {};
  if (forma === 'sse') {
    if (esquema === null || !conocido(esquema)) throw new Error(`esquema desconocido: ${esquema}`);
    r[String(codigo)] = { description: descripcion, content: { 'text/event-stream': { schema: { type: 'string', description: `Eventos SSE; el campo data es un ${esquema} en JSON` } } } };
  } else if (forma === 'csv') {
    r[String(codigo)] = { description: descripcion, content: { 'text/csv': { schema: { type: 'string' } } } };
  } else if (esquema === null) {
    r[String(codigo)] = { description: descripcion };
  } else {
    if (!conocido(esquema)) throw new Error(`esquema desconocido: ${esquema}`);
    let s: J = ref(esquema);
    if (forma === 'lista') s = { type: 'array', items: ref(esquema) };
    if (forma === 'pagina')
      s = { type: 'object', additionalProperties: false, required: ['items', 'siguienteCursor'], properties: { items: { type: 'array', items: ref(esquema) }, siguienteCursor: { type: ['string', 'null'] } } };
    if (forma === 'nulo') s = { oneOf: [ref(esquema), { type: 'null' }] };
    r[String(codigo)] = { description: descripcion, content: { 'application/json': { schema: s } } };
  }
  const errores = new Set(op.err ?? []);
  if (!op.pub) errores.add(401);
  for (const e of [...errores].sort()) r[String(e)] = { $ref: '#/components/responses/Error' };
  return r;
}

// ── Rutas ──
const porRuta = new Map<string, Op[]>();
for (const op of RUTAS) porRuta.set(op.p, [...(porRuta.get(op.p) ?? []), op]);
const lineasRutas: string[] = ['', `  ${MARCA} · bloque Taller (src/contracts/<dominio>.ts; tabla pantalla → endpoints en docs/contracts.md) ═══`];
let operaciones = 0;
for (const [p, ops] of porRuta) {
  if (yaml.includes(`\n  ${p}:\n`)) throw new Error(`la ruta ya existe: ${p}`);
  const item: { [k: string]: J } = {};
  for (const op of ops) {
    const o: { [k: string]: J } = { tags: [op.tag] };
    if (op.pub) o.security = [];
    o.summary = op.s;
    if (op.d) o.description = op.d;
    const ps = parametros(op);
    if (ps.length) o.parameters = ps;
    const b = cuerpo(op);
    if (b) o.requestBody = b;
    o.responses = respuestas(op);
    item[op.m] = o;
    operaciones++;
  }
  lineasRutas.push(`  ${p}:`, ...bloque(item, 4));
}

// ── Esquemas ──
const lineasEsquemas: string[] = ['', `    ${MARCA} · esquemas generados desde src/contracts/<dominio>.ts (Zod → JSON Schema 2020-12) ═══`];
for (const id of nuevos) lineasEsquemas.push(`    ${id}:`, ...bloque(esquemas[id] as { [k: string]: J }, 6));

// ── Insertar ──
yaml = yaml.replace(/(\n {2}- name: cuenta\n)/, `$1${TAGS.map((t) => `  - name: ${t}\n`).join('')}`);
const iComponentes = yaml.indexOf('\ncomponents:\n');
yaml = yaml.slice(0, iComponentes).replace(/\n+$/, '\n') + lineasRutas.join('\n') + '\n' + yaml.slice(iComponentes);
yaml = yaml.replace(/\n*$/, '\n') + lineasEsquemas.join('\n') + '\n';
writeFileSync(archivoYaml, yaml);
console.log(`rutas ${porRuta.size}, operaciones ${operaciones}, esquemas ${nuevos.length}`);
