'use client';
// Planificador de vivienda (fase H1): ambientes y metros → grado de electrificación, circuitos y bocas mínimas.
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { Icono } from '../../components/Icono.tsx';
import { BarraSuperior } from '../../kit/Navegacion.tsx';
import { AMBIENTE, AMBIENTES, GRADO, planificarVivienda, REVISION, type Ambiente } from '../../taller/electricidad.ts';
import { AvisoRevision, CampoNumero, mostrar, numero, Resultado } from './piezas.tsx';
import './taller.css';

interface Fila {
  clave: number;
  tipo: Ambiente;
  m2: string;
}

const INICIAL: Fila[] = [
  { clave: 1, tipo: 'estar', m2: '24' },
  { clave: 2, tipo: 'dormitorio', m2: '12' },
  { clave: 3, tipo: 'dormitorio', m2: '10' },
  { clave: 4, tipo: 'cocina', m2: '9' },
  { clave: 5, tipo: 'bano', m2: '4' },
];

export function Vivienda() {
  const [filas, setFilas] = useState<Fila[]>(INICIAL);
  const [siguiente, setSiguiente] = useState(6);
  const [nuevo, setNuevo] = useState<Ambiente>('dormitorio');
  const validas = filas.map((f) => ({ tipo: f.tipo, m2: numero(f.m2) ?? 0 }));
  const plan = planificarVivienda(validas);
  const grado = GRADO[plan.grado];

  const cambiar = (clave: number, m2: string) => setFilas((fs) => fs.map((f) => (f.clave === clave ? { ...f, m2 } : f)));
  const quitar = (clave: number) => setFilas((fs) => fs.filter((f) => f.clave !== clave));
  function agregar() {
    setFilas((fs) => [...fs, { clave: siguiente, tipo: nuevo, m2: '' }]);
    setSiguiente((n) => n + 1);
  }

  return (
    <div className="fl-pantalla tl">
      <BarraSuperior titulo="Planificador de vivienda" atras={RUTAS.tallerElectricidad.ruta} textoAtras="Volver a Electricidad" acciones={null} />
      <section className="tl-tarjeta" aria-labelledby="tl-amb-t">
        <h2 id="tl-amb-t" className="tl-tarjeta__titulo">Ambientes</h2>
        <ul className="tl-ambientes">
          {filas.map((f) => {
            const n = numero(f.m2);
            return (
              <li key={f.clave} className="tl-ambiente">
                <CampoNumero etiqueta={AMBIENTE[f.tipo].texto} unidad="m²" valor={f.m2} onCambio={(v) => cambiar(f.clave, v)} error={n === null || n <= 0 ? 'Escribí los metros.' : null} />
                <button type="button" className="hx-circulo tl-quitar" aria-label={`Quitar ${AMBIENTE[f.tipo].texto.toLowerCase()}`} onClick={() => quitar(f.clave)}>
                  <Icono nombre="tacho" />
                </button>
              </li>
            );
          })}
        </ul>
        <div className="tl-agregar">
          <label htmlFor="tl-nuevo">Agregar ambiente</label>
          <div className="tl-agregar__fila">
            <select id="tl-nuevo" value={nuevo} onChange={(e) => setNuevo(e.target.value as Ambiente)}>
              {AMBIENTES.map((a) => (
                <option key={a} value={a}>{AMBIENTE[a].texto}</option>
              ))}
            </select>
            <button type="button" className="boton boton--claro" onClick={agregar}>
              <Icono nombre="mas" /> Agregar
            </button>
          </div>
        </div>
      </section>

      <Resultado titulo="Grado de electrificación" valor={plan.superficie} decimales={1} unidad="m²" lectura={`${mostrar(plan.superficie)} metros cuadrados: grado ${grado.texto.toLowerCase()}, ${plan.circuitos.total} circuitos y ${plan.bocas.total} bocas.`} estado="bien" textoEstado={`Grado ${grado.texto} · demanda ${grado.demandaKva}`}>
        <dl className="tl-datos">
          <div><dt>Circuitos de iluminación</dt><dd>{plan.circuitos.iug}</dd></div>
          <div><dt>Circuitos de tomas</dt><dd>{plan.circuitos.tug}</dd></div>
          <div><dt>De libre elección</dt><dd>{plan.circuitos.libres}</dd></div>
          <div><dt>Bocas en total</dt><dd>{plan.bocas.total} ({plan.bocas.iug} de luz, {plan.bocas.tug} tomas)</dd></div>
        </dl>
      </Resultado>

      <section className="tl-tarjeta" aria-labelledby="tl-bocas-t">
        <h2 id="tl-bocas-t" className="tl-tarjeta__titulo">Bocas mínimas por ambiente</h2>
        <ul className="tl-lista-bocas">
          {plan.porAmbiente.map((a, i) => (
            <li key={filas[i]?.clave ?? i}>
              <span>{AMBIENTE[a.tipo].texto} · {mostrar(a.m2)} m²</span>
              <strong>{a.iug} luz · {a.tug} tomas</strong>
            </li>
          ))}
        </ul>
      </section>
      <AvisoRevision texto={REVISION.aviso} fuente={REVISION.fuente} />
    </div>
  );
}
