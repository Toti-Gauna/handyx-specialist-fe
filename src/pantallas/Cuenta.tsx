'use client';
// Cuenta (lote 4.8): el perfil con las iniciales y la insignia de verificado (solo si lo dice el servidor), el contador
// del fee y las filas a datos personales, rubros y zonas, cómo te paga el cliente, caja, notificaciones, centro de
// ayuda y privacidad y baja.
import { api } from '@handyx/origen-datos';
import { useRouter } from 'next/navigation';
import { RUTAS } from '../app/rutas.ts';
import { Cargando, ErrorCaja } from '../components/Estados.tsx';
import { ContadorFee } from '../components/FeeAviso.tsx';
import { usePerfil } from '../components/GuardiaApp.tsx';
import { Icono } from '../components/Icono.tsx';
import { Chip, ChipTexto } from '../components/ui.tsx';
import { NOMBRE_RUBRO } from '../contracts/rubros.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { ALTA } from '../lib/etiquetas.ts';
import { Avatar, Fila } from '../kit/Piezas.tsx';
import './cuenta/cuenta.css';

export function Cuenta() {
  const router = useRouter();
  const { perfil } = usePerfil();
  const fee = useCarga(() => api.feeVigente(), []);
  const publico = useCarga(() => api.perfilPublico(), []);
  const salida = useAccion();
  const nombre = [perfil.nombre, perfil.apellido].filter(Boolean).join(' ') || 'Tu cuenta';
  // El sello lo decide el servidor: mientras no responde, no se muestra.
  const verificado = publico.datos?.verificado === true;

  // El sello, los rubros y el contador del fee llegan juntos: la pantalla se muestra entera de una vez, sin empujar
  // las filas hacia abajo mientras carga (CLS).
  if ((!fee.datos && !fee.fallo) || (!publico.datos && !publico.fallo)) return <Cargando />;

  async function salir() {
    await salida.ejecutar(() => api.salir());
    router.replace(RUTAS.acceso.ruta);
  }

  return (
    <div className="pila ct">
      <h1 className="visualmente-oculto">Cuenta</h1>
      <section className="ct-perfil" aria-label="Tu perfil">
        <Avatar nombre={nombre} tamano="grande" verificado={verificado} />
        <p className="hx-titulo ct-perfil__nombre">{nombre}</p>
        <p className="ct-perfil__email">{perfil.email}</p>
        {publico.datos && publico.datos.rubrosHabilitados.length > 0 ? (
          <ul className="hx-chips ct-perfil__rubros" aria-label="Rubros habilitados">
            {publico.datos.rubrosHabilitados.map((r) => (
              <li key={r}>
                <ChipTexto tono="azul">{NOMBRE_RUBRO[r]}</ChipTexto>
              </li>
            ))}
          </ul>
        ) : null}
        {verificado ? (
          <ChipTexto tono="exito" icono="verificado">
            Verificado por Handyx
          </ChipTexto>
        ) : (
          <Chip e={ALTA[perfil.estadoAlta]} />
        )}
      </section>

      {fee.fallo && !fee.datos ? <ErrorCaja fallo={fee.fallo} onReintentar={() => void fee.recargar()} /> : null}
      {fee.datos?.politica ? <ContadorFee politica={fee.datos.politica} /> : null}

      <section aria-labelledby="ct-tu-cuenta">
        <h2 id="ct-tu-cuenta" className="ct-etiqueta">
          Tu cuenta
        </h2>
        <div className="ct-grupo">
          <Fila icono="usuario" titulo="Datos personales" detalle="Nombre, email y lo que cargaste en el alta" href={RUTAS.cuentaDatos.ruta} />
          <Fila icono="maletin" titulo="Rubros y zonas" detalle="Cobertura, días y horarios" href={RUTAS.disponibilidad.ruta} />
          <Fila icono="billetera" titulo="Cómo te paga el cliente" detalle="Mercado Pago o efectivo, directo a vos" href={RUTAS.cuentaCobros.ruta} />
          <Fila icono="caja" titulo="Caja: pagos directos" detalle="Cobros del mes y su estado" href={RUTAS.caja.ruta} />
          <Fila icono="verificado" titulo="Tu alta y tus documentos" detalle={ALTA[perfil.estadoAlta].texto} href={RUTAS.alta.ruta} />
        </div>
      </section>

      <section aria-labelledby="ct-config">
        <h2 id="ct-config" className="ct-etiqueta">
          Configuración y ayuda
        </h2>
        <div className="ct-grupo">
          <Fila icono="campana" titulo="Notificaciones" detalle="Qué avisos recibís y en qué dispositivo" href={RUTAS.cuentaNotificaciones.ruta} />
          <Fila icono="pregunta" titulo="Centro de ayuda" detalle="Preguntas frecuentes y tus casos" href={RUTAS.soporte.ruta} />
          <Fila icono="candado" titulo="Privacidad y baja" detalle="Quién ve qué, políticas y eliminar tu cuenta" href={RUTAS.cuentaPrivacidad.ruta} />
        </div>
      </section>

      {salida.fallo ? <ErrorCaja fallo={salida.fallo} /> : null}
      <button type="button" className="boton boton--fantasma boton--bloque" disabled={salida.pendiente} onClick={() => void salir()}>
        <Icono nombre="salir" /> Cerrar sesión
      </button>
    </div>
  );
}
