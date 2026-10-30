'use client';
// En camino (lotes 4.3 y 4.6): el mapa a pantalla completa con el destino, tu posición en vivo y el trayecto que dibuja
// Handyx. La ubicación se comparte solo si la persona lo elige después de leer para qué, solo con esta pantalla abierta y
// solo con el cliente de este trabajo. La llegada se marca sola al entrar en la cuadra (geocerca del servidor); "Ya
// llegué" aparece solo como respaldo cuando la ubicación anda mal (sin permiso, imprecisa, sin señal o sin compartir).
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { AccionTrabajo } from '../components/AccionTrabajo.tsx';
import { Cargando, ErrorCaja, Vacio } from '../components/Estados.tsx';
import { Icono, type NombreIcono } from '../components/Icono.tsx';
import { Aviso } from '../components/ui.tsx';
import type { Viaje } from '../contracts/dto.ts';
import { NOMBRE_RUBRO } from '../contracts/rubros.ts';
import { useAhora } from '../hooks/useAhora.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { useCompartirUbicacion } from '../hooks/useCompartirUbicacion.ts';
import { useIdDeUrl } from '../hooks/useIdDeUrl.ts';
import { useIsla } from '../kit/Efectos.tsx';
import { HojaArrastrable } from '../kit/HojaArrastrable.tsx';
import { ALTURAS_HOJA, type AlturaHoja } from '../kit/logica.ts';
import { BarraSuperior } from '../kit/Navegacion.tsx';
import { hora } from '../lib/formato.ts';
import { enlacesNavegacion, loQueFalta, textoDistancia, textoDuracion, type Senal } from '../lib/geo.ts';
import { MOTIVO_LLEGADA, motivoRespaldo } from '../lib/trabajo.ts';
import { Mapa } from '../mapa/Mapa.tsx';

const SENAL: Record<Senal, { texto: string; icono: NombreIcono; tono: 'exito' | 'aviso' | 'error' | 'neutro' }> = {
  buscando: { texto: 'Buscando tu ubicación…', icono: 'lupa', tono: 'neutro' },
  normal: { texto: 'Ubicación precisa', icono: 'checkCirculo', tono: 'exito' },
  imprecisa: { texto: 'Ubicación imprecisa', icono: 'alerta', tono: 'aviso' },
  sin_senal: { texto: 'Sin señal de ubicación', icono: 'alerta', tono: 'aviso' },
  sin_permiso: { texto: 'Sin permiso de ubicación', icono: 'prohibido', tono: 'error' },
  no_disponible: { texto: 'Tu teléfono no da la ubicación', icono: 'prohibido', tono: 'error' },
};

export function EnCamino() {
  const id = useIdDeUrl();
  const router = useRouter();
  const isla = useIsla();
  const llegada = useAccion();
  const ahora = useAhora();
  const c = useCarga(async () => {
    if (!id) return null;
    const detalle = await api.trabajo(id);
    return { detalle, viaje: detalle.trabajo.destino ? await api.viaje(id) : null };
  }, [id]);
  const [viajeVivo, setViajeVivo] = useState<Viaje | null>(null);
  const [alturaHoja, setAlturaHoja] = useState<AlturaHoja>(1);
  const versionTrayecto = useRef<number | null>(null);

  function alViaje(v: Viaje) {
    // El servidor marcó la llegada (geocerca): deja de compartir y abre el trabajo. El cliente ya recibió el aviso.
    if (v.estado === 'terminado' && c.datos?.detalle.trabajo.estado === 'en_camino') {
      isla({ titulo: '¡Llegaste!', texto: `Le avisamos a ${c.datos.detalle.contraparte}.`, icono: 'checkCirculo', tono: 'exito' });
      router.replace(`${RUTAS.trabajo.ruta}?id=${v.trabajoId}`);
      return;
    }
    const antes = versionTrayecto.current;
    if (v.trayecto && antes !== null && v.trayecto.version > antes) {
      isla({ titulo: 'Recalculamos el trayecto', texto: 'Seguí la línea azul nueva.', icono: 'pin' });
    }
    if (v.trayecto) versionTrayecto.current = v.trayecto.version;
    setViajeVivo(v);
  }
  const gps = useCompartirUbicacion(id, alViaje, () => void c.recargar());

  const estadoTrabajo = c.datos?.detalle.trabajo.estado;
  // Al llegar (o si se cancela) el servidor deja de compartir: también se suelta el GPS.
  const { activa, parar } = gps;
  useEffect(() => {
    if (activa && estadoTrabajo && estadoTrabajo !== 'en_camino') parar();
  }, [activa, estadoTrabajo, parar]);

  if (!id) return <Vacio icono="maletin" titulo="No indicaste qué trabajo abrir"><Link href={RUTAS.trabajos.ruta}>Ver mis trabajos</Link></Vacio>;
  if (c.fallo && !c.datos) return <ErrorCaja pantalla fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;

  const { detalle, viaje: viajeInicial } = c.datos;
  const t = detalle.trabajo;
  const volver = `${RUTAS.trabajo.ruta}?id=${t.id}`;
  if (!t.destino || !viajeInicial) {
    return (
      <div className="vj-sin">
        <BarraSuperior titulo="En camino" atras={volver} textoAtras="Volver al trabajo" acciones={null} />
        <Vacio icono="pin" titulo="Este trabajo no tiene un destino">
          La dirección aparece cuando hay un trabajo acordado. <Link href={volver}>Volver al trabajo</Link>
        </Vacio>
      </div>
    );
  }

  const v = viajeVivo ?? viajeInicial;
  const posicion = gps.activa && gps.lectura ? { punto: gps.lectura.punto, precisionM: gps.lectura.precisionM } : null;
  const trayecto = v.trayecto ? (posicion ? loQueFalta(v.trayecto.linea, posicion.punto) : v.trayecto.linea) : null;
  const segundos = v.llegadaEstimada ? Math.max(0, (Date.parse(v.llegadaEstimada) - ahora.getTime()) / 1000) : null;
  const enCamino = t.estado === 'en_camino';
  const nav = enlacesNavegacion(t.destino);
  const senal = SENAL[gps.senal];
  const sinTrayecto = gps.activa && v.estado === 'compartiendo' && !v.trayecto;
  const motivo = enCamino ? motivoRespaldo(gps.senal, gps.activa) : null;

  async function yaLlegue() {
    if (!motivo) return;
    const r = await llegada.ejecutar(() => api.marcarLlegada(t.id, motivo, t.version, llegada.clave()));
    if (r.ok) {
      gps.parar();
      isla({ titulo: 'Avisaste que llegaste', texto: `Le avisamos a ${detalle.contraparte}.`, icono: 'checkCirculo', tono: 'exito' });
      router.replace(volver);
    } else if (r.fallo.tipo === 'conflicto') {
      llegada.nueva();
      await c.recargar();
    }
  }

  return (
    <div className="vj-pantalla">
      <BarraSuperior titulo="En camino" atras={volver} textoAtras="Volver al trabajo" acciones={null} />
      <div className="vj-mapa">
        <Mapa
          etiqueta={`Mapa del viaje a lo de ${detalle.contraparte}`}
          alto="completo"
          inmediato
          interactivo
          conCentrar
          tapadoAbajo={ALTURAS_HOJA[alturaHoja]}
          destino={t.destino}
          posicion={posicion}
          trayecto={trayecto}
          encuadre={`${v.trayecto?.version ?? 'sin'}-${posicion ? 'con' : 'sin'}-${alturaHoja}`}
          alternativa={
            <p>
              Destino: <strong>{t.direccion ?? 'dirección del trabajo'}</strong>
              {v.distanciaRestanteM !== null ? ` · a ${textoDistancia(v.distanciaRestanteM)}` : ''}
            </p>
          }
        />
      </div>

      {/* Mientras explica el permiso, la hoja está alta; al compartir baja, para que se vea el mapa. */}
      <HojaArrastrable titulo={enCamino ? 'Tu viaje' : 'El trabajo'} pedida={gps.activa ? 0 : 1} alCambiar={setAlturaHoja}>
        <div className="vj-hoja">
          <div className="vj-llegada" aria-live="polite">
            {enCamino && segundos !== null && v.distanciaRestanteM !== null ? (
              <>
                <p className="vj-llegada__tiempo">
                  Llegás en <strong>{textoDuracion(segundos)}</strong>
                </p>
                <p className="vj-llegada__detalle">
                  {textoDistancia(v.distanciaRestanteM)} · llegada estimada {hora(new Date(ahora.getTime() + segundos * 1000).toISOString())}
                </p>
              </>
            ) : (
              <p className="vj-llegada__tiempo">{enCamino ? 'Vas en camino' : t.estado === 'agendado' ? 'Todavía no saliste' : 'Ya llegaste'}</p>
            )}
          </div>

          <p className="vj-destino">
            <Icono nombre="pin" />
            <span>
              <strong>{detalle.contraparte}</strong> · {NOMBRE_RUBRO[t.rubro]}
              <br />
              {t.direccion}
            </span>
          </p>

          {enCamino ? (
            gps.activa || gps.senal === 'sin_permiso' || gps.senal === 'no_disponible' ? (
              <div className="vj-compartir">
                <p className={`chip chip--${senal.tono}`}>
                  <Icono nombre={senal.icono} />
                  {senal.texto}
                  {gps.senal === 'imprecisa' && gps.lectura ? ` (± ${textoDistancia(gps.lectura.precisionM)})` : ''}
                </p>
                {gps.activa ? (
                  <>
                    <p className="vj-nota">
                      <strong>{detalle.contraparte}</strong> ve tu ubicación mientras esta pantalla esté abierta.
                    </p>
                    {gps.sinEnviar ? <p className="vj-nota" role="status">Sin conexión: tu ubicación se manda cuando vuelva la señal.</p> : null}
                    <button type="button" className="boton boton--fantasma" onClick={() => void gps.dejar()}>
                      Dejar de compartir
                    </button>
                  </>
                ) : (
                  <Aviso tono="error" icono="prohibido" titulo={gps.senal === 'sin_permiso' ? 'No tenemos permiso para ver tu ubicación' : 'Tu teléfono no da la ubicación'} role="alert">
                    {gps.senal === 'sin_permiso' ? 'Podés activarlo en la configuración del navegador (Ubicación → Permitir) y volver a intentar. ' : ''}
                    Igual podés ir: abrí Google Maps o Waze y avisá con «Ya llegué» cuando estés.
                    <br />
                    <button type="button" className="enlace" onClick={gps.empezar}>
                      Volver a intentar
                    </button>
                  </Aviso>
                )}
              </div>
            ) : (
              <section className="vj-permiso" aria-labelledby="vj-permiso-titulo">
                <h2 id="vj-permiso-titulo" className="vj-permiso__titulo">
                  {v.estado === 'compartiendo' ? 'Tu ubicación está en pausa' : 'Compartí tu ubicación durante el viaje'}
                </h2>
                <ul className="vj-permiso__lista">
                  <li>Así {detalle.contraparte} ve que vas en camino y Handyx te dibuja el trayecto.</li>
                  <li>Solo mientras esta pantalla esté abierta y hasta que llegues.</li>
                  <li>La ve solo {detalle.contraparte}, y solo en este trabajo. Podés dejar de compartir cuando quieras.</li>
                </ul>
                <button type="button" className="boton boton--bloque" onClick={gps.empezar}>
                  <Icono nombre="pin" /> {v.estado === 'compartiendo' ? 'Seguir compartiendo' : 'Compartir mi ubicación'}
                </button>
              </section>
            )
          ) : null}

          {sinTrayecto ? (
            <Aviso tono="aviso" icono="alerta" titulo="No pudimos calcular el trayecto" role="status">
              Usá Google Maps o Waze para llegar. Tu ubicación igual se comparte con {detalle.contraparte}.
            </Aviso>
          ) : null}

          <div className="hx-mapa-atajos" role="group" aria-label="Cómo llegar con otra app">
            <a className="boton boton--claro" href={nav.google} target="_blank" rel="noopener noreferrer">
              Google Maps
              <span className="visualmente-oculto"> (se abre aparte)</span>
            </a>
            <a className="boton boton--claro" href={nav.waze} target="_blank" rel="noopener noreferrer">
              Waze
              <span className="visualmente-oculto"> (se abre aparte)</span>
            </a>
          </div>

          {enCamino ? (
            motivo ? (
              <div className="vj-respaldo">
                {llegada.fallo ? <ErrorCaja fallo={llegada.fallo} onReintentar={() => void yaLlegue()} /> : null}
                <button type="button" className="boton boton--bloque" disabled={llegada.pendiente} onClick={() => void yaLlegue()}>
                  <Icono nombre="pin" /> {llegada.pendiente ? 'Avisando…' : 'Ya llegué'}
                </button>
                <p className="vj-nota">Como estás {MOTIVO_LLEGADA[motivo]}, no podemos marcar la llegada sola: avisá vos cuando estés en la puerta.</p>
              </div>
            ) : (
              <p className="vj-nota vj-nota--auto" role="status">
                <Icono nombre="checkCirculo" /> La llegada se marca sola cuando entrás en la cuadra, y le avisamos a {detalle.contraparte}.
              </p>
            )
          ) : null}
          {t.estado === 'agendado' ? <AccionTrabajo detalle={detalle} alCambiar={c.recargar} /> : null}
          {!enCamino && t.estado !== 'agendado' ? (
            <Link className="boton boton--bloque" href={volver}>
              Ver el trabajo
            </Link>
          ) : null}
        </div>
      </HojaArrastrable>
    </div>
  );
}
