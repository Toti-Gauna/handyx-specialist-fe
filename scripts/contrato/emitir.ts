// Emisor YAML mínimo para el OpenAPI: estilo de bloque con objetos chicos en línea, enums en una línea sin comillas.
type J = null | boolean | number | string | J[] | { [k: string]: J };

const RESERVADAS = new Set(['true', 'false', 'null', 'yes', 'no', 'on', 'off', 'y', 'n', '~', 'True', 'False', 'Null', 'NULL', 'Yes', 'No']);

export function escalar(v: J, enLinea: boolean): string {
  if (v === null) return "'null'";
  if (typeof v === 'boolean' || typeof v === 'number') return String(v);
  if (typeof v !== 'string') throw new Error('no es escalar');
  const plano = /^[\p{L}\p{N}_\p{Extended_Pictographic}][\p{L}\p{N}_\-./\p{Extended_Pictographic}️]*$/u;
  if (plano.test(v) && !RESERVADAS.has(v) && !/^[\d.+-]/.test(v) && !(enLinea && /[,[\]{}]/.test(v))) return v;
  return `'${v.replace(/'/g, "''")}'`;
}

const esEscalar = (v: J) => v === null || typeof v !== 'object';

/** Forma en línea de un valor (o null si no conviene). */
function enLinea(v: J): string | null {
  if (esEscalar(v)) return escalar(v, true);
  if (Array.isArray(v)) {
    const partes = v.map(enLinea);
    if (partes.some((p) => p === null)) return null;
    return `[${partes.join(', ')}]`;
  }
  const partes: string[] = [];
  for (const [k, x] of Object.entries(v)) {
    const p = enLinea(x);
    if (p === null) return null;
    partes.push(`${clave(k)}: ${p}`);
  }
  return partes.length ? `{ ${partes.join(', ')} }` : '{}';
}

export function clave(k: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$-]*$/.test(k) && !RESERVADAS.has(k) ? k : `'${k.replace(/'/g, "''")}'`;
}

/** Líneas YAML de un objeto (sin el nombre), con sangría `n` espacios. */
export function bloque(v: { [k: string]: J }, n: number, ancho = 118): string[] {
  const sp = ' '.repeat(n);
  const out: string[] = [];
  for (const [k, x] of Object.entries(v)) {
    const linea = enLinea(x);
    // Los enums y las listas de escalares siempre en una línea (la prueba del contrato busca los enums así).
    const escalares = Array.isArray(x) && x.every(esEscalar);
    if (linea !== null && (k === 'enum' || escalares || sp.length + k.length + 2 + linea.length <= ancho)) {
      out.push(`${sp}${clave(k)}: ${linea}`);
      continue;
    }
    if (Array.isArray(x)) {
      out.push(`${sp}${clave(k)}:`);
      for (const item of x) {
        const l = enLinea(item);
        if (l !== null && sp.length + 4 + l.length <= ancho) out.push(`${sp}  - ${l}`);
        else if (esEscalar(item)) out.push(`${sp}  - ${escalar(item, false)}`);
        else {
          const sub = bloque(item as { [k: string]: J }, n + 4, ancho);
          out.push(`${sp}  - ${(sub[0] ?? '').trimStart()}`, ...sub.slice(1));
        }
      }
      continue;
    }
    if (esEscalar(x)) {
      out.push(`${sp}${clave(k)}: ${escalar(x, false)}`);
      continue;
    }
    out.push(`${sp}${clave(k)}:`, ...bloque(x as { [k: string]: J }, n + 2, ancho));
  }
  return out;
}
