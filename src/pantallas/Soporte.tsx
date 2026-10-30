'use client';
// Centro de ayuda (lote 4.8): preguntas frecuentes por tema en pastillas, tus casos y "Abrir un caso" (asistencia o
// reclamo, opcionalmente sobre un trabajo). Las respuestas de Handyx y el estado quedan en cada caso.
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
import { enfocarPrimerError } from '../lib/foco.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { CATEGORIA_SOPORTE, SOPORTE } from '../lib/etiquetas.ts';
import { fechaHora } from '../lib/formato.ts';
import { TEMAS_AYUDA } from '../lib/ayuda.ts';
import { ChipOpcion } from '../kit/Piezas.tsx';
import './ayuda.css';

export function Soporte() {
  const router = useRouter();
  const trabajoUrl = useSearchParams().get('trabajo');
  const c = useCarga(async () => {
    const [casos, activos, historial] = await Promise.all([api.casos(), api.trabajos('activos'), api.trabajos('historial')]);
    return { casos, trabajos: [...activos.items, ...historial.items] };
  }, []);
  const [abierto, setAbierto] = useState(false);
  const [tema, setTema] = useState<string>(TEMAS_AYUDA[0]?.id ?? '');

  useEffect(() => {
    if (trabajoUrl) setAbierto(true);
  }, [trabajoUrl]);

  if (c.fallo && !c.datos) return <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  const { casos, trabajos } = c.datos;

  const elegido = TEMAS_AYUDA.find((t) => t.id === tema) ?? TEMAS_AYUDA[0];

  return (
    <div className="pila ay">
      <h1 className="titulo">Centro de ayuda</h1>
      <section className="ay-temas" aria-labelledby="ay-temas-t">
        <h2 id="ay-temas-t" className="ay-subtitulo">
          Preguntas frecuentes
        </h2>
        <ul className="hx-chips" aria-label="Temas">
          {TEMAS_AYUDA.map((t) => (
            <li key={t.id}>
              <ChipOpcion texto={t.texto} icono={t.icono} elegido={elegido?.id === t.id} onClick={() => setTema(t.id)} />
            </li>
          ))}
        </ul>
        {elegido ? (
          <div className="ay-preguntas" aria-live="polite">
            {elegido.preguntas.map((q) => (
              <details key={q.pregunta} className="ay-pregunta">
                <summary>
                  <span>{q.pregunta}</span>
                  <Icono nombre="abajo" />
                </summary>
                <p>{q.respuesta}</p>
              </details>
            ))}
          </div>
        ) : null}
      </section>

      <section className="ay-casos" aria-labelledby="ay-casos-t">
        <h2 id="ay-casos-t" className="ay-subtitulo">
          Tus casos
        </h2>
        <p className="texto-suave">¿No encontraste la respuesta? Pedí ayuda sobre un trabajo, un pago o tu cuenta, o hacé un reclamo. Las respuestas y el estado quedan acá.</p>
        <button type="button" className="boton boton--bloque" onClick={() => setAbierto(true)}>
          <Icono nombre="mas" /> Abrir un caso
        </button>
        {casos.length === 0 ? (
          <Vacio icono="pregunta" titulo="No abriste ningún caso" />
        ) : (
          <ul className="ay-lista">
            {casos.map((k) => (
              <li key={k.id}>
                <Link className="ay-caso" href={`${RUTAS.casoSoporte.ruta}?id=${k.id}`}>
                  <span className="ay-caso__texto">
                    <strong>{k.asunto}</strong>
                    <small>
                      {CATEGORIA_SOPORTE[k.categoria]} · actualizado {fechaHora(k.actualizadoEn)}
                    </small>
                  </span>
                  <Chip e={SOPORTE[k.estado]} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
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

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const datos = { categoria, trabajoId: trabajoId || null, pedidoId: null, asunto, detalle, adjuntos: adjunto ? 1 : 0 };
    const ok = NuevoCasoSchema.safeParse(datos);
    if (!ok.success) {
      const err: Record<string, string> = {};
      for (const i of ok.error.issues) err[String(i.path[0])] = i.path[0] === 'asunto' ? 'Escribí un asunto de al menos 3 letras.' : 'Contanos qué pasó.';
      setErrores(err);
      return enfocarPrimerError(form);
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
