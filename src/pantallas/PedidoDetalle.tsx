'use client';
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { CuentaRegresiva } from '../components/CuentaRegresiva.tsx';
import { Cargando, ErrorCaja, Vacio } from '../components/Estados.tsx';
import { FormPropuesta } from '../components/FormPropuesta.tsx';
import { Icono } from '../components/Icono.tsx';
import { TarjetaPropuesta } from '../components/TarjetaPropuesta.tsx';
import { Volver } from '../components/Volver.tsx';
import { Aviso, ChipTipo, Seccion, Tarjeta } from '../components/ui.tsx';
import type { Propuesta } from '../contracts/dto.ts';
import { NOMBRE_RUBRO } from '../contracts/rubros.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { useIdDeUrl } from '../hooks/useIdDeUrl.ts';
import { fechaHora } from '../lib/formato.ts';
import { tarifaTexto } from '../lib/tarifa.ts';

export function PedidoDetalle() {
  const id = useIdDeUrl();
  const router = useRouter();
  const c = useCarga(async () => {
    if (!id) return null;
    const [pedido, fee] = await Promise.all([api.pedido(id), api.feeVigente()]);
    return { pedido, fee };
  }, [id]);
  const [form, setForm] = useState<{ abierta: boolean; base: Propuesta | null }>({ abierta: false, base: null });
  const chat = useAccion();

  if (!id) return <Vacio icono="lupa" titulo="No indicaste qué pedido abrir"><Link href={RUTAS.pedidos.ruta}>Ver pedidos</Link></Vacio>;
  if (c.fallo && !c.datos) {
    return (
      <div className="pila">
        <Volver a={RUTAS.pedidos.ruta} texto="Pedidos" />
        {c.fallo.tipo === 'no_encontrado' ? <Vacio icono="lupa" titulo="Este pedido no está disponible para vos">Ya no está abierto o no corresponde a tus rubros y zonas.</Vacio> : <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} />}
      </div>
    );
  }
  if (!c.datos) return <Cargando />;

  const { pedido, fee } = c.datos;
  const abierto = pedido.estado === 'buscando';
  const pendienteMia = pedido.propuestas.some((p) => p.autorRol === 'especialista' && p.estado === 'pendiente' && Date.parse(p.venceEn) > api.ahora().getTime());
  const urgente = pedido.tipo === 'urgente';
  const ahoraMs = api.ahora().getTime();
  const delUsuarioVigente = pedido.propuestas.some((p) => p.autorRol === 'usuario' && p.estado === 'pendiente' && Date.parse(p.venceEn) > ahoraMs);
  const tarifa = tarifaTexto(fee.politica, api.ahora());

  async function abrirChat() {
    const r = await chat.ejecutar(() => api.abrirConversacion(pedido.id));
    if (r.ok) router.push(`${RUTAS.hilo.ruta}?id=${r.valor.id}`);
  }

  return (
    <div className="pila">
      <Volver a={RUTAS.pedidos.ruta} texto="Pedidos" />
      {c.fallo ? <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} /> : null}
      <Tarjeta className={urgente ? 'pedido--urgente' : ''}>
        <div className="fila-flex fila-flex--entre">
          <ChipTipo tipo={pedido.tipo} />
          <span className="texto-suave texto-chico">Publicado {fechaHora(pedido.creadoEn)}</span>
        </div>
        <h1 className="titulo">{NOMBRE_RUBRO[pedido.rubro]}</h1>
        <p>{pedido.descripcion}</p>
        <dl>
          <div className="dato"><dt>Zona</dt><dd>{pedido.zonaAproximada}</dd></div>
          {pedido.fechaSolicitada ? <div className="dato"><dt>Fecha pedida</dt><dd>{fechaHora(pedido.fechaSolicitada)}</dd></div> : null}
        </dl>
        {abierto && pedido.ventanaHasta ? <CuentaRegresiva hasta={pedido.ventanaHasta} texto="La búsqueda cierra en" terminado="La búsqueda terminó" alVencer={() => void c.recargar()} /> : null}
        {tarifa ? <p className="texto-suave texto-chico">{tarifa}</p> : null}
      </Tarjeta>

      <Aviso tono="neutro" icono="candado">
        Todavía no ves el nombre ni la dirección exacta: se muestran cuando el usuario te elige, y solo para ese trabajo.
      </Aviso>
      {pedido.tipo === 'obra' ? (
        <Aviso tono="azul" icono="info">
          Una obra empieza con una visita de presupuesto, que se trata como un pedido programado. Después se presupuesta por etapas.
        </Aviso>
      ) : null}
      {!abierto ? (
        <Aviso tono="aviso" icono="reloj" titulo="La búsqueda terminó" role="status">
          Ya no se pueden enviar propuestas nuevas para este pedido. Si el usuario lo relanza, te volvemos a avisar solo si no lo habías dejado pasar.
        </Aviso>
      ) : null}

      <Seccion titulo="Propuestas">
        {pedido.propuestas.length === 0 ? (
          <Vacio icono="etiqueta" titulo="Todavía no hay propuestas">
            {abierto ? 'Podés enviar la tuya o consultar al usuario por el chat antes. No tenés obligación de hacer ninguna de las dos.' : 'No se enviaron propuestas.'}
          </Vacio>
        ) : (
          <ul className="lista-tarjetas">
            {[...pedido.propuestas].reverse().map((p) => (
              <li key={p.id}>
                <TarjetaPropuesta propuesta={p} puedeActuar={abierto} alCambiar={() => void c.recargar()} alContraofertar={(base) => setForm({ abierta: true, base })} />
              </li>
            ))}
          </ul>
        )}
        {abierto && !pendienteMia && !delUsuarioVigente ? (
          <button type="button" className="boton boton--bloque" onClick={() => setForm({ abierta: true, base: null })}>
            <Icono nombre="enviar" /> Enviar una propuesta
          </button>
        ) : null}
        {pendienteMia ? <p className="texto-suave texto-chico">Tenés una propuesta esperando respuesta. Para cambiarla, retirala o esperá la contraoferta del usuario.</p> : null}
        {delUsuarioVigente && !pendienteMia ? <p className="texto-suave texto-chico">Si no te sirve la propuesta del usuario, contraofertá con tu precio y horario.</p> : null}
      </Seccion>

      <Seccion titulo="Chat">
        <p className="texto-suave">Consultá detalles o pedí fotos antes de cotizar. El chat queda ligado a este pedido y sigue si te contratan.</p>
        {chat.fallo ? <ErrorCaja fallo={chat.fallo} onReintentar={() => void abrirChat()} /> : null}
        {pedido.conversacionId ? (
          <Link className="boton boton--claro boton--bloque" href={`${RUTAS.hilo.ruta}?id=${pedido.conversacionId}`}>
            <Icono nombre="chat" /> Abrir el chat
          </Link>
        ) : (
          <button type="button" className="boton boton--claro boton--bloque" disabled={chat.pendiente || !abierto} onClick={() => void abrirChat()}>
            <Icono nombre="chat" /> {chat.pendiente ? 'Abriendo…' : 'Consultar por el chat'}
          </button>
        )}
      </Seccion>

      <FormPropuesta
        abierta={form.abierta}
        onCerrar={() => setForm((f) => ({ ...f, abierta: false }))}
        pedido={{ id: pedido.id, tipo: pedido.tipo, fechaSolicitada: pedido.fechaSolicitada }}
        base={form.base}
        fee={fee.politica}
        onEnviada={() => {
          setForm({ abierta: false, base: null });
          void c.recargar();
        }}
      />
    </div>
  );
}
