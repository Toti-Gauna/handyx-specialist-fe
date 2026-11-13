// Textos de error de las pantallas de entrar (lote 1.1): palabras simples, qué pasó y qué hacer. Nunca dicen si una
// cuenta existe. Lo que manda el servidor en `mensaje` se usa solo en los errores del código (intentos que quedan).
import type { FalloApi } from '../../data/errores.ts';

export type Contexto = 'clave' | 'codigo' | 'pedido' | 'recuperar';

export function mensajeAcceso(f: FalloApi, contexto: Contexto): string {
  if (f.tipo === 'red' || f.tipo === 'timeout') return 'No pudimos conectarnos. Revisá tu conexión y probá de nuevo.';
  if (f.status === 503 && f.detalle?.codigo === 'servicio_no_disponible' && contexto === 'pedido')
    return 'Los mensajes de texto no están disponibles por ahora. Elegí el email.';
  if (f.tipo === 'limite') return contexto === 'clave' ? 'Hiciste demasiados intentos. Esperá unos minutos y probá de nuevo.' : (f.detalle?.mensaje ?? 'Probaste demasiadas veces. Esperá unos minutos.');
  if (f.tipo === 'sesion') return contexto === 'clave' ? 'El email, el teléfono o la contraseña no son correctos.' : 'Pasó mucho tiempo. Volvé a entrar.';
  if (f.tipo === 'validacion') {
    if (contexto === 'codigo') return f.detalle?.mensaje ?? 'El código no es correcto.';
    if (contexto === 'clave') return 'Revisá el email o teléfono y la contraseña.';
    return 'Revisá el email o el teléfono.';
  }
  return 'Algo falló de nuestro lado. Probá de nuevo en un rato.';
}

/** Después de un código equivocado, el foco vuelve al campo del código para probar de nuevo (lo anuncia el lector). */
export function enfocarCodigo(): void {
  requestAnimationFrame(() => document.querySelector<HTMLInputElement>('input[autocomplete="one-time-code"]')?.focus());
}
