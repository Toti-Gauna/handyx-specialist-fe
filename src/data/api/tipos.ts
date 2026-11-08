// Tipos comunes a todos los dominios del puerto de datos.

export interface Pagina<T> {
  items: T[];
  siguienteCursor: string | null;
}

/** Idempotency-Key: la genera la pantalla una vez por intención y la reusa al reintentar. */
export type ClaveIdempotencia = string;
