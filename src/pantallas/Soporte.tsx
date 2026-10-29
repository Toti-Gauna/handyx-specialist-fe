'use client';
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { Cargando, ErrorCaja, Vacio } from '../components/Estados.tsx';
import { Hoja } from '../components/Hoja.tsx';
import { Icono } from '../components/Icono.tsx';
import { Aviso, AreaTexto, Campo, Casilla, Chip, Seleccion } from '../components/ui.tsx';
import { NuevoCasoSchema } from '../contracts/dto.ts';
import { NOMBRE_RUBRO } from '../contracts/rubros.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { CATEGORIA_SOPORTE, SOPORTE } from '../lib/etiquetas.ts';
import { fechaHora } from '../lib/formato.ts';

export function Soporte() {
  const router = useRouter();
  const trabajoUrl = useSearchParams().get('trabajo');
  const c = useCarga(async () => {
    const [casos, activos, historial] = await Promise.all([api.casos(), api.trabajos('activos'), api.trabajos('historial')]);
    return { casos, trabajos: [...activos.items, ...historial.items] };
  }, []);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (trabajoUrl) setAbierto(true);
  }, [trabajoUrl]);

  if (c.fallo && !c.datos) return <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  const { casos, trabajos } = c.datos;

  return (
    <div className="pila">
      <h1 className="titulo">Ayuda y reclamos</h1>
      <p className="texto-suave">Pedí ayuda sobre un trabajo, un pago o tu cuenta, o hacé un reclamo. Las respuestas y el estado quedan acá.</p>
      <button type="button" className="boton boton--bloque" onClick={() => setAbierto(true)}>
        <Icono nombre="mas" /> Abrir un caso
      </button>
      {casos.length === 0 ? (
        <Vacio icono="pregunta" titulo="No abriste ningún caso" />
      ) : (
        <ul className="lista-tarjetas">
          {casos.map((k) => (
            <li key={k.id}>
              <Link className="tarjeta" href={`${RUTAS.casoSoporte.ruta}?id=${k.id}`}>
                <div className="fila-flex fila-flex--entre">
                  <span className="tarjeta__titulo">{k.asunto}</span>
                  <Chip e={SOPORTE[k.estado]} />
                </div>
                <p className="texto-suave texto-chico">{CATEGORIA_SOPORTE[k.categoria]} · actualizado {fechaHora(k.actualizadoEn)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <NuevoCaso abierta={abierto} onCerrar={() => setAbierto(false)} trabajos={trabajos.map((t) => ({ id: t.id, texto: `${NOMBRE_RUBRO[t.rubro]} · ${fechaHora(t.acuerdo.horario.inicio)}` }))} trabajoInicial={trabajoUrl} onCreado={(id) => router.push(`${RUTAS.casoSoporte.ruta}?id=${id}`)} />
    </div>
  );
}

function NuevoCaso({ abierta, onCerrar, trabajos, trabajoInicial, onCreado }: { abierta: boolean; onCerrar(): void; trabajos: Array<{ id: string; texto: string }>; trabajoInicial: string | null; onCreado(id: string): void }) {
  const { pendiente, fallo, ejecutar, clave, nueva, limpiar } = useAccion();
  const [categoria, setCategoria] = useState<'asistencia' | 'reclamo' | 'pago' | 'cuenta'>(trabajoInicial ? 'reclamo' : 'asistencia');
  const [trabajoId, setTrabajoId] = useState(trabajoInicial ?? '');
  const [asunto, setAsunto] = useState('');
  const [detalle, setDetalle] = useState('');
  const [adjunto, setAdjunto] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

  useEffect(() => {
    if (abierta) {
      setTrabajoId(trabajoInicial ?? '');
      if (trabajoInicial) setCategoria('reclamo');
      setErrores({});
      limpiar();
      nueva();
    }
  }, [abierta, trabajoInicial, limpiar, nueva]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const datos = { categoria, trabajoId: trabajoId || null, pedidoId: null, asunto, detalle, adjuntos: adjunto ? 1 : 0 };
    const ok = NuevoCasoSchema.safeParse(datos);
    if (!ok.success) {
      const err: Record<string, string> = {};
      for (const i of ok.error.issues) err[String(i.path[0])] = i.path[0] === 'asunto' ? 'Escribí un asunto de al menos 3 letras.' : 'Contanos qué pasó.';
      setErrores(err);
      return;
    }
    setErrores({});
    const r = await ejecutar(() => api.abrirCaso(ok.data, clave()));
    if (r.ok) {
      onCerrar();
      setAsunto('');
      setDetalle('');
      onCreado(r.valor.id);
    }
  }

  return (
    <Hoja abierta={abierta} titulo="Abrir un caso" onCerrar={onCerrar}>
      <form className="pila" onSubmit={(e) => void enviar(e)} noValidate>
        {fallo ? <ErrorCaja fallo={fallo} /> : null}
        <Seleccion etiqueta="¿Sobre qué es?" value={categoria} onChange={(e) => setCategoria(e.target.value as typeof categoria)}>
          {Object.entries(CATEGORIA_SOPORTE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Seleccion>
        <Seleccion etiqueta="Trabajo relacionado (opcional)" value={trabajoId} onChange={(e) => setTrabajoId(e.target.value)}>
          <option value="">Ninguno</option>
          {trabajos.map((t) => <option key={t.id} value={t.id}>{t.texto}</option>)}
        </Seleccion>
        <Campo etiqueta="Asunto" value={asunto} onChange={(e) => setAsunto(e.target.value)} error={errores.asunto} maxLength={120} />
        <AreaTexto etiqueta="Contanos qué pasó" value={detalle} onChange={(e) => setDetalle(e.target.value)} error={errores.detalle} maxLength={4000} />
        <Casilla etiqueta={api.origen === 'mock' ? 'Adjuntar una foto de prueba' : 'Voy a agregar una foto al caso'} checked={adjunto} onChange={(e) => setAdjunto(e.target.checked)} />
        <Aviso tono="neutro" icono="info">Vas a ver las respuestas y el estado acá. No te prometemos un plazo de respuesta.</Aviso>
        <button type="submit" className="boton boton--bloque" disabled={pendiente}>{pendiente ? 'Enviando…' : 'Enviar'}</button>
      </form>
    </Hoja>
  );
}
