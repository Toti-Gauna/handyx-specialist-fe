'use client';
// Ohm y referencias (fase H1): ley de Ohm con dos datos cualesquiera, colores de conductores y seguridad antes de trabajar.
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { Icono } from '../../components/Icono.tsx';
import { BarraSuperior } from '../../kit/Navegacion.tsx';
import { COLORES_CONDUCTORES, leyDeOhm, SEGURIDAD_ANTES_DE_TRABAJAR, type Magnitud } from '../../taller/electricidad.ts';
import { CampoNumero, mostrar, numero } from './piezas.tsx';
import './taller.css';

const MAGNITUD: Record<Magnitud, { texto: string; unidad: string }> = {
  tension: { texto: 'Tensión', unidad: 'V' },
  corriente: { texto: 'Corriente', unidad: 'A' },
  resistencia: { texto: 'Resistencia', unidad: 'Ω' },
  potencia: { texto: 'Potencia', unidad: 'W' },
};
const ORDEN: Magnitud[] = ['tension', 'corriente', 'resistencia', 'potencia'];

export function Ohm() {
  const [valores, setValores] = useState<Record<Magnitud, string>>({ tension: '220', corriente: '', resistencia: '', potencia: '2200' });
  const cargados = Object.fromEntries(ORDEN.map((m) => [m, numero(valores[m]) ?? undefined]).filter(([, v]) => v !== undefined));
  const r = leyDeOhm(cargados);
  const cuantos = Object.keys(cargados).length;

  return (
    <div className="fl-pantalla tl">
      <BarraSuperior titulo="Ohm y referencias" atras={RUTAS.tallerElectricidad.ruta} textoAtras="Volver a Electricidad" acciones={null} />
      <section className="tl-tarjeta" aria-labelledby="tl-ohm-t">
        <h2 id="tl-ohm-t" className="tl-tarjeta__titulo">Ley de Ohm y potencia</h2>
        <p className="tl-nota">Completá dos datos y te calculamos los otros dos.</p>
        <div className="tl-grilla2">
          {ORDEN.map((m) => (
            <CampoNumero key={m} etiqueta={MAGNITUD[m].texto} unidad={MAGNITUD[m].unidad} valor={valores[m]} onCambio={(v) => setValores((s) => ({ ...s, [m]: v }))} />
          ))}
        </div>
        <p className="tl-destacado" aria-live="polite">
          {cuantos > 2 ? 'Dejá solo dos datos completos.' : r ? ORDEN.map((m) => `${MAGNITUD[m].texto}: ${mostrar(r[m], 2)} ${MAGNITUD[m].unidad}`).join(' · ') : 'Faltan datos.'}
        </p>
      </section>

      <section className="tl-tarjeta" aria-labelledby="tl-col-t">
        <h2 id="tl-col-t" className="tl-tarjeta__titulo">Colores de los conductores</h2>
        <ul className="tl-colores">
          {COLORES_CONDUCTORES.map((c, i) => (
            <li key={c.funcion}>
              <span className={`tl-color tl-color--${i}`} aria-hidden="true" />
              <span>{c.funcion}</span>
              <strong>{c.color}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section className="tl-tarjeta tl-tarjeta--seguridad" aria-labelledby="tl-seg-t">
        <h2 id="tl-seg-t" className="tl-tarjeta__titulo">
          <Icono nombre="escudo" /> Antes de trabajar
        </h2>
        <ol className="tl-pasos">
          {SEGURIDAD_ANTES_DE_TRABAJAR.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ol>
        <p className="tl-nota">El celular no detecta tensión: usá siempre un instrumento.</p>
      </section>
    </div>
  );
}
