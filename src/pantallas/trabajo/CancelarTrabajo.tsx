'use client';
// Cancelar (lote 4.6): primero las alternativas (cambiar la fecha, escribirle al cliente, pedir ayuda), después el motivo
// y una confirmación con lo que pasa. Sin penalización automática; con el trabajo en curso cancela solo Operations.
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { Cargando, ErrorCaja, Vacio } from '../../components/Estados.tsx';
import { Hoja } from '../../components/Hoja.tsx';
import { Icono } from '../../components/Icono.tsx';
import { Aviso, ChipTipo } from '../../components/ui.tsx';
import { MOTIVOS_CANCELACION, type MotivoCancelacion, type TrabajoDetalle } from '../../contracts/dto.ts';
import { NOMBRE_RUBRO } from '../../contracts/rubros.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { useIdDeUrl } from '../../hooks/useIdDeUrl.ts';
import { fechaHora } from '../../lib/formato.ts';
import { MOTIVO_CANCELACION } from '../../lib/trabajo.ts';
import { useIsla } from '../../kit/Efectos.tsx';
import { BarraSuperior } from '../../kit/Navegacion.tsx';
import { BotonFijo, ChipOpcion, Fila } from '../../kit/Piezas.tsx';

export function CancelarTrabajo() {
  const id = useIdDeUrl();
  const c = useCarga(() => (id ? api.trabajo(id) : Promise.resolve(null)), [id]);
  if (!id) return <Vacio icono="maletin" titulo="No indicaste qué trabajo cancelar"><Link href={RUTAS.trabajos.ruta}>Ver mis trabajos</Link></Vacio>;
  if (c.fallo && !c.datos) return <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  return <Formulario detalle={c.datos} />;
}

function Formulario({ detalle: d }: { detalle: TrabajoDetalle }) {
  const router = useRouter();
  const isla = useIsla();
  const t = d.trabajo;
  const volver = `${RUTAS.trabajo.ruta}?id=${t.id}`;
  const [motivo, setMotivo] = useState<MotivoCancelacion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const { pendiente, fallo, ejecutar, clave, limpiar, nueva } = useAccion();

  if (!['agendado', 'en_camino', 'en_sitio'].includes(t.estado)) {
    return (
      <div className="fl-pantalla">
        <BarraSuperior titulo="Cancelar el trabajo" atras={volver} textoAtras="Volver al trabajo" acciones={null} />
        <Vacio icono="maletin" titulo={t.estado === 'en_curso' ? 'Con el trabajo empezado, lo cancela Operations' : 'Este trabajo ya no se puede cancelar'}>
          {t.estado === 'en_curso' ? <Link href={`${RUTAS.soporte.ruta}?trabajo=${t.id}`}>Pedir ayuda</Link> : <Link href={volver}>Volver al trabajo</Link>}
        </Vacio>
      </div>
    );
  }

  function seguir() {
    if (!motivo) {
      setError('Elegí el motivo.');
      document.querySelector<HTMLElement>('#ct-motivo')?.focus();
      return;
    }
    setError(null);
    setConfirmar(true);
  }

  async function cancelar() {
    if (!motivo) return;
    const r = await ejecutar(() => api.cancelarTrabajo(t.id, motivo, t.version, clave()));
    if (r.ok) {
      setConfirmar(false);
      isla({ titulo: 'Cancelaste el trabajo', texto: `Le avisamos a ${d.contraparte}.`, icono: 'cerrar' });
      router.replace(volver);
    }
  }

  return (
    <div className="fl-pantalla">
      <BarraSuperior titulo="Cancelar el trabajo" atras={volver} textoAtras="Volver al trabajo" acciones={null} />
      <div className="fl-ficha">
        <ChipTipo tipo={t.tipo} />
        <p className="fl-ficha__titulo">{NOMBRE_RUBRO[t.rubro]}</p>
        <p className="fl-ficha__linea">
          <Icono nombre="calendario" /> {fechaHora(t.acuerdo.horario.inicio)} con {d.contraparte}
        </p>
      </div>

      <section className="fl-bloque" aria-labelledby="ct-antes">
        <h2 id="ct-antes" className="fl-bloque__titulo">
          Antes de cancelar
        </h2>
        <div className="tr-filas">
          {!d.cambioPendiente ? <Fila icono="calendario" titulo="Cambiar la fecha" detalle="Si el problema es el día o el horario" href={`${RUTAS.trabajoCambio.ruta}?id=${t.id}`} /> : null}
          <Fila icono="chat" titulo={`Escribirle a ${d.contraparte}`} detalle="Por si se puede resolver hablando" href={`${RUTAS.hilo.ruta}?id=${t.conversacionId}`} />
          <Fila icono="pregunta" titulo="Pedir ayuda a Handyx" detalle="Te acompañamos a resolverlo" href={`${RUTAS.soporte.ruta}?trabajo=${t.id}`} />
        </div>
      </section>

      <section className="fl-bloque" aria-labelledby="ct-motivo">
        <h2 id="ct-motivo" className="fl-bloque__titulo" tabIndex={-1}>
          Si igual querés cancelar, ¿por qué?
        </h2>
        <ul className="hx-chips" aria-label="Motivo">
          {MOTIVOS_CANCELACION.map((m) => (
            <li key={m}>
              <ChipOpcion
                texto={MOTIVO_CANCELACION[m]}
                elegido={motivo === m}
                onClick={() => {
                  setMotivo(m);
                  setError(null);
                }}
              />
            </li>
          ))}
        </ul>
        {error ? (
          <p className="campo__error" role="alert">
            <Icono nombre="alerta" /> {error}
          </p>
        ) : null}
        {motivo === 'riesgo_en_el_lugar' ? (
          <Aviso tono="aviso" icono="alerta" titulo="Tu seguridad primero">
            Si sentís que corrés peligro, alejate del lugar y llamá al 911. Después contanos qué pasó desde Ayuda.
          </Aviso>
        ) : null}
      </section>

      <BotonFijo nota="Handyx no aplica ninguna penalización automática por cancelar.">
        <button type="button" className="boton boton--peligro boton--bloque" onClick={seguir}>
          Cancelar el trabajo
        </button>
      </BotonFijo>

      <Hoja abierta={confirmar} titulo="¿Cancelar este trabajo?" onCerrar={() => { setConfirmar(false); limpiar(); nueva(); }}>
        <p>
          Le avisamos a {d.contraparte} con el motivo: <strong>{motivo ? MOTIVO_CANCELACION[motivo].toLowerCase() : ''}</strong>. El pedido puede volver a ofrecerse a otros especialistas.
        </p>
        {fallo ? <ErrorCaja fallo={fallo} onReintentar={() => void cancelar()} /> : null}
        <div className="botones">
          <button type="button" className="boton boton--peligro" disabled={pendiente} onClick={() => void cancelar()}>
            {pendiente ? 'Cancelando…' : 'Sí, cancelar'}
          </button>
          <button type="button" className="boton boton--claro" onClick={() => setConfirmar(false)}>
            No, volver
          </button>
        </div>
      </Hoja>
    </div>
  );
}
