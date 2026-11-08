'use client';
// Trabajo (F-Trabajo, lote 1.3): el trabajo agendado con sus cuatro pasos (acordado, salir para allá, llegué, terminé),
// la dirección (se ve porque el cliente aceptó), lo acordado y cómo te paga (directo a vos), chat, llamada por la app,
// cambiar la fecha, adicionales y una sola acción principal según el estado. Terminar pide confirmación con el resumen;
// después se informa el cobro. Ningún paso se da solo, salvo la llegada (geocerca, con la app abierta).
import { api } from '@handyx/origen-datos';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { terminadosEnSesion } from '../components/AccionTrabajo.tsx';
import { ErrorCaja } from '../components/Estados.tsx';
import { TarjetaPropuesta } from '../components/TarjetaPropuesta.tsx';
import type { Adicional, LlamadaPuente, TrabajoDetalle as Detalle } from '../contracts/dto.ts';
import { NOMBRE_RUBRO } from '../contracts/rubros.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { useAhora } from '../hooks/useAhora.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { useIdDeUrl } from '../hooks/useIdDeUrl.ts';
import { useIsla } from '../kit/Efectos.tsx';
import { diaLocal, hora } from '../lib/formato.ts';
import { enlacesNavegacion } from '../lib/geo.ts';
import { cronometro, inicioEnCurso, textoLlegada, TIPO_ADICIONAL } from '../lib/trabajo.ts';
import { Boton, BotonEnlace } from '../ui/atomos/Boton.tsx';
import { Chip, Cifra, Titulo } from '../ui/atomos/Texto.tsx';
import { ArregloRubro } from '../ui/ilustraciones/Arreglos.tsx';
import { textoCifra } from '../ui/logica.ts';
import { textoHorario } from '../ui/logicaNucleo.ts';
import { LineaTiempo } from '../ui/moleculas/LineaTiempo.tsx';
import { MosaicoHerramienta } from '../ui/moleculas/Mosaico.tsx';
import { FilaIcono, Tarjeta } from '../ui/moleculas/Tarjeta.tsx';
import { AccionFija } from '../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../ui/organismos/Cabeceras.tsx';
import { Hoja } from '../ui/organismos/Hoja.tsx';
import { PantallaSecundaria } from '../ui/plantillas/Plantillas.tsx';
import { PantallaFallo } from './nucleo/Fallo.tsx';
import { ResumenObra } from './obra/ResumenObra.tsx';
import { ESTADO_TRABAJO, pasosTrabajo } from './nucleo/vista.ts';
import './nucleo/nucleo.css';

const ADICIONAL: Record<Adicional['estado'], string> = { pendiente: 'Esperando al cliente', aceptado: 'Aceptado', rechazado: 'No lo aceptó', retirado: 'Retirado' };

export function TrabajoDetalle() {
  const id = useIdDeUrl();
  // Mientras algo espera al cliente (un adicional o un cambio), se vuelve a consultar cada 15 s.
  const [vigilar, setVigilar] = useState(false);
  const c = useCarga(() => (id ? api.trabajo(id) : Promise.resolve(null)), [id], { cadaMs: vigilar ? 15_000 : 0 });
  const datos = c.datos;
  useEffect(() => setVigilar(!!datos && (datos.adicionales.some((a) => a.estado === 'pendiente') || datos.cambioPendiente !== null)), [datos]);

  if (!id || (c.fallo?.tipo === 'no_encontrado' && !c.datos)) {
    return (
      <PantallaSecundaria barra={<BarraCompacta titulo="Trabajo" hrefVolver={RUTAS.inicio.ruta} />}>
        <p>No encontramos ese trabajo.</p>
        <BotonEnlace href={RUTAS.trabajos.ruta}>Ver mis trabajos</BotonEnlace>
      </PantallaSecundaria>
    );
  }
  if (c.fallo && !c.datos) return <PantallaFallo fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <div className="nu-vacio" aria-busy="true" />;
  return <Trabajo d={c.datos} recargar={c.recargar} falloCarga={c.fallo} />;
}

function Trabajo({ d, recargar, falloCarga }: { d: Detalle; recargar(): Promise<void>; falloCarga: ReturnType<typeof useCarga>['fallo'] }) {
  const router = useRouter();
  const isla = useIsla();
  const ahora = useAhora(60_000);
  const avance = useAccion();
  const retiro = useAccion();
  const [terminar, setTerminar] = useState(false);
  const t = d.trabajo;
  const hoy = diaLocal(ahora.toISOString());
  const q = `?id=${t.id}`;
  const cuando = textoHorario(t.acuerdo.horario, hoy);
  const estado = ESTADO_TRABAJO[t.estado];
  const pasos = pasosTrabajo(t.estado);
  const activo = ['agendado', 'en_camino', 'en_sitio', 'en_curso'].includes(t.estado);
  const obra = t.tipo === 'obra';
  const conAdicionales = d.totalVigente.centavos !== t.acuerdo.monto.centavos;

  async function avanzar(hacia: 'en_camino' | 'en_curso' | 'finalizado') {
    // El refresco va dentro de la acción: el botón se libera con la versión nueva (evita un 409 al tocar dos veces).
    const r = await avance.ejecutar(async () => {
      await api.avanzarTrabajo(t.id, hacia, t.version, avance.clave());
      if (hacia === 'finalizado') terminadosEnSesion.add(t.id);
      await recargar();
    });
    if (r.ok) {
      setTerminar(false);
      if (hacia === 'en_camino') router.push(`${RUTAS.enCamino.ruta}${q}`);
      // El Modo trabajo (lote 2.3) se abre al empezar.
      if (hacia === 'en_curso' && !obra) router.push(`${RUTAS.modoTrabajo.ruta}${q}`);
      if (hacia === 'finalizado') router.push(`${RUTAS.trabajoCobro.ruta}${q}`);
    } else if (r.fallo.tipo === 'conflicto') {
      avance.nueva();
      await recargar();
    }
  }

  async function retirar(a: Adicional) {
    const r = await retiro.ejecutar(async () => {
      await api.retirarAdicional(t.id, a.id);
      await recargar();
    });
    if (r.ok) isla({ titulo: 'Retiraste el adicional', texto: a.descripcion, icono: 'cerrar' });
  }

  let accion = null;
  if (t.estado === 'agendado')
    accion = (
      <Boton icono="camion" ocupado={avance.pendiente} textoOcupado="Saliendo…" onClick={() => void avanzar('en_camino')}>
        Salir para allá
      </Boton>
    );
  else if (t.estado === 'en_camino')
    accion = (
      <BotonEnlace icono="camion" href={`${RUTAS.enCamino.ruta}${q}`}>
        Abrir el viaje
      </BotonEnlace>
    );
  else if (t.estado === 'en_sitio')
    accion = (
      <Boton icono="herramienta" ocupado={avance.pendiente} textoOcupado="Guardando…" onClick={() => void avanzar('en_curso')}>
        Empezar el trabajo
      </Boton>
    );
  else if (t.estado === 'en_curso' && !obra)
    accion = (
      <>
        <BotonEnlace icono="herramienta" href={`${RUTAS.modoTrabajo.ruta}${q}`}>
          Volver al Modo trabajo
        </BotonEnlace>
        <Boton variante="texto" onClick={() => setTerminar(true)}>
          Terminé
        </Boton>
      </>
    );
  else if (t.estado === 'finalizado' && d.pagoId && !obra)
    accion = (
      <BotonEnlace icono="billete" href={`${RUTAS.trabajoCobro.ruta}${q}`}>
        Informar el cobro
      </BotonEnlace>
    );

  return (
    <PantallaSecundaria barra={<BarraCompacta titulo="Trabajo" subtitulo={cuando} hrefVolver={RUTAS.inicio.ruta} />} accion={accion ? <AccionFija>{accion}</AccionFija> : undefined}>
      {falloCarga ? <ErrorCaja fallo={falloCarga} onReintentar={() => void recargar()} /> : null}
      <div className="nu-trabajo__cabeza">
        <span className="nu-resumen__ilu">
          <ArregloRubro rubro={t.rubro} tam="chico" />
        </span>
        <div className="nu-trabajo__nombre">
          <Chip tono={estado.tono} icono={estado.icono}>
            {estado.texto}
          </Chip>
          <Titulo nivel={2} antes={NOMBRE_RUBRO[t.rubro]} tam="medio" />
          <p>{`${obra ? 'Obra' : 'Trabajo'} · ${d.contraparte}`}</p>
        </div>
      </div>

      {t.estado !== 'cancelado' ? (
        <Tarjeta etiqueta="Pasos del trabajo">
          <LineaTiempo
            etiqueta="Pasos del trabajo"
            pasos={[
              { titulo: 'Acordado', detalle: `${textoCifra(t.acuerdo.monto.centavos)} · ${cuando.toLowerCase()}`, estado: pasos[0] },
              { titulo: 'Salir para allá', detalle: 'Compartís tu ubicación solo durante el viaje', estado: pasos[1] },
              { titulo: 'Llegué', detalle: t.llegada ? `Llegaste a las ${hora(t.llegada.en)}. ${textoLlegada(t.llegada)}; le avisamos al cliente.` : 'Se marca solo al llegar, o a mano', estado: pasos[2] },
              { titulo: 'Terminé', detalle: obra ? 'Cada etapa se termina y se cobra desde el plan de obra' : 'Informás el cobro: directo a vos', estado: pasos[3] },
            ]}
          />
        </Tarjeta>
      ) : (
        <p className="nu-nota">Este trabajo fue cancelado.</p>
      )}
      {t.estado === 'en_curso' && !obra ? <EnCurso eventos={d.eventos} /> : null}

      <Tarjeta franja={t.estado === 'en_sitio' || t.estado === 'en_curso' ? { texto: 'Agregar repuestos o mano de obra', href: `${RUTAS.trabajoAdicional.ruta}${q}` } : undefined}>
        {t.direccion ? <FilaIcono icono="pin" titulo={t.direccion} detalle="Te la mostramos porque el cliente aceptó" /> : null}
        <FilaIcono icono="billete" titulo={textoCifra(d.totalVigente.centavos)} detalle={conAdicionales ? 'Incluye los adicionales que aceptó el cliente. Directo a vos' : 'Efectivo o Mercado Pago, directo a vos'} borde={false} />
      </Tarjeta>

      {activo && t.destino ? (
        <div className="nu-dos" role="group" aria-label="Cómo llegar con otra app">
          <a className="ui-boton ui-boton--contorno ui-boton--chico ui-boton--bloque" href={enlacesNavegacion(t.destino).google} target="_blank" rel="noopener noreferrer">
            <span className="ui-boton__texto">
              Google Maps<span className="visualmente-oculto"> (se abre aparte)</span>
            </span>
          </a>
          <a className="ui-boton ui-boton--contorno ui-boton--chico ui-boton--bloque" href={enlacesNavegacion(t.destino).waze} target="_blank" rel="noopener noreferrer">
            <span className="ui-boton__texto">
              Waze<span className="visualmente-oculto"> (se abre aparte)</span>
            </span>
          </a>
        </div>
      ) : null}

      <div className="nu-mosaicos">
        <MosaicoHerramienta icono="chat" titulo="Mensaje" href={`${RUTAS.hilo.ruta}?id=${t.conversacionId}`} />
        {activo && !d.cambioPendiente && t.estado !== 'en_curso' ? <MosaicoHerramienta icono="agenda" titulo="Cambiar fecha" href={`${RUTAS.trabajoCambio.ruta}${q}`} /> : null}
        {/* Modo trabajo (H0-Modo) e informe (H0-Informe) del lote 2.3; antes de empezar, las herramientas del Taller. */}
        {t.estado === 'en_curso' && !obra ? (
          <MosaicoHerramienta icono="herramienta" titulo="Modo trabajo" href={`${RUTAS.modoTrabajo.ruta}${q}`} />
        ) : t.estado === 'finalizado' && !obra ? (
          <MosaicoHerramienta icono="escudo" titulo="Informe" href={`${RUTAS.informeTrabajo.ruta}${q}`} />
        ) : (
          <MosaicoHerramienta icono="herramienta" titulo="Taller" href={RUTAS.taller.ruta} />
        )}
      </div>

      {d.adicionales.length > 0 ? (
        <Tarjeta etiqueta="Repuestos y mano de obra extra">
          <h2 className="nu-subtitulo">Repuestos y mano de obra extra</h2>
          <ul className="nu-adicionales">
            {d.adicionales.map((a) => (
              <li key={a.id}>
                <span>
                  <strong>{a.descripcion}</strong>
                  <span>{`${TIPO_ADICIONAL[a.tipo]} · ${textoCifra(a.monto.centavos)} · ${ADICIONAL[a.estado]}`}</span>
                </span>
                {a.estado === 'pendiente' ? (
                  <Boton variante="texto" bloque={false} chico disabled={retiro.pendiente} onClick={() => void retirar(a)}>
                    {`Retirar ${a.descripcion}`}
                  </Boton>
                ) : null}
              </li>
            ))}
          </ul>
          {retiro.fallo ? <ErrorCaja fallo={retiro.fallo} /> : null}
          {d.adicionales.some((a) => a.estado === 'pendiente') ? <p className="nu-nota">{`Mientras el cliente no responde, rige el precio vigente: ${textoCifra(d.totalVigente.centavos)}.`}</p> : null}
        </Tarjeta>
      ) : null}

      {d.cambioPendiente ? (
        <div className="nu-propuestas">
          <h2 className="nu-subtitulo">Cambio esperando respuesta</h2>
          <TarjetaPropuesta propuesta={d.cambioPendiente} puedeActuar alCambiar={() => void recargar()} />
          <p className="nu-nota">Mientras tanto sigue valiendo lo acordado.</p>
        </div>
      ) : null}

      {obra && t.estado !== 'cancelado' ? <ResumenObra detalle={d} /> : null}

      <Tarjeta etiqueta="Más opciones">
        {activo ? <Llamar trabajoId={t.id} contraparte={d.contraparte} /> : null}
        <FilaIcono icono="ayuda" titulo="Pedir ayuda o hacer un reclamo" detalle="Lo ve el equipo de Handyx y queda en Ayuda" href={`${RUTAS.soporte.ruta}?trabajo=${t.id}`} borde={t.estado === 'agendado' || t.estado === 'en_camino' || t.estado === 'en_sitio'} />
        {t.estado === 'agendado' || t.estado === 'en_camino' || t.estado === 'en_sitio' ? <FilaIcono icono="cerrar" titulo="Cancelar este trabajo" detalle="Primero te mostramos otras opciones" href={`${RUTAS.trabajoCancelar.ruta}${q}`} borde={false} /> : null}
      </Tarjeta>
      {avance.fallo && !terminar ? <ErrorCaja fallo={avance.fallo} /> : null}

      <Hoja
        abierta={terminar}
        titulo="¿Terminaste el trabajo?"
        onCerrar={() => {
          setTerminar(false);
          avance.limpiar();
        }}
        pie={
          <div className="nu-pie-columna">
            <Boton variante="exito" ocupado={avance.pendiente} textoOcupado="Guardando…" onClick={() => void avanzar('finalizado')}>
              Sí, terminé
            </Boton>
            <Boton variante="texto" onClick={() => setTerminar(false)}>
              Todavía no
            </Boton>
          </div>
        }
      >
        <dl className="nu-desglose">
          <div>
            <dt>Lo acordado</dt>
            <dd>{textoCifra(t.acuerdo.monto.centavos)}</dd>
          </div>
          {d.adicionales
            .filter((a) => a.estado === 'aceptado')
            .map((a) => (
              <div key={a.id}>
                <dt>{a.descripcion}</dt>
                <dd>{`+ ${textoCifra(a.monto.centavos)}`}</dd>
              </div>
            ))}
          <div className="nu-desglose__total">
            <dt>Total a cobrar</dt>
            <dd>
              <Cifra centavos={d.totalVigente.centavos} tam="medio" />
            </dd>
          </div>
        </dl>
        {d.adicionales.some((a) => a.estado === 'pendiente') ? <p className="nu-nota">Hay adicionales que el cliente no respondió: si terminás, se retiran y no se cobran.</p> : null}
        <p className="nu-nota">El cliente te paga directo a vos (efectivo, Mercado Pago o transferencia): Handyx no recibe ese dinero.</p>
        {avance.fallo ? <ErrorCaja fallo={avance.fallo} onReintentar={() => void avanzar('finalizado')} /> : null}
      </Hoja>
    </PantallaSecundaria>
  );
}

/** Cronómetro del trabajo en curso (solo para vos: no es una medida de puntualidad ni se le muestra a nadie). */
function EnCurso({ eventos }: { eventos: Detalle['eventos'] }) {
  const ahora = useAhora(1000);
  const desde = inicioEnCurso(eventos);
  if (!desde) return null;
  return (
    <p className="nu-cronometro">
      <span>Trabajando hace</span>
      <strong role="timer" aria-live="off">
        {cronometro(desde, ahora)}
      </strong>
    </p>
  );
}

/** Llamada por la app: un número puente de Handyx; ninguno ve el teléfono del otro. */
function Llamar({ trabajoId, contraparte }: { trabajoId: string; contraparte: string }) {
  const [abierta, setAbierta] = useState(false);
  const [puente, setPuente] = useState<LlamadaPuente | null>(null);
  const pedido = useAccion();
  async function pedir() {
    setAbierta(true);
    setPuente(null);
    const r = await pedido.ejecutar(() => api.llamada(trabajoId));
    if (r.ok) setPuente(r.valor);
  }
  return (
    <>
      <FilaIcono icono="telefono" titulo="Llamar por la app" detalle="Sin ver el número del otro" onClick={() => void pedir()} />
      <Hoja abierta={abierta} titulo="Llamar por la app" onCerrar={() => setAbierta(false)}>
        <p>{`La llamada sale por un número de Handyx que conecta con ${contraparte}. Ninguno de los dos ve el teléfono del otro.`}</p>
        {pedido.fallo ? <ErrorCaja fallo={pedido.fallo} onReintentar={() => void pedir()} /> : null}
        {puente ? (
          <>
            <p className="nu-nota">{`El número sirve hasta las ${hora(puente.venceEn)}.`}</p>
            <a className="ui-boton ui-boton--primaria ui-boton--bloque" href={`tel:${puente.telefono}`}>
              <span className="ui-boton__texto">Llamar</span>
            </a>
            <Boton variante="texto" onClick={() => setAbierta(false)}>
              Mejor le escribo
            </Boton>
          </>
        ) : !pedido.fallo ? (
          <p role="status">Preparando la llamada…</p>
        ) : null}
      </Hoja>
    </>
  );
}
