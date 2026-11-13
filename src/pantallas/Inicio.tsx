'use client';
// Inicio (F-Inicio y F-InicioDia, lote 1.3): el mapa de arreglos siempre detrás, la cabecera azul con el único
// Disponible, los pedidos que llegan flotando sobre el mapa y, abajo, los pedidos cercanos como las opciones de viaje de
// Uber. Si tenés trabajos hoy, abajo va tu día (la próxima parada, escribirle, avisar una demora y salir). Tocar un
// pedido abre su detalle en una hoja: nada se acepta desde el mapa. Zona aproximada siempre y sin tiempos de llegada
// prometidos. Nunca tasas de aceptación, tiempos de respuesta ni puntualidad.
import { api } from '@handyx/origen-datos';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { usePerfil } from '../components/GuardiaApp.tsx';
import { ErrorCaja } from '../components/Estados.tsx';
import { NOMBRE_RUBRO } from '../contracts/rubros.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { useAhora } from '../hooks/useAhora.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { useIsla } from '../kit/Efectos.tsx';
import { diaLocal } from '../lib/formato.ts';
import { Boton, BotonEnlace } from '../ui/atomos/Boton.tsx';
import { Titulo } from '../ui/atomos/Texto.tsx';
import { BarraPestanas } from '../ui/organismos/BarraPestanas.tsx';
import { CabeceraAzul } from '../ui/organismos/Cabeceras.tsx';
import { Hoja } from '../ui/organismos/Hoja.tsx';
import { MapaArreglos } from '../ui/organismos/MapaArreglos.tsx';
import { HojaCercanos, PedidoFlotante } from '../ui/organismos/PedidosCercanos.tsx';
import { Tarjeta } from '../ui/moleculas/Tarjeta.tsx';
import { AccionesPedido, ContenidoPedido } from './nucleo/DetallePedido.tsx';
import { PantallaFallo } from './nucleo/Fallo.tsx';
import { useEventosMapa, useUbicacionUnaVez } from './nucleo/hooks.ts';
import { TarjetaDia } from './nucleo/TarjetaDia.tsx';
import { aPedidoCercano, aPedidoMapa, vistaDesdeMapa } from './nucleo/vista.ts';
import './nucleo/nucleo.css';

const TEXTO_ALTA: Record<string, { titulo: string; texto: string; boton: string }> = {
  borrador: { titulo: 'Terminá tu alta', texto: 'Todavía no recibís pedidos. Cuando el equipo de verificación revise tu alta, vas a ver los pedidos de tus zonas en el mapa.', boton: 'Seguir con mi alta' },
  requiere_correccion: { titulo: 'Tu alta necesita un cambio', texto: 'Todavía no recibís pedidos. Corregí lo que te pedimos y la volvemos a revisar.', boton: 'Ver qué corregir' },
};

export function Inicio() {
  const { perfil } = usePerfil();
  return perfil.estadoAlta === 'habilitada' ? <InicioMapa /> : <SinHabilitar estado={perfil.estadoAlta} />;
}

function SinHabilitar({ estado }: { estado: string }) {
  const t = TEXTO_ALTA[estado] ?? { titulo: 'Estamos revisando tu alta', texto: 'Todavía no recibís pedidos: se habilitan cuando el equipo de verificación revisa tu alta. No tenés que hacer nada más por ahora.', boton: 'Ver el estado de mi alta' };
  return (
    <div className="nu-inicio nu-inicio--sin">
      <CabeceraAzul hrefAvisos={RUTAS.notificaciones.ruta} hrefZonas={RUTAS.disponibilidad.ruta} disponible={null} onDisponible={() => undefined} />
      <div className="nu-inicio__sin">
        <Tarjeta>
          <Titulo nivel={1} tam="medio" antes={t.titulo} />
          <p>{t.texto}</p>
          <BotonEnlace href={RUTAS.alta.ruta}>{t.boton}</BotonEnlace>
        </Tarjeta>
      </div>
      <BarraPestanas />
    </div>
  );
}

function InicioMapa() {
  const router = useRouter();
  const isla = useIsla();
  const ahora = useAhora(1000);
  const hoy = diaLocal(ahora.toISOString());
  const yo = useUbicacionUnaVez();
  const cambio = useAccion();
  const salir = useAccion();
  const descarte = useAccion();

  const base = useCarga(async () => {
    const [disp, inicio, dia] = await Promise.all([api.disponibilidad(), api.inicio(), api.dia()]);
    return { disp, inicio, dia };
  }, []);
  const desde = yo.lectura;
  // «Me voy hasta…»: con un destino elegido, el servidor trae los pedidos de ese lado y los del camino (también fuera de
  // tus zonas). Si la lista de destinos no llega, el mapa usa la del kit y filtra con lo que ya tiene.
  const destinos = useCarga(() => api.mapaDestinos(), []);
  const [destino, setDestino] = useState<string | null>(null);
  const mapa = useCarga(() => api.mapaPedidos({ referencia: destino ? { tipo: 'destino', destinoId: destino } : { tipo: 'mis_zonas' }, desde }), [destino, desde?.punto.lat, desde?.punto.lng], { cadaMs: 20_000 });
  useEventosMapa(!!base.datos?.disp.urgentesAhora || !!base.datos?.disp.programados, () => void mapa.recargar());

  // Pedidos que llegan: los urgentes que ya estaban al abrir y todo lo nuevo que aparezca después flotan sobre el mapa.
  const vistos = useRef<Set<string> | null>(null);
  const [entrantes, setEntrantes] = useState<string[]>([]);
  const [indice, setIndice] = useState(0);
  useEffect(() => {
    const lista = mapa.datos?.pedidos;
    if (!lista) return;
    const abiertos = lista.filter((p) => p.miPropuesta === null);
    if (vistos.current === null) {
      vistos.current = new Set(lista.map((p) => p.id));
      setEntrantes(abiertos.filter((p) => p.tipo === 'urgente').map((p) => p.id));
      return;
    }
    const nuevos = abiertos.filter((p) => !vistos.current?.has(p.id)).map((p) => p.id);
    for (const p of lista) vistos.current.add(p.id);
    const ids = new Set(lista.map((p) => p.id));
    setEntrantes((e) => [...nuevos, ...e.filter((x) => ids.has(x) && !nuevos.includes(x))]);
    if (nuevos.length) setIndice(0);
  }, [mapa.datos]);

  const [elegido, setElegido] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<string | null>(null);
  /** Cambiar de destino es otra búsqueda: lo que aparezca no «acaba de llegar», así que se vuelve a empezar la cuenta. */
  function elegirDestino(id: string | null) {
    vistos.current = null;
    setEntrantes([]);
    setElegido(null);
    setDestino(id);
  }
  const [verPedidos, setVerPedidos] = useState(false);
  const det = useCarga(() => (detalle ? api.mapaPedido(detalle) : Promise.resolve(null)), [detalle]);

  // Lo que la cabecera necesita para la conversación de la próxima parada (escribirle).
  const proxima = base.datos?.dia.paradas.find((p) => p.estado === 'proxima') ?? null;
  const trabajoProximo = useCarga(() => (proxima?.turno.trabajoId ? api.trabajo(proxima.turno.trabajoId) : Promise.resolve(null)), [proxima?.turno.trabajoId]);

  const pedidos = useMemo(() => mapa.datos?.pedidos ?? [], [mapa.datos]);
  const nuevosSet = useMemo(() => new Set(entrantes), [entrantes]);
  const cercanos = useMemo(() => pedidos.map((p) => aPedidoCercano(p, ahora, hoy)), [pedidos, ahora, hoy]);
  const flotantes = cercanos.filter((p) => nuevosSet.has(p.id));

  if (base.fallo && !base.datos) return <PantallaFallo fallo={base.fallo} onReintentar={() => void base.recargar()} />;
  if (!base.datos) return <div className="nu-inicio nu-inicio--cargando" aria-busy="true" />;
  const { disp, inicio, dia } = base.datos;
  const hayDia = dia.paradas.some((p) => p.estado !== 'hecha');
  const recibe = disp.urgentesAhora || disp.programados;

  async function cambiarDisponible(v: boolean) {
    await cambio.ejecutar(async () => {
      await api.actualizarDisponibilidad({ urgentesAhora: v, programados: disp.programados, version: disp.version });
      await base.recargar();
      await mapa.recargar();
    });
  }

  async function salirAhora(trabajoId: string) {
    const t = trabajoProximo.datos?.trabajo;
    if (!t || t.id !== trabajoId) return;
    const r = await salir.ejecutar(async () => {
      await api.avanzarTrabajo(t.id, 'en_camino', t.version, salir.clave());
    });
    if (r.ok) router.push(`${RUTAS.enCamino.ruta}?id=${t.id}`);
    else if (r.fallo.tipo === 'conflicto') {
      salir.nueva();
      await trabajoProximo.recargar();
    }
  }

  async function ahoraNo(id: string) {
    const r = await descarte.ejecutar(async () => {
      await api.descartarPedido(id);
      await mapa.recargar();
    });
    if (r.ok) {
      setDetalle(null);
      setEntrantes((e) => e.filter((x) => x !== id));
      isla({ titulo: 'Lo sacamos de tu mapa', texto: 'No tiene ninguna consecuencia.', icono: 'check' });
    }
  }

  const abrir = (id: string) => {
    setElegido(id);
    setDetalle(id);
  };
  const titulo = recibe ? (pedidos.length === 0 ? 'Todavía no hay pedidos cerca' : `${pedidos.length} ${pedidos.length === 1 ? 'pedido cerca' : 'pedidos cerca'}`) : 'Estás sin recibir pedidos';
  const vacio = recibe ? 'Cuando llegue uno de tus rubros y zonas, aparece en el mapa.' : 'Prendé «Disponible» para que te lleguen los urgentes de tus zonas.';
  const medir =
    yo.estado === 'lista' ? null : (
      <p className="nu-inicio__medir">
        {yo.estado === 'sin_permiso' ? (
          'Sin permiso de ubicación: las distancias no se muestran. Las zonas son aproximadas igual.'
        ) : yo.estado === 'no_disponible' ? (
          'Tu teléfono no dio la ubicación. Las zonas son aproximadas igual.'
        ) : (
          <Boton variante="texto" bloque={false} chico icono="pin" ocupado={yo.estado === 'buscando'} textoOcupado="Buscando dónde estás…" onClick={yo.pedir}>
            Medir distancias desde donde estoy
          </Boton>
        )}
      </p>
    );

  const vistaDetalle = det.datos ? vistaDesdeMapa(det.datos) : null;
  let abajo: ReactNode;
  if (flotantes.length > 0) {
    abajo = <PedidoFlotante pedidos={flotantes} indice={Math.min(indice, flotantes.length - 1)} onIndice={setIndice} onVer={abrir} onCerrar={() => setEntrantes([])} />;
  } else if (hayDia && !verPedidos) {
    abajo = (
      <>
        <Boton variante="contorno" bloque={false} chico icono="lupa" onClick={() => setVerPedidos(true)}>
          {pedidos.length ? `Ver ${pedidos.length} ${pedidos.length === 1 ? 'pedido' : 'pedidos'} cerca` : 'Ver pedidos cerca'}
        </Boton>
        <TarjetaDia
          dia={dia}
          ahora={ahora}
          conversacionId={trabajoProximo.datos?.trabajo.conversacionId ?? null}
          ocupado={salir.pendiente}
          onSalir={(id) => void salirAhora(id)}
          falloSalir={salir.fallo ? <ErrorCaja fallo={salir.fallo} /> : null}
        />
      </>
    );
  } else {
    abajo = (
      <>
        {hayDia ? (
          <Boton variante="contorno" bloque={false} chico icono="agenda" onClick={() => setVerPedidos(false)}>
            Volver a tu día
          </Boton>
        ) : null}
        <HojaCercanos pedidos={cercanos} elegido={elegido} onElegir={setElegido} onVer={abrir} titulo={titulo} vacio={vacio} extra={recibe && pedidos.length ? medir : null} />
      </>
    );
  }

  return (
    <div className="nu-inicio">
      <h1 className="visualmente-oculto">Inicio: pedidos cerca y tu día</h1>
      <CabeceraAzul
        hrefAvisos={RUTAS.notificaciones.ruta}
        hrefZonas={RUTAS.disponibilidad.ruta}
        avisosNuevos={inicio.avisosSinLeer}
        disponible={disp.urgentesAhora}
        ocupado={cambio.pendiente}
        onDisponible={(v) => void cambiarDisponible(v)}
        subtitulo={hayDia ? `Tenés ${dia.paradas.length} ${dia.paradas.length === 1 ? 'parada' : 'paradas'} hoy` : disp.urgentesAhora ? 'Te llegan pedidos de tus zonas' : 'Prendé Disponible para recibir urgentes'}
      />
      {cambio.fallo ? <ErrorCaja fallo={cambio.fallo} /> : null}
      {mapa.fallo && !mapa.datos ? <ErrorCaja fallo={mapa.fallo} onReintentar={() => void mapa.recargar()} /> : null}
      <div className="nu-inicio__mapa">
        <MapaArreglos
          pedidos={pedidos.map((p) => aPedidoMapa(p, nuevosSet))}
          yo={desde?.punto ?? null}
          elegido={elegido}
          onElegir={abrir}
          etiqueta="Mapa de pedidos cerca tuyo (zonas aproximadas)"
          {...(destinos.datos ? { destinos: destinos.datos, destino, onDestino: elegirDestino, buscandoDestino: mapa.estado === 'cargando' } : {})}
        />
      </div>
      <div className="nu-inicio__abajo">{abajo}</div>
      <BarraPestanas />

      <Hoja
        abierta={detalle !== null}
        titulo={vistaDetalle ? `Pedido de ${NOMBRE_RUBRO[vistaDetalle.rubro].toLowerCase()}` : 'Pedido'}
        onCerrar={() => setDetalle(null)}
        pie={vistaDetalle ? <AccionesPedido v={vistaDetalle} ocupado={descarte.pendiente} onAhoraNo={() => void ahoraNo(vistaDetalle.id)} /> : undefined}
      >
        {det.fallo && !det.datos ? (
          det.fallo.tipo === 'no_encontrado' ? (
            <p>Este pedido ya no está disponible: lo tomó otra persona, venció o el cliente lo canceló.</p>
          ) : (
            <ErrorCaja fallo={det.fallo} onReintentar={() => void det.recargar()} />
          )
        ) : vistaDetalle ? (
          <ContenidoPedido v={vistaDetalle} ahora={ahora} hoy={hoy} />
        ) : (
          <p role="status">Cargando el pedido…</p>
        )}
        {descarte.fallo ? <ErrorCaja fallo={descarte.fallo} /> : null}
      </Hoja>
    </div>
  );
}
