'use client';
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { Cargando, ErrorCaja, Vacio } from '../components/Estados.tsx';
import { FormPropuesta } from '../components/FormPropuesta.tsx';
import { Icono } from '../components/Icono.tsx';
import { TarjetaPropuesta } from '../components/TarjetaPropuesta.tsx';
import { Volver } from '../components/Volver.tsx';
import { Aviso, Chip } from '../components/ui.tsx';
import type { Mensaje, Propuesta } from '../contracts/dto.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { useIdDeUrl } from '../hooks/useIdDeUrl.ts';
import { fechaHora, hora, nuevaClave } from '../lib/formato.ts';

interface Saliente {
  clave: string;
  tipo: 'texto' | 'foto';
  texto: string | null;
  archivo?: Blob;
  estado: 'enviando' | 'error';
}

const ETAPA = { cotizando: { texto: 'Cotizando', tono: 'azul', icono: 'etiqueta' }, trabajo: { texto: 'Trabajo agendado', tono: 'exito', icono: 'maletin' }, cerrada: { texto: 'Cerrada', tono: 'neutro', icono: 'check' } } as const;

export function Hilo() {
  const id = useIdDeUrl();
  const c = useCarga(
    async () => {
      if (!id) return null;
      const [conv, mensajes, propuestas, fee] = await Promise.all([api.conversacion(id), api.mensajes(id), api.propuestasConversacion(id), api.feeVigente()]);
      // El pedido puede no estar ya disponible (trabajo cerrado): entonces no se ofrece cotizar desde acá.
      const pedido = await api.pedido(conv.pedidoId).catch(() => null);
      return { conv, mensajes, propuestas, fee, pedido };
    },
    [id],
    { cadaMs: 10_000 },
  );
  const [texto, setTexto] = useState('');
  const [salientes, setSalientes] = useState<Saliente[]>([]);
  const [form, setForm] = useState<{ abierta: boolean; base: Propuesta | null }>({ abierta: false, base: null });
  const fin = useRef<HTMLDivElement>(null);
  const foto = useRef<HTMLInputElement>(null);

  const cantidad = (c.datos?.mensajes.length ?? 0) + salientes.length;
  useEffect(() => {
    fin.current?.scrollIntoView({ block: 'end' });
  }, [cantidad]);

  if (!id) return <Vacio icono="chat" titulo="No indicaste qué conversación abrir"><Link href={RUTAS.mensajes.ruta}>Ver mensajes</Link></Vacio>;
  if (c.fallo && !c.datos) return <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  const { conv, mensajes, propuestas, fee, pedido } = c.datos;
  const cerrada = conv.etapa === 'cerrada';
  const abierto = pedido?.estado === 'buscando';
  const pendienteMia = propuestas.some((p) => p.autorRol === 'especialista' && p.estado === 'pendiente' && Date.parse(p.venceEn) > api.ahora().getTime());

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

  return (
    <div className="pila">
      <Volver a={RUTAS.mensajes.ruta} texto="Mensajes" />
      <div className="fila-flex fila-flex--entre">
        <h1 className="titulo">{conv.contraparte}</h1>
        <Chip e={ETAPA[conv.etapa]} />
      </div>
      <div className="fila-flex">
        {conv.trabajoId ? <Link href={`${RUTAS.trabajo.ruta}?id=${conv.trabajoId}`}>Ver el trabajo</Link> : null}
        {pedido ? <Link href={`${RUTAS.pedido.ruta}?id=${pedido.id}`}>Ver el pedido</Link> : null}
      </div>
      <Aviso tono="neutro" icono="candado">
        El teléfono del usuario no se muestra. Si querés pasarle el tuyo, es decisión tuya.
      </Aviso>
      {c.fallo ? <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} /> : null}

      <div className="chat" role="log" aria-label="Mensajes de la conversación">
        {mensajes.length === 0 && salientes.length === 0 ? <Vacio icono="chat" titulo="Todavía no hay mensajes">Escribí para consultar o cotizar. Podés pedir fotos del problema.</Vacio> : null}
        {mensajes.map((m) => (
          <Burbuja key={m.id} m={m} propuesta={m.propuestaId ? propuestas.find((p) => p.id === m.propuestaId) : undefined} abierto={!!abierto} alCambiar={() => void c.recargar()} alContraofertar={(base) => setForm({ abierta: true, base })} />
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

      {abierto && !pendienteMia && conv.etapa === 'cotizando' ? (
        <button type="button" className="boton boton--claro boton--bloque" onClick={() => setForm({ abierta: true, base: null })}>
          <Icono nombre="etiqueta" /> Enviar un presupuesto en el chat
        </button>
      ) : null}

      {cerrada ? (
        <Aviso tono="neutro" icono="check">Esta conversación está cerrada: podés leerla pero no escribir.</Aviso>
      ) : (
        <div className="compositor">
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
            <textarea aria-label="Escribí un mensaje" rows={1} value={texto} maxLength={2000} placeholder="Escribí un mensaje" onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); mandarTexto(); } }} />
            <button type="button" className="boton-icono boton-icono--primario" aria-label="Enviar mensaje" disabled={!texto.trim()} onClick={mandarTexto}>
              <Icono nombre="enviar" />
            </button>
          </div>
          <p className="texto-suave texto-chico">Un aviso nuevo llega al abrir la app; el chat se actualiza solo mientras lo tenés abierto.</p>
        </div>
      )}

      {pedido ? (
        <FormPropuesta abierta={form.abierta} onCerrar={() => setForm((f) => ({ ...f, abierta: false }))} pedido={{ id: pedido.id, tipo: pedido.tipo, fechaSolicitada: pedido.fechaSolicitada }} base={form.base} fee={fee.politica} onEnviada={() => { setForm({ abierta: false, base: null }); void c.recargar(); }} />
      ) : null}
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
        {m.autorRol === 'operations' ? 'Handy · ' : ''}
        {fechaHora(m.enviadoEn).split(' · ')[0]} {hora(m.enviadoEn)}
      </span>
    </div>
  );
}
