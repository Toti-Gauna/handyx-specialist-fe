'use client';
// Jornadas de la obra (lote 4.7): los días de trabajo marcados en el calendario y la lista de jornadas con su etapa.
// Pedir otro día para una jornada es una solicitud: queda pendiente hasta que el cliente acepta y no mueve el resto.
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { Cargando, ErrorCaja, Vacio } from '../../components/Estados.tsx';
import { Hoja } from '../../components/Hoja.tsx';
import { Icono } from '../../components/Icono.tsx';
import { Chip, ChipTipo } from '../../components/ui.tsx';
import { MOTIVOS_CAMBIO, type Jornada, type MotivoCambio, type TrabajoDetalle } from '../../contracts/dto.ts';
import { NOMBRE_RUBRO } from '../../contracts/rubros.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { useIdDeUrl } from '../../hooks/useIdDeUrl.ts';
import type { Etiqueta } from '../../lib/etiquetas.ts';
import { diaLocal, fechaCorta, fechaLarga, hora } from '../../lib/formato.ts';
import { FRANJAS, horarioFranja, MOTIVO_CAMBIO, type Franja } from '../../lib/trabajo.ts';
import { useIsla } from '../../kit/Efectos.tsx';
import { CalendarioMes, TiraDias } from '../../kit/Fechas.tsx';
import { BarraSuperior } from '../../kit/Navegacion.tsx';
import { ChipOpcion } from '../../kit/Piezas.tsx';

const DIA_MS = 86_400_000;
const ACTIVOS = ['agendado', 'en_camino', 'en_sitio', 'en_curso'];

function etiqueta(j: Jornada, hoy: string): Etiqueta {
  if (j.estado === 'hecha') return { texto: 'Hecha', tono: 'exito', icono: 'checkCirculo' };
  if (j.cambioPendiente) return { texto: 'Pediste otro día', tono: 'aviso', icono: 'reloj' };
  if (diaLocal(j.horario.inicio) === hoy) return { texto: 'Hoy', tono: 'azul', icono: 'maletin' };
  if (diaLocal(j.horario.inicio) < hoy) return { texto: 'Sin avance cargado', tono: 'neutro', icono: 'info' };
  return { texto: 'Programada', tono: 'neutro', icono: 'calendario' };
}

export function JornadasObra() {
  const id = useIdDeUrl();
  const c = useCarga(() => (id ? api.trabajo(id) : Promise.resolve(null)), [id]);
  if (!id) return <Vacio icono="maletin" titulo="No indicaste qué obra abrir"><Link href={RUTAS.trabajos.ruta}>Ver mis trabajos</Link></Vacio>;
  if (c.fallo && !c.datos) return <ErrorCaja pantalla fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  return <Jornadas detalle={c.datos} recargar={c.recargar} />;
}

function Jornadas({ detalle: d, recargar }: { detalle: TrabajoDetalle; recargar(): Promise<unknown> }) {
  const t = d.trabajo;
  const volver = `${RUTAS.trabajo.ruta}?id=${t.id}`;
  const hoy = diaLocal(api.ahora().toISOString());
  const primera = d.jornadas[0];
  const inicioMes = (primera ? diaLocal(primera.horario.inicio) : hoy).split('-').map(Number);
  const [mes, setMes] = useState({ anio: inicioMes[0] ?? 2026, mes: inicioMes[1] ?? 11 });
  const [elegido, setElegido] = useState<string | null>(null);
  const [mover, setMover] = useState<Jornada | null>(null);
  const marcas: Record<string, number> = {};
  for (const j of d.jornadas) {
    const dia = diaLocal(j.horario.inicio);
    marcas[dia] = (marcas[dia] ?? 0) + 1;
  }
  const visibles = elegido ? d.jornadas.filter((j) => diaLocal(j.horario.inicio) === elegido) : d.jornadas;
  const nombreEtapa = (j: Jornada) => d.etapas.find((e) => e.id === j.etapaId);

  return (
    <div className="fl-pantalla">
      <BarraSuperior titulo="Jornadas" atras={volver} textoAtras="Volver al trabajo" acciones={null} />
      <div className="fl-ficha">
        <ChipTipo tipo="obra" />
        <p className="fl-ficha__titulo">{NOMBRE_RUBRO[t.rubro]}</p>
        <p className="fl-ficha__linea">
          <Icono nombre="calendario" /> {d.jornadas.length} días de trabajo con {d.contraparte}
        </p>
      </div>

      <CalendarioMes anio={mes.anio} mes={mes.mes} onCambiarMes={(anio, m) => setMes({ anio, mes: m })} hoy={hoy} elegido={elegido} onElegir={(f) => setElegido((x) => (x === f ? null : f))} marcas={marcas} />

      <section className="fl-bloque" aria-labelledby="ob-jornadas-t">
        <div className="ob-lista-cabeza">
          <h2 id="ob-jornadas-t" className="fl-bloque__titulo">
            {elegido ? fechaLarga(`${elegido}T15:00:00.000Z`) : 'Todas las jornadas'}
          </h2>
          {elegido ? (
            <button type="button" className="boton boton--fantasma boton--chico" onClick={() => setElegido(null)}>
              Ver todas
            </button>
          ) : null}
        </div>
        {visibles.length === 0 ? <p className="texto-suave">Ese día no hay jornadas de esta obra.</p> : null}
        <ol className="ob-jornadas">
          {visibles.map((j) => {
            const e = nombreEtapa(j);
            const futura = j.estado === 'programada' && diaLocal(j.horario.inicio) > hoy;
            return (
              <li key={j.id} className="ob-jornada">
                <div className="ob-jornada__cabeza">
                  <p className="ob-jornada__titulo">
                    Jornada {j.numero} de {d.jornadas.length}
                  </p>
                  <Chip e={etiqueta(j, hoy)} />
                </div>
                <p className="ob-jornada__cuando">
                  <Icono nombre="calendario" /> {fechaCorta(j.horario.inicio)} · {hora(j.horario.inicio)}
                  {j.horario.fin ? ` a ${hora(j.horario.fin)}` : ''}
                  {e ? ` · ${e.nombre}` : ''}
                </p>
                {j.cambioPendiente ? (
                  <p className="ob-jornada__cambio" role="status">
                    Pediste pasarla al {fechaLarga(j.cambioPendiente.horario.inicio)} ({MOTIVO_CAMBIO[j.cambioPendiente.motivo].toLowerCase()}). Hasta que el cliente acepte, sigue este día.
                  </p>
                ) : null}
                {futura && !j.cambioPendiente && ACTIVOS.includes(t.estado) ? (
                  <button type="button" className="boton boton--claro boton--chico" onClick={() => setMover(j)}>
                    Pedir otro día<span className="visualmente-oculto"> para la jornada {j.numero}</span>
                  </button>
                ) : null}
              </li>
            );
          })}
        </ol>
        <p className="texto-suave texto-chico">Pedir otro día para una jornada no mueve las demás.</p>
      </section>

      <PedirOtroDia jornada={mover} trabajoId={t.id} total={d.jornadas.length} onCerrar={() => setMover(null)} alEnviar={recargar} />
    </div>
  );
}

function PedirOtroDia({ jornada: j, trabajoId, total, onCerrar, alEnviar }: { jornada: Jornada | null; trabajoId: string; total: number; onCerrar(): void; alEnviar(): Promise<unknown> }) {
  const isla = useIsla();
  const hoy = diaLocal(api.ahora().toISOString());
  const manana = diaLocal(new Date(api.ahora().getTime() + DIA_MS).toISOString());
  const [motivo, setMotivo] = useState<MotivoCambio | null>(null);
  const [dia, setDia] = useState<string | null>(null);
  const [franja, setFranja] = useState<Franja>('dia');
  const [error, setError] = useState<string | null>(null);
  const { pendiente, fallo, ejecutar, clave, limpiar, nueva } = useAccion();
  const horario = dia ? horarioFranja(dia, franja) : null;

  function cerrar() {
    setMotivo(null);
    setDia(null);
    setFranja('dia');
    setError(null);
    limpiar();
    nueva();
    onCerrar();
  }

  async function enviar() {
    if (!j) return;
    if (!motivo || !horario) {
      setError(!motivo ? 'Elegí el motivo: el cliente lo ve.' : 'Elegí el día nuevo.');
      return;
    }
    const r = await ejecutar(async () => {
      await api.pedirCambioJornada(trabajoId, j.id, { horario, motivo }, clave());
      await alEnviar();
    });
    if (r.ok) {
      isla({ titulo: `Pediste otro día para la jornada ${j.numero}`, texto: 'Las demás jornadas no se mueven.', icono: 'calendario', tono: 'exito' });
      cerrar();
    }
  }

  return (
    <Hoja abierta={j !== null} titulo={j ? `Otro día para la jornada ${j.numero} de ${total}` : ''} onCerrar={cerrar}>
      {j ? <p className="texto-suave">Hoy está el {fechaLarga(j.horario.inicio)}. Queda pedido hasta que el cliente acepte.</p> : null}
      <p className="ob-hoja__rotulo">¿Por qué?</p>
      <ul className="hx-chips" aria-label="Motivo">
        {MOTIVOS_CAMBIO.map((m) => (
          <li key={m}>
            <ChipOpcion
              texto={MOTIVO_CAMBIO[m]}
              elegido={motivo === m}
              onClick={() => {
                setMotivo(m);
                setError(null);
              }}
            />
          </li>
        ))}
      </ul>
      <TiraDias
        desde={hoy}
        hoy={hoy}
        cuantos={21}
        minimo={manana}
        elegido={dia}
        onElegir={(x) => {
          setDia(x);
          setError(null);
        }}
        etiqueta="Elegí el día nuevo"
      />
      <ul className="hx-chips" aria-label="Horario">
        {FRANJAS.map((f) => (
          <li key={f.id}>
            <ChipOpcion texto={f.texto} icono="reloj" elegido={franja === f.id} onClick={() => setFranja(f.id)} />
          </li>
        ))}
      </ul>
      {horario ? (
        <p className="tr-resumen" role="status">
          Pedís el <strong>{fechaLarga(horario.inicio)}</strong>, de {hora(horario.inicio)} a {hora(horario.fin)}.
        </p>
      ) : null}
      {error ? (
        <p className="campo__error" role="alert">
          <Icono nombre="alerta" /> {error}
        </p>
      ) : null}
      {fallo ? <ErrorCaja fallo={fallo} onReintentar={() => void enviar()} /> : null}
      <div className="botones">
        <button type="button" className="boton" disabled={pendiente} onClick={() => void enviar()}>
          {pendiente ? 'Enviando…' : 'Pedir este día'}
        </button>
        <button type="button" className="boton boton--claro" onClick={cerrar}>
          Mejor no
        </button>
      </div>
    </Hoja>
  );
}
