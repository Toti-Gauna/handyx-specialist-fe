'use client';
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { Cargando, ErrorCaja, Vacio } from '../components/Estados.tsx';
import { Icono } from '../components/Icono.tsx';
import { Volver } from '../components/Volver.tsx';
import { AreaTexto, Chip } from '../components/ui.tsx';
import { useAccion } from '../hooks/useAccion.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { useIdDeUrl } from '../hooks/useIdDeUrl.ts';
import { CATEGORIA_SOPORTE, SOPORTE } from '../lib/etiquetas.ts';
import { fechaHora } from '../lib/formato.ts';

export function CasoDetalle() {
  const id = useIdDeUrl();
  const c = useCarga(() => (id ? api.caso(id) : Promise.resolve(null)), [id]);
  const { pendiente, fallo, ejecutar, clave, nueva } = useAccion();
  const [texto, setTexto] = useState('');

  if (!id) return <Vacio icono="pregunta" titulo="No indicaste qué caso abrir"><Link href={RUTAS.soporte.ruta}>Ver mis casos</Link></Vacio>;
  if (c.fallo && !c.datos) {
    return (
      <div className="pila">
        <Volver a={RUTAS.soporte.ruta} texto="Ayuda" />
        {c.fallo.tipo === 'no_encontrado' ? <Vacio icono="pregunta" titulo="No encontramos ese caso" /> : <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} />}
      </div>
    );
  }
  if (!c.datos) return <Cargando />;
  const k = c.datos;

  async function responder(e: FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    const r = await ejecutar(() => api.responderCaso(k.id, texto, clave()));
    if (r.ok) {
      setTexto('');
      nueva();
      await c.recargar();
    }
  }

  return (
    <div className="pila">
      <Volver a={RUTAS.soporte.ruta} texto="Ayuda" />
      <h1 className="titulo">{k.asunto}</h1>
      <div className="fila-flex">
        <Chip e={SOPORTE[k.estado]} />
        <span className="texto-suave texto-chico">{CATEGORIA_SOPORTE[k.categoria]} · abierto {fechaHora(k.creadoEn)}</span>
      </div>
      {k.trabajoId ? <Link href={`${RUTAS.trabajo.ruta}?id=${k.trabajoId}`}>Ver el trabajo relacionado</Link> : null}
      <ol className="chat" aria-label="Historial del caso">
        {k.eventos.map((e) => (
          <li key={e.id} className={`burbuja${e.autor === 'vos' ? ' burbuja--propia' : ''}`}>
            <strong>{e.autor === 'vos' ? 'Vos' : 'Handyx'}</strong>
            <span>{e.texto}</span>
            {e.adjuntos > 0 ? <span className="burbuja__meta"><Icono nombre="imagen" className="icono icono--chico" /> {e.adjuntos} {e.adjuntos === 1 ? 'adjunto' : 'adjuntos'} (no se muestran acá)</span> : null}
            <span className="burbuja__meta">{fechaHora(e.creadoEn)}</span>
          </li>
        ))}
      </ol>
      {k.estado === 'cerrado' ? (
        <p className="texto-suave">Este caso está cerrado. Si necesitás algo más, abrí uno nuevo.</p>
      ) : (
        <form className="pila" onSubmit={(e) => void responder(e)}>
          {fallo ? <ErrorCaja fallo={fallo} /> : null}
          <AreaTexto etiqueta={k.estado === 'resuelto' ? 'Responder para reabrirlo' : 'Tu respuesta'} value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={2000} />
          <button type="submit" className="boton boton--bloque" disabled={pendiente || !texto.trim()}>{pendiente ? 'Enviando…' : 'Enviar respuesta'}</button>
        </form>
      )}
    </div>
  );
}
