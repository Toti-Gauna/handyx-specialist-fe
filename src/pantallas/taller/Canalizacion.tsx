'use client';
// Recorrido de caños y cables (fase H1.5): medidas del ambiente y cantidad de bocas → el recorrido en 3D por circuito y
// los materiales (caño, cable por sección, cajas y curvas). Es una estimación para presupuestar.
import { useMemo, useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { Icono } from '../../components/Icono.tsx';
import { useIsla } from '../../kit/Efectos.tsx';
import { BarraSuperior } from '../../kit/Navegacion.tsx';
import { canalizar } from '../../taller/canalizacion.ts';
import { Canalizacion3D } from './Canalizacion3D.tsx';
import { AvisoRevision, CampoNumero, mostrar, numero } from './piezas.tsx';
import './taller.css';

const limitar = (v: number | null, min: number, max: number, def: number) => (v === null || Number.isNaN(v) ? def : Math.min(max, Math.max(min, v)));

export function Canalizacion() {
  const [campos, setCampos] = useState({ largo: '4', ancho: '3', alto: '2,6', luces: '2', tomas: '4', llaves: '1' });
  const isla = useIsla();
  const a = {
    largo: limitar(numero(campos.largo), 1, 20, 4),
    ancho: limitar(numero(campos.ancho), 1, 20, 3),
    alto: limitar(numero(campos.alto), 2, 6, 2.6),
    luces: Math.round(limitar(numero(campos.luces), 0, 12, 0)),
    tomas: Math.round(limitar(numero(campos.tomas), 0, 20, 0)),
    llaves: Math.round(limitar(numero(campos.llaves), 0, 6, 0)),
  };
  const clave = JSON.stringify(a);
  // Se recalcula (y se vuelve a animar) solo si cambian las medidas válidas.
  const c = useMemo(() => canalizar(JSON.parse(clave) as typeof a), [clave]);
  const set = (k: keyof typeof campos) => (v: string) => setCampos((s) => ({ ...s, [k]: v }));

  async function compartir() {
    const t = ['Recorrido de caños y cables', ...c.circuitos.map((x) => `• ${x.texto}: ${mostrar(x.metrosCano)} m de caño`), 'Materiales:', ...c.materiales.map((m) => `• ${m.cantidad} ${m.unidad === 'metro' ? 'm' : 'u.'} ${m.descripcion}`)].join('\n');
    try {
      if (navigator.share) await navigator.share({ text: t, title: 'Materiales' });
      else {
        await navigator.clipboard.writeText(t);
        isla({ titulo: 'Copiamos la lista', texto: 'Pegala donde la necesites.', icono: 'check', tono: 'exito' });
      }
    } catch {
      // Cancelar el menú de compartir no es un error.
    }
  }

  return (
    <div className="fl-pantalla tl">
      <BarraSuperior titulo="Recorrido de caños" atras={RUTAS.tallerElectricidad.ruta} textoAtras="Volver a Electricidad" acciones={null} />
      <section className="tl-escena" aria-label="Vista 3D del ambiente con el recorrido (girala con el dedo)">
        <Canalizacion3D c={c} largo={a.largo} ancho={a.ancho} alto={a.alto} />
        <ul className="tl-leyenda">
          {c.circuitos.map((x) => (
            <li key={x.id}>
              <span className={`tl-leyenda__color tl-leyenda__color--${x.id}`} aria-hidden="true" />
              {x.texto} · {mostrar(x.seccion)} mm² · {mostrar(x.metrosCano)} m de caño
            </li>
          ))}
        </ul>
      </section>
      <section className="tl-tarjeta" aria-labelledby="tl-amb3-t">
        <h2 id="tl-amb3-t" className="tl-tarjeta__titulo">El ambiente</h2>
        <div className="tl-grilla3">
          <CampoNumero etiqueta="Largo" unidad="m" valor={campos.largo} onCambio={set('largo')} />
          <CampoNumero etiqueta="Ancho" unidad="m" valor={campos.ancho} onCambio={set('ancho')} />
          <CampoNumero etiqueta="Alto" unidad="m" valor={campos.alto} onCambio={set('alto')} />
        </div>
        <div className="tl-grilla3">
          <CampoNumero etiqueta="Luces" valor={campos.luces} onCambio={set('luces')} />
          <CampoNumero etiqueta="Tomas" valor={campos.tomas} onCambio={set('tomas')} />
          <CampoNumero etiqueta="Llaves" valor={campos.llaves} onCambio={set('llaves')} />
        </div>
        <p className="tl-nota">El tablero va en la pared de la puerta. Los caños suben al techo, lo recorren y bajan a cada boca.</p>
      </section>
      <section className="tl-tarjeta" aria-labelledby="tl-mat3-t">
        <h2 id="tl-mat3-t" className="tl-tarjeta__titulo">Materiales</h2>
        {c.materiales.length ? (
          <ul className="tl-lista-bocas">
            {c.materiales.map((m) => (
              <li key={m.descripcion}>
                <span>{m.descripcion}</span>
                <strong>{m.cantidad} {m.unidad === 'metro' ? 'm' : 'u.'}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <p className="tl-nota">Agregá al menos una boca.</p>
        )}
        <button type="button" className="boton boton--claro" onClick={() => void compartir()}>
          <Icono nombre="enviar" /> Compartir la lista
        </button>
      </section>
      <AvisoRevision texto="Estimación para presupuestar: el recorrido real lo decidís en obra. El cable cuenta fase, neutro y tierra, y 30 cm de más en cada boca." />
    </div>
  );
}
