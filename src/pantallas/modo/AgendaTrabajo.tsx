'use client';
// Tu agenda desde el trabajo (H0-ModoAgenda, lote 2.3): lo que sigue después de este trabajo y avisarle al próximo
// cliente que llegás tarde. El aviso lo mandás vos, por el chat de su trabajo, cuando tocás el botón: nada se manda solo.
// Proponer otro horario abre el pedido de cambio (queda como pedido hasta que el cliente acepte).
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { ErrorCaja } from '../../components/Estados.tsx';
import type { AgendaItem } from '../../contracts/dto.ts';
import { DEMORAS_MINUTOS } from '../../contracts/modo-trabajo.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { useIdDeUrl } from '../../hooks/useIdDeUrl.ts';
import { useIsla } from '../../kit/Efectos.tsx';
import { BotonEnlace } from '../../ui/atomos/Boton.tsx';
import { Icono } from '../../ui/atomos/Icono.tsx';
import { Chip, Etiqueta } from '../../ui/atomos/Texto.tsx';
import { hoyBA, loQueSigue, minutosDePasado, textoDuracion, tituloTrabajo } from '../../ui/logicaModo.ts';
import { fechaBA, horaConMinutos, minutosBA, nombreDia } from '../../ui/logicaNucleo.ts';
import { Tarjeta } from '../../ui/moleculas/Tarjeta.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import { conId, estadoCarga } from './comunes.tsx';
import '../../ui/nucleo.css';

const TITULO = 'Tu agenda';
const DIAS_A_MIRAR = 3;

export function AgendaTrabajo() {
  const id = useIdDeUrl();
  const c = useCarga(async () => {
    if (!id) return null;
    const ahora = api.ahora();
    const [detalle, agenda] = await Promise.all([api.trabajo(id), api.agenda(ahora.toISOString(), new Date(ahora.getTime() + DIAS_A_MIRAR * 86_400_000).toISOString())]);
    return { detalle, siguen: loQueSigue(agenda, id, ahora.getTime()), ahora };
  }, [id]);
  const antes = estadoCarga(c, id, TITULO);
  if (antes || !c.datos || !id) return antes;
  const { detalle, siguen, ahora } = c.datos;
  const pasado = detalle.trabajo.estado === 'en_curso' ? minutosDePasado(detalle.trabajo.acuerdo.horario.fin, ahora.getTime()) : 0;
  const hoy = hoyBA(ahora);
  return (
    <PantallaSecundaria
      barra={<BarraCompacta titulo={TITULO} subtitulo={`Desde el trabajo · ${tituloTrabajo(detalle.trabajo.acuerdo.alcance)}`} hrefVolver={conId('modoTrabajo', id)} />}
      accion={
        <AccionFija>
          <BotonEnlace icono="agenda" href={RUTAS.agenda.ruta}>
            Ver toda la agenda
          </BotonEnlace>
        </AccionFija>
      }
    >
      {pasado > 0 ? (
        <p className="mt-aviso">
          <Icono nombre="reloj" />
          {`Este trabajo va ${textoDuracion(pasado * 60_000)} más de lo previsto.`}
        </p>
      ) : null}
      <Tarjeta etiqueta="Lo que sigue">
        <Etiqueta como="h2">Lo que sigue</Etiqueta>
        {siguen.length === 0 ? <p className="mt-nota">{`No tenés más trabajos en los próximos ${DIAS_A_MIRAR} días.`}</p> : null}
        <ul className="mt-lista">
          {siguen.slice(0, 4).map((i) => (
            <li key={i.id}>
              <Link className="mt-sigue" href={conId('trabajo', i.trabajoId ?? '')}>
                <span className="mt-sigue__hora">{horaConMinutos(minutosBA(i.inicio))}</span>
                <span className="mt-sigue__texto">
                  <strong>{i.titulo}</strong>
                  <span>{diaConMayuscula(nombreDia(fechaBA(i.inicio), hoy))}</span>
                  <Chip tono={i.estado === 'cambio_pendiente' ? 'amarillo' : 'noche'} icono={i.estado === 'cambio_pendiente' ? 'reloj' : 'agenda'}>
                    {i.estado === 'cambio_pendiente' ? 'Cambio de fecha pedido' : 'Agendado'}
                  </Chip>
                </span>
                <Icono nombre="flecha" className="ui-fila__flecha" />
              </Link>
            </li>
          ))}
        </ul>
      </Tarjeta>
      {siguen[0] ? <AvisarDemora proximo={siguen[0]} /> : null}
    </PantallaSecundaria>
  );
}

const diaConMayuscula = (d: string) => d.charAt(0).toUpperCase() + d.slice(1);

function AvisarDemora({ proximo }: { proximo: AgendaItem }) {
  const isla = useIsla();
  const demora = useAccion();
  const [avisado, setAvisado] = useState<number | null>(null);
  const trabajoId = proximo.trabajoId ?? '';
  async function avisar(minutos: (typeof DEMORAS_MINUTOS)[number]) {
    const r = await demora.ejecutar(() => api.avisarDemora(trabajoId, { minutos }, demora.clave()));
    if (r.ok) {
      setAvisado(minutos);
      isla({
        titulo: 'Avisaste la demora',
        texto: `Le llegó al chat: «Llego ${minutos} minutos tarde».`,
        icono: 'reloj',
      });
    }
  }
  return (
    <section className="mt-bloque" aria-labelledby="mt-avisar">
      <h2 id="mt-avisar" className="mt-subtitulo">
        Avisarle al próximo cliente
      </h2>
      <p className="mt-nota">{proximo.titulo}</p>
      <div className="ui-atajos" role="group" aria-label="Avisar una demora">
        {DEMORAS_MINUTOS.map((m) => (
          <button key={m} type="button" className="ui-atajo mt-atajo" aria-pressed={avisado === m} disabled={demora.pendiente} onClick={() => void avisar(m)}>
            {`Llego ${m} min tarde`}
          </button>
        ))}
        <Link className="ui-atajo mt-atajo" href={conId('trabajoCambio', trabajoId)}>
          Proponer otro horario
        </Link>
      </div>
      {avisado ? (
        <p className="mt-nota" role="status">
          {`Avisaste que llegás ${avisado} minutos tarde.`}
        </p>
      ) : null}
      {demora.fallo ? <ErrorCaja fallo={demora.fallo} /> : null}
      <p className="mt-nota">Se manda por el chat de su trabajo cuando lo tocás. Nada se manda solo.</p>
    </section>
  );
}
