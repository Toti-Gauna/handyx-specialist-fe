import type { ErrorApi } from '../contracts/dto.ts';

// Error que ve la interfaz. `tipo` decide el texto y la acción (reintentar, volver a entrar, corregir campos).
export type TipoFallo =
  | 'red'
  | 'timeout'
  | 'sesion'
  | 'permiso'
  | 'no_encontrado'
  | 'validacion'
  | 'conflicto'
  | 'limite'
  | 'servidor'
  | 'contrato';

export class FalloApi extends Error {
  override name = 'FalloApi';
  readonly tipo: TipoFallo;
  readonly status: number | null;
  readonly detalle: ErrorApi | null;

  constructor(tipo: TipoFallo, status: number | null = null, detalle: ErrorApi | null = null) {
    super(detalle?.mensaje ?? tipo);
    this.tipo = tipo;
    this.status = status;
    this.detalle = detalle;
  }

  get requestId(): string | null {
    return this.detalle?.requestId ?? null;
  }
}

export function tipoPorStatus(status: number): TipoFallo {
  if (status === 401) return 'sesion';
  if (status === 403) return 'permiso';
  if (status === 404) return 'no_encontrado';
  if (status === 400 || status === 422) return 'validacion';
  if (status === 409) return 'conflicto';
  if (status === 413 || status === 429) return 'limite';
  return 'servidor';
}
