'use client';
// Inicio sobre el mapa (lote 4.5): bloque azul con el saludo y el interruptor grande "Disponible" (urgentes ahora), el
// mapa con tus zonas y los pedidos abiertos (zonas aproximadas), y una hoja con los pedidos para vos, tu próximo trabajo y
// lo cobrado del mes. Nunca tasas de aceptación, tiempos de respuesta ni puntualidad (PROD-06 §3).
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { RUTAS } from '../app/rutas.ts';
import { Cargando, ErrorCaja, Vacio } from '../components/Estados.tsx';
import { usePerfil } from '../components/GuardiaApp.tsx';
import { Icono } from '../components/Icono.tsx';
import { ModalFee } from '../components/ModalFee.tsx';
import { PedidoEntrante } from '../components/PedidoEntrante.tsx';
import { TarjetaPedido } from '../components/TarjetaPedido.tsx';
import { Aviso, Chip, ChipTipo, Interruptor, Tarjeta } from '../components/ui.tsx';
import type { Disponibilidad, ZonaMapa } from '../contracts/dto.ts';
import { NOMBRE_RUBRO } from '../contracts/rubros.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { ALTA, TRABAJO } from '../lib/etiquetas.ts';
import { fechaHora, pesos, plural } from '../lib/formato.ts';
import { tarifaTexto } from '../lib/tarifa.ts';
import { Mapa } from '../mapa/Mapa.tsx';
import './inicio.css';

export function Inicio() {
  const { perfil } = usePerfil();
  return perfil.estadoAlta === 'habilitada' ? <PanelInicio nombre={perfil.nombre} /> : <SinHabilitar />;
}

function SinHabilitar() {
  const { perfil } = usePerfil();
  const info = ALTA[perfil.estadoAlta];
  return (
    <div className="pila">
      <h1 className="titulo">Hola{perfil.nombre ? `, ${perfil.nombre}` : ''}</h1>
      <Tarjeta tono="azul">
        <p className="tarjeta__titulo">
          <Icono nombre={info.icono} /> {info.texto}
        </p>
        <p>{info.detalle}</p>
        <Link className="boton boton--amarillo boton--bloque" href={RUTAS.alta.ruta}>
          {perfil.estadoAlta === 'borrador' || perfil.estadoAlta === 'requiere_correccion' ? 'Seguir con mi alta' : 'Ver el estado de mi alta'}
        </Link>
      </Tarjeta>
      <Aviso tono="neutro" icono="info">
        Todavía no recibís pedidos: se habilitan cuando Operations revisa tu alta. No recibís pedidos por haber creado la cuenta.
      </Aviso>
    </div>
  );
}

function PanelInicio({ nombre }: { nombre: string | null }) {
  const c = useCarga(async () => {
    const [inicio, disp, pedidos, fee, barrios] = await Promise.all([api.inicio(), api.disponibilidad(), api.pedidosElegibles(), api.feeVigente(), api.barrios()]);
    return { inicio, disp, pedidos: pedidos.items, fee, barrios };
  }, []);
  const cambio = useAccion();

  if (c.fallo && !c.datos) return <ErrorCaja pantalla fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  const { inicio, disp, pedidos, fee, barrios } = c.datos;
  const tarifa = tarifaTexto(fee.politica, api.ahora());
  const abiertos = pedidos.filter((p) => p.estado === 'buscando');
  const misBarrios = barrios.filter((b) => disp.zonas.includes(b.id));
  const zonas = abiertos.map((p) => p.zonaMapa).filter((z): z is ZonaMapa => z !== null);

  async function cambiar(parcial: Partial<Pick<Disponibilidad, 'urgentesAhora' | 'programados'>>) {
    // El refresco va dentro de la acción: hasta tener la versión nueva el interruptor sigue deshabilitado.
    await cambio.ejecutar(async () => {
      await api.actualizarDisponibilidad({ urgentesAhora: parcial.urgentesAhora ?? disp.urgentesAhora, programados: parcial.programados ?? disp.programados, version: disp.version });
      await c.recargar();
    });
  }

  return (
    <div className="in">
      <ModalFee />
      <section className={`in-hero${disp.urgentesAhora ? ' in-hero--on' : ''}`} aria-labelledby="in-hola">
        <h1 id="in-hola" className="hx-titulo in-hero__hola">
          Hola{nombre ? `, ${nombre}` : ''}
        </h1>
        <button
          type="button"
          role="switch"
          aria-checked={disp.urgentesAhora}
          aria-describedby="in-disponible-d"
          className="in-disponible"
          disabled={cambio.pendiente}
          onClick={() => void cambiar({ urgentesAhora: !disp.urgentesAhora })}
        >
          <span className="in-disponible__texto">
            <strong>{disp.urgentesAhora ? 'Disponible' : 'No disponible'}</strong>
            <span>Pedidos urgentes ahora</span>
          </span>
          <span className="in-disponible__perilla" aria-hidden="true" />
        </button>
        <p id="in-disponible-d" className="in-hero__nota">
          {disp.urgentesAhora
            ? 'Te ofrecemos urgentes de tus rubros y zonas. Apagalo cuando quieras: no tiene ninguna consecuencia.'
            : 'No te ofrecemos urgentes. Prendelo cuando puedas salir: elegís vos qué pedidos tomar.'}
        </p>
      </section>
      {cambio.fallo ? <ErrorCaja fallo={cambio.fallo} /> : null}
      {c.fallo ? <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} /> : null}

      <Mapa
        etiqueta="Tus zonas y los pedidos abiertos (zonas aproximadas)"
        alto="grande"
        cobertura={misBarrios}
        zonas={zonas}
        radar={disp.urgentesAhora ? (misBarrios[0]?.centro ?? null) : null}
        encuadre={`${misBarrios.map((b) => b.id).join('|')}-${zonas.length}`}
        alternativa={<p>{misBarrios.length ? `Tus zonas: ${misBarrios.map((b) => b.nombre).join(', ')}` : 'Todavía no elegiste zonas'}</p>}
      />

      <div className="in-hoja">
        <Interruptor
          etiqueta="Pedidos programados y obras"
          descripcion={disp.programados ? 'Encendido: ves pedidos para otro día y visitas de presupuesto.' : 'Apagado: no te ofrecemos pedidos programados ni obras.'}
          activo={disp.programados}
          deshabilitado={cambio.pendiente}
          onCambio={(v) => void cambiar({ programados: v })}
        />
        <Link className="in-enlace" href={RUTAS.disponibilidad.ruta}>
          Cobertura, días y horarios
        </Link>

        <section aria-labelledby="in-pedidos">
          <div className="in-seccion">
            <h2 id="in-pedidos">Pedidos para vos</h2>
            <Link href={RUTAS.pedidos.ruta}>Ver todos</Link>
          </div>
          {abiertos.length === 0 ? (
            <Vacio icono="lupa" titulo="No hay pedidos abiertos ahora">
              {disp.urgentesAhora || disp.programados ? 'Cuando llegue uno de tus rubros y zonas, te avisamos.' : 'Tenés los pedidos apagados. Prendé "Disponible" o los programados para empezar a ver ofertas.'}
            </Vacio>
          ) : (
            <ul className="lista-tarjetas">
              {abiertos.slice(0, 2).map((p) => (
                <li key={p.id}>
                  <TarjetaPedido pedido={p} />
                </li>
              ))}
            </ul>
          )}
          <p className="texto-suave texto-chico">
            {plural(inicio.pedidosAbiertos, 'pedido abierto', 'pedidos abiertos')} · {plural(inicio.urgentesAbiertos, 'urgente', 'urgentes')} ·{' '}
            {plural(inicio.propuestasPendientes, 'propuesta espera', 'propuestas esperan')} tu respuesta
          </p>
          {tarifa ? <p className="texto-suave texto-chico">{tarifa}</p> : null}
        </section>

        <section aria-labelledby="in-proximo">
          <div className="in-seccion">
            <h2 id="in-proximo">{inicio.proximoTrabajo && inicio.proximoTrabajo.estado !== 'agendado' ? 'Tu trabajo en curso' : 'Tu próximo trabajo'}</h2>
            <Link href={RUTAS.agenda.ruta}>Agenda</Link>
          </div>
          {inicio.proximoTrabajo ? (
            <Link className="tarjeta" href={`${RUTAS.trabajo.ruta}?id=${inicio.proximoTrabajo.id}`}>
              <div className="fila-flex fila-flex--entre">
                <ChipTipo tipo={inicio.proximoTrabajo.tipo} />
                <Chip e={TRABAJO[inicio.proximoTrabajo.estado]} />
              </div>
              <p className="pedido__titulo">{NOMBRE_RUBRO[inicio.proximoTrabajo.rubro]}</p>
              <div className="fila-flex fila-flex--entre">
                <span className="texto-suave">{fechaHora(inicio.proximoTrabajo.acuerdo.horario.inicio)}</span>
                <span className="monto monto--chico">{pesos(inicio.proximoTrabajo.acuerdo.monto)}</span>
              </div>
            </Link>
          ) : (
            <Vacio icono="calendario" titulo="No tenés trabajos agendados" />
          )}
        </section>

        <ul className="in-mosaicos">
          <li>
            <Link className="in-mosaico" href={RUTAS.caja.ruta}>
              <span className="in-mosaico__dato">{pesos(inicio.cobradoMes)}</span>
              <span>Cobrado este mes</span>
              <small>{plural(inicio.trabajosCobrados, 'trabajo verificado', 'trabajos verificados')} · directo a vos</small>
            </Link>
          </li>
          <li>
            <Link className="in-mosaico" href={RUTAS.notificaciones.ruta}>
              <span className="in-mosaico__dato">{inicio.avisosSinLeer}</span>
              <span>{inicio.avisosSinLeer === 1 ? 'Aviso sin leer' : 'Avisos sin leer'}</span>
              <small>Ver avisos</small>
            </Link>
          </li>
        </ul>
        <p className="texto-suave texto-chico">Lo cobrado es plata que te pagaron directamente a vos. Handyx no guarda ni te transfiere dinero.</p>
      </div>

      <PedidoEntrante pedidos={abiertos} />
    </div>
  );
}
