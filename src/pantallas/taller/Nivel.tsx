'use client';
// Nivel y pendiente (fase H0) con el giroscopio. En iPhone el permiso se pide con un toque (lo exige Safari); sin
// sensor (computadora), se avisa. La lectura no sale del teléfono y no se guarda.
import { gsap } from 'gsap';
import { useEffect, useRef, useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { Icono } from '../../components/Icono.tsx';
import { Aviso } from '../../components/ui.tsx';
import { BarraSuperior } from '../../kit/Navegacion.tsx';
import { sinMovimiento } from '../../kit/movimiento.ts';
import { anguloDe, calibrado, cumplePendiente, desnivelMm, estadoNivel, pendientePorcentaje, suavizar, type ModoNivel } from '../../taller/nivel.ts';
import { CampoNumero, mostrar, numero, Opciones } from './piezas.tsx';
import './taller.css';

type Estado = 'apagado' | 'pidiendo' | 'midiendo' | 'sin_sensor' | 'denegado';

interface OrientacionConPermiso {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

const ESTADO_TEXTO = { a_nivel: 'A nivel', casi: 'Casi a nivel', fuera: 'Fuera de nivel' } as const;

export function Nivel() {
  const [estado, setEstado] = useState<Estado>('apagado');
  const [modo, setModo] = useState<ModoNivel>('plano');
  const [angulo, setAngulo] = useState(0);
  const [cero, setCero] = useState(0);
  const [buscada, setBuscada] = useState('2');
  const [largo, setLargo] = useState('3');
  const suave = useRef<number | null>(null);
  const burbuja = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (estado !== 'midiendo') return;
    let recibio = false;
    const alLeer = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;
      recibio = true;
      suave.current = suavizar(suave.current, anguloDe({ beta: e.beta, gamma: e.gamma }, modo));
      setAngulo(Math.round(suave.current * 10) / 10);
    };
    window.addEventListener('deviceorientation', alLeer);
    const espera = window.setTimeout(() => {
      if (!recibio) setEstado('sin_sensor');
    }, 1500);
    return () => {
      window.removeEventListener('deviceorientation', alLeer);
      window.clearTimeout(espera);
    };
  }, [estado, modo]);

  const medido = calibrado(angulo, cero);
  const pendiente = pendientePorcentaje(medido);
  const nivel = estadoNivel(medido);

  // La burbuja se mueve con GSAP (o salta, sin movimiento): ±10° ocupan todo el tubo.
  useEffect(() => {
    if (!burbuja.current) return;
    const x = `${Math.max(-46, Math.min(46, (medido / 10) * 46))}%`;
    if (sinMovimiento()) gsap.set(burbuja.current, { xPercent: 0, left: `calc(50% + ${x})` });
    else gsap.to(burbuja.current, { left: `calc(50% + ${x})`, duration: 0.25, ease: 'power2.out' });
  }, [medido]);

  async function activar() {
    const D = typeof DeviceOrientationEvent === 'undefined' ? null : (DeviceOrientationEvent as unknown as OrientacionConPermiso);
    if (!D) return setEstado('sin_sensor');
    if (typeof D.requestPermission === 'function') {
      setEstado('pidiendo');
      try {
        if ((await D.requestPermission()) !== 'granted') return setEstado('denegado');
      } catch {
        return setEstado('denegado');
      }
    }
    setEstado('midiendo');
  }

  const valorBuscado = numero(buscada);
  const valorLargo = numero(largo);

  return (
    <div className="fl-pantalla tl">
      <BarraSuperior titulo="Nivel y pendiente" atras={RUTAS.taller.ruta} textoAtras="Volver al Taller" acciones={null} />
      <Opciones
        etiqueta="Cómo apoyás el celular"
        opciones={[{ valor: 'plano' as const, texto: 'Acostado sobre la superficie' }, { valor: 'canto' as const, texto: 'De costado sobre un caño o listón' }]}
        valor={modo}
        onCambio={(m) => {
          suave.current = null;
          setModo(m);
        }}
      />
      <section className={`tl-nivel${estado === 'midiendo' ? ` tl-nivel--${nivel}` : ''}`} aria-labelledby="tl-nivel-t">
        <h2 id="tl-nivel-t" className="visualmente-oculto">Lectura del nivel</h2>
        <div className="tl-tubo" aria-hidden="true">
          <span className="tl-tubo__marca" />
          <span ref={burbuja} className="tl-tubo__burbuja" />
        </div>
        <p className="tl-nivel__grados" aria-live="polite">
          {estado === 'midiendo' ? `${mostrar(medido, 1)}° · ${mostrar(pendiente, 1)} %` : '—'}
        </p>
        <p className="tl-estado">
          <Icono nombre={estado !== 'midiendo' ? 'info' : nivel === 'a_nivel' ? 'checkCirculo' : 'alerta'} /> {estado === 'midiendo' ? ESTADO_TEXTO[nivel] : 'Sin medir'}
        </p>
      </section>

      {estado === 'apagado' || estado === 'pidiendo' ? (
        <button type="button" className="boton" onClick={() => void activar()} disabled={estado === 'pidiendo'}>
          Usar el giroscopio
        </button>
      ) : null}
      {estado === 'midiendo' ? (
        <button type="button" className="boton boton--claro" onClick={() => setCero(angulo)}>
          Calibrar: el celular está sobre algo a nivel
        </button>
      ) : null}
      {estado === 'sin_sensor' ? (
        <Aviso tono="aviso" icono="alerta" titulo="Este dispositivo no tiene giroscopio">
          Abrí el Taller desde tu celular para usar el nivel.
        </Aviso>
      ) : null}
      {estado === 'denegado' ? (
        <Aviso tono="aviso" icono="alerta" titulo="No diste permiso al sensor de movimiento">
          Habilitalo en la configuración del navegador y volvé a intentar. La lectura no sale de tu celular.
        </Aviso>
      ) : null}

      <section className="tl-tarjeta" aria-labelledby="tl-pend-t">
        <h2 id="tl-pend-t" className="tl-tarjeta__titulo">Pendiente buscada</h2>
        <div className="tl-grilla2">
          <CampoNumero etiqueta="Pendiente" unidad="%" valor={buscada} onCambio={setBuscada} ayuda="Un desagüe suele pedir entre 1 % y 2 %" />
          <CampoNumero etiqueta="Largo del tramo" unidad="m" valor={largo} onCambio={setLargo} />
        </div>
        <p className="tl-destacado" aria-live="polite">
          {valorBuscado !== null && valorLargo !== null
            ? `En ${mostrar(valorLargo)} m tiene que bajar ${desnivelMm(valorBuscado, valorLargo)} mm.${estado === 'midiendo' ? (cumplePendiente(pendiente, valorBuscado) ? ' La medida llega.' : ' La medida no llega todavía.') : ''}`
            : 'Completá la pendiente y el largo.'}
        </p>
      </section>
    </div>
  );
}
