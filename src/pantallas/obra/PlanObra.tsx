'use client';
// Plan de obra (lote 4.7): las etapas en una línea de tiempo, cada una con sus fechas (de sus jornadas), su estado, su
// importe, lo que incluye, sus adicionales y su cobro. Terminar una etapa crea su cobro (directo del cliente) y arranca
// la siguiente; con todas terminadas se cierra la obra.
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { terminadosEnSesion } from '../../components/AccionTrabajo.tsx';
import { CobroDirecto } from '../../components/CobroDirecto.tsx';
import { Cargando, ErrorCaja, Vacio } from '../../components/Estados.tsx';
import { Hoja } from '../../components/Hoja.tsx';
import { Icono } from '../../components/Icono.tsx';
import { Aviso, Chip, ChipTipo } from '../../components/ui.tsx';
import type { EtapaObra, Pago, TrabajoDetalle } from '../../contracts/dto.ts';
import { NOMBRE_RUBRO } from '../../contracts/rubros.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { useIdDeUrl } from '../../hooks/useIdDeUrl.ts';
import type { Etiqueta } from '../../lib/etiquetas.ts';
import { fechaCorta, pesos, pesosDesdeCentavos, plural } from '../../lib/formato.ts';
import { avanceObra, fechasEtapa, totalEtapa } from '../../lib/obra.ts';
import { TIPO_ADICIONAL } from '../../lib/trabajo.ts';
import { useIsla } from '../../kit/Efectos.tsx';
import { BarraSuperior } from '../../kit/Navegacion.tsx';

const ETAPA: Record<EtapaObra['estado'], Etiqueta> = {
  pendiente: { texto: 'Pendiente', tono: 'neutro', icono: 'reloj' },
  en_curso: { texto: 'En curso', tono: 'azul', icono: 'maletin' },
  terminada: { texto: 'Terminada', tono: 'exito', icono: 'checkCirculo' },
};

export function PlanObra() {
  const id = useIdDeUrl();
  const c = useCarga(async () => {
    if (!id) return null;
    const [detalle, pagos] = await Promise.all([api.trabajo(id), api.pagos()]);
    return { detalle, pagos: pagos.items.filter((p) => p.trabajoId === detalle.trabajo.id) };
  }, [id]);
  if (!id) return <Vacio icono="maletin" titulo="No indicaste qué obra abrir"><Link href={RUTAS.trabajos.ruta}>Ver mis trabajos</Link></Vacio>;
  if (c.fallo && !c.datos) return <ErrorCaja pantalla fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  return <Plan detalle={c.datos.detalle} pagos={c.datos.pagos} recargar={c.recargar} fallo={c.fallo} />;
}

function Plan({ detalle: d, pagos, recargar, fallo }: { detalle: TrabajoDetalle; pagos: Pago[]; recargar(): Promise<unknown>; fallo: ReturnType<typeof useCarga>['fallo'] }) {
  const router = useRouter();
  const isla = useIsla();
  const t = d.trabajo;
  const volver = `${RUTAS.trabajo.ruta}?id=${t.id}`;
  const [terminar, setTerminar] = useState<EtapaObra | null>(null);
  const [cerrar, setCerrar] = useState(false);
  const accion = useAccion();
  const avance = avanceObra(d.etapas);
  const todas = avance.total > 0 && avance.hechas === avance.total;

  if (t.tipo !== 'obra') {
    return (
      <div className="fl-pantalla">
        <BarraSuperior titulo="Plan de obra" atras={volver} textoAtras="Volver al trabajo" acciones={null} />
        <Vacio icono="maletin" titulo="Este trabajo no es una obra de varios días">
          <Link href={volver}>Volver al trabajo</Link>
        </Vacio>
      </div>
    );
  }

  async function confirmarEtapa() {
    if (!terminar) return;
    const e = terminar;
    // El refresco va dentro de la acción: la hoja se cierra con el cobro de la etapa ya a la vista.
    const r = await accion.ejecutar(async () => {
      const pago = await api.terminarEtapa(t.id, e.id, accion.clave());
      await recargar();
      return pago;
    });
    if (r.ok) {
      setTerminar(null);
      isla({ titulo: `Terminaste la etapa ${e.orden}`, texto: `Su cobro es de ${pesos(r.valor.monto)}, directo del cliente a vos.`, icono: 'checkCirculo', tono: 'exito' });
    }
  }

  async function cerrarObra() {
    const r = await accion.ejecutar(async () => {
      await api.avanzarTrabajo(t.id, 'finalizado', t.version, accion.clave());
      terminadosEnSesion.add(t.id);
    });
    if (r.ok) {
      setCerrar(false);
      router.push(`${RUTAS.trabajoTerminado.ruta}?id=${t.id}`);
    }
  }

  const cerrarHoja = () => {
    setTerminar(null);
    setCerrar(false);
    accion.limpiar();
    accion.nueva();
  };
  const sinRespuesta = terminar ? d.adicionales.filter((a) => a.etapaId === terminar.id && a.estado === 'pendiente') : [];

  return (
    <div className="fl-pantalla">
      <BarraSuperior titulo="Plan de obra" atras={volver} textoAtras="Volver al trabajo" acciones={null} />
      <div className="fl-ficha">
        <ChipTipo tipo="obra" />
        <p className="fl-ficha__titulo">{NOMBRE_RUBRO[t.rubro]}</p>
        <p className="fl-ficha__linea">
          <Icono nombre="usuario" /> {d.contraparte} · {avance.hechas} de {avance.total} etapas terminadas
        </p>
      </div>
      {fallo ? <ErrorCaja fallo={fallo} onReintentar={() => void recargar()} /> : null}
      {t.estado === 'agendado' || t.estado === 'en_camino' || t.estado === 'en_sitio' ? (
        <Aviso tono="azul" icono="info">
          La primera etapa arranca cuando empezás el trabajo el primer día.
        </Aviso>
      ) : null}

      <ol className="ob-plan" aria-label="Etapas de la obra">
        {d.etapas.map((e) => {
          const f = fechasEtapa(e.id, d.jornadas);
          const pago = pagos.find((p) => p.id === e.pagoId);
          const adicionales = d.adicionales.filter((a) => a.etapaId === e.id);
          return (
            <li key={e.id} className={`ob-etapa ob-etapa--${e.estado}`} aria-current={e.estado === 'en_curso' ? 'step' : undefined}>
              <span className="ob-etapa__punto" aria-hidden="true">
                {e.estado === 'terminada' ? <Icono nombre="check" /> : e.orden}
              </span>
              <div className="ob-etapa__cuerpo">
                <div className="ob-etapa__cabeza">
                  <h2 className="ob-etapa__nombre">
                    {e.orden}. {e.nombre}
                  </h2>
                  <Chip e={ETAPA[e.estado]} />
                </div>
                {f ? (
                  <p className="ob-etapa__fechas">
                    <Icono nombre="calendario" /> {f.cantidad === 1 ? fechaCorta(f.desde) : `${fechaCorta(f.desde)} a ${fechaCorta(f.hasta)}`} · {plural(f.cantidad, 'jornada', 'jornadas')}
                  </p>
                ) : null}
                <p className="ob-etapa__incluye">{e.incluye}</p>
                <dl className="tr-desglose">
                  <div>
                    <dt>Importe</dt>
                    <dd>{pesos(e.monto)}</dd>
                  </div>
                  {adicionales.map((a) => (
                    <div key={a.id} className={a.estado === 'aceptado' ? '' : 'ob-etapa__adicional--fuera'}>
                      <dt>
                        {a.descripcion} · {TIPO_ADICIONAL[a.tipo].toLowerCase()} · {a.estado === 'aceptado' ? 'aceptado' : a.estado === 'pendiente' ? 'esperando al cliente' : a.estado === 'rechazado' ? 'no lo aceptó' : 'retirado'}
                      </dt>
                      <dd>{a.estado === 'aceptado' ? '+ ' : ''}{pesos(a.monto)}</dd>
                    </div>
                  ))}
                  {adicionales.some((a) => a.estado === 'aceptado') ? (
                    <div className="tr-desglose__total">
                      <dt>Total de la etapa</dt>
                      <dd>{pesosDesdeCentavos(totalEtapa(e, d.adicionales))}</dd>
                    </div>
                  ) : null}
                </dl>
                {e.estado === 'en_curso' && t.estado === 'en_curso' ? (
                  <div className="ob-etapa__acciones">
                    <Link className="boton boton--claro boton--bloque" href={`${RUTAS.trabajoAdicional.ruta}?id=${t.id}&etapa=${e.id}`}>
                      <Icono nombre="mas" /> Agregar repuestos o mano de obra
                    </Link>
                    <button type="button" className="boton boton--bloque" onClick={() => setTerminar(e)}>
                      <Icono nombre="checkCirculo" /> Terminé esta etapa
                    </button>
                  </div>
                ) : null}
                {pago ? <CobroDirecto pago={pago} alCambiar={recargar} conCaja={false} que={`etapa ${e.orden}, ${e.nombre}`} /> : null}
              </div>
            </li>
          );
        })}
      </ol>

      {todas && t.estado === 'en_curso' ? (
        <section className="ob-cerrar" aria-labelledby="ob-cerrar-t">
          <h2 id="ob-cerrar-t" className="fl-bloque__titulo">
            Terminaste todas las etapas
          </h2>
          <p>Cerrá la obra para ver el resumen final con todas las etapas, los adicionales y los cobros.</p>
          <button type="button" className="boton boton--exito boton--bloque" onClick={() => setCerrar(true)}>
            <Icono nombre="checkCirculo" /> Cerrar la obra
          </button>
        </section>
      ) : null}
      {t.estado === 'finalizado' ? (
        <Link className="boton boton--claro boton--bloque" href={`${RUTAS.trabajoTerminado.ruta}?id=${t.id}`}>
          Ver el cierre de la obra
        </Link>
      ) : null}

      <Hoja abierta={terminar !== null} titulo={terminar ? `¿Terminaste la etapa ${terminar.orden}?` : ''} onCerrar={cerrarHoja}>
        {terminar ? (
          <>
            <dl className="tr-desglose">
              <div>
                <dt>{terminar.nombre}</dt>
                <dd>{pesos(terminar.monto)}</dd>
              </div>
              {d.adicionales
                .filter((a) => a.etapaId === terminar.id && a.estado === 'aceptado')
                .map((a) => (
                  <div key={a.id}>
                    <dt>{a.descripcion}</dt>
                    <dd>+ {pesos(a.monto)}</dd>
                  </div>
                ))}
              <div className="tr-desglose__total">
                <dt>Cobro de la etapa</dt>
                <dd>{pesosDesdeCentavos(totalEtapa(terminar, d.adicionales))}</dd>
              </div>
            </dl>
            {sinRespuesta.length > 0 ? (
              <Aviso tono="aviso" icono="alerta" role="status">
                {sinRespuesta.length === 1 ? 'Hay un adicional' : `Hay ${sinRespuesta.length} adicionales`} de esta etapa que el cliente no respondió: si la terminás, se retira y no se cobra.
              </Aviso>
            ) : null}
            <p className="texto-suave">Se genera el cobro de la etapa: el cliente te paga directo a vos. La siguiente etapa arranca sola.</p>
          </>
        ) : null}
        {accion.fallo ? <ErrorCaja fallo={accion.fallo} onReintentar={() => void confirmarEtapa()} /> : null}
        <div className="botones">
          <button type="button" className="boton boton--exito" disabled={accion.pendiente} onClick={() => void confirmarEtapa()}>
            {accion.pendiente ? 'Guardando…' : 'Sí, terminé la etapa'}
          </button>
          <button type="button" className="boton boton--claro" onClick={cerrarHoja}>
            Todavía no
          </button>
        </div>
      </Hoja>

      <Hoja abierta={cerrar} titulo="¿Cerrar la obra?" onCerrar={cerrarHoja}>
        <p>Las {avance.total} etapas están terminadas y cada una tiene su cobro. Cerrar la obra no genera otro cobro.</p>
        {accion.fallo ? <ErrorCaja fallo={accion.fallo} onReintentar={() => void cerrarObra()} /> : null}
        <div className="botones">
          <button type="button" className="boton boton--exito" disabled={accion.pendiente} onClick={() => void cerrarObra()}>
            {accion.pendiente ? 'Guardando…' : 'Sí, cerrar la obra'}
          </button>
          <button type="button" className="boton boton--claro" onClick={cerrarHoja}>
            Todavía no
          </button>
        </div>
      </Hoja>
    </div>
  );
}
