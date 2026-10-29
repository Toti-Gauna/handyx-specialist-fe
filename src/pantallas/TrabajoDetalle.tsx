'use client';
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useState } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { AccionTrabajo } from '../components/AccionTrabajo.tsx';
import { Cargando, ErrorCaja, Vacio } from '../components/Estados.tsx';
import { FormCambio } from '../components/FormCambio.tsx';
import { Hoja } from '../components/Hoja.tsx';
import { Icono } from '../components/Icono.tsx';
import { TarjetaPropuesta } from '../components/TarjetaPropuesta.tsx';
import { Volver } from '../components/Volver.tsx';
import { Aviso, Chip, ChipTipo, Dato, Seccion, Tarjeta } from '../components/ui.tsx';
import { NOMBRE_RUBRO } from '../contracts/rubros.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { useIdDeUrl } from '../hooks/useIdDeUrl.ts';
import { TRABAJO } from '../lib/etiquetas.ts';
import { fechaHora, hora, pesos } from '../lib/formato.ts';

const ACTIVO = ['agendado', 'en_camino', 'en_sitio', 'en_curso'];
const ACTOR = { especialista: 'Vos', usuario: 'El usuario', operations: 'Handy', sistema: 'La app' } as const;

export function TrabajoDetalle() {
  const id = useIdDeUrl();
  const c = useCarga(() => (id ? api.trabajo(id) : Promise.resolve(null)), [id]);
  const [cambio, setCambio] = useState(false);
  const [cancelar, setCancelar] = useState(false);
  const cancelacion = useAccion();

  if (!id) return <Vacio icono="maletin" titulo="No indicaste qué trabajo abrir"><Link href={RUTAS.trabajos.ruta}>Ver mis trabajos</Link></Vacio>;
  if (c.fallo && !c.datos) {
    return (
      <div className="pila">
        <Volver a={RUTAS.trabajos.ruta} texto="Mis trabajos" />
        {c.fallo.tipo === 'no_encontrado' ? <Vacio icono="maletin" titulo="No encontramos ese trabajo" /> : <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} />}
      </div>
    );
  }
  if (!c.datos) return <Cargando />;
  const { trabajo: t, contraparte, eventos, etapas, cambioPendiente, pagoId } = c.datos;
  const activo = ACTIVO.includes(t.estado);

  async function confirmarCancelacion() {
    const r = await cancelacion.ejecutar(() => api.avanzarTrabajo(t.id, 'cancelado', t.version, cancelacion.clave()));
    if (r.ok) {
      setCancelar(false);
      await c.recargar();
    }
  }

  return (
    <div className="pila">
      <Volver a={RUTAS.trabajos.ruta} texto="Mis trabajos" />
      {c.fallo ? <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} /> : null}
      <Tarjeta tono="gris">
        <div className="fila-flex fila-flex--entre">
          <ChipTipo tipo={t.tipo} />
          <Chip e={TRABAJO[t.estado]} />
        </div>
        <h1 className="titulo">{NOMBRE_RUBRO[t.rubro]}</h1>
        <p className="monto">{pesos(t.acuerdo.monto)}</p>
        <p>
          <strong>{contraparte}</strong>
          <br />
          <Icono nombre="calendario" className="icono icono--chico" /> {fechaHora(t.acuerdo.horario.inicio)}
          {t.acuerdo.horario.fin ? ` a ${hora(t.acuerdo.horario.fin)}` : ''}
        </p>
        {t.direccion ? (
          <p>
            <Icono nombre="pin" className="icono icono--chico" /> {t.direccion}
          </p>
        ) : null}
      </Tarjeta>

      {activo ? <AccionTrabajo trabajo={t} alCambiar={() => void c.recargar()} /> : null}
      {t.estado === 'finalizado' ? (
        <Aviso tono="exito" icono="checkCirculo" titulo="Trabajo terminado">
          {pagoId ? <>El cobro está en tu <Link href={RUTAS.caja.ruta}>Caja</Link>: pagó directamente a vos, no a Handy.</> : 'Todavía no hay un cobro registrado.'}
        </Aviso>
      ) : null}
      {t.estado === 'cancelado' ? <Aviso tono="neutro" icono="cerrar">Este trabajo fue cancelado.</Aviso> : null}

      <Seccion titulo="Lo que acordaron">
        <Tarjeta>
          <p>{t.acuerdo.alcance}</p>
          <dl>
            <Dato etiqueta="Importe" valor={pesos(t.acuerdo.monto)} />
            <Dato etiqueta="Cuándo" valor={fechaHora(t.acuerdo.horario.inicio)} />
          </dl>
          <p className="texto-suave texto-chico">El acuerdo no cambia sin una propuesta nueva que acepten las dos partes. Queda el historial.</p>
        </Tarjeta>
      </Seccion>

      {cambioPendiente ? (
        <Seccion titulo="Cambio esperando respuesta">
          <TarjetaPropuesta propuesta={cambioPendiente} puedeActuar alCambiar={() => void c.recargar()} />
          <p className="texto-suave texto-chico">Mientras tanto sigue valiendo el acuerdo de arriba.</p>
        </Seccion>
      ) : null}

      {etapas.length > 0 ? (
        <Seccion titulo="Etapas de la obra">
          <ul className="lista-tarjetas">
            {etapas.map((e) => (
              <li key={e.nombre} className="tarjeta">
                <div className="fila-flex fila-flex--entre">
                  <span className="tarjeta__titulo">{e.nombre}</span>
                  <Chip e={e.estado === 'terminada' ? { texto: 'Terminada', tono: 'exito', icono: 'checkCirculo' } : e.estado === 'en_curso' ? { texto: 'En curso', tono: 'azul', icono: 'maletin' } : { texto: 'Pendiente', tono: 'neutro', icono: 'reloj' }} />
                </div>
                <p className="monto monto--chico">{pesos(e.monto)}</p>
              </li>
            ))}
          </ul>
          <p className="texto-suave texto-chico">Cada etapa se cobra por separado, directamente del usuario a vos.</p>
        </Seccion>
      ) : null}

      <Seccion titulo="Historial">
        <ol className="linea-tiempo">
          {[...eventos].reverse().map((e) => (
            <li key={`${e.estado}-${e.en}`}>
              <strong>{TRABAJO[e.estado].texto}</strong>
              <span className="texto-suave"> · {ACTOR[e.actor]} · {fechaHora(e.en)}</span>
            </li>
          ))}
        </ol>
      </Seccion>

      <Seccion titulo="Más acciones">
        <Link className="boton boton--claro boton--bloque" href={`${RUTAS.hilo.ruta}?id=${t.conversacionId}`}>
          <Icono nombre="chat" /> Abrir el chat
        </Link>
        {activo && !cambioPendiente ? (
          <button type="button" className="boton boton--claro boton--bloque" onClick={() => setCambio(true)}>
            <Icono nombre="calendario" /> Proponer otra fecha o cambio
          </button>
        ) : null}
        <Link className="boton boton--claro boton--bloque" href={`${RUTAS.soporte.ruta}?trabajo=${t.id}`}>
          <Icono nombre="pregunta" /> Pedir ayuda o hacer un reclamo
        </Link>
        {t.estado === 'agendado' || t.estado === 'en_camino' || t.estado === 'en_sitio' ? (
          <button type="button" className="boton boton--peligro boton--bloque" onClick={() => setCancelar(true)}>
            Cancelar este trabajo
          </button>
        ) : null}
      </Seccion>

      <FormCambio abierta={cambio} onCerrar={() => setCambio(false)} trabajo={t} onEnviada={() => { setCambio(false); void c.recargar(); }} />
      <Hoja abierta={cancelar} titulo="¿Cancelar este trabajo?" onCerrar={() => { setCancelar(false); cancelacion.limpiar(); cancelacion.nueva(); }}>
        <p>Le avisamos al usuario y el pedido puede volver a ofrecerse. Handy no aplica ninguna penalización automática por cancelar.</p>
        <p className="texto-suave">Si el problema es la fecha, podés proponer otra en lugar de cancelar.</p>
        {cancelacion.fallo ? <ErrorCaja fallo={cancelacion.fallo} onReintentar={() => void confirmarCancelacion()} /> : null}
        <div className="botones">
          <button type="button" className="boton boton--peligro" disabled={cancelacion.pendiente} onClick={() => void confirmarCancelacion()}>
            {cancelacion.pendiente ? 'Cancelando…' : 'Sí, cancelar el trabajo'}
          </button>
          <button type="button" className="boton boton--claro" onClick={() => setCancelar(false)}>No, volver</button>
        </div>
      </Hoja>
    </div>
  );
}
