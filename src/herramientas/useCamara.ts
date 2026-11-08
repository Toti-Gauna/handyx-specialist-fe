'use client';
// Cámara trasera para las herramientas del teléfono (lote 2.4: medir, escanear, linterna y lupa, código de barras).
// La imagen vive solo en memoria: nada se guarda en el navegador y la cámara se apaga al salir de la pantalla.
// Con datos de prueba (`simulada`) nunca se abre la cámara: la pantalla dibuja una escena de prueba.
import { useCallback, useEffect, useRef, useState } from 'react';

export type EstadoCamara = 'apagada' | 'iniciando' | 'viva' | 'sin_camara' | 'simulada';

interface CapacidadesPista extends MediaTrackCapabilities {
  torch?: boolean;
  zoom?: { min: number; max: number; step?: number };
}

export interface Camara {
  video: React.RefObject<HTMLVideoElement | null>;
  estado: EstadoCamara;
  /** El cuadro actual en un lienzo de hasta `anchoMax` píxeles de ancho (null si no hay imagen). */
  capturar(anchoMax: number): HTMLCanvasElement | null;
  /** ¿El teléfono deja prender el flash como linterna? (Android sí; iPhone no). */
  hayLinterna: boolean;
  linterna(prendida: boolean): Promise<boolean>;
  /** Zoom óptico si lo hay; si no, la pantalla agranda la imagen. */
  zoomOptico: { min: number; max: number } | null;
  zoom(valor: number): Promise<void>;
}

export function useCamara({ activa, simulada }: { activa: boolean; simulada: boolean }): Camara {
  const video = useRef<HTMLVideoElement>(null);
  const flujo = useRef<MediaStream | null>(null);
  const [estado, setEstado] = useState<EstadoCamara>(simulada ? 'simulada' : 'apagada');
  const [hayLinterna, setHayLinterna] = useState(false);
  const [zoomOptico, setZoomOptico] = useState<{ min: number; max: number } | null>(null);

  useEffect(() => {
    if (simulada || !activa) return;
    let viva = true;
    const pedir = typeof navigator === 'undefined' ? undefined : navigator.mediaDevices?.getUserMedia?.({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 } }, audio: false });
    if (!pedir) {
      queueMicrotask(() => viva && setEstado('sin_camara'));
      return;
    }
    queueMicrotask(() => viva && setEstado('iniciando'));
    pedir
      .then((s) => {
        if (!viva) return s.getTracks().forEach((t) => t.stop());
        flujo.current = s;
        if (video.current) {
          video.current.srcObject = s;
          void video.current.play().catch(() => undefined);
        }
        const pista = s.getVideoTracks()[0];
        const cap = (pista?.getCapabilities?.() ?? {}) as CapacidadesPista;
        setHayLinterna(cap.torch === true);
        setZoomOptico(cap.zoom && cap.zoom.max > cap.zoom.min ? { min: cap.zoom.min, max: cap.zoom.max } : null);
        setEstado('viva');
      })
      .catch(() => viva && setEstado('sin_camara'));
    return () => {
      viva = false;
      flujo.current?.getTracks().forEach((t) => t.stop());
      flujo.current = null;
    };
  }, [activa, simulada]);

  const capturar = useCallback((anchoMax: number) => {
    const v = video.current;
    if (!v || !v.videoWidth) return null;
    const escala = Math.min(1, anchoMax / v.videoWidth);
    const c = document.createElement('canvas');
    c.width = Math.round(v.videoWidth * escala);
    c.height = Math.round(v.videoHeight * escala);
    const g = c.getContext('2d', { willReadFrequently: true });
    if (!g) return null;
    g.drawImage(v, 0, 0, c.width, c.height);
    return c;
  }, []);

  const pista = () => flujo.current?.getVideoTracks()[0] ?? null;

  const linterna = useCallback(async (prendida: boolean) => {
    const p = pista();
    if (!p) return false;
    try {
      await p.applyConstraints({ advanced: [{ torch: prendida } as MediaTrackConstraintSet] });
      return true;
    } catch {
      return false;
    }
  }, []);

  const zoom = useCallback(async (valor: number) => {
    const p = pista();
    if (!p) return;
    try {
      await p.applyConstraints({ advanced: [{ zoom: valor } as MediaTrackConstraintSet] });
    } catch {
      // Sin zoom óptico: la pantalla agranda la imagen.
    }
  }, []);

  return { video, estado: simulada ? 'simulada' : estado, capturar, hayLinterna, linterna, zoomOptico, zoom };
}
