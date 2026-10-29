'use client';
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { RUTAS } from '../app/rutas.ts';
import { ControlDisponibilidad } from '../components/ControlDisponibilidad.tsx';
import { Cargando, ErrorCaja, Vacio } from '../components/Estados.tsx';
import { usePerfil } from '../components/GuardiaApp.tsx';
import { Icono } from '../components/Icono.tsx';
import { ModalFee } from '../components/ModalFee.tsx';
import { TarjetaPedido } from '../components/TarjetaPedido.tsx';
import { Aviso, Chip, ChipTipo, Seccion, Tarjeta } from '../components/ui.tsx';
import { NOMBRE_RUBRO } from '../contracts/rubros.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { ALTA, TRABAJO } from '../lib/etiquetas.ts';
import { fechaHora, pesos, plural } from '../lib/formato.ts';
import { tarifaTexto } from '../lib/tarifa.ts';

export function Inicio() {
  const { perfil } = usePerfil();
  const habilitada = perfil.estadoAlta === 'habilitada';
  return (
    <div className="pila">
      <ModalFee />
      <h1 className="titulo">Hola{perfil.nombre ? `, ${perfil.nombre}` : ''}</h1>
      {habilitada ? <PanelInicio /> : <SinHabilitar />}
    </div>
  );
}

function SinHabilitar() {
  const { perfil } = usePerfil();
  const info = ALTA[perfil.estadoAlta];
  return (
    <>
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
    </>
  );
}

function PanelInicio() {
  const c = useCarga(async () => {
    const [inicio, disp, pedidos, fee] = await Promise.all([api.inicio(), api.disponibilidad(), api.pedidosElegibles(), api.feeVigente()]);
    return { inicio, disp, pedidos: pedidos.items, fee };
  }, []);

  if (c.fallo && !c.datos) return <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  const { inicio, disp, pedidos, fee } = c.datos;
  const tarifa = tarifaTexto(fee.politica, api.ahora());
  const abiertos = pedidos.filter((p) => p.estado === 'buscando').slice(0, 2);

  return (
    <>
      {c.fallo ? <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} /> : null}
      <Tarjeta>
        <p className="tarjeta__titulo">
          <Icono nombre="reloj" /> Tu disponibilidad
        </p>
        <ControlDisponibilidad disp={disp} bloqueado={false} alCambiar={() => c.recargar()} />
        <Link href={RUTAS.disponibilidad.ruta}>Cobertura, días y horarios</Link>
      </Tarjeta>

      <Seccion titulo="Pedidos para vos" accion={<Link href={RUTAS.pedidos.ruta}>Ver todos</Link>}>
        {abiertos.length === 0 ? (
          <Vacio icono="lupa" titulo="No hay pedidos abiertos ahora">
            {disp.urgentesAhora || disp.programados ? 'Cuando llegue uno de tus rubros y zonas, te avisamos.' : 'Tenés los pedidos apagados. Activalos arriba para empezar a ver ofertas.'}
          </Vacio>
        ) : (
          <ul className="lista-tarjetas">
            {abiertos.map((p) => (
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
      </Seccion>

      <Seccion titulo={inicio.proximoTrabajo && inicio.proximoTrabajo.estado !== 'agendado' ? 'Tu trabajo en curso' : 'Tu próximo trabajo'} accion={<Link href={RUTAS.agenda.ruta}>Agenda</Link>}>
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
      </Seccion>

      <Seccion titulo="Lo cobrado este mes" accion={<Link href={RUTAS.caja.ruta}>Caja</Link>}>
        <Tarjeta tono="gris">
          <p className="monto">{pesos(inicio.cobradoMes)}</p>
          <p className="texto-suave">{plural(inicio.trabajosCobrados, 'trabajo cobrado y verificado', 'trabajos cobrados y verificados')}.</p>
          <p className="texto-suave texto-chico">Es plata que te pagaron directamente a vos. Handyx no guarda ni te transfiere dinero.</p>
        </Tarjeta>
      </Seccion>

      {inicio.avisosSinLeer > 0 ? (
        <Link className="tarjeta tarjeta--amarillo" href={RUTAS.notificaciones.ruta}>
          <span className="fila-flex fila-flex--entre">
            <strong>
              <Icono nombre="campana" className="icono icono--chico" /> Tenés {plural(inicio.avisosSinLeer, 'aviso sin leer', 'avisos sin leer')}
            </strong>
            <Icono nombre="derecha" />
          </span>
        </Link>
      ) : null}
    </>
  );
}
