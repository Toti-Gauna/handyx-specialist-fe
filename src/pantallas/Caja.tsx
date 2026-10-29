'use client';
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useState } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { Cargando, ErrorCaja, Vacio } from '../components/Estados.tsx';
import { Hoja } from '../components/Hoja.tsx';
import { Icono } from '../components/Icono.tsx';
import { Aviso, Chip, ChipTexto, Dato, Seccion, Tarjeta } from '../components/ui.tsx';
import type { Pago } from '../contracts/dto.ts';
import type { SimulacionPostDemo } from '../data/api.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { METODO_PAGO, PAGO } from '../lib/etiquetas.ts';
import { fechaHora, pesos } from '../lib/formato.ts';
import { tarifaTexto } from '../lib/tarifa.ts';

type Intencion = { pago: Pago; accion: 'reportar' | 'discrepancia' } | null;

export function Caja() {
  const c = useCarga(async () => {
    const [resumen, pagos, fee] = await Promise.all([api.cajaResumen(), api.pagos(), api.feeVigente()]);
    return { resumen, pagos: pagos.items, fee };
  }, []);
  const [intencion, setIntencion] = useState<Intencion>(null);
  const [simulacion, setSimulacion] = useState<SimulacionPostDemo | null>(null);
  const accion = useAccion();
  const sim = useAccion();

  if (c.fallo && !c.datos) return <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  const { resumen, pagos, fee } = c.datos;

  async function confirmar() {
    if (!intencion) return;
    const { pago, accion: a } = intencion;
    const r = await accion.ejecutar(() => (a === 'reportar' ? api.reportarCobro(pago.id, accion.clave()) : api.marcarDiscrepancia(pago.id, accion.clave())));
    if (r.ok) {
      setIntencion(null);
      await c.recargar();
    } else if (r.fallo.tipo === 'conflicto') {
      await c.recargar();
    }
  }
  function cerrar() {
    setIntencion(null);
    accion.limpiar();
    accion.nueva();
  }
  async function verSimulacion() {
    if (simulacion) return setSimulacion(null);
    const r = await sim.ejecutar(() => api.simulacionPostDemo?.() ?? Promise.reject(new Error('sin simulación')));
    if (r.ok) setSimulacion(r.valor);
  }

  return (
    <div className="pila">
      <h1 className="titulo">Caja</h1>
      <Aviso tono="azul" icono="info" titulo="El pago va directo a vos">
        Los usuarios te pagan a vos, con Mercado Pago o en efectivo. Handy no recibe, guarda ni te transfiere ese dinero, así que acá no hay saldo para retirar de Handy. Handy nunca te pide tu contraseña de Mercado Pago.
      </Aviso>
      {c.fallo ? <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} /> : null}

      <Seccion titulo="Resumen">
        <div className="lista-tarjetas">
          <Tarjeta tono="gris">
            <ChipTexto tono="exito" icono="verificado">Verificado</ChipTexto>
            <p className="monto">{pesos(resumen.verificado)}</p>
            <p className="texto-suave texto-chico">Confirmado por Mercado Pago u Operations.</p>
          </Tarjeta>
          <Tarjeta>
            <ChipTexto tono="azul" icono="info">Reportado, sin verificar</ChipTexto>
            <p className="monto monto--chico">{pesos(resumen.reportado)}</p>
            <p className="texto-suave texto-chico">Cobros que informaste vos: todavía no están verificados.</p>
          </Tarjeta>
          <Tarjeta>
            <ChipTexto tono="aviso" icono="reloj">Pendiente de cobro</ChipTexto>
            <p className="monto monto--chico">{pesos(resumen.pendiente)}</p>
          </Tarjeta>
        </div>
        <p className="texto-suave">
          Tarifa de Handy en este período: <strong>{pesos(resumen.feeHandyPeriodo)}</strong>. {tarifaTexto(fee.politica, api.ahora())}
        </p>
      </Seccion>

      <Seccion titulo="Pagos">
        {pagos.length === 0 ? (
          <Vacio icono="caja" titulo="Todavía no tenés pagos">Cuando termines un trabajo, el cobro aparece acá.</Vacio>
        ) : (
          <ul className="lista-tarjetas">
            {pagos.map((p) => (
              <li key={p.id} className="tarjeta">
                <div className="fila-flex fila-flex--entre">
                  <span className="tarjeta__titulo">{p.descripcion}</span>
                  <Chip e={PAGO[p.estado]} />
                </div>
                <p className="texto-suave">{METODO_PAGO[p.metodo]}</p>
                <dl>
                  <Dato etiqueta="Importe" valor={pesos(p.monto)} />
                  <Dato etiqueta="Tarifa de Handy" valor={pesos(p.feeHandy)} />
                  <Dato etiqueta="Para vos" valor={<strong>{pesos(p.neto)}</strong>} />
                </dl>
                <p className="texto-suave texto-chico">{PAGO[p.estado].detalle} · {fechaHora(p.actualizadoEn)}</p>
                {p.referenciaProveedor ? <p className="texto-suave texto-chico">Referencia del proveedor: {p.referenciaProveedor}</p> : null}
                <AccionesPago pago={p} alElegir={(a) => setIntencion({ pago: p, accion: a })} />
              </li>
            ))}
          </ul>
        )}
      </Seccion>

      {api.simulacionPostDemo ? (
        <Seccion titulo="Después de la demo (simulación)">
          <button type="button" className="boton boton--claro boton--bloque" onClick={() => void verSimulacion()} aria-expanded={simulacion !== null}>
            {simulacion ? 'Ocultar la simulación' : 'Ver la simulación posterior a la demo'}
          </button>
          {sim.fallo ? <ErrorCaja fallo={sim.fallo} /> : null}
          {simulacion ? (
            <div className="simulacion pila">
              <Aviso tono="aviso" icono="alerta" titulo="SIMULACIÓN · no vigente">{simulacion.rotulo}</Aviso>
              <p className="texto-suave">Así se vería una comisión sobre cobros en efectivo si más adelante Handy aprueba una tarifa. El porcentaje de la simulación es ilustrativo. No se cobra ni se descuenta nada en el piloto.</p>
              {simulacion.entradas.length === 0 ? <p>No hay cobros en efectivo para simular.</p> : (
                <ul className="lista-tarjetas">
                  {simulacion.entradas.map((e) => (
                    <li key={e.pagoId} className="tarjeta">
                      <div className="fila-flex fila-flex--entre">
                        <span className="tarjeta__titulo">{e.descripcion}</span>
                        <ChipTexto tono={e.estado === 'saldada' ? 'exito' : 'aviso'}>{e.estado === 'saldada' ? 'Saldada (simulada)' : 'Adeudada (simulada)'}</ChipTexto>
                      </div>
                      <dl>
                        <Dato etiqueta="Cobraste en efectivo" valor={pesos(e.cobrado)} />
                        <Dato etiqueta="Comisión simulada" valor={pesos(e.comision)} />
                      </dl>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </Seccion>
      ) : null}

      <p className="texto-suave texto-chico">
        ¿Algo no coincide? <Link href={`${RUTAS.soporte.ruta}`}>Pedí ayuda sobre un pago</Link>.
      </p>

      <Hoja abierta={intencion !== null} titulo={intencion?.accion === 'reportar' ? 'Informar un cobro' : 'Marcar una discrepancia'} onCerrar={cerrar}>
        {intencion ? (
          <>
            <p>
              {intencion.pago.descripcion} · <strong>{pesos(intencion.pago.monto)}</strong> · {METODO_PAGO[intencion.pago.metodo]}
            </p>
            {intencion.accion === 'reportar' ? (
              <Aviso tono="azul" icono="info">
                Vas a informar que ya cobraste. Queda como <strong>reportado</strong>: no se verifica solo porque lo informes vos. Lo confirma Mercado Pago u Operations.
              </Aviso>
            ) : (
              <Aviso tono="aviso" icono="alerta">
                Indicás que el cobro o el importe no coinciden. Operations lo revisa.
              </Aviso>
            )}
            {accion.fallo ? <ErrorCaja fallo={accion.fallo} onReintentar={() => void confirmar()} /> : null}
            <div className="botones">
              <button type="button" className="boton" disabled={accion.pendiente} onClick={() => void confirmar()}>
                {accion.pendiente ? 'Enviando…' : intencion.accion === 'reportar' ? 'Sí, ya lo cobré' : 'Marcar discrepancia'}
              </button>
              <button type="button" className="boton boton--claro" onClick={cerrar}>Volver</button>
            </div>
          </>
        ) : null}
      </Hoja>
    </div>
  );
}

function AccionesPago({ pago, alElegir }: { pago: Pago; alElegir(a: 'reportar' | 'discrepancia'): void }) {
  if (pago.estado === 'pendiente') {
    return (
      <div className="pila pila--chica">
        {pago.metodo === 'mercado_pago' ? <p className="texto-suave texto-chico"><Icono nombre="reloj" className="icono icono--chico" /> Esperando que Mercado Pago confirme el pago. Si ya lo cobraste, podés informarlo.</p> : null}
        <button type="button" className="boton boton--claro boton--chico" onClick={() => alElegir('reportar')}>
          <Icono nombre="check" /> {pago.metodo === 'efectivo' ? 'Informar cobro en efectivo' : 'Ya lo cobré: informarlo'}
        </button>
      </div>
    );
  }
  if (pago.estado === 'reportado') {
    return (
      <button type="button" className="boton boton--claro boton--chico" onClick={() => alElegir('discrepancia')}>
        <Icono nombre="alerta" /> El importe no coincide
      </button>
    );
  }
  if (pago.estado === 'fallido') {
    return <p className="texto-suave texto-chico">El usuario puede volver a pagar, o acordar el pago en efectivo con vos. Si necesitás ayuda, escribinos desde Ayuda.</p>;
  }
  return null;
}
