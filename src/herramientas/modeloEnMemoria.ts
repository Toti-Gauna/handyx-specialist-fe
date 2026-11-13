// El modelo 3D que se acaba de armar, de T-Escanear a T-Modelo3D (lote 2.4). Vive solo mientras la app está abierta:
// nada en el navegador ni en el servidor hasta que el profesional lo guarda en un trabajo o lo comparte.
import type { ModeloEscaneado } from './escaneo.ts';

export interface ModeloGuardado extends ModeloEscaneado {
  nombre: string;
}

let actual: ModeloGuardado | null = null;

export function dejarModelo(m: ModeloGuardado): void {
  actual = m;
}
export function modeloActual(): ModeloGuardado | null {
  return actual;
}
export function olvidarModelo(): void {
  actual = null;
}
