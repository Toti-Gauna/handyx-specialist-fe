'use client';
// Linterna y lupa (lote 2.4): el flash del teléfono como linterna (Android; en iPhone Safari no lo deja y se dice) y la
// cámara como lupa (zoom de la cámara si lo tiene; si no, se agranda la imagen) para leer la chapa de un equipo o un
// número chico. «Congelar» deja la imagen quieta para leerla con calma. No se saca ni se guarda ninguna foto.
import { sensoresPrueba } from '@handyx/origen-datos';
import { useLayoutEffect, useRef, useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { useCamara } from '../../herramientas/useCamara.ts';
import { Chip } from '../../ui/atomos/Texto.tsx';
import { AvisoCaja } from '../../ui/moleculas/AvisoCaja.tsx';
import { BotonOscuro, PantallaCamara, VideoCamara } from '../../ui/organismos/Camara.tsx';
import './herramientas.css';

const ZOOMS = [1, 2, 4] as const;

export function LinternaLupa() {
  const cam = useCamara({ activa: true, simulada: sensoresPrueba !== null });
  const [luz, setLuz] = useState(false);
  const [zoom, setZoom] = useState<(typeof ZOOMS)[number]>(1);
  const [congelada, setCongelada] = useState(false);
  const [sinLuz, setSinLuz] = useState(false);
  const fondo = useRef<HTMLDivElement>(null);
  const simulada = sensoresPrueba !== null;
  const hayLinterna = simulada || cam.hayLinterna;

  // Sin zoom de la cámara, se agranda la imagen (variable CSS fijada desde código).
  useLayoutEffect(() => {
    fondo.current?.style.setProperty('--lupa', String(cam.zoomOptico ? 1 : zoom));
  }, [zoom, cam.zoomOptico]);

  async function alternarLuz() {
    if (simulada) return setLuz(!luz);
    const ok = await cam.linterna(!luz);
    if (ok) setLuz(!luz);
    else setSinLuz(true);
  }

  async function elegirZoom(z: (typeof ZOOMS)[number]) {
    setZoom(z);
    if (cam.zoomOptico) await cam.zoom(Math.min(cam.zoomOptico.max, Math.max(cam.zoomOptico.min, z)));
  }

  function congelar() {
    const v = cam.video.current;
    if (v) {
      if (congelada) void v.play().catch(() => undefined);
      else v.pause();
    }
    setCongelada(!congelada);
  }

  return (
    <PantallaCamara
      titulo="Linterna y lupa"
      hrefVolver={RUTAS.tallerHerramientas.ruta}
      tono="oscuro"
      chip={
        <Chip tono={luz ? 'amarillo' : 'blanco'} icono="linterna">
          {luz ? 'Linterna prendida' : 'Linterna apagada'}
        </Chip>
      }
      fondo={
        <div ref={fondo} className={`th-lupa${luz && simulada ? ' th-lupa--luz' : ''}${congelada ? ' th-lupa--quieta' : ''}`}>
          {sensoresPrueba ? <sensoresPrueba.Escena tipo="lupa" /> : <VideoCamara video={cam.video} />}
        </div>
      }
      panel={
        <>
          {simulada ? <AvisoCaja tono="prueba">{sensoresPrueba?.aviso}</AvisoCaja> : null}
          {cam.estado === 'sin_camara' ? <AvisoCaja tono="error" titulo="No pudimos abrir la cámara">Revisá el permiso de la cámara en el navegador y volvé a entrar.</AvisoCaja> : null}
          {!hayLinterna || sinLuz ? <AvisoCaja tono="info">Este teléfono no deja prender el flash desde la app (pasa en iPhone). Usá la linterna del teléfono desde su menú.</AvisoCaja> : null}
          <div className="ui-botones-oscuros">
            <BotonOscuro icono="linterna" presionado={luz} deshabilitado={!hayLinterna} onClick={() => void alternarLuz()}>
              {luz ? 'Apagar la linterna' : 'Prender la linterna'}
            </BotonOscuro>
            <BotonOscuro icono={congelada ? 'play' : 'pausa'} presionado={congelada} onClick={congelar}>
              {congelada ? 'Seguir' : 'Congelar'}
            </BotonOscuro>
          </div>
          <div className="ui-botones-oscuros" role="group" aria-label="Lupa: cuánto agrandar">
            {ZOOMS.map((z) => (
              <BotonOscuro key={z} icono="lupa" presionado={zoom === z} onClick={() => void elegirZoom(z)}>
                {z === 1 ? 'Sin lupa' : `Lupa ${z}×`}
              </BotonOscuro>
            ))}
          </div>
        </>
      }
    />
  );
}
