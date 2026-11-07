// Preferencia de movimiento del sistema. El CSS ya anima solo con `no-preference`; esto cubre lo que se anima desde JS
// (confeti, contador de montos, hoja que se suelta).
export function sinMovimiento(): boolean {
  return typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
