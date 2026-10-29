// Detección de dispositivos de Apple para ofrecer "Continuar con Apple" solo ahí (decisión de Ignacio del 29/10/2026).
// iPadOS se presenta como "Macintosh": se cuenta como Apple igual (Mac o iPad).

export interface DatosNavegador {
  userAgent: string;
  /** navigator.userAgentData?.platform cuando existe (Chromium). */
  plataforma?: string | undefined;
}

export function esDispositivoApple({ userAgent, plataforma }: DatosNavegador): boolean {
  if (plataforma) return /^(macOS|iOS|iPadOS)$/i.test(plataforma);
  return /iPhone|iPad|iPod|Macintosh/.test(userAgent);
}
