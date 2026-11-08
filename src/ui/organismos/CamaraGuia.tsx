'use client';
// Cámara con guía (lote 1.2: selfie con óvalo en RG-5, DNI con marco en RG-6). La foto vive solo en memoria hasta que
// la pantalla la manda: nada en el navegador (ni almacenamiento ni caché) y la cámara se apaga al salir.
// - Con la API real: cámara en vivo; si no hay cámara o no dan permiso, se elige una foto del teléfono.
// - Con datos de prueba (`simulada`): visor simulado, nunca se abre la cámara ni se usa una foto real.
// Sacar la foto es un botón (no hay gestos) y antes de usarla se puede repetir.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Boton } from '../atomos/Boton.tsx';
import { Icono } from '../atomos/Icono.tsx';
import '../registro.css';

export interface CamaraSimulada {
  Visor: (p: { modo: 'documento' | 'selfie' }) => ReactNode;
  disparo: string;
  aviso: string;
  sello: string;
}

type Estado = 'iniciando' | 'vivo' | 'sin_camara';

export function CamaraGuia({
  guia,
  titulo,
  texto,
  consejos = [],
  arriba,
  simulada,
  textoDisparo = 'Sacar la foto',
  textoUsar = 'Usar esta foto',
  ocupado = false,
  onFoto,
}: {
  guia: 'ovalo' | 'marco';
  /** Qué se fotografía ("Tu cara", "Dorso del DNI"): nombre de la sección y texto alternativo de la foto. */
  titulo: string;
  /** Indicación sobre el visor ("Mirá a la cámara"). */
  texto: string;
  consejos?: readonly string[];
  /** Algo arriba del visor (chips «Frente» / «Dorso»). */
  arriba?: ReactNode;
  simulada: CamaraSimulada | null;
  textoDisparo?: string;
  textoUsar?: string;
  ocupado?: boolean;
  onFoto(foto: Blob | null): void | Promise<void>;
}) {
  const modo = guia === 'ovalo' ? 'selfie' : 'documento';
  const video = useRef<HTMLVideoElement>(null);
  const flujo = useRef<MediaStream | null>(null);
  const archivo = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<Estado>(simulada ? 'vivo' : 'iniciando');
  const [foto, setFoto] = useState<{ blob: Blob | null; url: string | null } | null>(null);

  useEffect(() => {
    if (simulada) return;
    let vivo = true;
    const pedir = navigator.mediaDevices?.getUserMedia?.({ video: { facingMode: modo === 'selfie' ? 'user' : { ideal: 'environment' }, width: { ideal: 1920 } }, audio: false });
    if (!pedir) {
      setEstado('sin_camara');
      return;
    }
    pedir
      .then((s) => {
        if (!vivo) return s.getTracks().forEach((t) => t.stop());
        flujo.current = s;
        if (video.current) video.current.srcObject = s;
        setEstado('vivo');
      })
      .catch(() => vivo && setEstado('sin_camara'));
    return () => {
      vivo = false;
      flujo.current?.getTracks().forEach((t) => t.stop());
      flujo.current = null;
    };
  }, [simulada, modo]);

  useEffect(
    () => () => {
      if (foto?.url) URL.revokeObjectURL(foto.url);
    },
    [foto],
  );

  function sacar() {
    if (simulada) return setFoto({ blob: null, url: null });
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement('canvas');
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d')?.drawImage(v, 0, 0);
    c.toBlob((b) => b && setFoto({ blob: b, url: URL.createObjectURL(b) }), 'image/jpeg', 0.85);
  }

  const Visor = simulada?.Visor;
  return (
    <section className="ui-camara" aria-label={titulo}>
      <div className={`ui-camara__visor ui-camara__visor--${guia}`}>
        {Visor ? (
          <Visor modo={modo} />
        ) : (
          <>
            <video ref={video} className="ui-camara__video" autoPlay playsInline muted aria-hidden="true" />
            {foto?.url ? <img className="ui-camara__foto" src={foto.url} alt={`Foto sacada: ${titulo}`} /> : null}
          </>
        )}
        <span className="ui-camara__guia" aria-hidden="true" />
        {arriba ? <span className="ui-camara__arriba">{arriba}</span> : null}
        <span className="ui-camara__texto" aria-hidden="true">
          {foto ? 'Revisá la foto antes de usarla' : texto}
        </span>
        {simulada ? <span className="ui-camara__aviso">{simulada.aviso}</span> : null}
        {foto && simulada ? <span className="ui-camara__sello">{simulada.sello}</span> : null}
      </div>
      <p className="visualmente-oculto" role="status">
        {foto ? 'Foto sacada. Revisala antes de usarla.' : estado === 'vivo' ? `Cámara lista. ${texto}.` : estado === 'sin_camara' ? 'No hay cámara disponible: elegí una foto del teléfono.' : ''}
      </p>
      {consejos.length > 0 ? (
        <ul className="ui-camara__consejos">
          {consejos.map((c) => (
            <li key={c}>
              <Icono nombre="check" tam="chico" /> {c}
            </li>
          ))}
        </ul>
      ) : null}
      {estado === 'sin_camara' && !foto ? (
        <>
          <input
            ref={archivo}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture={modo === 'selfie' ? 'user' : 'environment'}
            className="visualmente-oculto"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) setFoto({ blob: f, url: URL.createObjectURL(f) });
            }}
          />
          <Boton icono="subir" onClick={() => archivo.current?.click()}>
            Elegir una foto del teléfono
          </Boton>
        </>
      ) : foto ? (
        <div className="ui-camara__botones">
          <Boton icono="camara" ocupado={ocupado} textoOcupado="Guardando…" onClick={() => void onFoto(foto.blob)}>
            {textoUsar}
          </Boton>
          <Boton variante="contorno" disabled={ocupado} onClick={() => setFoto(null)}>
            Sacarla de nuevo
          </Boton>
        </div>
      ) : (
        <Boton icono="camara" disabled={estado !== 'vivo'} onClick={sacar}>
          {simulada?.disparo ?? textoDisparo}
        </Boton>
      )}
    </section>
  );
}
