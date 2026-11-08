'use client';
// Lector de códigos de barras (lote 2.4: sumar una herramienta; lo puede usar el Modo trabajo). En Android, el lector
// del teléfono (BarcodeDetector) mira la cámara y avisa cuando lo encuentra; en iPhone no existe: se escriben los
// números (siempre se puede, también en Android). El código se lee en el teléfono: no se manda ninguna foto.
// Con datos de prueba, la cámara es simulada y un botón «lee» el código de prueba.
import { useEffect, useState, type FormEvent } from 'react';
import type { SensoresPrueba } from '../../data/sensores.ts';
import { useCamara } from '../../herramientas/useCamara.ts';
import { Boton } from '../atomos/Boton.tsx';
import { Campo } from '../atomos/Controles.tsx';
import { VideoCamara } from './Camara.tsx';
import '../herramientas.css';

interface Detector {
  detect(fuente: HTMLVideoElement): Promise<{ rawValue: string }[]>;
}
type ConDetector = typeof globalThis & { BarcodeDetector?: new (o: { formats: string[] }) => Detector };

/** ¿El teléfono trae lector de códigos? (Chrome de Android, sí; Safari de iPhone, no). */
export const hayLectorNativo = () => typeof globalThis !== 'undefined' && typeof (globalThis as ConDetector).BarcodeDetector === 'function';

const VALIDO = /^[0-9A-Za-z-]{4,32}$/;

export function LectorCodigo({ simulada, onCodigo, ocupado = false }: { simulada: SensoresPrueba | null; onCodigo(codigo: string): void; ocupado?: boolean }) {
  const [nativo] = useState(hayLectorNativo);
  const cam = useCamara({ activa: nativo && !simulada, simulada: simulada !== null });
  const [escrito, setEscrito] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!nativo || simulada || cam.estado !== 'viva' || !cam.video.current) return;
    const Clase = (globalThis as ConDetector).BarcodeDetector;
    if (!Clase) return;
    const detector = new Clase({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'] });
    const video = cam.video.current;
    let vivo = true;
    const mirar = async () => {
      if (!vivo) return;
      try {
        const hallados = await detector.detect(video);
        const valor = hallados.find((h) => VALIDO.test(h.rawValue))?.rawValue;
        if (valor && vivo) return onCodigo(valor);
      } catch {
        // Cuadro sin imagen todavía: se prueba en el siguiente.
      }
      if (vivo) window.setTimeout(() => void mirar(), 400);
    };
    void mirar();
    return () => {
      vivo = false;
    };
  }, [nativo, simulada, cam.estado, cam.video, onCodigo]);

  function enviar(e: FormEvent) {
    e.preventDefault();
    const v = escrito.replace(/\s/g, '');
    if (!VALIDO.test(v)) return setError('Escribí los números que están debajo de las barras.');
    setError(null);
    onCodigo(v);
  }

  const conCamara = simulada !== null || (nativo && cam.estado !== 'sin_camara');
  return (
    <div className="ui-lector">
      {conCamara ? (
        <div className="ui-lector__visor">
          {simulada ? <simulada.Escena tipo="codigo" /> : <VideoCamara video={cam.video} />}
          <span className="ui-lector__marco" aria-hidden="true" />
        </div>
      ) : null}
      <p className="ui-lector__estado" aria-live="polite">
        {simulada ? simulada.aviso : nativo ? (cam.estado === 'sin_camara' ? 'No pudimos abrir la cámara. Escribí los números del código.' : 'Apuntá al código de barras y esperá: se lee solo.') : 'Tu teléfono no lee códigos solo. Escribí los números que están debajo de las barras.'}
      </p>
      {simulada ? (
        <Boton variante="contorno" icono="escaner" ocupado={ocupado} textoOcupado="Buscando…" onClick={() => onCodigo(simulada.codigoBarras)}>
          Leer el código de prueba
        </Boton>
      ) : null}
      <form className="ui-lector__form" onSubmit={enviar} noValidate>
        <Campo etiqueta="Números del código" inputMode="numeric" autoComplete="off" value={escrito} onChange={(e) => setEscrito(e.target.value)} error={error} maxLength={40} />
        <Boton type="submit" variante="contorno" ocupado={ocupado} textoOcupado="Buscando…">
          Buscar este código
        </Boton>
      </form>
    </div>
  );
}
