'use client';
// T-Nivel (lote 2.4, reemplaza el nivel de H0.1): nivel de superficie, de pared (de costado) y plomada con el giroscopio.
// Calibrar (sobre algo que sabés que está a nivel) y Fijar (congela la lectura para mirarla con calma). Abajo, la
// pendiente buscada para un desagüe o un contrapiso. En iPhone el permiso se pide con un toque (lo exige Safari); sin
// sensor, se avisa. La lectura no sale del teléfono y no se guarda. Con datos de prueba, el giroscopio es simulado.
import { sensoresPrueba } from '@handyx/origen-datos';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { describirNivel, leerNivel, MODOS_NIVEL, type ModoNivelTelefono } from '../../herramientas/nivel.ts';
import { leerNumero, mostrarNumero } from '../../herramientas/conversor.ts';
import { cumplePendiente, desnivelMm, pendientePorcentaje, suavizar, type Lectura } from '../../taller/nivel.ts';
import { Boton } from '../../ui/atomos/Boton.tsx';
import { Campo } from '../../ui/atomos/Controles.tsx';
import { Chip } from '../../ui/atomos/Texto.tsx';
import { AvisoCaja } from '../../ui/moleculas/AvisoCaja.tsx';
import { Segmento } from '../../ui/moleculas/Controles.tsx';
import { BotonOscuro } from '../../ui/organismos/Camara.tsx';
import { BurbujaNivel } from '../../ui/organismos/Nivel.tsx';
import { PantallaOscura } from '../../ui/plantillas/Oscura.tsx';
import './herramientas.css';

type Estado = 'apagado' | 'pidiendo' | 'midiendo' | 'sin_sensor' | 'denegado';

interface OrientacionConPermiso {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

export function NivelTelefono() {
  const pedido = useSearchParams().get('modo');
  const [modo, setModo] = useState<ModoNivelTelefono>(pedido === 'plomada' || pedido === 'pared' ? pedido : 'superficie');
  const [estado, setEstado] = useState<Estado>('apagado');
  const [lectura, setLectura] = useState<Lectura>({ beta: 0, gamma: 0 });
  const [cero, setCero] = useState<Lectura>({ beta: 0, gamma: 0 });
  const [fijo, setFijo] = useState<Lectura | null>(null);
  const [buscada, setBuscada] = useState('2');
  const [largo, setLargo] = useState('3');
  const suave = useRef<Lectura | null>(null);

  useEffect(() => {
    if (estado !== 'midiendo' || sensoresPrueba) return;
    let recibio = false;
    const alLeer = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;
      recibio = true;
      const s = suave.current;
      suave.current = { beta: suavizar(s?.beta ?? null, e.beta), gamma: suavizar(s?.gamma ?? null, e.gamma) };
      setLectura({ beta: Math.round(suave.current.beta * 10) / 10, gamma: Math.round(suave.current.gamma * 10) / 10 });
    };
    window.addEventListener('deviceorientation', alLeer);
    const espera = window.setTimeout(() => {
      if (!recibio) setEstado('sin_sensor');
    }, 1500);
    return () => {
      window.removeEventListener('deviceorientation', alLeer);
      window.clearTimeout(espera);
    };
  }, [estado]);

  async function activar() {
    if (sensoresPrueba) {
      setLectura(sensoresPrueba.orientacion);
      return setEstado('midiendo');
    }
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

  const midiendo = estado === 'midiendo';
  const vista = fijo ?? lectura;
  const l = leerNivel(vista, modo, cero);
  const d = describirNivel(vista, modo, cero);
  const pendiente = pendientePorcentaje(Math.abs(l.angulo));
  const calibrado = cero.beta !== 0 || cero.gamma !== 0;
  const valorBuscado = leerNumero(buscada);
  const valorLargo = leerNumero(largo);
  const ayuda = MODOS_NIVEL.find((m) => m.valor === modo)?.ayuda;

  return (
    <PantallaOscura
      titulo="Nivel"
      hrefVolver={RUTAS.tallerHerramientas.ruta}
      chip={
        midiendo ? (
          <Chip tono={calibrado ? 'exito' : 'blanco'} icono={calibrado ? 'check' : 'nivel'}>
            {calibrado ? 'Calibrado' : 'Sin calibrar'}
          </Chip>
        ) : null
      }
    >
      <Segmento
        etiqueta="Cómo apoyás el teléfono"
        opciones={MODOS_NIVEL}
        valor={modo}
        onCambio={(m) => {
          suave.current = null;
          setModo(m);
        }}
      />
      <p className="ui-lectura__texto">{ayuda}</p>
      <BurbujaNivel x={midiendo ? l.x : 0} y={midiendo ? l.y : 0} estado={midiendo ? d.estado : 'sin_medir'} />
      <p className="ui-lectura" aria-live="polite">
        <span className="ui-lectura__valor">{midiendo ? d.grados : '—'}</span>
        <span className="ui-lectura__texto">{midiendo ? `${d.texto}${fijo ? ' · lectura fija' : ''}` : 'Sin medir'}</span>
      </p>
      {estado === 'apagado' || estado === 'pidiendo' ? (
        <Boton variante="amarilla" icono="nivel" ocupado={estado === 'pidiendo'} textoOcupado="Pidiendo permiso…" onClick={() => void activar()}>
          Usar el giroscopio
        </Boton>
      ) : null}
      {midiendo ? (
        <div className="ui-botones-oscuros">
          <BotonOscuro icono="nivel" onClick={() => setCero(lectura)}>
            Calibrar
          </BotonOscuro>
          <BotonOscuro icono="candado" presionado={fijo !== null} onClick={() => setFijo(fijo ? null : lectura)}>
            {fijo ? 'Seguir midiendo' : 'Fijar'}
          </BotonOscuro>
          <BotonOscuro icono="deshacer" deshabilitado={!calibrado} onClick={() => setCero({ beta: 0, gamma: 0 })}>
            Volver a cero
          </BotonOscuro>
        </div>
      ) : null}
      {midiendo ? <p className="ui-lectura__texto">Calibrar: apoyá el teléfono sobre algo que sabés que está a nivel y tocá «Calibrar».</p> : null}
      {sensoresPrueba && midiendo ? <AvisoCaja tono="prueba">Giroscopio simulado: la inclinación es de prueba.</AvisoCaja> : null}
      {estado === 'sin_sensor' ? (
        <AvisoCaja tono="error" titulo="Este dispositivo no tiene giroscopio">
          Abrí el Taller desde tu teléfono para usar el nivel.
        </AvisoCaja>
      ) : null}
      {estado === 'denegado' ? (
        <AvisoCaja tono="error" titulo="No diste permiso al sensor de movimiento">
          Habilitalo en la configuración del navegador y volvé a intentar. La lectura no sale de tu teléfono.
        </AvisoCaja>
      ) : null}
      <section className="ui-tarjeta-oscura" aria-labelledby="tn-pendiente">
        <h2 id="tn-pendiente">Pendiente buscada</h2>
        <div className="th-fila">
          <Campo etiqueta="Pendiente (%)" inputMode="decimal" value={buscada} onChange={(e) => setBuscada(e.target.value)} ayuda="Un desagüe suele pedir entre 1 % y 2 %" />
          <Campo etiqueta="Largo del tramo (m)" inputMode="decimal" value={largo} onChange={(e) => setLargo(e.target.value)} />
        </div>
        <p aria-live="polite">
          {valorBuscado !== null && valorLargo !== null
            ? `En ${mostrarNumero(valorLargo)} m tiene que bajar ${desnivelMm(valorBuscado, valorLargo)} mm.${midiendo ? (cumplePendiente(pendiente, valorBuscado) ? ' La medida llega.' : ` Ahora medís ${mostrarNumero(pendiente, 1)} %: todavía no llega.`) : ''}`
            : 'Completá la pendiente y el largo.'}
        </p>
      </section>
    </PantallaOscura>
  );
}
