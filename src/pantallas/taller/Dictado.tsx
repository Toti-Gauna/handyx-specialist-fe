'use client';
// Presupuesto dictado (fase H1.3): contás el trabajo (con el micrófono del teclado o escribiendo) y sale la lista de
// tareas y materiales para revisar. Antes de mandarlo se quitan teléfonos, emails, documentos y direcciones, y se te
// muestra qué se quitó. Sin precios: los ponés vos. Sin IA autorizada, la app usa las reglas del teléfono.
import { api } from '@handyx/origen-datos';
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { ErrorCaja } from '../../components/Estados.tsx';
import { Icono } from '../../components/Icono.tsx';
import { AreaTexto, Aviso } from '../../components/ui.tsx';
import type { PresupuestoSugerido } from '../../contracts/dto.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { useIsla } from '../../kit/Efectos.tsx';
import { BarraSuperior } from '../../kit/Navegacion.tsx';
import { presupuestoElectrico } from '../../taller/dictado.ts';
import { limpiarTexto } from '../../taller/privacidad.ts';
import { mostrar, useEntrada } from './piezas.tsx';
import './taller.css';

const EJEMPLOS = ['Cambio de tablero de 6 circuitos con disyuntor', 'Agregar 4 tomas en la cocina y 2 luminarias', 'Puesta a tierra con jabalina'];
const UNIDAD = { unidad: 'u.', metro: 'm', rollo: 'rollo', caja: 'caja', bolsa: 'bolsa', kg: 'kg', litro: 'l' } as const;

export function Dictado() {
  const [texto, setTexto] = useState('');
  const [resultado, setResultado] = useState<{ p: PresupuestoSugerido; origen: 'ia' | 'telefono'; quitados: string[] } | null>(null);
  const armar = useAccion();
  const isla = useIsla();
  const listas = useEntrada<HTMLDivElement>('.tl-item');
  const limpio = limpiarTexto(texto);
  const corto = limpio.texto.length < 10;

  async function generar() {
    const r = await armar.ejecutar(() => api.iaPresupuesto({ rubro: 'electricidad', texto: limpio.texto }));
    if (r.ok) setResultado({ p: r.valor, origen: 'ia', quitados: limpio.quitados });
    else if (r.fallo.status === 503) {
      // Sin IA autorizada: las reglas del teléfono, avisando que es una versión básica.
      armar.limpiar();
      setResultado({ p: presupuestoElectrico(limpio.texto), origen: 'telefono', quitados: limpio.quitados });
    }
  }

  async function compartir() {
    if (!resultado) return;
    const t = [
      'Tareas:',
      ...resultado.p.tareas.map((x) => `• ${x.descripcion}${x.horas ? ` (${mostrar(x.horas)} h)` : ''}`),
      'Materiales:',
      ...resultado.p.materiales.map((m) => `• ${mostrar(m.cantidad)} ${UNIDAD[m.unidad]} ${m.descripcion}`),
    ].join('\n');
    try {
      if (navigator.share) await navigator.share({ text: t, title: 'Presupuesto' });
      else {
        await navigator.clipboard.writeText(t);
        isla({ titulo: 'Copiamos la lista', texto: 'Pegala donde la necesites.', icono: 'check', tono: 'exito' });
      }
    } catch {
      // Cancelar el menú de compartir no es un error.
    }
  }

  const horas = resultado ? resultado.p.tareas.reduce((s, t) => s + (t.horas ?? 0), 0) : 0;

  return (
    <div className="fl-pantalla tl">
      <BarraSuperior titulo="Presupuesto dictado" atras={RUTAS.taller.ruta} textoAtras="Volver al Taller" acciones={null} />
      <section className="tl-tarjeta" aria-label="Contá el trabajo">
        <AreaTexto etiqueta="Contá qué hay que hacer" value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={1500} rows={4} ayuda="Tocá el micrófono de tu teclado para dictarlo. No hace falta el nombre ni la dirección del cliente." />
        <div className="tl-opciones__fila" aria-label="Ejemplos">
          {EJEMPLOS.map((e) => (
            <button key={e} type="button" className="hx-chip" onClick={() => setTexto(e)}>{e}</button>
          ))}
        </div>
        {limpio.quitados.length ? (
          <p className="tl-nota" aria-live="polite">
            <Icono nombre="escudo" /> Antes de mandarlo sacamos: {limpio.quitados.join(', ')}.
          </p>
        ) : null}
        <button type="button" className="boton" disabled={corto || armar.pendiente} onClick={() => void generar()}>
          {armar.pendiente ? 'Armando la lista…' : 'Armar tareas y materiales'}
        </button>
      </section>
      {armar.fallo ? <ErrorCaja fallo={armar.fallo} onReintentar={() => void generar()} /> : null}
      {resultado ? (
        <div className="pila" ref={listas}>
          {resultado.origen === 'telefono' ? (
            <Aviso tono="aviso" icono="info" titulo="Versión básica, hecha en tu teléfono">
              La IA todavía no está disponible: armamos la lista con reglas simples. Revisala con más cuidado.
            </Aviso>
          ) : api.origen === 'mock' ? (
            <p className="tl-nota">En los datos de prueba, el resultado de la IA es simulado.</p>
          ) : null}
          <section className="tl-tarjeta" aria-labelledby="tl-tareas-t">
            <h2 id="tl-tareas-t" className="tl-tarjeta__titulo">Tareas · {mostrar(horas)} h estimadas</h2>
            <ul className="tl-lista-bocas">
              {resultado.p.tareas.map((t) => (
                <li key={t.descripcion} className="tl-item">
                  <span>{t.descripcion}</span>
                  <strong>{t.horas ? `${mostrar(t.horas)} h` : '—'}</strong>
                </li>
              ))}
            </ul>
          </section>
          {resultado.p.materiales.length ? (
            <section className="tl-tarjeta" aria-labelledby="tl-mats-t">
              <h2 id="tl-mats-t" className="tl-tarjeta__titulo">Materiales</h2>
              <ul className="tl-lista-bocas">
                {resultado.p.materiales.map((m) => (
                  <li key={m.descripcion} className="tl-item">
                    <span>{m.descripcion}</span>
                    <strong>{mostrar(m.cantidad)} {UNIDAD[m.unidad]}</strong>
                  </li>
                ))}
              </ul>
              <p className="tl-nota">Sin precios: los ponés vos con tu lista (pronto, en el presupuestador).</p>
            </section>
          ) : null}
          {resultado.p.avisos.map((a) => (
            <Aviso key={a} tono="aviso" icono="alerta">{a}</Aviso>
          ))}
          <button type="button" className="boton boton--claro" onClick={() => void compartir()}>
            <Icono nombre="enviar" /> Compartir la lista
          </button>
        </div>
      ) : null}
    </div>
  );
}
