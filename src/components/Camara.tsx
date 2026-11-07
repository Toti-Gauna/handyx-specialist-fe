'use client';
// Cámara con marco (lote 4.4): rectángulo para el DNI y óvalo para la selfie. La foto vive solo en memoria hasta que se
// manda al servidor: nada en el navegador (ni almacenamiento ni caché) y la cámara se apaga al terminar.
// - Producción: cámara en vivo (getUserMedia). Si no hay cámara o no dan permiso, se elige una foto del teléfono.
// - Vista previa (mock): visor simulado. Nunca se abre la cámara ni se usa una foto real.
import { camaraPrueba } from '@handyx/origen-datos';
import { useEffect, useId, useRef, useState } from 'react';
import { Icono } from './Icono.tsx';
import './camara.css';

interface Props {
  modo: 'documento' | 'selfie';
  /** "Frente del DNI", "Tu cara"… */
  titulo: string;
  consejos: string[];
  /** La foto tomada (null con datos de prueba: no hay archivo). */
  onFoto(foto: Blob | null): void | Promise<void>;
  /** Texto del botón final ("Usar esta foto", "Seguir con el dorso"…). */
  textoUsar?: string;
  ocupado?: boolean;
}

type Estado = 'iniciando' | 'vivo' | 'vista' | 'sin_camara';

export function Camara({ modo, titulo, consejos, onFoto, textoUsar = 'Usar esta foto', ocupado = false }: Props) {
  const simulada = camaraPrueba !== null;
  const video = useRef<HTMLVideoElement>(null);
  const flujo = useRef<MediaStream | null>(null);
  const archivo = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<Estado>(simulada ? 'vivo' : 'iniciando');
  const [foto, setFoto] = useState<{ blob: Blob | null; url: string | null } | null>(null);
  const ayuda = useId();

  // Cámara en vivo (solo con la API real). Se apaga al salir.
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

  // La vista previa usa una URL temporal en memoria: se libera al cambiar o al salir.
  useEffect(() => () => {
    if (foto?.url) URL.revokeObjectURL(foto.url);
  }, [foto]);

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

  async function usar() {
    if (!foto) return;
    await onFoto(foto.blob);
  }

  return (
    <section className={`hx-camara hx-camara--${modo}`} aria-labelledby={`${ayuda}-t`}>
      <h3 id={`${ayuda}-t`} className="hx-camara__titulo">
        {titulo}
      </h3>
      <div className="hx-camara__visor" data-camara={estado}>
        {camaraPrueba ? (
          <camaraPrueba.Visor modo={modo} />
        ) : (
          // El video sigue montado debajo de la foto: "Repetir" vuelve a la cámara sin pedirla de nuevo.
          <>
            <video ref={video} className="hx-camara__video" autoPlay playsInline muted aria-hidden="true" />
            {foto?.url ? <img className="hx-camara__foto" src={foto.url} alt={`Foto sacada: ${titulo}`} /> : null}
          </>
        )}
        <span className="hx-camara__marco" aria-hidden="true" />
        {camaraPrueba ? <span className="hx-camara__aviso">{camaraPrueba.aviso}</span> : null}
        {foto && camaraPrueba ? <span className="hx-camara__sello">{camaraPrueba.sello}</span> : null}
      </div>

      <p className="visualmente-oculto" role="status">
        {estado === 'vivo' && !foto ? 'Cámara lista.' : foto ? 'Foto sacada. Revisala antes de usarla.' : estado === 'sin_camara' ? 'No hay cámara disponible: elegí una foto.' : ''}
      </p>

      <ul className="hx-camara__consejos">
        {consejos.map((c) => (
          <li key={c}>
            <Icono nombre="check" /> {c}
          </li>
        ))}
      </ul>

      {estado === 'sin_camara' && !foto ? (
        <>
          <input
            ref={archivo}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture={modo === 'selfie' ? 'user' : 'environment'}
            className="visualmente-oculto"
            aria-label={`Elegir una foto: ${titulo}`}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) setFoto({ blob: f, url: URL.createObjectURL(f) });
            }}
          />
          <button type="button" className="boton boton--bloque" onClick={() => archivo.current?.click()}>
            <Icono nombre="imagen" /> Elegir una foto
          </button>
        </>
      ) : foto ? (
        <div className="botones botones--fila">
          <button type="button" className="boton boton--claro" disabled={ocupado} onClick={() => setFoto(null)}>
            <Icono nombre="reintentar" /> Repetir
          </button>
          <button type="button" className="boton" disabled={ocupado} onClick={() => void usar()}>
            {ocupado ? 'Guardando…' : textoUsar}
          </button>
        </div>
      ) : (
        <button type="button" className="boton boton--bloque hx-camara__disparo" disabled={estado !== 'vivo'} onClick={sacar}>
          <Icono nombre="camara" /> {camaraPrueba?.disparo ?? 'Sacar foto'}
        </button>
      )}
    </section>
  );
}
