// Lo que pasa de una pantalla de entrar a la siguiente (lote 1.1): SOLO en memoria de la pestaña, nunca en
// localStorage, sessionStorage, IndexedDB ni cookies. Si se recarga la página se pierde y la pantalla pide volver a
// empezar (el desafío y la solicitud del servidor vencen solos a los pocos minutos).
import type { CodigoEnviado, DesafioSegundaVerificacion } from '../../contracts/seguridad.ts';

interface MemoriaAcceso {
  /** Lo que escribió en «Email o teléfono», para no hacerlo escribir dos veces. */
  identificador: string;
  /** «Recordar este teléfono». */
  recordar: boolean;
  /** Paso 2 de 2 pendiente. */
  desafio: DesafioSegundaVerificacion | null;
  /** Código para entrar sin contraseña ya pedido. */
  codigo: CodigoEnviado | null;
}

const memoria: MemoriaAcceso = { identificador: '', recordar: false, desafio: null, codigo: null };

export const leerAcceso = (): Readonly<MemoriaAcceso> => memoria;

export function guardarAcceso(cambios: Partial<MemoriaAcceso>): void {
  Object.assign(memoria, cambios);
}

/** Al entrar (o al salir) no queda nada del intento. */
export function olvidarAcceso(): void {
  Object.assign(memoria, { desafio: null, codigo: null, recordar: false });
}
