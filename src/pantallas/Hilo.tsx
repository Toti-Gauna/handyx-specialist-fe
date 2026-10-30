'use client';
// Chat de un pedido (lote 4.8): avatar y estado arriba; "Agregar a contactos" y "Programar turno"; respuestas rápidas
// que completan el texto (nunca se mandan solas); propuestas dentro del hilo y fotos. El teléfono del cliente no se
// muestra. Las propuestas y contraofertas se arman en "Tu precio" y vuelven acá.
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { Cargando, ErrorCaja, Vacio } from '../components/Estados.tsx';
import { Icono } from '../components/Icono.tsx';
import { TarjetaPropuesta } from '../components/TarjetaPropuesta.tsx';
import { Volver } from '../components/Volver.tsx';
import { Aviso, Chip } from '../components/ui.tsx';
import type { Conversacion, Mensaje, Propuesta } from '../contracts/dto.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { useIdDeUrl } from '../hooks/useIdDeUrl.ts';
import { fechaHora, hora, nuevaClave } from '../lib/formato.ts';
import { useIsla } from '../kit/Efectos.tsx';
import { Avatar } from '../kit/Piezas.tsx';
import { ETAPA_CHAT } from './Mensajes.tsx';
import './mensajes.css';

interface Saliente {
  clave: string;
  tipo: 'texto' | 'foto';
  texto: string | null;
  archivo?: Blob;
  estado: 'enviando' | 'error';
}

/** Respuestas rápidas: completan el texto para que lo revises y lo mandes vos. */
export const RAPIDAS: Record<Conversacion['etapa'], readonly string[]> = {
  cotizando: ['¿Me mandás una foto del problema?', '¿Qué día y horario te queda bien?', '¿Hay lugar para estacionar cerca?'],
  trabajo: ['Salgo para allá', '¿Qué timbre toco?', '¿Dónde está la llave de paso?', 'Llego en 10 minutos'],
  cerrada: [],
};

export function Hilo() {
  const id = useIdDeUrl();
  const router = useRouter();
  const isla = useIsla();
  const c = useCarga(
    async () => {
      if (!id) return null;
      const [conv, mensajes, propuestas] = await Promise.all([api.conversacion(id), api.mensajes(id), api.propuestasConversacion(id)]);
      // El pedido puede no estar ya disponible (trabajo cerrado): entonces no se ofrece cotizar desde acá.
      const pedido = await api.pedido(conv.pedidoId).catch(() => null);
      return { conv, mensajes, propuestas, pedido };
    },
    [id],
    { cadaMs: 10_000 },
  );
  const [texto, setTexto] = useState('');
  const [salientes, setSalientes] = useState<Saliente[]>([]);
  const contacto = useAccion();
  const fin = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  const foto = useRef<HTMLInputElement>(null);

  const cantidad = (c.datos?.mensajes.length ?? 0) + salientes.length;
  useEffect(() => {
    fin.current?.scrollIntoView({ block: 'end' });
  }, [cantidad]);

  if (!id) return <Vacio icono="chat" titulo="No indicaste qué conversación abrir"><Link href={RUTAS.mensajes.ruta}>Ver mensajes</Link></Vacio>;
  if (c.fallo && !c.datos) return <ErrorCaja pantalla fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  const { conv, mensajes, propuestas, pedido } = c.datos;
  const cerrada = conv.etapa === 'cerrada';
  const abierto = pedido?.estado === 'buscando';
  const pendienteMia = propuestas.some((p) => p.autorRol === 'especialista' && p.estado === 'pendiente' && Date.parse(p.venceEn) > api.ahora().getTime());
  const aTuPrecio = (base?: Propuesta) => (pedido ? `${RUTAS.tuPrecio.ruta}?id=${pedido.id}${base ? `&base=${base.id}` : ''}&chat=${conv.id}` : null);
  const programar = conv.etapa === 'cotizando' && abierto && !pendienteMia ? aTuPrecio() : conv.etapa === 'trabajo' && conv.trabajoId ? `${RUTAS.trabajoCambio.ruta}?id=${conv.trabajoId}` : null;

  async function enviar(s: Saliente) {
    setSalientes((x) => (x.some((y) => y.clave === s.clave) ? x.map((y) => (y.clave === s.clave ? { ...y, estado: 'enviando' } : y)) : [...x, s]));
    try {
      await api.enviarMensaje(conv.id, { tipo: s.tipo, texto: s.texto }, s.clave, s.archivo);
      setSalientes((x) => x.filter((y) => y.clave !== s.clave));
      await c.recargar();
    } catch {
      // Se conserva el mensaje y la clave: reintentar no duplica.
      setSalientes((x) => x.map((y) => (y.clave === s.clave ? { ...y, estado: 'error' } : y)));
    }
  }

  function mandarTexto() {
    const t = texto.trim();
    if (!t) return;
    setTexto('');
    void enviar({ clave: nuevaClave(), tipo: 'texto', texto: t, estado: 'enviando' });
  }

  function usarRapida(r: string) {
    setTexto(r);
    campo.current?.focus();
  }

  async function agregarContacto() {
    const r = await contacto.ejecutar(async () => {
      await api.agregarContacto(conv.id);
      await c.recargar();
    });
    if (r.ok) isla({ titulo: 'Lo agregaste a tus contactos', texto: `${conv.contraparte} queda en Contactos, sin su número.`, icono: 'contactos', tono: 'exito' });
  }

  return (
    <div className="pila me-chat">
      <Volver a={RUTAS.mensajes.ruta} texto="Mensajes" />
      <div className="me-chat__cabeza">
        <Avatar nombre={conv.contraparte} />
        <div className="me-chat__quien">
          <h1 className="titulo">{conv.contraparte}</h1>
          <Chip e={ETAPA_CHAT[conv.etapa]} />
        </div>
      </div>
      <div className="me-chat__enlaces">
        {conv.trabajoId ? <Link href={`${RUTAS.trabajo.ruta}?id=${conv.trabajoId}`}>Ver el trabajo</Link> : null}
        {pedido ? <Link href={`${RUTAS.pedido.ruta}?id=${pedido.id}`}>Ver el pedido</Link> : null}
      </div>
      {!cerrada ? (
        <div className="me-chat__acciones" role="group" aria-label="Acciones del chat">
          {conv.contactoId ? (
            <Link className="hx-chip" href={RUTAS.contactos.ruta}>
              <Icono nombre="check" /> En tus contactos
            </Link>
          ) : (
            <button type="button" className="hx-chip" disabled={contacto.pendiente} onClick={() => void agregarContacto()}>
              <Icono nombre="mas" /> Agregar a contactos
            </button>
          )}
          {programar ? (
            <Link className="hx-chip me-chip--azul" href={programar}>
              <Icono nombre="calendario" /> {conv.etapa === 'trabajo' ? 'Cambiar el turno' : 'Programar turno'}
            </Link>
          ) : null}
        </div>
      ) : null}
      {contacto.fallo ? <ErrorCaja fallo={contacto.fallo} /> : null}
      <Aviso tono="neutro" icono="candado">
        El teléfono del cliente no se muestra. Si querés pasarle el tuyo, es decisión tuya.
      </Aviso>
      {c.fallo ? <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} /> : null}

      <div className="chat" role="log" aria-label="Mensajes de la conversación">
        {mensajes.length === 0 && salientes.length === 0 ? <Vacio icono="chat" titulo="Todavía no hay mensajes">Escribí para consultar o cotizar. Podés pedir fotos del problema.</Vacio> : null}
        {mensajes.map((m) => (
          <Burbuja
            key={m.id}
            m={m}
            propuesta={m.propuestaId ? propuestas.find((p) => p.id === m.propuestaId) : undefined}
            abierto={!!abierto}
            alCambiar={() => void c.recargar()}
            alContraofertar={(base) => {
              const destino = aTuPrecio(base);
              if (destino) router.push(destino);
            }}
          />
        ))}
        {salientes.map((s) => (
          <div key={s.clave} className={`burbuja burbuja--propia${s.estado === 'error' ? ' burbuja--error' : ''}`}>
            <span>{s.tipo === 'foto' ? 'Foto' : s.texto}</span>
            {s.estado === 'enviando' ? <span className="burbuja__meta">Enviando…</span> : (
              <span className="burbuja__meta" role="alert">
                <Icono nombre="alerta" className="icono icono--chico" /> No se envió.{' '}
                <button type="button" className="enlace" onClick={() => void enviar(s)}>Reintentar</button>{' · '}
                <button type="button" className="enlace" onClick={() => setSalientes((x) => x.filter((y) => y.clave !== s.clave))}>Descartar</button>
              </span>
            )}
          </div>
        ))}
        <div ref={fin} />
      </div>

      {cerrada ? (
        <Aviso tono="neutro" icono="check">Esta conversación está cerrada: podés leerla pero no escribir.</Aviso>
      ) : (
        <div className="compositor">
          {RAPIDAS[conv.etapa].length > 0 ? (
            <ul className="hx-chips hx-chips--carril me-rapidas" aria-label="Respuestas rápidas (completan el texto)">
              {RAPIDAS[conv.etapa].map((r) => (
                <li key={r}>
                  <button type="button" className="hx-chip" onClick={() => usarRapida(r)}>
                    {r}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="compositor__fila">
            {api.origen === 'mock' ? (
              <button type="button" className="boton-icono" aria-label="Enviar una foto de prueba" title="Enviar una foto de prueba" onClick={() => void enviar({ clave: nuevaClave(), tipo: 'foto', texto: null, estado: 'enviando' })}>
                <Icono nombre="camara" />
              </button>
            ) : (
              <>
                <input ref={foto} type="file" accept="image/jpeg,image/png,image/webp" className="visualmente-oculto" aria-label="Elegir una foto" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void enviar({ clave: nuevaClave(), tipo: 'foto', texto: null, archivo: f, estado: 'enviando' }); }} />
                <button type="button" className="boton-icono" aria-label="Enviar una foto" onClick={() => foto.current?.click()}><Icono nombre="camara" /></button>
              </>
            )}
            <textarea ref={campo} aria-label="Escribí un mensaje" rows={1} value={texto} maxLength={2000} placeholder="Escribí un mensaje" onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); mandarTexto(); } }} />
            <button type="button" className="boton-icono boton-icono--primario" aria-label="Enviar mensaje" disabled={!texto.trim()} onClick={mandarTexto}>
              <Icono nombre="enviar" />
            </button>
          </div>
          <p className="texto-suave texto-chico">Un aviso nuevo llega al abrir la app; el chat se actualiza solo mientras lo tenés abierto.</p>
        </div>
      )}
    </div>
  );
}

function Burbuja({ m, propuesta, abierto, alCambiar, alContraofertar }: { m: Mensaje; propuesta: Propuesta | undefined; abierto: boolean; alCambiar(): void; alContraofertar(p: Propuesta): void }) {
  if (m.tipo === 'propuesta') {
    return propuesta ? (
      <TarjetaPropuesta propuesta={propuesta} puedeActuar={abierto} alCambiar={alCambiar} alContraofertar={alContraofertar} />
    ) : (
      <div className="burbuja"><span>Propuesta</span></div>
    );
  }
  const propia = m.autorRol === 'especialista';
  return (
    <div className={`burbuja${propia ? ' burbuja--propia' : ''}`}>
      {m.tipo === 'foto' && m.mediaUrl ? (
        <img src={m.mediaUrl} alt="Foto enviada en el chat" />
      ) : null}
      {m.texto ? <span>{m.texto}</span> : null}
      <span className="burbuja__meta">
        {m.autorRol === 'operations' ? 'Handyx · ' : ''}
        {fechaHora(m.enviadoEn).split(' · ')[0]} {hora(m.enviadoEn)}
      </span>
    </div>
  );
}
