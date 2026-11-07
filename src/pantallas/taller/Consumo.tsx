'use client';
// Consumo y ahorro (fase H1): cuánto gasta tu cliente por mes y cuánto ahorra con un cambio. La tarifa la cargás vos
// (la de la factura): Handyx no inventa precios.
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { Icono } from '../../components/Icono.tsx';
import { BarraSuperior } from '../../kit/Navegacion.tsx';
import { pesosDesdeCentavos } from '../../lib/formato.ts';
import { ahorroCambio, consumoMensual } from '../../taller/electricidad.ts';
import { AvisoRevision, CampoNumero, mostrar, numero, Resultado } from './piezas.tsx';
import './taller.css';

interface Fila {
  clave: number;
  nombre: string;
  watts: string;
  cantidad: string;
  horas: string;
}

/** Valores típicos para empezar: el profesional los ajusta con la etiqueta del artefacto. */
const TIPICOS: Omit<Fila, 'clave'>[] = [
  { nombre: 'Heladera (promedio)', watts: '60', cantidad: '1', horas: '24' },
  { nombre: 'Lámparas', watts: '60', cantidad: '8', horas: '5' },
  { nombre: 'Aire acondicionado', watts: '1000', cantidad: '1', horas: '6' },
];

export function Consumo() {
  const [filas, setFilas] = useState<Fila[]>(TIPICOS.map((f, i) => ({ ...f, clave: i + 1 })));
  const [tarifa, setTarifa] = useState('');
  const [led, setLed] = useState('9');
  const tarifaPesos = numero(tarifa);
  const tarifaCentavos = tarifaPesos !== null && tarifaPesos > 0 ? Math.round(tarifaPesos * 100) : 0;
  const artefactos = filas.map((f) => ({ nombre: f.nombre, watts: numero(f.watts) ?? 0, cantidad: numero(f.cantidad) ?? 0, horasPorDia: Math.min(24, numero(f.horas) ?? 0) }));
  const r = consumoMensual(artefactos, tarifaCentavos);
  const lamparas = artefactos.find((a) => a.nombre === 'Lámparas');
  const wattsLed = numero(led);
  const ahorro = lamparas && wattsLed !== null && wattsLed < lamparas.watts ? ahorroCambio({ wattsAntes: lamparas.watts, wattsDespues: wattsLed, cantidad: lamparas.cantidad, horasPorDia: lamparas.horasPorDia, tarifaCentavosPorKwh: tarifaCentavos }) : null;

  const cambiar = (clave: number, campo: keyof Omit<Fila, 'clave' | 'nombre'>, v: string) => setFilas((fs) => fs.map((f) => (f.clave === clave ? { ...f, [campo]: v } : f)));

  return (
    <div className="fl-pantalla tl">
      <BarraSuperior titulo="Consumo y ahorro" atras={RUTAS.taller.ruta} textoAtras="Volver al Taller" acciones={null} />
      <section className="tl-tarjeta" aria-label="Tarifa">
        <CampoNumero etiqueta="Precio del kWh" unidad="$/kWh" valor={tarifa} onCambio={setTarifa} ayuda="Copialo de la factura de luz del cliente (incluí impuestos si querés el total)." />
      </section>
      {filas.map((f) => (
        <section key={f.clave} className="tl-tarjeta" aria-label={f.nombre}>
          <h2 className="tl-tarjeta__titulo">{f.nombre}</h2>
          <div className="tl-grilla3">
            <CampoNumero etiqueta="Potencia" unidad="W" valor={f.watts} onCambio={(v) => cambiar(f.clave, 'watts', v)} />
            <CampoNumero etiqueta="Cantidad" valor={f.cantidad} onCambio={(v) => cambiar(f.clave, 'cantidad', v)} />
            <CampoNumero etiqueta="Horas por día" unidad="h" valor={f.horas} onCambio={(v) => cambiar(f.clave, 'horas', v)} />
          </div>
        </section>
      ))}
      <Resultado titulo="Consumo del mes" valor={r.kwh} unidad="kWh" lectura={`${mostrar(r.kwh)} kilovatios hora por mes${tarifaCentavos ? `, ${pesosDesdeCentavos(r.centavos)}` : ''}.`}>
        <dl className="tl-datos">
          <div><dt>Costo estimado</dt><dd>{tarifaCentavos ? pesosDesdeCentavos(r.centavos) : 'Cargá la tarifa'}</dd></div>
          {r.porArtefacto.map((a) => (
            <div key={a.nombre}><dt>{a.nombre}</dt><dd>{mostrar(a.kwh)} kWh</dd></div>
          ))}
        </dl>
      </Resultado>
      <section className="tl-tarjeta" aria-labelledby="tl-led-t">
        <h2 id="tl-led-t" className="tl-tarjeta__titulo">
          <Icono nombre="rayo" /> Pasar las lámparas a LED
        </h2>
        <CampoNumero etiqueta="Potencia de la lámpara LED" unidad="W" valor={led} onCambio={setLed} ayuda="Una LED de 9 W ilumina como una común de 60 W" />
        <p className="tl-destacado" aria-live="polite">
          {ahorro ? `Ahorra ${mostrar(ahorro.kwh)} kWh por mes${tarifaCentavos ? ` · ${pesosDesdeCentavos(ahorro.centavos)}` : ''}.` : 'Cargá una potencia menor que la actual para ver el ahorro.'}
        </p>
      </section>
      <AvisoRevision texto="Las potencias son valores típicos: usá las de la etiqueta de cada artefacto. El costo es una estimación con la tarifa que cargaste." />
    </div>
  );
}
