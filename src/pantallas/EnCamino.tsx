'use client';
// En camino (TR-EnCamino, lote 1.3): el mapa a pantalla completa con el destino, tu posición en vivo y el trayecto. La
// ubicación se comparte solo si la persona lo elige después de leer para qué, solo con esta pantalla abierta y solo con el
// cliente de este trabajo, que te ve únicamente durante el viaje. La llegada se marca sola al estar en la puerta
// (geocerca del servidor); «Ya llegué» aparece como respaldo cuando la ubicación anda mal. Se puede avisar una demora
// (15 o 30 minutos, por el chat) o dejar de compartir. La llegada estimada es tuya: al cliente no se le promete nada.
import { api } from '@handyx/origen-datos';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { ErrorCaja } from '../components/Estados.tsx';
import type { Viaje } from '../contracts/dto.ts';
import { DEMORAS_MINUTOS } from '../contracts/modo-trabajo.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { useAhora } from '../hooks/useAhora.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { useCompartirUbicacion } from '../hooks/useCompartirUbicacion.ts';
import { useIdDeUrl } from '../hooks/useIdDeUrl.ts';
import { useIsla } from '../kit/Efectos.tsx';
import { hora } from '../lib/formato.ts';
import { enlacesNavegacion, loQueFalta, textoDistancia, textoDuracion, type Senal } from '../lib/geo.ts';
import { MOTIVO_LLEGADA, motivoRespaldo } from '../lib/trabajo.ts';
import { Mapa } from '../mapa/Mapa.tsx';
import { Avatar } from '../ui/atomos/Avatar.tsx';
import { Boton, BotonEnlace, BotonIcono, BotonIconoEnlace } from '../ui/atomos/Boton.tsx';
import { Icono } from '../ui/atomos/Icono.tsx';
import { Chip, type TonoChip } from '../ui/atomos/Texto.tsx';
import type { NombreIconoUi } from '../ui/atomos/Icono.tsx';
import { Hoja } from '../ui/organismos/Hoja.tsx';
import { BarraCompacta } from '../ui/organismos/Cabeceras.tsx';
import { PantallaMapa, PantallaSecundaria } from '../ui/plantillas/Plantillas.tsx';
import { PantallaFallo } from './nucleo/Fallo.tsx';
import './nucleo/nucleo.css';

const SENAL: Record<Senal, { texto: string; icono: NombreIconoUi; tono: TonoChip }> = {
  buscando: { texto: 'Buscando tu ubicación…', icono: 'lupa', tono: 'gris' },
  normal: { texto: 'Ubicación precisa', icono: 'check', tono: 'exito' },
  imprecisa: { texto: 'Ubicación imprecisa', icono: 'alerta', tono: 'amarillo' },
  sin_senal: { texto: 'Sin señal de ubicación', icono: 'alerta', tono: 'amarillo' },
  sin_permiso: { texto: 'Sin permiso de ubicación', icono: 'alerta', tono: 'error' },
  no_disponible: { texto: 'Tu teléfono no da la ubicación', icono: 'alerta', tono: 'error' },
};

export function EnCamino() {
  const id = useIdDeUrl();
  const router = useRouter();
  const isla = useIsla();
  const llegada = useAccion();
  const demora = useAccion();
  const ahora = useAhora();
  const [avisar, setAvisar] = useState(false);
  const c = useCarga(async () => {
    if (!id) return null;
    const detalle = await api.trabajo(id);
    return { detalle, viaje: detalle.trabajo.destino ? await api.viaje(id) : null };
  }, [id]);
  const [viajeVivo, setViajeVivo] = useState<Viaje | null>(null);
  const versionTrayecto = useRef<number | null>(null);

  function alViaje(v: Viaje) {
    // El servidor marcó la llegada (geocerca): deja de compartir y abre el trabajo. El cliente ya recibió el aviso.
    if (v.estado === 'terminado' && c.datos?.detalle.trabajo.estado === 'en_camino') {
      isla({ titulo: '¡Llegaste!', texto: `Le avisamos a ${c.datos.detalle.contraparte}.`, icono: 'check', tono: 'exito' });
      router.replace(`${RUTAS.trabajo.ruta}?id=${v.trabajoId}`);
      return;
    }
    const antes = versionTrayecto.current;
    if (v.trayecto && antes !== null && v.trayecto.version > antes) isla({ titulo: 'Recalculamos el trayecto', texto: 'Seguí la línea azul nueva.', icono: 'pin' });
    if (v.trayecto) versionTrayecto.current = v.trayecto.version;
    setViajeVivo(v);
  }
  const gps = useCompartirUbicacion(id, alViaje, () => void c.recargar());
  const estadoTrabajo = c.datos?.detalle.trabajo.estado;
  const { activa, parar } = gps;
  useEffect(() => {
    if (activa && estadoTrabajo && estadoTrabajo !== 'en_camino') parar();
  }, [activa, estadoTrabajo, parar]);

  if (!id) return <PantallaSecundaria barra={<BarraCompacta titulo="En camino" hrefVolver={RUTAS.inicio.ruta} />}>No indicaste qué trabajo abrir.</PantallaSecundaria>;
  if (c.fallo && !c.datos) return <PantallaFallo fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <div className="nu-vacio" aria-busy="true" />;

  const { detalle, viaje: viajeInicial } = c.datos;
  const t = detalle.trabajo;
  const volver = `${RUTAS.trabajo.ruta}?id=${t.id}`;
  const quien = detalle.contraparte;
  if (!t.destino || !viajeInicial) {
    return (
      <PantallaSecundaria barra={<BarraCompacta titulo="En camino" hrefVolver={volver} />}>
        <p>Este trabajo todavía no tiene una dirección: aparece cuando el cliente acepta.</p>
        <BotonEnlace href={volver}>Volver al trabajo</BotonEnlace>
      </PantallaSecundaria>
    );
  }

  const v = viajeVivo ?? viajeInicial;
  const posicion = gps.activa && gps.lectura ? { punto: gps.lectura.punto, precisionM: gps.lectura.precisionM } : null;
  const trayecto = v.trayecto ? (posicion ? loQueFalta(v.trayecto.linea, posicion.punto) : v.trayecto.linea) : null;
  const segundos = v.llegadaEstimada ? Math.max(0, (Date.parse(v.llegadaEstimada) - ahora.getTime()) / 1000) : null;
  const enCamino = t.estado === 'en_camino';
  const nav = enlacesNavegacion(t.destino);
  const senal = SENAL[gps.senal];
  const motivo = enCamino ? motivoRespaldo(gps.senal, gps.activa) : null;
  const sinPermiso = gps.senal === 'sin_permiso' || gps.senal === 'no_disponible';

  async function yaLlegue() {
    if (!motivo) return;
    const r = await llegada.ejecutar(() => api.marcarLlegada(t.id, motivo, t.version, llegada.clave()));
    if (r.ok) {
      gps.parar();
      isla({ titulo: 'Avisaste que llegaste', texto: `Le avisamos a ${quien}.`, icono: 'check', tono: 'exito' });
      router.replace(volver);
    } else if (r.fallo.tipo === 'conflicto') {
      llegada.nueva();
      await c.recargar();
    }
  }
  async function mandarDemora(minutos: (typeof DEMORAS_MINUTOS)[number]) {
    const r = await demora.ejecutar(() => api.avisarDemora(t.id, { minutos }, demora.clave()));
    if (r.ok) {
      setAvisar(false);
      isla({ titulo: 'Avisaste la demora', texto: `${quien} ve en el chat que llegás ${minutos} minutos tarde.`, icono: 'reloj' });
    }
  }

  return (
    <PantallaMapa
      mapa={
        <Mapa
          etiqueta={`Mapa del viaje a lo de ${quien}`}
          alto="completo"
          inmediato
          interactivo
          conCentrar
          tapadoAbajo={0.45}
          destino={t.destino}
          posicion={posicion}
          trayecto={trayecto}
          encuadre={`${v.trayecto?.version ?? 'sin'}-${posicion ? 'con' : 'sin'}`}
          alternativa={<p>{`Destino: ${t.direccion ?? 'la dirección del trabajo'}${v.distanciaRestanteM !== null ? ` · a ${textoDistancia(v.distanciaRestanteM)}` : ''}`}</p>}
        />
      }
      arriba={
        <div className="nu-viaje__arriba">
          <BotonIconoEnlace icono="atras" etiqueta="Volver al trabajo" href={volver} />
          <p className="nu-viaje__rumbo">
            <Icono nombre="flecha" />
            <span>
              <strong>{enCamino ? `Vas para lo de ${quien}` : t.estado === 'agendado' ? 'Todavía no saliste' : 'Ya llegaste'}</strong>
              <span>{t.direccion}</span>
            </span>
          </p>
        </div>
      }
      abajo={
        <section className="nu-viaje" aria-labelledby="nu-viaje-h1">
          <h1 id="nu-viaje-h1" className="visualmente-oculto">
            En camino
          </h1>
          <div className="nu-viaje__fila">
            <div className="nu-viaje__tiempo" aria-live="polite">
              {enCamino && segundos !== null && v.distanciaRestanteM !== null ? (
                <>
                  <strong>{textoDuracion(segundos)}</strong>
                  <span>{`Llegás ${hora(new Date(ahora.getTime() + segundos * 1000).toISOString())} · ${textoDistancia(v.distanciaRestanteM)}`}</span>
                </>
              ) : (
                <strong>{enCamino ? 'Vas en camino' : 'Viaje'}</strong>
              )}
            </div>
            {gps.activa ? <Chip icono="pin">{`${quien.split(' ')[0]} ve que vas en camino`}</Chip> : null}
            {enCamino && (gps.activa || sinPermiso) ? (
              <Chip tono={senal.tono} icono={senal.icono}>
                {`${senal.texto}${gps.senal === 'imprecisa' && gps.lectura ? ` (± ${textoDistancia(gps.lectura.precisionM)})` : ''}`}
              </Chip>
            ) : null}
          </div>
          <div className="nu-viaje__quien">
            <Avatar nombre={quien} />
            <span className="nu-viaje__texto">
              <strong>{quien}</strong>
              <span>{t.direccion}</span>
            </span>
            {enCamino ? <BotonIcono icono="reloj" etiqueta="Avisar una demora" onClick={() => setAvisar(true)} /> : null}
            <BotonIconoEnlace icono="chat" etiqueta={`Escribirle a ${quien}`} href={`${RUTAS.hilo.ruta}?id=${t.conversacionId}`} />
          </div>

          {enCamino && !gps.activa && !sinPermiso ? (
            <div className="nu-viaje__permiso">
              <p>
                <strong>{v.estado === 'compartiendo' ? 'Tu ubicación está en pausa.' : 'Compartí tu ubicación durante el viaje.'}</strong>
                {` Así ${quien} ve que vas en camino. Solo mientras esta pantalla esté abierta y hasta que llegues; la ve solo ${quien}, en este trabajo.`}
              </p>
              <Boton icono="pin" onClick={gps.empezar}>
                {v.estado === 'compartiendo' ? 'Seguir compartiendo' : 'Compartir mi ubicación'}
              </Boton>
            </div>
          ) : null}
          {enCamino && sinPermiso ? (
            <p className="nu-nota nu-nota--error">
              {gps.senal === 'sin_permiso' ? 'No tenemos permiso para ver tu ubicación: podés activarlo en el navegador (Ubicación → Permitir). ' : 'Tu teléfono no da la ubicación. '}
              Igual podés ir con Google Maps o Waze y avisar con «Ya llegué» cuando estés.
            </p>
          ) : null}
          {enCamino && sinPermiso ? (
            <Boton variante="texto" onClick={gps.empezar}>
              Volver a intentar
            </Boton>
          ) : null}
          {gps.sinEnviar ? <p className="nu-nota" role="status">Sin conexión: tu ubicación se manda cuando vuelva la señal.</p> : null}
          {gps.activa && v.estado === 'compartiendo' && !v.trayecto ? <p className="nu-nota">No pudimos calcular el trayecto: usá Google Maps o Waze. Tu ubicación igual se comparte.</p> : null}

          {llegada.fallo ? <ErrorCaja fallo={llegada.fallo} onReintentar={() => void yaLlegue()} /> : null}
          {enCamino && motivo ? (
            <>
              <Boton ocupado={llegada.pendiente} textoOcupado="Avisando…" onClick={() => void yaLlegue()}>
                Ya llegué
              </Boton>
              <p className="nu-nota">{`Como estás ${MOTIVO_LLEGADA[motivo]}, la llegada no se marca sola: avisá vos cuando estés en la puerta.`}</p>
            </>
          ) : null}
          {gps.activa ? (
            <Boton variante="contorno" onClick={() => void gps.dejar()}>
              Dejar de compartir
            </Boton>
          ) : null}
          {!enCamino ? <BotonEnlace href={volver}>Ver el trabajo</BotonEnlace> : null}
          <div className="nu-dos" role="group" aria-label="Cómo llegar con otra app">
            <a className="ui-boton ui-boton--texto ui-boton--chico ui-boton--bloque" href={nav.google} target="_blank" rel="noopener noreferrer">
              <span className="ui-boton__texto">
                Google Maps<span className="visualmente-oculto"> (se abre aparte)</span>
              </span>
            </a>
            <a className="ui-boton ui-boton--texto ui-boton--chico ui-boton--bloque" href={nav.waze} target="_blank" rel="noopener noreferrer">
              <span className="ui-boton__texto">
                Waze<span className="visualmente-oculto"> (se abre aparte)</span>
              </span>
            </a>
          </div>
          {enCamino && !motivo ? <p className="nu-nota">Tu ubicación se comparte solo hasta que llegás. La llegada se marca sola al estar en la puerta.</p> : null}

          <Hoja abierta={avisar} titulo="Avisar una demora" onCerrar={() => setAvisar(false)}>
            <p>{`Le mandamos a ${quien} un aviso en el chat del trabajo. No cambia el horario acordado.`}</p>
            {demora.fallo ? <ErrorCaja fallo={demora.fallo} /> : null}
            <div className="nu-dos">
              {DEMORAS_MINUTOS.map((m) => (
                <Boton key={m} variante="contorno" ocupado={demora.pendiente} onClick={() => void mandarDemora(m)}>
                  {`Llego ${m} min tarde`}
                </Boton>
              ))}
            </div>
          </Hoja>
        </section>
      }
    />
  );
}
