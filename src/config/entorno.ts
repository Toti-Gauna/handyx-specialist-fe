// Resolución del origen de datos. Reglas:
// - `mock`: fixtures sintéticos en memoria, con banner "Datos de prueba" siempre visible.
// - `http`: API real (api-especialista). Si falla, se muestra el error: NUNCA se cae a fixtures.
// - Las NEXT_PUBLIC_* son públicas (se compilan en el bundle): sin secretos.
export type Entorno = { origen: 'mock' } | { origen: 'http'; apiBaseUrl: string };

export interface VariablesPublicas {
  NEXT_PUBLIC_DATA_SOURCE?: string;
  NEXT_PUBLIC_API_BASE_URL?: string;
}

export class ErrorConfiguracion extends Error {
  override name = 'ErrorConfiguracion';
}

export function resolverEntorno(v: VariablesPublicas): Entorno {
  const origen = v.NEXT_PUBLIC_DATA_SOURCE?.trim() || 'mock';
  if (origen === 'mock') return { origen };
  if (origen !== 'http') throw new ErrorConfiguracion(`NEXT_PUBLIC_DATA_SOURCE inválido: "${origen}" (mock | http)`);

  const base = v.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!base) throw new ErrorConfiguracion('NEXT_PUBLIC_API_BASE_URL es obligatoria con NEXT_PUBLIC_DATA_SOURCE=http');
  let url: URL;
  try {
    url = new URL(base);
  } catch {
    throw new ErrorConfiguracion('NEXT_PUBLIC_API_BASE_URL no es una URL');
  }
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) {
    throw new ErrorConfiguracion('NEXT_PUBLIC_API_BASE_URL tiene que ser https (http solo en localhost)');
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new ErrorConfiguracion('NEXT_PUBLIC_API_BASE_URL no lleva credenciales, query ni hash');
  }
  return { origen, apiBaseUrl: url.href.replace(/\/$/, '') };
}

// Next reemplaza en build solo los accesos literales a process.env.NEXT_PUBLIC_*.
export const entorno: Entorno = resolverEntorno({
  NEXT_PUBLIC_DATA_SOURCE: process.env.NEXT_PUBLIC_DATA_SOURCE,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
});
