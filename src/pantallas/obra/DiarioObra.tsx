'use client';
// Diario de obra (lote 4.7): el avance del día con una nota corta y hasta 4 fotos, que ve el cliente de esta obra.
// Las fotos quedan solo en memoria (vista previa local) hasta publicar; nada se guarda en el navegador. Con la jornada de
// hoy, publicar la marca hecha.
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { Cargando, ErrorCaja, Vacio } from '../../components/Estados.tsx';
import { Icono } from '../../components/Icono.tsx';
import { Aviso, AreaTexto, ChipTipo } from '../../components/ui.tsx';
import { MAX_FOTOS_DIARIO, type TrabajoDetalle } from '../../contracts/dto.ts';
import { NOMBRE_RUBRO } from '../../contracts/rubros.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { useIdDeUrl } from '../../hooks/useIdDeUrl.ts';
import { fechaLarga, hora } from '../../lib/formato.ts';
import { etapaEnCurso, jornadaDeHoy } from '../../lib/obra.ts';
import { useIsla } from '../../kit/Efectos.tsx';
import { BarraSuperior } from '../../kit/Navegacion.tsx';

const MAX_NOTA = 280;

export function DiarioObra() {
  const id = useIdDeUrl();
  const c = useCarga(() => (id ? api.trabajo(id) : Promise.resolve(null)), [id]);
  if (!id) return <Vacio icono="maletin" titulo="No indicaste qué obra abrir"><Link href={RUTAS.trabajos.ruta}>Ver mis trabajos</Link></Vacio>;
  if (c.fallo && !c.datos) return <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  return <Diario detalle={c.datos} recargar={c.recargar} />;
}

interface FotoLocal {
  archivo: File;
  url: string;
}

function Diario({ detalle: d, recargar }: { detalle: TrabajoDetalle; recargar(): Promise<unknown> }) {
  const t = d.trabajo;
  const volver = `${RUTAS.trabajo.ruta}?id=${t.id}`;
  const etapa = etapaEnCurso(d.etapas);
  const jornada = jornadaDeHoy(d.jornadas, api.ahora());
  const puedeCargar = t.estado === 'en_curso' && etapa !== null;

  return (
    <div className="fl-pantalla">
      <BarraSuperior titulo="Diario de obra" atras={volver} textoAtras="Volver al trabajo" acciones={null} />
      <div className="fl-ficha">
        <ChipTipo tipo="obra" />
        <p className="fl-ficha__titulo">{NOMBRE_RUBRO[t.rubro]}</p>
        <p className="fl-ficha__linea">
          <Icono nombre="usuario" /> Lo ve {d.contraparte}, y solo en esta obra
        </p>
      </div>
      {puedeCargar && etapa ? <NuevoAvance trabajoId={t.id} etapaId={etapa.id} etapa={`Etapa ${etapa.orden} · ${etapa.nombre}`} jornada={jornada && jornada.estado === 'programada' ? jornada : null} total={d.jornadas.length} alPublicar={recargar} /> : null}
      {!puedeCargar && t.estado !== 'finalizado' && t.estado !== 'cancelado' ? (
        <Aviso tono="azul" icono="info">
          El diario se completa con la obra en curso: arranca cuando empezás el trabajo el primer día.
        </Aviso>
      ) : null}

      <section className="fl-bloque" aria-labelledby="ob-diario-t">
        <h2 id="ob-diario-t" className="fl-bloque__titulo">
          Avances
        </h2>
        {d.diario.length === 0 ? <p className="texto-suave">Todavía no hay avances cargados.</p> : null}
        <ol className="ob-diario">
          {d.diario.map((e) => {
            const et = d.etapas.find((x) => x.id === e.etapaId);
            const j = e.jornadaId ? d.jornadas.find((x) => x.id === e.jornadaId) : undefined;
            return (
              <li key={e.id} className="ob-avance">
                <p className="ob-avance__cuando">
                  <strong>{fechaLarga(e.creadoEn)}</strong> · {hora(e.creadoEn)}
                </p>
                <p className="ob-avance__etapa">
                  {et ? `Etapa ${et.orden} · ${et.nombre}` : ''}
                  {j ? ` · jornada ${j.numero} de ${d.jornadas.length}` : ''}
                </p>
                <p className="ob-avance__nota">{e.nota}</p>
                {e.fotos.length > 0 ? (
                  <ul className="ob-fotos" aria-label={`${e.fotos.length} ${e.fotos.length === 1 ? 'foto' : 'fotos'}`}>
                    {e.fotos.map((f, i) => (
                      <li key={f.id}>
                        <img src={f.url} alt={`Foto ${i + 1} del avance del ${fechaLarga(e.creadoEn)}`} loading="lazy" />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

function NuevoAvance({ trabajoId, etapaId, etapa, jornada, total, alPublicar }: { trabajoId: string; etapaId: string; etapa: string; jornada: TrabajoDetalle['jornadas'][number] | null; total: number; alPublicar(): Promise<unknown> }) {
  const isla = useIsla();
  const [nota, setNota] = useState('');
  const [fotos, setFotos] = useState<FotoLocal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const entrada = useRef<HTMLInputElement>(null);
  const { pendiente, fallo, ejecutar, clave, nueva } = useAccion();
  const vivas = useRef<FotoLocal[]>([]);
  vivas.current = fotos;
  // Las vistas previas son URLs locales en memoria: se sueltan al quitar una foto, al publicar y al salir.
  useEffect(() => () => vivas.current.forEach((f) => URL.revokeObjectURL(f.url)), []);

  function agregar(lista: FileList | null) {
    if (!lista) return;
    const nuevas = [...lista].filter((f) => f.type.startsWith('image/')).slice(0, MAX_FOTOS_DIARIO - fotos.length);
    setFotos((x) => [...x, ...nuevas.map((archivo) => ({ archivo, url: URL.createObjectURL(archivo) }))]);
    if (lista.length > nuevas.length) setError(`Hasta ${MAX_FOTOS_DIARIO} fotos por avance, y solo imágenes.`);
    if (entrada.current) entrada.current.value = '';
  }
  function quitar(i: number) {
    setFotos((x) => {
      const f = x[i];
      if (f) URL.revokeObjectURL(f.url);
      return x.filter((_, k) => k !== i);
    });
  }

  async function publicar() {
    if (!nota.trim()) {
      setError('Contá en una frase qué hiciste hoy.');
      document.querySelector<HTMLElement>('#ob-nota textarea')?.focus();
      return;
    }
    setError(null);
    const r = await ejecutar(async () => {
      await api.agregarAlDiario(trabajoId, { etapaId, jornadaId: jornada?.id ?? null, nota: nota.trim() }, fotos.map((f) => f.archivo), clave());
      await alPublicar();
    });
    if (r.ok) {
      fotos.forEach((f) => URL.revokeObjectURL(f.url));
      setFotos([]);
      setNota('');
      nueva();
      isla({ titulo: 'Publicaste el avance', texto: 'El cliente ya lo puede ver.', icono: 'imagen', tono: 'exito' });
    }
  }

  return (
    <section className="ob-nuevo" aria-labelledby="ob-nuevo-t">
      <h2 id="ob-nuevo-t" className="fl-bloque__titulo">
        Avance de hoy
      </h2>
      <p className="texto-suave texto-chico">
        {etapa}
        {jornada ? ` · jornada ${jornada.numero} de ${total}` : ' · hoy no hay jornada programada'}
      </p>
      <div id="ob-nota">
        <AreaTexto etiqueta="¿Qué hiciste hoy?" ayuda={`${nota.length} de ${MAX_NOTA}`} value={nota} onChange={(e) => setNota(e.target.value)} maxLength={MAX_NOTA} error={error && !nota.trim() ? error : undefined} />
      </div>
      <div className="ob-nuevo__fotos">
        {fotos.length > 0 ? (
          <ul className="ob-fotos" aria-label="Fotos para publicar">
            {fotos.map((f, i) => (
              <li key={f.url} className="ob-fotos__nueva">
                <img src={f.url} alt={`Foto ${i + 1} para publicar`} />
                <button type="button" className="ob-fotos__quitar" aria-label={`Quitar la foto ${i + 1}`} onClick={() => quitar(i)}>
                  <Icono nombre="cerrar" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <input ref={entrada} id="ob-fotos-entrada" className="visualmente-oculto" type="file" accept="image/*" multiple tabIndex={-1} aria-hidden="true" onChange={(e) => agregar(e.target.files)} />
        {fotos.length < MAX_FOTOS_DIARIO ? (
          <button type="button" className="boton boton--claro" onClick={() => entrada.current?.click()}>
            <Icono nombre="camara" /> {fotos.length ? 'Agregar otra foto' : 'Agregar fotos'}
          </button>
        ) : null}
        <p className="texto-suave texto-chico">Hasta {MAX_FOTOS_DIARIO} fotos del trabajo. Que no se vean personas, documentos ni cosas personales del cliente.</p>
      </div>
      {error && nota.trim() ? (
        <p className="campo__error" role="alert">
          <Icono nombre="alerta" /> {error}
        </p>
      ) : null}
      {fallo ? <ErrorCaja fallo={fallo} onReintentar={() => void publicar()} /> : null}
      <button type="button" className="boton boton--bloque" disabled={pendiente} onClick={() => void publicar()}>
        {pendiente ? 'Publicando…' : 'Publicar en el diario'}
      </button>
    </section>
  );
}
