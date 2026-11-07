// Fuente de ubicación del teléfono (lote 4.3). La pantalla En camino la pide solo después de explicar para qué, y solo
// mientras está abierta: al salir se deja de leer el GPS. En la vista previa, el mock la reemplaza por un GPS simulado
// que se controla desde el Panel de prueba (señal normal, imprecisa, sin señal o sin permiso).
import type { Punto } from '../contracts/dto.ts';

export interface Lectura {
  punto: Punto;
  precisionM: number;
  enMs: number;
}

/** permiso: el usuario lo negó · no_disponible: el teléfono no tiene GPS o está apagado · tiempo: no llegó una lectura. */
export type ErrorUbicacion = 'permiso' | 'no_disponible' | 'tiempo';
export type EstadoPermiso = 'concedido' | 'denegado' | 'preguntar' | 'desconocido';

export interface FuenteUbicacion {
  /** Lo que el navegador informa del permiso, sin pedirlo. */
  permiso(): Promise<EstadoPermiso>;
  /** Empieza a leer (la primera vez, el navegador pregunta). Devuelve cómo dejar de leer. */
  observar(alLeer: (l: Lectura) => void, alFallar: (e: ErrorUbicacion) => void): () => void;
}

/** La ubicación real del navegador (producción). */
export function fuenteNavegador(): FuenteUbicacion {
  return {
    async permiso() {
      try {
        const p = await navigator.permissions?.query({ name: 'geolocation' });
        if (!p) return 'desconocido';
        return p.state === 'granted' ? 'concedido' : p.state === 'denied' ? 'denegado' : 'preguntar';
      } catch {
        return 'desconocido';
      }
    },
    observar(alLeer, alFallar) {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        alFallar('no_disponible');
        return () => undefined;
      }
      const id = navigator.geolocation.watchPosition(
        (p) => alLeer({ punto: { lat: p.coords.latitude, lng: p.coords.longitude }, precisionM: p.coords.accuracy, enMs: p.timestamp }),
        (e) => alFallar(e.code === e.PERMISSION_DENIED ? 'permiso' : e.code === e.POSITION_UNAVAILABLE ? 'no_disponible' : 'tiempo'),
        { enableHighAccuracy: true, maximumAge: 5_000, timeout: 20_000 },
      );
      return () => navigator.geolocation.clearWatch(id);
    },
  };
}
