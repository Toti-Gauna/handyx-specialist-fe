'use client';
// Tu precio (F-Precio, F-PrecioTeclado, F-Fecha, F-FechaHora, F-Revisar y F-Enviada; lote 1.3). Dos pasos cortos:
// 1) el precio con la cinta, los atajos o el teclado (Handyx sugiere, vos decidís; recibís el 100 %: Handyx no te cobra
// comisión), si incluye materiales y la garantía; 2) cuándo vas: el horario que pidió el cliente u otro día y franja (o
// un horario a medida). Antes de enviar se revisa todo en una hoja; enviar no compromete a nadie: el cliente acepta,
// pide otro precio o elige otro día. Sirve también para contraofertar (`?base=`) y vuelve al chat si viene de ahí
// (`?chat=`). La ilustración «construye el arreglo» mientras cotizás (armada con «reducir movimiento»).
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { ErrorCaja } from '../components/Estados.tsx';
import { monto } from '../contracts/dinero.ts';
import type { PedidoDetalle } from '../contracts/dto.ts';
import { GARANTIA_DIAS_DEFECTO } from '../contracts/modo-trabajo.ts';
import { NOMBRE_RUBRO } from '../contracts/rubros.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { useAhora } from '../hooks/useAhora.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { useIdDeUrl } from '../hooks/useIdDeUrl.ts';
import { useConfeti } from '../kit/Efectos.tsx';
import { diaLocal } from '../lib/formato.ts';
import { Boton, BotonEnlace } from '../ui/atomos/Boton.tsx';
import { Interruptor } from '../ui/atomos/Controles.tsx';
import { Chip, Cifra, Etiqueta, Titulo } from '../ui/atomos/Texto.tsx';
import { Icono } from '../ui/atomos/Icono.tsx';
import { ArregloRubro } from '../ui/ilustraciones/Arreglos.tsx';
import { textoCifra } from '../ui/logica.ts';
import {
  ATAJOS_HORARIO,
  atajosPrecio,
  FRANJAS_DIA,
  franjaNoDisponible,
  horaConMinutos,
  horarioValido,
  instanteBA,
  minutosBA,
  moverCinta,
  nombreDia,
  opcionesRueda,
  redondearMil,
  textoDiferencia,
  textoFranja,
  textoHorario,
  type Franja,
} from '../ui/logicaNucleo.ts';
import { CintaPrecio } from '../ui/moleculas/CintaPrecio.tsx';
import { Segmento } from '../ui/moleculas/Controles.tsx';
import { RuedaHora } from '../ui/moleculas/Fechas.tsx';
import { TecladoPrecio } from '../ui/moleculas/Precio.tsx';
import { FilaIcono, Tarjeta } from '../ui/moleculas/Tarjeta.tsx';
import { AccionFija } from '../ui/organismos/Acciones.tsx';
import { Calendario } from '../ui/organismos/Calendario.tsx';
import { BarraCompacta } from '../ui/organismos/Cabeceras.tsx';
import { Hoja } from '../ui/organismos/Hoja.tsx';
import { PantallaSecundaria } from '../ui/plantillas/Plantillas.tsx';
import { PantallaFallo } from './nucleo/Fallo.tsx';
import { tituloDe, vistaDesdeDetalle } from './nucleo/vista.ts';
import './nucleo/nucleo.css';

type Paso = 'precio' | 'fecha' | 'enviada';
interface Horario {
  fecha: string;
  desde: number;
  hasta: number | null;
  fuente: 'cliente' | 'franja' | 'medida';
}

export function TuPrecio() {
  const id = useIdDeUrl();
  const c = useCarga(async () => (id ? api.pedido(id) : null), [id]);
  if (!id)
    return (
      <div className="nu-vacio">
        <p>No indicaste qué pedido cotizar.</p>
        <BotonEnlace href={RUTAS.inicio.ruta}>Ir al inicio</BotonEnlace>
      </div>
    );
  if (c.fallo && !c.datos) return <PantallaFallo fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <div className="nu-vacio" aria-busy="true" />;
  return <Flujo key={id} pedido={c.datos} />;
}

function Flujo({ pedido }: { pedido: PedidoDetalle }) {
  const router = useRouter();
  const params = useSearchParams();
  const ahora = useAhora(30_000);
  const confeti = useConfeti();
  const envio = useAccion();
  const v = vistaDesdeDetalle(pedido);
  const hoy = diaLocal(ahora.toISOString());
  const baseId = params.get('base');
  const chatId = params.get('chat');
  const base = baseId ? (pedido.propuestas.find((p) => p.id === baseId) ?? null) : null;
  const sugerido = v.sugeridoCentavos;
  const volver = chatId ? `${RUTAS.hilo.ruta}?id=${chatId}` : `${RUTAS.pedido.ruta}?id=${pedido.id}`;

  const [paso, setPaso] = useState<Paso>(params.get('paso') === 'fecha' ? 'fecha' : 'precio');
  const [precio, setPrecio] = useState(base?.monto.centavos ?? sugerido ?? 0);
  const [materiales, setMateriales] = useState(base?.incluyeMateriales ?? true);
  const [garantia, setGarantia] = useState(base ? base.garantiaDias != null : false);
  const [teclado, setTeclado] = useState<number | null>(null);

  const pidio = base ? base.horario : v.horario;
  const inicialCliente: Horario | null = pidio && Date.parse(pidio.inicio) > ahora.getTime() ? { fecha: diaLocal(pidio.inicio), desde: minutosBA(pidio.inicio), hasta: pidio.fin ? minutosBA(pidio.fin) : null, fuente: 'cliente' } : null;
  const [horario, setHorario] = useState<Horario | null>(inicialCliente);
  const [fecha, setFecha] = useState(inicialCliente?.fecha ?? hoy);
  const [mes, setMes] = useState(() => ({ anio: Number(fecha.slice(0, 4)), mes: Number(fecha.slice(5, 7)) }));
  const [medida, setMedida] = useState<{ modo: 'franja' | 'exacta'; desde: number; hasta: number } | null>(null);
  const [revisar, setRevisar] = useState(false);
  // Las ruedas se montan de nuevo cuando la hoja ya está abierta, para que dejen la hora elegida a la vista.
  const [vueltaRuedas, setVueltaRuedas] = useState(0);
  const medidaAbierta = medida !== null;
  useEffect(() => {
    if (!medidaAbierta) return;
    const r = requestAnimationFrame(() => setVueltaRuedas((n) => n + 1));
    return () => cancelAnimationFrame(r);
  }, [medidaAbierta]);
  const [enviada, setEnviada] = useState<{ precio: number; horario: string } | null>(null);
  const chat = useAccion();

  // Lo que ya tenés agendado ese mes, para marcar los días y apagar las franjas que se superponen.
  const desdeMes = `${mes.anio}-${String(mes.mes).padStart(2, '0')}-01`;
  const agenda = useCarga(() => api.agenda(instanteBA(desdeMes, 0), instanteBA(desdeMes, 32 * 24 * 60)), [desdeMes]);
  const confirmados = useMemo(() => (agenda.datos ?? []).filter((a) => a.estado !== 'oferta_pendiente'), [agenda.datos]);
  const conTrabajo = useMemo(() => [...new Set(confirmados.map((a) => diaLocal(a.inicio)))], [confirmados]);
  const ocupado: Franja[] = confirmados.filter((a) => diaLocal(a.inicio) === fecha).map((a) => ({ desde: minutosBA(a.inicio), hasta: a.fin ? minutosBA(a.fin) : minutosBA(a.inicio) + 120 }));
  const ahoraMin = minutosBA(ahora.toISOString());
  const usaCliente = horario?.fuente === 'cliente';
  const elegido = horario && horario.fecha === fecha ? horario : horario?.fuente === 'cliente' ? horario : null;
  const textoElegido = horario ? textoHorario({ inicio: instanteBA(horario.fecha, horario.desde), fin: horario.hasta === null ? null : instanteBA(horario.fecha, horario.hasta) }, hoy) : null;

  const tituloPedido = `${NOMBRE_RUBRO[v.rubro]}${v.tipo === 'urgente' ? ' · urgente' : ''}`;
  const resumen = (
    <Tarjeta>
      <div className="nu-resumen">
        <span className="nu-resumen__ilu">
          <ArregloRubro rubro={v.rubro} armar={paso === 'precio'} tam="chico" />
        </span>
        <span className="nu-resumen__texto">
          <strong>{tituloPedido}</strong>
          <span>{`${v.titulo} · ${v.zona}`}</span>
        </span>
      </div>
    </Tarjeta>
  );

  async function enviar() {
    if (!horario) return;
    const inicio = instanteBA(horario.fecha, horario.desde);
    const fin = horario.hasta === null ? null : instanteBA(horario.fecha, horario.hasta);
    const alcance = [tituloDe(v.descripcion), materiales ? 'Incluye materiales.' : 'Materiales aparte.', garantia ? `Garantía de ${GARANTIA_DIAS_DEFECTO} días.` : ''].filter(Boolean).join(' ');
    const r = await envio.ejecutar(() =>
      api.enviarPropuesta(
        { pedidoId: pedido.id, monto: monto(precio), alcance: alcance.endsWith('.') ? alcance : `${alcance}.`, horario: { inicio, fin }, reemplazaA: base?.id ?? null, incluyeMateriales: materiales, garantiaDias: garantia ? GARANTIA_DIAS_DEFECTO : null },
        envio.clave(),
      ),
    );
    if (r.ok) {
      setRevisar(false);
      setEnviada({ precio, horario: textoHorario({ inicio, fin }, hoy) });
      setPaso('enviada');
      confeti.lanzar();
    }
  }

  async function escribir() {
    if (chatId) return router.push(`${RUTAS.hilo.ruta}?id=${chatId}`);
    if (pedido.conversacionId) return router.push(`${RUTAS.hilo.ruta}?id=${pedido.conversacionId}`);
    const r = await chat.ejecutar(() => api.abrirConversacion(pedido.id));
    if (r.ok) router.push(`${RUTAS.hilo.ruta}?id=${r.valor.id}`);
  }

  if (paso === 'enviada' && enviada) {
    return (
      <div className="nu-enviada">
        {confeti.capa}
        <div className="nu-enviada__cuerpo">
          <span className="nu-enviada__ilu">
            <ArregloRubro rubro={v.rubro} armar tam="grande" />
          </span>
          <Etiqueta>{base ? 'Contraoferta enviada' : 'Propuesta enviada'}</Etiqueta>
          <Titulo antes="Le llegó tu " marcado="propuesta" tam="grande" />
          <p className="nu-enviada__dato">{`${textoCifra(enviada.precio)} · ${enviada.horario.charAt(0).toLowerCase()}${enviada.horario.slice(1)}. Te avisamos cuando responda.`}</p>
          <Tarjeta>
            <FilaIcono icono="chat" titulo="Escribile si querés" detalle="El chat queda abierto con este pedido" onClick={() => void escribir()} borde={false} />
          </Tarjeta>
          {chat.fallo ? <ErrorCaja fallo={chat.fallo} onReintentar={() => void escribir()} /> : null}
        </div>
        <AccionFija>
          <BotonEnlace href={RUTAS.inicio.ruta}>Volver al inicio</BotonEnlace>
        </AccionFija>
      </div>
    );
  }

  if (paso === 'precio') {
    const diferencia = textoDiferencia(precio, sugerido);
    return (
      <PantallaSecundaria
        barra={<BarraCompacta titulo={base ? 'Tu contraoferta' : 'Tu precio'} subtitulo="Paso 1 de 2" hrefVolver={volver} />}
        accion={
          <AccionFija>
            <Boton disabled={precio <= 0} onClick={() => setPaso('fecha')}>
              Siguiente: la fecha
            </Boton>
          </AccionFija>
        }
      >
        {resumen}
        <div className="nu-precio">
          <Etiqueta>Tu precio</Etiqueta>
          <output className="nu-precio__monto" aria-live="polite">
            <Cifra centavos={precio} tam="grande" />
          </output>
          <p className="nu-precio__ayuda">{`Deslizá la cinta o tocá un atajo${sugerido !== null ? ` · Handyx sugiere ${textoCifra(sugerido)}` : ''}`}</p>
        </div>
        <CintaPrecio centavos={precio} onCambio={setPrecio} sugerido={sugerido} />
        <div className="ui-atajos" role="group" aria-label="Atajos de precio">
          {atajosPrecio(sugerido, precio).map((a) => (
            <button key={a.texto} type="button" className="ui-atajo" aria-pressed={precio === a.centavos} onClick={() => setPrecio(a.centavos)}>
              {a.texto}
            </button>
          ))}
          <button type="button" className="ui-atajo" onClick={() => setTeclado(0)}>
            Escribir
          </button>
        </div>
        {diferencia ? <p className="nu-nota">{diferencia}</p> : null}
        <div className="nu-interruptores">
          <Interruptor etiqueta="Incluye materiales" textoEncendido="Sí, los incluye" textoApagado="No, van aparte" encendido={materiales} onCambio={setMateriales} />
          <Interruptor etiqueta={`Garantía de ${GARANTIA_DIAS_DEFECTO} días`} textoEncendido="Sí, la ofrecés" textoApagado="No" encendido={garantia} onCambio={setGarantia} />
          <p className="nu-nota">El cliente ve en tu propuesta si incluye los materiales y la garantía.</p>
        </div>
        <Tarjeta tono="gris">
          <p className="nu-recibis">
            <span>
              <strong>Recibís el 100 %</strong>
              <span>Handyx no te cobra comisión</span>
            </span>
            <Cifra centavos={precio} tam="medio" />
          </p>
        </Tarjeta>

        <Hoja
          abierta={teclado !== null}
          titulo="Escribí tu precio"
          onCerrar={() => setTeclado(null)}
          pie={
            <Boton
              disabled={!teclado}
              onClick={() => {
                if (teclado) setPrecio(teclado);
                setTeclado(null);
              }}
            >
              {`Usar ${textoCifra(teclado ?? 0)}`}
            </Boton>
          }
        >
          <TecladoPrecio centavos={teclado ?? 0} onCambio={setTeclado} />
          <p className="nu-nota" aria-live="polite">{teclado ? [textoDiferencia(teclado, sugerido), 'recibís el 100 %'].filter(Boolean).join(' · ') : 'Escribí el monto con los números de abajo.'}</p>
          <div className="ui-atajos" role="group" aria-label="Ajustar el precio">
            <button type="button" className="ui-atajo" onClick={() => setTeclado((t) => moverCinta(t ?? 0, -2))}>
              − $ 1.000
            </button>
            <button type="button" className="ui-atajo" onClick={() => setTeclado((t) => redondearMil(t ?? 0))}>
              Redondear
            </button>
            <button type="button" className="ui-atajo" onClick={() => setTeclado((t) => moverCinta(t ?? 0, 2))}>
              + $ 1.000
            </button>
          </div>
        </Hoja>
      </PantallaSecundaria>
    );
  }

  // Paso 2: cuándo vas.
  const fechaTexto = nombreDia(fecha, hoy);
  const diaSemana = new Intl.DateTimeFormat('es-AR', { weekday: 'long', timeZone: 'UTC' }).format(new Date(`${fecha}T12:00:00Z`));
  const encabezadoDia = ((t: string) => t.charAt(0).toUpperCase() + t.slice(1))(`${fechaTexto === 'hoy' ? 'hoy, ' : fechaTexto === 'mañana' ? 'mañana, ' : ''}${diaSemana} ${Number(fecha.slice(8))}`);
  const ocupadoTexto = ocupado.length ? `Ese día ya tenés trabajo ${ocupado.map((o) => textoFranja(o.desde, o.hasta)).join(' y ')}. ` : '';
  return (
    <PantallaSecundaria
      barra={<BarraCompacta titulo="¿Cuándo vas?" subtitulo="Paso 2 de 2" onVolver={() => setPaso('precio')} />}
      accion={
        <AccionFija>
          <Boton disabled={!horario} onClick={() => setRevisar(true)}>
            Revisar la propuesta
          </Boton>
        </AccionFija>
      }
    >
      {pidio ? (
        <p className="nu-pidio">
          <Chip icono="reloj">{`${base ? 'El cliente propuso' : 'El cliente pidió'}: ${textoHorario(pidio, hoy).toLowerCase()}`}</Chip>
        </p>
      ) : (
        <p className="nu-pidio">
          <Chip icono="reloj">{v.tipo === 'urgente' ? 'Es urgente: proponé cuándo podés ir' : 'El cliente no pidió un horario'}</Chip>
        </p>
      )}
      {inicialCliente ? (
        <Segmento<'cliente' | 'otro'>
          etiqueta="¿Vas en el horario que pidió el cliente?"
          valor={usaCliente ? 'cliente' : 'otro'}
          onCambio={(x) => {
            if (x === 'cliente') {
              setHorario(inicialCliente);
              setFecha(inicialCliente.fecha);
            } else setHorario(null);
          }}
          opciones={[
            { valor: 'cliente', texto: 'Voy en ese horario' },
            { valor: 'otro', texto: 'Propongo otro' },
          ]}
        />
      ) : null}
      {!usaCliente ? (
        <>
          <div className="nu-calendario">
            <Calendario
              anio={mes.anio}
              mes={mes.mes}
              hoy={hoy}
              valor={fecha}
              conTrabajo={conTrabajo}
              onMes={(anio, m) => setMes({ anio, mes: m })}
              onElegir={(f) => {
                setFecha(f);
                setHorario(null);
              }}
            />
          </div>
          <fieldset className="nu-franjas">
            <legend>{`${encabezadoDia} · elegí la franja`}</legend>
            <div className="ui-atajos">
              {FRANJAS_DIA.map((f) => {
                const no = franjaNoDisponible(f, fecha, hoy, ahoraMin, ocupado);
                const on = elegido?.fuente === 'franja' && elegido.desde === f.desde && elegido.hasta === f.hasta;
                return (
                  <button key={f.desde} type="button" className="ui-atajo" aria-pressed={on} disabled={no !== null} onClick={() => setHorario({ fecha, desde: f.desde, hasta: f.hasta, fuente: 'franja' })}>
                    {`${f.desde / 60} a ${f.hasta / 60}`}
                    {no ? <span className="visualmente-oculto">{no === 'pasada' ? ', ya pasó' : ', ya tenés trabajo'}</span> : null}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <button type="button" className="nu-medida" onClick={() => setMedida({ modo: 'franja', desde: elegido?.desde ?? 6 * 60 + 15, hasta: elegido?.hasta ?? 8 * 60 })}>
            <Icono nombre="reloj" /> Otro horario o una hora exacta
          </button>
          {horario?.fuente === 'medida' && textoElegido ? (
            <p className="nu-pidio">
              <Chip tono="azul" icono="check">{`Tu horario: ${textoElegido.toLowerCase()}`}</Chip>
            </p>
          ) : null}
        </>
      ) : null}
      <p className="nu-nota">{`${ocupadoTexto}Es una propuesta: el cliente la acepta o elige otra.`}</p>

      <Hoja
        abierta={medida !== null}
        titulo={`${encabezadoDia} · tu horario`}
        onCerrar={() => setMedida(null)}
        pie={
          medida ? (
            <Boton
              disabled={!horarioValido(medida.desde, medida.modo === 'franja' ? medida.hasta : null) || (fecha === hoy && medida.desde <= ahoraMin)}
              onClick={() => {
                setHorario({ fecha, desde: medida.desde, hasta: medida.modo === 'franja' ? medida.hasta : null, fuente: 'medida' });
                setMedida(null);
              }}
            >
              {medida.modo === 'franja' ? `Proponer de ${horaConMinutos(medida.desde)} a ${horaConMinutos(medida.hasta)}` : `Proponer a las ${horaConMinutos(medida.desde)}`}
            </Boton>
          ) : undefined
        }
      >
        {medida ? (
          <>
            <Segmento<'franja' | 'exacta'>
              etiqueta="Tipo de horario"
              valor={medida.modo}
              onCambio={(modo) => setMedida({ ...medida, modo })}
              opciones={[
                { valor: 'franja', texto: 'Una franja' },
                { valor: 'exacta', texto: 'Hora exacta' },
              ]}
            />
            <div className={`nu-ruedas${medida.modo === 'exacta' ? ' nu-ruedas--una' : ''}`}>
              <div>
                <Etiqueta>{medida.modo === 'franja' ? 'Desde' : 'A las'}</Etiqueta>
                <RuedaHora key={`d${vueltaRuedas}${medida.modo}`} etiqueta={medida.modo === 'franja' ? 'Desde' : 'Hora'} opciones={opcionesRueda()} valor={medida.desde} onCambio={(m) => setMedida({ ...medida, desde: m, hasta: Math.max(medida.hasta, m + 60) })} />
              </div>
              {medida.modo === 'franja' ? (
                <div>
                  <Etiqueta>Hasta</Etiqueta>
                  <RuedaHora key={`h${vueltaRuedas}`} etiqueta="Hasta" opciones={opcionesRueda()} valor={medida.hasta} onCambio={(m) => setMedida({ ...medida, hasta: m })} />
                </div>
              ) : null}
            </div>
            <div className="ui-atajos" role="group" aria-label="Horarios comunes">
              {ATAJOS_HORARIO.map((a) => (
                <button
                  key={a.texto}
                  type="button"
                  className="ui-atajo"
                  aria-pressed={medida.desde === a.desde && (a.hasta === null ? medida.modo === 'exacta' : medida.modo === 'franja' && medida.hasta === a.hasta)}
                  onClick={() => setMedida({ modo: a.hasta === null ? 'exacta' : 'franja', desde: a.desde, hasta: a.hasta ?? a.desde + 60 })}
                >
                  {a.texto}
                </button>
              ))}
            </div>
            {!horarioValido(medida.desde, medida.modo === 'franja' ? medida.hasta : null) ? <p className="nu-nota nu-nota--error">«Hasta» tiene que ser después de «Desde».</p> : null}
            {fecha === hoy && medida.desde <= ahoraMin ? <p className="nu-nota nu-nota--error">Esa hora ya pasó. Elegí una más tarde.</p> : null}
            <p className="nu-nota">Es tu propuesta: el cliente la acepta o elige otra. Fuera de horario no hay recargo automático; si querés cobrar más, lo ponés vos en el precio.</p>
          </>
        ) : null}
      </Hoja>

      <Hoja
        abierta={revisar}
        titulo="Revisá antes de enviar"
        onCerrar={() => setRevisar(false)}
        pie={
          <div className="nu-pie-columna">
            <Boton ocupado={envio.pendiente} textoOcupado="Enviando…" onClick={() => void enviar()}>
              {`Enviar propuesta de ${textoCifra(precio)}`}
            </Boton>
            <Boton variante="texto" onClick={() => setRevisar(false)}>
              Cambiar algo
            </Boton>
          </div>
        }
      >
        <Titulo antes="Tu " marcado="propuesta" nivel={2} tam="medio" />
        <Tarjeta>
          <FilaIcono icono="billete" titulo={textoCifra(precio)} detalle={`${materiales ? 'Incluye materiales' : 'Materiales aparte'}${garantia ? ` · garantía de ${GARANTIA_DIAS_DEFECTO} días` : ''} · recibís el 100 %`} />
          <FilaIcono icono="agenda" titulo={textoElegido ?? 'Sin horario'} detalle={pidio && !usaCliente ? `Otro horario: el cliente había pedido ${textoHorario(pidio, hoy).toLowerCase()}` : pidio ? 'El horario que pidió el cliente' : 'Tu propuesta de horario'} />
          <FilaIcono icono="pin" titulo={`${v.zona} · zona aproximada`} detalle={v.titulo} borde={false} />
        </Tarjeta>
        <p className="nu-nota">El cliente puede aceptarla, pedirte otro precio o elegir otro día. Hasta que acepte, no es un trabajo agendado.</p>
        {envio.fallo ? <ErrorCaja fallo={envio.fallo} onReintentar={() => void enviar()} /> : null}
        {envio.fallo?.tipo === 'conflicto' ? (
          <p className="nu-nota">
            <Link href={`${RUTAS.pedido.ruta}?id=${pedido.id}`}>Ver cómo está el pedido</Link>
          </p>
        ) : null}
      </Hoja>
    </PantallaSecundaria>
  );
}

