'use client';
// Iluminación (fase H1): ambiente y uso → lúmenes y cantidad de luminarias.
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { BarraSuperior } from '../../kit/Navegacion.tsx';
import { iluminacion, LUX, USOS_LUZ, type UsoLuz } from '../../taller/electricidad.ts';
import { AvisoRevision, CampoNumero, mostrar, numero, Opciones, Resultado } from './piezas.tsx';
import './taller.css';

export function Iluminacion() {
  const [uso, setUso] = useState<UsoLuz>('cocina');
  const [m2, setM2] = useState('9');
  const [lumenes, setLumenes] = useState('1200');
  const vm = numero(m2);
  const vl = numero(lumenes);
  const errM2 = vm === null || vm <= 0 ? 'Escribí los metros del ambiente.' : null;
  const errL = vl === null || vl <= 0 ? 'Escribí los lúmenes de la luminaria (vienen en la caja).' : null;
  const r = vm !== null && vl !== null && !errM2 && !errL ? iluminacion({ uso, m2: vm, lumenesPorLuminaria: vl }) : null;

  return (
    <div className="fl-pantalla tl">
      <BarraSuperior titulo="Iluminación" atras={RUTAS.taller.ruta} textoAtras="Volver al Taller" acciones={null} />
      <Opciones etiqueta="Uso del ambiente" opciones={USOS_LUZ.map((u) => ({ valor: u, texto: LUX[u].texto }))} valor={uso} onCambio={setUso} />
      <section className="tl-tarjeta tl-grilla2" aria-label="Datos">
        <CampoNumero etiqueta="Superficie" unidad="m²" valor={m2} onCambio={setM2} error={errM2} />
        <CampoNumero etiqueta="Luz de cada luminaria" unidad="lm" valor={lumenes} onCambio={setLumenes} error={errL} ayuda="Un panel LED de 18 W da unos 1.400 lm" />
      </section>
      <Resultado titulo="Luminarias" valor={r?.luminarias ?? null} decimales={0} unidad={r?.luminarias === 1 ? 'luminaria' : 'luminarias'} lectura={r ? `${r.luminarias} luminarias para ${mostrar(r.lumenes, 0)} lúmenes.` : 'Sin resultado.'} {...(r ? { estado: r.luxLogrados >= r.lux ? 'bien' : 'atencion', textoEstado: `Quedan ${mostrar(r.luxLogrados, 0)} lux; se recomiendan ${r.lux}` } as const : {})}>
        {r ? (
          <dl className="tl-datos">
            <div><dt>Nivel recomendado</dt><dd>{r.lux} lux</dd></div>
            <div><dt>Luz necesaria</dt><dd>{mostrar(r.lumenes, 0)} lm</dd></div>
          </dl>
        ) : null}
      </Resultado>
      <AvisoRevision texto="Estimación con un rendimiento típico del ambiente (paredes claras, luminarias limpias). Para locales con exigencias especiales, hacé un cálculo fotométrico." />
    </div>
  );
}
