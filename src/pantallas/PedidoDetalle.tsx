'use client';
// Pedido (F-Pedido, lote 1.3) abierto desde un aviso, la bandeja o el chat: el mismo detalle que la hoja del Inicio, en
// una hoja sobre el mapa, con las propuestas del pedido (la tuya, la del cliente, contraofertar o retirar). Desde acá se
// cotiza, se propone otra fecha o se deja pasar («Ahora no» no tiene ninguna consecuencia). Nunca acepta nada desde el
// aviso, y la dirección exacta llega recién cuando el cliente acepta.
import { api } from '@handyx/origen-datos';
import { useRouter } from 'next/navigation';
import type { ZonaMapa } from '../contracts/dto.ts';
import { Mapa } from '../mapa/Mapa.tsx';
import { RUTAS } from '../app/rutas.ts';
import { EstadoMiPropuesta } from '../components/EstadoMiPropuesta.tsx';
import { ErrorCaja } from '../components/Estados.tsx';
import { TarjetaPropuesta } from '../components/TarjetaPropuesta.tsx';
import { useAccion } from '../hooks/useAccion.ts';
import { useAhora } from '../hooks/useAhora.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { useIdDeUrl } from '../hooks/useIdDeUrl.ts';
import { useIsla } from '../kit/Efectos.tsx';
import { diaLocal } from '../lib/formato.ts';
import { BotonEnlace, BotonIconoEnlace } from '../ui/atomos/Boton.tsx';
import { Chip, Etiqueta } from '../ui/atomos/Texto.tsx';
import { PantallaHoja } from '../ui/plantillas/Plantillas.tsx';
import { AccionesPedido, ContenidoPedido } from './nucleo/DetallePedido.tsx';
import { PantallaFallo } from './nucleo/Fallo.tsx';
import { vistaDesdeDetalle } from './nucleo/vista.ts';
import './nucleo/nucleo.css';

/** Detrás de la hoja, el mapa con la zona aproximada (sin pin de destino); sin pedido, las manzanas dibujadas. */
function Fondo({ zona, nombre }: { zona?: ZonaMapa | null; nombre?: string }) {
  if (zona && nombre)
    return (
      <div className="nu-fondo-mapa">
        <Mapa etiqueta={`Zona aproximada del pedido en ${nombre}`} alto="completo" zona={zona} tapadoAbajo={0.55} alternativa={<p>{`Zona aproximada: ${nombre}`}</p>} />
      </div>
    );
  return (
    <div className="ui-mapa-estilizado" aria-hidden="true">
      <div className="ui-mapa-estilizado__manzanas" />
      <div className="ui-mapa-estilizado__costa" />
      <span className="nu-zona-deco" />
    </div>
  );
}

export function PedidoDetalle() {
  const id = useIdDeUrl();
  const router = useRouter();
  const isla = useIsla();
  const ahora = useAhora(1000);
  const descarte = useAccion();
  const c = useCarga(async () => (id ? api.pedido(id) : null), [id]);

  if (!id || (c.fallo?.tipo === 'no_encontrado' && !c.datos)) {
    return (
      <PantallaHoja fondo={<Fondo />}>
        <div className="nu-hoja-fija">
          <h1 className="ui-titulo ui-titulo--medio">Este pedido no está disponible</h1>
          <p>Ya no está abierto o no corresponde a tus rubros y zonas.</p>
          <BotonEnlace href={RUTAS.inicio.ruta}>Volver al inicio</BotonEnlace>
        </div>
      </PantallaHoja>
    );
  }
  if (c.fallo && !c.datos) return <PantallaFallo fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <div className="nu-vacio" aria-busy="true" />;

  const pedido = c.datos;
  const v = vistaDesdeDetalle(pedido);
  const hoy = diaLocal(ahora.toISOString());
  const ahoraMs = ahora.getTime();
  const pendienteMia = pedido.propuestas.some((p) => p.autorRol === 'especialista' && p.estado === 'pendiente' && Date.parse(p.venceEn) > ahoraMs);
  const delCliente = pedido.propuestas.some((p) => p.autorRol === 'usuario' && p.estado === 'pendiente' && Date.parse(p.venceEn) > ahoraMs);
  const puedeCotizar = v.abierto && !pendienteMia && !delCliente;

  async function ahoraNo() {
    if (!id) return;
    const r = await descarte.ejecutar(() => api.descartarPedido(id));
    if (r.ok) {
      isla({ titulo: 'Lo sacamos de tu mapa', texto: 'No tiene ninguna consecuencia.', icono: 'check' });
      router.push(RUTAS.inicio.ruta);
    }
  }

  return (
    <PantallaHoja fondo={<Fondo zona={pedido.zonaMapa} nombre={pedido.zonaAproximada} />}>
      <div className="nu-arriba nu-pantalla-pedido">
        <BotonIconoEnlace icono="atras" etiqueta="Volver al inicio" href={RUTAS.inicio.ruta} />
        <Chip tono="noche" icono="campana">
          {v.tipo === 'urgente' ? 'Pedido urgente' : v.tipo === 'obra' ? 'Pedido de obra' : 'Pedido programado'}
        </Chip>
      </div>
      <section className="nu-hoja-fija" aria-labelledby="nu-pedido-h1">
        <span className="ui-hoja__manija nu-manija" aria-hidden="true">
          <span />
        </span>
        <h1 id="nu-pedido-h1" className="visualmente-oculto">{`Pedido de ${v.titulo}`}</h1>
        {c.fallo ? <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} /> : null}
        <ContenidoPedido v={v} ahora={ahora} hoy={hoy} />
        <p className="nu-nota">El círculo es aproximado: todavía no ves el nombre ni la dirección exacta. Se muestran cuando el cliente te elige, y solo para ese trabajo.</p>
        {pedido.tipo === 'obra' ? <p className="nu-nota">Una obra empieza con una visita para presupuestar; después se presupuesta por etapas.</p> : null}
        {!v.abierto && !pedido.trabajoId ? <p className="nu-nota">La búsqueda de este pedido terminó: ya no se pueden enviar propuestas.</p> : null}
        <EstadoMiPropuesta pedido={pedido} alCambiar={() => void c.recargar()} />
        {pedido.propuestas.length > 0 ? (
          <div className="nu-propuestas">
            <Etiqueta como="h2">Propuestas</Etiqueta>
            <ul className="lista-tarjetas">
              {[...pedido.propuestas].reverse().map((p) => (
                <li key={p.id}>
                  <TarjetaPropuesta propuesta={p} puedeActuar={v.abierto} alCambiar={() => void c.recargar()} alContraofertar={(b) => router.push(`${RUTAS.tuPrecio.ruta}?id=${pedido.id}&base=${b.id}`)} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {pendienteMia ? <p className="nu-nota">Tu propuesta espera respuesta. Para cambiarla, retirala o esperá la contraoferta del cliente.</p> : null}
        {descarte.fallo ? <ErrorCaja fallo={descarte.fallo} /> : null}
        {puedeCotizar ? (
          <div className="nu-hoja-fija__pie">
            <AccionesPedido v={v} ocupado={descarte.pendiente} onAhoraNo={() => void ahoraNo()} />
          </div>
        ) : pedido.conversacionId ? (
          <BotonEnlace variante="contorno" icono="chat" href={`${RUTAS.hilo.ruta}?id=${pedido.conversacionId}`}>
            Abrir el chat
          </BotonEnlace>
        ) : null}
      </section>
    </PantallaHoja>
  );
}
